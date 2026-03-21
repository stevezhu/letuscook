import { createContext, useContext } from 'react';

import { AuthKitClient } from '../expo/auth-kit-client.ts';

export const AuthKitClientContext = createContext<AuthKitClient | null>(null);

export const AuthKitClientProvider = AuthKitClientContext.Provider;

export function useAuthKitClient(): AuthKitClient {
  const client = useContext(AuthKitClientContext);
  if (!client) {
    throw new Error('AuthKitClient not found');
  }
  return client;
}
