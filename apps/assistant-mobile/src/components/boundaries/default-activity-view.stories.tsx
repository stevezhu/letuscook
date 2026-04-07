import type { Meta, StoryObj } from '@storybook/react-native';

import { DefaultActivityView } from './default-activity-view.tsx';

const meta = {
  component: DefaultActivityView,
  tags: ['autodocs'],
} satisfies Meta<typeof DefaultActivityView>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
