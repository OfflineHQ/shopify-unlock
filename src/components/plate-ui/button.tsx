import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cn, withRef } from '@udecode/cn';
import { type VariantProps, cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'offline-inline-flex offline-items-center offline-justify-center offline-whitespace-nowrap offline-rounded-md offline-text-sm offline-font-medium offline-ring-offset-background offline-transition-colors focus-visible:offline-outline-none focus-visible:offline-ring-2 focus-visible:offline-ring-ring focus-visible:offline-ring-offset-2 disabled:offline-pointer-events-none disabled:offline-opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      isMenu: {
        true: 'offline-h-auto offline-w-full offline-cursor-pointer offline-justify-start',
      },
      size: {
        default: 'offline-h-10 offline-px-4 offline-py-2',
        icon: 'offline-size-10',
        lg: 'offline-h-11 offline-rounded-md offline-px-8',
        none: 'offline-',
        sm: 'offline-h-9 offline-rounded-md offline-px-3',
        sms: 'offline-size-9 offline-rounded-md offline-px-0',
        xs: 'offline-h-8 offline-rounded-md offline-px-3',
      },
      variant: {
        default: 'offline-bg-primary offline-text-primary-foreground hover:offline-bg-primary/90',
        destructive:
          'offline-bg-destructive offline-text-destructive-foreground hover:offline-bg-destructive/90',
        ghost: 'hover:offline-bg-accent hover:offline-text-accent-foreground',
        inlineLink: 'offline-text-base offline-text-primary offline-underline offline-underline-offset-4',
        link: 'offline-text-primary offline-underline-offset-4 hover:offline-underline',
        outline:
          'offline-border offline-border-input offline-bg-background hover:offline-bg-accent hover:offline-text-accent-foreground',
        secondary:
          'offline-bg-secondary offline-text-secondary-foreground hover:offline-bg-secondary/80',
      },
    },
  }
);

export const Button = withRef<
  'button',
  {
    asChild?: boolean;
  } & VariantProps<typeof buttonVariants>
>(({ asChild = false, className, isMenu, size, variant, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ className, isMenu, size, variant }))}
      ref={ref}
      {...props}
    />
  );
});
