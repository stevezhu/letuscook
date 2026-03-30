import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { SectionList, ActivityIndicator, View } from 'react-native';

import { DefaultSuspense } from '#components/default-suspense.tsx';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';
import { InboxItemRow } from '#modules/inbox/components/inbox-item-row.tsx';
import { useInboxCaptures } from '#modules/inbox/use-inbox-captures.ts';

export default function InboxTab() {
  return (
    <DefaultSuspense>
      <InboxScreen />
    </DefaultSuspense>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="bg-muted px-4 py-2">
      <Text className="text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-center text-base text-muted-foreground">
        No items in your inbox
      </Text>
      <Text className="mt-2 text-center text-sm text-muted-foreground">
        Captured items will appear here for review
      </Text>
    </View>
  );
}

export function InboxScreen() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const { sections, items, isLoading } = useInboxCaptures();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { mutate: acceptSuggestion, isPending: acceptPending } = useMutation({
    mutationFn: useConvexMutation(api.captures.acceptSuggestion),
    onSettled: () => setPendingId(null),
  });

  const { mutate: rejectSuggestion, isPending: rejectPending } = useMutation({
    mutationFn: useConvexMutation(api.captures.rejectSuggestion),
    onSettled: () => setPendingId(null),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-safe">
      {!user && (
        <View className="flex-row items-center justify-between border-b border-border px-4 py-2">
          <Text className="text-sm text-muted-foreground">
            Sign in to sync your captures
          </Text>
          <Button variant="outline" size="sm" onPress={signIn}>
            <Text className="text-sm">Sign in</Text>
          </Button>
        </View>
      )}

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <SectionList
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustsScrollIndicatorInsets={true}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          renderItem={({ item }) => (
            <InboxItemRow
              item={item}
              onPress={() => {
                if (!item.captureId) return;
                router.push(`/review/${item.captureId}` as Href);
              }}
              onAccept={
                item.captureState === 'ready' && item.suggestion
                  ? () => {
                      if (!item.captureId || !item.suggestion) return;
                      setPendingId(item.id);
                      acceptSuggestion({
                        captureId: item.captureId,
                        suggestionId: item.suggestion._id,
                      });
                    }
                  : undefined
              }
              onReject={
                item.captureState === 'ready' && item.suggestion
                  ? () => {
                      if (!item.captureId || !item.suggestion) return;
                      setPendingId(item.id);
                      rejectSuggestion({
                        captureId: item.captureId,
                        suggestionId: item.suggestion._id,
                      });
                    }
                  : undefined
              }
              acceptPending={pendingId === item.id && acceptPending}
              rejectPending={pendingId === item.id && rejectPending}
            />
          )}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}
