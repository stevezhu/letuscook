import { ActivityIndicator, View } from 'react-native';

/**
 * A full-screen activity indicator that is used as a default suspense fallback.
 */
export function DefaultActivityView() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
