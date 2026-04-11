---
date: 2026-04-10T18:27:14Z
type: plan
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: feat/share-to-app
sessionId: 9bbfdeeb-6a12-4d77-a96d-fc87dd09ad6c
tags: [share-extension, ios, expo-sharing, capture]
filesModified:
  - apps/assistant-mobile/app.config.ts
  - apps/assistant-mobile/package.json
  - apps/assistant-mobile/src/app/+native-intent.ts
  - apps/assistant-mobile/src/app/(tabs)/capture.tsx
  - apps/assistant-mobile/src/modules/capture/components/capture-composer.tsx
---

# Share to App — iOS Share Extension

## Context

Users want to share links from other apps (Reddit, X, Threads, Instagram, Safari) into letuscook. This requires an iOS Share Extension that appears in the system share sheet, captures the shared URL, opens the app, and prefills the capture composer so the user can review and submit.

## Approach: `expo-sharing` + `+native-intent.ts`

Use the official `expo-sharing` package which has built-in support for receiving shared content. Since this project doesn't use CNG, the native Share Extension target needs to be set up manually in Xcode after generating it once with the config plugin.

**Flow:**

1. User taps Share in Safari/Reddit/X/etc → iOS share sheet shows "Letuscook"
2. User taps it → share extension writes content to App Group storage and opens the main app
3. `+native-intent.ts` intercepts the `expo-sharing` URL and redirects to `/capture`
4. Capture tab uses `useIncomingShare()` to read the shared payload and prefill the composer
5. User sees the URL in the composer input, can edit it, then submits

## Golden Path Verification

All target apps share URLs via the standard iOS share sheet:

- **Safari** — page URL ✓
- **Reddit** — post/link URL ✓
- **X/Twitter** — tweet URL ✓
- **Threads** — post URL ✓
- **Instagram** — limited share sheet support, but post links work when available

The existing `createCapture` mutation auto-detects URLs and promotes `captureType: 'text'` → `'link'`. No backend changes needed.

## Implementation Steps

### 1. Install `expo-sharing`

```bash
pnpm add expo-sharing --filter assistant-mobile
```

### 2. Add config plugin — `apps/assistant-mobile/app.config.ts`

Add to the `plugins` array:

```ts
[
  'expo-sharing',
  {
    ios: {
      enabled: true,
      activationRule: {
        supportsWebUrlWithMaxCount: 1,
        supportsWebPageWithMaxCount: 1,
        supportsText: true,
      },
    },
  },
],
```

This configures the extension to accept web URLs (covers Safari, Reddit, X, Threads, Instagram link shares) and plain text as a fallback.

### 3. Generate the native Share Extension target

Since the project doesn't use CNG, run prebuild once to generate the extension, then commit the native code:

```bash
cd apps/assistant-mobile
pnpx expo prebuild
```

This will:

- Create a `LetuscookShareExtension/` (or similar) directory under `ios/` with Swift source, Info.plist, and entitlements
- Add App Group entitlement (`group.com.letuscook`) to both the main app and extension
- Modify `project.pbxproj` with the new extension target

After generating, review the diff and commit. Future changes to the extension will be managed manually.

**Apple Developer Portal:** Register App Group `group.com.letuscook` and update provisioning profiles for both targets.

### 4. Create `+native-intent.ts` — `apps/assistant-mobile/src/app/+native-intent.ts` (new file)

This file intercepts incoming share URLs and redirects to the capture tab:

```ts
export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (new URL(path).hostname === 'expo-sharing') {
      return '/(tabs)/capture';
    }
    return path;
  } catch {
    return '/';
  }
}
```

### 5. Prefill the capture composer with shared content

**5a. Export atoms from capture-composer.tsx** (`apps/assistant-mobile/src/modules/capture/components/capture-composer.tsx`)

Export `textAtom` and `captureTypeAtom` so they can be set from within the Jotai Provider scope:

```ts
export const textAtom = atom('');
export const captureTypeAtom = atom<CaptureType>('text');
```

**5b. Add a `CaptureComposerSharedContent` component** inside the capture tab (`apps/assistant-mobile/src/app/(tabs)/capture.tsx`)

This component lives inside the `<CaptureComposer>` (within the Jotai Provider scope) and reads shared payloads to prefill the text input:

```tsx
import { useIncomingShare } from 'expo-sharing';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import {
  textAtom,
  captureTypeAtom,
} from '#modules/capture/components/capture-composer.tsx';

function CaptureComposerSharedContent() {
  const { resolvedSharedPayloads, clearSharedPayloads } = useIncomingShare();
  const setText = useSetAtom(textAtom);
  const setCaptureType = useSetAtom(captureTypeAtom);

  useEffect(() => {
    if (resolvedSharedPayloads.length === 0) return;

    const payload = resolvedSharedPayloads[0];
    const content = payload?.contentUri ?? '';
    if (!content) return;

    setText(content);
    if (content.startsWith('http://') || content.startsWith('https://')) {
      setCaptureType('link');
    }
    clearSharedPayloads();
  }, [resolvedSharedPayloads, setText, setCaptureType, clearSharedPayloads]);

  return null;
}
```

**5c. Mount inside `<CaptureComposer>`** in the capture screen:

```tsx
<CaptureComposer isPending={isPending} ...>
  <CaptureComposerSharedContent />
  <CaptureComposerTextInput />
  <CaptureComposerControls onSubmit={...} />
</CaptureComposer>
```

### 6. Rebuild the iOS app

```bash
cd apps/assistant-mobile
# Build via Xcode (the Share Extension target is already in the project)
```

## Files Changed

| File                                                                        | Action                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/assistant-mobile/package.json`                                        | Add `expo-sharing` dependency                                       |
| `apps/assistant-mobile/app.config.ts`                                       | Add `expo-sharing` plugin config                                    |
| `apps/assistant-mobile/src/app/+native-intent.ts`                           | **New** — redirect share URLs to capture tab                        |
| `apps/assistant-mobile/src/modules/capture/components/capture-composer.tsx` | Export `textAtom` and `captureTypeAtom`                             |
| `apps/assistant-mobile/src/app/(tabs)/capture.tsx`                          | Add `CaptureComposerSharedContent` component, mount inside composer |
| `apps/assistant-mobile/ios/`                                                | Generated by prebuild (extension target, entitlements, pbxproj)     |

## Key Existing Code to Reuse

- `CaptureComposer` + Jotai atoms at `apps/assistant-mobile/src/modules/capture/components/capture-composer.tsx` — composer with text/type atoms
- `useCaptureSubmit()` at `apps/assistant-mobile/src/modules/capture/use-capture-submit.ts` — already wired to the submit button
- `api.captures.createCapture` at `apps/assistant-convex/convex/captures.ts` — handles URL auto-detection and full processing pipeline
- No backend changes needed

## Risks & Considerations

- **`expo prebuild` may touch existing native files** — review the diff carefully. The existing AppDelegate, Info.plist URL schemes, etc. should be preserved, but verify.
- **Instagram sharing is platform-limited** — Instagram restricts what content types appear in the share sheet. URL sharing works when available, but some content (stories, reels) may not offer the option.
- **Unauthenticated share** — if the user shares while logged out, the app shows the login screen. The shared content stays in App Group storage. After login, navigating to the capture tab will pick it up via `useIncomingShare()`.
- **App Group provisioning** — must be registered in Apple Developer portal and added to both provisioning profiles. This is a manual step.

## Verification

1. Build and install the app on a device/simulator
2. Open Safari → navigate to any URL → tap Share → confirm "Letuscook" appears in the share sheet
3. Tap Letuscook → app opens to capture tab with URL prefilled in composer
4. Verify capture type is auto-set to "Link"
5. Submit → verify capture is created with type 'link'
6. Repeat from Reddit (share a post link), X (share a tweet), Threads (share a post)
7. Test cold start: force-quit the app, share from Safari, verify app opens to capture tab with URL prefilled
8. Test while logged out: share from Safari, log in, navigate to capture tab, verify URL appears

## References

- [Expo Sharing docs](https://docs.expo.dev/versions/latest/sdk/sharing/index.md)

## Session Stats

```
claudecode Session Stats: 9bbfdeeb-6a12-4d77-a96d-fc87dd09ad6c
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001, claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         5,615
  Output Tokens        48,531
  Cache Creation Input 264,425
  Cache Read Input     5,291,591
----------------------------------------
SUBAGENTS (3 total):
  Input Tokens         10,828
  Output Tokens        20,238
  Cache Creation Input 509,862
  Cache Read Input     5,900,839
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   16,443
  Total Output Tokens  68,769
  Total Cache Creation 774,287
  Total Cache Read     11,192,430
----------------------------------------
GRAND TOTAL TOKENS:  12,051,929
========================================
```
