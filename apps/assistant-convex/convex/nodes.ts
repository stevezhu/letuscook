import { v } from 'convex/values';

import { authMutation, authQuery } from './auth.ts';
import { EntityNotFoundError } from './errors.ts';

export const archiveNode = authMutation({
  args: { nodeId: v.id('nodes') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      ctx.getCurrentUser(),
      ctx.db.get(args.nodeId),
    ]);
    if (!node || node.ownerUserId !== user?._id) {
      throw new EntityNotFoundError({
        argName: 'nodeId',
        argValue: args.nodeId,
      });
    }

    const now = Date.now();
    await ctx.db.patch('nodes', args.nodeId, { archivedAt: now });

    // Archive related edges
    const [outgoing, incoming] = await Promise.all([
      ctx.db
        .query('edges')
        .withIndex('by_archivedAt_from_node', (q) =>
          q.eq('archivedAt', undefined).eq('fromNodeId', args.nodeId),
        )
        .collect(),
      ctx.db
        .query('edges')
        .withIndex('by_archivedAt_to_node', (q) =>
          q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
        )
        .collect(),
    ]);

    await Promise.all([
      ...outgoing.map((e) => ctx.db.patch('edges', e._id, { archivedAt: now })),
      ...incoming.map((e) => ctx.db.patch('edges', e._id, { archivedAt: now })),
    ]);

    return null;
  },
});

export const unarchiveNode = authMutation({
  args: { nodeId: v.id('nodes') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      ctx.getCurrentUser(),
      ctx.db.get(args.nodeId),
    ]);
    if (!node || node.ownerUserId !== user?._id) {
      throw new EntityNotFoundError({
        argName: 'nodeId',
        argValue: args.nodeId,
      });
    }

    await ctx.db.patch('nodes', args.nodeId, { archivedAt: undefined });

    // Unarchive related edges — scan archived edges, filter by nodeId
    const [outgoing, incoming] = await Promise.all([
      ctx.db
        .query('edges')
        .withIndex('by_archivedAt_from_node', (q) => q.gt('archivedAt', 0))
        .filter((q) => q.eq(q.field('fromNodeId'), args.nodeId))
        .collect(),
      ctx.db
        .query('edges')
        .withIndex('by_archivedAt_to_node', (q) => q.gt('archivedAt', 0))
        .filter((q) => q.eq(q.field('toNodeId'), args.nodeId))
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

export const getKnowledgeBasePages = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.getCurrentUser();
    if (!user) return [];
    const nodes = await ctx.db
      .query('nodes')
      .withIndex('by_owner_archivedAt_publishedAt_updatedAt', (q) =>
        q
          .eq('ownerUserId', user._id)
          .eq('archivedAt', undefined)
          .gt('publishedAt', 0),
      )
      .order('desc')
      .collect();

    // Attach edge counts
    const nodesWithCounts = await Promise.all(
      nodes.map(async (node) => {
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

    return nodesWithCounts;
  },
});

export const getNodeWithEdges = authQuery({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      ctx.getCurrentUser(),
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
