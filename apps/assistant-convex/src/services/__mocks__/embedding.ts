import { vi } from 'vitest';

import type {
  embedText as _embedText,
  generateTitle as _generateTitle,
} from '../embedding.ts';

export const embedText = vi
  .fn<typeof _embedText>()
  .mockResolvedValue(Array.from({ length: 768 }, () => 0.1));

export const generateTitle = vi
  .fn<typeof _generateTitle>()
  .mockResolvedValue('Mock Generated Title');
