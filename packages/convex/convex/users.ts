import { v } from 'convex/values';

import { mutation, query } from './_generated/server.js';

export const createOrUpdateUser = mutation({
  args: {
    workosUserId: v.string(),
    displayName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', args.workosUserId),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        email: args.email,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert('users', {
      workosUserId: args.workosUserId,
      displayName: args.displayName,
      email: args.email,
      userType: 'human',
      createdAt: now,
      updatedAt: now,
    });
  },
});

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
