import {
  LegendList,
  LegendListProps,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

/**
 * Shared shape for rendering a capture item.
 */
export type CaptureItemData = {
  id: string;
  rawContent: string;
  capturedAt: number;
  captureType: string;
};

export function CaptureList(props: LegendListProps<CaptureItemData>) {
  return (
    <LegendList<CaptureItemData>
      renderItem={(props) => <CaptureItemSpread {...props} />}
      keyExtractor={(item) => item.id}
      recycleItems
      ItemSeparatorComponent={() => <View className="h-2" />}
      contentContainerClassName="px-3 py-2"
      {...props}
    />
  );
}

function CaptureItemSpread({
  item,
}: LegendListRenderItemProps<CaptureItemData>) {
  return (
    <View className="bg-muted max-w-[85%] flex-col gap-1 self-end rounded-lg rounded-br-none px-3 py-2">
      <Text className="text-primary">{item.rawContent}</Text>
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="text-muted-foreground text-[10px] capitalize"
          variant="muted"
        >
          {item.captureType}
        </Text>
        <Text className="text-muted-foreground text-[10px]">
          {formatRelativeTime(item.capturedAt)}
        </Text>
      </View>
    </View>
  );
}

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    // input 0 instead of actual seconds so that it outputs `now`
    return relativeTimeFormat.format(0, 'seconds');
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return relativeTimeFormat.format(-minutes, 'minutes');
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return relativeTimeFormat.format(-hours, 'hours');
  }
  const days = Math.floor(hours / 24);
  return relativeTimeFormat.format(-days, 'days');
}
