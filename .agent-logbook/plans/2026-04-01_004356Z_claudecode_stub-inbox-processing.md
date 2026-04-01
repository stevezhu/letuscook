---
date: 2026-04-01T00:43:56Z
type: plan
status: complete
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: improve-capture
sessionId: 44e53763-acc8-4519-bac0-d415d4f2732b
tags: [captures, inbox, processing]
filesModified: [apps/assistant-convex/convex/captures.ts]
---

# Stub Inbox Item Processing

## Goal

Fix inbox items stuck in "Processing" state by replacing the LLM-dependent pipeline with a stub that uses available data to create draft suggestions immediately.

## Scope

**Included:**

- Fix state check bug in `processCapture` (`!== 'ready'` → `!== 'processing'`)
- Replace `embedAndClassify` action call with existing `saveDraftSuggestion` helper
- Title derived from truncated rawContent (no LLM)
- Edges created for explicit @mentions only (no vector search)
- No embedding generated

**NOT included:**

- LLM-based title generation (deferred)
- Embedding generation and vector search for similar nodes (deferred)
- Changes to mobile UI or suggestion accept/reject flows

## Steps

1. In `apps/assistant-convex/convex/captures.ts`, `processCapture` mutation:
   - Fix line 508: change `if (capture.captureState !== 'ready') return;` to `if (capture.captureState !== 'processing') return;`
   - Replace the `embedAndClassify` scheduler call with a direct call to `saveDraftSuggestion(ctx, { captureId, agentUserId })`
   - Import `saveDraftSuggestion` from `#convex/model/captures.ts`

2. Run lint and tests to verify

3. Test via Maestro: create a capture, verify it transitions to "Ready", accept/reject suggestion

## Key Files

- `apps/assistant-convex/convex/captures.ts` — `processCapture` mutation (line 494)
- `apps/assistant-convex/convex/model/captures.ts` — `saveDraftSuggestion` helper (line 15)

## Open Questions

None — the existing `saveDraftSuggestion` helper already implements exactly what's needed.

## Session Stats

```
claudecode Session Stats: 44e53763-acc8-4519-bac0-d415d4f2732b
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         296
  Output Tokens        3,910
  Cache Creation Input 109,661
  Cache Read Input     764,837
----------------------------------------
SUBAGENTS (2 total):
  Input Tokens         6,880
  Output Tokens        6,528
  Cache Creation Input 192,445
  Cache Read Input     1,233,126
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   7,176
  Total Output Tokens  10,438
  Total Cache Creation 302,106
  Total Cache Read     1,997,963
----------------------------------------
GRAND TOTAL TOKENS:  2,317,683
========================================
```
