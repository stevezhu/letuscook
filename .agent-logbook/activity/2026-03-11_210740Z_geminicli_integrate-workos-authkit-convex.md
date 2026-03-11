---
date: 2026-03-11T21:07:40Z
type: activity
status: complete
agent: geminicli
models: [gemini-3.1-pro-preview, gemini-3-flash-preview]
branch: workos-authkit
sessionId: 5b964fdf-66e3-471c-8f12-2264289bb4ec
tags: [auth, workos, convex, webhooks]
filesModified: [apps/assistant-convex/convex/convex.config.ts, apps/assistant-convex/convex/auth.ts, apps/assistant-convex/convex/http.ts, apps/assistant-convex/convex/users.ts]
relatedPlan: plans/2026-03-10_210808Z_geminicli_integrate-workos-authkit.md
---

# Activity: Integrate WorkOS AuthKit to Sync Users into Convex

## Objective

Integrate the `@convex-dev/workos-authkit` component to automatically sync users from WorkOS AuthKit to the Convex `users` table via webhooks, and remove legacy client-side sync logic.

## Work Performed

- **Installed Dependency**: Added `@convex-dev/workos-authkit` to `apps/assistant-convex/package.json`.
- **Registered Component**: Created `apps/assistant-convex/convex/convex.config.ts` to use the `workOSAuthKit` component.
- **Implemented Webhook Logic**: 
    - Created `apps/assistant-convex/convex/auth.ts` to define handlers for `user.created`, `user.updated`, and `user.deleted`.
    - Integrated these handlers with the custom `users` table to maintain data parity (mapping `event.data.id` to `workosUserId`).
- **Exposed Webhook Routes**: Created `apps/assistant-convex/convex/http.ts` and registered the AuthKit routes using `authKit.registerRoutes(http)`.
- **Refactored Users Module**: Removed the `createOrUpdateUser` mutation in `apps/assistant-convex/convex/users.ts` to shift authentication truth to the backend webhook flow.
- **Fixed Deployment Blocker**: Enforced `WORKOS_WEBHOOK_SECRET` environment variable setting after `npx convex codegen` failed during the push phase due to missing environment configuration. Used a dummy secret to unblock code generation.
- **Code Quality**: Formatted files with `oxfmt` and performed a full TypeScript type check across the Convex application.

## Outcome

The Convex backend is now configured to receive webhooks from WorkOS AuthKit. User creation, updates, and deletions in WorkOS will automatically propagate to the Convex `users` table. The legacy client-side sync mutation has been removed, improving security and data integrity.

## Next Steps

- [ ] User to update `WORKOS_WEBHOOK_SECRET` in Convex with the real value from the WorkOS Dashboard.
- [ ] User to complete the "Sign In" flow in the mobile app simulator to verify end-to-end redirection and data synchronization.
- [ ] Monitor Convex logs for successful webhook arrivals (`/workos/webhook`).

## Session Stats

geminicli Session Stats: 5b964fdf-66e3-471c-8f12-2264289bb4ec
========================================
Models Used:  gemini-3.1-pro-preview, gemini-3-flash-preview
Files Found:  2
----------------------------------------
TOKEN USAGE:
  Input Tokens         273,908
  Output Tokens        3,552
  Cached Tokens        1,045,472
  Thoughts Tokens      7,803
  Tool Tokens          0
----------------------------------------
GRAND TOTAL TOKENS:  1,330,735
========================================

## References

- [WorkOS AuthKit Component README](https://github.com/get-convex/workos-authkit)
- [Convex AuthKit Guide](https://docs.convex.dev/auth/authkit/)
