import type { Preview } from '@storybook/react-native';

// TOOD: convert to `definePreview()`
// https://github.com/storybookjs/react-native/pull/826
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      options: {
        // 👇 Default options
        dark: { name: 'dark', value: '#333' },
        light: { name: 'plain', value: '#fff' },
        // 👇 Add your own
        app: { name: 'app', value: '#eeeeee' },
      },
    },
  },
};

export default preview;
