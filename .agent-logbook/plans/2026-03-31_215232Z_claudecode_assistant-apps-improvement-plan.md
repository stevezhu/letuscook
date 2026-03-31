---
date: 2026-03-31T21:52:32Z
type: plan
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: update-deps
sessionId: 32afe66a-e2fd-47fd-9ea8-90bda9689e10
tags:
  [
    assistant-convex,
    assistant-mobile,
    cleanup,
    architecture,
    ui,
    best-practices,
  ]
---

# Assistant Apps Improvement Plan

## Goal

Comprehensive code cleanup, architecture improvements, and UI polish for `assistant-convex` and `assistant-mobile`. Address technical debt, resolve TODOs, improve error handling, and align both apps with best practices.

## Scope

**Included:**

- Code cleanup (dead code, console logs, commented code, TODOs)
- Error handling improvements
- Architecture alignment with project conventions
- UI/UX improvements in mobile app
- Test coverage gaps
- Type safety and validation improvements
- Performance optimizations

**NOT included:**

- New feature development (search tab, etc.)
- Auth provider migration
- Database schema redesign
- CI/CD changes

---

## Steps

### Phase 1: Code Cleanup (Low Risk)

#### 1.1 Remove Dead Code & Console Logs

- [ ] `assistant-convex/convex/nodes.ts` — Remove commented-out `Promise.all` approach (lines ~50-68)
- [ ] `assistant-mobile` — Remove or gate 17 `console.log`/`console.debug` statements behind `__DEV__`
  - `auth-provider.tsx` — 12 console statements with `[Auth]` prefix
  - `use-guest-capture-store.ts` — 1 console.error
  - `capture-composer.tsx` — console.debug for content size
- [ ] `assistant-convex/convex/captures.ts` — Remove trailing underscore from `setCaptureFailed_` helper (rename to `setCaptureFailed`)

#### 1.2 Resolve Straightforward TODOs

- [ ] `assistant-convex/convex/captures.ts:508` — Clarify `processCapture` state check: document why state should be `ready` not `processing`, or fix the logic
- [ ] `assistant-mobile/src/modules/capture/use-guest-capture-store.ts` — Add JSON validation with typebox/valibot on load (TODO in code)
- [ ] `assistant-mobile/src/components/providers/app-theme-provider.tsx` — Verify destructive color mapping (TODO in code)

#### 1.3 Hardcoded Constants → Shared Constants

- [ ] `assistant-convex` — Extract embedding dimension `768` to a shared constant (used in `schema.ts` and `embedding.ts`)
- [ ] `assistant-convex` — Extract vector search threshold `0.7` to a named constant in `captures.ts`
- [ ] `assistant-convex` — Extract k-means params (`MAX_ITER=50`, cluster formula) to named constants in `clustering.ts`

### Phase 2: Error Handling & Robustness (Medium Risk)

#### 2.1 Mobile Error Handling

- [ ] `assistant-mobile/src/modules/capture/use-capture-submit.ts` — Add error handling to `onSubmit` (TODO in code: "add error handling")
- [ ] Add root-level Suspense boundary in `_layout.tsx` (TODO in code: "add top level suspense")
- [ ] Add network/offline error UI — currently no feedback when requests fail
- [ ] Add error boundaries around feature modules (capture, inbox, review)

#### 2.2 Convex Error Handling

- [ ] `assistant-convex/convex/captures.ts` — Add error codes to `EntityNotFoundError` for programmatic distinction
- [ ] `assistant-convex/convex/ai/embedding.ts` — Improve `embedAndClassify` error handling: surface failures more clearly when all LLM models fail
- [ ] `assistant-convex/convex/captures.ts` — Validate capture state before accepting/rejecting suggestions (prevent orphaned draft nodes)

#### 2.3 Validation Improvements

- [ ] `assistant-convex/convex/utils/helpers.ts` — Validate extracted node IDs from `parseMentionedNodeIds()` actually exist
- [ ] `assistant-mobile/src/modules/auth/expo/utils.ts` — Add error handling for malformed JWT in `parseJwtPayload()`

### Phase 3: Architecture Improvements (Medium Risk)

#### 3.1 Convex Query Optimization

- [ ] `assistant-convex/convex/captures.ts` — Consolidate `getInboxCaptures` from 4 separate state queries into a single query with filter (lines ~722-759)
- [ ] Consider adding missing indexes:
  - `suggestions` table: index on `suggestorUserId`
  - `nodes` table: index on `sourceCaptureId`

#### 3.2 Schema Cleanup

- [ ] `assistant-convex/convex/schema.ts` — Resolve "is this required?" TODO on `edgeType`
- [ ] Remove unused edge types (`reference`, `related`) if confirmed unused, or document their intended use
- [ ] `assistant-convex/convex/ai/embedding.ts:8` — Address embedding normalization TODO (research Google's recommendation)

#### 3.3 Topic Clustering Integration

- [ ] `assistant-convex/convex/topics.ts:141` — `clusterTopics` is defined but never invoked. Either:
  - Wire it up to a cron job for periodic clustering, OR
  - Add a manual trigger mutation, OR
  - Remove if not needed

#### 3.4 Mobile Architecture

- [ ] Remove placeholder screens (`search.tsx`, `callback.tsx`) or add "coming soon" UI
- [ ] `assistant-mobile/src/modules/inbox/components/review-screen.tsx` — Consolidate 3 separate query endpoints into a single composite query
- [ ] Standardize styling approach — some components use UniWind classes, others use inline styles. Pick one.

### Phase 4: UI/UX Polish (Low-Medium Risk)

#### 4.1 Mobile UI Improvements

- [ ] Add success state to capture submit button (currently only shows spinner, no success feedback)
- [ ] Improve `CaptureComposer` max height handling — currently hardcoded from `onContentSizeChange` logging
- [ ] Add empty states for inbox (no captures to review) and home (no recent activity)
- [ ] Add pull-to-refresh on inbox and capture lists
- [ ] Improve `InboxItemRow` — simplify API so caller doesn't need to track pending state manually

#### 4.2 Accessibility

- [ ] Add accessibility labels to interactive elements (tab bar icons, action buttons)
- [ ] Ensure proper contrast ratios for `StatePill` badge colors
- [ ] Add screen reader support for capture state transitions

### Phase 5: Testing (Low Risk)

#### 5.1 Test Coverage

- [ ] `assistant-mobile/src/modules/capture/capture-migration-provider.tsx` — Add tests (TODO in code: "test this component")
- [ ] Add unit tests for `useGuestCaptureStore` — validate storage read/write/clear
- [ ] Add unit tests for `parseJwtPayload` and `formatRelativeTime` utilities
- [ ] `assistant-convex` — Add tests for `processCapture` state machine transitions
- [ ] Add Storybook stories for `InboxItemRow`, `ReviewScreen`, `StatePill` components

---

## Open Questions

1. **Topic clustering**: Should `clusterTopics` run on a cron schedule or be user-triggered? What's the intended UX?
2. **Edge types**: Are `reference` and `related` edge types planned for future use, or should they be removed?
3. **Embedding normalization**: What's the impact on vector search quality? Worth benchmarking before/after?
4. **Search tab**: Is this coming soon, or should the tab be hidden until implemented?
5. **Console logs**: Gate behind `__DEV__` or remove entirely? Some auth logs may be useful for debugging.
6. **Guest capture limit**: Is 100 the right max? Should there be UI feedback when approaching the limit?

## References

- [Convex best practices](https://docs.convex.dev/production/best-practices)
- [Expo Router docs](https://docs.expo.dev/router/introduction/)
- [UniWind docs](https://uniwind.dev/)
- Project architecture: `.claude/rules/architecture.md`

## Session Stats

```
claudecode Session Stats: 32afe66a-e2fd-47fd-9ea8-90bda9689e10
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         40
  Output Tokens        3,206
  Cache Creation Input 169,099
  Cache Read Input     609,155
----------------------------------------
SUBAGENTS (2 total):
  Input Tokens         801
  Output Tokens        18,813
  Cache Creation Input 500,867
  Cache Read Input     5,090,840
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   841
  Total Output Tokens  22,019
  Total Cache Creation 669,966
  Total Cache Read     5,699,995
----------------------------------------
GRAND TOTAL TOKENS:  6,392,821
```
