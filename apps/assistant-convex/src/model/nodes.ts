import { Id } from '#convex/_generated/dataModel.js';
import { MutationCtx, QueryCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function findNodesByTitle(
  ctx: QueryCtx,
  args: {
    ownerUserId: Id<'users'>;
    titleSubstring: string;
  },
) {
  const nodes = await ctx.db
    .query('nodes')
    .withSearchIndex('search_nodes', (q) =>
      q
        .search('searchText', args.titleSubstring)
        .eq('ownerUserId', args.ownerUserId)
        .eq('archivedAt', undefined),
    )
    .take(20);
  return nodes.map((n) => ({
    id: n._id,
    title: n.title,
    nodeKind: n.nodeKind,
  }));
}

// 👀 Needs Verification
export async function createVirtualNode(
  ctx: MutationCtx,
  args: {
    title: string;
    ownerUserId: Id<'users'>;
  },
) {
  const now = Date.now();
  const nodeId = await ctx.db.insert('nodes', {
    title: args.title,
    content: '',
    searchText: args.title,
    ownerUserId: args.ownerUserId,
    nodeKind: 'virtual',
    createdAt: now,
    updatedAt: now,
  });
  return nodeId;
}

// 👀 Needs Verification
export async function getNodeForDocumentGeneration(
  ctx: QueryCtx,
  args: { nodeId: Id<'nodes'> },
) {
  const node = await ctx.db.get(args.nodeId);
  if (!node) return null;
  return { _id: node._id, title: node.title, content: node.content };
}

// 👀 Needs Verification
export async function getNodeActivityForDocument(
  ctx: QueryCtx,
  args: { nodeId: Id<'nodes'> },
) {
  const incomingEdges = await ctx.db
    .query('edges')
    .withIndex('by_archivedAt_to_node', (q) =>
      q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
    )
    .collect();

  const resolvedItems = await Promise.all(
    incomingEdges.map(async (edge) => {
      const fromNode = await ctx.db.get(edge.fromNodeId);
      if (!fromNode) return null;

      let capture: {
        _id: Id<'captures'>;
        rawContent: string;
        captureType: 'text' | 'link' | 'task';
      } | null = null;
      let linkMetadata: {
        title?: string;
        description?: string;
        contentSnippet?: string;
        url: string;
      } | null = null;

      if (fromNode.sourceCaptureId) {
        const [captureDoc, meta] = await Promise.all([
          ctx.db.get(fromNode.sourceCaptureId),
          ctx.db
            .query('linkMetadata')
            .withIndex('by_capture', (q) =>
              q.eq('captureId', fromNode.sourceCaptureId!),
            )
            .unique(),
        ]);

        if (captureDoc) {
          capture = {
            _id: captureDoc._id,
            rawContent: captureDoc.rawContent,
            captureType: captureDoc.captureType,
          };
        }
        if (meta) {
          linkMetadata = {
            title: meta.title,
            description: meta.description,
            contentSnippet: meta.contentSnippet,
            url: meta.url,
          };
        }
      }

      return {
        fromNode: {
          _id: fromNode._id,
          title: fromNode.title,
          content: fromNode.content,
        },
        capture,
        linkMetadata,
      };
    }),
  );

  return resolvedItems.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
}
