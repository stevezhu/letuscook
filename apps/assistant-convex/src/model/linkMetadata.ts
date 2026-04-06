import { Doc } from '#convex/_generated/dataModel.js';
import { MutationCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function saveLinkMetadata(
  ctx: MutationCtx,
  args: Pick<
    Doc<'linkMetadata'>,
    | 'captureId'
    | 'url'
    | 'canonicalUrl'
    | 'domain'
    | 'title'
    | 'description'
    | 'faviconUrl'
    | 'ogImageUrl'
    | 'contentSnippet'
    | 'fetchedAt'
    | 'fetchStatus'
    | 'ownerUserId'
  >,
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
