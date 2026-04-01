import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import type { Id } from 'assistant-convex/convex/_generated/dataModel';
import {
  type Href,
  Redirect,
  Stack,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { DefaultSuspense } from '#components/default-suspense.tsx';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';

export default function NodeDetailRoute() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: 'Node',
          presentation: 'modal',
        }}
      />
      <DefaultSuspense>
        <NodeDetailScreen nodeId={nodeId as Id<'nodes'>} />
      </DefaultSuspense>
    </View>
  );
}

function NodeDetailScreen({ nodeId }: { nodeId: Id<'nodes'> }) {
  const router = useRouter();
  const { data } = useSuspenseQuery(
    convexQuery(api.nodes.getNodeWithEdges, { nodeId }),
  );

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-base text-muted-foreground">Node not found</Text>
      </View>
    );
  }

  const { node, outgoing, incoming } = data;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-6"
    >
      <View className="gap-2">
        <Text className="text-2xl font-bold text-foreground">{node.title}</Text>
        <Text className="text-base text-foreground">{node.content}</Text>
      </View>

      {outgoing.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-muted-foreground uppercase">
            Outgoing Connections
          </Text>
          {outgoing.map((entry) => (
            <EdgeRow
              key={entry.edge._id}
              linkedNode={entry.linkedNode}
              edgeType={entry.edge.edgeType}
              label={entry.edge.label}
              onPress={() => {
                if (entry.linkedNode?.type === 'node') {
                  router.push(`/knowledge/${entry.linkedNode._id}` as Href);
                }
              }}
            />
          ))}
        </View>
      )}

      {incoming.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-muted-foreground uppercase">
            Incoming Connections
          </Text>
          {incoming.map((entry) => (
            <EdgeRow
              key={entry.edge._id}
              linkedNode={entry.linkedNode}
              edgeType={entry.edge.edgeType}
              label={entry.edge.label}
              onPress={() => {
                if (entry.linkedNode?.type === 'node') {
                  router.push(`/knowledge/${entry.linkedNode._id}` as Href);
                }
              }}
            />
          ))}
        </View>
      )}

      {outgoing.length === 0 && incoming.length === 0 && (
        <Text className="text-sm text-muted-foreground">
          No connections yet
        </Text>
      )}
    </ScrollView>
  );
}

function EdgeRow({
  linkedNode,
  edgeType,
  label,
  onPress,
}: {
  linkedNode:
    | { type: 'node'; _id: string; title: string }
    | { type: 'private' }
    | null;
  edgeType: string;
  label?: string;
  onPress: () => void;
}) {
  if (!linkedNode) return null;

  if (linkedNode.type === 'private') {
    return (
      <View className="rounded-lg border border-border px-3 py-2">
        <Text className="text-sm text-muted-foreground italic">
          Private node
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      className="rounded-lg border border-border px-3 py-2"
      onPress={onPress}
    >
      <Text className="text-base font-medium text-foreground">
        {linkedNode.title}
      </Text>
      <View className="mt-1 flex-row gap-2">
        <Text className="text-xs text-muted-foreground">{edgeType}</Text>
        {label && (
          <Text className="text-xs text-muted-foreground">{label}</Text>
        )}
      </View>
    </Pressable>
  );
}
