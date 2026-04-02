import { v } from 'convex/values';

import { internalMutation, internalQuery } from '#convex/_generated/server.js';

// 👀 Needs Verification
export const findNodesByTitle = internalQuery({
  args: {
    ownerUserId: v.id('users'),
    titleSubstring: v.string(),
  },
  handler: async (ctx, args) => {
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
