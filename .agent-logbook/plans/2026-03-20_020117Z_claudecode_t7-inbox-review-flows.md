---
date: 2026-03-20T02:01:17Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: t7
sessionId: 428a85eb-c008-4132-b630-84e39690070f
taskId: T7
tags: [inbox, review, mobile-ui, flows-2-5]
---

# T7: Inbox & Review — Flows 2–5

## Goal

Build the Inbox screen (right-side slide-in) and Detailed Review modal for the
assistant-mobile app. These implement Flows 2–5 from the Core Flows spec:
users process captured items, accept/reject AI suggestions, and manually
organize captures into Knowledge Base pages.

## Scope

### In Scope

- **Inbox screen** (Flow 2): Full-view slide-in from Inbox button, date-grouped
  sections (Today/Yesterday/This Week/Older), state pills, Accept/Reject for
  Ready captures, guest offline captures merged in
- **Quick Accept** (Flow 3): Accept suggestion → animate out → auto-advance
- **Quick Reject** (Flow 4): Reject suggestion → relabel Needs manual
- **Detailed Review modal** (Flow 5): Full-screen modal with title input,
  content editor, `@` autocomplete, links section, Save/Discard/Archive actions,
  retry for Failed captures
- **Inbox button** on Home screen header to navigate to inbox
- **Hooks layer** wrapping existing Convex backend mutations/queries

### Out of Scope

- Knowledge Base screen (T8)
- Global Search screen (T9)
- Swipe gestures for accept/reject (Phase 2)
- Complex animations (basic versions only — can polish later)

## Architecture Decisions

1. **Inbox as a tab screen** — Implemented as a new tab alongside Home, Capture,
   Account, and Search. Simpler navigation, consistent with the app's existing
   tab-based layout.

2. **Detailed Review as a modal Stack screen** — "Full-screen modal slides up"
   maps to a Stack screen with `presentation: 'modal'` and a dynamic
   `[captureId]` route parameter.

3. **New `inbox` module** at `src/modules/inbox/` — follows the existing
   `capture` module pattern (hooks + components + types).

4. **Convex hooks** — wrap existing backend mutations via TanStack Query's
   `useMutation` + `convexQuery` pattern (matching `use-capture-submit.ts`).

5. **Unified inbox items** — server captures (from `getInboxCaptures`) and guest
   captures (from `useGuestCaptureStore`) merged into a single typed list, with
   guest captures rendered as `Offline` state.

## Backend Status

All backend functions already exist — **no backend changes needed**:

| Function                | File                    | Status |
| ----------------------- | ----------------------- | ------ |
| `getInboxCaptures`      | `convex/captures.ts`    | ✅     |
| `acceptSuggestion`      | `convex/captures.ts`    | ✅     |
| `rejectSuggestion`      | `convex/captures.ts`    | ✅     |
| `organizeCapture`       | `convex/captures.ts`    | ✅     |
| `archiveCapture`        | `convex/captures.ts`    | ✅     |
| `retryProcessing`       | `convex/captures.ts`    | ✅     |
| `getCapture`            | `convex/captures.ts`    | ✅     |
| `getSuggestion`         | `convex/suggestions.ts` | ✅     |
| `searchNodesForLinking` | `convex/search.ts`      | ✅     |

## Steps

### Step 1: Create inbox module types and hooks

Create `src/modules/inbox/` with:

- [ ] `inbox-types.ts` — Unified `InboxItem` type covering both server captures
      (with suggestion/suggestor) and guest offline captures. Date-grouping helpers.
- [ ] `use-inbox-captures.ts` — Hook that merges `api.captures.getInboxCaptures`
      (authenticated) with guest captures (offline), returns date-grouped sections.
      Note: Simple mutations (`acceptSuggestion`, `rejectSuggestion`, `organizeCapture`,
      `archiveCapture`, `retryProcessing`) and simple queries (`searchNodesForLinking`)
      do NOT get dedicated hook files. Use `useMutation({ mutationFn: useConvexMutation(...) })`
      or `useQuery(convexQuery(...))` inline at the call site instead.

### Step 2: Build state pill component

- [ ] `src/modules/inbox/components/state-pill.tsx` — Renders colored pill for
      each capture state: Offline (gray), Processing (blue), Ready (green),
      Failed (red), Needs manual (orange). Reusable across inbox and review screens.

### Step 3: Build inbox item row component

- [ ] `src/modules/inbox/components/inbox-item-row.tsx` — Single capture row:
  - Preview text (`rawContent`)
  - State pill
  - Relative time
  - For Ready: "Suggested by CookBot" badge + Accept (green) / Reject (gray) buttons
  - For non-Ready: buttons hidden, entire row tappable to open review
  - `onAccept`, `onReject`, `onPress` callbacks

### Step 4: Build inbox screen

- [ ] `src/modules/inbox/components/inbox-screen.tsx` — Main inbox UI:
  - Header: back button (left), "Inbox" title (center), sign-in CTA (right, when unauthenticated)
  - `SectionList` with date-grouped sections and sticky headers
  - Empty state when no items
  - Wires up accept/reject handlers
  - Tap row → `router.push('/review/[captureId]')`
- [ ] `src/app/inbox.tsx` — Thin route wrapper importing `InboxScreen`

### Step 5: Build node autocomplete component

- [ ] `src/modules/inbox/components/node-autocomplete.tsx` — Dropdown overlay
      triggered by `@` in content editor. Uses
      `useQuery(convexQuery(api.search.searchNodesForLinking, { query }))` inline.
      On select, inserts `@[title](node:id)` markdown.

### Step 6: Build detailed review screen

- [ ] `src/modules/inbox/components/review-screen.tsx` — Full-screen review modal:
  - Header: back button, "Review Item" title
  - Title input (prefilled from suggestion's node title if available)
  - Content textarea with `@` autocomplete support
  - State indicator pill
  - Links section: suggested links (labeled "Suggested") + explicit `@` links,
    each with remove button
  - Actions: Save (primary), Discard (secondary)
  - Overflow menu: Archive
  - Failed state: "Retry processing" button
  - Save logic: calls `organizeCapture` (manual) or `acceptSuggestion`
    (if suggestion unchanged)
  - After save: navigate back to inbox
- [ ] `src/app/review/[captureId].tsx` — Thin route wrapper importing `ReviewScreen`

### Step 7: Register routes and wire inbox button

- [ ] Update `src/app/_layout.tsx` — Add `inbox` and `review/[captureId]`
      Stack screens to the root Stack
- [ ] Update `src/app/(tabs)/index.tsx` — Add Inbox button to Home screen
      header area (top right) that calls `router.push('/inbox')`

### Step 8: Lint, test, verify

- [ ] Run `pnpm run lint:fix` and `pnpm -w run lint`
- [ ] Run `pnpm -w run test`
- [ ] Fix any issues

## Files to Create

| File                                                 | Purpose                                 |
| ---------------------------------------------------- | --------------------------------------- |
| `src/modules/inbox/inbox-types.ts`                   | Unified inbox item types, date-grouping |
| `src/modules/inbox/use-inbox-captures.ts`            | Fetch + merge server/guest inbox        |
| `src/modules/inbox/components/state-pill.tsx`        | Capture state pill                      |
| `src/modules/inbox/components/inbox-item-row.tsx`    | Single inbox row                        |
| `src/modules/inbox/components/inbox-screen.tsx`      | Main inbox UI                           |
| `src/modules/inbox/components/review-screen.tsx`     | Detailed review modal                   |
| `src/modules/inbox/components/node-autocomplete.tsx` | `@` autocomplete overlay                |
| `src/app/inbox.tsx`                                  | Inbox route                             |
| `src/app/review/[captureId].tsx`                     | Review modal route                      |

## Files to Modify

| File                       | Change                                                  |
| -------------------------- | ------------------------------------------------------- |
| `src/app/_layout.tsx`      | Register `inbox` and `review/[captureId]` Stack screens |
| `src/app/(tabs)/index.tsx` | Add Inbox button to header                              |

## Open Questions

1. Should the Inbox button show a badge count of unprocessed items? (Nice-to-have,
   not in ticket AC — can skip for now)
2. The `@` autocomplete UX in React Native — should it be a modal overlay or
   inline suggestion list? (Will implement as a positioned overlay beneath the
   cursor, similar to mobile keyboard suggestions)

## References

- Ticket: `ticket:63a17a79-84f1-47b6-9644-2f822ace8c50/bc164571-73d3-46ff-8185-ade97cb9f7fc`
- Core Flows spec: `spec:63a17a79-84f1-47b6-9644-2f822ace8c50/2682931f-9865-4dc8-ab60-7b66cb7e8beb` (Flows 2–5)
- Tech Plan: `spec:63a17a79-84f1-47b6-9644-2f822ace8c50/44be7e7f-9362-4608-8f89-1633275f0edd`
- Existing capture module pattern: `apps/assistant-mobile/src/modules/capture/`
- Backend captures: `apps/assistant-convex/convex/captures.ts`

## Session Stats

```
claudecode Session Stats: 428a85eb-c008-4132-b630-84e39690070f
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         29,539
  Output Tokens        7,502
  Cache Creation Input 343,158
  Cache Read Input     1,678,887
----------------------------------------
SUBAGENTS (2 total):
  Input Tokens         1,456
  Output Tokens        9,338
  Cache Creation Input 222,590
  Cache Read Input     2,989,824
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   30,995
  Total Output Tokens  16,840
  Total Cache Creation 565,748
  Total Cache Read     4,668,711
----------------------------------------
GRAND TOTAL TOKENS:  5,282,294
========================================
```
