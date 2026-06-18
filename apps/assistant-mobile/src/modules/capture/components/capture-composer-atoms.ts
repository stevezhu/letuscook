import { atom } from 'jotai';

import type { CaptureType } from '../guest-capture-types.js';
import {
  EMPTY_SEGMENTS,
  flattenSegments,
  type Segment,
} from '../lib/segments.ts';

export const captureSegmentsAtom = atom<Segment[]>(EMPTY_SEGMENTS);
export const captureTypeAtom = atom<CaptureType>('text');

export const captureFlatTextAtom = atom((get) =>
  flattenSegments(get(captureSegmentsAtom)),
);

export const trimmedCaptureFlatTextAtom = atom((get) =>
  get(captureFlatTextAtom).trim(),
);
