import { Text } from '@workspace/rn-reusables/components/text';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function NodeMenuModal() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();

  return (
    <View className="m-safe flex-1 bg-background p-4">
      <Text className="text-base text-foreground">
        Placeholder menu for node: {nodeId}
      </Text>
    </View>
  );
}
