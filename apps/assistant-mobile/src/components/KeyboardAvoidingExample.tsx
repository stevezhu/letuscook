import { KeyboardAvoidingLegendList } from '@legendapp/list/keyboard';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { useState } from 'react';
import { Button, TextInput, View } from 'react-native';
import {
  KeyboardGestureArea,
  KeyboardProvider,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyledKeyboardStickyView } from '#components/styled.ts';
import {
  CaptureComposer,
  CaptureComposerControls,
  CaptureComposerTextInput,
} from '#modules/capture/components/capture-composer.tsx';

import Message from './KeyboardChatScrollView/components/Message';
import { useChatConfigStore } from './KeyboardChatScrollView/store';

const defaultChatMessages = [
  {
    id: '1',
    sender: 'user',
    text: 'Hello',
    timeStamp: Date.now(),
  },
];

export function KeyboardAvoidingExample() {
  const [inputText, setInputText] = useState('');
  const insets = useSafeAreaInsets();
  const sendMessage = () => {
    // const text = inputText || 'Empty message';
    // if (text.trim()) {
    //   setMessages((messagesNew) => [
    //     ...messagesNew,
    //     {
    //       id: String(idCounter++),
    //       sender: 'user',
    //       text: text,
    //       timeStamp: Date.now(),
    //     },
    //   ]);
    //   setInputText('');
    // }
    addMessage({ text: inputText, sender: true });
    setInputText('');
  };
  const handleScroll = useAnimatedScrollHandler({
    onScroll: (_event) => {},
  });

  const { inverted, messages, reversedMessages, addMessage, mode } =
    useChatConfigStore();
  return (
    // <KeyboardProvider style={{ flex: 1 }}>
    <View
      style={[
        // styles.container,
        { flex: 1 },
        // { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <KeyboardGestureArea
        interpolator="ios"
        offset={60}
        // style={styles.container}
      >
        <KeyboardAvoidingLegendList
          alignItemsAtEnd
          // contentContainerStyle={styles.contentContainer}
          data={messages}
          estimatedItemSize={80}
          initialScrollAtEnd
          keyExtractor={(item) => item.text}
          maintainScrollAtEnd
          maintainVisibleContentPosition
          onScroll={handleScroll}
          renderItem={({ item }) => <Message {...item} />}
          safeAreaInsetBottom={insets.bottom}
          // style={styles.list}
          // style={{ overflow: 'visible' }}
        />
      </KeyboardGestureArea>
      <StyledKeyboardStickyView
        className={cn(
          'px-2',

          // 'absolute w-full'
        )}
        // style={{
        //   marginBottom: insets.bottom,
        // }}
        offset={{ closed: 0, opened: insets.bottom }}
      >
        <CaptureComposer
          isPending={false}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            console.log('ON LAYOUT', height);

            // extraContentPadding.value = withTiming(
            //   Math.max(height - TEXT_HEIGHT, 0),
            //   { duration: 250 }, // 250
            // );
            // setInputHeight(height);
          }}
        >
          <CaptureComposerTextInput />
          <CaptureComposerControls onSubmit={async () => {}} />
        </CaptureComposer>
        {/* <View
          // style={styles.inputContainer}
          >
            <TextInput
              onChangeText={setInputText}
              placeholder="Type a message"
              style={{ marginBottom: insets.bottom }}
              // style={styles.input}
              value={inputText}
            />
            <Button onPress={sendMessage} title="Send" />
          </View> */}
      </StyledKeyboardStickyView>
    </View>
    // </KeyboardProvider>
  );
}
