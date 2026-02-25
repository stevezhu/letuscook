import { Stack } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function SearchIndex() {
  return (
    <>
      <Stack.Screen.Title>Search</Stack.Screen.Title>
      <Stack.SearchBar
        placement="automatic"
        autoFocus={true}
        placeholder="Search"
        onChangeText={() => {}}
      />
      <ScrollView>
        <Text>Search</Text>
      </ScrollView>
    </>
  );
}
