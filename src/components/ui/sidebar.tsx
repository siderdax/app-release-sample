'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_STORAGE_KEY = 'app-release:sidebar-open';

type SidebarContextValue = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return ctx;
}

export function SidebarProvider({
  defaultOpen = true,
  className,
  children,
}: {
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpenState] = React.useState<boolean>(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState<boolean>(false);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === 'true' || saved === 'false') {
        setOpenState(saved === 'true');
      }
    } catch {
      // ignore
    }

    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setOpen = React.useCallback((next: boolean) => {
    setOpenState(next);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen(!open);
    }
  }, [isMobile, open, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state: 'expanded' | 'collapsed' = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, openMobile, isMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={100}>
        <div
          data-slot="sidebar-wrapper"
          className={cn(
            'group/sidebar-wrapper flex min-h-svh w-full bg-background text-foreground',
            className,
          )}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  variant = 'floating',
  collapsible = 'icon',
  className,
  children,
}: {
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'icon' | 'offcanvas';
  className?: string;
  children: React.ReactNode;
}) {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <>
      {/* 모바일(<lg) Sheet 드로어 */}
      <Sheet open={isMobile && openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          hideClose
          className="w-72 border-r border-border bg-sidebar-bg p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">사이트 내비게이션 메뉴</SheetTitle>
          <SheetDescription className="sr-only">
            제품군 및 대시보드 페이지 이동 메뉴
          </SheetDescription>
          <div data-state="expanded" className="group/sidebar flex h-full w-full flex-col p-3">
            {children}
          </div>
        </SheetContent>
      </Sheet>

      {/* 데스크톱(>=lg) 공식 shadcn/ui 플로팅 & 아이콘 레일 사이드바 */}
      <div
        data-state={state}
        data-collapsible={isCollapsed ? collapsible : ''}
        data-variant={variant}
        className="group/sidebar peer hidden shrink-0 text-sidebar-foreground lg:block"
      >
        {/* 레이아웃 공간 점유 스페이서 */}
        <div
          className={cn(
            'relative h-svh bg-transparent transition-[width] duration-200 ease-linear',
            !isCollapsed && 'w-[272px]',
            isCollapsed && collapsible === 'icon' && (variant === 'floating' ? 'w-[76px]' : 'w-[60px]'),
            isCollapsed && collapsible === 'offcanvas' && 'w-0',
          )}
        />

        {/* 실제 고정 사이드바 컨테이너 */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-20 hidden h-svh transition-[left,width] duration-200 ease-linear lg:flex',
            !isCollapsed && 'w-[272px]',
            isCollapsed && collapsible === 'icon' && (variant === 'floating' ? 'w-[76px]' : 'w-[60px]'),
            isCollapsed && collapsible === 'offcanvas' && '-left-[272px] w-[272px]',
            variant === 'floating' ? 'p-2.5 pr-0' : 'border-r border-border',
            className,
          )}
        >
          <div
            data-sidebar="sidebar"
            className={cn(
              'relative flex h-full w-full flex-col bg-sidebar-bg p-2.5',
              variant === 'floating' &&
                'rounded-2xl border border-border shadow-xs',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * shadcn/ui 공식 SidebarRail:
 * 사이드바 우측 경계선 전체를 클릭해 접기/펼치기할 수 있는 인터랙티브 레일
 */
export const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar();

  return (
    <button
      ref={ref}
      type="button"
      data-sidebar="rail"
      aria-label="사이드바 토글"
      tabIndex={-1}
      onClick={toggleSidebar}
      title={state === 'expanded' ? '사이드바 접기 (Ctrl+B)' : '사이드바 펼치기 (Ctrl+B)'}
      className={cn(
        'absolute inset-y-3 -right-2 z-30 hidden w-3 cursor-pointer transition-all after:absolute after:inset-y-2 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:rounded-full after:transition-colors hover:after:bg-primary/45 lg:flex',
        state === 'expanded' ? 'cursor-w-resize' : 'cursor-e-resize',
        className,
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = 'SidebarRail';

/**
 * shadcn/ui 공식 SidebarTrigger:
 * 슬림 상단 바 좌측에 자연스럽게 녹아드는 PanelLeft 고스트 아이콘 버튼
 */
export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, state, isMobile } = useSidebar();
  const label = isMobile
    ? '사이드 메뉴 열기'
    : state === 'expanded'
      ? '사이드바 접기 (Ctrl+B)'
      : '사이드바 펼치기 (Ctrl+B)';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          type="button"
          data-sidebar="trigger"
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={(e) => {
            onClick?.(e);
            toggleSidebar();
          }}
          className={cn(
            'h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            className,
          )}
          {...props}
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export function SidebarInset({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn('relative flex min-w-0 flex-1 flex-col bg-background', className)}
    >
      {children}
    </main>
  );
}

export function SidebarHeader({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex shrink-0 flex-col gap-2 p-1', className)}>{children}</div>;
}

export function SidebarContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ScrollArea className={cn('mt-2 min-h-0 flex-1', className)}>
      <div className="space-y-3 px-0.5">{children}</div>
    </ScrollArea>
  );
}

export function SidebarFooter({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-2 shrink-0 border-t border-border pt-2.5', className)}>
      {children}
    </div>
  );
}

export function SidebarSeparator({ className }: { className?: string }) {
  return <Separator className={cn('bg-border', className)} />;
}

export function SidebarGroup({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1', className)}>{children}</div>;
}

export function SidebarGroupLabel({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mb-1 px-2 text-[11px] font-medium text-muted-foreground transition-opacity group-data-[collapsible=icon]/sidebar:sr-only',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({
  className,
  children,
}: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('space-y-1', className)}>{children}</ul>;
}

export function SidebarMenuItem({
  className,
  children,
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('relative', className)}>{children}</li>;
}

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, isActive = false, tooltip, className, children, ...props }, ref) => {
    const { state, isMobile } = useSidebar();
    const Comp = asChild ? Slot : 'button';

    const button = (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(
          'group/menu-btn flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-[13px] transition-all',
          'group-data-[collapsible=icon]/sidebar:mx-auto group-data-[collapsible=icon]/sidebar:h-9 group-data-[collapsible=icon]/sidebar:w-9 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:p-0',
          isActive
            ? 'bg-primary font-semibold text-primary-foreground shadow-2xs dark:border dark:border-primary/30 dark:bg-primary/10 dark:shadow-xs'
            : 'font-medium text-sidebar-foreground hover:bg-card-elevated hover:text-foreground dark:hover:bg-[#203228] dark:hover:text-[#ffffff] dark:hover:shadow-xs',
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );

    if (!tooltip || state !== 'collapsed' || isMobile) {
      return button;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export function SidebarMenuBadge({
  isActive = false,
  className,
  children,
}: {
  isActive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors group-data-[collapsible=icon]/sidebar:hidden',
        isActive
          ? 'bg-primary-foreground/15 text-primary-foreground dark:bg-primary/25 dark:text-[#beeed5]'
          : 'border border-border/50 bg-muted text-foreground/85 group-hover/menu-btn:border-transparent group-hover/menu-btn:bg-accent group-hover/menu-btn:text-accent-foreground dark:group-hover/menu-btn:bg-primary/25 dark:group-hover/menu-btn:text-[#4ade80]',
        className,
      )}
    >
      {children}
    </span>
  );
}
