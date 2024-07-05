import React from 'react';

import { cn, withRef } from '@udecode/cn';
import { PlateElement } from '@udecode/plate-common';
import { useFocused, useSelected } from 'slate-react';

export const HrElement = withRef<typeof PlateElement>(
  ({ className, nodeProps, ...props }, ref) => {
    const { children } = props;

    const selected = useSelected();
    const focused = useFocused();

    return (
      <PlateElement ref={ref} {...props}>
        <div className='offline-py-6' contentEditable={false}>
          <hr
            {...nodeProps}
            className={cn(
              'offline-h-0.5 offline-cursor-pointer offline-rounded-sm offline-border-none offline-bg-muted offline-bg-clip-content',
              selected && focused && 'offline-ring-2 offline-ring-ring offline-ring-offset-2',
              className
            )}
          />
        </div>
        {children}
      </PlateElement>
    );
  }
);
