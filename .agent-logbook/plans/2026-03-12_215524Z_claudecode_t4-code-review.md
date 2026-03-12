---
date: 2026-03-12T21:55:24Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6]
branch: main
sessionId: dd9e5df2-64b5-406c-97a5-33f39578b70c
tags: [convex, code-review, t4]
relatedPlan: plans/2026-03-12_194547Z_claudecode_t4-convex-backend.md
---

# T4: Code Review of Convex Backend Implementation

## Summary

Code review of commit `91d8aa4` ("First run t4") — the T4 Convex backend implementation covering captures, nodes, edges, suggestions, search, and TanStack Query hooks.

## Context

Review of work documented in `activity/2026-03-12_213201Z_claudecode_t4-convex-backend-impl.md`. The implementation added ~1800 lines across 14 files.

## Findings

### Correctness Issues

1. **`ctx.db.patch` / `ctx.db.delete` 3-arg forms** — Used consistently as `ctx.db.patch('table', id, fields)` and `ctx.db.delete('table', id)`. Verify this matches the Convex version in use — the classic API is `ctx.db.patch(id, fields)` (2 args) and `ctx.db.delete(id)` (1 arg).

2. **`getSuggestion` throws on unauthorized** (`suggestions.ts:21`) — Every other query returns `null` for unauthorized access; this one throws `ConvexError('Unauthorized')`. Should return `null` for consistency.

3. **`searchGlobal` / `searchNodesForLinking` post-filter after `.take()`** (`search.ts:36-51`, `search.ts:78-85`) — Search indexes for captures already have `archivedAt` and `captureState` as `filterFields`. Results are taken then filtered in-memory, which can return fewer results than available. Move filters into the search query builder.

### Performance Concerns

4. **`unarchiveNode` full-table scan of archived edges** (`nodes.ts:74-84`) — `q.gt('archivedAt', 0)` scans all archived edges across all users, then post-filters by nodeId. Consider adding indexes with `fromNodeId`/`toNodeId` as the leading field.

5. **`getKnowledgeBasePages` N+1 query fan-out** (`nodes.ts:126-147`) — For each node, 2 edge queries (outgoing + incoming). 100 nodes = 200 DB queries. Consider pagination or denormalized edge counts.

6. **`getInboxCaptures` N+1 for suggestions** (`captures.ts:722-744`) — Each "ready" capture triggers a suggestion + suggestor lookup.

### Style / Minor

7. **`useRecentCaptures` redundant coalescing** (`use-captures.ts:11-14`) — `limit ?? undefined` is a no-op. Simplify to `{ limit }`.

8. **`useNodeAutocomplete` and `useSearchResults` subscribe on empty string** (`use-knowledge.ts:20`, `use-search.ts:6`) — Should use `'skip'` when `!query.trim()` to avoid unnecessary Convex subscriptions.

9. **Auth boilerplate repetition** — The identity-lookup-ownership pattern (~10 lines) is repeated 15+ times. A shared `getAuthenticatedUser(ctx)` helper would centralize auth logic.

### What Looks Good

- Schema indexes are well-designed and all referenced indexes exist
- Auth checks consistently applied to every public mutation/query
- `createEdge` duplicate check via `by_edge_pair` is correct
- `acceptSuggestion` / `rejectSuggestion` lifecycle management is thorough
- `processCapture` as `internalAction` with separate `internalMutation` steps follows Convex best practices
- `retryProcessing` as mutation (not action) is the right call
- TanStack Query hooks follow `convexQuery` / `useConvex().mutation()` patterns correctly
- Test fix (`.then()` chaining to avoid `no-await-in-loop`) preserves sequential semantics

## Outcome

**Fix before merging:** items (2) and (3) — `getSuggestion` throw → return null, and search post-filtering → server-side filters.

**Track for later:** items (4-6) are scaling risks but not blockers for initial implementation.

## Session Stats

```
claudecode Session Stats: dd9e5df2-64b5-406c-97a5-33f39578b70c
========================================
Models Used:  claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         64
  Output Tokens        8,380
  Cache Creation Input 244,068
  Cache Read Input     1,477,341
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   64
  Total Output Tokens  8,380
  Total Cache Creation 244,068
  Total Cache Read     1,477,341
----------------------------------------
GRAND TOTAL TOKENS:  1,729,853
========================================
```
