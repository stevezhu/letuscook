import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions';
import { ConvexError } from 'convex/values';

import { Doc } from './_generated/dataModel.js';
import {
  mutation,
  query,
  // Re-export internal builders unchanged
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server.js';

/**
 * Resolves the authenticated user from WorkOS identity.
 * Shared by both userQuery and userMutation.
 */
async function getAuthenticatedUser(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: any;
}): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q: any) =>
      q.eq('workosUserId', identity.subject),
    )
    .unique();
}

/**
 * Query builder that adds `ctx.user` (authenticated user doc).
 * Returns `null` for unauthenticated/unknown users — callers must
 * handle the null case by returning their own fallback.
 */
export const userQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return { user };
  }),
);

/**
 * Mutation builder that adds `ctx.user` (authenticated user doc).
 * Throws ConvexError if not authenticated or user not found.
 */
export const userMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) throw new ConvexError('Not authenticated');
    return { user };
  }),
);

// Re-export internal builders for convenience
export { internalAction, internalMutation, internalQuery };
