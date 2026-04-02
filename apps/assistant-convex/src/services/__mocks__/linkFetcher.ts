import { vi } from 'vitest';

export const fetchLinkMetadata = vi.fn().mockResolvedValue({
  url: 'https://example.com',
  domain: 'example.com',
  title: 'Example Page',
  description: 'A mock page description',
  fetchedAt: Date.now(),
  fetchStatus: 'success',
});
