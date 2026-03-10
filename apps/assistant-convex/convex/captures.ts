import { v } from 'convex/values';

import { internal } from './_generated/api.js';
import { internalAction, mutation } from './_generated/server.js';

export const migrateGuestCaptures = mutation({
  args: {
    captures: v.array(
      v.object({
        id: v.string(),
        rawContent: v.string(),
        captureType: v.union(
          v.literal('text'),
          v.literal('link'),
          v.literal('task'),
        ),
        capturedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', identity.subject),
      )
      .unique();
    if (!user) throw new Error('User not found');

    const now = Date.now();
    const captureIds = await Promise.all(
      args.captures.map((capture) =>
        ctx.db.insert('captures', {
          rawContent: capture.rawContent,
          captureType: capture.captureType,
          capturedAt: capture.capturedAt,
          updatedAt: now,
          ownerUserId: user._id,
          captureState: 'processing',
          explicitMentionNodeIds: [],
        }),
      ),
    );
    await Promise.all(
      captureIds.map((captureId) =>
        ctx.scheduler.runAfter(0, internal.captures.processCapture, {
          captureId,
        }),
      ),
    );

    return { migrated: args.captures.length };
  },
});

export const processCapture = internalAction({
  args: {
    captureId: v.id('captures'),
  },
  handler: async (_ctx, args) => {
    // T5: replace with real AI processing
    console.log('[processCapture] stub — captureId:', args.captureId);
  },
});
