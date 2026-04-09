import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { ParamListBase } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Text } from '@workspace/rn-reusables/components/text';
import { api } from 'assistant-convex/convex/_generated/api';
import type { Id } from 'assistant-convex/convex/_generated/dataModel';
import { useFocusEffect, useNavigation } from 'expo-router';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Button, ScrollView, View } from 'react-native';
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { DefaultActivityView } from '#components/boundaries/default-activity-view.tsx';
import { DefaultQueryBoundary } from '#components/boundaries/default-query-boundary.tsx';
import {
  StyledKeyboardStickyView,
  StyledSafeAreaView,
} from '#components/styled.ts';
import { useHasActivated } from '#hooks/use-has-activated.ts';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';
import {
  CaptureComposer,
  CaptureComposerControls,
  CaptureComposerTextInput,
} from '#modules/capture/components/capture-composer.tsx';
import {
  CaptureItemData,
  CaptureList,
  FlashListCaptureList,
} from '#modules/capture/components/capture-list.tsx';
import { useCaptureSubmit } from '#modules/capture/use-capture-submit.ts';
import { useGuestCaptureStore } from '#modules/capture/use-guest-capture-store.ts';

/**
 * This is working perfectly
 */
// const DUMMY_DATA = Array.from({ length: 100 }, (_, index) => ({
//   id: index.toString(),
//   title: `Item ${index + 1}`,
// }));

// export default function CaptureTab() {
//   const { top, bottom } = useSafeAreaInsets();

//   const hasActivated = useHasActivated();
//   if (!hasActivated) {
//     return <DefaultActivityView />;
//   }

//   return (
//     <DefaultQueryBoundary>
//       <FlashList
//         contentInset={{ top, bottom }}
//         maintainVisibleContentPosition={{
//           startRenderingFromBottom: true,
//         }}
//         data={DUMMY_DATA}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => <Text>{item.title}</Text>}
//         onStartReached={() => {
//           console.log('onStartReached');
//         }}
//         onEndReached={() => {
//           console.log('onEndReached');
//         }}
//       />
//     </DefaultQueryBoundary>
//   );
// }

// *********************

const DUMMY_DATA = Array.from({ length: 100 }, (_, index) => ({
  id: index.toString(),
  title: `Item ${index + 1}`,
}));

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
  const textInputNativeId = useId();
  const [inputHeight, setInputHeight] = useState(TEXT_HEIGHT);
  const { top, bottom } = useSafeAreaInsets();
  const spacing = useCSSVariable('--spacing') as number;
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
      return (serverCaptures ?? []).map((c) => ({
        id: c._id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
    }
    return [...guestCaptures]
      .sort((a, b) => b.capturedAt - a.capturedAt)
      .map((c) => ({
        id: c.id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
  }, [user, serverCaptures, guestCaptures]);

  return (
    <KeyboardGestureArea
      interpolator="ios"
      offset={inputHeight}
      style={{ flex: 1, justifyContent: 'flex-end' }}
      textInputNativeID={textInputNativeId}
    >
      <FlashList
        contentInset={{ top, bottom: bottom + TEXT_HEIGHT + spacing * 2 }}
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
        }}
        data={DUMMY_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
        onStartReached={() => {
          console.log('onStartReached');
        }}
        onEndReached={() => {
          console.log('onEndReached');
        }}
        // renderScrollComponent={(props) => <KeyboardChatScrollView {...props} />}
        // contentContainerStyle={{
        //   paddingBottom: TEXT_HEIGHT + spacing * 2,
        // }}
      />
      {/* <CaptureList
        data={items}
        onArchive={handleArchive}
        estimatedItemSize={60}
        contentContainerStyle={{
          paddingBottom: TEXT_HEIGHT + spacing * 2,
        }}
      /> */}
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
            setInputHeight(e.nativeEvent.layout.height);
          }}
        >
          <CaptureComposerTextInput />
          <CaptureComposerControls
            onSubmit={async ({ value, captureType }) => {
              await submit(value, captureType);
            }}
          />
        </CaptureComposer>
      </StyledKeyboardStickyView>
    </KeyboardGestureArea>
  );
}

function CaptureListWrap() {
  const { user } = useAuth();
  const { data: serverCaptures } = useQuery(
    convexQuery(api.captures.getRecentCaptures, user ? { limit: 20 } : 'skip'),
  );
  const { captures: guestCaptures, removeGuestCapture } =
    useGuestCaptureStore();

  const items: CaptureItemData[] = useMemo(() => {
    if (user) {
      return (serverCaptures ?? []).map((c) => ({
        id: c._id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
    }
    return [...guestCaptures]
      .sort((a, b) => b.capturedAt - a.capturedAt)
      .map((c) => ({
        id: c.id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
  }, [user, serverCaptures, guestCaptures]);
  console.log(items);

  return (
    <StyledSafeAreaView className="flex-1 bg-red-500">
      <FlashListCaptureList data={items} onArchive={() => {}} />
    </StyledSafeAreaView>
  );
}
