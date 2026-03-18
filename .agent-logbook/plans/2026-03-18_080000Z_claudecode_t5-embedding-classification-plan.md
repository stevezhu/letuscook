---
date: 2026-03-18T08:00:00Z
type: plan
status: superseded
agent: claudecode
models: [claude-opus-4-6]
branch: t5
sessionId: afe02d86-d1f5-4836-b075-83aec994b6d0
taskId: T5
tags: [ai, embeddings, gemini, classification, vector-search, convex]
---

# T5: Embedding-Based Capture Classification with Gemini Embedding 2

## Goal

Replace the heavy LLM-based `processCapture` pipeline (T5 original plan) with an **embed-first, LLM-lite** approach using Gemini Embedding 2. The system embeds each capture, finds semantically similar existing nodes via Convex vector search, generates a title with a cheap LLM (Gemini Flash), and discovers emergent topic clusters from the embedding space.

## Approaches Explored

### Approach A: Embed-First, LLM-Lite (Selected)

1. Embed `rawContent` with Gemini Embedding 2 on capture creation
2. Vector search existing published nodes for top-K similar
3. Single cheap LLM call (Gemini Flash) for title generation, with similar nodes as context
4. Store embedding on the node for future similarity queries
5. Emergent topic clustering runs as a separate periodic job

**Pros**: Cheapest per-capture cost (~$0.0001 vs ~$0.01 for full LLM), embeddings are fast (~100ms), vector search is native in Convex
**Cons**: Title quality slightly lower than a full LLM pass with rich context

### Approach B: Embeddings-Only (Zero LLM)

Same as A, but skip the LLM entirely — derive title from the raw content (first sentence / first N chars, or closest matching node's pattern).

**Pros**: Zero LLM cost, fastest processing
**Cons**: Titles will be rough — truncated raw content instead of a clean summary

### Approach C: Dual Pipeline

Embeddings for classification/linking, full T5-style LLM pipeline (`generateObject`) for title + structured output. Essentially T5 original plan + embeddings layered together.

**Pros**: Highest quality output
**Cons**: Most expensive, most complex — ~100x cost of Approach A per capture

## Scope

### In Scope

- Install `@ai-sdk/google` (Gemini provider for Vercel AI SDK)
- Add `embedding` field + vector index to `nodes` table
- Embed captures with Gemini Embedding 2 (`gemini-embedding-001` or `gemini-embedding-2-preview`)
- Vector search against existing published nodes (Convex native vector search)
- Lightweight title generation via Gemini Flash (`generateText`)
- Draft node creation with embedding stored for future queries
- Draft edge creation to semantically similar nodes
- Emergent topic clustering via periodic scheduled job
- User-overridable classification system (custom categories)

### Out of Scope (Future TODOs)

- `newConcepts` extraction (LLM-based concept discovery from captures)
- LLM capture cleanup → polished node body (raw content → structured markdown)
- Human collaborator processor (Phase 2)
- Summarization routing (Phase 2)
- Multimodal embeddings (images, audio, video — Gemini Embedding 2 supports these but not needed yet)

## Current State Analysis

### Existing Code

- **`captures.ts:processCapture`** (internal mutation): Orchestrator that resolves agent user and calls `saveDraftSuggestion` stub
- **`model/captures.ts:saveDraftSuggestion`**: Stub that creates `[Draft] {content}` node + edges from explicit mentions only
- **`model/captures.ts:setCaptureFailed`**: Already exists for failure handling
- **`model/users.ts:getAgentUser`**: Queries first `userType="agent"` user
- **`schema.ts`**: No embedding fields or vector indexes currently defined
- **`package.json`**: No AI SDK deps currently installed

### Key Constraint: Convex Function Split

- Mutations cannot make external HTTP calls
- Embedding + LLM calls **must** happen in an internal action
- Vector search (`ctx.vectorSearch`) also only works in actions
- Flow: mutation (orchestrate) → action (embed + search + LLM) → mutation (save)

### Convex Vector Search

- Native support via `vectorIndex()` on table definitions
- `ctx.vectorSearch()` available in actions only
- Supports 2-4096 dimensions, up to 256 results, filter fields for scoping by user
- Returns `{ _id, _score }` pairs (score: -1 to 1 cosine similarity)

### Gemini Embedding 2

- Model: `gemini-embedding-001` (text-only, stable) or `gemini-embedding-2-preview` (multimodal)
- Dimensions: Flexible via Matryoshka (128-3072; recommended: 768)
- Task types: `SEMANTIC_SIMILARITY`, `CLASSIFICATION`, `RETRIEVAL_DOCUMENT`, `RETRIEVAL_QUERY`
- Input limit: 2048 tokens (embedding-001) / 8192 tokens (embedding-2-preview)
- Cost: ~$0.000004 per embed call

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ createCapture / migrateGuestCaptures / retryProcessing        │
│ (auth mutation) → scheduler.runAfter(0, processCapture)       │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ processCapture (internalMutation)                             │
│ 1. Fetch capture + resolve agent user                         │
│ 2. Schedule embedAndClassify action                           │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ embedAndClassify (internalAction)                             │
│ 1. Embed rawContent with Gemini Embedding 2                   │
│    (task_type: RETRIEVAL_DOCUMENT)                             │
│ 2. Vector search existing published nodes for top-K similar   │
│    (filter by ownerUserId, archivedAt=undefined)              │
│ 3. Generate title via Gemini Flash (with similar nodes as     │
│    context for better naming)                                 │
│ 4. On success: schedule saveEmbeddingResult mutation          │
│ 5. On failure: schedule setCaptureFailed mutation             │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ saveEmbeddingResult (internalMutation)                        │
│ 1. Create draft node:                                         │
│    - title = LLM-generated title                              │
│    - content = rawContent                                     │
│    - embedding = float64 array                                │
│    - publishedAt = unset (draft)                              │
│    - sourceCaptureId = captureId                              │
│ 2. Create draft edges to similar nodes:                       │
│    - edgeType: 'suggested', source: 'processor'               │
│    - confidence = similarity score from vector search          │
│    - verified: false                                          │
│ 3. Create edges from explicitMentionNodeIds:                  │
│    - edgeType: 'suggested', source: 'processor'               │
│ 4. Create suggestion row                                      │
│ 5. Set captureState = 'ready'                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ clusterTopics (scheduled cron / internalAction)               │
│ 1. Fetch all published node embeddings for a user             │
│ 2. Run clustering algorithm (k-means or HDBSCAN-like)         │
│ 3. Persist cluster assignments to topics table                │
│ 4. Derive cluster labels from node titles within each cluster │
└──────────────────────────────────────────────────────────────┘
```

## Schema Changes

### Nodes Table — Add Embedding Field

```typescript
// Add to nodeFields:
embedding: v.optional(v.array(v.float64())),  // Gemini Embedding 2 vector

// Add vector index:
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 768,  // Matryoshka — 768 is recommended balance of quality/size
  filterFields: ["ownerUserId"],
})
```

### New Table: Topics (Emergent Clusters)

```typescript
topics: defineTable({
  label: v.string(), // Auto-derived or user-set label
  ownerUserId: v.id('users'),
  isUserDefined: v.boolean(), // false = emergent, true = user-created
  createdAt: v.number(),
  updatedAt: v.number(),
}).index('by_owner', ['ownerUserId']);
```

### New Table: Node Topics (Many-to-Many)

```typescript
nodeTopics: defineTable({
  nodeId: v.id('nodes'),
  topicId: v.id('topics'),
  confidence: v.optional(v.number()), // For emergent assignments
  source: v.union(v.literal('cluster'), v.literal('user')),
  createdAt: v.number(),
})
  .index('by_node', ['nodeId'])
  .index('by_topic', ['topicId']);
```

## Steps

### Step 1: Install Dependencies

- Add to `apps/assistant-convex/package.json`:
  - `ai` (core Vercel AI SDK)
  - `@ai-sdk/google` (Gemini provider)
  - `zod` (required by Vercel AI SDK)
- Run `pnpm install`

### Step 2: Schema Changes

- Add `embedding` field to `nodeFields` in `schema.ts`
- Add vector index `by_embedding` on nodes table (768 dimensions, filter by `ownerUserId`)
- Add `topics` table definition
- Add `nodeTopics` table definition

### Step 3: Create Embedding & Title Generation Logic

- **New file**: `convex/ai/embedding.ts`
  - `embedText(text: string)` — calls Gemini Embedding 2 via `@ai-sdk/google`
    - Uses task type `RETRIEVAL_DOCUMENT` for nodes, `RETRIEVAL_QUERY` for search queries
    - Returns 768-dimensional vector
  - `generateTitle(rawContent: string, similarNodes: {title: string, content: string}[])` — calls Gemini Flash via `generateText`
    - Simple prompt: "Generate a concise title for this content" with similar nodes as context
    - Returns string

### Step 4: Implement `embedAndClassify` Internal Action

- **File**: `convex/captures.ts` (new internal action)
- **Signature**: `internalAction({ args: { captureId, rawContent, captureType, ownerUserId }, handler })`
- **Logic**:
  1. Embed `rawContent` with Gemini Embedding 2
  2. Vector search published nodes: `ctx.vectorSearch("nodes", "by_embedding", { vector, filter: ownerUserId, limit: 5 })`
  3. Fetch full node docs for the top results
  4. Filter by similarity threshold (e.g., `_score > 0.7`)
  5. Generate title via Gemini Flash with similar node titles/content as context
  6. On success: `ctx.runMutation(internal.captures.saveEmbeddingResult, { ... })`
  7. On failure: `ctx.runMutation(internal.captures.setCaptureFailed, { captureId })`
- **Retry**: Simple retry (3 attempts with 1s/2s/4s backoff) — single provider (Google), no fallback chain needed

### Step 5: Implement `saveEmbeddingResult` Internal Mutation

- **File**: `convex/captures.ts` (new internal mutation)
- **Logic**:
  1. Create draft node with LLM title, rawContent body, embedding vector
  2. Create draft edges to similar nodes (from vector search results) with confidence scores
  3. Create draft edges from `explicitMentionNodeIds`
  4. Create suggestion row
  5. Set `captureState = "ready"`

### Step 6: Refactor `processCapture` Orchestrator

- Keep as `internalMutation`
- Replace call to `saveDraftSuggestion` with scheduling `embedAndClassify` action
- Resolve agent user, fetch capture, schedule action

### Step 7: Implement Emergent Topic Clustering

- **New file**: `convex/ai/clustering.ts`
  - Simple k-means implementation (or import a lightweight library)
  - Operates on 768-dim vectors
  - Auto-determines k using silhouette score or elbow method
  - Derives cluster labels from the most common words in node titles within each cluster

- **New file**: `convex/topics.ts`
  - `clusterTopics` (internal action): Fetches all published node embeddings for a user, runs clustering, persists to `topics` + `nodeTopics` tables
  - `getUserTopics` (query): Returns user's topics with node counts
  - `getTopicNodes` (query): Returns nodes in a topic
  - `setUserTopic` (mutation): User creates/renames a custom topic
  - `assignNodeToTopic` (mutation): User manually assigns a node to a topic

- **Scheduling**: Run `clusterTopics` periodically (e.g., daily) or trigger after N new nodes are added

### Step 8: Embed Existing Nodes (Backfill)

- **Migration action**: One-time job to embed all existing published nodes that don't have embeddings yet
- Batch process to respect rate limits
- Can be run via `npx convex run` or scheduled

### Step 9: Lint & Type-Check

- Run `pnpm run lint:fix` then `pnpm -w run lint`
- Run `pnpm -w run test`
- Fix any issues

## File Changes Summary

| File                                             | Action | Description                                                                         |
| ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| `apps/assistant-convex/package.json`             | Modify | Add `ai`, `@ai-sdk/google`, `zod`                                                   |
| `apps/assistant-convex/convex/schema.ts`         | Modify | Add embedding field, vector index, topics + nodeTopics tables                       |
| `apps/assistant-convex/convex/ai/embedding.ts`   | Create | Gemini Embedding 2 + Gemini Flash title generation                                  |
| `apps/assistant-convex/convex/ai/clustering.ts`  | Create | K-means clustering for emergent topics                                              |
| `apps/assistant-convex/convex/captures.ts`       | Modify | Refactor processCapture, add embedAndClassify action + saveEmbeddingResult mutation |
| `apps/assistant-convex/convex/topics.ts`         | Create | Topic CRUD, clustering trigger, queries                                             |
| `apps/assistant-convex/convex/model/captures.ts` | Keep   | Keep existing `saveDraftSuggestion` stub (not removed)                              |

## Cost Estimate (per capture)

| Component            | Cost            |
| -------------------- | --------------- |
| Gemini Embedding 2   | ~$0.000004      |
| Gemini Flash (title) | ~$0.0001        |
| Convex vector search | Free (included) |
| **Total**            | **~$0.0001**    |

Compare to T5 original plan (GPT-4o `generateObject`): ~$0.01 per capture — **~100x cheaper**.

## Future TODOs (Not in this plan)

- **`newConcepts` extraction**: LLM discovers new concept nodes from captures
- **LLM capture cleanup → node**: Transform raw capture into polished, structured node body
- **Multimodal embeddings**: Embed images/audio/video captures with Gemini Embedding 2 preview
- **Cross-user topic discovery**: Shared topic taxonomies across users (Phase 2 sharing)
- **Semantic search**: Use embeddings for search in addition to Convex full-text search

## Resolved Questions

1. **LLM usage**: Minimal — title generation only (Gemini Flash). Body is raw content as-is.
2. **Vector storage**: Native Convex vector search — no external vector DB needed.
3. **Embedding dimensions**: 768 (Matryoshka recommended balance of quality/storage).
4. **Topic clusters**: Emergent by default, user-overridable with custom categories.
5. **Provider fallback**: Not needed — single provider (Google) for both embeddings and title gen. Simple retry with backoff.

## References

- [Gemini Embedding 2](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/)
- [Convex Vector Search](https://docs.convex.dev/search/vector-search)
- [Vercel AI SDK](https://ai-sdk.dev/)
- T5 original plan: `.agent-logbook/plans/2026-03-18_042530Z_claudecode_t5-ai-processor-plan.md`
- Tech Plan: `Technical Plan: Letuscook Architecture`

## Session Stats

```
claudecode Session Stats: afe02d86-d1f5-4836-b075-83aec994b6d0
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         695
  Output Tokens        10,544
  Cache Creation Input 277,192
  Cache Read Input     2,579,852
----------------------------------------
SUBAGENTS (1 total):
  Input Tokens         4,626
  Output Tokens        7,642
  Cache Creation Input 270,135
  Cache Read Input     1,939,960
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   5,321
  Total Output Tokens  18,186
  Total Cache Creation 547,327
  Total Cache Read     4,519,812
----------------------------------------
GRAND TOTAL TOKENS:  5,090,646
========================================
```
