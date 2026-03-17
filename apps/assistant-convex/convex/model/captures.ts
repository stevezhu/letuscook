import { Id } from '../_generated/dataModel.js';
import { MutationCtx } from '../_generated/server.js';

export async function setCaptureFailed(
  ctx: MutationCtx,
  args: { captureId: Id<'captures'> },
) {
  await ctx.db.patch('captures', args.captureId, {
    captureState: 'failed',
    updatedAt: Date.now(),
  });
  return null;
}

export async function saveDraftSuggestion(
  ctx: MutationCtx,
  args: { captureId: Id<'captures'>; agentUserId: Id<'users'> },
) {
  const capture = await ctx.db.get(args.captureId);
  if (!capture) return null;

  const now = Date.now();
  const title = `[Draft] ${capture.rawContent.slice(0, 60)}`;

  const draftNodeId = await ctx.db.insert('nodes', {
    title,
    content: capture.rawContent,
    searchText: `${title}\n\n${capture.rawContent}`,
    ownerUserId: capture.ownerUserId,
    sourceCaptureId: args.captureId,
    createdAt: now,
    updatedAt: now,
  });

  await Promise.all(
    capture.explicitMentionNodeIds.map((mentionedNodeId) =>
      ctx.db.insert('edges', {
        fromNodeId: draftNodeId,
        toNodeId: mentionedNodeId,
        edgeType: 'suggested',
        source: 'processor',
        verified: false,
        createdAt: now,
      }),
    ),
  );

  await ctx.db.insert('suggestions', {
    captureId: args.captureId,
    suggestorUserId: args.agentUserId,
    suggestedNodeId: draftNodeId,
    status: 'pending',
    createdAt: now,
  });

  await ctx.db.patch('captures', args.captureId, {
    captureState: 'ready',
    updatedAt: now,
  });

  return null;
}
