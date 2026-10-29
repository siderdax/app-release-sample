import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_RELEASE_NOTES } from '@/lib/mock-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateFallbackReleaseNote(filePath: string): string {
  const fileName = path.basename(filePath);
  const version = fileName.replace(/\.md$/i, '').replace(/^v/i, '');

  return `# Release Note: ${fileName}

> **Status**: Verified Sample Release  
> **Target Version**: \`${version || '1.0.0'}\`  
> **Environment**: Industrial Edge / Automated Station

---

### 🚀 Highlights & Features
- Component stability and telemetry streaming improvements.
- Standardized error logging and watchdog monitoring.
- Zero-latency local caching layer applied.

---

### 📦 Verification & Integrity
- **Build Timestamp**: 2026-10-24
- **Verification Status**: PASSED (All automated test suites verified)
`;
}

export async function GET(request: NextRequest) {
  const rawPath = (request.nextUrl.searchParams.get('path') ?? '').trim();

  if (!rawPath) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INVALID_PATH', message: '조회할 문서 경로가 지정되지 않았습니다.' },
      },
      { status: 400 },
    );
  }

  // 인위적 지연 (모달 로더 체감 80ms)
  await new Promise((r) => setTimeout(r, 80));

  const normalizedPath = rawPath.replace(/\\/g, '/');
  const content = MOCK_RELEASE_NOTES[normalizedPath] || generateFallbackReleaseNote(normalizedPath);
  const fileName = path.basename(normalizedPath);

  return NextResponse.json({
    ok: true,
    note: {
      relativePath: normalizedPath,
      fileName,
      format: normalizedPath.endsWith('.md') ? 'markdown' : 'text',
      encoding: 'utf-8',
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      mtimeIso: new Date().toISOString(),
      cacheHit: true,
      elapsedMs: 24,
      content,
    },
  });
}
