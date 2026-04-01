import { v } from 'convex/values';

import { internalMutation } from '#convex/_generated/server.js';
import { authQuery } from '#convex/utils/customFunctions.ts';

// 👀 Needs Verification
export const saveLinkMetadata = internalMutation({
  args: {
    captureId: v.id('captures'),
    url: v.string(),
    canonicalUrl: v.optional(v.string()),
    domain: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    ogImageUrl: v.optional(v.string()),
    contentSnippet: v.optional(v.string()),
    fetchedAt: v.number(),
    fetchStatus: v.union(
      v.literal('success'),
      v.literal('partial'),
      v.literal('failed'),
    ),
    ownerUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('linkMetadata', {
      captureId: args.captureId,
      url: args.url,
      canonicalUrl: args.canonicalUrl,
      domain: args.domain,
      title: args.title,
      description: args.description,
      faviconUrl: args.faviconUrl,
      ogImageUrl: args.ogImageUrl,
      contentSnippet: args.contentSnippet,
      fetchedAt: args.fetchedAt,
      fetchStatus: args.fetchStatus,
      ownerUserId: args.ownerUserId,
    });
  },
});

// 👀 Needs Verification
export const getLinkMetadataByCapture = authQuery({
  args: { captureId: v.id('captures') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('linkMetadata')
      .withIndex('by_capture', (q) => q.eq('captureId', args.captureId))
      .unique();
  },
});
