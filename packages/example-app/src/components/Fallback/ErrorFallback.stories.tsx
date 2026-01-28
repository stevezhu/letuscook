import { fn } from 'storybook/test';

import preview from '#.storybook/preview.js';

import { ErrorFallback } from './ErrorFallback.js';

const meta = preview.meta({
  component: ErrorFallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: false,
    },
    onReset: fn(),
  },
});

export const Default = meta.story({
  args: {
    error: new Error('Something went wrong'),
  },
});

export const LongErrorMessage = meta.story({
  args: {
    error: new Error(
      'This is a very long error message that demonstrates how the error fallback component handles extended error descriptions. It includes multiple details about what went wrong and should wrap properly within the error details section.',
    ),
  },
});

export const CustomMessage = meta.story({
  args: {
    error: new Error('Failed to save template'),
    title: 'Template save failed',
    description:
      'We were unable to save your template. Please check your connection and try again.',
  },
});
