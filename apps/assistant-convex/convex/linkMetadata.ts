import { pick } from 'convex-helpers';
import { v } from 'convex/values';

import { internalMutation } from '#convex/_generated/server.js';
import { linkMetadataFields } from '#convex/schema.ts';
import { authQuery } from '#model/customFunctions.ts';
import { getCurrentUser, getDocOwnedByCurrentUser } from '#model/users.ts';

// 👀 Needs Verification
export const saveLinkMetadata = internalMutation({
  args: pick(linkMetadataFields, [
    'captureId',
    'url',
    'canonicalUrl',
    'domain',
    'title',
    'description',
    'faviconUrl',
    'ogImageUrl',
    'contentSnippet',
    'fetchedAt',
    'fetchStatus',
    'ownerUserId',
  ]),
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
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) return null;
    return await ctx.db
      .query('linkMetadata')
      .withIndex('by_capture', (q) => q.eq('captureId', args.captureId))
      .unique();
  },
});

// 👀 Needs Verification
export const getLinksByDomain = authQuery({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return ctx.db
      .query('linkMetadata')
      .withIndex('by_domain_owner', (q) =>
        q.eq('domain', args.domain).eq('ownerUserId', user._id),
      )
      .collect();
  },
});

// 👀 Needs Verification
export const getDomainList = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Collect all link metadata for this user and group by domain
    const allLinks = await ctx.db
      .query('linkMetadata')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect();

    const domainCounts = new Map<string, number>();
    for (const link of allLinks) {
      const count = domainCounts.get(link.domain) ?? 0;
      domainCounts.set(link.domain, count + 1);
    }

    return Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  },
});
