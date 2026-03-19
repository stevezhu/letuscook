import { v } from 'convex/values';

import { getDocOwnedByCurrentUser } from '#convex/model/users.ts';
import { authQuery } from '#convex/utils/customFunctions.ts';

export const getSuggestion = authQuery({
  args: { captureId: v.id('captures') },
  handler: async (ctx, args) => {
    const capture = await getDocOwnedByCurrentUser(
      ctx,
      'captures',
      args.captureId,
    );
    if (!capture) return null;

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
