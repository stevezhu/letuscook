import constants from '@workspace/constants' with { type: 'json' };
import type { ExpoConfig, ConfigContext } from 'expo/config/index.js';

import packageJson from './package.json' with { type: 'json' };

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: constants.productName,
  slug: 'letuscook',
  version: packageJson.version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'letuscook',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.letuscook',
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.letuscook',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-image',
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
