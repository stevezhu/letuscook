---
date: 2026-03-13T17:06:57Z
type: research
status: done
agent: geminicli
models: [gemini-3-auto]
branch: t4
tags: [auth, convex, workos]
---

# Convex Auth vs. WorkOS AuthKit Differences

## Summary

In the `assistant-convex` codebase, there are two ways to retrieve the user's identity: native Convex `ctx.auth.getUserIdentity()` and WorkOS-specific `authKit.getAuthUser(ctx)`. The former is used to bridge to the local database, while the latter is for direct profile access.

## Question

What's the difference between `authKit.getAuthUser()` used in `auth.ts` and `ctx.auth.getUserIdentity()` used in `functions.ts`?

## Findings

### `ctx.auth.getUserIdentity()` (Native Convex)

- **Source**: Standard Convex API.
- **Functionality**: Extracts identity from the JWT in the `Authorization` header.
- **Return Type**: `UserIdentity` object (OIDC standard fields).
- **Project Usage**: Used in `getAuthenticatedUser` (within `functions.ts`) to lookup the local user record (`Doc<'users'>`) by matching `identity.subject` against the `workosUserId` field.
- **Primary Use Case**: When you need the local application's user record (Convex ID, user type, etc.) to perform database operations with foreign keys.

### `authKit.getAuthUser(ctx)` (WorkOS AuthKit)

- **Source**: `@convex-dev/workos-authkit` library.
- **Functionality**: Interacts with the WorkOS AuthKit component.
- **Return Type**: WorkOS-specific user profile (includes fields like `firstName`, `lastName`, etc.).
- **Project Usage**: Used in `api.auth.getCurrentUser` to return the full WorkOS profile.
- **Primary Use Case**: When you need raw profile details from WorkOS or need to verify the session status according to the AuthKit component.

## Recommendation

For most application logic (e.g., creating captures, nodes, edges), use the **`authQuery`** or **`authMutation`** builders defined in `functions.ts`. These automatically resolve the local `users` table record (`ctx.user`) using `ctx.auth.getUserIdentity()`. Only use `authKit.getAuthUser(ctx)` if you specifically need the external WorkOS profile data.

## References

- [Convex User Identity Documentation](https://docs.convex.dev/auth/database-auth)
- [WorkOS AuthKit for Convex](https://github.com/convex-dev/workos-authkit)
- `apps/assistant-convex/convex/functions.ts`
- `apps/assistant-convex/convex/auth.ts`
