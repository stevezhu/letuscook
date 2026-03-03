import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { CircleUserRound } from 'lucide-react-native';
import { Pressable, useColorScheme } from 'react-native';

import { useAuth } from '#providers/auth-provider.js';

function ProfileButton() {
  const { user, signIn, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = colorScheme === 'dark' ? '#fff' : '#000';

  return (
    <Pressable
      onPress={() => (user ? signOut() : signIn())}
      accessibilityLabel={user ? 'Sign out' : 'Sign in'}
    >
      <CircleUserRound size={24} color={tintColor} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <NativeTabs
      screenOptions={{
        headerLeft: () => <ProfileButton />,
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="capture">
        <NativeTabs.Trigger.Label>Capture</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.and.pencil" md="edit_square" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
