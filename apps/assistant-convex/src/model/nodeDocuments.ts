import { Id } from '#convex/_generated/dataModel.js';
import { MutationCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function saveGeneratedDocument(
  ctx: MutationCtx,
  args: {
    nodeId: Id<'nodes'>;
    version: number;
    title: string;
    content: string;
    generatedAt: number;
    generatedFromEdgesUpTo: number;
    ownerUserId: Id<'users'>;
  },
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
