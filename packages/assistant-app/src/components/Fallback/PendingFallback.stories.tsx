import preview from '#.storybook/preview.js';

import { PendingFallback } from './PendingFallback.js';

const meta = preview.meta({
  component: PendingFallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
});

export const Default = meta.story();

export const CustomMessage = meta.story({
  args: {
    title: 'Saving template...',
    description: 'Please wait while we save your template changes.',
  },
});
