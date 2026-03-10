import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '#modules/auth/auth-context.tsx';
import { GUEST_CAPTURE_LIMIT } from '#modules/capture/guest-capture-types.ts';
import { useGuestCaptureStore } from '#modules/capture/use-guest-capture-store.ts';

function CaptureScreenInner() {
  const { captures } = useGuestCaptureStore();
  const { user, signIn } = useAuth();
  const limitReached = !user && captures.length >= GUEST_CAPTURE_LIMIT;

  return (
    <View className="flex-1 p-safe">
      <Text>capture placeholder</Text>
      {limitReached && (
        <View className="mt-4 items-center gap-3">
          <Text className="text-muted-foreground text-center text-sm">
            Sign in to continue capturing
          </Text>
          <Button onPress={signIn}>
            <Text>Sign In</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

export default function CaptureScreen() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <CaptureScreenInner />
    </Suspense>
  );
}
