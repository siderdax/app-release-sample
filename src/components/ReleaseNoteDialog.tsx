'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  History,
  Loader2,
  Search,
} from 'lucide-react';
import ReleaseNoteContent from '@/components/ReleaseNoteContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { DetectedEncoding } from '@/lib/release-note-decoder';
import { formatReleaseDocItemMeta } from '@/lib/release-note-matcher';
import type { ClassifiedFileItem } from '@/lib/smb-scanner';
import { cn } from '@/lib/utils';

export interface LoadedReleaseNote {
  relativePath: string;
  fileName: string;
  format: 'markdown' | 'text';
  encoding: DetectedEncoding;
  sizeBytes: number;
  mtimeIso: string;
  cacheHit: boolean;
  elapsedMs: number;
  content: string;
}

interface ReleaseNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDoc: ClassifiedFileItem | null;
  siblingDocs?: ClassifiedFileItem[];
  productLabel?: string;
}

const clientNoteCache = new Map<string, LoadedReleaseNote>();

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ReleaseNoteDialog({
  open,
  onOpenChange,
  initialDoc,
  siblingDocs = [],
  productLabel,
}: ReleaseNoteDialogProps) {
  const [selectedDoc, setSelectedDoc] = useState<ClassifiedFileItem | null>(initialDoc);
  const [docSearch, setDocSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const [note, setNote] = useState<LoadedReleaseNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open && initialDoc) {
      setSelectedDoc(initialDoc);
      setDocSearch('');
    }
  }, [open, initialDoc]);

  const docList = useMemo(() => {
    if (siblingDocs.length > 0) return siblingDocs;
    return initialDoc ? [initialDoc] : [];
  }, [siblingDocs, initialDoc]);

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return docList;
    return docList.filter((d) => {
      const meta = formatReleaseDocItemMeta(d);
      return (
        meta.title.toLowerCase().includes(q) ||
        meta.subtitle.toLowerCase().includes(q) ||
        d.relativePath.toLowerCase().includes(q) ||
        (d.version && d.version.toLowerCase().includes(q))
      );
    });
  }, [docList, docSearch]);

  useEffect(() => {
    if (!open || !selectedDoc) return;
    const targetPath = selectedDoc.relativePath;

    const cached = clientNoteCache.get(targetPath);
    if (cached) {
      setNote(cached);
      setErrorMsg(null);
      setLoading(false);
      bodyScrollRef.current?.scrollTo({ top: 0 });
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/release-note?path=${encodeURIComponent(targetPath)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok || !data.note) {
          throw new Error(data?.error?.message ?? `문서 조회 실패 (HTTP ${res.status})`);
        }
        const loaded = data.note as LoadedReleaseNote;
        clientNoteCache.set(targetPath, loaded);
        setNote(loaded);
        bodyScrollRef.current?.scrollTo({ top: 0 });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMsg(err instanceof Error ? err.message : '릴리즈 노트를 불러오지 못했습니다.');
        setNote(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, selectedDoc]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      activeItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, 60);
    return () => window.clearTimeout(id);
  }, [open, selectedDoc?.relativePath]);

  async function handleCopy() {
    if (!note?.content) return;
    try {
      await navigator.clipboard.writeText(note.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  const showHistorySidebar = docList.length > 1;
  const activeMeta = selectedDoc ? formatReleaseDocItemMeta(selectedDoc) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[85vh] max-h-[860px] flex-col gap-0 overflow-hidden p-0',
          showHistorySidebar ? 'w-[95vw] max-w-6xl xl:max-w-7xl' : 'w-[94vw] max-w-4xl',
        )}
      >
        {/* 상단 헤더 */}
        <DialogHeader className="shrink-0 border-b border-border/85 bg-muted/40 px-5 py-4 pr-12">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                {selectedDoc?.extension === '.md' ? (
                  <FileCode2 className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-bold text-foreground dark:text-[#e0ebe5]">
                  <span className="truncate">
                    {productLabel ?? selectedDoc?.model ?? '릴리즈 노트'}
                  </span>
                  {activeMeta && (
                    <Badge variant="mint" className="font-mono text-xs">
                      {activeMeta.title}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-1 truncate font-mono text-[11px] text-muted-foreground dark:text-[#8ea299]">
                  {selectedDoc ? `Release/${selectedDoc.relativePath}` : '문서를 선택해 주세요'}
                </DialogDescription>
              </div>
            </div>

            {/* 우측 도구 모음 */}
            {selectedDoc && (
              <div className="flex flex-wrap items-center gap-1.5">
                {note && (
                  <Badge
                    variant="outline"
                    className="hidden rounded-lg border-border bg-card px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex"
                    title="자동 감지 및 UTF-8 정규화된 원본 문자 인코딩"
                  >
                    {note.encoding}
                  </Badge>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!note?.content}
                  className="h-7.5 gap-1.5 rounded-lg bg-card-elevated px-2.5 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span className="text-primary">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>복사</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="soft"
                  size="sm"
                  className="h-7.5 gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
                >
                  <a
                    href={`/api/download?path=${encodeURIComponent(selectedDoc.relativePath)}`}
                    download={selectedDoc.fileName}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">원본 저장</span>
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* 모바일 환경에서의 버전 스위처 */}
          {showHistorySidebar && (
            <div className="mt-3 md:hidden">
              <select
                value={selectedDoc?.relativePath ?? ''}
                onChange={(e) => {
                  const next = docList.find((d) => d.relativePath === e.target.value);
                  if (next) {
                    setSelectedDoc(next);
                  }
                }}
                aria-label="릴리즈 문서 버전 선택"
                className="h-8.5 w-full rounded-lg border border-border bg-card px-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {docList.map((d) => {
                  const m = formatReleaseDocItemMeta(d);
                  return (
                    <option key={d.relativePath} value={d.relativePath}>
                      {m.title} ({formatShortDate(d.mtimeIso)}) — {m.subtitle}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </DialogHeader>

        {/* 본문: 좌측 버전 히스토리 사이드바 + 우측 문서 렌더러 */}
        <div className="flex min-h-0 flex-1 overflow-hidden bg-card-elevated">
          {showHistorySidebar && (
            <aside className="hidden w-68 shrink-0 flex-col border-r border-border/80 bg-muted/30 md:flex">
              <div className="border-b border-border/75 p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-primary" />
                    문서 · 버전 이력
                  </span>
                  <span className="font-mono text-[11px]">{filteredDocs.length}개</span>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="버전, 브랜치 검색..."
                    className="h-8 bg-card-elevated pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {filteredDocs.map((d) => {
                  const active = d.relativePath === selectedDoc?.relativePath;
                  const meta = formatReleaseDocItemMeta(d);
                  return (
                    <button
                      key={d.relativePath}
                      ref={active ? activeItemRef : null}
                      type="button"
                      onClick={() => setSelectedDoc(d)}
                      className={cn(
                        'w-full cursor-pointer rounded-xl px-3 py-2 text-left transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'text-foreground/90 dark:text-[#d2ded8] hover:bg-accent/30 dark:hover:bg-[#203328] dark:hover:text-[#ffffff]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate font-mono text-xs font-semibold">
                          {meta.title}
                        </span>
                        {meta.badgeText && (
                          <span
                            className={cn(
                              'shrink-0 rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold',
                              active
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-accent/80 text-accent-foreground',
                            )}
                          >
                            {meta.badgeText}
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 flex items-center justify-between gap-2 text-[11px]',
                          active ? 'text-primary-foreground/80' : 'text-muted-foreground dark:text-[#8ea299]',
                        )}
                      >
                        <span className="truncate font-mono">{meta.subtitle}</span>
                        <span className="shrink-0 font-mono text-[10px]">
                          {formatShortDate(d.mtimeIso)}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredDocs.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    일치하는 버전 문서가 없습니다.
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* 우측 문서 열람 영역 */}
          <div
            ref={bodyScrollRef}
            className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-card-elevated px-5 py-5 sm:px-7"
          >
            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs font-medium">공유폴더에서 릴리즈 문서를 불러오는 중...</p>
              </div>
            )}

            {!loading && errorMsg && (
              <div className="my-auto flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-8 text-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">문서 로드 실패</p>
                <p className="text-xs text-amber-800 dark:text-amber-300">{errorMsg}</p>
              </div>
            )}

            {!loading && !errorMsg && note && (
              <div className="flex flex-1 flex-col justify-between gap-6">
                <ReleaseNoteContent
                  content={note.content}
                  format={note.format}
                  docRelativePath={note.relativePath}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 font-mono text-[11px] text-muted-foreground dark:text-[#8ea299]">
                  <span>수정일시: {formatDateTime(note.mtimeIso)}</span>
                  <span>
                    크기: {formatSize(note.sizeBytes)} · 인코딩: {note.encoding} ·{' '}
                    {note.cacheHit ? '로컬 캐시 HIT' : `스토리지 동기화 (${note.elapsedMs}ms)`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
