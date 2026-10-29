'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type RevealVariant = 'up' | 'down' | 'scale';

type RevealSubscriber = {
  element: HTMLElement;
  reveal: (delayMs: number) => void;
  isRevealed: () => boolean;
};

/**
 * 프레임 단위 Top-Down 인터섹션 코디네이터:
 * - 초기 마운트 및 라우트 전환 시 Double-rAF로 초기(opacity:0, translateY) 페인트를 보장한 뒤
 *   화면 위->아래 행(Row) 순서 및 좌->우 열(Col) 순서로 정렬해 순차(Stagger) 페이드인을 연출합니다.
 * - 스크롤을 내릴 때마다 새로 뷰포트에 들어오는 카드/섹션들도 동일한 규칙으로 즉시 페이드인합니다.
 */
let sharedObserver: IntersectionObserver | null = null;
const subscriberMap = new Map<Element, RevealSubscriber>();
const pendingQueue = new Set<RevealSubscriber>();
let rafScheduled = false;
let bottomListenerAttached = false;

function flushPendingQueue() {
  rafScheduled = false;
  if (pendingQueue.size === 0) return;

  const batch = Array.from(pendingQueue).filter((sub) => !sub.isRevealed());
  pendingQueue.clear();
  if (batch.length === 0) return;

  // 1) Y 좌표 순으로 정렬 후 시각적 행(Row) 단위로 그룹핑
  const measured = batch
    .map((sub) => {
      const rect = sub.element.getBoundingClientRect();
      return { sub, top: rect.top, left: rect.left };
    })
    .sort((a, b) => a.top - b.top);

  const rows: Array<Array<{ sub: RevealSubscriber; top: number; left: number }>> = [];
  for (const item of measured) {
    const lastRow = rows[rows.length - 1];
    if (!lastRow || Math.abs(item.top - lastRow[0].top) > 36) {
      rows.push([item]);
    } else {
      lastRow.push(item);
    }
  }

  // 2) 각 행 내부는 좌->우(X) 순으로 정렬하고, 위->아래 행 캐스케이드 딜레이 부여
  rows.forEach((row, rowIdx) => {
    row.sort((a, b) => a.left - b.left);
    row.forEach((item, colIdx) => {
      const delayMs = Math.min(rowIdx * 115 + colIdx * 65, 780);
      item.sub.reveal(delayMs);
      sharedObserver?.unobserve(item.sub.element);
      subscriberMap.delete(item.sub.element);
    });
  });
}

function scheduleFlush() {
  if (rafScheduled) return;
  rafScheduled = true;
  // Double-rAF: 브라우저 컴포지터가 최소 1프레임 초기 상태(opacity: 0, translateY)를
  // 실제 페인트한 직후 .is-visible 트랜지션을 점화하도록 보장
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(flushPendingQueue);
  });
}

function checkPageBottomRemainder() {
  if (subscriberMap.size === 0) return;
  subscriberMap.forEach((sub) => {
    const rect = sub.element.getBoundingClientRect();
    // translateY(+42px) 오프셋을 보정한 실제 레이아웃 위치가 뷰포트 하단 안쪽이면 즉시 리빌
    if (rect.top < window.innerHeight + 42) {
      pendingQueue.add(sub);
    }
  });
  if (pendingQueue.size > 0) {
    scheduleFlush();
  }
}

function getSharedObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  if (!bottomListenerAttached) {
    bottomListenerAttached = true;
    window.addEventListener('scroll', checkPageBottomRemainder, { passive: true });
    window.addEventListener('resize', checkPageBottomRemainder, { passive: true });
  }

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sub = subscriberMap.get(entry.target);
          if (sub && !sub.isRevealed()) {
            pendingQueue.add(sub);
          }
        }
        if (pendingQueue.size > 0) {
          scheduleFlush();
        }
      },
      {
        // 초기 오프셋(translateY: +42px)만큼 하단 감지선을 +42px 보정하고 threshold: 0으로 설정하여,
        // 화면 하단에 일부만 걸쳐(잘려) 보이는 마지막 카드/섹션까지 빈 여백 없이 즉시 페이드인되도록 보장
        rootMargin: '0px 0px 42px 0px',
        threshold: 0,
      },
    );
  }

  return sharedObserver;
}

export interface RevealContextState {
  visible: boolean;
  delayMs: number;
}

const RevealVisibilityContext = React.createContext<RevealContextState>({
  visible: true,
  delayMs: 0,
});

export function useRevealState(): RevealContextState {
  return React.useContext(RevealVisibilityContext);
}

export function useRevealVisible(): boolean {
  return React.useContext(RevealVisibilityContext).visible;
}

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: RevealVariant;
  extraDelayMs?: number;
}

export const ScrollReveal = React.forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ variant = 'up', extraDelayMs = 0, className, style, children, ...props }, forwardedRef) => {
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const revealedRef = React.useRef(false);
    const [visible, setVisible] = React.useState(false);
    const [settled, setSettled] = React.useState(false);
    const [delayMs, setDelayMs] = React.useState(0);

    const setMergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    React.useEffect(() => {
      const el = localRef.current;
      if (!el || revealedRef.current) return;

      const observer = getSharedObserver();
      if (!observer) {
        revealedRef.current = true;
        setVisible(true);
        setSettled(true);
        return;
      }

      let settleTimer: number | undefined;

      const subscriber: RevealSubscriber = {
        element: el,
        isRevealed: () => revealedRef.current,
        reveal: (computedDelay) => {
          if (revealedRef.current) return;
          revealedRef.current = true;
          const totalDelay = computedDelay + extraDelayMs;
          setDelayMs(totalDelay);
          setVisible(true);
          settleTimer = window.setTimeout(() => {
            setSettled(true);
          }, totalDelay + 900);
        },
      };

      subscriberMap.set(el, subscriber);
      observer.observe(el);

      return () => {
        if (settleTimer !== undefined) {
          window.clearTimeout(settleTimer);
        }
        pendingQueue.delete(subscriber);
        subscriberMap.delete(el);
        observer.unobserve(el);
      };
    }, [extraDelayMs]);

    const contextValue = React.useMemo(
      () => ({ visible, delayMs }),
      [visible, delayMs],
    );

    return (
      <RevealVisibilityContext.Provider value={contextValue}>
        <div
          ref={setMergedRef}
          data-reveal={variant}
          style={
            {
              ...style,
              '--reveal-delay': `${delayMs}ms`,
            } as React.CSSProperties
          }
          className={cn(
            'reveal-item',
            visible && 'is-visible',
            settled && 'is-settled',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </RevealVisibilityContext.Provider>
    );
  },
);
ScrollReveal.displayName = 'ScrollReveal';

/**
 * 카드가 뷰포트에 등장하는 타이밍(delayMs)에 맞춰 0에서 목표 수치까지 카운트업되는 컴포넌트
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  durationMs = 900,
  formatLocale = true,
  suffix = '',
  prefix = '',
}: {
  value: number;
  decimals?: number;
  durationMs?: number;
  formatLocale?: boolean;
  suffix?: string;
  prefix?: string;
}) {
  const { visible: isVisible, delayMs: parentDelayMs } = useRevealState();
  const [displayVal, setDisplayVal] = React.useState<number>(0);
  const hasAnimatedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isVisible) return;

    const isFirstReveal = !hasAnimatedRef.current;
    const startVal = isFirstReveal ? 0 : displayVal;
    const waitMs = isFirstReveal ? parentDelayMs : 0;
    hasAnimatedRef.current = true;

    if (startVal === value) {
      setDisplayVal(value);
      return;
    }

    let frameId = 0;
    let delayTimer: number | undefined;

    const startAnimation = () => {
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const eased = 1 - Math.pow(1 - t, 4);
        const next = startVal + (value - startVal) * eased;
        setDisplayVal(next);

        if (t < 1) {
          frameId = window.requestAnimationFrame(step);
        } else {
          setDisplayVal(value);
        }
      };
      frameId = window.requestAnimationFrame(step);
    };

    if (waitMs > 0) {
      delayTimer = window.setTimeout(startAnimation, waitMs);
    } else {
      startAnimation();
    }

    return () => {
      if (delayTimer !== undefined) {
        window.clearTimeout(delayTimer);
      }
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, parentDelayMs, value, durationMs]);

  const formatted =
    decimals > 0
      ? displayVal.toFixed(decimals)
      : formatLocale
        ? Math.round(displayVal).toLocaleString()
        : String(Math.round(displayVal));

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}
