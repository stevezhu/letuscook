import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

export default function UiTestScreen() {
  return (
    <View className="flex-1 justify-center items-center gap-4 p-6 bg-background">
      <Text variant="h1">UI Test Screen</Text>

      <Button variant="default">
        <Text>Default Button</Text>
      </Button>

      <Button variant="secondary">
        <Text>Secondary Button</Text>
      </Button>

      <Button variant="outline">
        <Text>Outline Button</Text>
      </Button>

      <Button variant="destructive">
        <Text>Destructive Button</Text>
      </Button>

      <Button variant="ghost">
        <Text>Ghost Button</Text>
      </Button>
    </View>
  );
}
