import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { DefaultErrorFallback } from './default-error-fallback.tsx';

const meta = {
  component: DefaultErrorFallback,
  tags: ['autodocs'],
} satisfies Meta<typeof DefaultErrorFallback>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'An unexpected error occurred.',
    onRetry: fn(),
  },
};

export const WithGoBack: Story = {
  args: {
    ...Default.args,
    onGoBack: fn(),
  },
};

export const NoMessage: Story = {
  args: {
    ...Default.args,
    message: undefined,
  },
};

export const LongMessage: Story = {
  args: {
    ...Default.args,
    message:
      'Error: Failed to fetch resource at https://api.example.com/v1/captures/abc123 — the server responded with status 503 Service Unavailable after 30000ms timeout. This may be caused by a temporary network issue or server overload. Please check your connection and try again later.',
  },
};

export const NoActions: Story = {
  args: {
    ...Default.args,
    onGoBack: undefined,
    onRetry: undefined,
  },
};
