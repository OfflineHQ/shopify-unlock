import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "offline-inline-flex offline-items-center offline-justify-center offline-whitespace-nowrap offline-rounded-md offline-text-sm offline-font-medium offline-ring-offset-background offline-transition-colors focus-visible:offline-outline-none focus-visible:offline-ring-2 focus-visible:offline-ring-ring focus-visible:offline-ring-offset-2 disabled:offline-pointer-events-none disabled:offline-opacity-50",
  {
    variants: {
      variant: {
        default:
          "offline-bg-primary offline-text-primary-foreground hover:offline-bg-primary/90",
        destructive:
          "offline-bg-destructive offline-text-destructive-foreground hover:offline-bg-destructive/90",
        outline:
          "offline-border offline-border-input offline-bg-background hover:offline-bg-accent hover:offline-text-accent-foreground",
        secondary:
          "offline-bg-secondary offline-text-secondary-foreground hover:offline-bg-secondary/80",
        ghost: "hover:offline-bg-accent hover:offline-text-accent-foreground",
        link: "offline-text-primary offline-underline-offset-4 hover:offline-underline",
      },
      size: {
        default: "offline-h-10 offline-px-4 offline-py-2",
        sm: "offline-h-9 offline-rounded-md offline-px-3",
        lg: "offline-h-11 offline-rounded-md offline-px-8",
        icon: "offline-h-10 offline-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
