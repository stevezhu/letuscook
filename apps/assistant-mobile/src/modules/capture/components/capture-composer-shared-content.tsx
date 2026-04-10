import { useIncomingShare } from 'expo-sharing';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { captureTypeAtom, captureTextAtom } from './capture-composer.tsx';

/**
 * Reads incoming share payloads and prefills the capture composer. Must be
 * rendered inside `<CaptureComposer>` (within its Jotai Provider scope).
 */
export function CaptureComposerSharedContent() {
  // TODO: handle isResolving=true state and error state
  const { resolvedSharedPayloads, clearSharedPayloads } = useIncomingShare();
  const setCaptureText = useSetAtom(captureTextAtom);
  const setCaptureType = useSetAtom(captureTypeAtom);

  useEffect(() => {
    // TODO: test multiple shared payloads and add tests
    const contents = resolvedSharedPayloads
      .map((p) => p.contentUri ?? '')
      .filter(Boolean);
    if (contents.length === 0) return;

    setCaptureText(contents.join('\n'));
    // TODO: this logic is duplicated in convex captures logic
    // apps/assistant-convex/convex/captures.ts
    if (
      contents.some((c) => c.startsWith('http://') || c.startsWith('https://'))
    ) {
      setCaptureType('link');
    }
    clearSharedPayloads();
  }, [
    resolvedSharedPayloads,
    setCaptureText,
    setCaptureType,
    clearSharedPayloads,
  ]);

  return null;
}
