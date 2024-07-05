"use client";
import * as React from "react";

import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import { cn, withCn, withRef, withVariants } from "@udecode/cn";
import { type VariantProps, cva } from "class-variance-authority";

import { Icons } from "../icons";

import { Separator } from "./separator";
import { withTooltip } from "./tooltip";

export const Toolbar = withCn(
  ToolbarPrimitive.Root,
  "offline-relative offline-flex offline-select-none offline-items-center offline-gap-1 offline-bg-background",
);

export const ToolbarToggleGroup = withCn(
  ToolbarPrimitive.ToolbarToggleGroup,
  "offline-flex offline-items-center",
);

export const ToolbarLink = withCn(
  ToolbarPrimitive.Link,
  "offline-font-medium offline-underline offline-underline-offset-4",
);

export const ToolbarSeparator = withCn(
  ToolbarPrimitive.Separator,
  "offline-my-1 offline-w-px offline-shrink-0 offline-bg-border",
);

const toolbarButtonVariants = cva(
  cn(
    "offline-inline-flex offline-items-center offline-justify-center offline-rounded-md offline-text-sm offline-font-medium offline-ring-offset-background offline-transition-colors offline-focus-visible:outline-none offline-focus-visible:ring-2 offline-focus-visible:ring-ring offline-focus-visible:ring-offset-2 offline-disabled:pointer-events-none offline-disabled:opacity-50",
    "[&_svg:not([data-icon])]:offline-size-5",
  ),
  {
    defaultVariants: {
      size: "sm",
      variant: "default",
    },
    variants: {
      size: {
        default: "offline-h-10 offline-px-3",
        lg: "offline-h-11 offline-px-5",
        sm: "offline-h-9 offline-px-2",
      },
      variant: {
        default:
          "offline-bg-transparent hover:offline-bg-muted hover:offline-text-muted-foreground aria-checked:offline-bg-accent aria-checked:offline-text-accent-foreground",
        outline:
          "offline-border offline-border-input offline-bg-transparent hover:offline-bg-accent hover:offline-text-accent-foreground",
      },
    },
  },
);

const ToolbarButton = withTooltip(
  // eslint-disable-next-line react/display-name
  React.forwardRef<
    React.ElementRef<typeof ToolbarToggleItem>,
    {
      isDropdown?: boolean;
      pressed?: boolean;
    } & Omit<
      React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>,
      "asChild" | "value"
    > &
      VariantProps<typeof toolbarButtonVariants>
  >(
    (
      { children, className, isDropdown, pressed, size, variant, ...props },
      ref,
    ) => {
      return typeof pressed === "boolean" ? (
        <ToolbarToggleGroup
          disabled={props.disabled}
          type="single"
          value="single"
        >
          <ToolbarToggleItem
            className={cn(
              toolbarButtonVariants({
                size,
                variant,
              }),
              isDropdown && "offline-my-1 offline-justify-between offline-pr-1",
              className,
            )}
            ref={ref}
            value={pressed ? "single" : ""}
            {...props}
          >
            {isDropdown ? (
              <>
                <div className="offline-flex offline-flex-1">{children}</div>
                <div>
                  <Icons.arrowDown
                    className="offline-ml-0.5 offline-size-4"
                    data-icon
                  />
                </div>
              </>
            ) : (
              children
            )}
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
      ) : (
        <ToolbarPrimitive.Button
          className={cn(
            toolbarButtonVariants({
              size,
              variant,
            }),
            isDropdown && "offline-pr-1",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </ToolbarPrimitive.Button>
      );
    },
  ),
);
ToolbarButton.displayName = "ToolbarButton";

export { ToolbarButton };

export const ToolbarToggleItem = withVariants(
  ToolbarPrimitive.ToggleItem,
  toolbarButtonVariants,
  ["variant", "size"],
);

export const ToolbarGroup = withRef<
  "div",
  {
    noSeparator?: boolean;
  }
>(({ children, className, noSeparator }, ref) => {
  const childArr = React.Children.map(children, (c) => c);

  if (!childArr || childArr.length === 0) return null;

  return (
    <div className={cn("offline-flex", className)} ref={ref}>
      {!noSeparator && (
        <div className="offline-h-full offline-py-1">
          <Separator orientation="vertical" />
        </div>
      )}

      <div className="offline-mx-1 offline-flex offline-items-center offline-gap-1">
        {children}
      </div>
    </div>
  );
});
