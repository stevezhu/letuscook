import { v } from 'convex/values';

import { authQuery } from './functions.ts';
import { getDocOwnedByCurrentUser } from './model/users.ts';

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

    const suggestor = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', suggestion.suggestorUserId),
      )
      .unique();

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
