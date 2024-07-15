import { withVariants } from '@udecode/cn';
import { cva } from 'class-variance-authority';

export const inputVariants = cva(
  'offline-flex offline-w-full offline-rounded-md offline-bg-transparent offline-text-sm file:offline-border-0 file:offline-bg-background file:offline-text-sm file:offline-font-medium placeholder:offline-text-muted-foreground focus-visible:offline-outline-none disabled:offline-cursor-not-allowed disabled:offline-opacity-50',
  {
    defaultVariants: {
      h: 'md',
      variant: 'default',
    },
    variants: {
      h: {
        md: 'offline-h-10 offline-px-3 offline-py-2',
        sm: 'offline-h-9 offline-px-3 offline-py-2',
      },
      variant: {
        default:
          'offline-border offline-border-input offline-ring-offset-background focus-visible:offline-ring-2 focus-visible:offline-ring-ring focus-visible:offline-ring-offset-2',
        ghost: 'offline-border-none focus-visible:offline-ring-transparent',
      },
    },
  }
);

export const Input = withVariants('input', inputVariants, ['variant', 'h']);
