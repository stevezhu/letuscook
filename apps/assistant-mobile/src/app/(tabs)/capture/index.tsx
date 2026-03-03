import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { BottomTabInset, MaxContentWidth, Spacing } from '#constants/theme.js';

export default function CaptureScreen() {
  return (
    <View className="flex-1 flex-row justify-center">
      <SafeAreaView
        className="flex-1 items-center gap-4 px-6"
        style={{
          maxWidth: MaxContentWidth,
          paddingBottom: BottomTabInset + Spacing.three,
        }}
      >
        <View className="flex-1 items-center justify-center gap-6 px-6">
          <Text variant="h1">Capture</Text>
          <Text variant="p" className="text-center text-muted-foreground">
            Ready to capture your next big idea?
          </Text>
          <Button size="lg" className="mt-4">
            <Text>Start Capturing</Text>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
