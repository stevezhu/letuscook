---
date: 2026-03-10T17:33:54Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
sessionId: 9895d92a-fa9b-417d-ad59-14533c1869f2
branch: t3
tags: [capture, offline, asyncstorage, migration]
---

# T3: Offline Guest Capture — AsyncStorage Store & Migration

## Goal

Implement the client-side guest capture store (AsyncStorage) that allows users to capture items before signing in. On sign-in, all guest captures are migrated to Convex and enqueued for processing. Guest captures appear as "Offline" in the UI until migration.

## Skills

- `agent-logbook`
- `convex`
- `convex-best-practices`
- `executing-plans`
- `expo-react-native-coder`
- `native-data-fetching`
- `test-driven-development`
- `verification-before-completion`
- `maestro-e2e`

## Scope

### In Scope

- Guest capture store (`useGuestCaptureStore`) with CRUD on AsyncStorage
- Hard limit of 100 guest captures with `LIMIT_REACHED` signal
- Convex `migrateGuestCaptures` mutation (bulk-create + enqueue processing)
- `processCapture` internal action stub (T5 replaces with real AI)
- Auto-migration on sign-in with progress banner UI
- Minimal limit-reached UI on capture screen

### Out of Scope

- Capture drawer UI (T6)
- `processCapture` AI action (T5)
- Any UI beyond migration progress indicator and limit message

## Steps

### 1. Install AsyncStorage dependency

```bash
pnpm --filter assistant-mobile add @react-native-async-storage/async-storage
```

### 2. Create `apps/assistant-mobile/src/modules/capture/guest-capture-types.ts`

- `GuestCapture` type: `{ id: string, rawContent: string, captureType: 'text'|'link'|'task', capturedAt: number }`
- `AddGuestCaptureResult`: `{ status: 'ok', capture } | { status: 'LIMIT_REACHED' }`
- Constants: `GUEST_CAPTURE_LIMIT = 100`, `GUEST_CAPTURES_STORAGE_KEY = 'guest_captures'`

### 3. Create `apps/assistant-mobile/src/modules/capture/use-guest-capture-store.ts`

- Custom hook using `@tanstack/react-query` `useSuspenseQuery` for async queries and `useMutation` for mutations (no `useState` or Zustand)
- Loads from AsyncStorage via `useSuspenseQuery`
- `addGuestCapture(rawContent, captureType)` → `useMutation` that checks limit, generates UUID via `Crypto.randomUUID()`, writes through to AsyncStorage, and invalidates the query
- `clearGuestCaptures()` → `useMutation` that clears AsyncStorage and invalidates the query
- Exposes `captures` with `captureState: 'offline'` appended via `useMemo` for UI rendering

### 4. Create `apps/assistant-convex/convex/captures.ts`

- `migrateGuestCaptures` mutation — follows pattern from `convex/users.ts`:
  - Auth: get identity → look up user via `by_workos_user_id` index
  - Insert each capture with `ownerUserId`, `captureState: 'processing'`, `explicitMentionNodeIds: []`
  - Schedule `internal.captures.processCapture` for each via `ctx.scheduler.runAfter(0, ...)`
  - Returns `{ migrated: number }`
  - Single transaction (max 100 small captures, well within Convex limits)
- `processCapture` internal action stub — logs and exits; T5 replaces with real AI processing

### 5. Create `apps/assistant-mobile/src/modules/capture/use-migrate-guest-captures.ts`

- Hook wrapping the Convex mutation call using `@tanstack/react-query` `useMutation`
- Accepts guest captures array, calls `migrateGuestCaptures` in the mutation function, clears local store on success
- Exposes standard `useMutation` return values (e.g., `mutateAsync`, `isPending`)
- On failure: does NOT clear AsyncStorage (retry on next sign-in)

### 6. Create `apps/assistant-mobile/src/modules/capture/capture-migration-provider.tsx`

- Wrapper component placed inside `ConvexProviderWithAuth` in the provider tree
- Watches `useAuth().user` transitions (null → non-null) via `useRef` tracking previous value
- On sign-in: if guest captures exist, auto-triggers migration
- Renders minimal progress banner: `<View>` with `<ActivityIndicator>` + `<Text>"Syncing X captures…"</Text>` when `isPending`
- Must also check Convex `isAuthenticated` before calling mutation (auth token timing)

### 7. Modify `apps/assistant-mobile/src/app/_layout.tsx`

- Import and add `CapturesMigrationProvider` inside `ConvexProviderWithAuth`, wrapping `ThemeProvider` and children

### 8. Modify `apps/assistant-mobile/src/app/(tabs)/capture.tsx`

- Add minimal limit-reached UI: use `useGuestCaptureStore()`, if `addGuestCapture` returns `LIMIT_REACHED`, show "Sign in to continue capturing" message with sign-in button
- Full capture drawer UI deferred to T6

### 9. Lint & Test

```bash
pnpm run lint:fix && pnpm -w run lint && pnpm -w run test
```

## Key Design Decisions

- **No external state manager** — `@tanstack/react-query` + AsyncStorage write-through is sufficient for single-user local data
- **Single Convex mutation** for all captures (not batched) — 100 small text captures is well within transaction limits
- **Separate migration provider** rather than modifying `AuthProvider` — keeps auth pure, avoids coupling
- **`processCapture` stub** as `internalAction` — ensures codebase compiles/deploys before T5
- **No idempotency guard** on re-migration — if client crashes after mutation but before clearing AsyncStorage, duplicates could occur on next sign-in; acceptable for MVP

## Key Files

| File                                                      | Role                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/assistant-mobile/src/modules/auth/auth-context.tsx` | Auth state shape, `useAuth()` hook                              |
| `apps/assistant-convex/convex/users.ts`                   | Pattern for Convex mutations (imports, validators, auth lookup) |
| `apps/assistant-convex/convex/schema.ts`                  | Captures table schema (required fields for inserts)             |
| `apps/assistant-mobile/src/app/_layout.tsx`               | Provider tree for `CapturesMigrationProvider` placement         |
| `apps/assistant-mobile/src/app/(tabs)/capture.tsx`        | Capture screen for limit-reached message                        |

## Open Questions

None — all requirements are clear from the ticket and tech plan.

## Verification

1. **Unit test guest capture store**: add/get/clear captures, verify 100-limit enforcement
2. **Manual test migration flow**: create guest captures → sign in → verify captures appear in Convex with `captureState: 'processing'`
3. **Verify limit UI**: add 100 captures → attempt 101st → verify "Sign in to continue" message
4. **Verify migration progress**: sign in with pending captures → verify "Syncing X captures…" banner appears and disappears
5. **Lint/test**: `pnpm -w run lint && pnpm -w run test`
   - Run `pnpm -w run lint:fix` if there are lint errors

## References

- Ticket: `T3: Offline Guest Capture — AsyncStorage Store & Migration`
- Tech Plan: `Technical Plan: Letuscook Architecture` (offline strategy section)
- Epic: `Collaborative Workflow for Feature Development`

## Session Stats

```
claudecode Session Stats: 9895d92a-fa9b-417d-ad59-14533c1869f2
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-opus-4-6, claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         71
  Output Tokens        7,913
  Cache Creation Input 327,822
  Cache Read Input     1,529,096
----------------------------------------
SUBAGENTS (2 total):
  Input Tokens         1,449
  Output Tokens        9,922
  Cache Creation Input 327,007
  Cache Read Input     2,790,631
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   1,520
  Total Output Tokens  17,835
  Total Cache Creation 654,829
  Total Cache Read     4,319,727
----------------------------------------
GRAND TOTAL TOKENS:  4,993,911
========================================
```
