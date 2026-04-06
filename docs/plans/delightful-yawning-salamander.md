# Remove Deprecated Topics Tables and Code

## Context

The graph-based content organization system (Phase 3 of `memoized-brewing-balloon.md`) is already implemented — `nodeKind: 'virtual'`, `categorized_as` edges, and `nodeLinker.ts` are all in place and wired into the pipeline. The old `topics` and `nodeTopics` tables and associated code are now dead weight. This change removes them.

## Changes

### 1. Delete `apps/assistant-convex/convex/topics.ts`

Entire file (273 lines) — contains `getUserTopics`, `getTopicNodes`, `createUserTopic`, `renameTopic`, `assignNodeToTopic`, `clusterTopics`, `saveClusters`, etc. All superseded by `nodeLinker.ts`.

### 2. Delete `apps/assistant-convex/convex/topics.test.ts`

Entire file (213 lines) — tests for the above.

### 3. Remove schema table definitions from `apps/assistant-convex/convex/schema.ts`

Delete the `topics` and `nodeTopics` table definitions (~lines 202-218). Keep `nodeKind` and `categorized_as` — those are the replacements.

### 4. Auto-generated files

`convex/_generated/api.d.ts` will regenerate automatically when `convex dev` runs — no manual edits needed.

## Verification

1. `pnpm run lint:fix` then `pnpm -w run lint` — no errors
2. `pnpm -w run test` — all tests pass
3. Grep for any remaining references to `topics` table or `nodeTopics` to confirm nothing was missed
