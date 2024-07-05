"use client";

import { useCallback, useState } from "react";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  cn,
  createPrimitiveElement,
  withCn,
  withProps,
  withRef,
  withVariants,
} from "@udecode/cn";
import { cva } from "class-variance-authority";

import { Icons } from "../icons";

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger = withRef<
  typeof DropdownMenuPrimitive.SubTrigger,
  {
    inset?: boolean;
  }
>(({ children, className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    className={cn(
      "offline-flex offline-cursor-default offline-select-none offline-items-center offline-rounded-sm offline-px-2 offline-py-1.5 offline-text-sm offline-outline-none focus:offline-bg-accent data-[state=open]:offline-bg-accent",
      "data-[disabled]:offline-pointer-events-none data-[disabled]:offline-opacity-50",
      inset && "offline-pl-8",
      className,
    )}
    ref={ref}
    {...props}
  >
    {children}
    <Icons.chevronRight className="offline-ml-auto offline-size-4" />
  </DropdownMenuPrimitive.SubTrigger>
));

export const DropdownMenuSubContent = withCn(
  DropdownMenuPrimitive.SubContent,
  "offline-z-50 offline-min-w-32 offline-overflow-hidden offline-rounded-md offline-border offline-bg-popover offline-p-1 offline-text-popover-foreground offline-shadow-lg data-[state=open]:offline-animate-in data-[state=closed]:offline-animate-out data-[state=closed]:offline-fade-out-0 data-[state=open]:offline-fade-in-0 data-[state=closed]:offline-zoom-out-95 data-[state=open]:offline-zoom-in-95 data-[side=bottom]:offline-slide-in-from-top-2 data-[side=left]:offline-slide-in-from-right-2 data-[side=right]:offline-slide-in-from-left-2 data-[side=top]:offline-slide-in-from-bottom-2",
);

const DropdownMenuContentVariants = withProps(DropdownMenuPrimitive.Content, {
  className: cn(
    "offline-z-50 offline-min-w-32 offline-overflow-hidden offline-rounded-md offline-border offline-bg-popover offline-p-1 offline-text-popover-foreground offline-shadow-md data-[state=open]:offline-animate-in data-[state=closed]:offline-animate-out data-[state=closed]:offline-fade-out-0 data-[state=open]:offline-fade-in-0 data-[state=closed]:offline-zoom-out-95 data-[state=open]:offline-zoom-in-95 data-[side=bottom]:offline-slide-in-from-top-2 data-[side=left]:offline-slide-in-from-right-2 data-[side=right]:offline-slide-in-from-left-2 data-[side=top]:offline-slide-in-from-bottom-2",
  ),
  sideOffset: 4,
});

export const DropdownMenuContent = withRef<
  typeof DropdownMenuPrimitive.Content
>(({ ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuContentVariants ref={ref} {...props} />
  </DropdownMenuPrimitive.Portal>
));

const menuItemVariants = cva(
  cn(
    "offline-relative offline-flex offline-h-9 offline-cursor-pointer offline-select-none offline-items-center offline-rounded-sm offline-px-2 offline-py-1.5 offline-text-sm offline-outline-none offline-transition-colors",
    "focus:offline-bg-accent focus:offline-text-accent-foreground data-[disabled]:offline-pointer-events-none data-[disabled]:offline-opacity-50",
  ),
  {
    variants: {
      inset: {
        true: "offline-pl-8",
      },
    },
  },
);

export const DropdownMenuItem = withVariants(
  DropdownMenuPrimitive.Item,
  menuItemVariants,
  ["inset"],
);

export const DropdownMenuCheckboxItem = withRef<
  typeof DropdownMenuPrimitive.CheckboxItem
>(({ children, className, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    className={cn(
      "offline-relative offline-flex offline-select-none offline-items-center offline-rounded-sm offline-py-1.5 offline-pl-8 offline-pr-2 offline-text-sm offline-outline-none offline-transition-colors focus:offline-bg-accent focus:offline-text-accent-foreground data-[disabled]:offline-pointer-events-none data-[disabled]:offline-opacity-50",
      "offline-cursor-pointer",
      className,
    )}
    ref={ref}
    {...props}
  >
    <span className="offline-absolute offline-left-2 offline-flex offline-size-3.5 offline-items-center offline-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Icons.check className="offline-size-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

export const DropdownMenuRadioItem = withRef<
  typeof DropdownMenuPrimitive.RadioItem,
  {
    hideIcon?: boolean;
  }
>(({ children, className, hideIcon, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    className={cn(
      "offline-relative offline-flex offline-select-none offline-items-center offline-rounded-sm offline-pl-8 offline-pr-2 offline-text-sm offline-outline-none offline-transition-colors focus:offline-bg-accent focus:offline-text-accent-foreground data-[disabled]:offline-pointer-events-none data-[disabled]:offline-opacity-50",
      "offline-h-9 offline-cursor-pointer offline-px-2 data-[state=checked]:offline-bg-accent data-[state=checked]:offline-text-accent-foreground",
      className,
    )}
    ref={ref}
    {...props}
  >
    {!hideIcon && (
      <span className="offline-absolute offline-right-2 offline-flex offline-size-3.5 offline-items-center offline-justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icons.check className="offline-size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    )}
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

const dropdownMenuLabelVariants = cva(
  cn(
    "offline-select-none offline-px-2 offline-py-1.5 offline-text-sm offline-font-semibold",
  ),
  {
    variants: {
      inset: {
        true: "offline-pl-8",
      },
    },
  },
);

export const DropdownMenuLabel = withVariants(
  DropdownMenuPrimitive.Label,
  dropdownMenuLabelVariants,
  ["inset"],
);

export const DropdownMenuSeparator = withCn(
  DropdownMenuPrimitive.Separator,
  "offline--mx-1 offline-my-1 offline-h-px offline-bg-muted",
);

export const DropdownMenuShortcut = withCn(
  createPrimitiveElement("span"),
  "offline-ml-auto offline-text-xs offline-tracking-widest offline-opacity-60",
);

export const useOpenState = () => {
  const [open, setOpen] = useState(false);

  const onOpenChange = useCallback(
    (_value = !open) => {
      setOpen(_value);
    },
    [open],
  );

  return {
    onOpenChange,
    open,
  };
};
