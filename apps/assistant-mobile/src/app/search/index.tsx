import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchIndex() {
  const [isFavorite, setIsFavorite] = useState(false);
  return (
    <>
      {/* <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isFavorite ? 'star.fill' : 'star'}
          onPress={() => setIsFavorite(!isFavorite)}
        />
        <Stack.Toolbar.Button
          icon="square.and.arrow.up"
          onPress={() => Alert.alert('Share')}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="sidebar.left"
          onPress={() => Alert.alert('Sidebar')}
        />
      </Stack.Toolbar> */}

      <ScrollView>
        <Text className="text-2xl font-bold">Note content...</Text>
      </ScrollView>
      {/* <Stack.Screen.Title>Search</Stack.Screen.Title>
      <Stack.SearchBar
        placement="automatic"
        autoFocus={true}
        placeholder="Search"
        onChangeText={() => {}}
      />
      <Stack.Screen>
        <Text>Search</Text>
      </Stack.Screen> */}
      {/* <ScrollView> */}
      {/* </ScrollView> */}
    </>
  );
}
