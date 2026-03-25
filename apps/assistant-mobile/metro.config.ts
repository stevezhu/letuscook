import { mergeConfig, type MetroConfig } from '@react-native/metro-config';
import rnxMetroConfig from '@rnx-kit/metro-config';
import { withStorybook } from '@storybook/react-native/metro/withStorybook';
import { createTsResolveRequest } from '@stzhu/metro-ts-resolver';
import { flow } from 'es-toolkit';
import { getDefaultConfig } from 'expo/metro-config.js';
import { withUniwindConfig } from 'uniwind/metro';

const defaultConfig = getDefaultConfig(
  import.meta.dirname,
) as unknown as MetroConfig;
const config = flow(
  (config: MetroConfig) =>
    mergeConfig(config, {
      resolver: {
        resolveRequest: createTsResolveRequest({
          projectDir: import.meta.dirname,
        }),
      },
    }),
  rnxMetroConfig.makeMetroConfig,
  (config: MetroConfig) =>
    withUniwindConfig(config, {
      cssEntryFile: './src/main.css',
    }),
  (config: MetroConfig) => withStorybook(config),
)(defaultConfig) as MetroConfig;
export default config;
