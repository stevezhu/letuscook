import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { Pressable, View } from 'react-native';

import type { InboxItem } from '../inbox-types.ts';
import { StatePill } from './state-pill.tsx';

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function InboxItemRow({
  item,
  onPress,
  onAccept,
  onReject,
  acceptPending,
  rejectPending,
}: {
  item: InboxItem;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  acceptPending?: boolean;
  rejectPending?: boolean;
}) {
  const isReady = item.captureState === 'ready';

  return (
    <Pressable
      onPress={onPress}
      className="border-border active:bg-muted/50 border-b px-4 py-3"
    >
      <Text className="text-foreground text-sm" numberOfLines={2}>
        {item.rawContent}
      </Text>

      <View className="mt-2 flex-row items-center gap-2">
        <StatePill state={item.captureState} />
        {isReady && item.suggestor && (
          <View className="rounded-sm bg-blue-50 px-2 py-0.5">
            <Text className="text-xs text-blue-600">
              Suggested by {item.suggestor.displayName ?? 'CookBot'}
            </Text>
          </View>
        )}
        <Text className="text-muted-foreground ml-auto text-xs">
          {formatTime(item.capturedAt)}
        </Text>
      </View>

      {isReady && onAccept && onReject && (
        <View className="mt-3 flex-row gap-2">
          <Button
            className="flex-1 bg-green-600"
            onPress={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            disabled={acceptPending || rejectPending}
          >
            <Text className="text-sm font-semibold text-white">Accept</Text>
          </Button>
          <Button
            className="bg-muted flex-1"
            variant="secondary"
            onPress={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={acceptPending || rejectPending}
          >
            <Text className="text-muted-foreground text-sm font-semibold">
              Reject
            </Text>
          </Button>
        </View>
      )}
    </Pressable>
  );
}
