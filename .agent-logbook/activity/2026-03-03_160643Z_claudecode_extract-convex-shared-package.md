---
date: 2026-03-03T16:06:43Z
type: activity
status: done
agent: claudecode
models: [claude-sonnet-4-6]
branch: t2
taskId: T2
cost: $0.00
tags: [convex, monorepo, refactor, packages]
filesModified:
  - packages/convex/package.json
  - packages/convex/.gitignore
  - packages/convex/.env.local
  - packages/convex/convex/schema.ts
  - packages/convex/convex/auth.config.ts
  - packages/convex/convex/users.ts
  - packages/convex/convex/scripts/seedAgentUser.ts
  - packages/convex/convex/tsconfig.json
  - apps/assistant-server/package.json
  - apps/assistant-server/tsconfig.json
  - apps/assistant-server/.env.local
  - apps/assistant-mobile/package.json
  - apps/assistant-mobile/src/components/user-sync.tsx
relatedPlan: plans/extract_convex_package_fa7d9970.plan.md
---

# Extract Convex into Shared Workspace Package

## Summary

Moved the Convex backend from `apps/assistant-server/convex/` into a new shared workspace package `@workspace/convex` at `packages/convex/`, following the pattern from the `turbo-expo-nextjs-clerk-convex-monorepo` reference. Updated the mobile app to import from the new package instead of `assistant-server`.

## Context

The Convex backend was co-located inside `apps/assistant-server/` alongside the Hono/Cloudflare Worker API. This was a coupling of two independent concerns — the Hono server never imported from Convex. The mobile app depended on `assistant-server` as a workspace package solely to access Convex generated types via `assistant-server/convex/_generated/api`. Splitting Convex into its own package makes the dependency graph cleaner and follows the reference monorepo pattern.

## Work Performed

### New package: `packages/convex/` (`@workspace/convex`)

- Created `package.json` with `convex` dependency, `exports` field exposing `./convex/_generated/*`, and `dev`/`setup`/`test` scripts.
- Added `@types/node` as a devDependency to resolve `process.env` type errors in `auth.config.ts` (the convex tsconfig doesn't include node types by default).
- Copied the entire `convex/` directory (schema, auth config, users mutations/queries, seed script, `_generated/`) from `assistant-server`.
- Created `.gitignore` to exclude `.env.local`.
- Created `.env.local` with `CONVEX_DEPLOYMENT` (moved from `assistant-server`).

### Cleaned up `apps/assistant-server/`

- Deleted the `convex/` directory.
- Removed `convex` from `dependencies`.
- Removed `convex:dev` script.
- Removed `./convex/_generated/*` entry from `exports`.
- Removed `"exclude": ["convex"]` from `tsconfig.json`.
- Removed `CONVEX_DEPLOYMENT` from `.env.local` (kept `VITE_CONVEX_*` vars for the Hono dev server).

### Updated `apps/assistant-mobile/`

- Replaced `"assistant-server": "workspace:*"` with `"@workspace/convex": "workspace:*"` in `package.json`.
- Updated import in `user-sync.tsx` from `'assistant-server/convex/_generated/api'` to `'@workspace/convex/convex/_generated/api'`.

## Outcome

- All lint checks pass (0 errors, 0 warnings).
- All tests pass: 10/10 packages, 2/2 mobile Jest tests.
- `pnpm install` updated the lockfile cleanly.
- The `convex dev` command should now be run from `packages/convex/` (or via `pnpm --filter @workspace/convex run dev`).
- Remaining setup: ensure `WORKOS_CLIENT_ID` is set in the Convex dashboard and `EXPO_PUBLIC_CONVEX_URL` is set in the mobile `.env`.
