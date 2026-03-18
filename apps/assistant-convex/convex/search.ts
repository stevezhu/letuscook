import { v } from 'convex/values';

import { getCurrentUser } from '#convex/model/users.ts';
import { authQuery } from '#convex/utils/customFunctions.ts';

export const searchGlobal = authQuery({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const [captureResults, nodeResults] = await Promise.all([
      ctx.db
        .query('captures')
        .withSearchIndex('search_raw', (q) =>
          q.search('rawContent', args.query).eq('ownerUserId', user._id),
        )
        .take(20),
      ctx.db
        .query('nodes')
        .withSearchIndex('search_nodes', (q) =>
          q.search('searchText', args.query).eq('ownerUserId', user._id),
        )
        .take(20),
    ]);

    const captures = captureResults
      .filter(
        (c) => c.archivedAt === undefined && c.captureState !== 'processed',
      )
      .map((c) => ({ type: 'capture' as const, item: c }));

    const nodes = nodeResults
      .filter(
        (n) =>
          n.archivedAt === undefined &&
          n.publishedAt !== undefined &&
          n.publishedAt > 0,
      )
      .map((n) => ({ type: 'node' as const, item: n }));

    return [...captures, ...nodes].slice(0, 20);
  },
});

export const searchNodesForLinking = authQuery({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const results = await ctx.db
      .query('nodes')
      .withSearchIndex('search_nodes', (q) =>
        q.search('searchText', args.query).eq('ownerUserId', user._id),
      )
      .take(10);

    return results
      .filter(
        (n) =>
          n.archivedAt === undefined &&
          n.publishedAt !== undefined &&
          n.publishedAt > 0,
      )
      .map((n) => ({ _id: n._id, title: n.title }));
  },
});
