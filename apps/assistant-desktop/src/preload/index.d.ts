import type { ApiClient } from '@assistant/app';

import type { Api } from '#preload/api/index.js';

declare global {
  interface Window {
    api: Api;
    apiClient: ApiClient;
  }
}
