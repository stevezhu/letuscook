import '#polyfills.js';
import '#main.css';
import { ConvexQueryClient } from '@convex-dev/react-query';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import React, { useCallback } from 'react';
import { useColorScheme } from 'react-native';
import {
  SafeAreaListener,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { AnimatedSplashOverlay } from '#components/animated-icon.js';
import { UserSync } from '#components/user-sync.js';
import { getAccessToken } from '#lib/auth.js';
import { AuthProvider, useAuth } from '#providers/auth-provider.js';

if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL is not set');
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL, {
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

function useConvexAuth() {
  const { user, loading } = useAuth();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      return await getAccessToken({ forceRefresh: forceRefreshToken });
    },
    [],
  );
  return { isLoading: loading, isAuthenticated: !!user, fetchAccessToken };
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
          <UserSync />
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
        </ConvexProviderWithAuth>
      </AuthProvider>
    </QueryClientProvider>
  );
}
