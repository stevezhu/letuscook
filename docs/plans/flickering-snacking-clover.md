# Plan: Extract internalQuery/internalMutation logic into helper functions

## Context

Many `internalQuery`/`internalMutation` functions in `assistant-convex/convex/` are thin DB operations that exist because actions need `ctx.runQuery`/`ctx.runMutation` to access the database. The pattern in `src/model/captures.ts` already shows the right approach: extract logic into a helper function that takes `MutationCtx`/`QueryCtx`, then have the registered function delegate to it.

This makes the logic reusable from mutations/queries without overhead, and improves testability. The registered functions become thin wrappers.

`processCapture` is scheduled from public mutations and stays as-is (no logic to extract).
`setCaptureFailed` already follows this pattern — delegates to `#model/captures.ts`.

## Inventory

| Function                            | File                          | Extract to                                   |
| ----------------------------------- | ----------------------------- | -------------------------------------------- |
| `getNodeForEmbedding` (iQ)          | `convex/captures.ts:669`      | `src/model/captures.ts`                      |
| `saveEmbeddingResult` (iM)          | `convex/captures.ts:684`      | `src/model/captures.ts`                      |
| `setCaptureFailed` (iM)             | `convex/captures.ts:798`      | **Already done** — skip                      |
| `processCapture` (iM)               | `convex/captures.ts:505`      | **Skip** — scheduling logic, not extractable |
| `saveLinkMetadata` (iM)             | `convex/linkMetadata.ts:10`   | `src/model/linkMetadata.ts` (new)            |
| `logToolRequest` (iM)               | `convex/toolRequests.ts:10`   | `src/model/toolRequests.ts` (new)            |
| `findNodesByTitle` (iQ)             | `convex/nodeLinker.ts:6`      | `src/model/nodes.ts` (new)                   |
| `createVirtualNode` (iM)            | `convex/nodeLinker.ts:30`     | `src/model/nodes.ts` (new)                   |
| `getNodeForDocumentGeneration` (iQ) | `convex/nodeDocuments.ts:306` | `src/model/nodes.ts` (new)                   |
| `getNodeActivityForDocument` (iQ)   | `convex/nodeDocuments.ts:324` | `src/model/nodes.ts` (new)                   |
| `saveGeneratedDocument` (iM)        | `convex/nodeDocuments.ts:280` | `src/model/nodeDocuments.ts` (new)           |

## Changes

### 1. Create `src/model/linkMetadata.ts` — new file

```typescript
import { MutationCtx } from '#convex/_generated/server.js';
// Extract handler body from convex/linkMetadata.ts saveLinkMetadata
export async function saveLinkMetadata(ctx: MutationCtx, args: {...}) {
  await ctx.db.insert('linkMetadata', { ...args });
}
```

### 2. Create `src/model/toolRequests.ts` — new file

Extract `logToolRequest` handler (includes dedup query + insert/patch logic).

### 3. Create `src/model/nodes.ts` — new file

- `findNodesByTitle(ctx: QueryCtx, args)` — from `convex/nodeLinker.ts:11-26`
- `createVirtualNode(ctx: MutationCtx, args)` — from `convex/nodeLinker.ts:36-48`
- `getNodeForDocumentGeneration(ctx: QueryCtx, args)` — from `convex/nodeDocuments.ts:316-320`
- `getNodeActivityForDocument(ctx: QueryCtx, args)` — from `convex/nodeDocuments.ts:356-424`

### 4. Add to existing `src/model/captures.ts`

- `getNodeForEmbedding(ctx: QueryCtx, args)` — from `convex/captures.ts:671-680`
- `saveEmbeddingResult(ctx: MutationCtx, args)` — from `convex/captures.ts:699-795`

### 5. Create `src/model/nodeDocuments.ts` — new file

- `saveGeneratedDocument(ctx: MutationCtx, args)` — from `convex/nodeDocuments.ts:291-302`

### 6. Update registered functions to be thin wrappers

Each `internalQuery`/`internalMutation` handler becomes a one-liner:

```typescript
// convex/linkMetadata.ts
import { saveLinkMetadata as saveLinkMetadata_ } from '#model/linkMetadata.ts';

export const saveLinkMetadata = internalMutation({
  args: ...,  // keep args/returns validators
  handler: async (ctx, args) => { await saveLinkMetadata_(ctx, args); },
});
```

Same pattern for all 9 functions being extracted.

### 7. Update `// 👀 Needs Verification` comments

All modified functions get the verification comment.

## Files to modify

| File                         | Change                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/model/linkMetadata.ts`  | **New** — `saveLinkMetadata` helper                                                                                  |
| `src/model/toolRequests.ts`  | **New** — `logToolRequest` helper                                                                                    |
| `src/model/nodes.ts`         | **New** — `findNodesByTitle`, `createVirtualNode`, `getNodeForDocumentGeneration`, `getNodeActivityForDocument`      |
| `src/model/captures.ts`      | **Edit** — add `getNodeForEmbedding`, `saveEmbeddingResult`                                                          |
| `src/model/nodeDocuments.ts` | **New** — `saveGeneratedDocument`                                                                                    |
| `convex/captures.ts`         | **Edit** — delegate `getNodeForEmbedding`, `saveEmbeddingResult` to helpers                                          |
| `convex/linkMetadata.ts`     | **Edit** — delegate `saveLinkMetadata` to helper                                                                     |
| `convex/toolRequests.ts`     | **Edit** — delegate `logToolRequest` to helper                                                                       |
| `convex/nodeLinker.ts`       | **Edit** — delegate `findNodesByTitle`, `createVirtualNode` to helpers                                               |
| `convex/nodeDocuments.ts`    | **Edit** — delegate `getNodeForDocumentGeneration`, `getNodeActivityForDocument`, `saveGeneratedDocument` to helpers |

## Verification

1. `pnpm run lint:fix` then `pnpm -w run lint`
2. `pnpm -w run test` — all existing tests pass unchanged (behavior is identical)
