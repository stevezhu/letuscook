import {
  LegendList,
  LegendListProps,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import { Text } from '@workspace/rn-reusables/components/text';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { CaptureListContextMenu } from './capture-list-context-menu.ios.tsx';

/**
 * Shared shape for rendering a capture item.
 */
export type CaptureItemData = {
  id: string;
  rawContent: string;
  capturedAt: number;
  captureType: string;
};

type TimeHeader = { type: 'header'; id: string; label: string };
type CaptureRow = { type: 'item' } & CaptureItemData;
type ListRow = TimeHeader | CaptureRow;

// 👀 Needs Verification
export function CaptureList({
  data,
  onArchive,
  ...props
}: Omit<LegendListProps<ListRow>, 'data'> & {
  data: CaptureItemData[] | undefined;
  onArchive: (id: string) => void;
}) {
  const rows = useMemo(() => groupByTime(data ?? []), [data]);

  const renderItem = useCallback(
    (renderProps: LegendListRenderItemProps<ListRow>) => {
      return (
        <ListRowItem
          item={renderProps.item}
          onArchive={() => onArchive(renderProps.item.id)}
        />
      );
    },
    [onArchive],
  );

  return (
    <LegendList<ListRow>
      data={rows}
      renderItem={renderItem}
      keyExtractor={(row) => row.id}
      recycleItems={false}
      ItemSeparatorComponent={() => <View className="h-2" />}
      contentContainerClassName="px-3 py-2"
      {...props}
    />
  );
}

function ListRowItem({
  item,
  onArchive,
}: {
  item: ListRow;
  onArchive: () => void;
}) {
  if (item.type === 'header') {
    return (
      <View className="items-center py-1">
        <Text className="text-[10px]" variant="muted">
          {item.label}
        </Text>
      </View>
    );
  }

  return (
    <View className="max-w-[85%] flex-row items-end gap-2 self-end">
      <Text className="pb-0.5 text-[10px] capitalize" variant="muted">
        {item.captureType}
      </Text>
      <CaptureListContextMenu
        onCopy={() => {
          void Clipboard.setStringAsync(item.rawContent);
        }}
        onArchive={onArchive}
      >
        <View className="rounded-lg rounded-br-xs bg-muted px-3 py-2">
          <Text className="text-primary">{item.rawContent}</Text>
        </View>
      </CaptureListContextMenu>
    </View>
  );
}

function groupByTime(items: CaptureItemData[]): ListRow[] {
  const rows: ListRow[] = [];
  let lastLabel: string | undefined;

  for (const item of items) {
    const label = formatRelativeTime(item.capturedAt);
    if (label !== lastLabel) {
      rows.push({ type: 'header', id: `header-${label}`, label });
      lastLabel = label;
    }
    rows.push({ type: 'item', ...item });
  }

  return rows;
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
