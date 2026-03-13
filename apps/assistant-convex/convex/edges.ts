import { ConvexError, v } from 'convex/values';

import { userMutation } from './functions.ts';

export const createEdge = userMutation({
  args: {
    fromNodeId: v.id('nodes'),
    toNodeId: v.id('nodes'),
    edgeType: v.optional(
      v.union(
        v.literal('explicit'),
        v.literal('suggested'),
        v.literal('reference'),
        v.literal('related'),
      ),
    ),
  },
  returns: v.id('edges'),
  handler: async (ctx, args) => {
    // Verify caller owns both nodes
    const [fromNode, toNode] = await Promise.all([
      ctx.db.get(args.fromNodeId),
      ctx.db.get(args.toNodeId),
    ]);
    if (!fromNode || fromNode.ownerUserId !== ctx.user._id)
      throw new ConvexError('Unauthorized: fromNode');
    if (!toNode || toNode.ownerUserId !== ctx.user._id)
      throw new ConvexError('Unauthorized: toNode');

    // Check for duplicates
    const existing = await ctx.db
      .query('edges')
      .withIndex('by_edge_pair', (q) =>
        q.eq('fromNodeId', args.fromNodeId).eq('toNodeId', args.toNodeId),
      )
      .first();
    if (existing) throw new ConvexError('Edge already exists');

    const now = Date.now();
    return ctx.db.insert('edges', {
      fromNodeId: args.fromNodeId,
      toNodeId: args.toNodeId,
      edgeType: args.edgeType ?? 'explicit',
      source: 'user',
      verified: true,
      publishedAt: now,
      createdAt: now,
    });
  },
});
