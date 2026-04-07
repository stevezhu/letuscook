import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import type { FallbackProps } from 'react-error-boundary';
import { View } from 'react-native';

export type DefaultErrorFallbackProps = FallbackProps & {
  onGoBack?: () => void;
};

export function DefaultErrorFallback({
  error,
  resetErrorBoundary,
  onGoBack,
}: DefaultErrorFallbackProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-8">
      <Text className="text-center text-base text-muted-foreground">
        Something went wrong
      </Text>
      <Text
        className="text-center text-sm text-muted-foreground"
        numberOfLines={3}
      >
        {error instanceof Error ? error.message : String(error)}
      </Text>
      <View className="flex-row gap-3">
        {onGoBack && (
          <Button variant="outline" onPress={onGoBack}>
            <Text>Go back</Text>
          </Button>
        )}
        <Button onPress={resetErrorBoundary}>
          <Text>Try again</Text>
        </Button>
      </View>
    </View>
  );
}
