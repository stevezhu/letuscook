import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

export type DefaultErrorFallbackProps = {
  message?: string;
  onGoBack?: () => void;
  onRetry?: () => void;
};

export function DefaultErrorFallback({
  message,
  onGoBack,
  onRetry,
}: DefaultErrorFallbackProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-8">
      <Text className="text-muted-foreground text-center text-base">
        Something went wrong
      </Text>
      {message && (
        <Text
          className="text-muted-foreground text-center text-sm"
          // TODO: handle all lengths of messages
          numberOfLines={10}
        >
          {message}
        </Text>
      )}
      <View className="flex-row gap-3">
        {onGoBack && (
          <Button variant="outline" onPress={onGoBack}>
            <Text>Go back</Text>
          </Button>
        )}
        {onRetry && (
          <Button onPress={onRetry}>
            <Text>Try again</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
