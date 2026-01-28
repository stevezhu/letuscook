import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  XCircle,
} from 'lucide-react';

import preview from '#.storybook/preview.js';

import { FallbackIcon } from './FallbackIcon.js';

const meta = preview.meta({
  component: FallbackIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'primary'],
    },
    icon: {
      control: false,
    },
    className: {
      control: 'text',
    },
  },
});

export const Default = meta.story({
  args: {
    variant: 'default',
    icon: <Info className="h-6 w-6 text-muted-foreground" />,
  },
});

export const Destructive = meta.story({
  args: {
    variant: 'destructive',
    icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
  },
});

export const Primary = meta.story({
  args: {
    variant: 'primary',
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
  },
});

export const Loading = meta.story({
  args: {
    variant: 'primary',
    icon: <Loader2 className="h-6 w-6 animate-spin text-primary" />,
  },
});

export const Error = meta.story({
  args: {
    variant: 'destructive',
    icon: <XCircle className="h-6 w-6 text-destructive" />,
  },
});

export const CustomStyling = meta.story({
  args: {
    variant: 'default',
    icon: <Info className="h-8 w-8 text-blue-500" />,
    className: 'h-16 w-16 border-2 border-blue-200',
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex items-center gap-6">
      <div className="space-y-2 text-center">
        <FallbackIcon
          variant="default"
          icon={<Info className="h-6 w-6 text-muted-foreground" />}
        />
        <p className="text-xs text-muted-foreground">Default</p>
      </div>
      <div className="space-y-2 text-center">
        <FallbackIcon
          variant="destructive"
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        />
        <p className="text-xs text-muted-foreground">Destructive</p>
      </div>
      <div className="space-y-2 text-center">
        <FallbackIcon
          variant="primary"
          icon={<CheckCircle className="h-6 w-6 text-primary" />}
        />
        <p className="text-xs text-muted-foreground">Primary</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A comparison of all available icon variants.',
      },
    },
  },
});
