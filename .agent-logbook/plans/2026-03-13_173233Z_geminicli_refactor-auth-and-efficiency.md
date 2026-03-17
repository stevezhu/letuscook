---
date: 2026-03-13T17:32:33Z
type: plan
status: in-progress
agent: geminicli
models: [unknown]
branch: t4
---

# Plan: Refactor Auth and Improve Efficiency

Refactor authentication logic to consolidate into `auth.ts`, enforce authentication in `authQuery`, and optimize for efficiency by using WorkOS IDs from the identity context for ownership.

## Goals

1.  **Consolidate Auth**: Move `authQuery`, `authMutation`, and `getAuthenticatedUser` from `functions.ts` to `auth.ts`.
2.  **Enforce Auth in Queries**: Update `authQuery` to throw `ConvexError` if unauthenticated, matching `authMutation` behavior.
3.  **Optimize for Efficiency**:
    - Pass `userId` (WorkOS ID) directly in the custom context.
    - Update schema to use WorkOS ID (`v.string()`) for ownership instead of Convex internal IDs.
    - Update all handlers to use `ctx.userId` instead of performing a DB lookup for the user doc unless metadata is required.

## Proposed Steps

### 1. Update `auth.ts`

- Move builders and helpers from `functions.ts`.
- Update `authQuery` and `authMutation` to throw if `identity` is null.
- Add `userId: identity.subject` to the custom context.
- Export `getAuthenticatedUser` for cases where the full doc is still needed.

### 2. Update `schema.ts`

- Change `ownerUserId` from `v.id('users')` to `v.string()` in `captures`, `nodes`, and `suggestions`.
- Update relevant indexes.
- _Note: This is a breaking change for existing data, but assumed acceptable for current development phase._

### 3. Update handlers

- In `captures.ts`, `nodes.ts`, `edges.ts`, `suggestions.ts`, `search.ts`:
  - Use `ctx.userId` for filtering and ownership checks.
  - Remove calls to `getAuthenticatedUser(ctx)` where only the ID was used.

### 4. Finalize

- Remove `functions.ts`.
- Run lint and fix.

## Verification Strategy

- Ensure all files import from `./auth.ts` instead of `./functions.ts`.
- Verify that unauthenticated calls to `authQuery` now throw instead of returning `null`.
- Confirm that queries use the WorkOS ID (`v.string()`) correctly.
