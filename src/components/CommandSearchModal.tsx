'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ArrowRight, Boxes, Cpu, FileArchive, FileText, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { formatReleaseDocItemMeta } from '@/lib/release-note-matcher';
import type { ClassifiedFileItem, ProductGroupSummary } from '@/lib/smb-scanner';

interface CommandSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductGroupSummary[];
  files?: ClassifiedFileItem[];
}

export default function CommandSearchModal({
  open,
  onOpenChange,
  products,
  files = [],
}: CommandSearchModalProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const recentPackages = useMemo(() => {
    return files
      .filter((f) => f.kind === 'installer' || f.kind === 'firmware')
      .sort((a, b) => b.mtimeIso.localeCompare(a.mtimeIso))
      .slice(0, 60);
  }, [files]);

  const recentDocs = useMemo(() => {
    return files
      .filter((f) => f.kind === 'doc')
      .sort((a, b) => b.mtimeIso.localeCompare(a.mtimeIso))
      .slice(0, 40);
  }, [files]);

  function navigateTo(url: string) {
    onOpenChange(false);
    router.push(url);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="제품명, 모델 폴더, 파일명 또는 버전(예: 2.0.0.3) 검색..." />
      <CommandList>
        <CommandEmpty>일치하는 제품 또는 인스톨러를 찾지 못했습니다.</CommandEmpty>

        <CommandGroup heading="메인 이동">
          <CommandItem
            value="home dashboard 전체 요약 메인 대시보드"
            onSelect={() => navigateTo('/')}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/70 text-primary">
                <LayoutGrid className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold text-foreground">Release Dashboard (전체 요약)</span>
            </div>
            <CommandShortcut>Home</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={`제품 페이지 (${products.length})`}>
          {products.map((p) => (
            <CommandItem
              key={p.slug}
              value={`${p.name} ${p.slug} ${p.category} ${p.description} ${p.folders.join(' ')}`}
              onSelect={() => navigateTo(`/products/${p.slug}`)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/70 text-primary">
                  <Boxes className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-foreground">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">{p.category}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{p.description}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-2">
                <Badge variant="mint">{p.installerCount + p.firmwareCount}개</Badge>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {recentPackages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="배포 패키지 빠른 이동">
              {recentPackages.map((f) => (
                <CommandItem
                  key={f.relativePath}
                  value={`${f.fileName} ${f.model} ${f.variantType} ${f.version ?? ''}`}
                  onSelect={() =>
                    navigateTo(`/products/${f.productSlug}?q=${encodeURIComponent(f.fileName)}`)
                  }
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {f.kind === 'firmware' ? (
                        <Cpu className="h-3.5 w-3.5" />
                      ) : (
                        <FileArchive className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs font-semibold text-foreground">
                        {f.fileName}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {f.model} · {f.variantType}
                      </div>
                    </div>
                  </div>
                  {f.version && (
                    <Badge variant="secondary" className="shrink-0 font-mono text-[11px] text-primary">
                      v{f.version}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {recentDocs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="릴리즈 노트 · 체인지로그 열람">
              {recentDocs.map((doc) => {
                const meta = formatReleaseDocItemMeta(doc);
                return (
                  <CommandItem
                    key={doc.relativePath}
                    value={`노트 릴리즈 changelog ${meta.title} ${meta.subtitle} ${doc.relativePath} ${doc.version ?? ''}`}
                    onSelect={() =>
                      navigateTo(
                        `/products/${doc.productSlug}?doc=${encodeURIComponent(doc.relativePath)}`,
                      )
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/70 text-primary">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs font-semibold text-foreground">
                          {doc.model} · {meta.title}
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {meta.subtitle}
                        </div>
                      </div>
                    </div>
                    {meta.badgeText && (
                      <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                        {meta.badgeText}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
        <span>↑↓ 이동 · Enter 선택</span>
        <span className="font-mono">ESC 닫기 · Ctrl+K 열기</span>
      </div>
    </CommandDialog>
  );
}
