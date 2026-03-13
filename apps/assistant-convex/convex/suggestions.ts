import { ConvexError, v } from 'convex/values';

import { authQuery } from './functions.ts';

export const getSuggestion = authQuery({
  args: { captureId: v.id('captures') },
  handler: async (ctx, args) => {
    if (!ctx.user) return null;

    const capture = await ctx.db.get(args.captureId);
    if (!capture || capture.ownerUserId !== ctx.user._id)
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
