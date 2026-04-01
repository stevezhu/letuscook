---
date: 2026-03-12T21:32:01Z
type: activity
status: done
agent: claudecode
models: [claude-sonnet-4-6]
sessionId: d29e04fe-486c-45cc-9f9a-311e8b823108
branch: t4
tags: [convex, mutations, queries, actions, tanstack-query, t4]
relatedPlan: plans/2026-03-12_194547Z_claudecode_t4-convex-backend.md
filesModified:
  - apps/assistant-convex/convex/users.ts
  - apps/assistant-convex/convex/captures.ts
  - apps/assistant-convex/convex/nodes.ts
  - apps/assistant-convex/convex/edges.ts
  - apps/assistant-convex/convex/suggestions.ts
  - apps/assistant-convex/convex/search.ts
  - apps/assistant-mobile/src/modules/capture/use-captures.ts
  - apps/assistant-mobile/src/modules/knowledge/use-knowledge.ts
  - apps/assistant-mobile/src/modules/search/use-search.ts
  - apps/assistant-mobile/src/modules/edges/use-edges.ts
  - apps/assistant-mobile/src/modules/capture/__tests__/use-guest-capture-store.test.ts
---

# T4: Convex Backend Implementation

## Work Performed

Implemented the full Convex data layer per the T4 plan.

### Convex Backend

**`users.ts`**: Added `getAgentUserInternal` internalQuery (queries by `by_user_type` index).

**`captures.ts`**: Full expansion from 87 to ~800 lines:

- Internal helpers: `getCaptureInternal`, `setCaptureFailed`, `saveDraftSuggestion`
- Updated `processCapture` internalAction: now creates deterministic draft node + edges + suggestion
- New mutations: `createCapture`, `updateCapture`, `acceptSuggestion`, `rejectSuggestion`, `organizeCapture`, `archiveCapture`, `unarchiveCapture`, `retryProcessing`
- New queries: `getCapture`, `getInboxCaptures`, `getRecentCaptures`, `getArchivedItems`

**`nodes.ts`** (new): `archiveNode`, `unarchiveNode`, `getKnowledgeBasePages`, `getNodeWithEdges`

**`edges.ts`** (new): `createEdge` with duplicate check via `by_edge_pair`

**`suggestions.ts`** (new): `getSuggestion`

**`search.ts`** (new): `searchGlobal`, `searchNodesForLinking` using `withSearchIndex`

### TanStack Query Hooks (mobile)

- `capture/use-captures.ts`: 11 hooks (inbox, recent, details, suggestion, create, update, accept, reject, organize, archive, unarchive)
- `knowledge/use-knowledge.ts`: 6 hooks (KB pages, archived, node details, autocomplete, archive/unarchive node)
- `search/use-search.ts`: `useSearchResults`
- `edges/use-edges.ts`: `useCreateEdge`

### Pre-existing lint fix

`use-guest-capture-store.test.ts` had a `no-await-in-loop` lint violation. The sequential loop was required for store correctness (AsyncStorage writes race if concurrent). Fixed by chaining `.then()` in the loop body — no `await` inside `for`, `await` only outside at `chain` resolution.

## Key Decisions

- Made `retryProcessing` a **mutation** (not action) — mutations can `ctx.scheduler.runAfter`, no need for action complexity
- Used `withSearchIndex` (not `ctx.db.search`) — correct Convex search API
- `unarchiveNode` edge query uses `gt('archivedAt', 0)` + post-filter by nodeId — can't chain `.eq()` after a range bound on an index
- `getKnowledgeBasePages` returns `{ node, edgeCount }` objects (not flat spread) — satisfies `no-map-spread` lint rule

## Outcome

All lint checks and tests pass (`pnpm -w run lint && pnpm -w run test` — 13/13 tasks successful).

## Session Stats

```
claudecode Session Stats: d29e04fe-486c-45cc-9f9a-311e8b823108
========================================
Models Used:  claude-sonnet-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         148
  Output Tokens        88,690
  Cache Creation Input 414,000
  Cache Read Input     9,924,002
----------------------------------------
SUBAGENTS (1 total):
  Input Tokens         218
  Output Tokens        59,386
  Cache Creation Input 164,790
  Cache Read Input     1,187,260
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   366
  Total Output Tokens  148,076
  Total Cache Creation 578,790
  Total Cache Read     11,111,262
----------------------------------------
GRAND TOTAL TOKENS:  11,838,494
========================================
```
