import { cn } from '@workspace/shadcn/lib/utils';
import { ReactNode } from 'react';

const VARIANT_CLASSES = {
  default: 'bg-muted/50',
  destructive: 'bg-destructive/10',
  primary: 'bg-primary/10',
} as const;

export type FallbackIconProps = {
  icon: ReactNode;
  variant?: 'default' | 'destructive' | 'primary';
  className?: string;
};

export function FallbackIcon({
  icon,
  variant = 'default',
  className,
}: FallbackIconProps) {
  return (
    <div
      className={cn(
        'mx-auto flex size-12 items-center justify-center rounded-full',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {icon}
    </div>
  );
}
