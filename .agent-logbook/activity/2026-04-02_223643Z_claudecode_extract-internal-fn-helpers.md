---
date: 2026-04-02T22:36:44Z
type: activity
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: capture-ingestion-improvements
sessionId: 2088c91a-0edc-446e-a395-7537ec3d2c7e
tags: [convex, refactoring, helpers]
filesModified:
  - apps/assistant-convex/src/model/linkMetadata.ts
  - apps/assistant-convex/src/model/toolRequests.ts
  - apps/assistant-convex/src/model/nodes.ts
  - apps/assistant-convex/src/model/nodeDocuments.ts
  - apps/assistant-convex/src/model/captures.ts
  - apps/assistant-convex/convex/captures.ts
  - apps/assistant-convex/convex/linkMetadata.ts
  - apps/assistant-convex/convex/toolRequests.ts
  - apps/assistant-convex/convex/nodeLinker.ts
  - apps/assistant-convex/convex/nodeDocuments.ts
relatedPlan: plans/flickering-snacking-clover.md
---

# Extract internalQuery/internalMutation logic into helper functions

## Summary

Extracted handler logic from 9 registered `internalQuery`/`internalMutation` functions into reusable helper functions in `src/model/`. The registered functions become thin wrappers that delegate to the helpers, following the existing pattern established by `setCaptureFailed`.

## Context

Many `internalQuery`/`internalMutation` functions in `convex/` existed solely because Convex actions need `ctx.runQuery`/`ctx.runMutation` to access the database. Their logic was inline in the handler, making it non-reusable from mutations/queries. Extracting to helpers makes the logic directly callable from mutations without the overhead of a registered function call, and improves testability.

Also explored refactoring actions to only contain external API calls (task 2), but discovered that Convex mutations cannot await actions — only schedule them. The action-calls-mutation flow is already the architecture in use, so task 2 was deferred.

## Work Performed

**Created 4 new helper files:**
- `src/model/linkMetadata.ts` — `saveLinkMetadata` helper
- `src/model/toolRequests.ts` — `logToolRequest` helper (includes dedup logic)
- `src/model/nodes.ts` — `findNodesByTitle`, `createVirtualNode`, `getNodeForDocumentGeneration`, `getNodeActivityForDocument`
- `src/model/nodeDocuments.ts` — `saveGeneratedDocument` helper

**Extended 1 existing helper file:**
- `src/model/captures.ts` — added `getNodeForEmbedding`, `saveEmbeddingResult` (the largest at ~90 lines)

**Updated 5 convex files** to delegate to helpers:
- `convex/captures.ts` — `getNodeForEmbedding`, `saveEmbeddingResult`
- `convex/linkMetadata.ts` — `saveLinkMetadata`
- `convex/toolRequests.ts` — `logToolRequest`
- `convex/nodeLinker.ts` — `findNodesByTitle`, `createVirtualNode`
- `convex/nodeDocuments.ts` — `getNodeForDocumentGeneration`, `getNodeActivityForDocument`, `saveGeneratedDocument`

**Skipped (already done or not applicable):**
- `setCaptureFailed` — already delegated to `#model/captures.ts`
- `processCapture` — scheduling logic, not extractable to a helper

## Outcome

- All 31 tests pass unchanged (behavior is identical)
- Lint passes clean
- Helpers are now directly callable from mutations/queries without registered function overhead

## Session Stats

```
claudecode Session Stats: 2088c91a-0edc-446e-a395-7537ec3d2c7e
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-opus-4-6, claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         35,891
  Output Tokens        32,583
  Cache Creation Input 325,965
  Cache Read Input     7,095,324
----------------------------------------
SUBAGENTS (4 total):
  Input Tokens         328
  Output Tokens        18,809
  Cache Creation Input 728,243
  Cache Read Input     4,337,970
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   36,219
  Total Output Tokens  51,392
  Total Cache Creation 1,054,208
  Total Cache Read     11,433,294
----------------------------------------
GRAND TOTAL TOKENS:  12,575,113
========================================
```
