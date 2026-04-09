import { FlashList } from '@shopify/flash-list';
import { Text } from '@workspace/rn-reusables/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DefaultActivityView } from '#components/boundaries/default-activity-view.tsx';
import { useHasActivated } from '#hooks/use-has-activated.ts';

const DUMMY_DATA = Array.from({ length: 100 }, (_, index) => ({
  id: index.toString(),
  title: `Item ${index + 1}`,
}));

export default function CaptureTab() {
  const { top, bottom } = useSafeAreaInsets();
  const hasActivated = useHasActivated();
  if (!hasActivated) {
    return <DefaultActivityView />;
  }

  return (
    <>
      <FlashList
        contentInset={{ top, bottom }}
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
      />
    </>
  );
}
