import { internalQuery, authQuery } from './functions.ts';

export const getCurrentUser = authQuery({
  handler: async (ctx) => {
    return ctx.user;
  },
});

export const getAgentUserInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('users')
      .withIndex('by_user_type', (q) => q.eq('userType', 'agent'))
      .first();
  },
});
