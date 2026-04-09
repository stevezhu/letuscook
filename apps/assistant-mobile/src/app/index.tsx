import { FlashList } from '@shopify/flash-list';
import { Input } from '@workspace/rn-reusables/components/input';
import { Text } from '@workspace/rn-reusables/components/text';
import React, { useCallback } from 'react';
import { ScrollViewProps, View } from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles, { MARGIN, TEXT_INPUT_HEIGHT } from '#components/kbd/styles.ts';

const DUMMY_DATA = Array.from({ length: 100 }, (_, index) => ({
  id: index.toString(),
  title: `Item ${index + 1}`,
}));

export default function Index() {
  const { top, bottom } = useSafeAreaInsets();

  const memoList = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardChatScrollView
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{
          paddingBottom: TEXT_INPUT_HEIGHT + MARGIN,
        }}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        // NOTE: ok this is why the scroll view scrolls down when the input is focused, but why?
        // if i set it to never, it doesn't scroll down when the input is focused
        keyboardLiftBehavior="always"
        {...props}
      />
    ),
    [],
  );

  const content = (
    <>
      <FlashList
        contentContainerStyle={{
          paddingBottom: TEXT_INPUT_HEIGHT + MARGIN + bottom,
        }}
        // contentInset={{ top, bottom }}
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
        }}
        data={DUMMY_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
        renderScrollComponent={memoList}
      />
      <View className="absolute w-full pb-safe">
        <Input placeholder="Enter your message..." />
      </View>
    </>
  );

  return <View style={styles.container}>{content}</View>;
}
