import { AuthKit, type AuthFunctions } from '@convex-dev/workos-authkit';
import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions';
import {
  DocumentByName,
  TableNamesInDataModel,
  UserIdentity,
} from 'convex/server';
import { ConvexError } from 'convex/values';
import { ConditionalPick } from 'type-fest';

import { components, internal } from './_generated/api.js';
import type { DataModel, Doc, Id } from './_generated/dataModel.js';
import { mutation, query, QueryCtx, MutationCtx } from './_generated/server.js';

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
const authFunctions: AuthFunctions = internal.auth;

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
});

/**
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

/**
 * Resolves the user document using the user id from the JWT claims.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
async function getUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q) =>
      q.eq('workosUserId', identity.subject),
    )
    .unique();
}

type OwnedDataModel = ConditionalPick<
  DataModel,
  { document: { ownerUserId: Id<'users'> } }
>;

type GetDocOwnedByCurrentUserParameters = {
  [K in keyof OwnedDataModel]: [K, OwnedDataModel[K]['document']['_id']];
}[keyof OwnedDataModel];

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 *
 * TODO: this can be exported when we need to use it elsewhere
 */
type AuthCtx = {
  identity: UserIdentity;
  // TODO: need to think over this more, but the current idea is that we use `getAuthKitUser()`
  // for basic user information and we use `getCurrentUser()` for extra information other than what
  // authkit stores. we could eventually create a function that merges the two and abstracts away
  // the difference.
  getAuthKitUser: () => ReturnType<typeof authKit.getAuthUser>;
  getCurrentUser: () => Promise<Doc<'users'> | null>;
  getDocOwnedByCurrentUser<T extends GetDocOwnedByCurrentUserParameters>(
    ...args: T
  ): Promise<DocumentByName<OwnedDataModel, T[0]> | null>;
};

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
const authCustomCtx = customCtx<QueryCtx | MutationCtx, AuthCtx>(
  async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Not authenticated');

    return {
      identity,
      getAuthKitUser: () => authKit.getAuthUser(ctx),
      getCurrentUser: () => getUser(ctx),
      getDocOwnedByCurrentUser: async (...args) => {
        const [user, doc] = await Promise.all([
          getUser(ctx),
          ctx.db.get(args[0], args[1]),
        ]);

        if (!doc || doc.ownerUserId !== user?._id) {
          // TODO: null might be better than throwing an error? since null is the equivalent
          return null;
        }
        return doc;
      },
    };
  },
);

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export const authQuery = customQuery(query, authCustomCtx);

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export const authMutation = customMutation(mutation, authCustomCtx);
