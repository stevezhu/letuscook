import { v } from 'convex/values';

import { internal } from './_generated/api.js';
import { internalAction, mutation } from './_generated/server.js';

/**
 * Bulk migrates offline guest captures to the authenticated user's account.
 * This is called automatically when an unauthenticated user signs in.
 *
 * It performs a bulk insert of all guest captures and schedules them
 * for asynchronous processing (e.g. AI analysis) in the background.
 */
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
    // 1. Verify the user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // 2. Look up the internal user record using the WorkOS subject ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', identity.subject),
      )
      .unique();
    if (!user) throw new Error('User not found');

    const now = Date.now();

    // 3. Insert all guest captures into the database sequentially via Promise.all
    const captureIds = await Promise.all(
      args.captures.map((capture) =>
        ctx.db.insert('captures', {
          rawContent: capture.rawContent,
          captureType: capture.captureType,
          capturedAt: capture.capturedAt,
          updatedAt: now,
          ownerUserId: user._id,
          // Set initial state to processing since it hasn't been handled by AI yet
          captureState: 'processing',
          explicitMentionNodeIds: [],
        }),
      ),
    );

    // 4. Schedule background jobs to process each newly inserted capture
    // TODO: check that this is valid for adding to queue
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

/**
 * Internal action to process a single capture.
 * This will eventually contain the AI processing pipeline.
 */
export const processCapture = internalAction({
  args: {
    captureId: v.id('captures'),
  },
  handler: async (_ctx, args) => {
    // T5: replace with real AI processing
    console.log('[processCapture] stub — captureId:', args.captureId);
  },
});
