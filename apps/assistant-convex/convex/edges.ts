import { pick } from 'convex-helpers';
import { ConvexError, v } from 'convex/values';

import { authMutation } from './auth.ts';
import { EntityNotFoundError } from './errors.ts';
import { edgeFields } from './schema.ts';

/**
 * 👀 Needs Verification
 */
export const createEdge = authMutation({
  args: pick(edgeFields, ['fromNodeId', 'toNodeId', 'edgeType']),
  returns: v.id('edges'),
  handler: async (ctx, { fromNodeId, toNodeId, edgeType }) => {
    // Verify caller owns both nodes
    const [fromNode, toNode] = await Promise.all([
      ctx.getDocOwnedByCurrentUser('nodes', fromNodeId),
      ctx.getDocOwnedByCurrentUser('nodes', toNodeId),
    ]);
    if (!fromNode) {
      throw new EntityNotFoundError({
        tableName: 'nodes',
        argName: 'fromNodeId',
        argValue: fromNodeId,
      });
    }
    if (!toNode) {
      throw new EntityNotFoundError({
        tableName: 'nodes',
        argName: 'toNodeId',
        argValue: toNodeId,
      });
    }

    // Check for duplicates
    const existing = await ctx.db
      .query('edges')
      .withIndex('by_edge_pair', (q) =>
        q.eq('fromNodeId', fromNodeId).eq('toNodeId', toNodeId),
      )
      .first();
    if (existing) {
      throw new ConvexError('Edge already exists');
    }

    // Create edge
    const now = Date.now();
    return ctx.db.insert('edges', {
      fromNodeId,
      toNodeId,
      edgeType: edgeType ?? 'explicit',
      source: 'user',
      verified: true,
      publishedAt: now,
      createdAt: now,
    });
  },
});
