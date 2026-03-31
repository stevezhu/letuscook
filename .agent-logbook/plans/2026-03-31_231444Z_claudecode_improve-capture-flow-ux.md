---
date: 2026-03-31T23:14:45Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: improve-capture
sessionId: d7567385-a030-46cf-b018-74d0d259e939
tags: [capture, ux, mobile]
---

# Improve Capture Flow UX

## Goal

Identify and propose UX improvements to the capture flow — the core loop of capturing thoughts/links/tasks and reviewing them in the inbox. The capture screen is the primary entry point for all user content, so reducing friction and increasing clarity here has an outsized impact on retention and daily active usage.

## Current State (Observed)

### Capture Screen

- Chat-like inverted list of recent captures (rawContent + type pill)
- Bottom composer with: type segmented control (Text / Link / Task), multiline text input, send button
- No visual feedback on successful submit (TODO in codebase)
- No error handling on submit failure (TODO in codebase)
- All captures display identically regardless of type (same card style for Text, Link, Task)

### Inbox Screen

- Flat list of captures grouped by date (Yesterday, This Week, Older)
- Every item stuck in "Processing" state (blue pill) — AI processor appears non-functional or slow
- Tapping an item opens a Review modal

### Review Modal

- Shows: state pill, title input (empty if no suggestion), content (prefilled from capture), action buttons (Discard / Archive / Save)
- No suggested links/edges shown (likely because processing hasn't completed)
- Sparse — lots of empty space, no guidance for the user

### Home Screen

- Welcome message, "No recent activity to show", Quick Actions (New Task, Draft Doc)
- Disconnected from capture flow

## Proposed Improvements

### A. Capture Input Improvements (High Impact, Lower Effort)

#### A1. Submit Feedback & Animation

- **Problem**: No visual confirmation after tapping send. User doesn't know if it worked.
- **Idea**: Brief success animation (checkmark flash or card slide-up into the list). Haptic feedback on submit. Already a TODO in `capture-composer.tsx:109`.

#### A2. Smart Placeholder Text by Type

- **Problem**: Placeholder is always "What's on your mind?" regardless of selected type.
- **Idea**: Context-sensitive placeholders:
  - Text: "What's on your mind?"
  - Link: "Paste a URL..."
  - Task: "What needs to get done?"

#### A3. Link Auto-Detection

- **Problem**: User must manually switch to "Link" type before pasting a URL.
- **Idea**: Auto-detect URLs in the text input and switch capture type to Link (or prompt). Could also auto-fetch link preview metadata (title, favicon, description) for richer capture cards.

#### A4. Keyboard Shortcut for Submit

- **Problem**: Enter key creates newlines — no keyboard-only way to submit (must tap button).
- **Idea**: Support Cmd+Enter (or similar) as a submit shortcut for power users with hardware keyboards. Alternatively, make single Enter = submit and Shift+Enter = newline (common chat pattern).

### B. Capture List / History Improvements (Medium Impact)

#### B1. Visual Differentiation by Capture Type

- **Problem**: All captures look identical (white card + small type pill). Hard to scan.
- **Idea**: Subtle visual differences per type:
  - Link captures: show favicon + URL domain
  - Task captures: show checkbox icon/state
  - Text captures: keep current style
  - Use distinct left-border colors or icons per type

#### B2. Swipe Actions on Capture Cards

- **Problem**: No quick actions on capture history items. Must navigate to inbox > review to do anything.
- **Idea**: Swipe-to-archive on capture list items for quick cleanup. Swipe-to-review for fast access.

#### B3. Capture Grouping & Empty States

- **Problem**: Long flat list with repeated "yesterday" date headers.
- **Idea**: Collapse date groups. Better empty state for new users with onboarding copy explaining the capture concept.

### C. Inbox & Review Improvements (High Impact)

#### C1. Inline Quick Actions in Inbox

- **Problem**: Every action requires opening the review modal (extra tap + context switch).
- **Idea**: Swipe-right to accept suggestion, swipe-left to archive. For items in "Ready" state, show accept/reject buttons directly on the inbox row.

#### C2. Batch Operations

- **Problem**: Must process inbox items one at a time.
- **Idea**: Multi-select mode with batch archive, batch accept suggestions. Especially useful when inbox grows large.

#### C3. Inbox Filters / State Tabs

- **Problem**: All states (Processing, Ready, Failed, Needs Manual) are mixed together.
- **Idea**: Filter tabs or segmented control at top of inbox: All / Ready / Processing / Failed. Ready items are actionable and should be the default view, not mixed with stuck-processing items.

#### C4. Review Screen Polish

- **Problem**: Review modal feels sparse and doesn't guide the user.
- **Idea**:
  - Show the capture type prominently
  - Show timestamp of when captured
  - If suggestions exist: show suggested title, suggested links with confidence scores, and clear Accept/Reject CTAs
  - If still processing: show a progress indicator with estimated time, not just a static "Processing" pill
  - If failed: show retry button prominently with error context

### D. Cross-Flow Improvements (High Impact, Higher Effort)

#### D1. Unified Capture Entry Point

- **Problem**: Capture is a tab — requires tab switch, breaking flow from other screens.
- **Idea**: Global floating action button (FAB) or pull-down gesture from any screen to open capture composer as a sheet. Capture anywhere without losing context.

#### D2. Quick Capture from Home Screen

- **Problem**: Home "Quick Actions" (New Task, Draft Doc) don't connect to the capture flow.
- **Idea**: Make "New Task" open capture with Task type pre-selected. Add a "Quick Capture" action that opens the capture composer inline or as a sheet.

#### D3. Inbox Badge Count

- **Problem**: No indication of pending inbox items without tapping the Inbox tab.
- **Idea**: Badge on the Inbox tab icon showing count of "Ready" items (items that need user action). Drives engagement with the review loop.

#### D4. Processing Status Visibility

- **Problem**: Items stuck in "Processing" with no visibility into what's happening.
- **Idea**: Show a subtle progress indicator or estimated time. If processing takes too long (>30s), auto-surface a "still working..." message. If processing is broken (all items stuck), surface a clear error state.

### E. Content Enrichment (Medium Impact, Higher Effort)

#### E1. @Mention Autocomplete in Capture Input

- **Problem**: @mention syntax exists but there's no autocomplete UI (noted as deferred to T7+).
- **Idea**: Implement inline autocomplete dropdown when user types `@` — search existing nodes and show suggestions. This is the primary way to manually create connections between knowledge.

#### E2. Tags / Labels on Capture

- **Problem**: Only three types (Text/Link/Task). No custom categorization.
- **Idea**: Allow optional hashtags in the capture text (e.g., #cooking #recipe) that get parsed and stored as tags. Enables filtering and grouping later.

#### E3. Voice Capture

- **Problem**: Text-only input is slow for on-the-go capture moments.
- **Idea**: Microphone button next to send that uses speech-to-text. Especially valuable for mobile-first usage. (Noted as Phase 2 in specs.)

## Priority Ranking


| Priority | Item                                | Effort | Impact |
| -------- | ----------------------------------- | ------ | ------ |
| P0       | A1 - Submit feedback & haptics      | Low    | High   |
| P0       | D3 - Inbox badge count              | Low    | High   |
| P0       | D4 - Processing status visibility   | Low    | High   |
| P1       | A2 - Smart placeholders by type     | Low    | Medium |
| P1       | A3 - Link auto-detection            | Medium | High   |
| P1       | C3 - Inbox filters/state tabs       | Medium | High   |
| P1       | C4 - Review screen polish           | Medium | High   |
| P1       | B1 - Visual differentiation by type | Low    | Medium |
| P2       | C1 - Inline quick actions (swipe)   | Medium | Medium |
| P2       | D1 - Global capture FAB/sheet       | High   | High   |
| P2       | E1 - @Mention autocomplete          | High   | High   |
| P2       | C2 - Batch operations               | Medium | Medium |
| P3       | B2 - Swipe actions on capture cards | Medium | Low    |
| P3       | A4 - Keyboard submit shortcut       | Low    | Low    |
| P3       | E2 - Hashtag parsing                | Medium | Medium |
| P3       | D2 - Quick capture from home        | Low    | Low    |
| P3       | E3 - Voice capture                  | High   | Medium |


## Open Questions

1. **Processing pipeline health**: All observed inbox items are stuck at "Processing." Is the AI processor running? If not, most inbox/review improvements are blocked on fixing that first.
2. **@Mention autocomplete scope**: Should this search all published nodes, or also include draft nodes? What's the expected node count per user?
3. **Link enrichment**: Should link captures auto-fetch metadata (title, description, favicon) at capture time or during processing?
4. **Notification strategy**: Should we notify users when inbox items transition to "Ready"? Push notifications vs. in-app badge only?

## References

- Prior plan: `.agent-logbook/plans/2026-03-19_221359Z_claudecode_t6-capture-drawer.md`
- Prior plan: `.agent-logbook/plans/2026-03-20_020117Z_claudecode_t7-inbox-review-flows.md`
- Traycer specs: `.agent-logbook/other/traycer/`
- TODOs in `capture-composer.tsx:104,109` (error handling, success feedback)

## Session Stats

```
claudecode Session Stats: d7567385-a030-46cf-b018-74d0d259e939
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         318
  Output Tokens        5,679
  Cache Creation Input 121,808
  Cache Read Input     1,013,969
----------------------------------------
SUBAGENTS (2 total):
  Input Tokens         3,214
  Output Tokens        14,484
  Cache Creation Input 371,241
  Cache Read Input     2,282,992
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   3,532
  Total Output Tokens  20,163
  Total Cache Creation 493,049
  Total Cache Read     3,296,961
----------------------------------------
GRAND TOTAL TOKENS:  3,813,705
========================================
```
