'use client';

import React from 'react';

import { cn, withRef } from '@udecode/cn';
import { useComposedRef } from '@udecode/plate-common';
import { useColorInput } from '@udecode/plate-font';

export const ColorInput = withRef<'input'>(
  ({ children, className, value = '#000000', ...props }, ref) => {
    const { childProps, inputRef } = useColorInput();

    return (
      <div className='offline-flex offline-flex-col offline-items-center'>
        {React.Children.map(children, (child) => {
          if (!child) return child;

          return React.cloneElement(child as React.ReactElement, childProps);
        })}

        <input
          className={cn('offline-size-0 offline-overflow-hidden offline-border-0 offline-p-0', className)}
          ref={useComposedRef(ref, inputRef)}
          type="color"
          value={value}
          {...props}
        />
      </div>
    );
  }
);
