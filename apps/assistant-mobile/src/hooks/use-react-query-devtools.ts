import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as ExpoDevice from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSyncQueriesExternal } from 'react-query-external-sync';

// import { storage } from './mmkv'; // Your MMKV instance

const HOST_IP =
  Constants.expoGoConfig?.debuggerHost?.split(`:`)[0] ||
  Constants.expoConfig?.hostUri?.split(`:`)[0];

export function useReactQueryDevtools(queryClient: QueryClient) {
  const [deviceId, setDeviceId] = useState<string>(Platform.OS);

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      // Try to load existing ID
      const storedId = await AsyncStorage.getItem('deviceId');

      if (storedId) {
        setDeviceId(storedId);
      } else {
        // First launch - generate and store a persistent ID
        const newId = `${Platform.OS}-${Date.now()}`;
        await AsyncStorage.setItem('deviceId', newId);
        setDeviceId(newId);
      }
    };

    void loadOrCreateDeviceId();
  }, []);

  return useSyncQueriesExternal({
    queryClient,
    socketURL: `http://${HOST_IP}:42831`,
    deviceName: Platform.OS, // Platform detection
    platform: Platform.OS, // Use appropriate platform identifier
    deviceId, // Use a PERSISTENT identifier (see note below)
    isDevice: ExpoDevice.isDevice, // Automatically detects real devices vs emulators
    enableLogs: false,
    envVariables: {
      NODE_ENV: process.env.NODE_ENV,
      // Add any private environment variables you want to monitor
      // Public environment variables are automatically loaded
    },
    // Storage monitoring with CRUD operations
    // mmkvStorage: storage, // MMKV storage for ['#storage', 'mmkv', 'key'] queries + monitoring
    asyncStorage: AsyncStorage, // AsyncStorage for ['#storage', 'async', 'key'] queries + monitoring
    secureStorage: SecureStore, // SecureStore for ['#storage', 'secure', 'key'] queries + monitoring
    secureStorageKeys: ['workos_session', 'workos_pkce'], // SecureStore keys to monitor
  });
}
