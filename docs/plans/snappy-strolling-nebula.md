# Code Review Fixes for assistant-convex

## Context

Code review of `apps/assistant-convex` on `capture-ingestion-improvements` identified several issues. The N+1/N+2 query performance issues are tracked separately in `.agent-logbook/plans/2026-04-03_003829Z_claudecode_fix-n-plus-one-queries.md`. This plan covers the remaining fixes.

## Tasks

### Task 1: Staleness guard in `saveEmbeddingResult`

**File:** `apps/assistant-convex/src/model/captures.ts`

At the top of `saveEmbeddingResult` (line ~37), add a guard that reads the capture and bails if `captureState !== 'processing'`:

```typescript
const capture = await ctx.db.get(args.captureId);
if (!capture || capture.captureState !== 'processing') return;
```

This prevents creating orphaned draft nodes/edges if the user archived or edited the capture while `embedAndClassify` was running.

### Task 2: Virtual node deduplication

**Files:**

- `apps/assistant-convex/convex/schema.ts` — add index
- `apps/assistant-convex/src/model/nodes.ts` — dedup in `createVirtualNode`

**Step 1:** Add a new index on `nodes` table in schema.ts (after line 153):

```
.index('by_owner_nodeKind_title', ['ownerUserId', 'nodeKind', 'title'])
```

**Step 2:** In `createVirtualNode` (src/model/nodes.ts:29-47), query for existing virtual node before inserting:

```typescript
const existing = await ctx.db
  .query('nodes')
  .withIndex('by_owner_nodeKind_title', (q) =>
    q
      .eq('ownerUserId', args.ownerUserId)
      .eq('nodeKind', 'virtual')
      .eq('title', args.title),
  )
  .first();
if (existing) return existing._id;
```

Convex mutations are serializable transactions, so concurrent calls will be serialized — the second will see the first's insert.

### Task 3: Replace `extractConceptsFromText` with structured output

**File:** `apps/assistant-convex/src/services/nodeLinker.ts`

- Add imports: `Output` from `'ai'`, `z` from `'zod'`
- Define schema near top:
  ```typescript
  const conceptsSchema = z.object({
    concepts: z.array(
      z.object({
        concept: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    ),
  });
  ```
- Delete `extractConceptsFromText` function (lines 39-58)
- In `identifyConceptsWithLLM` (line 86), change `generateText` call to use `output: Output.object({ schema: conceptsSchema })` and read from `output.concepts` instead of regex parsing
- Remove "Always respond with valid JSON only" from system prompt (structured output handles this)
- If `output` is undefined/null, the existing retry logic still kicks in

### Task 4: Consolidate LLM retry pattern

**New file:** `apps/assistant-convex/src/lib/retryWithModelFallback.ts`

Extract the duplicated retry/fallback pattern from these 3 files into a shared helper:

- `src/services/embedding.ts` (lines 51-100, `generateTitle`)
- `src/services/nodeLinker.ts` (lines 27-32 + 82-118, `identifyConceptsWithLLM`)
- `convex/nodeDocuments.ts` (lines 32-37 + 228-267, `generateDocumentAction`)

The helper signature:

```typescript
async function retryWithModelFallback<T>(opts: {
  models: LanguageModel[];
  fn: (model: LanguageModel) => Promise<T | undefined>;
  maxRetries?: number; // default 3
  baseDelayMs?: number; // default 1000
}): Promise<T | undefined>;
```

Each call site provides its own `fn` that does the `generateText` call + validation, returning `undefined` to signal retry. The helper handles the nested model/attempt loops, exponential backoff, and logging.

Then refactor each of the 3 files to use this helper, removing `sleep`, `MAX_RETRIES`, `BASE_DELAY_MS` from each.

### Task 5: Remove `'regular'` from `nodeKind` schema

**Files:**

- `apps/assistant-convex/convex/schema.ts` (line 44) — change to `v.optional(v.literal('virtual'))`
- `apps/assistant-convex/convex/nodes.ts` (line 28) — change `(n.nodeKind ?? 'regular') !== 'virtual'` to `n.nodeKind !== 'virtual'`
- Grep for any other `'regular'` references in nodeKind context and update

No migration needed — `'regular'` is never explicitly set on any node. The only code that references it is the filter default.

### Task 6: Add TODO in linkFetcher

**File:** `apps/assistant-convex/src/services/linkFetcher.ts`

Add above `fetchLinkMetadata` function:

```typescript
// TODO: Replace manual HTML parsing with Firecrawl or a similar service for
// more robust metadata extraction
```

### Task 7: Add tests for untested modules

**New files:**

- `apps/assistant-convex/convex/linkMetadata.test.ts`
- `apps/assistant-convex/convex/toolRequests.test.ts`
- `apps/assistant-convex/convex/nodeDocuments.test.ts`

Follow existing patterns from `captures.test.ts`:

- `test.beforeEach` with `setupUser()` + `setupAgentUser()`
- Helper `getUserId()`/`getAgentUserId()` functions
- Setup data via `testConvex.run(ctx => ctx.db.insert(...))`
- Auth calls via `authedTestConvex.mutation()`/`authedTestConvex.query()`
- Internal calls via `testConvex.mutation(internal.module.fn, args)`

**linkMetadata.test.ts:**

- `saveLinkMetadata` — insert via internal mutation, verify fields
- `getLinkMetadataByCapture` — query by captureId, verify ownership check
- `getLinksByDomain` — filter by domain, exclude other users
- `getDomainList` — aggregate counts, verify sort by count desc

**toolRequests.test.ts:**

- `logToolRequest` — new request creates row with frequency 1
- `logToolRequest` — repeat increments frequency (not duplicate)
- `getToolRequests` — returns open requests sorted by frequency desc
- `dismissToolRequest` — sets status to dismissed, rejects other user's requests

**nodeDocuments.test.ts:**

- `generateDocument` — schedules without error for owned published node
- `updateDocument` — updates fields, sets `isEdited: true`, rejects other user
- `getNodeDocuments` — returns docs sorted by version desc
- `getLatestDocument` — returns highest version only
- `saveGeneratedDocument` (internal) — inserts with `isEdited: false`

## Implementation Order

1. Task 1 (staleness guard) — smallest, highest safety impact
2. Task 6 (TODO comment) — trivial
3. Task 5 (nodeKind cleanup) — simple schema change
4. Task 2 (virtual node dedup) — schema index + model change
5. Task 4 (retry consolidation) — refactor across 3 files
6. Task 3 (structured output) — changes LLM integration in nodeLinker
7. Task 7 (tests) — last, so tests cover final state

## Verification

1. `pnpm run lint:fix` then `pnpm -w run lint`
2. `pnpm -w run test` — all existing + new tests pass
3. Manually verify `npx convex dev` accepts the schema changes
