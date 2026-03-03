import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { useConvexAuth } from 'convex/react';
import React from 'react';
import { View } from 'react-native';

import { useAuth } from '#providers/auth-provider.js';

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  function SignInCTA() {
    const { signIn } = useAuth();
    return (
      <View className="flex-1 items-center justify-center gap-4 p-safe">
        <Text className="text-lg font-semibold">Sign in to continue</Text>
        <Text className="text-muted-foreground text-center">
          Sign in to access your knowledge base and search.
        </Text>
        <Button onPress={signIn}>
          <Text>Sign In</Text>
        </Button>
      </View>
    );
  }

  return { isAuthenticated, isLoading, SignInCTA };
}
