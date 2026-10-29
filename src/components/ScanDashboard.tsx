'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Database,
  FileArchive,
  FileText,
  FolderTree,
  HardDrive,
  PackageCheck,
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
import { Progress } from '@/components/ui/progress';
import {
  AnimatedNumber,
  ScrollReveal,
  useRevealState,
} from '@/components/ui/scroll-reveal';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  buildReleaseDocIndex,
  findReleaseDocForFile,
} from '@/lib/release-note-matcher';
import type {
  ClassifiedFileItem,
  ModelScanSummary,
  ScanErrorCode,
  ScanSummary,
} from '@/lib/smb-scanner';

export interface InitialScanState {
  summary: ScanSummary | null;
  error: {
    code: ScanErrorCode;
    message: string;
    endpointDisplay: string;
  } | null;
}

type SortKey = 'model' | 'installerCount' | 'totalSizeBytes' | 'latestMtimeIso';
type SortDir = 'asc' | 'desc';
type ChartMode = 'count' | 'size';

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

function formatCompactBytes(bytes: number): string {
  if (bytes === 0) return '0B';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)}G`;
  const mb = bytes / 1024 ** 2;
  if (mb >= 1) return `${Math.round(mb)}M`;
  return `${Math.round(bytes / 1024)}K`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface DonutArcItem {
  label: string;
  color: string;
  radius: number;
  circumference: number;
  dashLength: number;
  strokeDashoffset: number;
}

function DonutRingVisual({
  arcs,
  totalFiles,
}: {
  arcs: DonutArcItem[];
  totalFiles: number;
}) {
  const { visible: isVisible, delayMs: parentDelayMs } = useRevealState();

  return (
    <div className="my-4 flex items-center justify-center">
      <div className="relative flex h-34 w-34 items-center justify-center">
        <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
          <circle
            cx="55"
            cy="55"
            r="44"
            fill="none"
            stroke="currentColor"
            className="text-border/80"
            strokeWidth="11"
          />
          {arcs.map((arc, idx) => (
            <circle
              key={arc.label}
              cx="55"
              cy="55"
              r={arc.radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="11"
              strokeDasharray={`${isVisible ? arc.dashLength : 0} ${arc.circumference}`}
              strokeDashoffset={arc.strokeDashoffset}
              strokeLinecap="butt"
              style={{
                transition: `stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${parentDelayMs + 140 + idx * 75}ms`,
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-medium text-muted-foreground">Total</span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            <AnimatedNumber value={totalFiles} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScanDashboard({ initialState }: { initialState: InitialScanState }) {
  const [summary, setSummary] = useState<ScanSummary | null>(initialState.summary);
  const [error, setError] = useState<InitialScanState['error']>(initialState.error);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('latestMtimeIso');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [chartMode, setChartMode] = useState<ChartMode>('count');

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [activeNoteDoc, setActiveNoteDoc] = useState<ClassifiedFileItem | null>(null);
  const [activeSiblingDocs, setActiveSiblingDocs] = useState<ClassifiedFileItem[]>([]);
  const [activeNoteTitle, setActiveNoteTitle] = useState<string>('릴리즈 노트');

  const docIndex = useMemo(() => buildReleaseDocIndex(summary?.files ?? []), [summary]);

  function openInstallerNote(installer: ClassifiedFileItem, doc: ClassifiedFileItem) {
    const siblings =
      docIndex.docsByModel.get(installer.model) ??
      docIndex.docsByProductSlug.get(installer.productSlug) ??
      [doc];
    setActiveNoteDoc(doc);
    setActiveSiblingDocs(siblings);
    setActiveNoteTitle(installer.model);
    setNoteDialogOpen(true);
  }

  function openModelNotes(modelName: string, productName: string) {
    const docs = docIndex.docsByModel.get(modelName) ?? [];
    if (docs.length === 0) return;
    setActiveNoteDoc(docs[0]);
    setActiveSiblingDocs(docs);
    setActiveNoteTitle(productName || modelName);
    setNoteDialogOpen(true);
  }

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

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(nextKey);
      setSortDir(nextKey === 'model' ? 'asc' : 'desc');
    }
  }

  const filteredModels = useMemo<ModelScanSummary[]>(() => {
    if (!summary) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? summary.models.filter(
          (m) =>
            m.model.toLowerCase().includes(q) ||
            m.productName.toLowerCase().includes(q) ||
            (m.latestFile && m.latestFile.toLowerCase().includes(q)) ||
            m.sampleSubFolders.some((sf) => sf.toLowerCase().includes(q)),
        )
      : summary.models;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'model') {
        cmp = a.model.localeCompare(b.model, 'en', { sensitivity: 'base' });
      } else if (sortKey === 'installerCount') {
        cmp = a.installerCount - b.installerCount;
      } else if (sortKey === 'totalSizeBytes') {
        cmp = a.totalSizeBytes - b.totalSizeBytes;
      } else {
        cmp = (a.latestMtimeIso ?? '').localeCompare(b.latestMtimeIso ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [summary, query, sortKey, sortDir]);

  const sortedExtensions = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.extensionCounts).sort((a, b) => b[1] - a[1]);
  }, [summary]);

  const metrics = useMemo(() => {
    if (!summary) return null;
    const pkgFiles = summary.files.filter((f) => f.kind === 'installer' || f.kind === 'firmware');
    const versionedCount = pkgFiles.filter((f) => Boolean(f.version)).length;
    const versionRate =
      pkgFiles.length > 0 ? Math.round((versionedCount / pkgFiles.length) * 100) : 0;

    const activeProducts = summary.products.filter(
      (p) => p.installerCount + p.firmwareCount > 0,
    ).length;
    const productCoverage =
      summary.products.length > 0
        ? Math.round((activeProducts / summary.products.length) * 100)
        : 0;

    const installerRatio =
      summary.totalFiles > 0 ? Math.round((summary.totalInstallers / summary.totalFiles) * 100) : 0;

    const storageGauge = Math.min(
      100,
      Math.max(8, Math.round((summary.totalSizeBytes / (20 * 1024 ** 3)) * 100)),
    );
    const storageParts = splitBytes(summary.totalSizeBytes);

    const docFiles = summary.files.filter((f) => f.kind === 'doc').length;
    const fwFiles = summary.totalFirmwares;
    const otherFiles = Math.max(
      0,
      summary.totalFiles - summary.totalInstallers - docFiles - fwFiles,
    );

    const segments = [
      { label: '인스톨러 (.exe/.zip)', count: summary.totalInstallers, color: '#2b7f5c' },
      { label: '릴리즈 문서 (.md/.txt)', count: docFiles, color: '#e68a2e' },
      { label: '펌웨어 (.bin)', count: fwFiles, color: '#3b82f6' },
      { label: '기타 리소스', count: otherFiles, color: '#7c5dfa' },
    ].map((s) => ({
      ...s,
      pct: summary.totalFiles > 0 ? Math.round((s.count / summary.totalFiles) * 100) : 0,
    }));

    return {
      totalPkg: pkgFiles.length,
      versionedCount,
      versionRate,
      activeProducts,
      productCoverage,
      installerRatio,
      storageGauge,
      storageParts,
      segments,
      latestRelease: summary.recentInstallers[0] ?? null,
    };
  }, [summary]);

  const donutArcs = useMemo<DonutArcItem[]>(() => {
    if (!metrics || !summary || summary.totalFiles === 0) return [];
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return metrics.segments
      .filter((s) => s.count > 0)
      .map((s) => {
        const fraction = s.count / summary.totalFiles;
        const dashLength = Math.max(2, fraction * circumference - 3);
        const strokeDashoffset = -cumulative * circumference;
        cumulative += fraction;
        return {
          label: s.label,
          color: s.color,
          radius,
          circumference,
          dashLength,
          strokeDashoffset,
        };
      });
  }, [metrics, summary]);

  const maxChartValue = useMemo(() => {
    if (!summary || summary.products.length === 0) return 1;
    if (chartMode === 'count') {
      return Math.max(1, ...summary.products.map((p) => p.installerCount + p.firmwareCount));
    }
    return Math.max(1, ...summary.products.map((p) => p.totalSizeBytes));
  }, [summary, chartMode]);

  return (
    <AppShell
      products={summary?.products ?? []}
      files={summary?.files ?? []}
      totalInstallers={summary?.totalInstallers ?? 0}
      uncDisplay={summary?.uncDisplay}
      usernameMasked={summary?.usernameMasked}
      elapsedMs={summary?.elapsedMs}
      scannedAtIso={summary?.scannedAtIso}
      pageTitle="Release Dashboard"
      pageSubtitle="인더스트리얼 소프트웨어 및 펌웨어 패키지 배포 현황 및 버전 관리 대시보드 (Sample Edition)"
      onRefreshComplete={syncLatestScan}
    >
      {/* 오류 / 자격증명 안내 배너 */}
      {error && (
        <ScrollReveal>
          <Alert variant="warning">
            <AlertTriangle className="h-4.5 w-4.5" />
            <AlertTitle>배포 스토리지 연결 확인 필요 ({error.code})</AlertTitle>
            <AlertDescription className="mt-1.5 space-y-2">
              <p className="text-amber-800">{error.message}</p>
              {error.endpointDisplay && (
                <p className="font-mono text-xs text-amber-700">
                  대상 엔드포인트: {error.endpointDisplay}
                </p>
              )}
              <div className="mt-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-card-elevated/90 p-3 font-mono text-xs text-foreground">
                <div># 환경변수 (.env) 설정 예시</div>
                <div>STORAGE_HOST=storage.enterprise.internal</div>
                <div>STORAGE_SHARE=Distribution</div>
                <div>STORAGE_BASE_PATH=Releases</div>
                <div className="font-semibold text-primary">STORAGE_USERNAME=guest</div>
                <div className="font-semibold text-primary">STORAGE_PASSWORD=********</div>
              </div>
            </AlertDescription>
          </Alert>
        </ScrollReveal>
      )}

      {summary && metrics && (
        <>
          {/* ==============================================================
              상단 Medonix Bento 그리드 (초기 뷰포트 위->아래 순차 페이드인 + 카운트업)
              ============================================================== */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {/* 좌측 컬럼: 2x2 KPI 카드 + 최신 등록 릴리즈 카드 */}
            <div className="flex min-w-0 flex-col gap-4 xl:col-span-5">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* KPI 1 */}
                <ScrollReveal className="h-full">
                  <Card className="h-full bg-card-elevated/90 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                        <FolderTree className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-foreground">제품군 페이지</span>
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        <AnimatedNumber value={summary.products.length} />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        / {summary.totalModels}개 폴더
                      </span>
                    </div>
                    <Progress value={metrics.productCoverage} className="mt-2.5" />
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-primary">
                        하위 {summary.totalDirectories}개
                      </span>
                      <span>디렉토리 스캔됨</span>
                    </div>
                  </Card>
                </ScrollReveal>

                {/* KPI 2 */}
                <ScrollReveal className="h-full">
                  <Card className="h-full bg-card-elevated/90 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/40 text-primary dark:bg-accent/25 dark:text-accent-emerald">
                        <FileArchive className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-foreground">배포 인스톨러</span>
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        <AnimatedNumber value={summary.totalInstallers} />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        (+FW {summary.totalFirmwares})
                      </span>
                    </div>
                    <Progress value={metrics.installerRatio} className="mt-2.5" />
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-primary">{metrics.installerRatio}%</span>
                      <span>전체 {summary.totalFiles}개 파일 중</span>
                    </div>
                  </Card>
                </ScrollReveal>

                {/* KPI 3 */}
                <ScrollReveal className="h-full">
                  <Card className="h-full bg-card-elevated/90 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                        <PackageCheck className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-foreground">버전 자동 인식</span>
                    </div>
                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        <AnimatedNumber value={metrics.versionRate} suffix="%" />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">추출 성공</span>
                    </div>
                    <Progress value={metrics.versionRate} className="mt-2.5" />
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-primary">
                        {metrics.versionedCount}/{metrics.totalPkg}개
                      </span>
                      <span>버전 태깅 완료</span>
                    </div>
                  </Card>
                </ScrollReveal>

                {/* KPI 4 */}
                <ScrollReveal className="h-full">
                  <Card className="h-full bg-card-elevated/90 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        <HardDrive className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-foreground">스토리지 점유</span>
                    </div>
                    <div className="mt-3.5 text-2xl font-bold tracking-tight text-foreground">
                      <AnimatedNumber
                        value={metrics.storageParts.value}
                        decimals={metrics.storageParts.decimals}
                        suffix={` ${metrics.storageParts.unit}`}
                      />
                    </div>
                    <Progress value={metrics.storageGauge} className="mt-2.5" />
                    <div className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate font-mono text-[11px] text-primary">
                        {summary.endpointDisplay}
                      </span>
                    </div>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Latest Release 하이라이트 카드 */}
              {metrics.latestRelease && (
                <ScrollReveal className="flex flex-1 flex-col">
                  <Card className="flex flex-1 flex-col justify-between bg-card-elevated/90 p-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          최신 배포 릴리즈
                        </span>
                        <Badge variant="mint">LATEST UPDATE</Badge>
                      </div>
                      <div className="mt-3.5 flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold tracking-tight text-primary">
                              {metrics.latestRelease.model}
                            </span>
                            {metrics.latestRelease.version && (
                              <span className="font-mono text-sm font-semibold text-foreground">
                                v{metrics.latestRelease.version}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 min-w-0">
                            <FileDownloadLink
                              relativePath={metrics.latestRelease.relativePath}
                              fileName={metrics.latestRelease.fileName}
                              sizeBytes={metrics.latestRelease.sizeBytes}
                              truncate
                              className="font-mono text-xs text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {(() => {
                        const latestDoc = findReleaseDocForFile(metrics.latestRelease, docIndex);
                        return latestDoc ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openInstallerNote(metrics.latestRelease!, latestDoc)}
                            className="h-10 shrink-0 gap-1.5 rounded-xl bg-card-elevated px-3.5 text-xs font-semibold text-primary hover:text-primary"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>릴리즈 노트</span>
                          </Button>
                        ) : null;
                      })()}

                      <Button
                        asChild
                        variant="soft"
                        className="h-10 min-w-0 flex-1 justify-between rounded-xl px-4 text-xs font-semibold"
                      >
                        <Link href={`/products/${metrics.latestRelease.productSlug}`}>
                          <span className="truncate">
                            {metrics.latestRelease.variantType} ·{' '}
                            {formatDateTime(metrics.latestRelease.mtimeIso)} 배포 내역 보기
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </ScrollReveal>
              )}
            </div>

            {/* 우측 컬럼: 아티팩트 구성 도넛 + 제품군별 Vertical 캡슐 바 차트 */}
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-12 xl:col-span-7">
              {/* 파일 구성 도넛 카드 */}
              <ScrollReveal
                variant="scale"
                className="flex min-w-0 flex-col md:col-span-5"
              >
                <Card className="flex h-full min-w-0 flex-col justify-between bg-card-elevated/90 p-5">
                  <div>
                    <CardTitle className="text-base">파일 유형 구성</CardTitle>
                    <CardDescription className="mt-1">
                      Release 공유폴더 전체 아티팩트 비율
                    </CardDescription>
                  </div>

                  <DonutRingVisual arcs={donutArcs} totalFiles={summary.totalFiles} />

                  <div className="space-y-2.5">
                    {metrics.segments.map((seg) => (
                      <div key={seg.label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-2 w-4 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-muted-foreground">{seg.label}</span>
                        </div>
                        <div className="font-mono font-semibold text-foreground">
                          {seg.pct}%{' '}
                          <span className="font-normal text-muted-foreground">({seg.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </ScrollReveal>

              {/* 제품군별 패키지 분포 (순차 캡슐 게이지 애니메이션) */}
              <ScrollReveal
                variant="scale"
                className="flex min-w-0 flex-col md:col-span-7"
              >
                <Card className="flex h-full min-w-0 flex-col justify-between overflow-hidden bg-card-elevated/90 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">제품군별 패키지 분포</CardTitle>
                      <CardDescription className="mt-1">
                        항목을 클릭하면 해당 제품 릴리즈 페이지로 이동합니다
                      </CardDescription>
                    </div>

                    <Tabs
                      value={chartMode}
                      onValueChange={(v) => setChartMode(v as ChartMode)}
                    >
                      <TabsList>
                        <TabsTrigger value="count">패키지 수</TabsTrigger>
                        <TabsTrigger value="size">용량 비중</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5">
                    {[...summary.products]
                      .sort((a, b) =>
                        chartMode === 'count'
                          ? b.installerCount +
                            b.firmwareCount -
                            (a.installerCount + a.firmwareCount)
                          : b.totalSizeBytes - a.totalSizeBytes,
                      )
                      .map((p, idx) => {
                        const rawVal =
                          chartMode === 'count'
                            ? p.installerCount + p.firmwareCount
                            : p.totalSizeBytes;
                        const widthPct =
                          rawVal === 0 ? 0 : Math.max(5, Math.round((rawVal / maxChartValue) * 100));
                        const valueLabel =
                          chartMode === 'count'
                            ? `${p.installerCount + p.firmwareCount}개`
                            : formatCompactBytes(p.totalSizeBytes);

                        return (
                          <Tooltip key={p.slug}>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/products/${p.slug}`}
                                className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent/30 dark:hover:bg-[#203328]"
                              >
                                <span className="w-28 shrink-0 truncate text-xs font-medium text-foreground transition-colors group-hover:font-semibold group-hover:text-primary sm:w-32">
                                  {p.name}
                                </span>
                                <Progress
                                  value={widthPct}
                                  delayMs={100 + idx * 45}
                                  className="h-2.5 min-w-0 flex-1 bg-muted"
                                  indicatorClassName="bg-gradient-to-r from-primary via-accent-emerald to-[#7fd3b0] group-hover:brightness-105"
                                />
                                <span className="w-12 shrink-0 text-right font-mono text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                                  {valueLabel}
                                </span>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {p.name} · 패키지 {p.installerCount + p.firmwareCount}개 (
                              {formatBytes(p.totalSizeBytes)})
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>

                  <div className="mt-4 space-y-3">
                    <Separator className="bg-border/70" />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          인스톨러 · 펌웨어 합산
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-accent-emerald" />
                          실시간 스토리지 집계
                        </span>
                      </div>
                      <span className="font-mono text-[11px]">
                        스캔 기준: {formatDateTime(summary.scannedAtIso)}
                      </span>
                    </div>
                  </div>
                </Card>
              </ScrollReveal>
            </div>
          </section>

          {/* ==============================================================
              제품별 바로가기 카드 그리드 (스크롤 진입 시 줄·카드 단위 웨이브 등장)
              ============================================================== */}
          <section className="space-y-3">
            <ScrollReveal>
              <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    제품별 릴리즈 페이지
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    특정 제품군의 버전 히스토리 및 모델·타입별 패키지를 모아서 조회합니다
                  </p>
                </div>
                <Badge variant="outline">{summary.products.length}개 제품군 운영 중</Badge>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {summary.products.map((p) => (
                <ScrollReveal key={p.slug} className="h-full">
                  <Link href={`/products/${p.slug}`} className="group block h-full">
                    <Card className="flex h-full flex-col justify-between bg-card-elevated/95 p-4.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/45 group-hover:shadow-sm">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <span className="truncate font-bold text-foreground transition-colors group-hover:text-primary">
                              {p.name}
                            </span>
                          </div>
                          <Badge variant="mint" className="shrink-0 font-mono">
                            {p.installerCount + p.firmwareCount}개
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        <Separator className="bg-border/70" />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-mono font-semibold text-primary">
                            {p.latestVersion ? `v${p.latestVersion}` : p.category}
                          </span>
                          <span className="font-mono">{formatDateTime(p.latestMtimeIso)}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ==============================================================
              공유폴더 원본 모델별 스캔 요약 테이블 (스크롤 진입 시 페이드인)
              ============================================================== */}
          <ScrollReveal>
            <Card className="overflow-hidden bg-card-elevated/95">
              <CardHeader className="space-y-3 border-b border-border/80 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>공유폴더 모델별 스캔 요약</CardTitle>
                    <CardDescription className="mt-1">
                      Release 최상위 디렉토리({filteredModels.length} / {summary.models.length}개)
                      기준 원본 집계 · 파일명을 클릭하면 바로 다운로드됩니다
                    </CardDescription>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="모델명, 제품군, 최신 파일 검색..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="mr-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Database className="h-3.5 w-3.5 text-primary" />
                    확장자 분포:
                  </span>
                  {sortedExtensions.map(([ext, count]) => (
                    <Badge
                      key={ext}
                      variant="outline"
                      className="gap-1.5 rounded-lg bg-muted/50 px-2.5 py-0.5 font-normal"
                    >
                      <span className="font-mono font-medium text-foreground">{ext}</span>
                      <span className="rounded-md bg-accent/80 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-accent-foreground">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('model')}
                        className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        폴더명 (제품군)
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('installerCount')}
                        className="-mr-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        인스톨러 / 전체
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">릴리즈 문서</TableHead>
                    <TableHead className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('totalSizeBytes')}
                        className="-mr-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        총 용량
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('latestMtimeIso')}
                        className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        최신 수정일
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </TableHead>
                    <TableHead>최신 인스톨러 파일</TableHead>
                    <TableHead className="pr-5">하위 분류 예시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="whitespace-nowrap pl-5">
                        <Link
                          href={`/products/${m.productSlug}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {m.model}
                        </Link>
                        {m.productName !== m.model && (
                          <Badge variant="mint" className="ml-2 text-[10px]">
                            {m.productName}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                        <span className="font-semibold text-primary">{m.installerCount}</span>
                        <span className="text-muted-foreground"> / {m.fileCount}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-xs text-muted-foreground">
                        {m.docCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => openModelNotes(m.model, m.productName)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-primary transition-colors hover:bg-accent/75 hover:underline dark:hover:bg-[#20362c] dark:hover:text-[#4ade80]"
                            title={`${m.model} 릴리즈 문서 열람`}
                          >
                            <FileText className="h-3 w-3" />
                            <span>{m.docCount}개</span>
                          </button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                        {formatBytes(m.totalSizeBytes)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatDateTime(m.latestMtimeIso)}
                      </TableCell>
                      <TableCell className="max-w-xs font-mono text-xs font-medium">
                        {m.latestFile && m.latestRelativePath ? (
                          <FileDownloadLink
                            relativePath={m.latestRelativePath}
                            fileName={m.latestFile}
                            sizeBytes={m.latestSizeBytes}
                            truncate
                          />
                        ) : (
                          <span>{m.latestFile ?? '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex flex-wrap gap-1">
                          {m.sampleSubFolders.length > 0 ? (
                            m.sampleSubFolders.map((sf) => (
                              <Badge
                                key={sf}
                                variant="secondary"
                                className="max-w-[150px] truncate rounded-md font-mono text-[11px] font-normal"
                                title={sf}
                              >
                                {sf}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">(루트 직하)</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredModels.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        검색 조건과 일치하는 모델이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </ScrollReveal>

          {/* ==============================================================
              최근 등록·수정된 인스톨러 TOP 15 (스크롤 진입 시 페이드인)
              ============================================================== */}
          <ScrollReveal>
            <Card className="overflow-hidden bg-card-elevated/95">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle>
                  최근 등록·수정된 인스톨러 TOP {summary.recentInstallers.length}
                </CardTitle>
                <CardDescription className="mt-1">
                  전체 모델 통틀어 가장 최근에 배포된 패키지 목록 · 파일명 클릭 시 다운로드
                </CardDescription>
              </CardHeader>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">제품 / 모델</TableHead>
                    <TableHead>타입 (브랜치)</TableHead>
                    <TableHead>버전</TableHead>
                    <TableHead>파일명</TableHead>
                    <TableHead>릴리즈 노트</TableHead>
                    <TableHead className="text-right">크기</TableHead>
                    <TableHead className="pr-5">수정일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recentInstallers.map((item) => {
                    const matchedDoc = findReleaseDocForFile(item, docIndex);
                    return (
                      <TableRow key={item.relativePath}>
                        <TableCell className="whitespace-nowrap pl-5">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {item.model}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="rounded-md font-mono text-[11px]">
                            {item.variantType}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-primary">
                          {item.version ? `v${item.version}` : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          <FileDownloadLink
                            relativePath={item.relativePath}
                            fileName={item.fileName}
                            sizeBytes={item.sizeBytes}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {matchedDoc ? (
                            <Button
                              type="button"
                              variant="soft"
                              size="sm"
                              onClick={() => openInstallerNote(item, matchedDoc)}
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
                          {formatBytes(item.sizeBytes)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap pr-5 font-mono text-xs text-muted-foreground">
                          {formatDateTime(item.mtimeIso)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </ScrollReveal>

          <ReleaseNoteDialog
            open={noteDialogOpen}
            onOpenChange={setNoteDialogOpen}
            initialDoc={activeNoteDoc}
            siblingDocs={activeSiblingDocs}
            productLabel={activeNoteTitle}
          />
        </>
      )}
    </AppShell>
  );
}
