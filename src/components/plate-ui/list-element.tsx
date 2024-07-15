import React from 'react';

import { withRef, withVariants } from '@udecode/cn';
import { PlateElement } from '@udecode/plate-common';
import { cva } from 'class-variance-authority';

const listVariants = cva('offline-m-0 offline-ps-6', {
  variants: {
    variant: {
      ol: 'offline-list-decimal',
      ul: 'offline-list-disc [&_ul]:offline-list-[circle] [&_ul_ul]:offline-list-[square]',
    },
  },
});

const ListElementVariants = withVariants(PlateElement, listVariants, [
  'variant',
]);

export const ListElement = withRef<typeof ListElementVariants>(
  ({ children, variant = 'ul', ...props }, ref) => {
    const Component = variant!;

    return (
      <ListElementVariants asChild ref={ref} variant={variant} {...props}>
        <Component>{children}</Component>
      </ListElementVariants>
    );
  }
);
