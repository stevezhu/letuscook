# Consolidate stale capture detection logic

## Context

The stale capture detection (`captureState === 'processing' && Date.now() - updatedAt > 5min`) is duplicated in 3 files with a hardcoded magic number. This is brittle — if the threshold changes, it must be updated in all locations. The staleness concept should be computed once and shared.

## Approach

Add a shared `isStaleCapture()` helper and a `STALE_CAPTURE_THRESHOLD_MS` constant to `inbox-types.ts`. Compute `isStale` once in the data layer (`use-inbox-captures.ts`) and add it to `InboxItem`. The review screen uses the same helper directly since it fetches its own capture data.

The backend `STALE_THRESHOLD_MS` in `captures.ts` stays as the authoritative gate for the `retryProcessing` mutation — the client-side check is a UI hint.

## Changes

### 1. `apps/assistant-mobile/src/modules/inbox/inbox-types.ts`
- Add `STALE_CAPTURE_THRESHOLD_MS = 5 * 60 * 1000` constant
- Add `isStaleCapture(captureState, updatedAt)` helper function
- Add `isStale: boolean` to the `InboxItem` type

### 2. `apps/assistant-mobile/src/modules/inbox/use-inbox-captures.ts`
- Import `isStaleCapture` from `inbox-types.ts`
- Compute `isStale` when mapping server items: `isStale: isStaleCapture(entry.capture.captureState, entry.capture.updatedAt)`
- Guest items: `isStale: false`

### 3. `apps/assistant-mobile/src/modules/inbox/components/inbox-item-row.tsx`
- Remove the inline `isStale` computation (lines 29-31)
- Read `item.isStale` directly and pass to `StatePill`

### 4. `apps/assistant-mobile/src/modules/inbox/components/review-screen.tsx`
- Import `isStaleCapture` from `inbox-types.ts`
- Replace inline `Date.now() - capture.updatedAt > 5 * 60 * 1000` with `isStaleCapture(capture.captureState, capture.updatedAt)`

## Files NOT changed
- `apps/assistant-convex/convex/captures.ts` — keeps its own `STALE_THRESHOLD_MS` as the authoritative backend gate
- `state-pill.tsx` — already clean, receives `isStale` as prop

## Verification
- `pnpm -w run test` — capture tests still pass
- Typecheck: `cd apps/assistant-mobile && pnpm run typecheck`
- Maestro: verify inbox still shows "Stuck" pill for stale captures, retry/discard buttons still work in review screen
