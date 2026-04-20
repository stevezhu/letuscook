import { productName } from '@workspace/constants';
import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

import { useSuspenseAuth } from '#modules/auth/react/auth-provider.tsx';

export default function LoginScreen() {
  const { signIn } = useSuspenseAuth();

  return (
    <View className="bg-background flex-1 items-center justify-center p-6">
      <View className="flex-col items-center gap-8">
        <View className="flex-col items-center gap-2">
          <Text className="text-foreground text-4xl font-bold tracking-tight">
            {productName}
          </Text>
          <Text className="text-muted-foreground text-center text-lg">
            Sign in to get started.
          </Text>
        </View>

        <Button onPress={signIn} className="w-full min-w-[200px]">
          <Text>Sign In</Text>
        </Button>
      </View>
    </View>
  );
}
