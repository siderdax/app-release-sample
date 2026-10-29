'use client';

import * as React from 'react';
import { AlertCircle, Check, Download, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface FileDownloadLinkProps {
  relativePath: string;
  fileName: string;
  sizeBytes?: number | null;
  className?: string;
  truncate?: boolean;
}

type DownloadUiState = 'idle' | 'preparing' | 'started' | 'error';

function formatShortSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function FileDownloadLink({
  relativePath,
  fileName,
  sizeBytes,
  className,
  truncate = false,
}: FileDownloadLinkProps) {
  const [status, setStatus] = React.useState<DownloadUiState>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string>('');
  const resetTimerRef = React.useRef<number | null>(null);

  const directHref = `/api/download?path=${encodeURIComponent(relativePath)}`;

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 새 탭/링크 저장 등 보조 클릭은 브라우저 기본 동작 허용
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (status === 'preparing') return;
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setStatus('preparing');
    setErrorMsg('');

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relativePath }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        const msg = data?.error?.message || '파일 다운로드 준비에 실패했습니다.';
        setStatus('error');
        setErrorMsg(msg);
        resetTimerRef.current = window.setTimeout(() => {
          setStatus('idle');
          setErrorMsg('');
        }, 5000);
        return;
      }

      // 캐시 준비 완료 -> 브라우저 네이티브 스트리밍 다운로드 즉시 실행
      const link = document.createElement('a');
      link.href = data.downloadUrl || directHref;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus('started');
      resetTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
      setStatus('error');
      setErrorMsg(msg);
      resetTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setErrorMsg('');
      }, 5000);
    }
  }

  const sizeText = formatShortSize(sizeBytes);
  const tooltipLabel =
    status === 'error'
      ? `오류: ${errorMsg}`
      : status === 'preparing'
        ? 'wtcontrol에서 캐시 동기화 중...'
        : `클릭하여 다운로드${sizeText ? ` (${sizeText})` : ''}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={directHref}
          onClick={handleClick}
          className={cn(
            'group/dl inline-flex max-w-full items-center gap-1.5 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            status === 'preparing' && 'cursor-wait text-primary',
            status === 'error'
              ? 'text-red-600 hover:text-red-700'
              : 'hover:text-primary',
            className,
          )}
        >
          {status === 'preparing' ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          ) : status === 'started' ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : status === 'error' ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
          ) : (
            <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75 transition-all group-hover/dl:translate-y-[0.5px] group-hover/dl:text-primary" />
          )}

          <span
            className={cn(
              'underline-offset-3 group-hover/dl:underline',
              truncate && 'truncate',
            )}
          >
            {fileName}
          </span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}
