import type { Id } from 'assistant-convex/convex/_generated/dataModel';
import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ReviewScreen } from '#modules/inbox/components/review-screen.tsx';

export default function ReviewRoute() {
  const { captureId } = useLocalSearchParams<{ captureId: string }>();

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Review Item',
          presentation: 'modal',
        }}
      />
      <ReviewScreen captureId={captureId as Id<'captures'>} />
    </View>
  );
}
