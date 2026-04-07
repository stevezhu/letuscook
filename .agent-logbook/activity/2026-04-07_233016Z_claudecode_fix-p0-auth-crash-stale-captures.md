---
date: 2026-04-07T23:30:16Z
type: activity
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: fix/p0-auth-crash-stale-captures
sessionId: b92bbc6a-28bc-4022-b063-6fd62186f454
tags: [auth, error-boundary, inbox, capture-pipeline]
filesModified:
  - apps/assistant-mobile/src/modules/auth/expo/auth-kit-client.ts
  - apps/assistant-mobile/src/components/boundaries/default-query-boundary.tsx
  - apps/assistant-mobile/src/components/boundaries/default-error-boundary.tsx
  - apps/assistant-mobile/src/components/boundaries/default-error-fallback.tsx
  - apps/assistant-mobile/src/app/knowledge/[nodeId].tsx
  - apps/assistant-mobile/src/app/(tabs)/knowledge.tsx
  - apps/assistant-convex/convex/captures.ts
  - apps/assistant-mobile/src/modules/inbox/inbox-types.ts
  - apps/assistant-mobile/src/modules/inbox/use-inbox-captures.ts
  - apps/assistant-mobile/src/modules/inbox/components/state-pill.tsx
  - apps/assistant-mobile/src/modules/inbox/components/inbox-item-row.tsx
  - apps/assistant-mobile/src/modules/inbox/components/review-screen.tsx
relatedPlan: .agent-logbook/plans/2026-04-07_184512Z_claudecode_fix-p0-auth-crash-stale-captures.md
---

# Fix P0 issues from capture ingestion E2E testing

## Summary

Fixed three P0 issues discovered during E2E testing: auth session drops, node detail screen crash, and stale processing captures. Then consolidated the stale capture detection logic into a shared helper.

## Context

E2E testing on 2026-04-07 (documented in `.agent-logbook/research/2026-04-07_183149Z_claudecode_capture-ingestion-test-findings.md`) revealed critical issues blocking normal capture pipeline usage. Auth instability caused cascading failures across the app.

PR: https://github.com/stevezhu/letuscook/pull/68

## Work Performed

### Fix 1: Auth session drops

- **Root cause**: `AuthKitClient.getAccessToken()` returned expired JWTs without refreshing. The `ConvexProviderWithAuthKit` calls this for every Convex request.
- **Fix**: Extracted `ensureFreshSession()` private method with JWT expiration check and token refresh. Added a `refreshPromise` concurrency guard since WorkOS refresh tokens are single-use — parallel callers share one refresh request. Both `getAccessToken()` and `getUser()` now delegate to this method.

### Fix 2: Node detail screen crash on auth failure

- **Root cause**: `[nodeId].tsx` used `useSuspenseQuery` wrapped only in `<Suspense>` (no error boundary). Auth errors propagated uncaught → red screen → blank white modal.
- **Fix**: Created `QueryErrorBoundary` (React class component) and `DefaultQueryBoundary` (composing error boundary + Suspense). Applied to node detail modal (with `onGoBack` for clean modal dismissal) and knowledge tab.

### Fix 3: Stale processing captures

- **Root cause**: Captures permanently stuck in "processing" if `embedAndClassify` crashed. `retryProcessing` only accepted "failed" state. No retry/dismiss UI existed.
- **Fix**: Expanded `retryProcessing` to accept stale processing captures (>5 min). Added `discardCapture` mutation. Added amber "Stuck" pill in inbox, retry + discard buttons in review screen.

### Refactor: Consolidate stale detection

- Extracted `STALE_CAPTURE_THRESHOLD_MS` constant and `isStaleCapture()` helper into `inbox-types.ts` to eliminate duplicated threshold logic across 3 files. Staleness is now computed once in `use-inbox-captures.ts` and consumed via `item.isStale`.

## Outcome

- All 20 capture tests pass
- Typecheck passes for `assistant-convex` and `assistant-mobile`
- Verified on iOS Simulator via Maestro: "Stuck" pill renders, retry resets captures, node detail and knowledge tab load with error boundary
- Remaining: manual verification of auth token refresh (requires waiting for token expiration ~5 min)

## Session Stats

```
claudecode Session Stats: b92bbc6a-28bc-4022-b063-6fd62186f454
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001, claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         18,517
  Output Tokens        32,916
  Cache Creation Input 1,145,344
  Cache Read Input     21,138,255
----------------------------------------
SUBAGENTS (5 total):
  Input Tokens         2,511
  Output Tokens        26,454
  Cache Creation Input 810,180
  Cache Read Input     7,675,489
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   21,028
  Total Output Tokens  59,370
  Total Cache Creation 1,955,524
  Total Cache Read     28,813,744
----------------------------------------
GRAND TOTAL TOKENS:  30,849,666
========================================
```
