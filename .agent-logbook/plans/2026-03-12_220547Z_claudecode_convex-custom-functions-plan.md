---
date: 2026-03-12T22:05:47Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: t4
sessionId: fa4deec3-d466-4aa0-9662-4f17e02a7815
tags: [convex, auth, custom-functions, refactor]
---

# Apply convex-helpers `customFunction` Pattern to assistant-convex

## Goal

Eliminate duplicated auth boilerplate across all public Convex functions in `apps/assistant-convex/convex/` by introducing `customQuery` and `customMutation` wrappers from `convex-helpers/server/customFunctions`. Every public function currently repeats 6-8 lines of identity lookup + user resolution. This refactor centralizes that into reusable, type-safe function builders.

## Scope

### In scope

- Create a `convex/functions.ts` file exporting custom function builders (`userQuery`, `userMutation`)
- Refactor all public `query(...)` calls to use `userQuery`
- Refactor all public `mutation(...)` calls to use `userMutation`
- Add ESLint rule to prevent direct imports of `query`/`mutation` from `_generated/server`
- Preserve existing behavior: queries return `null`/`[]` for unauthenticated users; mutations throw `ConvexError`

### NOT in scope

- Internal functions (`internalQuery`, `internalMutation`, `internalAction`) — these don't use auth
- Row-level security / database wrapping — not currently used
- `customAction` — no public actions exist
- Changing any business logic

## Current State

### Auth pattern (repeated 17 times across 5 files)

**Mutation pattern** (throws on failure — 11 occurrences):

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new ConvexError('Not authenticated');

const user = await ctx.db
  .query('users')
  .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
  .unique();
if (!user) throw new ConvexError('User not found');
```

**Query pattern** (returns fallback on failure — 6 occurrences):

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) return null; // or []

const user = await ctx.db
  .query('users')
  .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
  .unique();
if (!user) return null; // or []
```

### Affected functions by file

| File             | Function                | Type     | Auth pattern                    |
| ---------------- | ----------------------- | -------- | ------------------------------- |
| `captures.ts`    | `migrateGuestCaptures`  | mutation | throws                          |
| `captures.ts`    | `createCapture`         | mutation | throws                          |
| `captures.ts`    | `updateCapture`         | mutation | throws                          |
| `captures.ts`    | `acceptSuggestion`      | mutation | throws                          |
| `captures.ts`    | `rejectSuggestion`      | mutation | throws                          |
| `captures.ts`    | `organizeCapture`       | mutation | throws                          |
| `captures.ts`    | `archiveCapture`        | mutation | throws                          |
| `captures.ts`    | `unarchiveCapture`      | mutation | throws                          |
| `captures.ts`    | `retryProcessing`       | mutation | throws                          |
| `captures.ts`    | `getCapture`            | query    | returns null                    |
| `captures.ts`    | `getInboxCaptures`      | query    | returns []                      |
| `captures.ts`    | `getRecentCaptures`     | query    | returns []                      |
| `captures.ts`    | `getArchivedItems`      | query    | returns {captures:[], nodes:[]} |
| `nodes.ts`       | `archiveNode`           | mutation | throws                          |
| `nodes.ts`       | `unarchiveNode`         | mutation | throws                          |
| `nodes.ts`       | `getKnowledgeBasePages` | query    | returns []                      |
| `nodes.ts`       | `getNodeWithEdges`      | query    | returns null                    |
| `edges.ts`       | `createEdge`            | mutation | throws                          |
| `search.ts`      | `searchGlobal`          | query    | returns []                      |
| `search.ts`      | `searchNodesForLinking` | query    | returns []                      |
| `suggestions.ts` | `getSuggestion`         | query    | returns null                    |
| `users.ts`       | `getCurrentUser`        | query    | custom (no user lookup)         |

**Note:** `users.ts:getCurrentUser` is unique — it returns the user doc directly without the secondary user lookup, so it stays as a plain `query`.

## Steps

### Step 1: Create `convex/functions.ts`

Create the custom function builders file:

```typescript
import { ConvexError } from 'convex/values';
import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions';

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
```

**Design decision:** `userQuery` provides `ctx.user` as `Doc<'users'> | null` (callers decide fallback), while `userMutation` throws on auth failure (consistent with current behavior). This avoids needing two query variants.

### Step 2: Refactor `captures.ts`

- Change import from `'./_generated/server.js'` to `'./functions.js'` for `query` → `userQuery`, `mutation` → `userMutation`
- Keep `internalQuery`, `internalMutation`, `internalAction` imports from `'./functions.js'` (re-exported)
- For each public mutation: remove auth boilerplate, use `ctx.user` (already guaranteed non-null)
- For each public query: remove auth boilerplate, add early return guard `if (!ctx.user) return <fallback>`
- Replace `user._id` → `ctx.user._id` and `user` → `ctx.user` throughout

**Example before:**

```typescript
export const createCapture = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError('Not authenticated');
    const user = await ctx.db.query('users').withIndex(...).unique();
    if (!user) throw new ConvexError('User not found');
    // ... use user._id
  },
});
```

**Example after:**

```typescript
export const createCapture = userMutation({
  args: { ... },
  handler: async (ctx, args) => {
    // ctx.user is guaranteed non-null by userMutation
    // ... use ctx.user._id
  },
});
```

### Step 3: Refactor `nodes.ts`

- Same import change pattern
- 2 mutations → `userMutation` (remove 8 lines each)
- 2 queries → `userQuery` (remove 8 lines each, add `if (!ctx.user)` guard)

### Step 4: Refactor `edges.ts`

- 1 mutation → `userMutation` (remove 8 lines)

### Step 5: Refactor `search.ts`

- 2 queries → `userQuery` (remove 8 lines each)

### Step 6: Refactor `suggestions.ts`

- 1 query → `userQuery` (remove 8 lines)

### Step 7: Leave `users.ts` and `auth.ts` unchanged

- `getCurrentUser` has a unique pattern (returns the user doc itself, no secondary lookup)
- `auth.ts` uses internal functions and event handlers
- These don't benefit from the custom function pattern

### Step 8: Add ESLint rule (optional, recommended)

Add to the ESLint config a `no-restricted-imports` rule to prevent direct imports of `query`/`mutation` from `_generated/server` in convex function files:

```typescript
"no-restricted-imports": [
  "error",
  {
    patterns: [
      {
        group: ["*/_generated/server"],
        importNames: ["query", "mutation"],
        message: "Use userQuery/userMutation from './functions.js' instead",
      },
    ],
  },
],
```

**Exception:** `convex/functions.ts` itself needs the raw imports.

### Step 9: Verify

- Run `pnpm run lint:fix` and `pnpm -w run lint`
- Run `pnpm -w run test`
- Verify TypeScript compilation with `pnpm -w run build` or `pnpx tsc --noEmit` in the convex app

## Open Questions

1. **Query null handling:** Some queries return `[]`, some return `null`, one returns `{ captures: [], nodes: [] }`. The `userQuery` approach with `ctx.user: Doc | null` means each handler still decides its own fallback. An alternative would be separate `userQuery` (throws) vs `optionalUserQuery` (nullable), but that adds complexity for minimal gain. **Recommendation:** Keep single `userQuery` with nullable `ctx.user`.

2. **`migrateGuestCaptures` uses `new Error()` not `new ConvexError()`:** This is the only mutation using plain `Error` for auth. After refactoring it will throw `ConvexError` via `userMutation` — a minor behavior change that's actually more correct. **Recommendation:** Accept this change.

3. **ESLint rule scope:** Should the `no-restricted-imports` rule apply only to `apps/assistant-convex/convex/` or project-wide? Since only the convex app imports from `_generated/server`, scoping it there is cleaner. **Recommendation:** Apply to the convex app's ESLint config specifically.

## References

- [Customizing serverless functions without middleware](https://stack.convex.dev/custom-functions) — Article by Ian Macartney explaining the pattern
- [convex-helpers source](https://github.com/get-convex/convex-helpers) — `packages/convex-helpers/server/customFunctions.ts`
- Local fork: `~/Development/forks/convex-helpers`

## Session Stats

```
claudecode Session Stats: fa4deec3-d466-4aa0-9662-4f17e02a7815
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         32
  Output Tokens        2,058
  Cache Creation Input 82,440
  Cache Read Input     647,135
----------------------------------------
SUBAGENTS (2 total):
  Input Tokens         2,284
  Output Tokens        7,476
  Cache Creation Input 249,669
  Cache Read Input     1,698,128
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   2,316
  Total Output Tokens  9,534
  Total Cache Creation 332,109
  Total Cache Read     2,345,263
----------------------------------------
GRAND TOTAL TOKENS:  2,689,222
========================================
```
