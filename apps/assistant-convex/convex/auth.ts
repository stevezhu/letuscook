import { AuthKit, type AuthFunctions } from '@convex-dev/workos-authkit';

import { components, internal } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';
import { query } from './_generated/server.js';

// Get a typed object of internal Convex functions exported by this file
const authFunctions: AuthFunctions = internal.auth;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
});

export const { authKitEvent } = authKit.events({
  'user.created': async (ctx, event) => {
    // TODO: remove duplicate fields
    await ctx.db.insert('users', {
      workosUserId: event.data.id,
      email: event.data.email,
      displayName: `${event.data.firstName} ${event.data.lastName}`.trim(),
      userType: 'human',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
  'user.updated': async (ctx, event) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', event.data.id),
      )
      .unique();
    if (!user) {
      console.warn(`User not found: ${event.data.id}`);
      return;
    }
    await ctx.db.patch(user._id, {
      email: event.data.email,
      displayName: `${event.data.firstName} ${event.data.lastName}`.trim(),
      updatedAt: Date.now(),
    });
  },
  'user.deleted': async (ctx, event) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) =>
        q.eq('workosUserId', event.data.id),
      )
      .unique();
    if (!user) {
      console.warn(`User not found: ${event.data.id}`);
      return;
    }
    await ctx.db.delete(user._id);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx, _args) => {
    const user = await authKit.getAuthUser(ctx);
    return user;
  },
});
