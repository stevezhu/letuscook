import { internalMutation } from '#convex/_generated/server.js';

export const seedAgentUser = internalMutation({
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_user_type', (q) => q.eq('userType', 'agent'))
      .first();

    if (existing) {
      console.info('Agent user already exists, skipping seed.');
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert('users', {
      displayName: 'CookBot',
      userType: 'agent',
      agentProvider: 'google',
      // TODO: this isn't guaranteed since the agent can be configured to use a different model
      // this should be saved per request
      agentModel: 'gemini-2.5-flash',
      createdAt: now,
      updatedAt: now,
    });

    console.info('Agent user created:', id);
    return id;
  },
});
