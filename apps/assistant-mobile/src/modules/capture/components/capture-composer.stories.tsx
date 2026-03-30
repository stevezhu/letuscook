import { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import {
  CaptureComposer,
  CaptureComposerControls,
  CaptureComposerControlsProps,
  CaptureComposerProps,
  CaptureComposerTextInput,
} from './capture-composer.tsx';

function CompositeCaptureComposer({
  isPending,
  onSubmit,
}: {
  isPending: CaptureComposerProps['isPending'];
  onSubmit: CaptureComposerControlsProps['onSubmit'];
}) {
  return (
    <CaptureComposer isPending={isPending}>
      <CaptureComposerTextInput />
      <CaptureComposerControls onSubmit={onSubmit} />
    </CaptureComposer>
  );
}

const meta = {
  component: CompositeCaptureComposer,
  args: {
    onSubmit: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CompositeCaptureComposer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isPending: false,
  },
};
