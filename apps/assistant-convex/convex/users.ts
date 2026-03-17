import { internalQuery } from './_generated/server.js';

export const getAgentUserInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('users')
      .withIndex('by_user_type', (q) => q.eq('userType', 'agent'))
      .first();
  },
});
