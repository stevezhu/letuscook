import { CustomCtx } from 'convex-helpers/server/customFunctions';
import { v } from 'convex/values';

import { Doc, Id } from '#convex/_generated/dataModel.js';
import { EntityNotFoundError } from '#lib/errors.ts';
import { authMutation, authQuery } from '#model/customFunctions.ts';
import { getCurrentUser, getDocOwnedByCurrentUser } from '#model/users.ts';

/**
 * Fetches all published, non-archived, non-virtual nodes for a user, each
 * annotated with the count of its published, non-archived edges.
 */
async function getRegularNodesWithEdgeCounts(
  ctx: CustomCtx<typeof authQuery>,
  userId: Id<'users'>,
): Promise<{ node: Doc<'nodes'>; edgeCount: number }[]> {
  const nodes = await ctx.db
    .query('nodes')
    .withIndex('by_owner_archivedAt_publishedAt_updatedAt', (q) =>
      q
        .eq('ownerUserId', userId)
        .eq('archivedAt', undefined)
        .gt('publishedAt', 0),
    )
    .collect();

  const regularNodes = nodes.filter(
    (n) => (n.nodeKind ?? 'regular') !== 'virtual',
  );

  return Promise.all(
    regularNodes.map(async (node) => {
      const [outgoing, incoming] = await Promise.all([
        ctx.db
          .query('edges')
          .withIndex('by_archivedAt_from_node', (q) =>
            q.eq('archivedAt', undefined).eq('fromNodeId', node._id),
          )
          .filter((q) => q.neq(q.field('publishedAt'), undefined))
          .collect(),
        ctx.db
          .query('edges')
          .withIndex('by_archivedAt_to_node', (q) =>
            q.eq('archivedAt', undefined).eq('toNodeId', node._id),
          )
          .filter((q) => q.neq(q.field('publishedAt'), undefined))
          .collect(),
      ]);
      return { node, edgeCount: outgoing.length + incoming.length };
    }),
  );
}

/**
 * Soft-deletes a node and all its connected edges by setting `archivedAt`.
 *
 * @throws {EntityNotFoundError} If the node doesn't exist or isn't owned by the
 *   current user. 👀 Needs Verification
 */
export const archiveNode = authMutation({
  args: { nodeId: v.id('nodes') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const node = await getDocOwnedByCurrentUser(ctx, 'nodes', args.nodeId);
    if (!node) {
      throw new EntityNotFoundError({
        tableName: 'nodes',
        argName: 'nodeId',
        argValue: args.nodeId,
      });
    }

    const now = Date.now();
    await ctx.db.patch('nodes', args.nodeId, { archivedAt: now });

    // Archive related edges
    // TODO: benchmark the performance of this approach vs. the Promise.all approach below
    // Reference: /node_modules/.pnpm/convex@1.32.0_react@19.2.4/node_modules/convex/src/server/query.ts
    for await (const edge of ctx.db
      .query('edges')
      .withIndex('by_archivedAt_from_node', (q) =>
        q.eq('archivedAt', undefined).eq('fromNodeId', args.nodeId),
      )) {
      await ctx.db.patch('edges', edge._id, { archivedAt: now });
    }
    for await (const edge of ctx.db
      .query('edges')
      .withIndex('by_archivedAt_to_node', (q) =>
        q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
      )) {
      await ctx.db.patch('edges', edge._id, { archivedAt: now });
    }

    // const [outgoing, incoming] = await Promise.all([
    //   ctx.db
    //     .query('edges')
    //     .withIndex('by_archivedAt_from_node', (q) =>
    //       q.eq('archivedAt', undefined).eq('fromNodeId', args.nodeId),
    //     )
    //     .collect(),
    //   ctx.db
    //     .query('edges')
    //     .withIndex('by_archivedAt_to_node', (q) =>
    //       q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
    //     )
    //     .collect(),
    // ]);

    // await Promise.all([
    //   ...outgoing.map((e) => ctx.db.patch('edges', e._id, { archivedAt: now })),
    //   ...incoming.map((e) => ctx.db.patch('edges', e._id, { archivedAt: now })),
    // ]);

    return null;
  },
});

/**
 * Restores a soft-deleted node and all its connected edges by clearing
 * `archivedAt`.
 *
 * @throws {EntityNotFoundError} If the node doesn't exist or isn't owned by the
 *   current user. 👀 Needs Verification
 */
export const unarchiveNode = authMutation({
  args: { nodeId: v.id('nodes') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const node = await getDocOwnedByCurrentUser(ctx, 'nodes', args.nodeId);
    if (!node) {
      throw new EntityNotFoundError({
        tableName: 'nodes',
        argName: 'nodeId',
        argValue: args.nodeId,
      });
    }

    await ctx.db.patch('nodes', args.nodeId, { archivedAt: undefined });

    // Unarchive related edges — query by node, then filter for archived
    const [outgoing, incoming] = await Promise.all([
      ctx.db
        .query('edges')
        .withIndex('by_edge_pair', (q) => q.eq('fromNodeId', args.nodeId))
        .filter((q) => q.neq(q.field('archivedAt'), undefined))
        .collect(),
      ctx.db
        .query('edges')
        .withIndex('by_to_node', (q) => q.eq('toNodeId', args.nodeId))
        .filter((q) => q.neq(q.field('archivedAt'), undefined))
        .collect(),
    ]);

    await Promise.all([
      ...outgoing.map((e) =>
        ctx.db.patch('edges', e._id, { archivedAt: undefined }),
      ),
      ...incoming.map((e) =>
        ctx.db.patch('edges', e._id, { archivedAt: undefined }),
      ),
    ]);

    return null;
  },
});

/**
 * Returns all published, non-archived, non-virtual nodes owned by the current
 * user, each annotated with a count of its published edges. Sorted by most
 * recently updated first.
 */
export const getKnowledgeBasePages = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const nodesWithCounts = await getRegularNodesWithEdgeCounts(ctx, user._id);

    // Sort by updatedAt desc
    nodesWithCounts.sort((a, b) => b.node.updatedAt - a.node.updatedAt);

    return nodesWithCounts;
  },
});

// 👀 Needs Verification
/**
 * Returns the activity feed for a node: all incoming edges (non-archived) where
 * the fromNode has a sourceCaptureId, resolved with capture and link metadata.
 * Results are sorted by capturedAt desc. Returns `null` if the node doesn't
 * exist or isn't owned by the current user.
 */
export const getNodeActivity = authQuery({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.nodeId),
    ]);
    if (!node || node.ownerUserId !== user?._id) return null;

    // Find all non-archived incoming edges to this node
    const incomingEdges = await ctx.db
      .query('edges')
      .withIndex('by_archivedAt_to_node', (q) =>
        q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
      )
      .collect();

    // Resolve each edge: fetch fromNode, capture, and optional linkMetadata
    const activityItems = await Promise.all(
      incomingEdges.map(async (edge) => {
        const fromNode = await ctx.db.get(edge.fromNodeId);
        if (!fromNode) return null;

        let capture = null;
        let linkMetadata = null;

        if (fromNode.sourceCaptureId) {
          capture = await ctx.db.get(fromNode.sourceCaptureId);
          if (capture) {
            linkMetadata = await ctx.db
              .query('linkMetadata')
              .withIndex('by_capture', (q) =>
                q.eq('captureId', fromNode.sourceCaptureId!),
              )
              .unique();
          }
        }

        return { node: fromNode, capture, linkMetadata, edge };
      }),
    );

    // Filter nulls and sort by capturedAt desc
    const filtered = activityItems.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );

    filtered.sort((a, b) => {
      const aTime = a.capture?.capturedAt ?? a.node.createdAt;
      const bTime = b.capture?.capturedAt ?? b.node.createdAt;
      return bTime - aTime;
    });

    return filtered;
  },
});

// 👀 Needs Verification
/**
 * Returns the top "hub" nodes for the current user: published, non-archived,
 * non-virtual nodes sorted by their total published edge count (incoming +
 * outgoing) descending. Hub nodes are concept nodes with many connections.
 */
export const getHubNodes = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const nodesWithCounts = await getRegularNodesWithEdgeCounts(ctx, user._id);

    // Sort by edge count descending — nodes with most connections first
    nodesWithCounts.sort((a, b) => b.edgeCount - a.edgeCount);

    return nodesWithCounts;
  },
});

/**
 * Returns a node with its resolved outgoing and incoming published edges.
 * Linked nodes owned by another user are returned as `{ type: 'private' }`.
 * Returns `null` if the node doesn't exist or isn't owned by the current user.
 */
export const getNodeWithEdges = authQuery({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.nodeId),
    ]);
    if (!node || node.ownerUserId !== user?._id) return null;

    const [outgoingEdges, incomingEdges] = await Promise.all([
      ctx.db
        .query('edges')
        .withIndex('by_archivedAt_from_node', (q) =>
          q.eq('archivedAt', undefined).eq('fromNodeId', args.nodeId),
        )
        .filter((q) => q.neq(q.field('publishedAt'), undefined))
        .collect(),
      ctx.db
        .query('edges')
        .withIndex('by_archivedAt_to_node', (q) =>
          q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
        )
        .filter((q) => q.neq(q.field('publishedAt'), undefined))
        .collect(),
    ]);

    const resolveLinkedNode = async (linkedNodeId: string) => {
      const linked = await ctx.db.get(linkedNodeId as typeof args.nodeId);
      if (!linked) return null;
      if (linked.ownerUserId !== user?._id) {
        return { type: 'private' as const };
      }
      return {
        type: 'node' as const,
        _id: linked._id,
        title: linked.title,
        publishedAt: linked.publishedAt,
      };
    };

    const [outgoing, incoming] = await Promise.all([
      Promise.all(
        outgoingEdges.map(async (edge) => ({
          edge,
          linkedNode: await resolveLinkedNode(edge.toNodeId),
        })),
      ),
      Promise.all(
        incomingEdges.map(async (edge) => ({
          edge,
          linkedNode: await resolveLinkedNode(edge.fromNodeId),
        })),
      ),
    ]);

    return { node, outgoing, incoming };
  },
});
