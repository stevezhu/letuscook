---
date: 2026-03-03T20:47:20Z
type: activity
status: complete
agent: claudecode
models: [claude-sonnet-4-6]
branch: t2
files_modified:
  - apps/assistant-convex/package.json
  - apps/assistant-mobile/package.json
  - apps/assistant-mobile/src/components/user-sync.tsx
  - pnpm-lock.yaml
---

# Rename and Move Convex Package

## Summary

Renamed the Convex backend package from `packages/assistant-convex` (`@workspace/assistant-convex`) to `apps/assistant-convex` (`assistant-convex`).

## Context

The Convex backend is an application rather than a shared library, so it belongs under `apps/` rather than `packages/`. The package name was also simplified from a scoped `@workspace/` name to a plain `assistant-convex`.

## Work Performed

1. Moved directory: `packages/assistant-convex` → `apps/assistant-convex`
2. Updated package name in `apps/assistant-convex/package.json`: `@workspace/assistant-convex` → `assistant-convex`
3. Updated dependency in `apps/assistant-mobile/package.json`: `"@workspace/assistant-convex": "workspace:*"` → `"assistant-convex": "workspace:*"`
4. Updated import in `apps/assistant-mobile/src/components/user-sync.tsx`: `from '@workspace/assistant-convex/convex/_generated/api'` → `from 'assistant-convex/convex/_generated/api'`
5. Ran `pnpm install` to regenerate the lockfile — succeeded.

## Outcome

Package is now located at `apps/assistant-convex` with the name `assistant-convex`. All references updated and lockfile regenerated successfully.

**Note:** This package went through two renames in the same session:
- `packages/convex` (`@workspace/convex`) → `packages/assistant-convex` (`@workspace/assistant-convex`) → `apps/assistant-convex` (`assistant-convex`)
