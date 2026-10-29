'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentLabel = !mounted
    ? '테마 설정'
    : theme === 'system'
      ? `시스템 설정 (${resolvedTheme === 'dark' ? '다크' : '라이트'})`
      : theme === 'dark'
        ? '다크 모드'
        : '라이트 모드';

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'relative h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:text-foreground',
                className,
              )}
              aria-label={`테마 설정 (${currentLabel})`}
            >
              {mounted ? (
                theme === 'system' ? (
                  <Laptop className="h-4 w-4 transition-transform duration-200" />
                ) : theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-primary transition-transform duration-200" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200" />
                )
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">테마 설정</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{currentLabel}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex cursor-pointer items-center justify-between font-medium"
        >
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>라이트 모드</span>
          </span>
          {mounted && theme === 'light' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex cursor-pointer items-center justify-between font-medium"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" />
            <span>다크 모드</span>
          </span>
          {mounted && theme === 'dark' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex cursor-pointer items-center justify-between font-medium"
        >
          <span className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span>시스템 설정</span>
          </span>
          {mounted && theme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
