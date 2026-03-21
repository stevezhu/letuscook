import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import { FlatList, View } from 'react-native';

import { useAuth } from '#modules/auth/react/auth-provider.tsx';

import type { GuestCaptureWithState } from '../guest-capture-types.ts';
import { useGuestCaptureStore } from '../use-guest-capture-store.ts';

/** Shared shape for rendering a capture item. */
type CaptureItem = {
  id: string;
  rawContent: string;
  capturedAt: number;
  captureType: string;
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CaptureItemRow({ item }: { item: CaptureItem }) {
  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="bg-muted rounded-full px-2 py-0.5">
          <Text className="text-muted-foreground text-xs capitalize">
            {item.captureType}
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs">
          {formatRelativeTime(item.capturedAt)}
        </Text>
      </View>
      <Text className="mt-1.5 text-sm">{item.rawContent}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-muted-foreground text-center text-sm">
        Your captures will appear here
      </Text>
    </View>
  );
}

function guestToItem(c: GuestCaptureWithState): CaptureItem {
  return {
    id: c.id,
    rawContent: c.rawContent,
    capturedAt: c.capturedAt,
    captureType: c.captureType,
  };
}

// 👀 Needs Verification
export function RecentCapturesList() {
  const { user } = useAuth();

  if (user) {
    return <AuthenticatedList />;
  }
  return <GuestList />;
}

function AuthenticatedList() {
  const { data: captures } = useQuery(
    convexQuery(api.captures.getRecentCaptures, { limit: 20 }),
  );

  const items: CaptureItem[] = (captures ?? []).map((c) => ({
    id: c._id,
    rawContent: c.rawContent,
    capturedAt: c.capturedAt,
    captureType: c.captureType,
  }));

  return <CaptureList items={items} />;
}

function GuestList() {
  const { captures } = useGuestCaptureStore();

  const items: CaptureItem[] = [...captures]
    .sort((a, b) => b.capturedAt - a.capturedAt)
    .map(guestToItem);

  return <CaptureList items={items} />;
}

function CaptureList({ items }: { items: CaptureItem[] }) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CaptureItemRow item={item} />}
      inverted
      contentContainerClassName="flex-grow justify-end"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View className="bg-border mx-4 h-px" />}
    />
  );
}
