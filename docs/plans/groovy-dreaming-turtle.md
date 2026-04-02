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
