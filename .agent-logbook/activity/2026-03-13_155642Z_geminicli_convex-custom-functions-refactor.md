---
date: 2026-03-13T15:56:42Z
type: activity
status: complete
agent: geminicli
models: [unknown]
branch: main
tags: [convex, auth, custom-functions, refactor]
relatedPlan: plans/2026-03-12_220547Z_claudecode_convex-custom-functions-plan.md
---

# Refactor assistant-convex to use convex-helpers customFunction pattern

## Context
The goal was to eliminate duplicated auth boilerplate across all public Convex functions in `apps/assistant-convex/convex/` by introducing `customQuery` and `customMutation` wrappers from `convex-helpers/server/customFunctions`. Every public function previously repeated 6-8 lines of identity lookup and user resolution.

## Work Performed
1. **Dependency Addition:** Added `convex-helpers` to the `apps/assistant-convex` package.
2. **Centralized Auth Wrappers:** Created `convex/functions.ts` which exports `userQuery` and `userMutation`. These builders use `customQuery` and `customMutation` to automatically look up the WorkOS identity and resolve the corresponding internal user document, exposing it as `ctx.user`.
3. **Boilerplate Removal:** Systematically refactored 17 public functions across `captures.ts`, `nodes.ts`, `edges.ts`, `search.ts`, `suggestions.ts`, and `users.ts` to replace the repetitive identity fetching and user lookup logic.
    - **Mutations:** Refactored to rely on `userMutation` which inherently throws a `ConvexError` if the user is unauthenticated, allowing direct use of `ctx.user._id`.
    - **Queries:** Refactored to rely on `userQuery` which safely handles unauthenticated states, streamlining the checks to a simple `if (!ctx.user)` return fallback.
4. **Import Conventions:** Verified and enforced that standard internal source files are imported with a `.ts` extension, while generated artifacts from `_generated/` explicitly use the `.js` extension. This ensures strict alignment with the project's configuration and `oxlint` requirements.

## Outcome
The codebase is now significantly cleaner, more type-safe, and free of duplicated WorkOS authentication boilerplate. 

Validation checks passed successfully:
- TypeScript type checking (`tsc --noEmit`) completed without errors.
- `oxlint` checks passed across the refactored directory (0 errors).

*(Note: The optional ESLint rule to restrict `query`/`mutation` imports from `_generated/server` was intentionally skipped, as there isn't a dedicated ESLint configuration file for the `assistant-convex` package, and adding it to the root monorepo config would unnecessarily impact the global ruleset).*

## References
- [Customizing serverless functions without middleware](https://stack.convex.dev/custom-functions)
- [convex-helpers source](https://github.com/get-convex/convex-helpers)

