import { forwardRef, useState, useCallback } from 'react';
import {
  ScrollViewProps,
  LayoutChangeEvent,
  StyleSheet,
  Text,
} from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChatConfigStore } from './store.ts';
import {
  MARGIN,
  invertedContentContainerStyle,
  contentContainerStyle,
} from './styles.ts';

type VirtualizedListScrollViewProps = ScrollViewProps & {
  extraContentPadding?: SharedValue<number>;
};

export type VirtualizedListScrollViewRef = React.ElementRef<
  typeof KeyboardChatScrollView
>;

export const VirtualizedListScrollView = forwardRef<
  VirtualizedListScrollViewRef,
  VirtualizedListScrollViewProps
>(({ onLayout: onLayoutProp, extraContentPadding, ...props }, ref) => {
  const [layoutPass, setLayoutPass] = useState(0);
  const { bottom } = useSafeAreaInsets();
  const chatKitOffset = bottom - MARGIN;

  const { inverted, freeze, mode, keyboardLiftBehavior } = useChatConfigStore();

  // on old arch only FlatList and FlashList supports `inverted` prop
  const isInvertedSupported =
    inverted && (mode === 'flat' || mode === 'flash') ? inverted : false;
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      setLayoutPass((l) => l + 1);
      onLayoutProp?.(e);
    },
    [onLayoutProp],
  );

  return (
    <>
      <KeyboardChatScrollView
        ref={ref}
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={
          inverted ? invertedContentContainerStyle : contentContainerStyle
        }
        contentInsetAdjustmentBehavior="never"
        extraContentPadding={extraContentPadding}
        freeze={freeze}
        inverted={isInvertedSupported}
        keyboardDismissMode="interactive"
        keyboardLiftBehavior={keyboardLiftBehavior}
        offset={chatKitOffset}
        testID="chat.scroll"
        onLayout={onLayout}
        {...props}
      />
      <Text
        style={VirtualizedListScrollViewStyles.counter}
        testID="layout_passes"
      >
        Layout pass: {layoutPass}
      </Text>
    </>
  );
});

const VirtualizedListScrollViewStyles = StyleSheet.create({
  counter: {
    position: 'absolute',
    color: 'white',
    top: 0,
    padding: 12,
    backgroundColor: '#3c3c3c',
  },
});
