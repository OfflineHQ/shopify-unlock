'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { withProps, withVariants } from '@udecode/cn';
import { cva } from 'class-variance-authority';

const separatorVariants = cva('offline-shrink-0 offline-bg-border', {
  defaultVariants: {
    orientation: 'horizontal',
  },
  variants: {
    orientation: {
      horizontal: 'offline-h-px offline-w-full',
      vertical: 'offline-h-full offline-w-px',
    },
  },
});

export const Separator = withVariants(
  withProps(SeparatorPrimitive.Root, {
    decorative: true,
    orientation: 'horizontal',
  }),
  separatorVariants
);
