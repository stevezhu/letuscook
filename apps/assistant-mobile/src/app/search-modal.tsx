import { Text } from '@workspace/rn-reusables/components/text';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

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
      <View className="flex-1 items-center justify-center px-6">
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
    </>
  );
}
