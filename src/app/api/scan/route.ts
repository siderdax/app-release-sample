import { NextRequest, NextResponse } from 'next/server';
import { ScanServiceError, scanSmbShare } from '@/lib/smb-scanner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';

  try {
    const summary = await scanSmbShare({ forceRefresh });
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    if (err instanceof ScanServiceError) {
      const statusMap: Record<ScanServiceError['code'], number> = {
        MISSING_CONFIG: 400,
        MISSING_CREDENTIALS: 401,
        AUTH_FAILED: 401,
        PATH_NOT_FOUND: 404,
        CONNECTION_FAILED: 502,
      };
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            endpointDisplay: err.endpointDisplay,
          },
        },
        { status: statusMap[err.code] ?? 500 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: err instanceof Error ? err.message : '알 수 없는 서버 오류',
          endpointDisplay: '',
        },
      },
      { status: 500 },
    );
  }
}
