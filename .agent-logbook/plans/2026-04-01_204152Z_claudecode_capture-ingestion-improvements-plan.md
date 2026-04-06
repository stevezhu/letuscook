---
date: 2026-04-01T20:41:52Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: capture-llm-processing
sessionId: 054d911c-985f-42d5-8de6-4fa61773d244
tags: [capture, ingestion, links, topics, organization]
---

# Capture Ingestion Improvements — Draft v1

## Goal

Improve the capture ingestion experience, primarily for link processing. The user saves many links daily from various sources (Instagram, X, GitHub, Reddit, etc.) and the current experience is messy — stub processing only, no URL metadata extraction, no real topic assignment.

## Scope

**In scope:** Priority 1 — Link processing, topic aggregation, and rediscoverability.
**Deferred:** Priority 2 (remembering things/receipts), Priority 3 (tasks/reminders), Priority 4 (image curation).

## Steps (Draft v1)

1. **Phase 1**: Activate real `embedAndClassify` pipeline (replace stub `processCapture`)
2. **Phase 2**: Link metadata extraction — new `linkMetadata` table, URL fetcher, client-side extraction for blocked domains via share sheet
3. **Phase 3**: Topic-based link aggregation — LLM topic assignment with hybrid confidence model (auto-assign >0.8, suggest otherwise)
4. **Phase 4**: Topic activity feed in chat format — extend node detail view with activity/chat tab
5. **Phase 5**: Formal document generation — versioned markdown from topic activity
6. **Phase 6**: Rediscoverability — search indexes on link metadata, domain browsing
7. **Phase 7**: Tool request system — agent logs when it can't process a link

## Key Decisions

- **Topic UI**: Extend existing node detail view (not a separate screen) — when a node is a topic, it gets an activity feed tab
- **Blocked domains**: Client-side metadata extraction via share sheet (not server-side workarounds)
- **Topic confidence**: Hybrid model — auto-assign when high confidence, suggest for review when uncertain. Setting to override is a future improvement.

## Open Questions

- **User critique**: Topics as a separate entity vs everything being nodes. React and Svelte are both "JavaScript" and "Web Frameworks" — the hierarchy is a graph, not a tree. Should we eliminate the `topics` table entirely and just use nodes + edges?
- How should document generation handle conflicting/evolving information across links?

## References

- Plan file: `docs/plans/memoized-brewing-balloon.md`
- Current captures implementation: `apps/assistant-convex/convex/captures.ts`
- Schema: `apps/assistant-convex/convex/schema.ts`
- Traycer specs: `docs/traycer/`

## Session Stats

```
claudecode Session Stats: 054d911c-985f-42d5-8de6-4fa61773d244
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001, claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         6,642
  Output Tokens        21,038
  Cache Creation Input 158,684
  Cache Read Input     3,850,787
----------------------------------------
SUBAGENTS (4 total):
  Input Tokens         10,191
  Output Tokens        34,573
  Cache Creation Input 561,224
  Cache Read Input     6,249,226
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   16,833
  Total Output Tokens  55,611
  Total Cache Creation 719,908
  Total Cache Read     10,100,013
----------------------------------------
GRAND TOTAL TOKENS:  10,892,365
========================================
```
