---
root: true
targets: ['*']
description: 'Project overview and general development guidelines'
globs: ['**/*']
---

## Task Completion

After finishing each coding task, run the following from the project root and fix any issues before considering the task complete:

1. **Auto-fix:** `pnpm run lint:fix` — automatically fixes formatting and lint issues.
2. **Verify:** `pnpm -w run lint` — check for remaining issues and fix them manually.
3. **Test:** `pnpm -w run test` — run tests and fix any failures.

## Rulesync

After editing any file in the `.rulesync/` directory, run `pnpm exec rulesync generate` to sync changes to all target rule files.
