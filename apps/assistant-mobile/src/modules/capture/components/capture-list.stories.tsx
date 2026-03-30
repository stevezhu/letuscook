import { Meta, StoryObj } from '@storybook/react-native';

import { CaptureList, type CaptureItemData } from './capture-list.js';

const MOCK_CAPTURES: CaptureItemData[] = [
  {
    id: '1',
    rawContent: 'Brainstorming for the new landing page design',
    capturedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    captureType: 'other',
  },
  {
    id: '2',
    rawContent: 'https://reactnative.dev/docs/intro-react-native',
    capturedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    captureType: 'link',
  },
  {
    id: '3',
    rawContent: 'Buy milk and eggs on the way home',
    capturedAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
    captureType: 'text',
  },
  {
    id: '4',
    rawContent: 'Another capture',
    capturedAt: Date.now() - 1000, // 1 day ago
    captureType: 'other',
  },
];

const meta = {
  component: CaptureList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CaptureList>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: MOCK_CAPTURES,
  },
};
