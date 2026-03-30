import { LegendListRef, LegendList } from '@legendapp/list/react-native';
import { BlurView } from '@react-native-community/blur';
import { Icon } from '@workspace/rn-reusables/components/icon';
import { ArrowUp } from 'lucide-react-native';
import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import {
  TextInput,
  LayoutChangeEvent,
  ScrollViewProps,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  KeyboardGestureArea,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import Message from './KeyboardChatScrollView/components/Message.tsx';
import { useChatConfigStore } from './KeyboardChatScrollView/store.ts';
import styles, {
  TEXT_INPUT_HEIGHT,
  MARGIN,
  contentContainerStyle,
} from './KeyboardChatScrollView/styles.ts';
import { VirtualizedListScrollView } from './KeyboardChatScrollView/VirtualizedListScrollView.tsx';

export function KeyboardChatScrollViewPlayground() {
  const legendRef = useRef<LegendListRef>(null);
  const textInputRef = useRef<TextInput>(null);
  const textRef = useRef('');
  const [inputHeight, setInputHeight] = useState(TEXT_INPUT_HEIGHT);
  const extraContentPadding = useSharedValue(0);
  const { inverted, messages, addMessage, mode } = useChatConfigStore();
  const { bottom } = useSafeAreaInsets();

  const stickyViewOffset = useMemo(
    () => ({ opened: bottom - MARGIN }),
    [bottom],
  );

  const [text, setText] = useState('');

  const onInputLayoutChanged = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height;

      // eslint-disable-next-line react-compiler/react-compiler
      extraContentPadding.value = withTiming(
        Math.max(height - TEXT_INPUT_HEIGHT, 0),
        { duration: 250 },
      );
      setInputHeight(height);
    },
    [extraContentPadding],
  );
  const onInput = useCallback((text: string) => {
    textRef.current = text;
  }, []);
  const onSend = useCallback(() => {
    const message = textRef.current.trim();

    if (message === '') {
      return;
    }

    addMessage({ text: message, sender: true });
    textInputRef.current?.clear();
    textRef.current = '';
  }, [addMessage]);

  useEffect(() => {
    legendRef.current?.scrollToOffset({
      animated: true,
      offset: Number.MAX_SAFE_INTEGER,
    });
  }, [messages]);

  const memoList = useCallback(
    (props: ScrollViewProps) => (
      <VirtualizedListScrollView
        {...props}
        extraContentPadding={extraContentPadding}
      />
    ),
    [extraContentPadding],
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <KeyboardGestureArea
        interpolator="ios"
        offset={inputHeight}
        style={styles.container}
        textInputNativeID="chat-input"
      >
        {mode === 'legend' && (
          <LegendList
            ref={legendRef}
            alignItemsAtEnd={inverted}
            contentContainerStyle={contentContainerStyle}
            data={messages}
            initialScrollAtEnd={inverted}
            keyExtractor={(item) => item.text}
            renderItem={({ item }) => <Message {...item} />}
            renderScrollComponent={memoList}
          />
        )}
        <KeyboardStickyView offset={stickyViewOffset} style={styles.composer}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { overflow: 'hidden' },
              styles.input,
            ]}
          >
            <BlurView
              blurAmount={32}
              blurType="light"
              reducedTransparencyFallbackColor="white"
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          <TextInput
            ref={textInputRef}
            multiline
            nativeID="chat-input"
            style={styles.input}
            testID="chat.input"
            value={text}
            onChangeText={(text) => {
              setText(text);
              onInput(text);
            }}
            onLayout={onInputLayoutChanged}
          />
          <TouchableOpacity style={styles.send} onPress={onSend}>
            <Icon as={ArrowUp} />
            {/* <Image source={require('./send.png')} style={styles.icon} /> */}
          </TouchableOpacity>
        </KeyboardStickyView>
      </KeyboardGestureArea>
    </SafeAreaView>
  );
}
