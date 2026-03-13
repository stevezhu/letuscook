import { pick } from 'convex-helpers';
import { ConvexError, v } from 'convex/values';

import { authMutation } from './auth.ts';
import { EntityNotFoundError } from './errors.ts';
import { edgeFields } from './schema.ts';

export const createEdge = authMutation({
  args: pick(edgeFields, ['fromNodeId', 'toNodeId', 'edgeType']),
  returns: v.id('edges'),
  handler: async (ctx, args) => {
    // Verify caller owns both nodes
    const [user, fromNode, toNode] = await Promise.all([
      ctx.getUser(),
      ctx.db.get('nodes', args.fromNodeId),
      ctx.db.get('nodes', args.toNodeId),
    ]);
    if (!fromNode || fromNode.ownerUserId !== user?._id) {
      throw new EntityNotFoundError({
        argName: 'fromNodeId',
        argValue: args.fromNodeId,
      });
    }
    if (!toNode || toNode.ownerUserId !== user?._id) {
      throw new EntityNotFoundError({
        argName: 'toNodeId',
        argValue: args.toNodeId,
      });
    }

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
