---
date: 2026-03-10T21:08:08Z
type: plan
status: complete
agent: geminicli
models: [gemini-3.1-pro-preview]
branch: main
sessionId: 09befba9-3569-4fdc-8b87-29d0939eb639
tags: [auth, workos, convex]
---

# Plan: Integrate WorkOS AuthKit to Sync Users into Convex

## Goal

Integrate `@convex-dev/workos-authkit` so that users are automatically synced from WorkOS AuthKit to the custom Convex `users` table.

## Steps

### Step 1. Install the WorkOS AuthKit Component

- **Action**: Install the `@convex-dev/workos-authkit` package within the `apps/assistant-convex` application.

### Step 2. Configure the Convex App Component

- **Action**: Create `apps/assistant-convex/convex/convex.config.ts`.
- **Details**: Register the WorkOS component into the Convex backend so it can expose its webhook handlers and tables.

### Step 3. Setup the AuthClient & Webhook Handlers

- **Action**: Create `apps/assistant-convex/convex/auth.ts`.
- **Details**: Define event handlers for `user.created`, `user.updated`, and `user.deleted` to keep the custom `users` table in sync with WorkOS.

### Step 4. Register HTTP Webhook Routes

- **Action**: Create `apps/assistant-convex/convex/http.ts`.
- **Details**: Expose the webhook endpoints that WorkOS will call via `authKit.registerRoutes(http)`.

### Step 5. Cleanup Existing Code

- **Action**: Modify `apps/assistant-convex/convex/users.ts`.
- **Details**: Deprecate or remove the client-called `createOrUpdateUser` mutation since synchronization will now happen securely on the backend via webhooks.

### Step 6. Environment Setup

Once the code changes are pushed to the Convex environment:

1. Go to the **WorkOS Dashboard > Webhooks**.
2. Create a webhook pointing to: `https://<your-convex-deployment-url>.convex.site/workos/webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`.
4. Copy the provided Webhook Secret.
5. In your project, securely set the variable: `npx convex env set WORKOS_WEBHOOK_SECRET=<your-webhook-secret>`

## References

- [WorkOS AuthKit Component README](../temp/workos-authkit-readme.md)
