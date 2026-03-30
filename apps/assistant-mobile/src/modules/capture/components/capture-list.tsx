import {
  LegendList,
  LegendListProps,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

import { StyledGlassView } from '#components/styled.ts';

/** Shared shape for rendering a capture item. */
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
      ItemSeparatorComponent={() => <View className="h-4" />}
      contentContainerClassName="p-4"
      {...props}
    />
  );
}

function CaptureItemSpread({
  item,
}: LegendListRenderItemProps<CaptureItemData>) {
  return (
    <View>
      <StyledGlassView
        isInteractive
        className="flex-col gap-2 rounded-lg rounded-bl-none px-4 py-3"
      >
        <Text className="text-primary">{item.rawContent}</Text>
        <Text
          className="self-start rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize"
          variant="muted"
        >
          {item.captureType}
        </Text>
      </StyledGlassView>
      <Text className="mt-2 text-xs text-muted-foreground">
        {formatRelativeTime(item.capturedAt)}
      </Text>
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
