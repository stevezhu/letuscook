import { vi } from 'vitest';

import type { identifyOrganizingNodes as _identifyOrganizingNodes } from '../nodeLinker.ts';

export const identifyOrganizingNodes = vi
  .fn<typeof _identifyOrganizingNodes>()
  .mockResolvedValue([]);
