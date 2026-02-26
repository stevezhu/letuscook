import { mergeConfig, type MetroConfig } from '@react-native/metro-config';
import rnxMetroConfig from '@rnx-kit/metro-config';
import { createTsResolveRequest } from '@stzhu/metro-ts-resolver';
import { getDefaultConfig } from 'expo/metro-config.js'; // eslint-disable-line n/no-missing-import
import { withUniwindConfig } from 'uniwind/metro';

const config = getDefaultConfig(import.meta.dirname);
const metroConfig: ReturnType<typeof withUniwindConfig> = withUniwindConfig(
  rnxMetroConfig.makeMetroConfig(
    mergeConfig(config as unknown as MetroConfig, {
      // resolver: {
      //   resolveRequest: createTsResolveRequest({
      //     projectDir: import.meta.dirname,
      //   }),
      // },
    }),
  ),
  {
    cssEntryFile: './src/main.css',
  },
);
export default metroConfig;
