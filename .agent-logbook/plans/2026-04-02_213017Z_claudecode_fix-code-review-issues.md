---
date: 2026-04-02T21:30:17Z
type: plan
status: done
agent: claudecode
models: [claude-opus-4-6]
branch: capture-ingestion-improvements
sessionId: 23b45b61-fbc1-4da3-a93a-15cf8dd26cb4
tags: [assistant-convex, code-review, security, performance]
filesModified:
  - apps/assistant-convex/convex/linkMetadata.ts
  - apps/assistant-convex/convex/nodeLinker.ts
  - apps/assistant-convex/convex/nodes.ts
  - apps/assistant-convex/convex/schema.ts
  - apps/assistant-convex/convex/captures.test.ts
---

# Fix Important Issues from Code Review

## Context

The `capture-ingestion-improvements` branch adds graph-based content organization, link metadata, node documents, and restructured source files to `assistant-convex`. A code review identified 7 important issues — 1 security gap, 3 performance problems, 1 duplication, 1 missing test coverage, and 1 dead code. This plan addresses all 7.

## Tasks

### 1. Add ownership check to `getLinkMetadataByCapture`

**File:** `apps/assistant-convex/convex/linkMetadata.ts:44-52`

The query returns link metadata for any `captureId` without verifying the caller owns it. Fix by fetching the capture first via `getDocOwnedByCurrentUser`, returning `null` if not owned.

```ts
handler: async (ctx, args) => {
  const capture = await getDocOwnedByCurrentUser(ctx, 'captures', args.captureId);
  if (!capture) return null;
  return await ctx.db
    .query('linkMetadata')
    .withIndex('by_capture', (q) => q.eq('captureId', args.captureId))
    .unique();
},
```

### 2. Use search index in `findNodesByTitle`

**File:** `apps/assistant-convex/convex/nodeLinker.ts:13-24`

Currently collects ALL non-archived nodes then filters in-memory by title substring. The `search_nodes` index on `searchText` with `ownerUserId` filter already exists (`schema.ts:154-157`).

Replace the `.collect()` + `.filter()` with a `.withSearchIndex('search_nodes', ...)` query using the title substring as the search term and filtering by `ownerUserId`.

### 3. Use index for `getDomainList`

**File:** `apps/assistant-convex/convex/linkMetadata.ts:70-92`

Uses `.filter()` (full table scan) instead of an index. The `by_domain_owner` index exists but is `[domain, ownerUserId]` — not ideal for querying by owner alone.

Add a `by_owner` index on `['ownerUserId']` to the `linkMetadata` table in `schema.ts`, then use `.withIndex('by_owner', q => q.eq('ownerUserId', user._id))`.

### 4. Fix `unarchiveNode` edge queries

**File:** `apps/assistant-convex/convex/nodes.ts:95-106`

Currently uses `q.gt('archivedAt', 0)` which scans ALL archived edges, then post-filters by nodeId. The indexes `by_archivedAt_from_node` and `by_archivedAt_to_node` support `[archivedAt, fromNodeId/toNodeId]` — but we can't use `eq` on `archivedAt` since archived edges have varying timestamps.

**Approach:** Query by `by_edge_pair` (which uses `[fromNodeId, toNodeId]`) to get all edges for this node, then filter for those that have `archivedAt` set. This narrows the scan to only edges connected to this specific node. Alternatively, iterate all edges for the node using the `by_archivedAt_from_node` index but via streaming (for await) with `q.gt('archivedAt', 0).eq('fromNodeId', args.nodeId)` — however, Convex index prefix rules require equality on `archivedAt` before `fromNodeId`.

**Best approach:** Use `by_edge_pair` index to find edges by `fromNodeId`/`toNodeId`, then filter archived ones in-memory. This is bounded by the node's edge count, not the global archived edge count.

```ts
const [outgoing, incoming] = await Promise.all([
  ctx.db
    .query('edges')
    .withIndex('by_edge_pair', (q) => q.eq('fromNodeId', args.nodeId))
    .filter((q) => q.neq(q.field('archivedAt'), undefined))
    .collect(),
  ctx.db
    .query('edges')
    .withIndex('by_edge_pair', (q) => q.eq('toNodeId', args.nodeId)) // need a by_to_node index
    .filter((q) => q.neq(q.field('archivedAt'), undefined))
    .collect(),
]);
```

Note: `by_edge_pair` is `[fromNodeId, toNodeId]` — works for outgoing but not incoming. For incoming, we may need a new index `by_to_node` on `['toNodeId']`, or accept that incoming uses a less optimal path. Will verify index options during implementation.

### 5. Extract shared node+edge-count helper

**File:** `apps/assistant-convex/convex/nodes.ts:125-173, 245-294`

`getKnowledgeBasePages` and `getHubNodes` share identical logic: fetch published non-archived non-virtual nodes, count published non-archived edges per node. Only difference is sort order.

Extract a helper like `getNodesWithEdgeCounts(ctx, userId)` that returns the shared result, then each query just sorts differently.

### 6. Add tests for `embedAndClassify`

**File:** `apps/assistant-convex/convex/captures.test.ts`

Mocks already exist for `embedding`, `linkFetcher`, and `nodeLinker`. Add tests covering:

- Text capture: embeds content, performs vector search, generates title, creates node + edges
- Link capture: fetches metadata, enriches content, saves linkMetadata record
- Failure path: sets capture to failed status on error
- Explicit mention node IDs are included in edge creation

### 7. Remove `saveOrganizingEdges` dead code

**File:** `apps/assistant-convex/convex/nodeLinker.ts:50-87`

Zero callers across the codebase. The logic is inlined in `saveEmbeddingResult` (captures.ts). Delete the function and the `OrganizingEdgeInput` type if also unused.

## Minor Issues (noted, not planned)

- `nodeKind` is optional in schema — consider backfill migration later
- ~20 lines of commented-out code in `archiveNode` — clean up when touching that area
- `sleep` utility duplicated in `nodeDocuments.ts` and `nodeLinker.ts` — extract to `src/lib/helpers.ts`
- `extractContentSnippet` only handles a few HTML entities — acceptable for embedding context

## Verification

1. `pnpm run lint:fix` then `pnpm -w run lint`
2. `pnpm -w run test` — all existing + new tests pass
3. Manually verify `getLinkMetadataByCapture` returns null for captures not owned by the caller
