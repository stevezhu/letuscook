import { atom } from 'jotai';

import type { CaptureType } from '../guest-capture-types.js';

export const captureTextAtom = atom('');
export const captureTypeAtom = atom<CaptureType>('text');
