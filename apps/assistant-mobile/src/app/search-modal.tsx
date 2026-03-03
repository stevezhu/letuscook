import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { Text } from '@workspace/rn-reusables/components/text';

export default function SearchModal() {
  const [query, setQuery] = useState('');

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Search',
          headerSearchBarOptions: {
            placeholder: 'Search...',
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            autoFocus: true,
          },
        }}
      />
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          {query.length === 0 ? (
            <Text className="text-muted-foreground text-base">
              Start typing to search
            </Text>
          ) : (
            <Text className="text-muted-foreground text-base">
              No results for "{query}"
            </Text>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
