---
date: 2026-04-01T20:41:52Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6]
branch: capture-llm-processing
tags: [capture, ingestion, links, topics, organization]
---

# Capture Ingestion Improvements — Draft v1

## Goal

Improve the capture ingestion experience, primarily for link processing. The user saves many links daily from various sources (Instagram, X, GitHub, Reddit, etc.) and the current experience is messy — stub processing only, no URL metadata extraction, no real topic assignment.

## Scope

**In scope:** Priority 1 — Link processing, topic aggregation, and rediscoverability.
**Deferred:** Priority 2 (remembering things/receipts), Priority 3 (tasks/reminders), Priority 4 (image curation).

## Steps (Draft v1)

1. **Phase 1**: Activate real `embedAndClassify` pipeline (replace stub `processCapture`)
2. **Phase 2**: Link metadata extraction — new `linkMetadata` table, URL fetcher, client-side extraction for blocked domains via share sheet
3. **Phase 3**: Topic-based link aggregation — LLM topic assignment with hybrid confidence model (auto-assign >0.8, suggest otherwise)
4. **Phase 4**: Topic activity feed in chat format — extend node detail view with activity/chat tab
5. **Phase 5**: Formal document generation — versioned markdown from topic activity
6. **Phase 6**: Rediscoverability — search indexes on link metadata, domain browsing
7. **Phase 7**: Tool request system — agent logs when it can't process a link

## Key Decisions

- **Topic UI**: Extend existing node detail view (not a separate screen) — when a node is a topic, it gets an activity feed tab
- **Blocked domains**: Client-side metadata extraction via share sheet (not server-side workarounds)
- **Topic confidence**: Hybrid model — auto-assign when high confidence, suggest for review when uncertain. Setting to override is a future improvement.

## Open Questions

- **User critique**: Topics as a separate entity vs everything being nodes. React and Svelte are both "JavaScript" and "Web Frameworks" — the hierarchy is a graph, not a tree. Should we eliminate the `topics` table entirely and just use nodes + edges?
- How should document generation handle conflicting/evolving information across links?

## References

- Plan file: `.claude/plans/memoized-brewing-balloon.md`
- Current captures implementation: `apps/assistant-convex/convex/captures.ts`
- Schema: `apps/assistant-convex/convex/schema.ts`
- Traycer specs: `docs/traycer/`

---

# Capture Ingestion Improvements (original plan from claude code)

## Context

The user saves many links daily from various sources (Instagram, X, GitHub, Reddit, etc.) and the current experience is messy. Captures are processed by a **stub** that just creates `[Draft] <first 60 chars>` nodes — no URL fetching, no metadata extraction, no real topic assignment. The full LLM pipeline (`embedAndClassify`) exists but is disconnected. The goal is to make captured links **organized and rediscoverable**, with related content grouped by topic and activity threaded in a chat format.

## Scope

**In scope (this plan):** Priority 1 — Link processing, topic aggregation, and rediscoverability.
**Deferred:** Priority 2 (remembering things/receipts), Priority 3 (tasks/reminders), Priority 4 (image curation).

---

## Phase 1: Activate Real Processing Pipeline

**Goal:** Replace the stub `processCapture` with the real `embedAndClassify` action.

**Changes:**

- `convex/captures.ts` — `processCapture` (currently internalMutation, line ~497): Instead of calling `saveDraftSuggestion` directly, schedule `embedAndClassify` as an internalAction. Keep the mutation thin — validate capture state, then `ctx.scheduler.runAfter(0, internal.captures.embedAndClassify, {...})`.
- Verify `embedAndClassify` error handling and `retryProcessing` flow still work.

**Files:** `apps/assistant-convex/convex/captures.ts`

---

## Phase 2: Link Metadata Extraction

**Goal:** When processing a link capture, fetch the URL and extract rich metadata.

### 2a. Schema — new `linkMetadata` table

```
linkMetadata: defineTable({
  captureId: v.id('captures'),
  url: v.string(),
  canonicalUrl: v.optional(v.string()),
  domain: v.string(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  faviconUrl: v.optional(v.string()),
  ogImageUrl: v.optional(v.string()),
  ogImageStorageId: v.optional(v.id('_storage')),
  contentSnippet: v.optional(v.string()),  // first ~500 chars of page text
  fetchedAt: v.number(),
  fetchStatus: 'success' | 'partial' | 'failed',
  ownerUserId: v.id('users'),
})
  .index('by_capture', ['captureId'])
  .index('by_url', ['url'])
  .index('by_domain_owner', ['domain', 'ownerUserId'])
```

Separate table (not fields on captures) because: metadata is optional, varies by source, and may be re-fetched independently.

### 2b. Link fetcher

New file: `convex/ai/linkFetcher.ts`

- `fetchLinkMetadata(url: string)` — uses `fetch()` (available in Convex actions)
- Parse HTML for: `<title>`, OG tags, `<meta name="description">`, favicon
- Extract text content (strip tags, first 500 chars) for `contentSnippet`
- 5s timeout, graceful degradation on failure

**Client-side extraction (for blocked domains like Instagram, X):**

- When sharing from these apps to the mobile app via share sheet, extract metadata on-device before sending to backend
- The share extension can access the page title, URL, and sometimes preview images that server-side fetch cannot
- Schema supports both paths: server-fetched metadata and client-provided metadata stored in the same `linkMetadata` table
- Add optional `clientMetadata` fields to `createCapture` mutation to accept pre-extracted metadata from the mobile app

### 2c. Wire into processing pipeline

In `embedAndClassify`: if `captureType === 'link'`, extract URL from `rawContent`, call `fetchLinkMetadata`, save via `saveLinkMetadata` mutation, then use enriched content (title + description + snippet) as input to embedding/title generation instead of the raw URL.

### 2d. Auto-detect URLs

In `createCapture` mutation: if `captureType === 'text'` but `rawContent` matches a URL pattern, auto-upgrade to `'link'`.

**Files:**

- `apps/assistant-convex/convex/schema.ts`
- `apps/assistant-convex/convex/ai/linkFetcher.ts` (new)
- `apps/assistant-convex/convex/linkMetadata.ts` (new — mutations/queries)
- `apps/assistant-convex/convex/captures.ts`

---

## Phase 3: Graph-Based Content Organization (Replaces Topics)

**Goal:** Links on the same subject get grouped together automatically — but using **nodes + edges only**, not a separate "topics" system.

### The Problem with Topics as a Separate Entity

The current `topics` and `nodeTopics` tables model categorization as a flat list. But real knowledge is a graph:

- "React" relates to both "JavaScript" and "Web Frameworks"
- "Svelte" also relates to "JavaScript" and "Web Frameworks"
- "JavaScript" relates to "Programming Languages" and "Web Development"

A separate topics table forces you to pick _one_ category. Nodes + edges naturally support multi-dimensional relationships.

### Three Proposed Solutions

#### Option A: Pure Graph — Everything is a Node (Recommended)

**Eliminate the `topics` and `nodeTopics` tables entirely.** Everything is a node. "JavaScript", "React", and a saved GitHub link are all nodes — they differ only in how many edges they have and what content they contain.

**How "topics" emerge:**

- A node with many incoming edges is effectively a topic (e.g., "JavaScript" has 20 links pointing to it)
- The UI can surface "hub nodes" — nodes ranked by edge count or recent activity
- No artificial distinction between a "topic" and a "page"

**Schema changes:**

- Delete `topics` and `nodeTopics` tables
- Add optional `nodeKind` to nodes for UI hints (not a hard category):

  ```
  nodeKind: v.optional(v.union(v.literal('content'), v.literal('concept')))
  ```

  - `content`: created from a capture (link, text, task) — has `sourceCaptureId`
  - `concept`: created by LLM or user as an organizing node (e.g., "JavaScript", "Recipes")
  - Optional — defaults to `content` if from a capture, `concept` if created without one

- Add `label` edge type for semantic relationships:
  ```
  edgeType: 'explicit' | 'suggested' | 'reference' | 'related' | 'categorized_as'
  ```

**LLM processing flow:**

1. Process capture → create content node
2. Embed → find similar existing nodes via vector search
3. Ask LLM: "Given this content and these similar nodes, what concept nodes should this link to? Create new concept nodes if needed."
4. Create edges: content node →[categorized_as] concept node(s)
5. Hybrid confidence: auto-create edge if confidence > 0.8, suggest for review if lower

**Example graph:**

```
[GitHub: React 19 blog post] →[categorized_as] [React]
[GitHub: React 19 blog post] →[categorized_as] [JavaScript]
[X post: Svelte 5 runes]     →[categorized_as] [Svelte]
[X post: Svelte 5 runes]     →[categorized_as] [JavaScript]
[X post: Svelte 5 runes]     →[categorized_as] [Web Frameworks]
[React]                       →[related]         [Web Frameworks]
[Svelte]                      →[related]         [Web Frameworks]
```

**Pros:** Simplest model, most flexible, no separate concept of "topics"
**Cons:** Need good UI to surface hub nodes; concept nodes may proliferate without curation

#### Option B: Typed Edges with Weights (Graph + Richer Edges)

Same as Option A but with richer edge metadata to capture _why_ things are related:

```
edgeFields += {
  weight: v.optional(v.number()),      // 0-1, how strong the relationship
  context: v.optional(v.string()),     // "both are JS frameworks"
}
```

**Pros:** More nuanced relationships, better for rediscovery ("show me things related to React _because of_ JavaScript")
**Cons:** More complexity in edge creation and querying

#### Option C: Keep Topics as a View Layer Only

Don't store topics at all. Instead, dynamically compute "topics" from the graph:

- Query nodes with the most incoming `categorized_as` edges → these are your "topics"
- k-means clustering on embeddings can still run periodically to suggest new concept nodes
- The UI shows "top concepts" as a browsing entry point

**Pros:** Zero additional schema, emergent organization
**Cons:** Slower queries (need to aggregate edges), no way to manually pin/order topics

### 3a. Implementation (Option A — Recommended)

**Schema changes:**

- Add `nodeKind` field to `nodeFields`
- Add `'categorized_as'` to `edgeType` union
- Remove `topics` and `nodeTopics` tables (or deprecate — stop writing to them)

**New file: `convex/ai/nodeLinker.ts`** (replaces `topicAssignment.ts`)

- After embedding, ask LLM to identify concept nodes this content relates to
- Search existing concept nodes by embedding similarity AND full-text
- Create new concept nodes if LLM identifies novel concepts
- Create `categorized_as` edges with confidence scores
- Hybrid: auto-link if confidence > 0.8, suggest if lower

**Files:**

- `apps/assistant-convex/convex/schema.ts`
- `apps/assistant-convex/convex/ai/nodeLinker.ts` (new)
- `apps/assistant-convex/convex/captures.ts` (wire into pipeline)
- `apps/assistant-convex/convex/topics.ts` (deprecate or remove)

---

## Phase 4: Node Activity Feed (Chat Format)

**Goal:** Any node (especially concept/hub nodes) has a chronological activity feed showing linked content, thoughts, and updates.

### 4a. Activity as captures on a node

Instead of a separate `topicActivity` table, **activity on a node is just captures that mention that node**. This reuses the existing capture system:

- User adds a thought to a node → creates a capture with an explicit @mention of that node
- Link gets categorized to a node → the capture has an edge to that node
- The "activity feed" is a query: all captures whose resulting nodes have edges to this node, sorted by `capturedAt`

**No new table needed.** The activity feed is a _view_ over existing data (captures + edges).

### 4b. Query for activity feed

New query: `getNodeActivity(nodeId)` — returns captures/nodes connected to this node, ordered chronologically. Includes:

- Content nodes linked via `categorized_as` edges (with their link metadata)
- Captures that explicitly @mention this node
- Direct child thoughts (captures where this node is the target)

### 4c. Mobile UI — extend node detail view

When viewing any node (but especially concept nodes with many edges):

- Activity tab: chronological feed of linked content and thoughts
- Input bar for adding thoughts (creates a capture @mentioning this node)
- Link metadata previews for content nodes that have `linkMetadata`

**Files:**

- `apps/assistant-convex/convex/nodes.ts` or `convex/captures.ts` (new query)
- `apps/assistant-mobile/src/app/` (extend node detail screen)

---

## Phase 5: Formal Document Generation

**Goal:** From a node's activity/linked content, generate a versioned formatted document.

### Schema — new `nodeDocuments` table

```
nodeDocuments: defineTable({
  nodeId: v.id('nodes'),
  version: v.number(),
  title: v.string(),
  content: v.string(),          // markdown
  generatedAt: v.number(),
  generatedFromEdgesUpTo: v.number(),  // timestamp cutoff
  isEdited: v.boolean(),
  ownerUserId: v.id('users'),
})
  .index('by_node_version', ['nodeId', 'version'])
```

- User triggers generation on any node → LLM produces structured markdown from all linked content
- Can regenerate (new version) or manually edit (sets `isEdited: true`)
- Works for any node, not just "topics"

**Files:**

- `apps/assistant-convex/convex/schema.ts`
- `apps/assistant-convex/convex/nodeDocuments.ts` (new)

---

## Phase 6: Rediscoverability Enhancements

- Add search index on `linkMetadata.title` with `domain` filter
- Enrich node `searchText` with link metadata (title + description + domain)
- Domain-based browsing: "all links from github.com"
- **Hub node browsing**: list concept nodes sorted by edge count or recent activity (replaces "topic browse")
- Concept nodes surface naturally as entry points for exploration

---

## Phase 7: Tool Request System (Lightweight)

When the agent can't fully process a link (e.g., server fetch fails and no client metadata was provided), it logs a tool request:

```
toolRequests: defineTable({
  description: v.string(),
  domain: v.optional(v.string()),
  frequency: v.number(),
  status: 'open' | 'implemented' | 'dismissed',
  createdAt: v.number(),
  ownerUserId: v.id('users'),
})
  .index('by_owner_status', ['ownerUserId', 'status'])
```

Aggregated by domain — shows you what tools would be most valuable to build.

---

## Implementation Order

| Step | What                                                                       | Depends On |
| ---- | -------------------------------------------------------------------------- | ---------- |
| 1    | Phase 1: Activate `embedAndClassify`                                       | —          |
| 2    | Phase 2a-c: Link metadata schema + fetcher + pipeline                      | Phase 1    |
| 3    | Phase 2d: Auto-detect URLs                                                 | Phase 2    |
| 4    | Phase 3: Graph-based organization (nodeKind, nodeLinker, deprecate topics) | Phase 1    |
| 5    | Phase 4: Node activity feed + mobile UI                                    | Phase 3    |
| 6    | Phase 5: Document generation                                               | Phase 4    |
| 7    | Phase 6: Search + hub node browsing                                        | Phase 2, 3 |
| 8    | Phase 7: Tool request system                                               | Phase 2    |

Phases 1-3 deliver the most immediate value — links become rich, organized, and connected to concept nodes.

## Verification

- After Phase 1: Submit a text capture, verify it goes through `embedAndClassify` and produces a real suggested title/edges
- After Phase 2: Submit a link capture (e.g., a GitHub repo URL), verify `linkMetadata` record is created with title/description/domain
- After Phase 3: Submit several links on related subjects (e.g., React tutorial + Svelte comparison), verify both get `categorized_as` edges to a "JavaScript" or "Web Frameworks" concept node
- After Phase 4: Open a concept node, verify activity feed shows linked captures chronologically
- Run `pnpm -w run lint` and `pnpm -w run test` after each phase
