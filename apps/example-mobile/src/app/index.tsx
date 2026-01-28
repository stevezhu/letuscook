import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

import { AnimatedIcon } from '#components/animated-icon.js';
import { HintRow } from '#components/hint-row.js';
import { ThemedText } from '#components/themed-text.js';
import { ThemedView } from '#components/themed-view.js';
import { WebBadge } from '#components/web-badge.js';
import { BottomTabInset, MaxContentWidth, Spacing } from '#constants/theme.js';

export default function HomeScreen() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          get started
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow title="Try editing" hint="src/app/index.tsx" />
          <HintRow title="Dev tools" hint="cmd+d" />
          <HintRow title="Fresh start" hint="npm reset project" />
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          uniwind test
        </ThemedText>

        <View className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl self-stretch ">
          <Text className="text-sm text-gray-600 dark:text-gray-300">
            Active theme: {theme}
          </Text>
          <Text className="text-xs text-gray-800 dark:text-gray-400 mt-1">
            {hasAdaptiveThemes ? 'Following system theme' : 'Fixed theme'}
          </Text>
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
