# Fix P0 Issues from Capture Ingestion Testing

## Context

E2E testing (2026-04-07) revealed three P0 issues blocking normal usage of the capture pipeline. Auth session instability causes cascading failures across the app. The node detail screen crashes unrecoverably on auth errors. Stale "Processing" captures accumulate with no user recourse.

Findings: `docs/plans/capture-ingestion-test-findings.md`

---

## Fix 1: Auth session drops — token refresh in `getAccessToken()`

**Root cause:** `AuthKitClient.getAccessToken()` returns the stored JWT without checking expiration. `getUser()` correctly checks `exp` and refreshes via WorkOS, but `getAccessToken()` does not. The Convex provider calls `getAccessToken()` for every request via `ConvexProviderWithAuthKit` → `useAuth().getAccessToken`.

**File:** `apps/assistant-mobile/src/modules/auth/expo/auth-kit-client.ts`

### Changes

1. **Extract `ensureFreshSession()` private method** that encapsulates:
   - Read session from SecureStore
   - Parse JWT, check `exp` with 10s buffer (same logic as `getUser()` lines 189-191)
   - If expired: refresh via `this.workos.userManagement.authenticateWithRefreshToken()`
   - Store updated session in SecureStore
   - If refresh fails: `clearSession()`, return `null`
   - Return `StoredSession | null`

2. **Add concurrency guard** — a `refreshPromise` field on the class. If a refresh is in-flight, subsequent calls await the same promise. This prevents two parallel Convex requests from both trying to refresh the same (single-use) refresh token.

3. **Rewrite `getAccessToken()`** (lines 79-89): call `ensureFreshSession()`, return `session.accessToken`.

4. **Simplify `getUser()`** (lines 182-218): call `ensureFreshSession()`, return `session.user`.

No changes needed to `auth-provider.tsx` — it already delegates to `authClient.getAccessToken()` at line 176.

---

## Fix 2: Node detail screen crash — add error boundary

**Root cause:** `[nodeId].tsx` uses `useSuspenseQuery` (lines 54-59) wrapped only in `DefaultSuspense` (Suspense-only, no error boundary). Auth errors propagate uncaught → red screen → blank white modal with no navigation. No error boundaries exist anywhere in the mobile app.

### Changes

1. **New file: `apps/assistant-mobile/src/components/query-error-boundary.tsx`**
   - React class component (required for `getDerivedStateFromError`)
   - Props: `children`, `onGoBack?: () => void`
   - Fallback UI: error message, "Try again" button (resets error state), "Go back" button (calls `onGoBack` or `router.back()` — pass as prop since class components can't use hooks)
   - Uses `@workspace/rn-reusables` components (`Button`, `Text`)

2. **New file: `apps/assistant-mobile/src/components/default-query-boundary.tsx`**
   - Composes `QueryErrorBoundary` + `Suspense` (with `DefaultActivityView` fallback)
   - Props: `children`, `onGoBack?: () => void`
   - Drop-in replacement for `DefaultSuspense` in screens with `useSuspenseQuery`

3. **Modify: `apps/assistant-mobile/src/app/knowledge/[nodeId].tsx`**
   - Replace `<DefaultSuspense>` (line 42) with `<DefaultQueryBoundary onGoBack={() => router.back()}>` (since it's `presentation: 'modal'`, go-back dismisses the modal cleanly)

4. **Modify: `apps/assistant-mobile/src/app/(tabs)/knowledge.tsx`**
   - Same treatment — replace `DefaultSuspense` with `DefaultQueryBoundary` around the `useSuspenseQuery` content

---

## Fix 3: Stale "Processing" captures — retry + discard

**Root cause:** Captures get permanently stuck in "processing" if `embedAndClassify` crashes before its try-catch, if the agent user lookup fails, or due to race conditions in `saveEmbeddingResult`. The `retryProcessing` mutation (line 484) only accepts `'failed'` state. The review screen retry button (line 214) is also gated on `'failed'`.

### Backend changes

**File:** `apps/assistant-convex/convex/captures.ts`

1. **Modify `retryProcessing`** (lines 472-504):
   - Change the state check (line 484) to also accept `'processing'` captures that are stale (`Date.now() - capture.updatedAt > STALE_THRESHOLD_MS` where threshold = 5 minutes)
   - Replace `EntityNotFoundError` (lines 485-489) with `ConvexError('Capture is not eligible for retry')`
   - Extract `STALE_THRESHOLD_MS = 5 * 60 * 1000` as a constant

2. **Add `discardCapture` mutation:**
   - Accepts `captureId`, checks ownership
   - Allows discarding captures in `'processing'` or `'failed'` state
   - Sets `archivedAt` and `updatedAt` to `Date.now()`

### Mobile UI changes

**File:** `apps/assistant-mobile/src/modules/inbox/inbox-types.ts`

- Add `updatedAt: number` to the `InboxItem` type

**File:** `apps/assistant-mobile/src/modules/inbox/use-inbox-captures.ts`

- Map `entry.capture.updatedAt` through to `InboxItem` (line 24-33). The field is already on the full capture document returned by `getInboxCaptures`.

**File:** `apps/assistant-mobile/src/modules/inbox/components/state-pill.tsx`

- Add `isStale?: boolean` prop to `StatePill`
- When `state === 'processing'` and `isStale`, use amber styling: `{ label: 'Stuck', bg: 'bg-amber-100', text: 'text-amber-700' }`

**File:** `apps/assistant-mobile/src/modules/inbox/components/inbox-item-row.tsx`

- Compute `isStale` from `item.updatedAt` (5-minute threshold)
- Pass `isStale` to `StatePill`

**File:** `apps/assistant-mobile/src/modules/inbox/components/review-screen.tsx`

- Change retry button condition (line 214) from `capture.captureState === 'failed'` to also include stale processing captures
- Add a "Discard" button for `'processing'` and `'failed'` captures that calls `discardCapture` and navigates back

---

## Verification

1. **Auth fix:** Reload app, submit a capture, wait >5 minutes (token expiration), submit another capture — should succeed without re-login. Check SecureStore is updated with fresh token.
2. **Error boundary:** Temporarily throw in a `useSuspenseQuery` handler → confirm error boundary shows retry/go-back UI instead of red screen. Confirm "Go back" dismisses the modal cleanly.
3. **Stale captures:** Create a capture, manually set its `updatedAt` to 10 minutes ago in the Convex dashboard. Confirm "Stuck" amber pill shows in inbox. Confirm retry and discard buttons work in review screen.
4. **Run lint + tests:** `pnpm -w run lint` and `pnpm -w run test`
