import { pick } from 'convex-helpers';
import { ConvexError, v } from 'convex/values';

import { internal } from '#convex/_generated/api.js';
import { Id } from '#convex/_generated/dataModel.js';
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '#convex/_generated/server.js';
import { setCaptureFailed as setCaptureFailed_ } from '#convex/model/captures.ts';
import {
  getAgentUser,
  getCurrentUser,
  getDocOwnedByCurrentUser,
} from '#convex/model/users.ts';
import { captureFields } from '#convex/schema.ts';
import { authMutation, authQuery } from '#convex/utils/customFunctions.ts';
import { EntityNotFoundError } from '#convex/utils/errors.ts';
import { pickOptional } from '#convex/utils/helpers.ts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMentionedNodeIds(rawContent: string): Id<'nodes'>[] {
  const ids: Id<'nodes'>[] = [];
  for (const match of rawContent.matchAll(
    /@\[([^\]]+)\]\(node:([a-z0-9A-Z]+)\)/g,
  )) {
    ids.push(match[2] as Id<'nodes'>);
  }
  return ids;
}

// ─── Existing mutation ────────────────────────────────────────────────────────

/**
 * Bulk migrates offline guest captures to the authenticated user's account.
 * This is called automatically when an unauthenticated user signs in.
 *
 * It performs a bulk insert of all guest captures and schedules them for
 * asynchronous processing (e.g. AI analysis) in the background.
 */
export const migrateGuestCaptures = authMutation({
  args: {
    captures: v.array(
      v.object(
        pick(captureFields, ['rawContent', 'captureType', 'capturedAt']),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { migrated: 0 };
    const now = Date.now();

    // 1. Insert all guest captures into the database sequentially via Promise.all
    const captureIds = await Promise.all(
      args.captures.map((capture) =>
        ctx.db.insert('captures', {
          rawContent: capture.rawContent,
          captureType: capture.captureType,
          capturedAt: capture.capturedAt,
          updatedAt: now,
          ownerUserId: user._id,
          // Set initial state to processing since it hasn't been handled by AI yet
          captureState: 'processing',
          explicitMentionNodeIds: [],
        }),
      ),
    );

    // 2. Schedule background jobs to process each newly inserted capture
    await Promise.all(
      captureIds.map((captureId) =>
        ctx.scheduler.runAfter(0, internal.captures.processCapture, {
          captureId,
        }),
      ),
    );

    return { migrated: args.captures.length };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createCapture = authMutation({
  args: pick(captureFields, ['rawContent', 'captureType']),
  returns: v.id('captures'),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user)
      throw new EntityNotFoundError({
        tableName: 'users',
        argName: 'user',
        argValue: '',
      });
    const now = Date.now();
    const explicitMentionNodeIds = parseMentionedNodeIds(args.rawContent);

    const captureId = await ctx.db.insert('captures', {
      rawContent: args.rawContent,
      captureType: args.captureType,
      capturedAt: now,
      updatedAt: now,
      ownerUserId: user._id,
      captureState: 'processing',
      explicitMentionNodeIds,
    });

    await ctx.scheduler.runAfter(0, internal.captures.processCapture, {
      captureId,
    });

    return captureId;
  },
});

export const updateCapture = authMutation({
  args: {
    captureId: v.id('captures'),
    ...pickOptional(captureFields, ['rawContent', 'captureType']),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }

    const now = Date.now();
    const updates: Partial<{
      rawContent: string;
      captureType: 'text' | 'link' | 'task';
      explicitMentionNodeIds: Id<'nodes'>[];
      updatedAt: number;
    }> = { updatedAt: now };

    if (args.rawContent !== undefined) {
      updates.rawContent = args.rawContent;
      updates.explicitMentionNodeIds = parseMentionedNodeIds(args.rawContent);

      // If content changed and a pending suggestion exists, mark it stale
      if (args.rawContent !== capture.rawContent) {
        const suggestion = await ctx.db
          .query('suggestions')
          .withIndex('by_capture_status', (q) =>
            q.eq('captureId', args.captureId).eq('status', 'pending'),
          )
          .first();
        if (suggestion) {
          await ctx.db.patch('suggestions', suggestion._id, {
            status: 'stale',
          });
        }
      }
    }

    if (args.captureType !== undefined) {
      updates.captureType = args.captureType;
    }

    await ctx.db.patch('captures', args.captureId, updates);
    return null;
  },
});

export const acceptSuggestion = authMutation({
  args: {
    captureId: v.id('captures'),
    suggestionId: v.id('suggestions'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion || suggestion.captureId !== args.captureId) {
      throw new EntityNotFoundError({
        tableName: 'suggestions',
        argName: 'suggestionId',
        argValue: args.suggestionId,
      });
    }
    if (suggestion.status !== 'pending') {
      throw new EntityNotFoundError({
        tableName: 'suggestions',
        argName: 'suggestionId',
        argValue: args.suggestionId,
      });
    }

    const now = Date.now();

    // Find draft nodes for this capture
    const draftNodes = await ctx.db
      .query('nodes')
      .withIndex('by_owner_archivedAt_publishedAt_updatedAt', (q) =>
        q
          .eq('ownerUserId', capture.ownerUserId)
          .eq('archivedAt', undefined)
          .eq('publishedAt', undefined),
      )
      .filter((q) => q.eq(q.field('sourceCaptureId'), args.captureId))
      .collect();

    // Publish draft nodes and their edges
    await Promise.all(
      draftNodes.map(async (node) => {
        await ctx.db.patch('nodes', node._id, { publishedAt: now });

        const [draftOutgoing, draftIncoming] = await Promise.all([
          ctx.db
            .query('edges')
            .withIndex('by_publishedAt_archivedAt_from_node', (q) =>
              q
                .eq('publishedAt', undefined)
                .eq('archivedAt', undefined)
                .eq('fromNodeId', node._id),
            )
            .collect(),
          ctx.db
            .query('edges')
            .withIndex('by_publishedAt_archivedAt_to_node', (q) =>
              q
                .eq('publishedAt', undefined)
                .eq('archivedAt', undefined)
                .eq('toNodeId', node._id),
            )
            .collect(),
        ]);

        await Promise.all([
          ...draftOutgoing.map((e) =>
            ctx.db.patch('edges', e._id, { publishedAt: now, verified: true }),
          ),
          ...draftIncoming.map((e) =>
            ctx.db.patch('edges', e._id, { publishedAt: now, verified: true }),
          ),
        ]);
      }),
    );

    await ctx.db.patch('suggestions', args.suggestionId, {
      status: 'accepted',
      processedAt: now,
    });

    await ctx.db.patch('captures', args.captureId, {
      captureState: 'processed',
      nodeId: suggestion.suggestedNodeId,
      updatedAt: now,
    });

    return null;
  },
});

export const rejectSuggestion = authMutation({
  args: {
    captureId: v.id('captures'),
    suggestionId: v.id('suggestions'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion || suggestion.captureId !== args.captureId) {
      throw new EntityNotFoundError({
        tableName: 'suggestions',
        argName: 'suggestionId',
        argValue: args.suggestionId,
      });
    }
    if (suggestion.status !== 'pending') {
      throw new EntityNotFoundError({
        tableName: 'suggestions',
        argName: 'suggestionId',
        argValue: args.suggestionId,
      });
    }

    const now = Date.now();

    // Find and delete draft nodes for this capture
    const draftNodes = await ctx.db
      .query('nodes')
      .withIndex('by_owner_archivedAt_publishedAt_updatedAt', (q) =>
        q
          .eq('ownerUserId', capture.ownerUserId)
          .eq('archivedAt', undefined)
          .eq('publishedAt', undefined),
      )
      .filter((q) => q.eq(q.field('sourceCaptureId'), args.captureId))
      .collect();

    await Promise.all(
      draftNodes.map(async (node) => {
        const [outgoing, incoming] = await Promise.all([
          ctx.db
            .query('edges')
            .withIndex('by_publishedAt_archivedAt_from_node', (q) =>
              q
                .eq('publishedAt', undefined)
                .eq('archivedAt', undefined)
                .eq('fromNodeId', node._id),
            )
            .collect(),
          ctx.db
            .query('edges')
            .withIndex('by_publishedAt_archivedAt_to_node', (q) =>
              q
                .eq('publishedAt', undefined)
                .eq('archivedAt', undefined)
                .eq('toNodeId', node._id),
            )
            .collect(),
        ]);

        await Promise.all([
          ...outgoing.map((e) => ctx.db.delete('edges', e._id)),
          ...incoming.map((e) => ctx.db.delete('edges', e._id)),
        ]);
        await ctx.db.delete('nodes', node._id);
      }),
    );

    await ctx.db.patch('suggestions', args.suggestionId, {
      status: 'rejected',
      processedAt: now,
    });

    await ctx.db.patch('captures', args.captureId, {
      captureState: 'needs_manual',
      updatedAt: now,
    });

    return null;
  },
});

export const organizeCapture = authMutation({
  args: {
    captureId: v.id('captures'),
    nodeTitle: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }

    const now = Date.now();

    const newNodeId = await ctx.db.insert('nodes', {
      title: args.nodeTitle,
      content: capture.rawContent,
      searchText: `${args.nodeTitle}\n\n${capture.rawContent}`,
      ownerUserId: capture.ownerUserId,
      sourceCaptureId: args.captureId,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all(
      capture.explicitMentionNodeIds.map((nodeId) =>
        ctx.db.insert('edges', {
          fromNodeId: newNodeId,
          toNodeId: nodeId,
          edgeType: 'explicit',
          source: 'user',
          verified: true,
          publishedAt: now,
          createdAt: now,
        }),
      ),
    );

    await ctx.db.patch('captures', args.captureId, {
      captureState: 'processed',
      nodeId: newNodeId,
      updatedAt: now,
    });

    return null;
  },
});

export const archiveCapture = authMutation({
  args: { captureId: v.id('captures') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }

    const now = Date.now();
    await ctx.db.patch('captures', args.captureId, {
      archivedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const unarchiveCapture = authMutation({
  args: { captureId: v.id('captures') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }

    await ctx.db.patch('captures', args.captureId, {
      archivedAt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const retryProcessing = authMutation({
  args: { captureId: v.id('captures') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) {
      throw new ConvexError('Capture not found');
    }
    if (capture.captureState !== 'failed') {
      throw new EntityNotFoundError({
        tableName: 'captures',
        argName: 'captureId',
        argValue: args.captureId,
      });
    }

    const now = Date.now();
    await ctx.db.patch('captures', args.captureId, {
      captureState: 'processing',
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.captures.processCapture, {
      captureId: args.captureId,
    });

    return null;
  },
});

// ─── Internal mutation (process pipeline) ──────────────────────────────────────

// 👀 Needs Verification
export const processCapture = internalMutation({
  args: {
    captureId: v.id('captures'),
  },
  handler: async (ctx, args) => {
    const capture = await ctx.db.get(args.captureId);
    if (!capture) {
      throw new EntityNotFoundError({
        tableName: 'captures',
        argName: 'captureId',
        argValue: args.captureId,
      });
    }
    if (capture.captureState !== 'processing') return;

    const agentUser = await getAgentUser(ctx);
    if (!agentUser) {
      throw new ConvexError('Agent user not found');
    }

    await ctx.scheduler.runAfter(0, internal.captures.embedAndClassify, {
      captureId: args.captureId,
      rawContent: capture.rawContent,
      captureType: capture.captureType,
      ownerUserId: capture.ownerUserId,
      agentUserId: agentUser._id,
      explicitMentionNodeIds: capture.explicitMentionNodeIds,
    });
  },
});

// 👀 Needs Verification
// TODO: action needs to only have the embedText portion, move the rest to a mutation
export const embedAndClassify = internalAction({
  args: {
    captureId: v.id('captures'),
    rawContent: v.string(),
    captureType: v.union(
      v.literal('text'),
      v.literal('link'),
      v.literal('task'),
    ),
    ownerUserId: v.id('users'),
    agentUserId: v.id('users'),
    explicitMentionNodeIds: v.array(v.id('nodes')),
  },
  handler: async (ctx, args) => {
    try {
      const { embedText, generateTitle } =
        await import('#convex/ai/embedding.ts');

      // 1. Embed the raw content
      const embedding = await embedText(args.rawContent);

      // 2. Vector search for similar published nodes
      const searchResults = await ctx.vectorSearch('nodes', 'by_embedding', {
        vector: embedding,
        limit: 5,
        filter: (q) => q.eq('ownerUserId', args.ownerUserId),
      });

      // 3. Fetch full docs and filter by similarity threshold
      const aboveThreshold = searchResults.filter((r) => r._score >= 0.7);
      const nodeResults = await Promise.all(
        aboveThreshold.map(async (result) => {
          const node = await ctx.runQuery(
            internal.captures.getNodeForEmbedding,
            { nodeId: result._id },
          );
          if (node && !node.archivedAt && node.publishedAt) {
            return {
              id: result._id,
              title: node.title,
              content: node.content,
              score: result._score,
            };
          }
          return null;
        }),
      );
      const similarNodes = nodeResults.filter(
        (n): n is NonNullable<typeof n> => n !== null,
      );

      // 4. Generate title with LLM fallback chain
      const title = await generateTitle(
        args.rawContent,
        args.captureType,
        similarNodes,
      );

      // 5. Save results
      await ctx.runMutation(internal.captures.saveEmbeddingResult, {
        captureId: args.captureId,
        agentUserId: args.agentUserId,
        title,
        rawContent: args.rawContent,
        embedding,
        ownerUserId: args.ownerUserId,
        similarNodeIds: similarNodes.map((n) => n.id),
        similarNodeScores: similarNodes.map((n) => n.score),
        explicitMentionNodeIds: args.explicitMentionNodeIds,
      });
    } catch (error) {
      console.error('embedAndClassify failed:', error);
      await ctx.runMutation(internal.captures.setCaptureFailed, {
        captureId: args.captureId,
      });
    }
  },
});

export const getNodeForEmbedding = internalQuery({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) return null;
    return {
      title: node.title,
      content: node.content,
      archivedAt: node.archivedAt,
      publishedAt: node.publishedAt,
    };
  },
});

// 👀 Needs Verification
export const saveEmbeddingResult = internalMutation({
  args: {
    captureId: v.id('captures'),
    agentUserId: v.id('users'),
    title: v.string(),
    rawContent: v.string(),
    embedding: v.array(v.float64()),
    ownerUserId: v.id('users'),
    similarNodeIds: v.array(v.id('nodes')),
    similarNodeScores: v.array(v.number()),
    explicitMentionNodeIds: v.array(v.id('nodes')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Create draft node with embedding
    const draftNodeId = await ctx.db.insert('nodes', {
      title: args.title,
      content: args.rawContent,
      searchText: `${args.title}\n\n${args.rawContent}`,
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

    // 4. Create suggestion row
    await ctx.db.insert('suggestions', {
      captureId: args.captureId,
      suggestorUserId: args.agentUserId,
      suggestedNodeId: draftNodeId,
      status: 'pending',
      createdAt: now,
    });

    // 5. Set capture state to ready
    await ctx.db.patch('captures', args.captureId, {
      captureState: 'ready',
      updatedAt: now,
    });
  },
});

export const setCaptureFailed = internalMutation({
  args: { captureId: v.id('captures') },
  handler: async (ctx, args) => {
    await setCaptureFailed_(ctx, args);
  },
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getCapture = authQuery({
  args: { captureId: v.id('captures') },
  handler: async (ctx, args) => {
    const [user, capture] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.captureId),
    ]);
    if (!capture || capture.ownerUserId !== user?._id) return null;
    return capture;
  },
});

export const getInboxCaptures = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const [processing, ready, failed, needsManual] = await Promise.all([
      ctx.db
        .query('captures')
        .withIndex('by_owner_archivedAt_capture_state', (q) =>
          q
            .eq('ownerUserId', user._id)
            .eq('archivedAt', undefined)
            .eq('captureState', 'processing'),
        )
        .collect(),
      ctx.db
        .query('captures')
        .withIndex('by_owner_archivedAt_capture_state', (q) =>
          q
            .eq('ownerUserId', user._id)
            .eq('archivedAt', undefined)
            .eq('captureState', 'ready'),
        )
        .collect(),
      ctx.db
        .query('captures')
        .withIndex('by_owner_archivedAt_capture_state', (q) =>
          q
            .eq('ownerUserId', user._id)
            .eq('archivedAt', undefined)
            .eq('captureState', 'failed'),
        )
        .collect(),
      ctx.db
        .query('captures')
        .withIndex('by_owner_archivedAt_capture_state', (q) =>
          q
            .eq('ownerUserId', user._id)
            .eq('archivedAt', undefined)
            .eq('captureState', 'needs_manual'),
        )
        .collect(),
    ]);

    // For ready captures, also fetch the pending suggestion and suggestor
    const readyWithSuggestions = await Promise.all(
      ready.map(async (capture) => {
        const suggestion = await ctx.db
          .query('suggestions')
          .withIndex('by_capture_status', (q) =>
            q.eq('captureId', capture._id).eq('status', 'pending'),
          )
          .first();
        if (!suggestion) return { capture, suggestion: null, suggestor: null };
        const suggestor = await ctx.db.get(suggestion.suggestorUserId);
        return {
          capture,
          suggestion,
          suggestor: suggestor
            ? {
                displayName: suggestor.displayName,
                userType: suggestor.userType,
                agentProvider: suggestor.agentProvider,
              }
            : null,
        };
      }),
    );

    const noSuggestion = { suggestion: null, suggestor: null } as const;

    const all = [
      ...processing.map((capture) => Object.assign({ capture }, noSuggestion)),
      ...readyWithSuggestions,
      ...failed.map((capture) => Object.assign({ capture }, noSuggestion)),
      ...needsManual.map((capture) => Object.assign({ capture }, noSuggestion)),
    ];

    all.sort((a, b) => b.capture.capturedAt - a.capture.capturedAt);
    return all;
  },
});

export const getRecentCaptures = authQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const limit = args.limit ?? 20;

    // Collect a larger batch and sort by capturedAt desc in-memory
    const captures = await ctx.db
      .query('captures')
      .withIndex('by_owner_archivedAt', (q) =>
        q.eq('ownerUserId', user._id).eq('archivedAt', undefined),
      )
      .order('desc')
      .take(50);

    captures.sort((a, b) => b.capturedAt - a.capturedAt);
    return captures.slice(0, limit);
  },
});

export const getArchivedItems = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { captures: [], nodes: [] };
    const [captures, nodes] = await Promise.all([
      ctx.db
        .query('captures')
        .withIndex('by_owner_archivedAt', (q) =>
          q.eq('ownerUserId', user._id).gt('archivedAt', 0),
        )
        .order('desc')
        .collect(),
      ctx.db
        .query('nodes')
        .withIndex('by_owner_archivedAt', (q) =>
          q.eq('ownerUserId', user._id).gt('archivedAt', 0),
        )
        .order('desc')
        .collect(),
    ]);

    return { captures, nodes };
  },
});
