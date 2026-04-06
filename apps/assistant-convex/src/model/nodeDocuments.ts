import { Doc } from '#convex/_generated/dataModel.js';
import { MutationCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function saveGeneratedDocument(
  ctx: MutationCtx,
  args: Pick<
    Doc<'nodeDocuments'>,
    | 'nodeId'
    | 'version'
    | 'title'
    | 'content'
    | 'generatedAt'
    | 'generatedFromEdgesUpTo'
    | 'ownerUserId'
  >,
) {
  return ctx.db.insert('nodeDocuments', {
    nodeId: args.nodeId,
    version: args.version,
    title: args.title,
    content: args.content,
    generatedAt: args.generatedAt,
    generatedFromEdgesUpTo: args.generatedFromEdgesUpTo,
    isEdited: false,
    ownerUserId: args.ownerUserId,
  });
}
