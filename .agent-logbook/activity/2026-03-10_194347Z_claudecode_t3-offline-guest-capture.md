---
date: 2026-03-10T19:43:47Z
type: activity
status: complete
agent: claudecode
models: [claude-sonnet-4-6]
branch: t3
sessionId: 4900f3cc-0855-4d13-9a37-4feb1a44682f
tags: [capture, offline, guest, migration, convex, async-storage]
filesModified:
  - apps/assistant-convex/convex/captures.ts
  - apps/assistant-convex/convex/_generated/api.d.ts
  - apps/assistant-mobile/package.json
  - apps/assistant-mobile/eslint.config.ts
  - apps/assistant-mobile/src/app/_layout.tsx
  - apps/assistant-mobile/src/app/(tabs)/capture.tsx
  - apps/assistant-mobile/src/modules/capture/guest-capture-types.ts
  - apps/assistant-mobile/src/modules/capture/use-guest-capture-store.ts
  - apps/assistant-mobile/src/modules/capture/use-migrate-guest-captures.ts
  - apps/assistant-mobile/src/modules/capture/capture-migration-provider.tsx
  - apps/assistant-mobile/src/modules/capture/__tests__/use-guest-capture-store.test.ts
relatedPlan: plans/2026-03-10_173354Z_claudecode_t3-offline-guest-capture.md
---

# T3: Offline Guest Capture Store and Migration

## Summary

Implemented an offline-first guest capture store for unauthenticated users, with automatic migration to Convex on sign-in. Guest captures are persisted locally via AsyncStorage, capped at 100 items, and bulk-migrated when the user authenticates.

## Context

Plan: `.agent-logbook/plans/2026-03-10_173354Z_claudecode_t3-offline-guest-capture.md`

PR: https://github.com/stevezhu/letuscook/pull/44

The feature enables new users to start capturing content immediately without signing in, with a seamless handoff to their Convex account on first authentication.

## Work Performed

### New files created

- **`guest-capture-types.ts`** — Shared types (`GuestCapture`, `CaptureType`, `GuestCaptureWithState`, `AddGuestCaptureResult`) and constants (`GUEST_CAPTURE_LIMIT = 100`, `GUEST_CAPTURES_STORAGE_KEY`).

- **`use-guest-capture-store.ts`** — AsyncStorage-backed store using `useSuspenseQuery` (staleTime: Infinity) for reads and `useMutation` for add/clear. Adds `captureState: 'offline'` via `useMemo` to avoid storing it in AsyncStorage.

- **`use-migrate-guest-captures.ts`** — TanStack `useMutation` wrapping `convex.mutation(api.captures.migrateGuestCaptures)`. On success, calls `clearGuestCaptures`.

- **`capture-migration-provider.tsx`** — Splits into `MigrationWatcher` (uses the hooks, detects `null→user` transition) and `CaptureMigrationProvider` (wraps MigrationWatcher in a `Suspense` boundary with `fallback={children}` so app renders immediately while storage loads). Shows a syncing banner while migration is pending.

- **`captures.ts`** (Convex) — `migrateGuestCaptures` mutation (bulk insert with `Promise.all`) + `processCapture` internal action stub. Fixed `no-await-in-loop` lint error by converting sequential awaits to `Promise.all`.

- **`__tests__/use-guest-capture-store.test.ts`** — 10 unit tests covering load-empty, add, clear, LIMIT_REACHED at 100, and adding exactly up to the limit. Tests the pure storage logic directly (not through the hook) to avoid `useSuspenseQuery` Suspense issues in RNTL `renderHook`.

### Modified files

- **`_layout.tsx`** — Added `<CaptureMigrationProvider>` wrapping the entire app tree inside `ConvexProviderWithAuth`.
- **`capture.tsx`** — Wrapped with `Suspense`, added limit-reached sign-in prompt for guest users.
- **`package.json`** — Added `@react-native-async-storage/async-storage` and `assistant-convex: workspace:*` dependencies.
- **`eslint.config.ts`** — Disabled `import/no-unresolved` to allow workspace package imports (TypeScript resolves them correctly but ESLint's resolver can't follow workspace symlinks).

### Convex codegen

Ran `pnpx convex codegen` after adding `captures.ts` to regenerate `_generated/api.d.ts` with the new `captures` module.

### Key decisions

- **`useSuspenseQuery` with `staleTime: Infinity`** — Load once from AsyncStorage and treat as stable. Mutations manually invalidate the query key.
- **Suspense fallback = children** — Provider renders children immediately during storage load rather than blocking the app with a spinner.
- **Test pure functions, not hooks** — `useSuspenseQuery` in `renderHook` with RNTL 14.0.0-beta.0 leaves `result.current` undefined during suspension. Tested the underlying storage logic directly to avoid the issue cleanly.
- **`import/no-unresolved: off`** — Workspace packages resolve correctly at runtime/typecheck but ESLint's import resolver fails on them. Disabled rather than adding complex resolver config.

### Blockers encountered

- `@react-native-async-storage/async-storage@3.0.1` required a native rebuild. User resolved by rebuilding the dev client.
- `useSuspenseQuery` in RNTL `renderHook` leaves `result.current` undefined during Suspense. Worked around by testing pure storage functions instead of the hook.

## Outcome

All tasks from the plan implemented and verified:

- ✅ `GuestCapture` types defined
- ✅ `useGuestCaptureStore` hook with AsyncStorage persistence and 100-item limit
- ✅ Convex `migrateGuestCaptures` mutation with `processCapture` stub
- ✅ `useMigrateGuestCaptures` hook
- ✅ `CaptureMigrationProvider` with sign-in transition detection
- ✅ `_layout.tsx` updated
- ✅ `capture.tsx` updated with limit-reached UI
- ✅ Unit tests (10 passing)
- ✅ App running clean on simulator, no errors

Follow-up (T5 per plan): Replace `processCapture` stub with real AI processing pipeline.

## Session Stats

```
claudecode Session Stats: 4900f3cc-0855-4d13-9a37-4feb1a44682f
========================================
Models Used:  claude-sonnet-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         234
  Output Tokens        35,995
  Cache Creation Input 567,819
  Cache Read Input     12,041,427
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   234
  Total Output Tokens  35,995
  Total Cache Creation 567,819
  Total Cache Read     12,041,427
----------------------------------------
GRAND TOTAL TOKENS:  12,645,475
========================================
```
