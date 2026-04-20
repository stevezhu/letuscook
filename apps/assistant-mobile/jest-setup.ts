import { jest } from '@jest/globals';

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

require('react-native-reanimated').setUpTests();
