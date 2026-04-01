---
date: 2026-03-19T22:13:59Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001]
branch: main
sessionId: 3d175654-b3f2-4ba9-8cd4-c1764b5277b8
taskId: T6
tags: [capture, bottom-sheet, mobile-ui, offline]
---

# T6: Capture Drawer — Flow 1

## Goal

Build the capture screen as a chat-like interface with a bottom input that adds entries to a capture log. The capture tab is a regular full-screen tab — no bottom sheet needed. Works offline and without auth (guest mode).

## Scope

### In Scope

- Capture tab screen implemented as a chat-like interface inside a bottom sheet
- Capture tab as a full-screen chat-like interface (no bottom sheet)
- Recent captures log (chat-like stream above input)
  - Authenticated: `getRecentCaptures(limit=20)` from Convex
  - Guest: local guest captures from AsyncStorage store
- Input area (bottom of screen, chat-style) with:
  - `captureType` segmented control (Text / Link / Task, default: Text)
  - Multi-line text input (Enter = newline, NOT submit)
  - Send button (submit on tap)
- Submit behavior:
  - Authenticated: `createCapture()` → Convex
  - Guest: `addGuestCapture()` → AsyncStorage
  - Guest at 100-item limit: "Sign in to continue capturing" prompt
- Keyboard handling (input stays above keyboard, safe-area padding)
- Brief success indicator after submit
- `@` node autocomplete — stubbed (no UI, defer to T7+)

### Out of Scope

- `@` node autocomplete UI (stub the hook, defer to T7+)
- Inbox, review, KB, search screens (T7–T9)
- Swipe gestures for capture items

## Prerequisites / What Already Exists


| Component                          | Status                | Location                                             |
| ---------------------------------- | --------------------- | ---------------------------------------------------- |
| Guest capture store (AsyncStorage) | Done (T3)             | `src/modules/capture/use-guest-capture-store.ts`     |
| Guest capture types                | Done (T3)             | `src/modules/capture/guest-capture-types.ts`         |
| Capture migration provider         | Done (T3)             | `src/modules/capture/capture-migration-provider.tsx` |
| `createCapture` mutation           | Done (T4)             | `convex/captures.ts`                                 |
| `getRecentCaptures` query          | Done (T4)             | `convex/captures.ts`                                 |
| Auth context                       | Done (T2)             | `src/modules/auth/auth-context.tsx`                  |
| Tab layout with capture tab        | Done (T1)             | `src/app/(tabs)/_layout.tsx`                         |
| Placeholder capture screen         | Done (T1)             | `src/app/(tabs)/capture.tsx`                         |
| react-native-gesture-handler       | Installed             | `package.json`                                       |
| react-native-reanimated            | Installed             | `package.json`                                       |
| Bottom sheet library               | Not needed (deferred) | See Future Enhancements                              |


## Architecture Decision: Capture Screen Approach

**Choice:** Keep the capture tab, implement the screen as a full-screen chat-like interface — no bottom sheet.

The capture screen is a regular Expo Router tab screen styled like a messaging app:

- Capture log (FlatList, inverted) fills the screen above the input
- Input area pinned to the bottom (above keyboard when open)
- No new native dependencies required

This is the simplest possible implementation. The bottom sheet presentation is deferred to a future iteration (see Future Enhancements).

## Steps

### Step 1: Create the unified capture submit hook

**Location:** `src/modules/capture/use-capture-submit.ts`

No wrapper hooks for `createCapture` or `getRecentCaptures` — call `useConvexMutation(api.captures.createCapture)` and `useQuery(api.captures.getRecentCaptures)` directly in components.

The only custom hook needed is `useCaptureSubmit` — it unifies the auth vs guest submit logic:

- If authenticated → calls `useMutation({ mutationFn: useConvexMutation(api.captures.createCapture) })`
- If guest → calls `addGuestCapture` from guest store
- If guest at limit → returns `{ limitReached: true }` instead of submitting
- Clears input on success, returns success status for indicator

### Step 2: Create the CaptureTypeSelector component

**Location:** `src/modules/capture/components/capture-type-selector.tsx`

- Segmented control with Text / Link / Task options
- Uses UniWind styling (consistent with `@workspace/rn-reusables` patterns)
- Props: `value: CaptureType`, `onChange: (type: CaptureType) => void`
- Active segment highlighted with background + shadow

### Step 3: Create the RecentCapturesList component

**Location:** `src/modules/capture/components/recent-captures-list.tsx`

- Chat-like stream of recent captures using `FlatList` with `inverted`
- Each item shows `rawContent` + relative timestamp (e.g., "2 hours ago")
- Data source depends on auth:
  - Authenticated: `useRecentCaptures(limit=20)` from Convex (real-time)
  - Guest: `useGuestCaptureStore().captures` (local, all have `captureState="offline"`)
- Auto-scrolls to bottom (latest) when new capture added
- Empty state when no captures yet

### Step 4: Create the CaptureInput component

**Location:** `src/modules/capture/components/capture-input.tsx`

- `captureType` selector (Step 2) positioned above the text input row
- Multi-line `TextInput` with rounded border (chat-style)
  - `blurOnSubmit={false}` so Enter = newline
  - Placeholder: "What's on your mind?"
- Send button (arrow-up icon, enabled when text non-empty, highlighted blue)
- Calls `useCaptureSubmit` on send tap
- Shows brief success indicator (checkmark flash or subtle animation)
- When guest limit reached: replaces input with "Sign in to continue capturing" + Sign In button

### Step 5: Build the Capture screen

**Location:** `src/app/(tabs)/capture.tsx` (replace placeholder)

- Full chat-like interface:
  - Header: "Capture" title (centered)
  - Body: `RecentCapturesList` (scrollable, fills available space)
  - Footer: `CaptureInput` (pinned to bottom, above keyboard)
- `KeyboardAvoidingView` wrapping the screen (behavior="padding" on iOS)
- Safe-area padding for home indicator
- Wrapped in `Suspense` for AsyncStorage load (keep existing pattern)

### Step 6: Lint, test, verify

- Run `pnpm run lint:fix` and `pnpm -w run lint`
- Run `pnpm -w run test`
- Manual verification checklist:
  - Capture tab shows the chat-like capture screen
  - Recent captures log shows correctly (auth vs guest)
  - captureType selector visible above input; selected type highlighted
  - Enter/Return adds newline, does not submit
  - Send button submits capture
  - New capture appears in the log immediately after submit
  - Guest captures saved locally (AsyncStorage)
  - Authenticated captures go to Convex (real-time update in log)
  - 101st guest capture shows sign-in prompt instead of input
  - Input clears after submit
  - Keyboard avoidance works (input stays visible above keyboard)
  - `pnpm run lint` passes

## Open Questions

None — all resolved:

- **Bottom sheet:** Deferred to future iteration (see Future Enhancements)
- **Tab integration:** Keeping the capture tab as a regular full-screen chat interface
- `**@` autocomplete:** Stubbed, deferred to T7+

## Future Enhancements

- **Bottom sheet presentation:** Convert the capture UI to an iOS-style bottom sheet using `@lodev09/react-native-true-sheet` ([https://sheet.lodev09.com/](https://sheet.lodev09.com/)). This would allow capture to be triggered from any screen via a floating button, with the sheet sliding up over the current view. Deferred because it requires a native dependency and the tab-based screen is sufficient for the MVP.

## File Summary


| File                                                       | Action  | Description                                    |
| ---------------------------------------------------------- | ------- | ---------------------------------------------- |
| `src/app/(tabs)/capture.tsx`                               | Rewrite | Chat-like capture screen replacing placeholder |
| `src/modules/capture/use-capture-submit.ts`                | Create  | Unified submit hook (auth/guest)               |
| `src/modules/capture/components/capture-type-selector.tsx` | Create  | Segmented control component                    |
| `src/modules/capture/components/recent-captures-list.tsx`  | Create  | Chat-like capture log                          |
| `src/modules/capture/components/capture-input.tsx`         | Create  | Input area with send button                    |


## Session Stats

```
claudecode Session Stats: 3d175654-b3f2-4ba9-8cd4-c1764b5277b8
========================================
Models Used:  Main: claude-opus-4-6, claude-sonnet-4-6
              Subagents: claude-haiku-4-5-20251001
---

---

MAIN SESSION:
Input Tokens 84
Output Tokens 12,791
Cache Creation Input 534,305
Cache Read Input 3,504,761

---

SUBAGENTS (1 total):
Input Tokens 2,206
Output Tokens 8,505
Cache Creation Input 197,470
Cache Read Input 3,020,150

---

TOTAL USAGE:
Total Input Tokens 2,290
Total Output Tokens 21,296
Total Cache Creation 731,775
Total Cache Read 6,524,911

---

# GRAND TOTAL TOKENS: 7,280,272

```

## References

- [T6 Ticket](ticket:63a17a79-84f1-47b6-9644-2f822ace8c50/2feb8c03-6807-499a-9cb7-0e7835cd339a)
- [Core Flows Spec — Flow 1](spec:63a17a79-84f1-47b6-9644-2f822ace8c50/2682931f-9865-4dc8-ab60-7b66cb7e8beb)
- [Technical Plan](spec:63a17a79-84f1-47b6-9644-2f822ace8c50/44be7e7f-9362-4608-8f89-1633275f0edd)
- [@lodev09/react-native-true-sheet](https://sheet.lodev09.com/)

```
