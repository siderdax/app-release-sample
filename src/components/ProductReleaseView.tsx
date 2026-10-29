'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUpRight,
  Cpu,
  FileArchive,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import FileDownloadLink from '@/components/FileDownloadLink';
import ReleaseNoteDialog from '@/components/ReleaseNoteDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AnimatedNumber, ScrollReveal } from '@/components/ui/scroll-reveal';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { compareVersions } from '@/lib/release-classifier';
import {
  buildReleaseDocIndex,
  findReleaseDocForFile,
} from '@/lib/release-note-matcher';
import { cn } from '@/lib/utils';
import type {
  ClassifiedFileItem,
  ProductGroupSummary,
  ScanErrorCode,
  ScanSummary,
} from '@/lib/smb-scanner';

interface ProductReleaseViewProps {
  slug: string;
  initialSummary: ScanSummary | null;
  initialError: {
    code: ScanErrorCode;
    message: string;
    endpointDisplay: string;
  } | null;
}

type SortKey = 'mtimeIso' | 'version' | 'variantType' | 'fileName' | 'sizeBytes';
type SortDir = 'asc' | 'desc';
type KindFilter = 'all_pkg' | 'installer' | 'firmware';

function splitBytes(bytes: number): { value: number; decimals: number; unit: string } {
  if (bytes === 0) return { value: 0, decimals: 0, unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return {
    value: bytes / Math.pow(1024, i),
    decimals: i === 0 ? 0 : 2,
    unit: units[i],
  };
}

function formatBytes(bytes: number): string {
  const { value, decimals, unit } = splitBytes(bytes);
  return `${value.toFixed(decimals)} ${unit}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProductReleaseView({
  slug,
  initialSummary,
  initialError,
}: ProductReleaseViewProps) {
  const [summary, setSummary] = useState<ScanSummary | null>(initialSummary);
  const [error, setError] = useState(initialError);

  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [selectedVariant, setSelectedVariant] = useState<string>('ALL');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all_pkg');
  const [includeDisabled, setIncludeDisabled] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('mtimeIso');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [activeNoteDoc, setActiveNoteDoc] = useState<ClassifiedFileItem | null>(null);

  const docIndex = useMemo(() => buildReleaseDocIndex(summary?.files ?? []), [summary]);

  const productDocs = useMemo(() => {
    const allForProduct = docIndex.docsByProductSlug.get(slug) ?? [];
    if (selectedFolder !== 'ALL') {
      return allForProduct.filter((d) => d.model === selectedFolder);
    }
    return allForProduct;
  }, [docIndex, slug, selectedFolder]);

  function openReleaseNote(doc: ClassifiedFileItem) {
    setActiveNoteDoc(doc);
    setNoteDialogOpen(true);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get('q');
    if (initialQ) {
      setQuery(initialQ);
    }
    const docParam = params.get('doc');
    if (docParam) {
      const targetDoc = docIndex.docsByPath.get(docParam);
      if (targetDoc) {
        openReleaseNote(targetDoc);
      }
    }
  }, [slug, docIndex]);

  async function syncLatestScan() {
    try {
      const res = await fetch('/api/scan', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok && data.summary) {
        setSummary(data.summary);
        setError(null);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError({
        code: 'CONNECTION_FAILED',
        message: err instanceof Error ? err.message : '네트워크 요청 실패',
        endpointDisplay: summary?.endpointDisplay ?? '',
      });
    }
  }

  const product: ProductGroupSummary | null = useMemo(() => {
    if (!summary) return null;
    return summary.products.find((p) => p.slug === slug) ?? null;
  }, [summary, slug]);

  const baseProductFiles = useMemo<ClassifiedFileItem[]>(() => {
    if (!summary) return [];
    return summary.files.filter((f) => {
      if (f.productSlug !== slug) return false;
      if (f.kind === 'installer' || f.kind === 'firmware') return true;
      if (includeDisabled && f.kind === 'disabled') return true;
      return false;
    });
  }, [summary, slug, includeDisabled]);

  const latestPathSet = useMemo(() => {
    const latestByKey = new Map<string, ClassifiedFileItem>();
    for (const f of baseProductFiles) {
      if (f.kind === 'disabled') continue;
      const key = `${f.model}::${f.variantType}`;
      const cur = latestByKey.get(key);
      if (!cur || f.mtimeIso > cur.mtimeIso) {
        latestByKey.set(key, f);
      }
    }
    return new Set(Array.from(latestByKey.values()).map((f) => f.relativePath));
  }, [baseProductFiles]);

  const variantChips = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of baseProductFiles) {
      if (selectedFolder !== 'ALL' && f.model !== selectedFolder) continue;
      if (kindFilter === 'installer' && f.kind !== 'installer' && f.kind !== 'disabled') continue;
      if (kindFilter === 'firmware' && f.kind !== 'firmware') continue;
      map.set(f.variantType, (map.get(f.variantType) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [baseProductFiles, selectedFolder, kindFilter]);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of baseProductFiles) {
      map.set(f.model, (map.get(f.model) ?? 0) + 1);
    }
    return map;
  }, [baseProductFiles]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(nextKey);
      setSortDir(nextKey === 'fileName' || nextKey === 'variantType' ? 'asc' : 'desc');
    }
  }

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = baseProductFiles.filter((f) => {
      if (selectedFolder !== 'ALL' && f.model !== selectedFolder) return false;
      if (selectedVariant !== 'ALL' && f.variantType !== selectedVariant) return false;
      if (kindFilter === 'installer' && f.kind !== 'installer' && f.kind !== 'disabled')
        return false;
      if (kindFilter === 'firmware' && f.kind !== 'firmware') return false;

      if (q) {
        const match =
          f.fileName.toLowerCase().includes(q) ||
          f.variantType.toLowerCase().includes(q) ||
          f.model.toLowerCase().includes(q) ||
          f.decodedSubPath.toLowerCase().includes(q) ||
          (f.version && f.version.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'mtimeIso') {
        cmp = a.mtimeIso.localeCompare(b.mtimeIso);
      } else if (sortKey === 'version') {
        cmp = compareVersions(a.version, b.version) || a.mtimeIso.localeCompare(b.mtimeIso);
      } else if (sortKey === 'variantType') {
        cmp =
          a.variantType.localeCompare(b.variantType, 'en', { sensitivity: 'base' }) ||
          b.mtimeIso.localeCompare(a.mtimeIso);
      } else if (sortKey === 'fileName') {
        cmp = a.fileName.localeCompare(b.fileName, 'en', { sensitivity: 'base' });
      } else if (sortKey === 'sizeBytes') {
        cmp = a.sizeBytes - b.sizeBytes;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [baseProductFiles, selectedFolder, selectedVariant, kindFilter, query, sortKey, sortDir]);

  const multiFolder = (product?.presentFolders.length ?? 0) > 1;

  const productMetrics = useMemo(() => {
    if (!product || !summary) return null;
    const totalAllPkg = Math.max(1, summary.totalInstallers + summary.totalFirmwares);
    const productPkg = product.installerCount + product.firmwareCount;
    const pkgSharePct = Math.round((productPkg / totalAllPkg) * 100);
    const sizeSharePct =
      summary.totalSizeBytes > 0
        ? Math.round((product.totalSizeBytes / summary.totalSizeBytes) * 100)
        : 0;
    const versionedInProduct = baseProductFiles.filter((f) => Boolean(f.version)).length;
    const versionRate =
      baseProductFiles.length > 0
        ? Math.round((versionedInProduct / baseProductFiles.length) * 100)
        : 0;
    const variantGauge = Math.min(100, Math.max(12, product.variantTypes.length * 8));
    const sizeParts = splitBytes(product.totalSizeBytes);

    return {
      pkgSharePct: Math.max(6, pkgSharePct),
      rawPkgSharePct: pkgSharePct,
      sizeSharePct: Math.max(6, sizeSharePct),
      rawSizeSharePct: sizeSharePct,
      versionRate,
      variantGauge,
      sizeParts,
    };
  }, [product, summary, baseProductFiles]);

  return (
    <AppShell
      products={summary?.products ?? []}
      files={summary?.files ?? []}
      totalInstallers={summary?.totalInstallers ?? 0}
      uncDisplay={summary?.uncDisplay}
      usernameMasked={summary?.usernameMasked}
      elapsedMs={summary?.elapsedMs}
      scannedAtIso={summary?.scannedAtIso}
      pageTitle={product?.name ?? slug}
      pageSubtitle={product?.description ?? '제품별 인스톨러 및 버전 이력 조회'}
      categoryBadge={product?.category}
      onRefreshComplete={syncLatestScan}
    >
      {/* 오류 안내 배너 */}
      {error && (
        <ScrollReveal>
          <Alert variant="warning">
            <AlertTriangle className="h-4.5 w-4.5" />
            <AlertTitle>공유폴더 연결 오류 ({error.code})</AlertTitle>
            <AlertDescription className="mt-1 text-amber-800">{error.message}</AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {summary && !product && (
        <ScrollReveal>
          <Card className="bg-card-elevated p-10 text-center">
            <p className="text-base font-semibold text-foreground">
              요청하신 제품 페이지(<code className="font-mono text-primary">{slug}</code>)를 찾을
              수 없습니다.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              좌측 사이드 메뉴에서 다른 제품을 선택해 주세요.
            </p>
          </Card>
        </ScrollReveal>
      )}

      {product && productMetrics && (
        <>
          {/* ==============================================================
              제품 요약 Medonix KPI 4종 (순차 페이드인 + 카운트업)
              ============================================================== */}
          <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <ScrollReveal className="h-full">
              <Card className="h-full bg-card-elevated/95 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/40 text-primary dark:bg-accent/25 dark:text-accent-emerald">
                    <FileArchive className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">배포 패키지</span>
                </div>
                <div className="mt-3.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    <AnimatedNumber value={product.installerCount} />
                  </span>
                  {product.firmwareCount > 0 && (
                    <span className="font-mono text-xs font-semibold text-primary">
                      (+FW {product.firmwareCount})
                    </span>
                  )}
                </div>
                <Progress value={productMetrics.pkgSharePct} className="mt-2.5" />
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">
                    전체의 {productMetrics.rawPkgSharePct}%
                  </span>
                  <span>· 문서 {product.docCount}개</span>
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal className="h-full">
              <Card className="h-full bg-card-elevated/95 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">최신 릴리즈 버전</span>
                </div>
                <div className="mt-3.5 font-mono text-2xl font-bold tracking-tight text-foreground">
                  {product.latestVersion ? `v${product.latestVersion}` : '-'}
                </div>
                <Progress value={productMetrics.versionRate} className="mt-2.5" />
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono font-semibold text-primary">
                    {formatDateTime(product.latestMtimeIso)}
                  </span>
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal className="h-full">
              <Card className="h-full bg-card-elevated/95 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">세부 타입 · 브랜치</span>
                </div>
                <div className="mt-3.5 flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    <AnimatedNumber value={product.variantTypes.length} />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">종</span>
                </div>
                <Progress value={productMetrics.variantGauge} className="mt-2.5" />
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">
                    매핑 폴더 {product.presentFolders.length}개
                  </span>
                  <span>통합 관리</span>
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal className="h-full">
              <Card className="h-full bg-card-elevated/95 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    <HardDrive className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">제품 총 용량</span>
                </div>
                <div className="mt-3.5 text-2xl font-bold tracking-tight text-foreground">
                  <AnimatedNumber
                    value={productMetrics.sizeParts.value}
                    decimals={productMetrics.sizeParts.decimals}
                    suffix={` ${productMetrics.sizeParts.unit}`}
                  />
                </div>
                <Progress value={productMetrics.sizeSharePct} className="mt-2.5" />
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">
                    스토리지 {productMetrics.rawSizeSharePct}%
                  </span>
                  <span>점유 중</span>
                </div>
              </Card>
            </ScrollReveal>
          </section>

          {/* ==============================================================
              매핑 폴더 & 다차원 필터 카드
              ============================================================== */}
          <ScrollReveal>
            <Card className="space-y-4 bg-card-elevated/95 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                    배포 매핑 경로:
                  </span>
                  {product.presentFolders.map((folder) => (
                    <Badge
                      key={folder}
                      variant="outline"
                      className="rounded-lg border-border bg-accent/25 px-2.5 py-0.5 font-mono text-xs font-medium text-accent-foreground"
                    >
                      Release\{folder}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(selectedVariant !== 'ALL' || selectedFolder !== 'ALL' || query.trim()) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFolder('ALL');
                        setSelectedVariant('ALL');
                        setQuery('');
                      }}
                      className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
                    >
                      <RotateCcw className="h-3 w-3" />
                      필터 초기화
                    </Button>
                  )}

                  {productDocs.length > 0 && (
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      onClick={() => openReleaseNote(productDocs[0])}
                      className="h-7.5 gap-1.5 rounded-lg px-3 text-xs font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>릴리즈 노트 · 변경 이력 ({productDocs.length})</span>
                    </Button>
                  )}
                </div>
              </div>

              <Separator className="bg-border/70" />

              {multiFolder && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-semibold text-muted-foreground">
                    모델 폴더:
                  </span>
                  <Tabs
                    value={selectedFolder}
                    onValueChange={(next) => {
                      setSelectedFolder(next);
                      setSelectedVariant('ALL');
                    }}
                  >
                    <TabsList className="h-auto flex-wrap">
                      <TabsTrigger value="ALL">전체 ({baseProductFiles.length})</TabsTrigger>
                      {product.presentFolders.map((folder) => {
                        const cnt = folderCounts.get(folder) ?? 0;
                        return (
                          <TabsTrigger key={folder} value={folder} className="font-mono">
                            {folder} ({cnt})
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  <span>타입 · 브랜치 필터</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={selectedVariant}
                  onValueChange={(val) => setSelectedVariant(val || 'ALL')}
                >
                  <ToggleGroupItem value="ALL">전체 타입</ToggleGroupItem>
                  {variantChips.map((vt) => (
                    <ToggleGroupItem key={vt.name} value={vt.name} className="font-mono">
                      <span>{vt.name}</span>
                      <span className="opacity-75">({vt.count})</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <Separator className="bg-border/70" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-84">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="파일명, 버전(예: 2.0.0.3), 타입 검색..."
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {product.firmwareCount > 0 && (
                    <Tabs value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
                      <TabsList>
                        <TabsTrigger value="all_pkg">전체</TabsTrigger>
                        <TabsTrigger value="installer">인스톨러만</TabsTrigger>
                        <TabsTrigger value="firmware">펌웨어만</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {product.disabledCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="include-disabled-builds"
                        checked={includeDisabled}
                        onCheckedChange={setIncludeDisabled}
                      />
                      <Label
                        htmlFor="include-disabled-builds"
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        비활성 빌드(.exe1/.ex1) {product.disabledCount}개 포함
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </ScrollReveal>

          {/* ==============================================================
              인스톨러 · 버전 목록 테이블
              ============================================================== */}
          <ScrollReveal>
            <Card className="overflow-hidden bg-card-elevated/95">
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/80 pb-4">
                <div>
                  <CardTitle>인스톨러 · 버전 목록</CardTitle>
                  <CardDescription className="mt-1">
                    조건에 일치하는 패키지{' '}
                    <strong className="text-foreground">{filteredFiles.length}</strong>개 표시 ·
                    파일명을 클릭하면 다운로드됩니다
                  </CardDescription>
                </div>
                <Badge variant="mint">{filteredFiles.length} Items</Badge>
              </CardHeader>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {multiFolder && <TableHead className="pl-5">모델 폴더</TableHead>}
                    <TableHead className={!multiFolder ? 'pl-5' : undefined}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('variantType')}
                        className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        타입 / 브랜치
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('version')}
                        className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        버전
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('fileName')}
                        className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        파일명 / 상세 경로
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead>릴리즈 노트</TableHead>
                    <TableHead className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('sizeBytes')}
                        className="-mr-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        크기
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead className="pr-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('mtimeIso')}
                        className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        수정일시
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => {
                    const isLatest = latestPathSet.has(file.relativePath);
                    const matchedDoc = findReleaseDocForFile(file, docIndex);
                    return (
                      <TableRow key={file.relativePath}>
                        {multiFolder && (
                          <TableCell className="whitespace-nowrap pl-5 font-mono text-xs font-semibold text-foreground">
                            {file.model}
                          </TableCell>
                        )}
                        <TableCell className={cn('whitespace-nowrap', !multiFolder && 'pl-5')}>
                          <Badge variant="secondary" className="rounded-md font-mono text-xs">
                            {file.kind === 'firmware' && <Cpu className="h-3 w-3 text-primary" />}
                            {file.variantType}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-primary">
                              {file.version ? `v${file.version}` : '-'}
                            </span>
                            {isLatest && (
                              <Badge variant="mint" className="px-2 py-0 text-[10px]">
                                LATEST
                              </Badge>
                            )}
                            {file.kind === 'disabled' && (
                              <Badge variant="danger" className="px-2 py-0 text-[10px]">
                                비활성
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs font-semibold text-foreground">
                            <FileDownloadLink
                              relativePath={file.relativePath}
                              fileName={file.fileName}
                              sizeBytes={file.sizeBytes}
                            />
                          </div>
                          {file.decodedSubPath && (
                            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                              {file.model} / {file.decodedSubPath}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {matchedDoc ? (
                            <Button
                              type="button"
                              variant="soft"
                              size="sm"
                              onClick={() => openReleaseNote(matchedDoc)}
                              className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>노트 보기</span>
                            </Button>
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                          {formatBytes(file.sizeBytes)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap pr-5 font-mono text-xs text-muted-foreground">
                          {formatDateTime(file.mtimeIso)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredFiles.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={multiFolder ? 7 : 6}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        선택한 필터/검색 조건에 해당하는 파일이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </ScrollReveal>

          <ReleaseNoteDialog
            open={noteDialogOpen}
            onOpenChange={setNoteDialogOpen}
            initialDoc={activeNoteDoc}
            siblingDocs={productDocs}
            productLabel={product.name}
          />
        </>
      )}
    </AppShell>
  );
}
