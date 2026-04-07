---
date: 2026-04-07T18:31:49Z
type: research
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: fix/p0-auth-crash-stale-captures
sessionId: 2fcbf0a2-977e-49a0-8c79-b43205d87888
tags: [capture, ingestion, e2e-testing, maestro, ios]
relatedPlan: plans/2026-04-01_204152Z_claudecode_capture-ingestion-improvements-plan.md
---

# Capture Ingestion E2E Test Findings

**Date:** 2026-04-07
**Method:** Manual E2E testing via Maestro + iOS Simulator (iPhone 17 Pro, iOS 26.2)
**Plan:** `docs/plans/memoized-brewing-balloon.md`

## Test Summary

Submitted 7 captures across various link types:

- GitHub repos: `anthropics/claude-code`, `facebook/react`, `vercel/next.js`, `vercel/ai`
- Blog post: `blog.google/technology/ai/google-gemini-ai-update-december-2024/`
- Blocked domains: `x.com/AnthropicAI/status/...`, `reddit.com/r/programming/...`
- Text-mode URL auto-detect: `ai.google.dev/gemini-api/docs`

## Findings

### Critical (P0)

**1. Auth session instability**
The Convex auth session drops frequently during normal usage. After a reload, the session authenticates successfully but expires within minutes. Subsequent mutations (`createCapture`) and queries fail with `ConvexError: Unauthenticated`. The app shows error toasts but doesn't force re-authentication, allowing users to keep submitting captures that silently fail.

**2. Node detail screen crashes on auth failure**
`nodes:getNodeActivity` throws `Unauthenticated` and causes a React render error (red screen). After dismissing, the screen is blank white with no navigation — the user is stuck and must kill/reload the app. The error boundary doesn't recover gracefully. (`apps/assistant-mobile/src/app/knowledge/[nodeId].tsx:50`)

**3. Stale "Processing" captures with no recovery**
Many older captures are permanently stuck in "Processing" state in the Inbox. There's no UI to retry, dismiss, or delete these stale captures. They clutter the inbox indefinitely.

### High (P1)

**4. Gemini API quota exhaustion breaks the entire pipeline**
All LLM calls (concept identification, title generation) fail with `RESOURCE_EXHAUSTED` (429) on the free tier (5 req/min). The fallback chain (`gemini-2.5-flash` -> `openrouter/gemini-2.5-flash` -> `gemini-3-flash-preview`) shares similar Gemini quota limits, so fallback doesn't actually help. Despite this, captures still reach "Ready" state — meaning the pipeline proceeds with degraded results (poor titles, possibly missing concept identification).

**5. Title generation quality is poor**
Generated titles are useless:

- `https://github.com/vercel/ai` -> `"Vercel"` (should be "Vercel AI SDK")
- `https://reddit.com/.../rust_2024_edition_is_here/` -> `Reddit: "` (truncated with stray quote)
- Titles are based only on raw URL text, not on fetched page metadata (title, description, OG tags)

**6. Inbox titles show raw URLs, not enriched metadata**
The inbox list shows full raw URLs as the capture title (e.g., `https://www.reddit.com/r/programming/comments/1jx2kzf/rust_2024_edition_is_here/`). Even after `linkMetadata` is fetched, the inbox doesn't display the extracted page title, domain, or description. Makes scanning the inbox for relevant captures very difficult.

### Medium (P2)

**7. Accept button doesn't quick-accept**
The "Accept" button in the inbox list opens the Review Item modal instead of immediately accepting the suggestion. This defeats the purpose of having inline accept/reject buttons. Users who want to quickly triage captures must tap Accept -> review modal -> tap Save for every single item.

**8. Capture type resets to "Text" after each submission**
After submitting a link, the composer's type selector resets to "Text". Users saving multiple links in succession must re-select "Link" each time. The type should persist until explicitly changed.

**9. No link metadata preview in review screen**
The Review Item modal shows only TITLE and CONTENT fields. There's no display of fetched link metadata: page title, description, domain, OG image, favicon. This data exists in the `linkMetadata` table but isn't surfaced to the user.

**10. Virtual/concept nodes not browsable**
The Knowledge tab correctly hides virtual nodes, but there's no alternate way to browse by concept/topic. The "Vercel" node shows "3 connections" (indicating `categorized_as` edges were created), but users can't see what concepts exist or explore content grouped by concept. Hub node browsing (Phase 6) is not implemented.

### Low (P3)

**11. URL auto-detection works but is fragile**
The `createCapture` mutation (line 108-113) does auto-upgrade text to link type when it starts with `http://` or `https://`. However, any leading whitespace or stray characters defeat the check. Consider using a more robust URL regex or `.includes()` with URL parsing.

**12. No duplicate link detection**
The same URL can be submitted multiple times (e.g., `github.com/facebook/react` appeared twice from 5 days ago). The `linkMetadata` table has a `by_url` index but there's no dedup check at capture creation time.

**13. Failed captures don't clear the text field**
When `createCapture` fails (e.g., due to auth), the text field retains the content. If the user keeps submitting without noticing the error, text accumulates into a single massive capture.

## What Works Well

- **Core pipeline end-to-end:** Capture -> processCapture -> embedAndClassify -> saveEmbeddingResult flow is fully wired and functional
- **Graph-based categorization:** Virtual nodes are created, `categorized_as` edges are generated with confidence scores, deduplication of virtual nodes by title works
- **Link metadata fetching:** `fetchLinkMetadata` extracts OG tags, title, description (when the domain is accessible)
- **Inbox grouping:** Captures are properly grouped by state (Ready, Processing) with date sections (Today, This Week, Older)
- **Review modal:** The Discard/Archive/Save flow works correctly
- **Embedding + vector search:** Content is embedded with Gemini Embedding 2, vector search finds similar nodes with 0.7 threshold

## Recommended Priority Order

1. Fix auth session stability (P0) — everything else is blocked by this
2. Add error boundaries and retry UI for auth failures (P0)
3. Add retry/dismiss actions for stale Processing captures (P0)
4. Upgrade to paid Gemini API tier or add non-Gemini fallback (e.g., Claude) for LLM calls (P1)
5. Use fetched `linkMetadata` (page title + description) in title generation prompt and inbox display (P1)
6. Implement true inline Accept on inbox list (P2)
7. Persist capture type selection across submissions (P2)
8. Surface link metadata preview in review screen (P2)
9. Add concept/hub node browsing to Knowledge tab (P2)

## Session Stats

```
claudecode Session Stats: 2fcbf0a2-977e-49a0-8c79-b43205d87888
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         252
  Output Tokens        22,853
  Cache Creation Input 422,735
  Cache Read Input     16,067,110
----------------------------------------
SUBAGENTS (1 total):
  Input Tokens         544
  Output Tokens        6,499
  Cache Creation Input 198,078
  Cache Read Input     2,606,000
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   796
  Total Output Tokens  29,352
  Total Cache Creation 620,813
  Total Cache Read     18,673,110
----------------------------------------
GRAND TOTAL TOKENS:  19,324,071
========================================
```
