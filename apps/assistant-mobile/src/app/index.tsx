import { FlashList } from '@shopify/flash-list';
import { Input } from '@workspace/rn-reusables/components/input';
import { Text } from '@workspace/rn-reusables/components/text';
import React, { useCallback } from 'react';
import { ScrollViewProps, View } from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles, {
  contentContainerStyle,
  invertedContentContainerStyle,
} from '#components/kbd/styles.ts';

const DUMMY_DATA = Array.from({ length: 100 }, (_, index) => ({
  id: index.toString(),
  title: `Item ${index + 1}`,
}));

export default function Index() {
  const { top, bottom } = useSafeAreaInsets();

  const inverted = false;

  const memoList = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardChatScrollView
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={
          inverted ? invertedContentContainerStyle : contentContainerStyle
        }
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        // NOTE: ok this is why the scroll view scrolls down when the input is focused, but why?
        // if I set it to the never the issue doesn't happen
        keyboardLiftBehavior="always"
        {...props}
      />
    ),
    [],
  );

  const content = (
    <>
      <FlashList
        contentContainerStyle={
          inverted ? invertedContentContainerStyle : contentContainerStyle
        }
        contentInset={{ top, bottom }}
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
        }}
        data={DUMMY_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
        renderScrollComponent={memoList}
      />
      <View className="absolute w-full pb-safe">
        <Input />
      </View>
    </>
  );

  return <View style={styles.container}>{content}</View>;
}
