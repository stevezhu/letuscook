import { vi } from 'vitest';

import type { fetchLinkMetadata as _fetchLinkMetadata } from '../linkFetcher.ts';

export const fetchLinkMetadata = vi
  .fn<typeof _fetchLinkMetadata>()
  .mockResolvedValue({
    url: 'https://example.com',
    domain: 'example.com',
    title: 'Example Page',
    description: 'A mock page description',
    fetchedAt: Date.now(),
    fetchStatus: 'success',
  });
