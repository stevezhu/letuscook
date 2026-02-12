import type { Config } from 'jest';

// Reference: https://kulshekhar.github.io/ts-jest/docs/guides/react-native
const configOverrides: Config = {
  resolver: 'ts-jest-resolver',
  // Reference: https://docs.expo.dev/develop/unit-testing/#additional-configuration-for-using-transformignorepatterns
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?(${[
      '(jest-)?react-native',
      '@react-native(-community)?',
      'expo(nent)?',
      '@expo(nent)?/.*',
      '@expo-google-fonts/.*',
      'react-navigation',
      '@react-navigation/.*',
      '@sentry/react-native',
      'native-base',
      'react-native-svg',
      '@rn-primitives',
    ].join('|')}))`,
  ],
};

const jestConfig: Config = {
  projects: [
    {
      preset: 'jest-expo/ios',
      ...configOverrides,
    },
    {
      preset: 'jest-expo/android',
      ...configOverrides,
    },
  ],
};

export default jestConfig;
