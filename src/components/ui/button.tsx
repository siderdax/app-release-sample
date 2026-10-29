import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-2xs hover:bg-primary-hover dark:border dark:border-primary/50 dark:bg-primary/20 dark:text-[#3fda8e] dark:shadow-xs dark:hover:border-primary/80 dark:hover:bg-primary/30 dark:hover:text-[#52e896]',
        outline:
          'border border-border bg-card-elevated text-primary hover:bg-accent/40 hover:border-primary/40 dark:border-[#34443c] dark:bg-[#131d18] dark:text-[#beeed5] dark:hover:border-primary/60 dark:hover:bg-primary/15 dark:hover:text-[#3fda8e]',
        secondary:
          'bg-muted text-foreground hover:bg-muted/80 dark:border dark:border-[#34443c] dark:bg-[#16221c] dark:text-[#dde4e1] dark:hover:bg-[#1f3027] dark:hover:text-white',
        ghost:
          'text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:hover:bg-primary/15 dark:hover:text-[#3fda8e]',
        soft:
          'bg-accent text-accent-foreground hover:bg-accent/80 dark:border dark:border-primary/30 dark:bg-primary/10 dark:text-[#beeed5] dark:hover:border-primary/50 dark:hover:bg-primary/20 dark:hover:text-[#3fda8e]',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-xl px-5 text-sm',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
