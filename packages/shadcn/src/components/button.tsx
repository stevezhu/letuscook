import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cn } from '@workspace/shadcn/lib/utils';
import { buttonVariants } from '@workspace/shadcn/variants/button';
import { type VariantProps } from 'class-variance-authority';

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
