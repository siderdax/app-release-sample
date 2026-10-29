import ScanDashboard, { type InitialScanState } from '@/components/ScanDashboard';
import { ScanServiceError, scanSmbShare } from '@/lib/smb-scanner';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialState: InitialScanState;

  try {
    const summary = await scanSmbShare();
    initialState = { summary, error: null };
  } catch (err) {
    if (err instanceof ScanServiceError) {
      initialState = {
        summary: null,
        error: {
          code: err.code,
          message: err.message,
          endpointDisplay: err.endpointDisplay,
        },
      };
    } else {
      initialState = {
        summary: null,
        error: {
          code: 'CONNECTION_FAILED',
          message: err instanceof Error ? err.message : '알 수 없는 서버 오류',
          endpointDisplay: '',
        },
      };
    }
  }

  return <ScanDashboard initialState={initialState} />;
}
