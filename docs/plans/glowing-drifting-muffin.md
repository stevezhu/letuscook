# Mock AI SDK calls in captures tests

## Context

The `embedAndClassify` action in `captures.ts` calls external AI APIs (Google embedding, text generation) via the Vercel AI SDK. During tests, there's no API key, so these calls fail with `AI_LoadAPIKeyError` and log noisy errors to stderr. The goal is to mock the external calls so the action still runs end-to-end with deterministic responses.

## Approach: `vi.mock()` on AI helper modules

Use Vitest's `vi.mock()` to mock the three modules that make external calls. Vitest hoists these mocks, and since `convex-test` loads modules through Vite's `import.meta.glob`, the mocks intercept correctly.

**Why not MSW?** MSW's node interceptors rely on Node.js `http`/`https` modules which don't exist in the `edge-runtime` test environment.

## Changes

### 1. Add `vi.mock()` declarations to `captures.test.ts`

At the top of the file, mock three modules:

```typescript
vi.mock('#ai/embedding.ts', () => ({
  embedText: vi.fn().mockResolvedValue(Array.from({ length: 768 }, () => 0.1)),
  generateTitle: vi.fn().mockResolvedValue('Mock Generated Title'),
}));

vi.mock('#ai/nodeLinker.ts', () => ({
  identifyOrganizingNodes: vi.fn().mockResolvedValue([]),
}));

vi.mock('#ai/linkFetcher.ts', () => ({
  fetchLinkMetadata: vi.fn().mockResolvedValue({
    url: 'https://example.com',
    domain: 'example.com',
    title: 'Example Page',
    description: 'A mock page description',
    fetchedAt: Date.now(),
    fetchStatus: 'success',
  }),
}));
```

**What this tests:** The full `embedAndClassify` action orchestration, vector search, `saveEmbeddingResult` mutation, link metadata saving — everything except the actual HTTP calls to AI providers.

**What this skips:** The retry/fallback logic inside `generateTitle` and `identifyOrganizingNodes`, and the AI SDK wire protocol. Those are better tested by the SDK itself or with dedicated unit tests if needed.

### 2. If `#` alias doesn't work with `vi.mock`

Fall back to relative paths: `vi.mock('../src/ai/embedding.ts', ...)`. The `#` subpath imports should work since Vite resolves them, but this is the fallback.

## Files to modify

- `apps/assistant-convex/convex/captures.test.ts` — add `vi.mock()` declarations

No new dependencies. No production code changes.

## Verification

1. `pnpm -w run test` — all tests pass
2. Confirm no `AI_LoadAPIKeyError` in stderr output
3. Existing capture tests still pass with mocked AI responses
