import { vi } from 'vitest';

export const embedText = vi
  .fn()
  .mockResolvedValue(Array.from({ length: 768 }, () => 0.1));

export const generateTitle = vi.fn().mockResolvedValue('Mock Generated Title');
