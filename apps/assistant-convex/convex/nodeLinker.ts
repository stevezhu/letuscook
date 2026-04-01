import { v } from 'convex/values';

import { Id } from '#convex/_generated/dataModel.js';
import { internalMutation, internalQuery } from '#convex/_generated/server.js';

// 👀 Needs Verification
export const findNodesByTitle = internalQuery({
  args: {
    ownerUserId: v.id('users'),
    titleSubstring: v.string(),
  },
  handler: async (ctx, args) => {
    const lower = args.titleSubstring.toLowerCase();
    // Search all non-archived nodes (virtual and regular) for title matches
    const nodes = await ctx.db
      .query('nodes')
      .withIndex('by_owner_archivedAt', (q) =>
        q.eq('ownerUserId', args.ownerUserId).eq('archivedAt', undefined),
      )
      .collect();
    return nodes
      .filter((n) => n.title.toLowerCase().includes(lower))
      .map((n) => ({ id: n._id, title: n.title, nodeKind: n.nodeKind }));
  },
});

// 👀 Needs Verification
export const createVirtualNode = internalMutation({
  args: {
    title: v.string(),
    ownerUserId: v.id('users'),
  },
  returns: v.id('nodes'),
  handler: async (ctx, args) => {
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
  },
});

// 👀 Needs Verification
export const saveOrganizingEdges = internalMutation({
  args: {
    fromNodeId: v.id('nodes'),
    organizingEdges: v.array(
      v.object({
        toNodeId: v.id('nodes'),
        confidence: v.number(),
        isAutomatic: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await Promise.all(
      args.organizingEdges.map((edge) => {
        // Check for existing edge to avoid duplicates
        return ctx.db
          .query('edges')
          .withIndex('by_edge_pair', (q) =>
            q.eq('fromNodeId', args.fromNodeId).eq('toNodeId', edge.toNodeId),
          )
          .first()
          .then((existing) => {
            if (existing) return;
            return ctx.db.insert('edges', {
              fromNodeId: args.fromNodeId,
              toNodeId: edge.toNodeId,
              edgeType: 'categorized_as',
              source: 'processor',
              verified: edge.isAutomatic,
              confidence: edge.confidence,
              createdAt: now,
            });
          });
      }),
    );
  },
});

export type OrganizingEdgeInput = {
  toNodeId: Id<'nodes'>;
  confidence: number;
  isAutomatic: boolean;
};
