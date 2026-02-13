import { Button } from '@workspace/shadcn/components/button';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

import preview from '#.storybook/preview.js';

import { Fallback } from './Fallback.js';
import { FallbackIcon } from './FallbackIcon.js';

const meta = preview.meta({
  title: 'Components/Fallback/Fallback',
  component: Fallback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
    },
    children: {
      control: false,
    },
  },
});

export const Default = meta.story({
  args: {
    title: 'No Content Available',
    description: 'There is no content to display at the moment.',
    icon: (
      <FallbackIcon
        variant="default"
        icon={<Info className="size-6 text-muted-foreground" />}
      />
    ),
  },
});

export const WithActions = meta.story({
  args: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    icon: (
      <FallbackIcon
        variant="destructive"
        icon={<AlertTriangle className="size-6 text-destructive" />}
      />
    ),
    children: (
      <div className="flex justify-center gap-2">
        <Button>Try Again</Button>
        <Button variant="outline">Go Back</Button>
      </div>
    ),
  },
});

export const Success = meta.story({
  args: {
    title: 'All Done!',
    description: 'Your operation completed successfully.',
    icon: (
      <FallbackIcon
        variant="primary"
        icon={<CheckCircle className="size-6 text-primary" />}
      />
    ),
    children: <Button variant="outline">Continue</Button>,
  },
});

export const LongContent = meta.story({
  args: {
    title:
      'A Very Long Title That Might Wrap to Multiple Lines in Certain Scenarios',
    description:
      'This is a much longer description that demonstrates how the fallback component handles extended content. It should wrap nicely and maintain good readability even with substantial amounts of text.',
    icon: (
      <FallbackIcon
        variant="default"
        icon={<Info className="size-6 text-muted-foreground" />}
      />
    ),
    children: (
      <div className="w-full space-y-2">
        <Button className="w-full">Primary Action</Button>
        <Button variant="outline" className="w-full">
          Secondary Action
        </Button>
      </div>
    ),
  },
});
