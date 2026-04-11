# Fix shared content handling for text and website payloads

## Context

`CaptureComposerSharedContent` currently extracts `contentUri` from all resolved share payloads. This is broken for **text** shares because `contentUri` is `null` for `TextBasedResolvedSharePayload` — only the `value` field contains the actual text. Website shares work by accident since `contentUri` is non-null for `UriBasedResolvedSharePayload`.

## File to modify

`apps/assistant-mobile/src/modules/capture/components/capture-composer-shared-content.tsx`

## Changes

### 1. Add `extractContent` helper

Discriminates on `contentType` to pick the correct field per payload:

| `contentType`                          | Field to use        | Reason                                 |
| -------------------------------------- | ------------------- | -------------------------------------- |
| `'website'`                            | `contentUri`        | Resolved/redirect-followed URL         |
| `'text'` / `undefined`                 | `value`             | `contentUri` is null for text payloads |
| `'audio'`/`'image'`/`'video'`/`'file'` | `''` (filtered out) | Not supported yet (TODO)               |
| `null` (default)                       | `value`             | Safe fallback                          |

Note: `contentType` is optional (`contentType?: 'text'`) on `TextBasedResolvedSharePayload`, so `undefined` must be handled as text.

### 2. Add `detectCaptureType` helper

Returns a single `CaptureType` from the array of payloads. Priority: `'link'` > `'text'` (if any payload is a website, treat as link capture).

### 3. Rewrite the `useEffect` body

Replace inline content extraction and type detection with the two helpers above. The effect structure (early returns, join with `\n`, clear payloads) stays the same.

### 4. Add `ResolvedSharePayload` type import

Needed for the helper function signatures.

## Import needed

```typescript
import type { ResolvedSharePayload } from 'expo-sharing';
```

Also need to import `CaptureType` from `../guest-capture-types.ts` for the `detectCaptureType` return type.

## Verification

1. `pnpm run lint:fix`
2. `pnpm -w run lint`
3. `pnpm -C apps/assistant-mobile run typecheck`
