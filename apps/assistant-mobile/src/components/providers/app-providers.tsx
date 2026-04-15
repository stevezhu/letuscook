import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexReactClient } from 'convex/react';
import React, { type ReactNode } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AppAuthProvider } from '#components/providers/app-auth-provider.tsx';
import { AppReactQueryDevtools } from '#components/providers/app-react-query-devtools.tsx';
import { AppSafeAreaProvider } from '#components/providers/app-safe-area-provider.tsx';
import { AppThemeProvider } from '#components/providers/app-theme-provider.tsx';
import { CONVEX_URL, WORKOS_CLIENT_ID } from '#constants/env.ts';
import { AuthKitClient } from '#modules/auth/expo/auth-kit-client.ts';
import { CaptureMigrationProvider } from '#modules/capture/capture-migration-provider.tsx';

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

const authKitClient = new AuthKitClient({
  clientId: WORKOS_CLIENT_ID,
  sessionKey: 'workos_session',
  pkceKey: 'workos_pkce',
});

export type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  // TODO: add top level suspense
  return (
    <QueryClientProvider client={queryClient}>
      <AppAuthProvider authKitClient={authKitClient} convex={convex}>
        {/*
            CaptureMigrationProvider is placed inside ConvexProviderWithAuth
            so that it has access to both authentication state and the Convex client.
            It wraps the UI to passively detect sign-in events and trigger
            the guest capture migration process without blocking rendering.
          */}
        <CaptureMigrationProvider>
          <AppThemeProvider>
            <KeyboardProvider>
              <AppSafeAreaProvider>{children}</AppSafeAreaProvider>
            </KeyboardProvider>
          </AppThemeProvider>
        </CaptureMigrationProvider>
      </AppAuthProvider>
      <AppReactQueryDevtools queryClient={queryClient} />
    </QueryClientProvider>
  );
}
