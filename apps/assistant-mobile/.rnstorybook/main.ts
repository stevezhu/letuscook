import type { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.?(ts|tsx)',
    '../src/modules/**/*.stories.?(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
  ],
  features: {
    ondeviceBackgrounds: true,
  },
};

export default main;
