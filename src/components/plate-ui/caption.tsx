import {
  cn,
  createPrimitiveComponent,
  withCn,
  withVariants,
} from "@udecode/cn";
import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from "@udecode/plate-caption";
import { cva } from "class-variance-authority";

import { Button } from "./button";

const captionVariants = cva("offline-max-w-full", {
  defaultVariants: {
    align: "center",
  },
  variants: {
    align: {
      center: "offline-mx-auto",
      left: "offline-mr-auto",
      right: "offline-ml-auto",
    },
  },
});

export const Caption = withVariants(CaptionPrimitive, captionVariants, [
  "align",
]);

export const CaptionTextarea = withCn(
  CaptionTextareaPrimitive,
  cn(
    "offline-mt-2 offline-w-full offline-resize-none offline-border-none offline-bg-inherit offline-p-0 offline-font-[inherit] offline-text-inherit",
    "focus:offline-outline-none focus:[&::placeholder]:offline-opacity-0",
    "offline-text-center print:placeholder:offline-text-transparent",
  ),
);

export const CaptionButton = createPrimitiveComponent(Button)({
  propsHook: useCaptionButton,
  stateHook: useCaptionButtonState,
});
