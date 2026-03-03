import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

import { useRequireAuth } from '#hooks/use-require-auth.js';

export default function SearchIndex() {
  const { isAuthenticated, isLoading, SignInCTA } = useRequireAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <SignInCTA />;

  return (
    <View className="p-safe">
      <Text>search placeholder</Text>
    </View>
  );
}
