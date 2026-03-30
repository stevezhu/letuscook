import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '#modules/auth/react/auth-provider.tsx';

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'capture',
};

export default function TabsLayout() {
  const { isLoading, user } = useAuth();
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NativeTabs backgroundColor="red">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      {/* <NativeTabs.Trigger name="demo">
        <NativeTabs.Trigger.Label>Demo</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" />
      </NativeTabs.Trigger> */}
      <NativeTabs.Trigger
        name="capture"
        disableAutomaticContentInsets
        disableScrollToTop // disable scroll to top because we need the ui to scroll to the bottom
      >
        <NativeTabs.Trigger.Label>Capture</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.and.pencil" md="edit_square" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inbox">
        <NativeTabs.Trigger.Label>Inbox</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tray.fill" md="inbox" />
      </NativeTabs.Trigger>
      {user !== null && (
        <NativeTabs.Trigger name="account">
          <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        </NativeTabs.Trigger>
      )}
      {__DEV__ && (
        <NativeTabs.Trigger name="storybook">
          <NativeTabs.Trigger.Label>Storybook</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="book.fill" md="book" />
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
