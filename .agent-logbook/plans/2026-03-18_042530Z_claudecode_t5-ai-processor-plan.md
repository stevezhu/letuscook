---
date: 2026-03-18T04:25:30Z
type: plan
status: superseded
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: t5
sessionId: 72d38226-10d2-40ef-88ed-38eab13db1f4
taskId: T5
tags: [ai, vercel-ai-sdk, convex, captures, processing]
---

# T5: AI Processor — processCapture with Vercel AI SDK

## Goal

Replace the deterministic stub in `processCapture` with real AI processing using the Vercel AI SDK. The flow becomes: `processCapture` (internal mutation) orchestrates → `runAiProcessing` (internal action) calls AI providers → `saveAiSuggestion` (internal mutation helper) persists validated output as draft graph artifacts.

## Scope

### In Scope

- Install Vercel AI SDK deps (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- Refactor `processCapture` from internal mutation to a two-phase orchestrator (mutation → action → mutation)
- New `runAiProcessing` internal action for external AI calls with `generateObject`
- New `saveAiSuggestion` helper in `model/captures.ts` (keep existing `saveDraftSuggestion` stub)
- Provider fallback chain: OpenAI GPT-4o → Claude 3.5 Haiku → Gemini 2.0 Flash
- Exponential backoff retry: 1s → 2s → 4s (3 attempts per provider)
- Zod schema for structured output contract
- Post-validation of `linksToExisting` node IDs
- `captureState="failed"` when all providers fail

### Out of Scope

- Human collaborator processor (Phase 2)
- Summarization routing (Phase 2)
- Semantic similarity link suggestions (Phase 2)
- Frontend/mobile changes

## Current State Analysis

### Existing Code

- **`captures.ts:processCapture`** (L489-521): Internal mutation that resolves agent user and calls `saveDraftSuggestion` stub
- **`model/captures.ts:saveDraftSuggestion`** (L15-62): Stub that creates `[Draft] {content}` node + edges from explicit mentions only
- **`model/captures.ts:setCaptureFailed`** (L4-13): Already exists for failure handling
- **`model/users.ts:getAgentUser`** (L72-79): Queries first `userType="agent"` user — works for Phase 1
- **`scripts/seedAgentUser.ts`**: Seeds CookBot agent (openai/gpt-4o)
- **`package.json`**: No AI SDK deps currently installed

### Key Constraint: Convex Function Split

Convex mutations cannot make external HTTP calls. The AI call **must** happen in an internal action. The mutation orchestrates DB reads/writes, the action handles the AI call, then a second mutation pass saves results. This means `processCapture` needs to become a two-step flow:

1. Mutation reads capture + resolves agent → schedules action
2. Action calls AI → returns payload → schedules mutation to save
3. Save mutation persists draft artifacts + sets `captureState="ready"`

## Steps

### Step 1: Install Vercel AI SDK Dependencies

- Add to `apps/assistant-convex/package.json`:
  - `ai` (core Vercel AI SDK)
  - `@ai-sdk/openai`
  - `@ai-sdk/anthropic`
  - `@ai-sdk/google`
  - `zod` (required explicitly by Vercel AI SDK's `generateObject`)
- Run `pnpm install`

### Step 2: Create AI Processing Schema & Prompts

- **New file**: `convex/ai/schema.ts`
  - Zod schema for structured output:
    ```
    suggestedNode: { title: string, content: string }
    linksToExisting: [{ nodeId: string }]
    newConcepts: [{ title: string, content?: string }]
    ```
  - Validation helpers: title length limits, max 8 total links, case-insensitive title dedup
- **New file**: `convex/ai/prompts.ts`
  - System prompt for capture processing
  - Per-captureType prompt variants (text, link, task)

### Step 3: Create Provider Routing & Retry Logic

- **New file**: `convex/ai/providers.ts`
  - Provider chain configuration: GPT-4o → Claude 3.5 Haiku → Gemini 2.0 Flash
  - `callWithFallback(...)` function:
    - For each provider: attempt `generateObject` with exponential backoff (1s, 2s, 4s)
    - On exhaustion, move to next provider
    - Returns structured output or throws after all providers fail
  - Reads API keys from `process.env` (Convex env vars):
    - `OPENAI_API_KEY`
    - `ANTHROPIC_API_KEY`
    - `GOOGLE_GENERATIVE_AI_API_KEY`

### Step 4: Implement `runAiProcessing` Internal Action

- **File**: `convex/captures.ts` (add new internal action)
- **Signature**: `internalAction({ args: { captureId, rawContent, captureType, ownerUserId }, handler })`
- **Logic**:
  1. Build prompt from `rawContent` + `captureType` (no existing node context passed — deferred)
  2. Call `callWithFallback(...)` with Zod schema
  3. Post-validate `linksToExisting`: each nodeId must exist, be owned by `ownerUserId`, and not archived (via `ctx.runQuery`)
  4. Validate constraints (title lengths, max links, dedup)
  5. Return validated payload or throw on failure
- **Note**: Passing existing node titles for `linksToExisting` context is deferred. For now the AI will only produce `suggestedNode` + `newConcepts`. `linksToExisting` will be empty until we add node context in a follow-up.
- **On success**: schedule `saveAiResult` internal mutation with validated payload
- **On failure**: schedule `setCaptureFailed` or use `ctx.runMutation`

### Step 5: Implement `saveAiSuggestion` Helper

- **File**: `convex/model/captures.ts` (add new function, keep existing `saveDraftSuggestion`)
- **Signature**: `saveAiSuggestion(ctx, { captureId, agentUserId, suggestedNode, linksToExisting, newConcepts })`
- **Logic**:
  1. Create draft suggested node (`publishedAt` unset, `sourceCaptureId=captureId`, `ownerUserId` from capture)
  2. Create draft new concept nodes (same pattern)
  3. Create draft edges:
     - From suggested node → each `linksToExisting` node (edgeType: 'suggested', source: 'processor', verified: false)
     - From suggested node → each new concept node (edgeType: 'related', source: 'processor', verified: false)
  4. Create `suggestions` row: `captureId`, `suggestorUserId=agentUserId`, `suggestedNodeId`
  5. Set `captureState="ready"`

### Step 6: Refactor `processCapture` Orchestrator

- **File**: `convex/captures.ts`
- Keep as `internalMutation` (queue-compatible entrypoint)
- **New logic**:
  1. Fetch capture, fail fast if not found or not in `processing` state
  2. Resolve agent user via `getAgentUser(ctx)`, fail fast if missing
  3. Schedule `runAiProcessing` internal action with capture data
- Add `saveAiResult` internal mutation:
  1. Receives validated AI payload + captureId + agentUserId
  2. Calls `saveAiSuggestion` to persist draft artifacts
  3. Error handling: if save fails, set `captureState="failed"`

### Step 7: Add Node Validation Query

- **File**: `convex/nodes.ts` or inline in captures
- Internal query to validate node IDs for `linksToExisting`:
  - Check node exists, `ownerUserId` matches, `archivedAt` is not set
  - Used by `runAiProcessing` action via `ctx.runQuery`

### Step 8: Lint & Type-Check

- Run `pnpm run lint:fix` then `pnpm -w run lint`
- Run `pnpm -w run test` (type-check)
- Fix any issues

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ createCapture / migrateGuestCaptures / retryProcessing      │
│ (auth mutation) → scheduler.runAfter(0, processCapture)     │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ processCapture (internalMutation)                            │
│ 1. Fetch capture + resolve agent user                        │
│ 2. Schedule runAiProcessing action                           │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ runAiProcessing (internalAction)                             │
│ 1. Build prompt from rawContent + captureType                │
│ 2. generateObject with provider fallback chain               │
│    GPT-4o → Claude 3.5 Haiku → Gemini 2.0 Flash             │
│ 3. Post-validate linksToExisting node IDs                    │
│ 4. On success: schedule saveAiResult mutation                │
│ 5. On failure: schedule setCaptureFailed mutation            │
└──────────────────────────┬───────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ saveAiResult (internalMutation)                              │
│ → calls saveAiSuggestion(ctx, payload)                       │
│ 1. Create draft suggested node (publishedAt unset)           │
│ 2. Create draft concept nodes (publishedAt unset)            │
│ 3. Create draft edges (verified=false)                       │
│ 4. Create suggestions row (status=pending)                   │
│ 5. Set captureState="ready"                                  │
└──────────────────────────────────────────────────────────────┘
```

## File Changes Summary

| File                                             | Action | Description                                                                 |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| `apps/assistant-convex/package.json`             | Modify | Add AI SDK deps                                                             |
| `apps/assistant-convex/convex/ai/schema.ts`      | Create | Zod schema + validation helpers                                             |
| `apps/assistant-convex/convex/ai/prompts.ts`     | Create | System/user prompts per captureType                                         |
| `apps/assistant-convex/convex/ai/providers.ts`   | Create | Provider chain + retry logic                                                |
| `apps/assistant-convex/convex/captures.ts`       | Modify | Refactor processCapture, add runAiProcessing action + saveAiResult mutation |
| `apps/assistant-convex/convex/model/captures.ts` | Modify | Add saveAiSuggestion (keep saveDraftSuggestion)                             |

## Resolved Questions

1. **Concurrency throttling**: No throttling for Phase 1. The Convex scheduler handles concurrency natively. Add throttling only if needed later.
2. **Node context for AI**: Deferred. Don't pass existing node titles yet — `linksToExisting` will be empty for now. Add node context in a follow-up.
3. **`zod` dependency**: Install explicitly. Convex bundles it internally but doesn't export it; Vercel AI SDK needs it as a direct dependency.

## References

- [Vercel AI SDK docs](https://ai-sdk.dev/)
- [Vercel AI SDK generateObject](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-object)
- Ticket: `T5: AI Processor — processCapture with Vercel AI SDK`
- Tech Plan: `Technical Plan: Letuscook Architecture` (processor implementation section)

## Session Stats

```
claudecode Session Stats: 72d38226-10d2-40ef-88ed-38eab13db1f4
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001
----------------------------------------
MAIN SESSION:
  Input Tokens         63
  Output Tokens        8,776
  Cache Creation Input 169,178
  Cache Read Input     1,820,525
----------------------------------------
SUBAGENTS (1 total):
  Input Tokens         127
  Output Tokens        3,322
  Cache Creation Input 121,235
  Cache Read Input     543,277
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   190
  Total Output Tokens  12,098
  Total Cache Creation 290,413
  Total Cache Read     2,363,802
----------------------------------------
GRAND TOTAL TOKENS:  2,666,503
========================================
```
