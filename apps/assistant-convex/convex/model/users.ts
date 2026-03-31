import { CustomCtx } from 'convex-helpers/server/customFunctions';
import { DocumentByName } from 'convex/server';
import { ConditionalPick } from 'type-fest';

import { DataModel, Doc, Id } from '#convex/_generated/dataModel.js';
import { QueryCtx } from '#convex/_generated/server.js';
import { type authQuery } from '#convex/utils/customFunctions.ts';

/**
 * Resolves the user document using the user id from the JWT claims.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export async function getCurrentUser(
  ctx: CustomCtx<typeof authQuery>,
): Promise<Doc<'users'> | null> {
  return ctx.db
    .query('users')
    .withIndex('by_workos_user_id', (q) =>
      q.eq('workosUserId', ctx.identity.subject),
    )
    .unique();
}

/**
 * Subset of the data model containing only tables whose documents have an
 * `ownerUserId` field.
 */
type OwnedDataModel = ConditionalPick<
  DataModel,
  { document: { ownerUserId: Id<'users'> } }
>;

/**
 * Union of `[tableName, documentId]` tuples for all owned tables.
 *
 * The tuple keeps the table name and document ID correlated so that when
 * destructured in `authCustomCtx` (e.g. `ctx.db.get(args[0], args[1])`),
 * TypeScript narrows the ID type to match the specific table, ensuring the
 * returned document is correctly typed.
 */
type GetDocOwnedByCurrentUserParameters = {
  [K in keyof OwnedDataModel]: [K, OwnedDataModel[K]['document']['_id']];
}[keyof OwnedDataModel];

/**
 * Fetches a document only if it belongs to the current user.
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 *
 * @param ctx - The query context.
 * @param args - The table name and document ID.
 * @returns The document if it belongs to the current user, otherwise `null`.
 */
export async function getDocOwnedByCurrentUser<
  T extends GetDocOwnedByCurrentUserParameters,
>(
  ctx: CustomCtx<typeof authQuery>,
  ...args: T
): Promise<DocumentByName<OwnedDataModel, T[0]> | null> {
  const [table, id] = args;
  const [user, doc] = await Promise.all([
    getCurrentUser(ctx),
    ctx.db.get(table, id),
  ]);

  if (!doc || doc.ownerUserId !== user?._id) {
    return null;
  }
  return doc;
}

export async function getAgentUser(
  ctx: QueryCtx,
): Promise<Doc<'users'> | null> {
  return ctx.db
    .query('users')
    .withIndex('by_user_type', (q) => q.eq('userType', 'agent'))
    .first();
}
