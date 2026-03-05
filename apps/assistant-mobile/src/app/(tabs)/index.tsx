import { View } from 'react-native';

import { SignInButton } from '#modules/auth/SignInButton.js';

export default function HomeScreen() {
  return (
    <View className="p-safe">
      <SignInButton />
    </View>
  );
}
