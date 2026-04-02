import { v } from 'convex/values';

import { internalMutation } from '#convex/_generated/server.js';
import { authMutation, authQuery } from '#model/customFunctions.ts';
import { getCurrentUser } from '#model/users.ts';

// 👀 Needs Verification
export const logToolRequest = internalMutation({
  args: {
    description: v.string(),
    domain: v.optional(v.string()),
    ownerUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('toolRequests')
      .withIndex('by_owner_status', (q) =>
        q.eq('ownerUserId', args.ownerUserId).eq('status', 'open'),
      )
      .filter((q) => q.eq(q.field('domain'), args.domain))
      .first();

    if (existing) {
      await ctx.db.patch('toolRequests', existing._id, {
        frequency: existing.frequency + 1,
      });
    } else {
      await ctx.db.insert('toolRequests', {
        description: args.description,
        domain: args.domain,
        frequency: 1,
        status: 'open',
        createdAt: Date.now(),
        ownerUserId: args.ownerUserId,
      });
    }
  },
});

// 👀 Needs Verification
export const getToolRequests = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const requests = await ctx.db
      .query('toolRequests')
      .withIndex('by_owner_status', (q) =>
        q.eq('ownerUserId', user._id).eq('status', 'open'),
      )
      .collect();

    requests.sort((a, b) => b.frequency - a.frequency);
    return requests;
  },
});

// 👀 Needs Verification
export const dismissToolRequest = authMutation({
  args: { toolRequestId: v.id('toolRequests') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const request = await ctx.db.get(args.toolRequestId);
    if (!request || request.ownerUserId !== user._id) return null;

    await ctx.db.patch('toolRequests', args.toolRequestId, {
      status: 'dismissed',
    });

    return null;
  },
});
