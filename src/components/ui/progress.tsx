'use client';

import * as React from 'react';
import { useRevealState } from '@/components/ui/scroll-reveal';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
  delayMs?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, delayMs = 140, ...props }, ref) => {
    const { visible: isVisible, delayMs: parentDelayMs } = useRevealState();
    const clamped = Math.max(0, Math.min(100, value));
    const [renderedWidth, setRenderedWidth] = React.useState<number>(0);
    const hasEnteredRef = React.useRef(false);

    React.useEffect(() => {
      if (!isVisible) return;
      const waitMs = hasEnteredRef.current ? 0 : parentDelayMs + delayMs;
      hasEnteredRef.current = true;

      const timer = window.setTimeout(() => {
        setRenderedWidth(clamped);
      }, waitMs);
      return () => window.clearTimeout(timer);
    }, [isVisible, parentDelayMs, clamped, delayMs]);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
            indicatorClassName,
          )}
          style={{ width: `${renderedWidth}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';

export { Progress };
