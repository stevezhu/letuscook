import '#main.css';
import { ConvexQueryClient } from '@convex-dev/react-query';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { once } from 'es-toolkit';
import { Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { useColorScheme } from 'react-native';
import {
  SafeAreaListener,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { AnimatedSplashOverlay } from '#components/animated-icon.tsx';
import { CONVEX_URL, WORKOS_CLIENT_ID } from '#constants/env.ts';
import { createAuthProvider, useAuth } from '#modules/auth/auth-context.tsx';
import { ExpoAuthClient } from '#modules/auth/auth.ts';
import { CaptureMigrationProvider } from '#modules/capture/capture-migration-provider.tsx';

export const unstable_settings = {
  initialRouteName: '(tabs)',
  anchor: '(tabs)',
};

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

const authClient = once(
  () =>
    new ExpoAuthClient({
      clientId: WORKOS_CLIENT_ID,
      sessionKey: 'workos_session',
      pkceKey: 'workos_pkce',
    }),
);

const getAuthProvider = once(() =>
  createAuthProvider({ authClient: authClient() }),
);

const getUseConvexAuth = once(() => {
  return function useConvexAuth() {
    const { user, loading } = useAuth();
    const fetchAccessToken = useCallback(
      async (_: {
        // TODO: not supported for now
        forceRefreshToken: boolean;
      }) => {
        return await authClient().getAccessToken();
      },
      [],
    );
    return { isLoading: loading, isAuthenticated: !!user, fetchAccessToken };
  };
});

export default function RootLayout() {
  const AuthProvider = getAuthProvider();
  const useConvexAuth = getUseConvexAuth();
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
          {/*
            CaptureMigrationProvider is placed inside ConvexProviderWithAuth
            so that it has access to both authentication state and the Convex client.
            It wraps the UI to passively detect sign-in events and trigger
            the guest capture migration process without blocking rendering.
          */}
          <CaptureMigrationProvider>
            <ThemeProvider
              value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
            >
              <SafeAreaProvider>
                <SafeAreaListener
                  onChange={({ insets }) => {
                    Uniwind.updateInsets(insets);
                  }}
                >
                  <AnimatedSplashOverlay />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                </SafeAreaListener>
              </SafeAreaProvider>
            </ThemeProvider>
          </CaptureMigrationProvider>
        </ConvexProviderWithAuth>
      </AuthProvider>
    </QueryClientProvider>
  );
}
