import { useIncomingShare } from 'expo-sharing';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { captureTypeAtom, textAtom } from './capture-composer.tsx';

/**
 * Reads incoming share payloads and prefills the capture composer. Must be
 * rendered inside `<CaptureComposer>` (within its Jotai Provider scope).
 */
export function CaptureComposerSharedContent() {
  // TODO: handle isResolving=true state and error state
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
