import { ReactNode } from 'react';

import type { ApiClient } from './ApiClient.ts';
import { ApiClientContext } from './useApiClient.ts';

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
