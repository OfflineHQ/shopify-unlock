"use client";

import { cn, withRef, withVariants } from "@udecode/cn";
import {
  Resizable as ResizablePrimitive,
  ResizeHandle as ResizeHandlePrimitive,
} from "@udecode/plate-resizable";
import { cva } from "class-variance-authority";

export const mediaResizeHandleVariants = cva(
  cn(
    "offline-top-0 offline-flex offline-w-6 offline-select-none offline-flex-col offline-justify-center",
    "after:offline-flex after:offline-h-16 after:offline-w-[3px] after:offline-rounded-[6px] after:offline-bg-ring after:offline-opacity-0 after:offline-content-['_'] group-hover:after:offline-opacity-100",
  ),
  {
    variants: {
      direction: {
        left: "offline--left-3 offline--ml-3 offline-pl-3",
        right: "offline--right-3 offline--mr-3 offline-items-end offline-pr-3",
      },
    },
  },
);

const resizeHandleVariants = cva(cn("offline-absolute offline-z-40"), {
  variants: {
    direction: {
      left: "offline-h-full offline-cursor-col-resize",
      right: "offline-h-full offline-cursor-col-resize",
      top: "offline-w-full offline-cursor-row-resize",
      bottom: "offline-w-full offline-cursor-row-resize",
    },
  },
});

const ResizeHandleVariants = withVariants(
  ResizeHandlePrimitive,
  resizeHandleVariants,
  ["direction"],
);

export const ResizeHandle = withRef<typeof ResizeHandlePrimitive>(
  (props, ref) => (
    <ResizeHandleVariants
      ref={ref}
      direction={props.options?.direction}
      {...props}
    />
  ),
);

const resizableVariants = cva("offline-", {
  variants: {
    align: {
      left: "offline-mr-auto",
      center: "offline-mx-auto",
      right: "offline-ml-auto",
    },
  },
});

export const Resizable = withVariants(ResizablePrimitive, resizableVariants, [
  "align",
]);
