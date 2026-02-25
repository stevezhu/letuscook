import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '#components/animated-icon.js';
import { BottomTabInset, MaxContentWidth, Spacing } from '#constants/theme.js';

export default function HomeScreen() {
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
          <AnimatedIcon />
        </View>
      </SafeAreaView>
    </View>
  );
}
