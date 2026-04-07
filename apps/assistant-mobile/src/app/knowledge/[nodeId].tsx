import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
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
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

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

// 👀 Needs Verification
function NodeDetailScreen({ nodeId }: { nodeId: Id<'nodes'> }) {
  const router = useRouter();
  const [thought, setThought] = useState('');

  const { data } = useSuspenseQuery(
    convexQuery(api.nodes.getNodeWithEdges, { nodeId }),
  );
  const { data: activityData } = useSuspenseQuery(
    convexQuery(api.nodes.getNodeActivity, { nodeId }),
  );

  const createCaptureMutFn = useConvexMutation(api.captures.createCapture);
  const { mutate: createCapture, isPending } = useMutation({
    mutationFn: createCaptureMutFn,
  });

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground text-base">Node not found</Text>
      </View>
    );
  }

  const { node, outgoing, incoming } = data;

  const handleSubmitThought = () => {
    const trimmed = thought.trim();
    if (!trimmed || isPending) return;

    const rawContent = `@[${node.title}](node:${nodeId}) ${trimmed}`;
    createCapture(
      { rawContent, captureType: 'text' },
      {
        onSuccess: () => {
          setThought('');
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="bg-background flex-1"
        contentContainerClassName="p-4 gap-6"
      >
        <View className="gap-2">
          <Text className="text-foreground text-2xl font-bold">
            {node.title}
          </Text>
          <Text className="text-foreground text-base">{node.content}</Text>
        </View>

        {/* Activity Feed */}
        {activityData && activityData.length > 0 && (
          <View className="gap-2">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
              Activity
            </Text>
            {activityData.map((item) => (
              <ActivityItem key={item.edge._id} item={item} />
            ))}
          </View>
        )}

        {outgoing.length > 0 && (
          <View className="gap-2">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
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
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
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

        {outgoing.length === 0 &&
          incoming.length === 0 &&
          (!activityData || activityData.length === 0) && (
            <Text className="text-muted-foreground text-sm">
              No connections yet
            </Text>
          )}
      </ScrollView>

      {/* Add thought input bar */}
      <View className="border-border bg-background border-t px-4 py-3">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="border-border bg-muted text-foreground flex-1 rounded-lg border px-3 py-2 text-base"
            placeholder="Add a thought..."
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={thought}
            onChangeText={setThought}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSubmitThought}
            editable={!isPending}
          />
          <Pressable
            className="bg-primary rounded-lg px-4 py-2 disabled:opacity-50"
            onPress={handleSubmitThought}
            disabled={!thought.trim() || isPending}
          >
            <Text className="text-primary-foreground text-sm font-medium">
              {isPending ? '...' : 'Send'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

type ActivityItemData = {
  node: {
    _id: Id<'nodes'>;
    title: string;
    content: string;
    createdAt: number;
  };
  capture: {
    _id: Id<'captures'>;
    rawContent: string;
    capturedAt: number;
    captureType: string;
  } | null;
  linkMetadata: {
    domain: string;
    title?: string;
    description?: string;
    faviconUrl?: string;
  } | null;
  edge: {
    _id: string;
    edgeType: string;
    label?: string;
  };
};

// 👀 Needs Verification
function ActivityItem({ item }: { item: ActivityItemData }) {
  const timestamp = item.capture?.capturedAt ?? item.node.createdAt;
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="border-border gap-2 rounded-lg border px-3 py-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-foreground flex-1 text-base font-medium">
          {item.node.title}
        </Text>
        <EdgeTypeBadge edgeType={item.edge.edgeType} />
      </View>

      {item.linkMetadata ? (
        <View className="gap-1">
          <Text className="text-muted-foreground text-xs font-medium">
            {item.linkMetadata.domain}
          </Text>
          {item.linkMetadata.description && (
            <Text className="text-foreground text-sm" numberOfLines={2}>
              {item.linkMetadata.description}
            </Text>
          )}
        </View>
      ) : (
        item.capture && (
          <Text className="text-muted-foreground text-sm" numberOfLines={2}>
            {item.capture.rawContent}
          </Text>
        )
      )}

      <Text className="text-muted-foreground text-xs">{dateStr}</Text>
    </View>
  );
}

function EdgeTypeBadge({ edgeType }: { edgeType: string }) {
  return (
    <View className="bg-secondary rounded-full px-2 py-0.5">
      <Text className="text-secondary-foreground text-xs">{edgeType}</Text>
    </View>
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
      <View className="border-border rounded-lg border px-3 py-2">
        <Text className="text-muted-foreground text-sm italic">
          Private node
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      className="border-border rounded-lg border px-3 py-2"
      onPress={onPress}
    >
      <Text className="text-foreground text-base font-medium">
        {linkedNode.title}
      </Text>
      <View className="mt-1 flex-row gap-2">
        <Text className="text-muted-foreground text-xs">{edgeType}</Text>
        {label && (
          <Text className="text-muted-foreground text-xs">{label}</Text>
        )}
      </View>
    </Pressable>
  );
}
