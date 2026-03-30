import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions';
import { UserIdentity } from 'convex/server';
import { ConvexError } from 'convex/values';

import {
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from '#convex/_generated/server.js';

/** ✅ Reviewed by [@stevezhu](https://github.com/stevezhu) */
export type AuthCtx = {
  /** The verified {@link UserIdentity} from the JWT. */
  identity: UserIdentity;
};

/**
 * Custom context builder that requires authentication and provides
 * {@link AuthCtx}. Throws a {@link ConvexError} if the caller is not
 * authenticated.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
const authCustomCtx = customCtx<QueryCtx | MutationCtx, AuthCtx>(
  async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Unauthenticated');
    return {
      identity,
    };
  },
);

/**
 * Authenticated query wrapper. Use instead of `query` to ensure the caller is
 * authenticated and to access {@link AuthCtx} on `ctx`.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export const authQuery = customQuery(query, authCustomCtx);

/**
 * Authenticated mutation wrapper. Use instead of `mutation` to ensure the
 * caller is authenticated and to access {@link AuthCtx} on `ctx`.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export const authMutation = customMutation(mutation, authCustomCtx);
