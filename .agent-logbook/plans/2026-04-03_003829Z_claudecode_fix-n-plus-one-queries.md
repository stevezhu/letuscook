---
date: 2026-04-03T00:38:32Z
type: plan
status: todo
agent: claudecode
models: [claude-opus-4-6]
branch: capture-ingestion-improvements
tags: [performance, convex, assistant-convex]
---

# Fix N+1 and N+2 Query Patterns in assistant-convex

## Goal

Eliminate unbounded fan-out query patterns in `apps/assistant-convex/convex/nodes.ts` that will degrade performance as data grows.

## Issues

### Issue 1: `getRegularNodesWithEdgeCounts` — N+1 pattern (nodes.ts:13-52)

**Problem:** For every regular node, 2 additional index queries count outgoing and incoming edges. With 100 nodes, that's 200+ queries per page load. Used by `getKnowledgeBasePages` and `getHubNodes`.

**Recommended approach — Hybrid (paginate now, denormalize later):**

1. **Short-term: Add pagination.** Add `.take(50)` or cursor-based pagination to the nodes query. This caps the fan-out (50 nodes × 2 = 100 queries max).
2. **Long-term: Denormalize edge counts onto the node document.** Add `incomingEdgeCount` / `outgoingEdgeCount` fields to `nodes`. Increment/decrement in all edge create/archive/unarchive mutations. This makes the read path a single query with zero fan-out.

**Trade-offs:**

- Pagination is quick but doesn't reduce per-node cost.
- Denormalization eliminates fan-out but requires maintaining counts in every edge mutation, and counts can drift if there's a bug.

### Issue 2: `getNodeActivity` — N+2 pattern (nodes.ts:194-249)

**Problem:** For each incoming edge, up to 3 lookups: `db.get(fromNode)`, `db.get(capture)`, `db.query(linkMetadata).unique()`. No limit on number of edges.

**Mitigating factor:** `db.get` by ID is a cheap point read in Convex, and all lookups run in parallel via `Promise.all`. The real risk is unbounded edge count.

**Recommended approach:**

1. **Add `.take(50)` on `incomingEdges`** — this is an activity feed, so pagination is natural. Caps the fan-out immediately.
2. **Add cursor-based pagination args** (`paginationOpts`) for the UI to load more.
3. If total count is needed separately, add a lightweight count-only query.

## Steps

- [ ] Add pagination to `getRegularNodesWithEdgeCounts` (limit nodes fetched)
- [ ] Add pagination to `getNodeActivity` (limit incoming edges)
- [ ] Update `getKnowledgeBasePages` and `getHubNodes` callers to pass pagination args
- [ ] Update mobile UI to support paginated loading for these queries
- [ ] (Follow-up) Denormalize edge counts onto node documents
- [ ] (Follow-up) Add migration to backfill edge counts on existing nodes

## Open Questions

- What page size makes sense for the knowledge base list view? (50? 20?)
- Does the mobile UI currently expect all results at once, or does it already support pagination?
- For denormalization: should we use a single `edgeCount` or split into `incomingEdgeCount`/`outgoingEdgeCount`?
