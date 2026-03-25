import AsyncStorage from '@react-native-async-storage/async-storage';

import { view } from './storybook.requires.ts';

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  },
});

export default StorybookUIRoot;
