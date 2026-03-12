---
date: 2026-03-12T19:45:47Z
type: plan
status: complete
agent: claudecode
models: [claude-sonnet-4-6]
sessionId: 2f76f152-e0bc-43e4-8fb0-2b48ece51bf6
branch: main
tags: [convex, mutations, queries, actions, tanstack-query, t4]
taskId: 4a143917-351d-4489-b638-32b1b90781aa
---

# T4: Convex Backend — Mutations, Queries & Actions

## Goal

Implement the full Convex data layer: all mutations (create/update/accept/reject/organize/archive),
queries (inbox, KB pages, archived, node detail, search, autocomplete), the `processCapture` action
stub (deterministic draft — no real AI), and all TanStack Query hooks. This is the complete backend
that T6–T9 UI tickets will build on.

## Skills

- `agent-logbook`
- `convex-functions`
- `convex-best-practices`
- `convex-schema-validator`
- `native-data-fetching`
- `test-driven-development`
- `verification-before-completion`

## Current State

From T1–T3, the following already exists:

- Full schema: `captures`, `nodes`, `edges`, `suggestions`, `users` (all indexes defined)
- `captures.ts`: `migrateGuestCaptures` mutation + `processCapture` internalAction stub (logs only)
- `users.ts`: `getCurrentUser` query
- `scripts/seedAgentUser.ts`: seeds the AI agent user (`userType="agent"`, `displayName="CookBot"`)

## File Plan

### Convex Backend (`apps/assistant-convex/convex/`)

| File             | New/Expand | Contents                                                                                                                                                                                                                                                             |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `captures.ts`    | Expand     | `createCapture`, `updateCapture`, `acceptSuggestion`, `rejectSuggestion`, `organizeCapture`, `archiveCapture`, `unarchiveCapture`, `retryProcessing`, `getInboxCaptures`, `getRecentCaptures`, `getArchivedCaptures` (internal helper), update `processCapture` stub |
| `nodes.ts`       | New        | `archiveNode`, `unarchiveNode`, `getKnowledgeBasePages`, `getNodeWithEdges`, internal helpers for publish/delete draft nodes                                                                                                                                         |
| `edges.ts`       | New        | `createEdge` mutation, internal helpers for edge operations                                                                                                                                                                                                          |
| `suggestions.ts` | New        | `getSuggestion` query                                                                                                                                                                                                                                                |
| `search.ts`      | New        | `searchGlobal` query, `searchNodesForLinking` query                                                                                                                                                                                                                  |

### TanStack Query Hooks (`apps/assistant-mobile/src/modules/`)

| File                         | Contents                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capture/use-captures.ts`    | `useInboxCaptures`, `useRecentCaptures`, `useCaptureDetails`, `useSuggestion`, `useCreateCapture`, `useUpdateCapture`, `useAcceptSuggestion`, `useRejectSuggestion`, `useOrganizeCapture`, `useArchiveCapture`, `useUnarchiveCapture` |
| `knowledge/use-knowledge.ts` | `useKnowledgeBasePages`, `useArchived`, `useNodeDetails`, `useNodeAutocomplete`, `useArchiveNode`, `useUnarchiveNode`                                                                                                                 |
| `search/use-search.ts`       | `useSearchResults`                                                                                                                                                                                                                    |
| `edges/use-edges.ts`         | `useCreateEdge`                                                                                                                                                                                                                       |

## Implementation Steps

### Step 1: Expand `captures.ts` — capture mutations

**`createCapture(rawContent, captureType)`**

- Auth required: get identity → look up user via `by_workos_user_id`
- Insert capture with `captureState="processing"`, `capturedAt=Date.now()`, `explicitMentionNodeIds=[]`
- Parse `@`-mentions from `rawContent` → populate `explicitMentionNodeIds` (regex: `@\[([^\]]+)\]\(node:([a-z0-9]+)\)`)
- Schedule `internal.captures.processCapture` via `ctx.scheduler.runAfter(0, ...)`
- Return new captureId

**`updateCapture(captureId, updates: { rawContent?, captureType? })`**

- Auth: verify `capture.ownerUserId === user._id`
- Re-parse `@`-mentions from new `rawContent` → update `explicitMentionNodeIds`
- If `rawContent` changed and a pending suggestion exists → mark suggestion `stale`
- Set `updatedAt = Date.now()`

**`acceptSuggestion(captureId, suggestionId)`**

- Auth: verify capture ownership
- Fetch suggestion; verify `suggestion.captureId === captureId` and `status === "pending"`
- Publish draft nodes: query `nodes` where `ownerUserId=capture.ownerUserId`, `sourceCaptureId=captureId`, `publishedAt=undefined`, `archivedAt=undefined` → set `publishedAt=now`
- Publish draft edges: for each published node, query edges via `by_publishedAt_archivedAt_from_node` and `by_publishedAt_archivedAt_to_node` (where `publishedAt=undefined`, `archivedAt=undefined`) → set `publishedAt=now`, `verified=true`
- Update suggestion: `status="accepted"`, `processedAt=now`
- Update capture: `captureState="processed"`, `nodeId=suggestion.suggestedNodeId`

**`rejectSuggestion(captureId, suggestionId)`**

- Auth: verify capture ownership
- Fetch suggestion; verify ownership and pending status
- Hard-delete all draft nodes: query by `ownerUserId`, `sourceCaptureId`, `publishedAt=undefined`, `archivedAt=undefined` → `ctx.db.delete` each
- Hard-delete associated draft edges: for each draft node, find edges (both from/to) where `publishedAt=undefined` → `ctx.db.delete` each
- Update suggestion: `status="rejected"`, `processedAt=now`
- Update capture: `captureState="needs_manual"`

**`organizeCapture(captureId, nodeTitle)`**

- Auth: verify capture ownership
- Create a **published** node: `{ title: nodeTitle, content: capture.rawContent, searchText: \`${nodeTitle}\n\n${capture.rawContent}\`, ownerUserId, publishedAt: now, sourceCaptureId: captureId, createdAt: now, updatedAt: now }`
- For each `nodeId` in `capture.explicitMentionNodeIds`, create a **published** edge: `{ fromNodeId: newNodeId, toNodeId: nodeId, edgeType: "explicit", source: "user", verified: true, publishedAt: now, createdAt: now }`
- Update capture: `captureState="processed"`, `nodeId=newNodeId`

**`archiveCapture(captureId)`** / **`unarchiveCapture(captureId)`**

- Auth: verify ownership
- Set `archivedAt=Date.now()` / clear `archivedAt=undefined`
- Set `updatedAt=now`

**`retryProcessing(captureId)`** (action)

- Auth: verify ownership
- Fetch capture; verify `captureState === "failed"`
- Update `captureState = "processing"` via `ctx.runMutation`
- Re-enqueue `internal.captures.processCapture`

### Step 2: Update `processCapture` stub in `captures.ts`

The stub must create real draft artifacts (no AI, deterministic output):

1. `ctx.runQuery(internal.captures.getCaptureInternal, { captureId })` — get capture
2. `ctx.runQuery(internal.users.getAgentUserInternal, {})` — get agent user (by `userType="agent"`)
3. If no agent user found: `ctx.runMutation(internal.captures.setCaptureFailed, { captureId })` → return
4. `ctx.runMutation(internal.captures.saveDraftSuggestion, { captureId, agentUserId, ... })`:
   - Create draft node: `{ title: \`[Draft] ${rawContent.slice(0, 60)}\`, content: rawContent, searchText: ..., ownerUserId: capture.ownerUserId, sourceCaptureId: captureId, publishedAt: undefined, createdAt: now, updatedAt: now }`
   - Create draft edges from `explicitMentionNodeIds`: `{ fromNodeId: draftNodeId, toNodeId: mentionedNodeId, edgeType: "suggested", source: "processor", verified: false, publishedAt: undefined, createdAt: now }`
   - Create `suggestions` row: `{ captureId, suggestorUserId: agentUserId, suggestedNodeId: draftNodeId, status: "pending", createdAt: now }`
   - Update capture: `captureState = "ready"`

Note: Use `internalMutation` for `saveDraftSuggestion` and `setCaptureFailed` so they run transactionally. The action calls them via `ctx.runMutation`.

### Step 3: Expand `captures.ts` — capture queries

**`getInboxCaptures`** (query)

- Auth required
- Run 4 parallel queries via `by_owner_archivedAt_capture_state` for inbox states: `processing`, `ready`, `failed`, `needs_manual` (all with `archivedAt=undefined`)
- Merge + sort by `capturedAt` desc
- For captures in `ready` state, fetch pending suggestion via `by_capture_status`
- Return `capture + suggestion + suggestor display info`

**`getRecentCaptures(limit=20)`** (query)

- Auth required
- Query `by_owner_archivedAt` with `archivedAt=undefined`, order by `_creationTime` desc, take `limit`
- Note: Convex doesn't allow ordering by arbitrary fields unless indexed. Use `capturedAt` ordering by collecting + sorting client-side, or rely on `_creationTime`. Since the index is `by_owner_archivedAt`, collect and sort by `capturedAt` desc, limit to 20.

### Step 4: Create `nodes.ts`

**`archiveNode(nodeId)`** / **`unarchiveNode(nodeId)`** (mutations)

- Auth: verify `node.ownerUserId === user._id`
- Set `node.archivedAt = now` / clear `node.archivedAt = undefined`
- Archive related edges: query `by_archivedAt_from_node` with `archivedAt=undefined, fromNodeId=nodeId` + `by_archivedAt_to_node` with `archivedAt=undefined, toNodeId=nodeId` → set/clear `archivedAt`

**`getKnowledgeBasePages`** (query)

- Auth required
- Query `by_owner_archivedAt_publishedAt_updatedAt` with `ownerUserId=userId`, `archivedAt=undefined`, `publishedAt > 0`, order `desc`
- For each node, count edges: query `by_publishedAt_archivedAt_from_node` and `by_publishedAt_archivedAt_to_node`
- Return nodes with `edgeCount`

**`getNodeWithEdges(nodeId)`** (query)

- Auth required
- Fetch node; verify `ownerUserId === userId`
- Outgoing edges: query `by_publishedAt_archivedAt_from_node` with `publishedAt>0, archivedAt=undefined, fromNodeId=nodeId`
- Incoming edges: query `by_publishedAt_archivedAt_to_node` with `publishedAt>0, archivedAt=undefined, toNodeId=nodeId`
- For each edge: fetch linked node; if `linkedNode.ownerUserId === userId` → return preview; else → return `{ type: "private" }`
- Return `{ node, outgoing: EdgeWithPreview[], incoming: EdgeWithPreview[] }`

### Step 5: Create `edges.ts`

**`createEdge(fromNodeId, toNodeId, edgeType?)`** (mutation)

- Auth required
- Verify caller owns both `fromNodeId` and `toNodeId` nodes
- Check no duplicate via `by_edge_pair` index
- Insert published edge: `{ publishedAt: now, verified: true, source: "user", edgeType: edgeType ?? "explicit" }`

### Step 6: Create `suggestions.ts`

**`getSuggestion(captureId)`** (query)

- Auth required
- Verify `capture.ownerUserId === userId`
- Query `by_capture_status` with `captureId, status="pending"`
- Fetch `suggestorUserId` user row for attribution display
- Return `suggestion + suggestor { displayName, userType, agentProvider }`

### Step 7: Create `search.ts`

**`searchGlobal(query)`** (query)

- Auth required
- Search `captures` via `search_raw`: filter `ownerUserId=userId`, exclude `archivedAt` set, exclude `captureState="processed"` (via post-filter)
- Search `nodes` via `search_nodes`: filter `ownerUserId=userId`, `archivedAt=undefined`, `publishedAt>0`
- Merge results with type tag (`"capture"` | `"node"`)
- Return top 20 merged results

**`searchNodesForLinking(query)`** (query)

- Auth required
- Search `nodes` via `search_nodes`: filter `ownerUserId=userId`, `archivedAt=undefined`, `publishedAt>0`
- Return top 10 `{ _id, title }` matches

### Step 8: Create TanStack Query Hooks

Pattern for **query hooks** (real-time via `@convex-dev/react-query`):

```ts
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';

export function useInboxCaptures() {
  return useQuery(convexQuery(api.captures.getInboxCaptures, {}));
}
```

Pattern for **mutation hooks** (imperative via `useConvex`):

```ts
import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { useConvex } from 'convex/react';

export function useCreateCapture() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args) => convex.mutation(api.captures.createCapture, args),
  });
}
```

**Files and hooks:**

`capture/use-captures.ts`:

- `useInboxCaptures()` — convexQuery
- `useRecentCaptures(limit?)` — convexQuery
- `useCaptureDetails(captureId)` — convexQuery (reuses getNodeWithEdges or separate internal query)
- `useSuggestion(captureId)` — convexQuery
- `useCreateCapture()` — useMutation
- `useUpdateCapture()` — useMutation
- `useAcceptSuggestion()` — useMutation
- `useRejectSuggestion()` — useMutation
- `useOrganizeCapture()` — useMutation
- `useArchiveCapture()` — useMutation
- `useUnarchiveCapture()` — useMutation

`knowledge/use-knowledge.ts`:

- `useKnowledgeBasePages()` — convexQuery
- `useArchived()` — convexQuery (calls `getArchivedItems`)
- `useNodeDetails(nodeId)` — convexQuery (calls `getNodeWithEdges`)
- `useNodeAutocomplete(query)` — convexQuery (calls `searchNodesForLinking`)
- `useArchiveNode()` — useMutation
- `useUnarchiveNode()` — useMutation

`search/use-search.ts`:

- `useSearchResults(query)` — convexQuery (calls `searchGlobal`)

`edges/use-edges.ts`:

- `useCreateEdge()` — useMutation

### Step 9: Add `getArchivedItems` query to `captures.ts` (or separate file)

**`getArchivedItems`** (query, in `captures.ts` or new `archive.ts`)

- Auth required
- Archived captures: query `by_owner_archivedAt` with `q.gt("archivedAt", 0)`
- Archived nodes: query `nodes.by_owner_archivedAt` with `q.gt("archivedAt", 0)` (needs to be in a combined query)
- Since captures + nodes are in the same query, put in `captures.ts` with cross-table reads, or a dedicated `archive.ts`
- Decision: put in `captures.ts` as `getArchivedItems` for colocation with other capture queries

### Step 10: Lint & Test

```bash
pnpm run lint:fix && pnpm -w run lint && pnpm -w run test
```

## Key Design Decisions

1. **Internal mutations for action orchestration**: `processCapture` action calls `internal.captures.*` mutations for DB writes — keeps writes transactional while allowing async orchestration from actions.

2. **Query organization by domain**: `captures.ts`, `nodes.ts`, `edges.ts`, `suggestions.ts`, `search.ts` — one file per Convex table/domain. Avoids god files while keeping related logic together.

3. **`getInboxCaptures` fetches 4 states separately**: Convex doesn't support `IN` queries on indexed fields. Run one query per inbox state and merge in-memory. At most 4 queries for up to ~100 inbox items total — acceptable for MVP.

4. **`getRecentCaptures` sorts in-memory**: The `by_owner_archivedAt` index doesn't have `capturedAt` as a sort key. Collect results (limit to reasonable bound e.g. 50), sort by `capturedAt` desc, return `limit`. For Phase 1 this is fine.

5. **`processCapture` stub uses `internalMutation`**: This means the stub's DB writes are transactional. The title format is `[Draft] <first 60 chars>` — deterministic and easy to identify in testing.

6. **TanStack hooks use `convexQuery`**: `@convex-dev/react-query` is already installed. All query hooks use `convexQuery` wrapper for real-time subscriptions. Mutation hooks use `useConvex()` + `useMutation` (matching the established pattern in `use-migrate-guest-captures.ts`).

7. **Hook colocation by mobile module**: `capture/`, `knowledge/`, `search/`, `edges/` modules — matching the existing module pattern. Hooks are thin wrappers; no business logic.

8. **`searchGlobal` post-filters `captureState="processed"`**: The search index on captures doesn't filter by state; we post-filter after fetching results to exclude processed captures from inbox search.

9. **Edge deduplication in `createEdge`**: Check `by_edge_pair` before inserting to prevent duplicate edges.

## Key Files

| File                                                           | Role                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/assistant-convex/convex/schema.ts`                       | Source of truth for all table schemas and indexes           |
| `apps/assistant-convex/convex/captures.ts`                     | Expand: add all capture mutations + queries                 |
| `apps/assistant-convex/convex/nodes.ts`                        | New: node mutations + queries                               |
| `apps/assistant-convex/convex/edges.ts`                        | New: edge mutation                                          |
| `apps/assistant-convex/convex/suggestions.ts`                  | New: suggestion query                                       |
| `apps/assistant-convex/convex/search.ts`                       | New: search queries                                         |
| `apps/assistant-mobile/src/modules/capture/use-captures.ts`    | New: capture TanStack hooks                                 |
| `apps/assistant-mobile/src/modules/knowledge/use-knowledge.ts` | New: knowledge TanStack hooks                               |
| `apps/assistant-mobile/src/modules/search/use-search.ts`       | New: search TanStack hook                                   |
| `apps/assistant-mobile/src/modules/edges/use-edges.ts`         | New: edge mutation hook                                     |
| `apps/assistant-convex/convex/scripts/seedAgentUser.ts`        | Existing: seeds agent user (needed for processCapture stub) |

## Acceptance Criteria Checklist

- [ ] `createCapture` creates with `captureState="processing"` and schedules processing
- [ ] `updateCapture` re-parses `@` mentions and marks suggestion stale on content change
- [ ] `acceptSuggestion` publishes draft nodes/edges, links `capture.nodeId`
- [ ] `rejectSuggestion` hard-deletes draft nodes/edges, sets `captureState="needs_manual"`
- [ ] `organizeCapture` creates published node + edges from `explicitMentionNodeIds`
- [ ] `archiveNode` archives related edges
- [ ] `processCapture` stub creates draft node + draft edges + suggestion row + sets `captureState="ready"`
- [ ] All queries return correct filtered results (auth, archivedAt, publishedAt)
- [ ] All TanStack Query hooks implemented and typed
- [ ] `pnpm run lint` passes
- [ ] `pnpm run test` passes (type-check passes for Convex)

## Open Questions

1. **`getRecentCaptures` ordering**: The tech plan says "ordered by `capturedAt` desc" but there's no index on `capturedAt`. Plan: collect via `by_owner_archivedAt`, sort in-memory, limit 20. Acceptable for MVP.

2. **`useCaptureDetails` query**: T4 spec mentions `useCaptureDetails(captureId)` but no corresponding `getCapture(captureId)` query is defined. Will add a simple `getCapture(captureId)` query to `captures.ts` that returns capture + suggestion.

3. **`getArchivedItems` cross-table**: This returns both captured + nodes. Since Convex queries are per-table, we'll run both queries in the same handler and return merged results.

## References

- Ticket: `T4: Convex Backend — Mutations, Queries & Actions`
- Technical Plan: `44be7e7f-9362-4608-8f89-1633275f0edd` — backend components section
- Previous T3 plan: `.agent-logbook/plans/2026-03-10_173354Z_claudecode_t3-offline-guest-capture.md`
- Convex schema: `apps/assistant-convex/convex/schema.ts`
- Existing hook pattern: `apps/assistant-mobile/src/modules/capture/use-migrate-guest-captures.ts`

## Session Stats

```
claudecode Session Stats: 2f76f152-e0bc-43e4-8fb0-2b48ece51bf6
========================================
Models Used:  claude-sonnet-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         1,156
  Output Tokens        12,930
  Cache Creation Input 209,727
  Cache Read Input     1,329,025
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   1,156
  Total Output Tokens  12,930
  Total Cache Creation 209,727
  Total Cache Read     1,329,025
----------------------------------------
GRAND TOTAL TOKENS:  1,552,838
========================================
```
