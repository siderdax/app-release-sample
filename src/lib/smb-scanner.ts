import {
  findProductForFolder,
  PRODUCT_DEFINITIONS,
  type ProductDefinition,
} from './product-catalog.ts';
import {
  buildProductSummaries,
  classifyFileKind,
  decodeURIComponentSafe,
  extractBuildDate,
  extractVariantType,
  extractVersion,
  type ClassifiedFileItem,
  type ProductGroupSummary,
  type ReleaseFileKind,
  type ScanSummary,
} from './release-classifier.ts';
import { getMockScanSummary, MOCK_FILES } from './mock-data.ts';

export type {
  ClassifiedFileItem,
  ProductGroupSummary,
  ReleaseFileKind,
  ModelScanSummary,
  ScanSummary,
} from './release-classifier.ts';

export interface SmbEnvConfig {
  host: string;
  port: number;
  domain: string;
  username: string;
  password: string;
  share: string;
  basePath: string;
}

export type ScanErrorCode =
  | 'MISSING_CREDENTIALS'
  | 'MISSING_CONFIG'
  | 'AUTH_FAILED'
  | 'PATH_NOT_FOUND'
  | 'CONNECTION_FAILED';

export class ScanServiceError extends Error {
  readonly code: ScanErrorCode;
  readonly endpointDisplay: string;

  constructor(code: ScanErrorCode, message: string, endpointDisplay: string) {
    super(message);
    this.name = 'ScanServiceError';
    this.code = code;
    this.endpointDisplay = endpointDisplay;
  }
}

/**
 * 샘플 웹앱 쇼케이스용 모의 스캐너:
 * 실제 사내 SMB 서버 대신 고품질 인더스트리얼 소프트웨어 릴리즈 모의 데이터셋을 즉시 반환합니다.
 */
export async function scanSmbShare(options: { forceRefresh?: boolean } = {}): Promise<ScanSummary> {
  if (options.forceRefresh) {
    // 실시간 새로고침 시 250ms 인위적 딜레이를 주어 스캔 애니메이션과 체감을 제공
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return getMockScanSummary();
}
