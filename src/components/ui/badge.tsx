import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        mint: 'bg-accent text-accent-foreground font-semibold',
        secondary: 'bg-muted text-foreground/80',
        outline: 'border border-border bg-card-elevated text-foreground/80',
        warning:
          'border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/60 dark:text-amber-300',
        danger:
          'border border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/60 dark:text-rose-300',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
