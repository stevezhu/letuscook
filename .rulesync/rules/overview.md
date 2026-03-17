---
root: true
targets: ['*']
description: 'Project overview and general development guidelines'
globs: ['**/*']
---

## General Guidelines

- **Package Manager**: Always use `pnpx` instead of `npx` for executing binaries to ensure consistency with the `pnpm` workspace.

## Task Completion

After finishing each coding task, run the following from the project root and fix any issues before considering the task complete. Skip this for non-coding tasks such as editing documentation, rules, or configuration files.

1. **Auto-fix:** `pnpm run lint:fix` — automatically fixes formatting and lint issues.
2. **Verify:** `pnpm -w run lint` — check for remaining issues and fix them manually.
3. **Test:** `pnpm -w run test` — run tests and fix any failures.

## Code Verification Comments

Source files may contain verification status comments (checked into git) above functions or variables to track whether @<user> has personally reviewed AI-generated or AI-modified code:

- `// ✅ Reviewed by @<user>` — @<user> has personally verified this section of code.
- `// 👀 Needs Verification` — this code was modified by an AI agent and has not yet been personally verified.

MANDATORY: When an AI agent modifies a function or variable that has `// ✅ Reviewed by @<user>` above it, update that comment to `// 👀 Needs Verification`.

If a piece of code does not have this comment, it means it is indeterminate whether it has been reviewed or not.

## Document Editing

After editing any file in the `.rulesync/` directory, run `pnpm -w exec rulesync generate` to sync changes to all target rule files.
