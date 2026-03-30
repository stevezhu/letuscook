import { LegendList, LegendListRef } from '@legendapp/list/react-native';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { ArrowUp } from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollViewProps,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useCSSVariable, withUniwind } from 'uniwind';

import { DefaultSuspense } from '#components/default-suspense.tsx';
import { KeyboardAvoidingExample } from '#components/KeyboardAvoidingExample.tsx';
import Message from '#components/KeyboardChatScrollView/components/Message.tsx';
import { useChatConfigStore } from '#components/KeyboardChatScrollView/store.ts';
import styles, {
  TEXT_INPUT_HEIGHT,
  invertedContentContainerStyle,
} from '#components/KeyboardChatScrollView/styles.ts';
import { VirtualizedListScrollView } from '#components/KeyboardChatScrollView/VirtualizedListScrollView.tsx';
import { KeyboardStickyView } from '#components/KeyboardStickyView.tsx';
import {
  StyledKeyboardStickyView,
  StyledSafeAreaView,
} from '#components/styled.ts';
import {
  CaptureComposer,
  CaptureComposerControls,
  CaptureComposerTextInput,
} from '#modules/capture/components/capture-composer.tsx';
import { CaptureList } from '#modules/capture/components/capture-list.tsx';

export default function CaptureTab() {
  return (
    <DefaultSuspense>
      <CaptureScreen />
    </DefaultSuspense>
  );
}

const MARGIN = 8;

const TEXT_HEIGHT = 101;

// 👀 Needs Verification
function CaptureScreen() {
  const textInputNativeId = useId();
  const { inverted, messages, reversedMessages, addMessage, mode } =
    useChatConfigStore();
  const legendRef = useRef<LegendListRef>(null);
  const textInputRef = useRef<TextInput>(null);
  const textRef = useRef('');
  const [inputHeight, setInputHeight] = useState(TEXT_HEIGHT);

  const { bottom } = useSafeAreaInsets();
  const extraContentPadding = useSharedValue(0);

  const spacing = useCSSVariable('--spacing') as number;
  // console.log(extraContentPadding.get());

  useEffect(() => {
    legendRef.current?.scrollToOffset({
      animated: true,
      offset: Number.MAX_SAFE_INTEGER,
    });
  }, [messages]);

  const showBgColors = true;

  console.log('rerender');

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    console.log('extraContentPadding', extraContentPadding.get());
    return { top: extraContentPadding.get() };
  });

  const memoList = useCallback(
    ({ children, ...props }: ScrollViewProps) => (
      <KeyboardChatScrollView
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={invertedContentContainerStyle}
        contentInsetAdjustmentBehavior="never"
        extraContentPadding={extraContentPadding}
        inverted={false}
        freeze={false}
        keyboardDismissMode="interactive"
        keyboardLiftBehavior="always"
        offset={bottom}
        {...props}
      >
        <StyledSafeAreaView
          className={cn('flex-1 justify-end', showBgColors && 'bg-blue-500')}
          // style={{ paddingBottom: TEXT_INPUT_HEIGHT }}
        >
          {children}
        </StyledSafeAreaView>
      </KeyboardChatScrollView>
    ),
    [extraContentPadding, bottom, showBgColors],
  );

  return (
    <KeyboardGestureArea
      interpolator="ios"
      offset={inputHeight}
      style={[
        styles.container,
        {
          backgroundColor: showBgColors ? 'green' : undefined,
        },
      ]}
      // style={{ marginBottom: MARGIN }} // XXX: this is what causes a white space at the bottom
      // className={cn('flex-1 justify-end', showBgColors && 'bg-green-500')}
      textInputNativeID={textInputNativeId}
    >
      <CaptureList
        items={[
          {
            id: '1',
            rawContent: 'Brainstorming for the new landing page design',
            capturedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            captureType: 'other',
          },
          {
            id: '2',
            rawContent: 'https://reactnative.dev/docs/intro-react-native',
            capturedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            captureType: 'link',
          },
          {
            id: '3',
            rawContent: 'Buy milk and eggs on the way home',
            capturedAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
            captureType: 'text',
          },
          {
            id: '4',
            rawContent: 'Another capture',
            capturedAt: Date.now() - 1000, // 1 day ago
            captureType: 'other',
          },
        ]}
      />
      {/* <LegendList
        ref={legendRef}
        alignItemsAtEnd
        contentContainerStyle={{
          paddingBottom: TEXT_HEIGHT + spacing * 2, // to offset the input height since the input is absolutely positioned
          backgroundColor: showBgColors ? 'red' : undefined,
        }}
        data={messages}
        initialScrollAtEnd
        // initialScrollIndex={messages.length - 1}
        estimatedItemSize={50}
        maintainScrollAtEnd
        maintainScrollAtEndThreshold={0.1}
        // initialScrollIndex={inverted ? messages.length - 1 : 0}
        keyExtractor={(item) => item.text}
        renderItem={({ item }) => <Message {...item} />}
        renderScrollComponent={memoList}
      /> */}
      <Animated.View className="absolute w-full px-2" style={animatedStyle}>
        <Animated.Text>test</Animated.Text>
      </Animated.View>
      <StyledKeyboardStickyView
        className="absolute w-full px-2"
        // this moves the input down so that there isn't a blank space below the input when the keyboard is open
        offset={{ opened: bottom }}
        style={{
          minHeight: TEXT_HEIGHT,
          marginBottom: bottom + spacing * 2,
        }}
      >
        <CaptureComposer
          isPending={false}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            console.log('ON LAYOUT', height);

            extraContentPadding.value = withTiming(
              Math.max(height - TEXT_HEIGHT, 0),
              { duration: 0 }, // 250
            );
            setInputHeight(height);
          }}
        >
          <CaptureComposerTextInput />
          <CaptureComposerControls onSubmit={async () => {}} />
        </CaptureComposer>
        {/* <CaptureInputRoot /> */}
      </StyledKeyboardStickyView>
    </KeyboardGestureArea>
  );
}

// function CaptureScreen() {
//   return <KeyboardAvoidingExample />;
// }
