import type { ApiClient } from '@workspace/assistant-app/ApiClient';

import type { Api } from '#preload/api/index.ts';

declare global {
  interface Window {
    api: Api;
    apiClient: ApiClient;
  }
}
