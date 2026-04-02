---
date: 2026-04-02T20:05:40Z
type: plan
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: capture-ingestion-improvements
sessionId: 6da09407-be70-4f0f-9a1b-f73e6b9c5fdb
tags: [refactor, organization, assistant-convex]
filesModified:
  - apps/assistant-convex/src/services/embedding.ts
  - apps/assistant-convex/src/services/linkFetcher.ts
  - apps/assistant-convex/src/services/nodeLinker.ts
  - apps/assistant-convex/src/lib/clustering.ts
  - apps/assistant-convex/src/lib/errors.ts
  - apps/assistant-convex/src/lib/helpers.ts
  - apps/assistant-convex/src/model/customFunctions.ts
  - apps/assistant-convex/src/model/users.ts
  - apps/assistant-convex/convex/captures.ts
  - apps/assistant-convex/convex/captures.test.ts
  - apps/assistant-convex/convex/edges.ts
  - apps/assistant-convex/convex/nodes.ts
  - apps/assistant-convex/convex/nodeDocuments.ts
  - apps/assistant-convex/convex/linkMetadata.ts
  - apps/assistant-convex/convex/search.ts
  - apps/assistant-convex/convex/suggestions.ts
  - apps/assistant-convex/convex/toolRequests.ts
---

# Reorganize `assistant-convex/src/` by Dependency Category

## Context

The `src/` directory currently uses `ai/`, `model/`, `utils/`, and `test/` subdirectories, but these don't cleanly map to the testability/dependency boundaries that matter most: whether code calls external APIs, needs Convex context, is pure, or is test-only. This reorganization aligns the directory structure with those 4 categories.

## Target Structure

```
src/
├── services/          # External API calls (Google, OpenRouter, fetch)
│   ├── embedding.ts
│   ├── linkFetcher.ts
│   └── nodeLinker.ts
├── model/             # Convex context/db operations
│   ├── captures.ts
│   ├── customFunctions.ts   (moved from utils/)
│   └── users.ts
├── lib/               # Pure code, testable without mocking
│   ├── clustering.ts
│   ├── errors.ts
│   └── helpers.ts
└── test/              # Test-only code
    └── convexTest.ts
```

## File Moves

| From                           | To                             |
| ------------------------------ | ------------------------------ |
| `src/ai/embedding.ts`          | `src/services/embedding.ts`    |
| `src/ai/linkFetcher.ts`        | `src/services/linkFetcher.ts`  |
| `src/ai/nodeLinker.ts`         | `src/services/nodeLinker.ts`   |
| `src/ai/clustering.ts`         | `src/lib/clustering.ts`        |
| `src/utils/customFunctions.ts` | `src/model/customFunctions.ts` |
| `src/utils/errors.ts`          | `src/lib/errors.ts`            |
| `src/utils/helpers.ts`         | `src/lib/helpers.ts`           |

`src/ai/` and `src/utils/` are deleted after moves.

## Import Updates

All imports use the `#*` alias (`"#*": "./src/*"` in package.json) — no package.json changes needed.

**Within src/:** `src/model/users.ts`: `#utils/customFunctions.ts` → `#model/customFunctions.ts`

**In convex/ consumers (16 changes across 8 files):**

- `#ai/embedding.ts` → `#services/embedding.ts` (captures.ts)
- `#ai/linkFetcher.ts` → `#services/linkFetcher.ts` (captures.ts)
- `#ai/nodeLinker.ts` → `#services/nodeLinker.ts` (captures.ts)
- `#utils/customFunctions.ts` → `#model/customFunctions.ts` (captures, edges, nodes, nodeDocuments, linkMetadata, search, suggestions, toolRequests)
- `#utils/errors.ts` → `#lib/errors.ts` (captures, edges, nodes, nodeDocuments)
- `#utils/helpers.ts` → `#lib/helpers.ts` (captures)

## Notes

- `clustering.ts` has zero importers (dead/future code) — still moving for consistency.
- `nodeLinker.ts` uses both external APIs and Convex `ActionCtx` — categorized as `services/` since its primary purpose is LLM orchestration.
- `convex/nodeDocuments.ts` also has inline LLM logic that could be extracted to `services/` as a follow-up.

## Verification

1. `pnpm run lint:fix`
2. `pnpm -w run lint`
3. `pnpm -w run test`

## Session Stats

```
claudecode Session Stats: 6da09407-be70-4f0f-9a1b-f73e6b9c5fdb
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-opus-4-6, claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         94
  Output Tokens        11,043
  Cache Creation Input 502,381
  Cache Read Input     2,508,077
----------------------------------------
SUBAGENTS (3 total):
  Input Tokens         8,693
  Output Tokens        10,444
  Cache Creation Input 379,623
  Cache Read Input     1,529,537
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   8,787
  Total Output Tokens  21,487
  Total Cache Creation 882,004
  Total Cache Read     4,037,614
----------------------------------------
GRAND TOTAL TOKENS:  4,949,892
========================================
```
