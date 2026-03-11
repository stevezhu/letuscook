import { query } from './_generated/server.js';

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', identity.subject),
      )
      .unique();
  },
});
