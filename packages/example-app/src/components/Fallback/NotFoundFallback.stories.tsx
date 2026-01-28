import { fn } from 'storybook/test';

import preview from '#.storybook/preview.js';

import { NotFoundFallback } from './NotFoundFallback.js';

const meta = preview.meta({
  component: NotFoundFallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onGoBack: fn(),
    onGoHome: fn(),
  },
});

export const Default = meta.story({
  args: {},
});

export const WithoutButtons = meta.story({
  args: {
    hideGoBackButton: true,
    hideGoHomeButton: true,
  },
});

export const CustomGoBackHandler = meta.story({
  args: {
    title: 'Campaign not found',
    description:
      'This campaign may have been deleted or you may not have permission to view it.',
    onGoBack: () => {
      console.log('Custom go back handler called');
    },
  },
});

export const CustomMessage = meta.story({
  args: {
    title: 'Template not found',
    description:
      'The template you are looking for does not exist or has been removed.',
  },
});
