import { ReactNode } from 'react';

import type { ApiClient } from './ApiClient.js';
import { ApiClientContext } from './useApiClient.js';

export type ApiClientProviderProps = {
  apiClient: ApiClient;
  children: ReactNode;
};

export function ApiClientProvider({
  apiClient,
  children,
}: ApiClientProviderProps) {
  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
    </ApiClientContext.Provider>
  );
}
