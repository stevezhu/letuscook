import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cn } from '@workspace/shadcn/lib/utils';
import { toggleVariants } from '@workspace/shadcn/variants/toggle';
import { type VariantProps } from 'class-variance-authority';

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle };
