import { internalMutation } from '#convex/_generated/server.js';

export const seedAgentUser = internalMutation({
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_user_type', (q) => q.eq('userType', 'agent'))
      .first();

    if (existing) {
      console.log('Agent user already exists, skipping seed.');
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert('users', {
      displayName: 'CookBot',
      userType: 'agent',
      agentProvider: 'openai',
      agentModel: 'gpt-4o',
      createdAt: now,
      updatedAt: now,
    });

    console.log('Agent user created:', id);
    return id;
  },
});
