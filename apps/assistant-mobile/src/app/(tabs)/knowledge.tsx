import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import { type Href, Redirect, useRouter } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';

import { DefaultSuspense } from '#components/default-suspense.tsx';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';

export default function KnowledgeTab() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/" />;
  }

  return (
    <DefaultSuspense>
      <KnowledgeScreen />
    </DefaultSuspense>
  );
}

function KnowledgeScreen() {
  const router = useRouter();
  const { data } = useSuspenseQuery(
    convexQuery(api.nodes.getKnowledgeBasePages, {}),
  );

  if (data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-center text-base text-muted-foreground">
          No knowledge items yet
        </Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          Accepted captures will appear here as nodes
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-safe">
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets={true}
        data={data}
        keyExtractor={(item) => item.node._id}
        renderItem={({ item }) => (
          <Pressable
            className="border-b border-border px-4 py-3"
            onPress={() => router.push(`/knowledge/${item.node._id}` as Href)}
          >
            <Text className="text-base font-medium text-foreground">
              {item.node.title}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {item.edgeCount}{' '}
              {item.edgeCount === 1 ? 'connection' : 'connections'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
