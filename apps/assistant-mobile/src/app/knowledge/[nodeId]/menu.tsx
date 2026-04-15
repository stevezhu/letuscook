import { Text } from '@workspace/rn-reusables/components/text';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function NodeMenuModal() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();

  return (
    <View className="bg-background m-safe flex-1 p-4">
      <Text className="text-foreground text-base">
        Placeholder menu for node: {nodeId}
      </Text>
    </View>
  );
}
