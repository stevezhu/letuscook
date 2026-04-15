import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';

import { DefaultQueryBoundary } from '#components/boundaries/default-query-boundary.tsx';
import { useSuspenseAuth } from '#modules/auth/react/auth-provider.tsx';

export default function KnowledgeTab() {
  const { user, signIn } = useSuspenseAuth();

  if (!user) {
    return (
      <View className="bg-background flex-1 p-safe">
        <View className="border-border flex-row items-center justify-between border-b px-4 py-2">
          <Text className="text-muted-foreground text-sm">
            Sign in to view your knowledge base
          </Text>
          <Button variant="outline" size="sm" onPress={signIn}>
            <Text className="text-sm">Sign in</Text>
          </Button>
        </View>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-muted-foreground text-center text-base">
            No knowledge items yet
          </Text>
          <Text className="text-muted-foreground mt-2 text-center text-sm">
            Accepted captures will appear here as nodes
          </Text>
        </View>
      </View>
    );
  }

  return (
    <DefaultQueryBoundary>
      <KnowledgeScreen />
    </DefaultQueryBoundary>
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
        <Text className="text-muted-foreground text-center text-base">
          No knowledge items yet
        </Text>
        <Text className="text-muted-foreground mt-2 text-center text-sm">
          Accepted captures will appear here as nodes
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1 p-safe">
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets={true}
        data={data}
        keyExtractor={(item) => item.node._id}
        renderItem={({ item }) => (
          <Pressable
            className="border-border border-b px-4 py-3"
            onPress={() => router.push(`/knowledge/${item.node._id}` as Href)}
          >
            <Text className="text-foreground text-base font-medium">
              {item.node.title}
            </Text>
            <Text className="text-muted-foreground mt-1 text-sm">
              {item.edgeCount}{' '}
              {item.edgeCount === 1 ? 'connection' : 'connections'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
