import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import type { FlashListRef } from '@shopify/flash-list';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import type { Id } from 'assistant-convex/convex/_generated/dataModel';
import { useIncomingShare } from 'expo-sharing';
import { useSetAtom } from 'jotai';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollViewProps } from 'react-native';
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { DefaultActivityView } from '#components/boundaries/default-activity-view.tsx';
import { DefaultQueryBoundary } from '#components/boundaries/default-query-boundary.tsx';
import { StyledKeyboardStickyView } from '#components/styled.ts';
import { useHasActivated } from '#hooks/use-has-activated.ts';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';
import {
  CaptureComposer,
  CaptureComposerControls,
  CaptureComposerTextInput,
  captureTypeAtom,
  textAtom,
} from '#modules/capture/components/capture-composer.tsx';
import {
  CaptureItemData,
  CaptureList,
  type CaptureListRow,
} from '#modules/capture/components/capture-list.tsx';
import { useCaptureSubmit } from '#modules/capture/use-capture-submit.ts';
import { useGuestCaptureStore } from '#modules/capture/use-guest-capture-store.ts';

export default function CaptureTab() {
  const hasActivated = useHasActivated();
  if (!hasActivated) {
    return <DefaultActivityView />;
  }

  return (
    <DefaultQueryBoundary>
      <CaptureScreen />
    </DefaultQueryBoundary>
  );
}

const TEXT_HEIGHT = 101;

// 👀 Needs Verification
function CaptureScreen() {
  const listRef = useRef<FlashListRef<CaptureListRow>>(null);
  const shouldScrollToEnd = useRef(false);
  const textInputNativeId = useId();
  const [inputHeight, setInputHeight] = useState(TEXT_HEIGHT);
  const { top, bottom } = useSafeAreaInsets();
  const spacing = useCSSVariable('--spacing') as number;
  const textInputMargin = TEXT_HEIGHT + spacing * 4;
  const { submit, isPending } = useCaptureSubmit();
  const { user } = useAuth();
  const { data: serverCaptures } = useQuery(
    convexQuery(api.captures.getRecentCaptures, user ? { limit: 20 } : 'skip'),
  );
  const { captures: guestCaptures, removeGuestCapture } =
    useGuestCaptureStore();

  const { mutate: archiveCapture } = useMutation({
    mutationFn: useConvexMutation(api.captures.archiveCapture),
  });

  const handleArchive = useCallback(
    (id: string) => {
      if (user) {
        archiveCapture({ captureId: id as Id<'captures'> });
      } else {
        removeGuestCapture.mutate(id);
      }
    },
    [user, archiveCapture, removeGuestCapture],
  );

  const items: CaptureItemData[] = useMemo(() => {
    if (user) {
      return (serverCaptures?.reverse() ?? []).map((c) => ({
        id: c._id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
    }
    return (
      guestCaptures
        .slice()
        // TODO: verify that this is correct
        .sort((a, b) => a.capturedAt - b.capturedAt)
        .map((c) => ({
          id: c.id,
          rawContent: c.rawContent,
          capturedAt: c.capturedAt,
          captureType: c.captureType,
        }))
    );
  }, [user, serverCaptures, guestCaptures]);

  useEffect(() => {
    if (shouldScrollToEnd.current) {
      shouldScrollToEnd.current = false;
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [items]);

  // Use blankSpace for safe area bottom instead of contentInset.bottom
  // to avoid double-counting when the keyboard covers the safe area.
  const blankSpace = useSharedValue(bottom);
  useEffect(() => {
    blankSpace.value = bottom;
  }, [bottom, blankSpace]);

  const extraContentPadding = useSharedValue(0);

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardChatScrollView
        keyboardLiftBehavior="always"
        extraContentPadding={extraContentPadding}
        blankSpace={blankSpace}
        {...props}
      />
    ),
    [extraContentPadding, blankSpace],
  );

  // TODO: might be able to be removed
  const hasActivated = useHasActivated();
  if (!hasActivated) {
    return <DefaultActivityView />;
  }

  return (
    <KeyboardGestureArea
      interpolator="ios"
      offset={inputHeight}
      style={{ flex: 1, justifyContent: 'flex-end' }}
      textInputNativeID={textInputNativeId}
    >
      <CaptureList
        ref={listRef}
        data={items}
        onArchive={handleArchive}
        contentInset={{ top }}
        scrollIndicatorInsets={{ bottom: spacing * 4 }}
        contentContainerStyle={{ paddingBottom: textInputMargin }}
        renderScrollComponent={renderScrollComponent}
      />
      <StyledKeyboardStickyView
        className="absolute w-full px-2"
        offset={{ opened: bottom }}
        style={{
          minHeight: TEXT_HEIGHT,
          marginBottom: bottom + spacing * 2,
        }}
      >
        <CaptureComposer
          isPending={isPending}
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            extraContentPadding.value = withTiming(
              Math.max(height - spacing * 4, 0),
              {
                duration: 0,
              },
            );
            setInputHeight(height);
          }}
        >
          <CaptureComposerSharedContent />
          <CaptureComposerTextInput />
          <CaptureComposerControls
            onSubmit={async ({ value, captureType }) => {
              await submit(value, captureType);
              shouldScrollToEnd.current = true;
            }}
          />
        </CaptureComposer>
      </StyledKeyboardStickyView>
    </KeyboardGestureArea>
  );
}

/**
 * Reads incoming share payloads and prefills the capture composer. Must be
 * rendered inside `<CaptureComposer>` (within its Jotai Provider scope).
 */
function CaptureComposerSharedContent() {
  const { resolvedSharedPayloads, clearSharedPayloads } = useIncomingShare();
  const setText = useSetAtom(textAtom);
  const setCaptureType = useSetAtom(captureTypeAtom);

  useEffect(() => {
    if (resolvedSharedPayloads.length === 0) return;

    const payload = resolvedSharedPayloads[0];
    const content = payload?.contentUri ?? '';
    if (!content) return;

    setText(content);
    if (content.startsWith('http://') || content.startsWith('https://')) {
      setCaptureType('link');
    }
    clearSharedPayloads();
  }, [resolvedSharedPayloads, setText, setCaptureType, clearSharedPayloads]);

  return null;
}
