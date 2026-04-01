---
date: 2026-04-01T01:35:55Z
type: plan
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: improve-capture
sessionId: 740f91ce-aa30-4f80-a7ea-8bcaa8d002ce
tags: [ai, openrouter, ai-sdk]
---

# Setup OpenRouter Provider for Testing

## Goal

Add OpenRouter as an additional AI provider in assistant-convex for testing alternative models via Vercel AI SDK. Leave placeholders for model selection.

## Scope

**Included:**

- Install `@openrouter/ai-sdk-provider` package
- Add OpenRouter model(s) to `TITLE_MODELS` fallback chain in `convex/ai/embedding.ts`
- Document placeholder values for user to fill in

**NOT included:**

- Embeddings (OpenRouter doesn't support embeddings; stays with Google)
- Changing the retry/fallback logic (already handles multiple providers)
- Runtime provider switching or configuration UI

## Steps

1. **Install package**

   ```bash
   pnpm add @openrouter/ai-sdk-provider --filter assistant-convex
   ```

2. **Update `apps/assistant-convex/convex/ai/embedding.ts`**
   - Add import: `import { openrouter } from '@openrouter/ai-sdk-provider';`
   - Add OpenRouter model to `TITLE_MODELS`:
     ```typescript
     const TITLE_MODELS = [
       google('gemini-3-flash-preview'),
       openrouter('PLACEHOLDER_MODEL'), // e.g. 'google/gemini-2.5-flash-preview'
     ];
     ```

3. **Set Convex environment variable** (already done by user)

   ```bash
   pnpx convex env set OPENROUTER_API_KEY "sk-or-v1-..."
   ```

   The `@openrouter/ai-sdk-provider` reads `OPENROUTER_API_KEY` from `process.env` automatically.

4. **Verify**
   - `pnpm -w run lint` and `pnpm -w run test` pass
   - Trigger a capture to test title generation through OpenRouter

## Placeholders for User

| Placeholder          | Description                              | Where to get it              |
| -------------------- | ---------------------------------------- | ---------------------------- |
| `OPENROUTER_API_KEY` | API key for OpenRouter (already set)     | https://openrouter.ai/keys   |
| `PLACEHOLDER_MODEL`  | OpenRouter model ID for title generation | https://openrouter.ai/models |

Example model IDs: `google/gemini-2.5-flash-preview`, `anthropic/claude-sonnet-4`, `deepseek/deepseek-chat-v3-0324`

## Open Questions

- Which specific OpenRouter model(s) to use for testing?

## References

- [OpenRouter AI SDK Provider](https://www.npmjs.com/package/@openrouter/ai-sdk-provider)
- [OpenRouter Models](https://openrouter.ai/models)
- [Vercel AI SDK Providers](https://sdk.vercel.ai/docs/foundations/providers-and-models)
