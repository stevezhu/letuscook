---
date: 2026-03-18T09:00:00Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6]
branch: t5
taskId: T5
tags: [ai, vercel-ai-sdk, embeddings, gemini, convex, captures, processing]
---

# T5: AI Capture Processing — Embedding Classification + Title Generation

## Goal

Replace the deterministic stub in `processCapture` with an **embed-first, LLM-lite** AI processing pipeline. Each capture is embedded with Gemini Embedding 2, semantically matched to existing nodes via Convex vector search, and titled with a cheap Gemini Flash call. Emergent topic clustering discovers structure from the embedding space.

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
│    (task_type: RETRIEVAL_DOCUMENT, 768 dims)                  │
│ 2. Vector search existing published nodes for top-K similar   │
│    (filter by ownerUserId, archivedAt=undefined)              │
│ 3. Filter by similarity threshold (score > 0.7)              │
│ 4. Generate title via Gemini Flash (with similar nodes as     │
│    context for better naming)                                 │
│ 5. On success: schedule saveEmbeddingResult mutation          │
│ 6. On failure: schedule setCaptureFailed mutation             │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ saveEmbeddingResult (internalMutation)                        │
│ 1. Create draft node:                                         │
│    - title = LLM-generated title                              │
│    - content = rawContent                                     │
│    - embedding = float64 array (768 dims)                     │
│    - publishedAt = unset (draft)                              │
│    - sourceCaptureId = captureId                              │
│ 2. Create draft edges to similar nodes:                       │
│    - edgeType: 'suggested', source: 'processor'               │
│    - confidence = similarity score from vector search          │
│    - verified: false                                          │
│ 3. Create edges from explicitMentionNodeIds                   │
│ 4. Create suggestion row (status=pending)                     │
│ 5. Set captureState = 'ready'                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ clusterTopics (scheduled cron / internalAction)               │
│ 1. Fetch all published node embeddings for a user             │
│ 2. Run k-means clustering                                     │
│ 3. Persist cluster assignments to topics/nodeTopics tables    │
│ 4. Derive cluster labels from node titles within each cluster │
└──────────────────────────────────────────────────────────────┘
```

## Current State

- **`captures.ts:processCapture`** (L493-521): Internal mutation, calls `saveDraftSuggestion` stub
- **`model/captures.ts:saveDraftSuggestion`** (L15-62): Stub creating `[Draft] {content}` node + edges from explicit mentions
- **`model/captures.ts:setCaptureFailed`**: Already exists
- **`model/users.ts:getAgentUser`**: Queries first `userType="agent"` user
- **`schema.ts`**: No embedding fields, no vector indexes, no topics tables
- **`convex/ai/`**: Does not exist
- **`package.json`**: No AI SDK deps installed

### Key Constraint: Convex Function Split

Mutations cannot make external HTTP calls. Embedding + LLM calls **must** happen in an internal action. Vector search (`ctx.vectorSearch`) also only works in actions. Flow: mutation (orchestrate) → action (embed + search + LLM) → mutation (save).

## Schema Changes

### Nodes Table — Add Embedding Field

```typescript
// Add to nodeFields:
embedding: v.optional(v.array(v.float64())),

// Add vector index to nodes table:
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 768,
  filterFields: ["ownerUserId"],
})
```

### New Table: Topics (Emergent Clusters)

```typescript
topics: defineTable({
  label: v.string(),
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
  confidence: v.optional(v.number()),
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
  - `@ai-sdk/google` (Gemini provider — embeddings + Flash)
  - `@ai-sdk/openai` (OpenAI fallback for title generation)
  - `@ai-sdk/anthropic` (Anthropic fallback for title generation)
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
  - `generateTitle(rawContent: string, captureType: string, similarNodes: {title: string, content: string}[])` — calls LLM with provider fallback chain via `generateText`
    - Fallback chain: Gemini Flash → GPT-4o-mini → Claude 3.5 Haiku
    - Prompt includes captureType context + similar nodes for better naming
    - Returns string

### Step 4: Implement `embedAndClassify` Internal Action

- **File**: `convex/captures.ts` (new internal action)
- **Signature**: `internalAction({ args: { captureId, rawContent, captureType, ownerUserId, explicitMentionNodeIds }, handler })`
- **Logic**:
  1. Embed `rawContent` with Gemini Embedding 2
  2. Vector search published nodes: `ctx.vectorSearch("nodes", "by_embedding", { vector, filter: ownerUserId, limit: 5 })`
  3. Fetch full node docs for top results
  4. Filter by similarity threshold (score > 0.7)
  5. Generate title via Gemini Flash with similar node titles/content as context
  6. On success: `ctx.runMutation(internal.captures.saveEmbeddingResult, { ... })`
  7. On failure: `ctx.runMutation(internal.captures.setCaptureFailed, { captureId })`
- **Retry**: 3 attempts with exponential backoff (1s, 2s, 4s) per provider. Embedding uses Google only. Title generation falls back: Gemini Flash → GPT-4o-mini → Claude 3.5 Haiku

### Step 5: Implement `saveEmbeddingResult` Internal Mutation

- **File**: `convex/captures.ts` (new internal mutation)
- **Logic**:
  1. Create draft node with LLM title, rawContent body, embedding vector, `publishedAt` unset, `sourceCaptureId`
  2. Create draft edges to similar nodes (from vector search) with confidence scores (`edgeType: 'suggested'`, `source: 'processor'`, `verified: false`)
  3. Create draft edges from `explicitMentionNodeIds` (`edgeType: 'suggested'`, `source: 'processor'`)
  4. Create suggestion row (`suggestorUserId=agentUserId`, `status=pending`)
  5. Set `captureState = "ready"`

### Step 6: Refactor `processCapture` Orchestrator

- Keep as `internalMutation` (queue-compatible entrypoint)
- Replace call to `saveDraftSuggestion` with scheduling `embedAndClassify` action
- Resolve agent user, fetch capture, schedule action with capture data

### Step 7: Implement Emergent Topic Clustering

- **New file**: `convex/ai/clustering.ts`
  - Simple k-means implementation
  - Operates on 768-dim vectors
  - Auto-determines k using silhouette score or elbow method
  - Derives cluster labels from most common words in node titles within each cluster

- **New file**: `convex/topics.ts`
  - `clusterTopics` (internal action): Fetches all published node embeddings for a user, runs clustering, persists to `topics` + `nodeTopics` tables
  - `getUserTopics` (query): Returns user's topics with node counts
  - `getTopicNodes` (query): Returns nodes in a topic
  - `setUserTopic` (mutation): User creates/renames a custom topic
  - `assignNodeToTopic` (mutation): User manually assigns a node to a topic

- **Scheduling**: Run `clusterTopics` periodically (e.g., daily) or trigger after N new nodes

### Step 8: Embed Existing Nodes (Backfill)

- Migration action to embed all existing published nodes without embeddings
- Batch process to respect rate limits
- Run via `npx convex run` or scheduled

### Step 9: Lint & Type-Check

- Run `pnpm run lint:fix` then `pnpm -w run lint`
- Run `pnpm -w run test`
- Fix any issues

## File Changes Summary

| File                                             | Action | Description                                                                         |
| ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| `apps/assistant-convex/package.json`             | Modify | Add `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `zod`            |
| `apps/assistant-convex/convex/schema.ts`         | Modify | Add embedding field, vector index, topics + nodeTopics tables                       |
| `apps/assistant-convex/convex/ai/embedding.ts`   | Create | Gemini Embedding 2 + Gemini Flash title generation                                  |
| `apps/assistant-convex/convex/ai/clustering.ts`  | Create | K-means clustering for emergent topics                                              |
| `apps/assistant-convex/convex/captures.ts`       | Modify | Refactor processCapture, add embedAndClassify action + saveEmbeddingResult mutation |
| `apps/assistant-convex/convex/topics.ts`         | Create | Topic CRUD, clustering trigger, queries                                             |
| `apps/assistant-convex/convex/model/captures.ts` | Keep   | Existing `saveDraftSuggestion` stub remains (not removed)                           |

## Cost Estimate (per capture)

| Component            | Cost            |
| -------------------- | --------------- |
| Gemini Embedding 2   | ~$0.000004      |
| Gemini Flash (title) | ~$0.0001        |
| Convex vector search | Free (included) |
| **Total**            | **~$0.0001**    |

## Out of Scope (Future TODOs)

- `newConcepts` extraction (LLM-based concept discovery from captures)
- LLM capture cleanup → polished node body (raw content → structured markdown)
- Human collaborator processor (Phase 2)
- Summarization routing (Phase 2)
- Multimodal embeddings (images, audio, video)
- Cross-user topic discovery
- Semantic search using embeddings
- Frontend/mobile changes

## Resolved Questions

1. **Approach**: Embed-first, LLM-lite (Approach A from embedding plan) — ~100x cheaper than full LLM pipeline.
2. **LLM usage**: Minimal — title generation only (Gemini Flash). Body is raw content as-is.
3. **Vector storage**: Native Convex vector search — no external vector DB needed.
4. **Embedding dimensions**: 768 (Matryoshka recommended balance of quality/storage).
5. **Provider fallback**: Embeddings use Google only. Title generation has fallback chain: Gemini Flash → GPT-4o-mini → Claude 3.5 Haiku. Each provider retried 3x with exponential backoff.
6. **Topic clusters**: Emergent by default, user-overridable with custom categories.
7. **Concurrency throttling**: No throttling for Phase 1. Convex scheduler handles concurrency natively.
8. **Node context for AI**: Provided via vector search results (similar nodes), not by passing all nodes.
9. **`zod` dependency**: Install explicitly — Convex bundles it internally but doesn't export it.

## References

- [Gemini Embedding 2](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/)
- [Convex Vector Search](https://docs.convex.dev/search/vector-search)
- [Vercel AI SDK](https://ai-sdk.dev/)
- Supersedes: `2026-03-18_042530Z_claudecode_t5-ai-processor-plan.md` (original LLM-heavy plan)
- Supersedes: `2026-03-18_080000Z_claudecode_t5-embedding-classification-plan.md` (embedding-only plan)
