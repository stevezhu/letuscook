import { pick } from 'convex-helpers';
import { v } from 'convex/values';

import { internalMutation } from '#convex/_generated/server.js';
import { toolRequestFields } from '#convex/schema.ts';
import { authMutation, authQuery } from '#model/customFunctions.ts';
import { logToolRequest as logToolRequest_ } from '#model/toolRequests.ts';
import { getCurrentUser } from '#model/users.ts';

// 👀 Needs Verification
export const logToolRequest = internalMutation({
  args: pick(toolRequestFields, ['description', 'domain', 'ownerUserId']),
  handler: async (ctx, args) => {
    await logToolRequest_(ctx, args);
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
