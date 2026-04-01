---
date: 2026-04-01T01:03:47Z
type: activity
status: complete
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001, claude-opus-4-6]
branch: improve-capture
sessionId: 44e53763-acc8-4519-bac0-d415d4f2732b
tags: [captures, inbox, processing, convex]
filesModified: [apps/assistant-convex/convex/captures.ts]
relatedPlan: plans/2026-04-01_004356Z_claudecode_stub-inbox-processing.md
---

# Stub Inbox Item Processing

## Summary

Fixed all inbox items being stuck in "Processing" state by fixing a state check bug and replacing the LLM-dependent pipeline with a stub processor that uses available data.

## Context

All captures in the inbox showed "Processing" indefinitely. The root cause was a bug in `processCapture` where the state guard checked `!== 'ready'` instead of `!== 'processing'`, causing the function to exit early for every new capture. Additionally, the full pipeline required LLM APIs (embeddings, title generation) that weren't needed yet. The goal was to create a stub that processes captures immediately using only available data.

## Work Performed

1. **Fixed state check bug** in `processCapture` (captures.ts:510): Changed `if (capture.captureState !== 'ready') return;` to `if (capture.captureState !== 'processing') return;`.

2. **Replaced LLM pipeline with stub**: Removed the `embedAndClassify` action call and replaced it with a direct call to the existing `saveDraftSuggestion` helper from `model/captures.ts`. This helper creates a draft node (title: `[Draft] <first 60 chars>`), edges for explicit @mentions, a suggestion record, and sets state to `'ready'`.

3. **Added fallback for missing agent user**: The original code failed when no user with `userType: 'agent'` existed in the database. Changed to fall back to the capture owner as the suggestor: `const suggestorId = agentUser?._id ?? capture.ownerUserId;`.

4. **Verified via Maestro E2E testing** on iOS simulator:
   - Created a capture → initially failed (no agent user) → applied fallback fix → retried processing → status changed to "Ready" with Accept/Reject buttons visible.
   - Encountered and resolved: simulator auth issues (reload via `tmux send-keys -t letuscook r`), keyboard blocking tab navigation.

5. **Tested with seeded agent user ("CookBot")**:
   - Created new capture "Test with CookBot agent" → processed to "Ready" with "Suggested by CookBot".
   - Accepted suggestion via Save on review screen → item removed from Inbox.
   - Verified node "[Draft] Test with CookBot agent" appeared in Knowledge tab with 0 connections.

## Outcome

- Captures now transition from "Processing" → "Ready" immediately after creation
- Full accept flow verified: Inbox → Review → Save → Knowledge tab
- Lint and tests pass
- Existing captures stuck in "Processing" state will remain so (they need `retryProcessing` which only works from "failed" state) — new captures work correctly
- **Follow-up needed**: Replace stub with LLM-based processing (embeddings, title generation, similar node search)
- **Minor UI issue**: "Suggested by Steve null" shown when owner is used as suggestor fallback (before agent user was seeded) — the `null` comes from a missing `agentProvider` field on human users

## Session Stats

```
claudecode Session Stats: 44e53763-acc8-4519-bac0-d415d4f2732b
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001, claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         523
  Output Tokens        19,589
  Cache Creation Input 316,759
  Cache Read Input     12,914,167
----------------------------------------
SUBAGENTS (3 total):
  Input Tokens         7,372
  Output Tokens        24,523
  Cache Creation Input 480,937
  Cache Read Input     10,846,067
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   7,895
  Total Output Tokens  44,112
  Total Cache Creation 797,696
  Total Cache Read     23,760,234
----------------------------------------
GRAND TOTAL TOKENS:  24,609,937
========================================
```
