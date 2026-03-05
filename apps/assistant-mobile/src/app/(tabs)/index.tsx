import * as Auth from 'expo-auth-session';
import { View } from 'react-native';

import { SignInButton } from '#modules/auth/SignInButton.js';

export default function HomeScreen() {
  console.log('auth', Auth.getDefaultReturnUrl(), Auth.makeRedirectUri());
  return (
    <View className="p-safe">
      <SignInButton />
    </View>
  );
}
