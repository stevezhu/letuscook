import '#main.css';
import { Stack } from 'expo-router';
import React from 'react';

import StorybookUIRoot from '#.rnstorybook/index.ts';
import { DefaultQueryBoundary } from '#components/boundaries/default-query-boundary.tsx';
import { AppProviders } from '#components/providers/app-providers.tsx';
import { useSuspenseAuth } from '#modules/auth/react/auth-provider.tsx';

function RootLayout() {
  return (
    <DefaultQueryBoundary>
      <AppProviders>
        {/* TODO: this isn't needed, but just kept here as a reference for now */}
        {/* <AnimatedSplashOverlay /> */}
        <RootLayoutContent />
      </AppProviders>
    </DefaultQueryBoundary>
  );
}

function RootLayoutContent() {
  const { user } = useSuspenseAuth();
  const isLoggedIn = user != null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen
          name="(tabs)"
          options={{
            // TODO: set this depending on the tab that is active
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="review/[captureId]"
          options={{
            headerShown: true,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="knowledge/[nodeId]/index"
          options={{
            headerShown: true,
            title: '',
          }}
        />
        <Stack.Screen
          name="knowledge/[nodeId]/menu"
          options={{
            headerShown: true,
            presentation: 'modal',
            title: 'Options',
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

let App = RootLayout;
if (process.env['EXPO_PUBLIC_STORYBOOK_ENABLED'] === 'true') {
  App = StorybookUIRoot;
}
export default App;
