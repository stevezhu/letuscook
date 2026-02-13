import { createContext, useContext } from 'react';

import type { ApiClient } from './ApiClient.js';

export const ApiClientContext = createContext<ApiClient | null>(null);

export const useApiClient = () => {
  const apiClient = useContext(ApiClientContext);
  if (apiClient === null) {
    throw new Error(`${ApiClientContext.name} has not been initialized`);
  }
  return apiClient;
};
