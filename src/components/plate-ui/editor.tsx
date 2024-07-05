import React from "react";

import type { PlateContentProps } from "@udecode/plate-common";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@udecode/cn";
import { PlateContent } from "@udecode/plate-common";
import { cva } from "class-variance-authority";

const editorVariants = cva(
  cn(
    "offline-relative offline-overflow-x-auto offline-whitespace-pre-wrap offline-break-words",
    "offline-min-h-[80px] offline-w-full offline-rounded-md offline-bg-background offline-px-6 offline-py-2 offline-text-sm offline-ring-offset-background offline-placeholder:text-muted-foreground offline-focus-visible:outline-none",
    "[&_[data-slate-placeholder]]:offline-text-muted-foreground [&_[data-slate-placeholder]]:!offline-opacity-100",
    "[&_[data-slate-placeholder]]:offline-top-[auto_!important]",
    "[&_strong]:offline-font-bold",
  ),
  {
    defaultVariants: {
      focusRing: true,
      size: "sm",
      variant: "outline",
    },
    variants: {
      disabled: {
        true: "offline-cursor-not-allowed offline-opacity-50",
      },
      focusRing: {
        false: "offline-",
        true: "offline-focus-visible:offline-ring-2 offline-focus-visible:offline-ring-ring offline-focus-visible:offline-ring-offset-2",
      },
      focused: {
        true: "offline-ring-2 offline-ring-ring offline-ring-offset-2",
      },
      size: {
        md: "offline-text-base",
        sm: "offline-text-sm",
      },
      variant: {
        ghost: "offline-",
        outline: "offline-border offline-border-input",
      },
    },
  },
);

export type EditorProps = PlateContentProps &
  VariantProps<typeof editorVariants>;

const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  (
    {
      className,
      disabled,
      focusRing,
      focused,
      readOnly,
      size,
      variant,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="offline-relative offline-w-full offline-h-full" ref={ref}>
        <PlateContent
          aria-disabled={disabled}
          className={cn(
            editorVariants({
              disabled,
              focusRing,
              focused,
              size,
              variant,
            }),
            className,
          )}
          disableDefaultStyles
          readOnly={disabled ?? readOnly}
          {...props}
        />
      </div>
    );
  },
);
Editor.displayName = "Editor";

export { Editor };
