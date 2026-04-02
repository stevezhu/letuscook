---
date: 2026-04-02T22:00:00Z
type: plan
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: capture-ingestion-improvements
sessionId: 85dfb8c2-1e79-4a59-85de-be6ab6fcdbb5
tags: [refactor, convex, code-quality]
filesModified:
  - apps/assistant-convex/convex/linkMetadata.ts
  - apps/assistant-convex/convex/nodeDocuments.ts
  - apps/assistant-convex/convex/toolRequests.ts
---

# Replace manual args with `pick` pattern

## Context

`createEdge` in `edges.ts` uses `pick(edgeFields, [...])` from `convex-helpers` to concisely define args from schema fields instead of manually re-specifying validators. Several other functions in assistant-convex manually duplicate schema field validators in their args and could use this pattern instead.

## Changes

### 1. `convex/linkMetadata.ts` — `saveLinkMetadata` (line 8)

**Best candidate.** All 11 args are direct copies of `linkMetadataFields` (minus `ogImageStorageId`).

```ts
// Before: 16 lines of manually defined args
args: {
  captureId: v.id('captures'),
  url: v.string(),
  // ... 9 more fields
}

// After: 1 line
args: pick(linkMetadataFields, [
  'captureId', 'url', 'canonicalUrl', 'domain', 'title',
  'description', 'faviconUrl', 'ogImageUrl', 'contentSnippet',
  'fetchedAt', 'fetchStatus', 'ownerUserId',
]),
```

Add import: `pick` from `convex-helpers`, `linkMetadataFields` from `#convex/schema.ts`.

### 2. `convex/nodeDocuments.ts` — `saveGeneratedDocument` (line 278)

7 of 8 `nodeDocumentFields` are used (all except `isEdited`).

```ts
// Before: 7 lines
args: {
  nodeId: v.id('nodes'),
  version: v.number(),
  // ... 5 more
}

// After:
args: pick(nodeDocumentFields, [
  'nodeId', 'version', 'title', 'content',
  'generatedAt', 'generatedFromEdgesUpTo', 'ownerUserId',
]),
```

Add import: `pick` from `convex-helpers`, `nodeDocumentFields` from `#convex/schema.ts`.

### 3. `convex/toolRequests.ts` — `logToolRequest` (line 8)

3 of 6 `toolRequestFields` are used as args.

```ts
// Before:
args: {
  description: v.string(),
  domain: v.optional(v.string()),
  ownerUserId: v.id('users'),
}

// After:
args: pick(toolRequestFields, ['description', 'domain', 'ownerUserId']),
```

Add import: `pick` from `convex-helpers`, `toolRequestFields` from `#convex/schema.ts`.

### 4. `convex/nodeDocuments.ts` — `updateDocument` (line 77)

Uses `title: v.optional(v.string())` and `content: v.optional(v.string())` — these match `nodeDocumentFields` but need to be optional. Can use existing `pickOptional` helper:

```ts
// Before:
args: {
  documentId: v.id('nodeDocuments'),
  title: v.optional(v.string()),
  content: v.optional(v.string()),
}

// After:
args: {
  documentId: v.id('nodeDocuments'),
  ...pickOptional(nodeDocumentFields, ['title', 'content']),
},
```

Add import: `pickOptional` from `#lib/helpers.ts`, `nodeDocumentFields` from `#convex/schema.ts`.

### Not changing

- **`nodeLinker.ts`** — args don't align well with schema fields (e.g. `titleSubstring` isn't in schema, `createVirtualNode` only uses 2 of many node fields alongside defaults)
- **`nodeDocuments.ts` `generateDocumentAction`** — only 3 args, mix of fields from different tables
- **Single-ID args** (e.g. `archiveCapture`, `dismissToolRequest`) — too simple to benefit

## Files to modify

1. `apps/assistant-convex/convex/linkMetadata.ts`
2. `apps/assistant-convex/convex/nodeDocuments.ts`
3. `apps/assistant-convex/convex/toolRequests.ts`

## Verification

1. `pnpm run lint:fix` then `pnpm -w run lint`
2. `pnpm -w run test`
3. Verify types: `pnpm -F assistant-convex exec tsc --noEmit`