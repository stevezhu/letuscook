import { AuthKit, type AuthFunctions } from '@convex-dev/workos-authkit';

import { components, internal } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';

/**
 * Internal auth function reference used by AuthKit for token verification
 * and session management.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
const authFunctions: AuthFunctions = internal.auth;

/**
 * AuthKit instance configured with the WorkOS AuthKit component.
 * Provides authentication utilities including user retrieval and event handling.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
});

/**
 * WorkOS AuthKit webhook event handlers for user lifecycle events.
 * Syncs WorkOS user data to the local `users` table on create, update, and delete.
 *
 * 👀 Needs Verification
 */
export const { authKitEvent } = authKit.events({
  'user.created': async (ctx, event) => {
    // TODO: remove duplicate fields?
    // do we really have to save duplicate information in both tables?
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
