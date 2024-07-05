import React from 'react';

import { withRef, withVariants } from '@udecode/cn';
import { PlateElement } from '@udecode/plate-common';
import { cva } from 'class-variance-authority';

const headingVariants = cva('offline-', {
  variants: {
    isFirstBlock: {
      false: 'offline-',
      true: 'offline-mt-0',
    },
    variant: {
      h1: 'offline-mb-1 offline-mt-[2em] offline-font-heading offline-text-4xl offline-font-bold',
      h2: 'offline-mb-px offline-mt-[1.4em] offline-font-heading offline-text-2xl offline-font-semibold offline-tracking-tight',
      h3: 'offline-mb-px offline-mt-[1em] offline-font-heading offline-text-xl offline-font-semibold offline-tracking-tight',
      h4: 'offline-mt-[0.75em] offline-font-heading offline-text-lg offline-font-semibold offline-tracking-tight',
      h5: 'offline-mt-[0.75em] offline-text-lg offline-font-semibold offline-tracking-tight',
      h6: 'offline-mt-[0.75em] offline-text-base offline-font-semibold offline-tracking-tight',
    },
  },
});

const HeadingElementVariants = withVariants(PlateElement, headingVariants, [
  'isFirstBlock',
  'variant',
]);

export const HeadingElement = withRef<typeof HeadingElementVariants>(
  ({ children, isFirstBlock, variant = 'h1', ...props }, ref) => {
    const { editor, element } = props;

    const Element = variant!;

    return (
      <HeadingElementVariants
        asChild
        isFirstBlock={element === editor.children[0]}
        ref={ref}
        variant={variant}
        {...props}
      >
        <Element>{children}</Element>
      </HeadingElementVariants>
    );
  }
);
