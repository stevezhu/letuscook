import { ConvexQueryClient } from '@convex-dev/react-query';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import {
  SafeAreaListener,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { AnimatedSplashOverlay } from '#components/animated-icon';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
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

// TODO T2: wire WorkOS auth token

export const unstable_settings = {
  initialRouteName: '(tabs)',
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convex}>
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
                <Stack.Screen
                  name="search-modal"
                  options={{ presentation: 'modal' }}
                />
              </Stack>
            </SafeAreaListener>
          </SafeAreaProvider>
        </ThemeProvider>
      </ConvexProvider>
    </QueryClientProvider>
  );
}
