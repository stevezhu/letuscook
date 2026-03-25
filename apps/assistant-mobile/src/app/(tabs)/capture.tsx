import { LegendList, LegendListRef } from '@legendapp/list';
import { BlurView } from '@react-native-community/blur';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Input } from '@workspace/rn-reusables/components/input';
import { Text } from '@workspace/rn-reusables/components/text';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { GlassView } from 'expo-glass-effect';
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
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
  KeyboardChatScrollView,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { ChatView } from '#components/ChatView/index.tsx';
import { DefaultSuspense } from '#components/default-suspense.tsx';
import Message from '#components/KeyboardChatScrollView/components/Message.tsx';
import { useChatConfigStore } from '#components/KeyboardChatScrollView/store.ts';
import styles, {
  TEXT_INPUT_HEIGHT,
  contentContainerStyle,
  invertedContentContainerStyle,
} from '#components/KeyboardChatScrollView/styles.ts';
import { KeyboardStickyView } from '#components/KeyboardStickyView.tsx';
import { CaptureInput } from '#modules/capture/components/capture-input.tsx';
import { RecentCapturesList } from '#modules/capture/components/recent-captures-list.tsx';

export default function CaptureTab() {
  return (
    <DefaultSuspense>
      <CaptureScreen />
    </DefaultSuspense>
  );
}

const StyledSafeAreaView = withUniwind(SafeAreaView);
const StyledKeyboardStickyView = withUniwind(KeyboardStickyView);

const MARGIN = 8;

// 👀 Needs Verification
function CaptureScreen() {
  const textInputNativeId = useId();
  const { inverted, messages, reversedMessages, addMessage, mode } =
    useChatConfigStore();
  const legendRef = useRef<LegendListRef>(null);
  const textInputRef = useRef<TextInput>(null);
  const textRef = useRef('');
  const [inputHeight, setInputHeight] = useState(TEXT_INPUT_HEIGHT);

  const { bottom } = useSafeAreaInsets();
  const stickyViewOffset = useMemo(() => ({ opened: bottom }), [bottom]);
  const extraContentPadding = useSharedValue(0);

  useEffect(() => {
    legendRef.current?.scrollToOffset({
      animated: true,
      offset: Number.MAX_SAFE_INTEGER,
    });
  }, [messages]);

  const showBgColors = true;

  return (
    <KeyboardGestureArea
      interpolator="ios"
      // offset={inputHeight}
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
      <LegendList
        ref={legendRef}
        alignItemsAtEnd={inverted}
        contentContainerStyle={{
          paddingBottom: TEXT_INPUT_HEIGHT, // to offset the input height since the input is absolutely positioned
          backgroundColor: showBgColors ? 'red' : undefined,
        }}
        data={messages}
        // initialScrollAtEnd={inverted}
        initialScrollIndex={inverted ? messages.length - 1 : 0}
        keyExtractor={(item) => item.text}
        renderItem={({ item }) => <Message {...item} />}
        renderScrollComponent={({ children, ...props }: ScrollViewProps) => (
          <KeyboardChatScrollView
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={invertedContentContainerStyle}
            contentInsetAdjustmentBehavior="never"
            extraContentPadding={extraContentPadding}
            freeze={false}
            inverted
            keyboardDismissMode="interactive"
            keyboardLiftBehavior="always"
            offset={bottom}
            {...props}
          >
            <StyledSafeAreaView
              className={cn(
                'flex-1 justify-end',
                showBgColors && 'bg-blue-500',
              )}
              // style={{ paddingBottom: TEXT_INPUT_HEIGHT }}
            >
              {children}
            </StyledSafeAreaView>
          </KeyboardChatScrollView>
        )}
      />
      <StyledKeyboardStickyView
        // this somehow moves the input down so that there isn't a blank space below the input when the keyboard is open
        // which offsets the bottom padding from the safe area for the tabs bar
        offset={stickyViewOffset}
        className="absolute w-full"
        style={{
          minHeight: TEXT_INPUT_HEIGHT,
          marginBottom: bottom + MARGIN,
        }}
      >
        <CaptureInput />
        {/* <View
          style={[
            StyleSheet.absoluteFill,
            { overflow: 'hidden' },
            styles.input,
          ]}
        >
          <BlurView
            blurAmount={32}
            blurType="light"
            reducedTransparencyFallbackColor="white"
            style={StyleSheet.absoluteFill}
          />
        </View>
        <CaptureInput /> */}
        {/* <TextInput
          ref={textInputRef}
          multiline
          nativeID={textInputNativeId}
          style={styles.input}
          onChangeText={(text: string) => {
            textRef.current = text;
          }}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;

            extraContentPadding.value = withTiming(
              Math.max(height - TEXT_INPUT_HEIGHT, 0),
              { duration: 250 },
            );
            setInputHeight(height);
          }}
        />
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: MARGIN,
            right: MARGIN * 2,
            padding: MARGIN,
            backgroundColor: 'white',
            height: 24,
            width: 24,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 99,
          }}
          onPress={() => {
            const message = textRef.current.trim();

            if (message === '') {
              return;
            }

            // addMessage({ text: message, sender: true });
            textInputRef.current?.clear();
            textRef.current = '';
          }}
        >
          <ArrowUp size={20} />
        </TouchableOpacity> */}
      </StyledKeyboardStickyView>
    </KeyboardGestureArea>
  );
}
