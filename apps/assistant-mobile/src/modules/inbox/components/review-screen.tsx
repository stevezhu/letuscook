import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import type { Id } from 'assistant-convex/convex/_generated/dataModel';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { type CaptureState, isStaleCapture } from '../inbox-types.ts';
import { StatePill } from './state-pill.tsx';

export function ReviewScreen({ captureId }: { captureId: Id<'captures'> }) {
  const router = useRouter();

  const { data: capture, isLoading: captureLoading } = useQuery(
    convexQuery(api.captures.getCapture, { captureId }),
  );

  const { data: suggestionData } = useQuery(
    convexQuery(api.suggestions.getSuggestion, { captureId }),
  );

  const { data: suggestedNode } = useQuery({
    ...convexQuery(
      api.nodes.getNodeWithEdges,
      suggestionData?.suggestion?.suggestedNodeId
        ? { nodeId: suggestionData.suggestion.suggestedNodeId }
        : 'skip',
    ),
    enabled: !!suggestionData?.suggestion?.suggestedNodeId,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (capture) {
      setContent(capture.rawContent);
      // Prefill title from suggestion's node title if available
      if (suggestedNode?.node?.title) {
        setTitle(suggestedNode.node.title);
        setInitialized(true);
      } else if (
        capture.captureState !== 'ready' &&
        capture.captureState !== 'processing'
      ) {
        // No suggestion coming, initialize with empty title
        setInitialized(true);
      }
    }
  }, [capture, suggestedNode, initialized]);

  const { mutate: acceptSuggestion, isPending: acceptPending } = useMutation({
    mutationFn: useConvexMutation(api.captures.acceptSuggestion),
    onSuccess: () => router.back(),
  });

  const { mutate: organizeCapture, isPending: organizePending } = useMutation({
    mutationFn: useConvexMutation(api.captures.organizeCapture),
    onSuccess: () => router.back(),
  });

  const { mutate: archiveCapture } = useMutation({
    mutationFn: useConvexMutation(api.captures.archiveCapture),
    onSuccess: () => router.back(),
  });

  const { mutate: retryProcessing } = useMutation({
    mutationFn: useConvexMutation(api.captures.retryProcessing),
  });

  const { mutate: discardCapture } = useMutation({
    mutationFn: useConvexMutation(api.captures.discardCapture),
    onSuccess: () => router.back(),
  });

  const isSaving = acceptPending || organizePending;

  const handleSave = useCallback(() => {
    if (!capture) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title required', 'Please enter a title for this item.');
      return;
    }

    // If suggestion exists and content unchanged, accept the suggestion
    if (
      suggestionData?.suggestion &&
      suggestionData.suggestion.status === 'pending' &&
      content === capture.rawContent
    ) {
      acceptSuggestion({
        captureId,
        suggestionId: suggestionData.suggestion._id,
      });
    } else {
      organizeCapture({ captureId, nodeTitle: trimmedTitle });
    }
  }, [
    capture,
    title,
    content,
    suggestionData,
    captureId,
    acceptSuggestion,
    organizeCapture,
  ]);

  const handleArchive = useCallback(() => {
    Alert.alert('Archive', 'Archive this capture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => archiveCapture({ captureId }),
      },
    ]);
  }, [captureId, archiveCapture]);

  if (captureLoading || !capture) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const links =
    suggestedNode?.outgoing
      ?.filter((e) => e.linkedNode && e.linkedNode.type === 'node')
      .map((e) => ({
        id: e.edge._id,
        title: e.linkedNode?.type === 'node' ? e.linkedNode.title : 'Unknown',
        suggested: e.edge.source === 'processor',
      })) ?? [];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-6"
        keyboardDismissMode="interactive"
      >
        <View className="flex-row items-center gap-2">
          <StatePill state={capture.captureState as CaptureState} />
          {suggestionData?.suggestor && (
            <Text className="text-xs text-muted-foreground">
              Suggested by {suggestionData.suggestor.displayName ?? 'CookBot'}
            </Text>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-xs font-semibold text-muted-foreground uppercase">
            Title
          </Text>
          <TextInput
            className="rounded-lg border border-border px-3 py-2 text-base text-foreground"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title..."
            placeholderTextColor="#999"
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-semibold text-muted-foreground uppercase">
            Content
          </Text>
          <TextInput
            className="min-h-[120px] rounded-lg border border-border px-3 py-2 text-base text-foreground"
            value={content}
            onChangeText={setContent}
            placeholder="Content..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>

        {links.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase">
              Links
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {links.map((link) => (
                <View
                  key={link.id}
                  className="flex-row items-center gap-1 rounded-full bg-purple-100 px-3 py-1"
                >
                  <Text className="text-sm text-purple-800">@{link.title}</Text>
                  {link.suggested && (
                    <Text className="text-xs text-purple-400">Suggested</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {(capture.captureState === 'failed' ||
          isStaleCapture(capture.captureState, capture.updatedAt)) && (
          <View className="gap-2">
            <Button
              variant="outline"
              onPress={() => retryProcessing({ captureId })}
            >
              <Text>Retry processing</Text>
            </Button>
            <Button
              variant="outline"
              onPress={() =>
                Alert.alert(
                  'Discard capture',
                  'This capture will be archived. You cannot undo this.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Discard',
                      style: 'destructive',
                      onPress: () => discardCapture({ captureId }),
                    },
                  ],
                )
              }
            >
              <Text>Discard</Text>
            </Button>
          </View>
        )}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-border p-4 pb-safe">
        <Button
          className="flex-1"
          variant="secondary"
          onPress={() => router.back()}
        >
          <Text>Discard</Text>
        </Button>
        <Pressable onPress={handleArchive} className="justify-center px-3">
          <Text className="text-sm text-muted-foreground">Archive</Text>
        </Pressable>
        <Button className="flex-1" onPress={handleSave} disabled={isSaving}>
          <Text className="text-primary-foreground">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
