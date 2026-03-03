import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/rn-reusables/components/card';
import { Text } from '@workspace/rn-reusables/components/text';
import { BottomTabInset, MaxContentWidth, Spacing } from '#constants/theme.js';

export default function SearchIndex() {
  return (
    <View className="flex-1 flex-row justify-center">
      <SafeAreaView
        className="flex-1 px-6"
        style={{
          maxWidth: MaxContentWidth,
          paddingBottom: BottomTabInset + Spacing.three,
        }}
      >
        <ScrollView
          contentContainerClassName="gap-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="h1" className="mb-4">
            Search
          </Text>

          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Recent Note {i}</CardTitle>
                <CardDescription>
                  This is a placeholder for your recent activity and saved
                  notes.
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
