import React, { forwardRef, useCallback } from 'react';
import type { RefCallback } from 'react';
import { type ScrollViewProps } from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import type { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import { useChatConfigStore } from './store';
import {
  MARGIN,
  contentContainerStyle,
  invertedContentContainerStyle,
} from './styles.ts';

type VirtualizedListScrollViewProps = ScrollViewProps & {
  extraContentPadding?: SharedValue<number>;
  chatScrollViewRef?: { current: VirtualizedListScrollViewRef | null };
};

export type VirtualizedListScrollViewRef = React.ElementRef<
  typeof KeyboardChatScrollView
>;

const VirtualizedListScrollView = forwardRef<
  VirtualizedListScrollViewRef,
  VirtualizedListScrollViewProps
>(({ extraContentPadding, chatScrollViewRef, ...props }, ref) => {
  const setScrollViewRef = useCallback(
    (instance: VirtualizedListScrollViewRef | null) => {
      if (chatScrollViewRef) {
        // eslint-disable-next-line react-compiler/react-compiler
        chatScrollViewRef.current =
          instance as VirtualizedListScrollViewRef | null;
      }
    },
    [chatScrollViewRef],
  );
  const combinedRef: RefCallback<VirtualizedListScrollViewRef> = useCallback(
    (instance) => {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }

      setScrollViewRef(instance);
    },
    [ref, setScrollViewRef],
  );
  const { bottom } = useSafeAreaInsets();
  const chatKitOffset = bottom - MARGIN;

  const inverted = false;
  const keyboardLiftBehavior = 'always';

  return (
    <>
      <KeyboardChatScrollView
        ref={combinedRef}
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={
          inverted ? invertedContentContainerStyle : contentContainerStyle
        }
        contentInsetAdjustmentBehavior="never"
        extraContentPadding={extraContentPadding}
        // freeze={freeze}
        // inverted={isInvertedSupported}
        keyboardDismissMode="interactive"
        keyboardLiftBehavior={keyboardLiftBehavior}
        offset={chatKitOffset}
        testID="chat.scroll"
        {...props}
      />
    </>
  );
});

export default VirtualizedListScrollView;
