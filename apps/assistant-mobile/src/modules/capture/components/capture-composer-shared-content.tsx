import type { ResolvedSharePayload } from 'expo-sharing';
import { useIncomingShare } from 'expo-sharing';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import type { CaptureType } from '../guest-capture-types.js';
import { captureTypeAtom, captureTextAtom } from './capture-composer.tsx';

function extractContent(p: ResolvedSharePayload): string {
  switch (p.contentType) {
    case 'website':
      return p.contentUri;
    case 'text':
      return p.value;
    // TODO: handle media/file types when capture supports attachments
    case 'audio':
    case 'image':
    case 'video':
    case 'file':
    case undefined:
      return '';
  }
}

function detectCaptureType(payloads: ResolvedSharePayload[]): CaptureType {
  if (payloads.every((p) => p.contentType === 'website')) {
    return 'link';
  }
  return 'text';
}

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
    if (resolvedSharedPayloads.length === 0) return;

    const contents = resolvedSharedPayloads.map(extractContent).filter(Boolean);
    if (contents.length === 0) return;

    setCaptureText(contents.join('\n'));
    setCaptureType(detectCaptureType(resolvedSharedPayloads));
    clearSharedPayloads();
  }, [
    resolvedSharedPayloads,
    setCaptureText,
    setCaptureType,
    clearSharedPayloads,
  ]);

  return null;
}
