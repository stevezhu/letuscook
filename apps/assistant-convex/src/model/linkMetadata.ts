import { Id } from '#convex/_generated/dataModel.js';
import { MutationCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function saveLinkMetadata(
  ctx: MutationCtx,
  args: {
    captureId: Id<'captures'>;
    url: string;
    canonicalUrl?: string;
    domain: string;
    title?: string;
    description?: string;
    faviconUrl?: string;
    ogImageUrl?: string;
    contentSnippet?: string;
    fetchedAt: number;
    fetchStatus: 'success' | 'partial' | 'failed';
    ownerUserId: Id<'users'>;
  },
) {
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
}
