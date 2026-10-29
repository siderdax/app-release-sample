import ProductReleaseView from '@/components/ProductReleaseView';
import { ScanServiceError, scanSmbShare, type ScanErrorCode } from '@/lib/smb-scanner';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const summary = await scanSmbShare();
    return <ProductReleaseView slug={slug} initialSummary={summary} initialError={null} />;
  } catch (err) {
    let error: { code: ScanErrorCode; message: string; endpointDisplay: string };
    if (err instanceof ScanServiceError) {
      error = {
        code: err.code,
        message: err.message,
        endpointDisplay: err.endpointDisplay,
      };
    } else {
      error = {
        code: 'CONNECTION_FAILED',
        message: err instanceof Error ? err.message : '알 수 없는 서버 오류',
        endpointDisplay: '',
      };
    }
    return <ProductReleaseView slug={slug} initialSummary={null} initialError={error} />;
  }
}
