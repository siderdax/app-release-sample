'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resolveMarkdownImageSrc, slugifyHeading } from '@/lib/release-note-matcher';

interface ReleaseNoteContentProps {
  content: string;
  format: 'markdown' | 'text';
  docRelativePath: string;
}

function extractNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }
  return '';
}

export default function ReleaseNoteContent({
  content,
  format,
  docRelativePath,
}: ReleaseNoteContentProps) {
  if (!content.trim()) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        문서 내용이 비어 있습니다.
      </div>
    );
  }

  // .txt 등 일반 텍스트 파일은 포맷 가공 없이 순수 Plain Text로 그대로 출력
  if (format !== 'markdown') {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border/80 bg-card p-4 font-mono text-[13px] leading-relaxed text-foreground/90 dark:text-[#c4d2cb]">
        {content}
      </pre>
    );
  }

  // .md 파일은 공식 react-markdown + remark-gfm 패키지로 마크다운 스타일 렌더링
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground/90 dark:text-[#c4d2cb]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const id = slugifyHeading(extractNodeText(children));
            return (
              <h1
                id={id || undefined}
                className="scroll-mt-4 border-b border-border/80 pb-2.5 text-lg font-bold tracking-tight text-foreground sm:text-xl dark:text-[#e0ebe5]"
              >
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = slugifyHeading(extractNodeText(children));
            return (
              <h2
                id={id || undefined}
                className="mt-6 scroll-mt-4 border-b border-border/60 pb-1.5 text-base font-bold tracking-tight text-foreground dark:text-[#d6e3dc]"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = slugifyHeading(extractNodeText(children));
            return (
              <h3
                id={id || undefined}
                className="mt-4 scroll-mt-4 text-sm font-bold text-foreground dark:text-[#d6e3dc]"
              >
                {children}
              </h3>
            );
          },
          h4: ({ children }) => {
            const id = slugifyHeading(extractNodeText(children));
            return (
              <h4
                id={id || undefined}
                className="mt-3 scroll-mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-[#8ea299]"
              >
                {children}
              </h4>
            );
          },
          p: ({ children }) => (
            <p className="leading-relaxed text-foreground/90 dark:text-[#c4d2cb]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-primary/70 text-foreground/90 dark:text-[#c4d2cb]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90 dark:text-[#c4d2cb]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-0.5 leading-relaxed [&>ul]:mt-1.5 [&>ol]:mt-1.5">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="rounded-r-xl border-l-4 border-primary bg-accent/25 px-4 py-2.5 text-sm text-foreground/85 dark:text-[#bdd0c6]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-border/80" />,
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-xl border border-border/80 bg-muted/60 dark:bg-card p-3.5 font-mono text-xs leading-relaxed text-foreground/90 dark:text-[#c4d2cb]">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className?.includes('language-'));
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded-md border border-border bg-accent/25 px-1.5 py-0.5 font-mono text-[12px] font-medium text-accent-foreground [pre_&]:border-0 [pre_&]:bg-transparent [pre_&]:p-0 [pre_&]:text-inherit"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-foreground dark:text-[#d6e3dc]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-border/70 px-3.5 py-2 text-foreground/85 dark:text-[#c4d2cb]">{children}</td>
          ),
          a: ({ href = '', children }) => {
            if (href.startsWith('#')) {
              const targetId = slugifyHeading(decodeURIComponent(href.slice(1)));
              return (
                <a
                  href={`#${targetId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(targetId)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                  className="font-medium text-primary underline underline-offset-3 hover:opacity-85"
                >
                  {children}
                </a>
              );
            }
            if (/^https?:\/\/internal-repo/i.test(href)) {
              return (
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {children}
                </code>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-3 hover:opacity-85"
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const rawSrc = typeof src === 'string' ? src : '';
            if (!rawSrc) return null;
            const resolved = resolveMarkdownImageSrc(rawSrc, docRelativePath);
            return (
              <span className="my-2.5 block overflow-hidden rounded-xl border border-border bg-card p-2 shadow-2xs">
                <a href={resolved.src} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={resolved.src}
                    alt={alt ?? '릴리즈 노트 이미지'}
                    loading="lazy"
                    className="max-h-[440px] w-auto max-w-full rounded-lg object-contain"
                  />
                </a>
                {alt && <span className="mt-1.5 block text-xs text-muted-foreground">{alt}</span>}
              </span>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
