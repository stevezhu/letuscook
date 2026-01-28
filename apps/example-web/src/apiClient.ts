import { ApiClient } from '@example/app';
import type { AppType } from 'example-server/types';
import { hc } from 'hono/client';

export function createHonoClient({
  baseUrl = window.location.origin,
}: {
  baseUrl?: string;
} = {}) {
  return hc<AppType>(baseUrl).api;
}

export function createAppApiClient({
  honoClient,
}: {
  honoClient: ReturnType<typeof createHonoClient>;
}): ApiClient {
  return {
    example: {
      test: async () => {
        const response = await honoClient.example.test.$get();
        return response.json();
      },
    },
  };
}
