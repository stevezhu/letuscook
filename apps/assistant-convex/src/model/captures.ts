import { Id } from '#convex/_generated/dataModel.js';
import { MutationCtx, QueryCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function getNodeForEmbedding(
  ctx: QueryCtx,
  args: { nodeId: Id<'nodes'> },
) {
  const node = await ctx.db.get(args.nodeId);
  if (!node) return null;
  return {
    title: node.title,
    content: node.content,
    archivedAt: node.archivedAt,
    publishedAt: node.publishedAt,
  };
}

// 👀 Needs Verification
export async function saveEmbeddingResult(
  ctx: MutationCtx,
  args: {
    captureId: Id<'captures'>;
    agentUserId: Id<'users'>;
    title: string;
    rawContent: string;
    enrichedContent?: string;
    embedding: number[];
    ownerUserId: Id<'users'>;
    similarNodeIds: Id<'nodes'>[];
    similarNodeScores: number[];
    explicitMentionNodeIds: Id<'nodes'>[];
    organizingNodeIds?: Id<'nodes'>[];
    organizingNodeConfidences?: number[];
  },
) {
  // Guard against stale captures — if the user archived or edited the capture
  // while embedAndClassify was running, skip all work to avoid orphaned drafts.
  const capture = await ctx.db.get(args.captureId);
  if (!capture || capture.captureState !== 'processing') return;

  const now = Date.now();

  // Build searchText: include title + rawContent, and append enrichedContent
  // if it differs from rawContent (e.g. link metadata title + description + snippet)
  const searchTextParts = [`${args.title}\n\n${args.rawContent}`];
  if (args.enrichedContent && args.enrichedContent !== args.rawContent) {
    searchTextParts.push(args.enrichedContent);
  }
  const searchText = searchTextParts.join('\n\n');

  // 1. Create draft node with embedding
  const draftNodeId = await ctx.db.insert('nodes', {
    title: args.title,
    content: args.rawContent,
    searchText,
    ownerUserId: args.ownerUserId,
    sourceCaptureId: args.captureId,
    embedding: args.embedding,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Create edges to similar nodes with confidence scores
  await Promise.all(
    args.similarNodeIds.map((nodeId, i) =>
      ctx.db.insert('edges', {
        fromNodeId: draftNodeId,
        toNodeId: nodeId,
        edgeType: 'suggested',
        source: 'processor',
        verified: false,
        confidence: args.similarNodeScores[i],
        createdAt: now,
      }),
    ),
  );

  // 3. Create edges from explicit mentions
  await Promise.all(
    args.explicitMentionNodeIds.map((nodeId) =>
      ctx.db.insert('edges', {
        fromNodeId: draftNodeId,
        toNodeId: nodeId,
        edgeType: 'suggested',
        source: 'processor',
        verified: false,
        createdAt: now,
      }),
    ),
  );

  // 4. Create categorized_as edges to organizing nodes
  const organizingNodeIds = args.organizingNodeIds ?? [];
  const organizingNodeConfidences = args.organizingNodeConfidences ?? [];
  await Promise.all(
    organizingNodeIds.map((nodeId, i) => {
      const confidence = organizingNodeConfidences[i] ?? 0;
      // Auto-verify edges with confidence > 0.8
      const isAutomatic = confidence > 0.8;
      // Check for existing edge before inserting
      return ctx.db
        .query('edges')
        .withIndex('by_edge_pair', (q) =>
          q.eq('fromNodeId', draftNodeId).eq('toNodeId', nodeId),
        )
        .first()
        .then((existing) => {
          if (existing) return;
          return ctx.db.insert('edges', {
            fromNodeId: draftNodeId,
            toNodeId: nodeId,
            edgeType: 'categorized_as',
            source: 'processor',
            verified: isAutomatic,
            confidence,
            createdAt: now,
          });
        });
    }),
  );

  // 5. Create suggestion row
  await ctx.db.insert('suggestions', {
    captureId: args.captureId,
    suggestorUserId: args.agentUserId,
    suggestedNodeId: draftNodeId,
    status: 'pending',
    createdAt: now,
  });

  // 6. Set capture state to ready
  await ctx.db.patch('captures', args.captureId, {
    captureState: 'ready',
    updatedAt: now,
  });
}

export async function setCaptureFailed(
  ctx: MutationCtx,
  args: { captureId: Id<'captures'> },
) {
  await ctx.db.patch('captures', args.captureId, {
    captureState: 'failed',
    updatedAt: Date.now(),
  });
  return null;
}

export async function saveDraftSuggestion(
  ctx: MutationCtx,
  args: { captureId: Id<'captures'>; agentUserId: Id<'users'> },
) {
  const capture = await ctx.db.get(args.captureId);
  if (!capture) return null;

  const now = Date.now();
  const title = `[Draft] ${capture.rawContent.slice(0, 60)}`;

  const draftNodeId = await ctx.db.insert('nodes', {
    title,
    content: capture.rawContent,
    searchText: `${title}\n\n${capture.rawContent}`,
    ownerUserId: capture.ownerUserId,
    sourceCaptureId: args.captureId,
    createdAt: now,
    updatedAt: now,
  });

  await Promise.all(
    capture.explicitMentionNodeIds.map((mentionedNodeId) =>
      ctx.db.insert('edges', {
        fromNodeId: draftNodeId,
        toNodeId: mentionedNodeId,
        edgeType: 'suggested',
        source: 'processor',
        verified: false,
        createdAt: now,
      }),
    ),
  );

  await ctx.db.insert('suggestions', {
    captureId: args.captureId,
    suggestorUserId: args.agentUserId,
    suggestedNodeId: draftNodeId,
    status: 'pending',
    createdAt: now,
  });

  await ctx.db.patch('captures', args.captureId, {
    captureState: 'ready',
    updatedAt: now,
  });

  return null;
}
