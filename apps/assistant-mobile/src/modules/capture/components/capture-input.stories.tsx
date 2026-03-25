import { Meta, StoryObj } from '@storybook/react-native';

import { CaptureInput } from './capture-input.tsx';

const meta = {
  component: CaptureInput,
  tags: ['autodocs'],
} satisfies Meta<typeof CaptureInput>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
