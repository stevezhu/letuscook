import { ConvexProviderWithAuthKit } from '@convex-dev/workos';
import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

import { AuthKitClient } from '#modules/auth/expo/auth-kit-client.ts';
import { AuthKitClientProvider } from '#modules/auth/react/auth-kit-client-context.ts';
import { AuthProvider, useAuth } from '#modules/auth/react/auth-provider.tsx';

export type AppAuthProviderProps = {
  authKitClient: AuthKitClient;
  convex: ConvexReactClient;
  children: ReactNode;
};

export function AppAuthProvider({
  authKitClient: authClient,
  convex,
  children,
}: AppAuthProviderProps) {
  return (
    <AuthKitClientProvider value={authClient}>
      <AuthProvider>
        <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithAuthKit>
      </AuthProvider>
    </AuthKitClientProvider>
  );
}
