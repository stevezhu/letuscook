import { ConvexError, v } from 'convex/values';

import { query } from './_generated/server.js';

export const getSuggestion = query({
  args: { captureId: v.id('captures') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', identity.subject),
      )
      .unique();
    if (!user) return null;

    const capture = await ctx.db.get(args.captureId);
    if (!capture || capture.ownerUserId !== user._id)
      throw new ConvexError('Unauthorized');

    const suggestion = await ctx.db
      .query('suggestions')
      .withIndex('by_capture_status', (q) =>
        q.eq('captureId', args.captureId).eq('status', 'pending'),
      )
      .first();
    if (!suggestion) return null;

    const suggestor = await ctx.db.get(suggestion.suggestorUserId);

    return {
      suggestion,
      suggestor: suggestor
        ? {
            displayName: suggestor.displayName,
            userType: suggestor.userType,
            agentProvider: suggestor.agentProvider,
          }
        : null,
    };
  },
});
