'use client';

import * as React from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn, withRef } from '@udecode/cn';
import { cva } from 'class-variance-authority';

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverAnchor = PopoverPrimitive.Anchor;

export const popoverVariants = cva(
  'offline-w-72 offline-rounded-md offline-border offline-bg-popover offline-p-4 offline-text-popover-foreground offline-shadow-md offline-outline-none data-[state=open]:offline-animate-in data-[state=closed]:offline-animate-out data-[state=closed]:offline-fade-out-0 data-[state=open]:offline-fade-in-0 data-[state=closed]:offline-zoom-out-95 data-[state=open]:offline-zoom-in-95 data-[side=bottom]:offline-slide-in-from-top-2 data-[side=left]:offline-slide-in-from-right-2 data-[side=right]:offline-slide-in-from-left-2 data-[side=top]:offline-slide-in-from-bottom-2 print:offline-hidden'
);

export const PopoverContent = withRef<typeof PopoverPrimitive.Content>(
  ({ align = 'center', className, sideOffset = 4, style, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(popoverVariants(), className)}
        ref={ref}
        sideOffset={sideOffset}
        style={{ zIndex: 1000, ...style }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
);
