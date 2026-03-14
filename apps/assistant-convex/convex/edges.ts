import { pick } from 'convex-helpers';
import { ConvexError, v } from 'convex/values';

import { authMutation } from './auth.ts';
import { edgeFields } from './schema.ts';

/**
 * 👀 Needs Verification
 */
export const createEdge = authMutation({
  args: pick(edgeFields, ['fromNodeId', 'toNodeId', 'edgeType']),
  returns: v.id('edges'),
  handler: async (ctx, args) => {
    // Verify caller owns both nodes
    await Promise.all([
      ctx.getDocOwnedByCurrentUser('nodes', args.fromNodeId),
      ctx.getDocOwnedByCurrentUser('nodes', args.toNodeId),
    ]);

    // Check for duplicates
    const existing = await ctx.db
      .query('edges')
      .withIndex('by_edge_pair', (q) =>
        q.eq('fromNodeId', args.fromNodeId).eq('toNodeId', args.toNodeId),
      )
      .first();
    if (existing) throw new ConvexError('Edge already exists');

    // Create edge
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
