import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { Separator } from '@workspace/shadcn/components/separator';
import { cn } from '@workspace/shadcn/lib/utils';
import { buttonGroupVariants } from '@workspace/shadcn/variants/button-group';
import { type VariantProps } from 'class-variance-authority';

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          `
            flex items-center gap-2 rounded-md border bg-muted px-2.5 text-sm
            font-medium shadow-xs
            [&_svg]:pointer-events-none
            [&_svg:not([class*='size-'])]:size-4
          `,
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'button-group-text',
    },
  });
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        `
          relative self-stretch bg-input
          data-[orientation=horizontal]:mx-px
          data-[orientation=horizontal]:w-auto
          data-[orientation=vertical]:my-px data-[orientation=vertical]:h-auto
        `,
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };
