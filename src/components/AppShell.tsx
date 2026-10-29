'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Activity,
  ChevronRight,
  Cpu,
  Droplets,
  Eye,
  Gauge,
  LayoutGrid,
  Orbit,
  Radio,
  RefreshCw,
  Search,
  Server,
  Sliders,
  Workflow,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import CommandSearchModal from '@/components/CommandSearchModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PRODUCT_DEFINITIONS } from '@/lib/product-catalog';
import { cn } from '@/lib/utils';
import type { ClassifiedFileItem, ProductGroupSummary } from '@/lib/smb-scanner';

interface AppShellProps {
  products: ProductGroupSummary[];
  files?: ClassifiedFileItem[];
  totalInstallers: number;
  uncDisplay?: string;
  usernameMasked?: string;
  elapsedMs?: number;
  scannedAtIso?: string;
  pageTitle: string;
  pageSubtitle?: string;
  categoryBadge?: string;
  onRefreshComplete?: () => Promise<void> | void;
  children: React.ReactNode;
}

const PRODUCT_ICON_MAP: Record<string, LucideIcon> = {
  'optimetrix-3000': Cpu,
  'nexus-control': Orbit,
  'vision-craft-x5': Eye,
  'aero-flow-m2': Sliders,
  'edge-pulse-10': Radio,
  'metro-gauge-70': Gauge,
  'hydro-clean-auto': Droplets,
  'diagram-craft-pro': Workflow,
  'telemetry-scope': Activity,
};

function getProductIcon(slug: string, category: string): LucideIcon {
  if (PRODUCT_ICON_MAP[slug]) return PRODUCT_ICON_MAP[slug];
  return category === '유틸리티' ? Wrench : Activity;
}

function formatShortTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AppShellInner({
  navProducts,
  files = [],
  totalInstallers,
  uncDisplay,
  usernameMasked,
  elapsedMs,
  scannedAtIso,
  pageTitle,
  pageSubtitle,
  categoryBadge,
  onRefreshComplete,
  children,
}: Omit<AppShellProps, 'products'> & { navProducts: ProductGroupSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isCollapsedDesktop = state === 'collapsed' && !isMobile;

  const categoryGroups = Array.from(
    navProducts.reduce((map, item) => {
      const cat = item.category || '기타';
      const arr = map.get(cat) ?? [];
      arr.push(item);
      map.set(cat, arr);
      return map;
    }, new Map<string, ProductGroupSummary[]>()),
  );

  async function handleGlobalRefresh() {
    setRefreshing(true);
    try {
      await fetch('/api/scan?refresh=1', { cache: 'no-store' });
      if (onRefreshComplete) {
        await onRefreshComplete();
      }
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <>
      {/* 공식 shadcn/ui 플로팅 사이드바 + 아이콘 레일 접힘 + 우측 SidebarRail */}
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between group-data-[collapsible=icon]/sidebar:justify-center">
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex items-center gap-2.5 text-foreground"
            >
              <img
                src="/logo.png?v=2"
                alt="App Release"
                width={38}
                height={38}
                className="h-9.5 w-9.5 shrink-0 select-none object-contain drop-shadow-2xs"
              />
              <div className="min-w-0 flex-1 pr-1 group-data-[collapsible=icon]/sidebar:hidden">
                <div className="whitespace-nowrap text-sm font-bold leading-tight tracking-tight">
                  App Release
                </div>
                <div className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                  Sample Showcase
                </div>
              </div>
            </Link>
            {isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpenMobile(false)}
                className="h-8 w-8 rounded-lg"
                aria-label="메뉴 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* ⌘K 빠른 검색 트리거 */}
          {isCollapsedDesktop ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="mx-auto mt-1 flex h-9 w-9 rounded-xl border border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-card-elevated hover:text-primary"
                  aria-label="빠른 검색 (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">빠른 검색 (Ctrl+K)</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpenMobile(false);
                setSearchOpen(true);
              }}
              className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-card-elevated"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>검색...</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground">
                  ⌘
                </kbd>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground">
                  K
                </kbd>
              </span>
            </button>
          )}
        </SidebarHeader>

        <SidebarContent>
          {/* 메인 대시보드 */}
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/'}
                  tooltip={`Dashboard · ${totalInstallers}개`}
                >
                  <Link href="/" onClick={() => setOpenMobile(false)}>
                    <span className="flex items-center gap-2.5">
                      <LayoutGrid
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          pathname === '/'
                            ? 'text-primary-foreground dark:text-[#beeed5]'
                            : 'text-muted-foreground group-hover/menu-btn:text-primary dark:group-hover/menu-btn:text-[#4ade80]',
                        )}
                      />
                      <span
                        className={cn(
                          'group-data-[collapsible=icon]/sidebar:hidden',
                          pathname === '/' && 'dark:text-[#beeed5]',
                        )}
                      >
                        Dashboard
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 group-data-[collapsible=icon]/sidebar:hidden">
                      {totalInstallers > 0 && (
                        <SidebarMenuBadge isActive={pathname === '/'}>
                          {totalInstallers}
                        </SidebarMenuBadge>
                      )}
                      {pathname === '/' && (
                        <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/80 dark:text-[#beeed5]/80" />
                      )}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* 카테고리별 제품군 */}
          {categoryGroups.map(([categoryName, items]) => (
            <div key={categoryName} className="space-y-2.5">
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>{categoryName}</SidebarGroupLabel>
                <SidebarMenu>
                  {items.map((p) => {
                    const href = `/products/${p.slug}`;
                    const active = pathname === href;
                    const pkgCount = p.installerCount + p.firmwareCount;
                    const IconComp = getProductIcon(p.slug, categoryName);

                    return (
                      <SidebarMenuItem key={p.slug}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={`${p.name} (${pkgCount}개)`}
                        >
                          <Link href={href} onClick={() => setOpenMobile(false)}>
                            <span className="flex min-w-0 items-center gap-2.5">
                              <IconComp
                                className={cn(
                                  'h-4 w-4 shrink-0 transition-colors',
                                  active
                                    ? 'text-primary-foreground dark:text-[#beeed5]'
                                    : 'text-muted-foreground group-hover/menu-btn:text-primary dark:group-hover/menu-btn:text-[#4ade80]',
                                )}
                              />
                              <span
                                className={cn(
                                  'truncate group-data-[collapsible=icon]/sidebar:hidden',
                                  active && 'dark:text-[#beeed5]',
                                )}
                              >
                                {p.name}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5 group-data-[collapsible=icon]/sidebar:hidden">
                              <SidebarMenuBadge isActive={active}>{pkgCount}</SidebarMenuBadge>
                              {active && (
                                <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/80 dark:text-[#beeed5]/80" />
                              )}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            </div>
          ))}
        </SidebarContent>

        {/* 하단 SMB 세션 푸터 + 제작자 크레딧 (플로팅 패널 내부 일체형) */}
        <SidebarFooter>
          {isCollapsedDesktop ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center py-0.5">
                  <div className="relative">
                    <Avatar className="h-8.5 w-8.5 shadow-2xs">
                      <AvatarFallback>
                        <Server className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar-bg',
                        uncDisplay ? 'bg-accent-emerald' : 'bg-amber-400',
                      )}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="space-y-0.5">
                  <div className="font-semibold">{usernameMasked || 'Sample Guest'}</div>
                  <div className="font-mono text-[11px] opacity-85">
                    {uncDisplay ?? 'Simulated Release Storage'}
                  </div>
                  <div className="pt-0.5 text-[10px] opacity-75">🛠️ Sample Edition · Built by yikim</div>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card-elevated/70 px-2.5 py-2">
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 shadow-2xs">
                    <AvatarFallback>
                      <Server className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card-elevated',
                      uncDisplay ? 'bg-accent-emerald' : 'bg-amber-400',
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {usernameMasked || 'Sample Guest'}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {formatShortTime(scannedAtIso)}
                    </span>
                  </div>
                  <div
                    className="truncate font-mono text-[11px] text-muted-foreground"
                    title={uncDisplay ?? 'Simulated Storage'}
                  >
                    {uncDisplay ?? 'Simulated Release Storage'}
                  </div>
                </div>
              </div>
              <div className="mt-2 px-1 text-center text-[11px] tracking-tight text-muted-foreground/85">
                🛠️ Sample Edition · Built by yikim
              </div>
            </div>
          )}
        </SidebarFooter>

        {/* 우측 테두리 클릭으로도 접기/펼치기 가능한 공식 SidebarRail */}
        <SidebarRail />
      </Sidebar>

      {/* 우측 메인 영역 (shadcn/ui 공식 SidebarTrigger + Separator + Breadcrumb 슬림 헤더 바) */}
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-13 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-xs sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-4 bg-border" />
            <Breadcrumb>
              <BreadcrumbList>
                {pathname === '/' ? (
                  <>
                    <BreadcrumbItem className="hidden sm:inline-flex">
                      <span className="font-medium text-muted-foreground">App Release</span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden sm:inline-flex" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href="/">Dashboard</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {categoryBadge && (
                      <>
                        <BreadcrumbSeparator className="hidden sm:inline-flex" />
                        <BreadcrumbItem className="hidden sm:inline-flex">
                          <span>{categoryBadge}</span>
                        </BreadcrumbItem>
                      </>
                    )}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* 우측 상단 액션 */}
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="h-8 w-8 rounded-lg"
                  aria-label="빠른 검색"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">빠른 검색 (Ctrl+K)</TooltipContent>
            </Tooltip>

            {/* 다크 / 라이트 모드 전환 토글 */}
            <ThemeToggle />

            {elapsedMs !== undefined && (
              <Badge
                variant="outline"
                className="hidden h-8 gap-1.5 rounded-lg border-border bg-accent/25 px-3 font-mono text-xs font-medium text-accent-foreground sm:inline-flex"
              >
                <span className="live-pulse-dot h-2 w-2 rounded-full bg-primary" />
                <span>Demo Store · {elapsedMs} ms</span>
              </Badge>
            )}

            <Button type="button" size="sm" onClick={handleGlobalRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              <span>{refreshing ? '스캔 중...' : '다시 스캔'}</span>
            </Button>
          </div>
        </header>

        {/* 본문 타이틀 + 페이지 컨텐츠 */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col space-y-5 px-4 py-5 sm:px-6 lg:px-7">
          <ScrollReveal key={pathname} variant="down">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {pageTitle}
                  </h1>
                  {categoryBadge && <Badge variant="mint">{categoryBadge}</Badge>}
                </div>
                {pageSubtitle && (
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{pageSubtitle}</p>
                )}
              </div>
            </div>
          </ScrollReveal>

          <div className="flex-1 space-y-5 pb-4">{children}</div>
        </div>
      </SidebarInset>

      {/* 전역 ⌘K 빠른 검색 CommandDialog */}
      <CommandSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        products={navProducts}
        files={files}
      />
    </>
  );
}

export default function AppShell({ products, ...rest }: AppShellProps) {
  const navProducts: ProductGroupSummary[] =
    products.length > 0
      ? products
      : PRODUCT_DEFINITIONS.map((d) => ({
          slug: d.slug,
          name: d.name,
          description: d.description,
          category: d.category,
          folders: d.folders,
          presentFolders: d.folders,
          installerCount: 0,
          firmwareCount: 0,
          disabledCount: 0,
          docCount: 0,
          totalFileCount: 0,
          totalSizeBytes: 0,
          variantTypes: [],
          latestFile: null,
          latestVersion: null,
          latestMtimeIso: null,
        }));

  return (
    <SidebarProvider defaultOpen>
      <AppShellInner navProducts={navProducts} {...rest} />
    </SidebarProvider>
  );
}
