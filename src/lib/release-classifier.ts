import {
  findProductForFolder,
  PRODUCT_DEFINITIONS,
  type ProductDefinition,
} from './product-catalog.ts';

export type ReleaseFileKind = 'installer' | 'firmware' | 'disabled' | 'doc' | 'other';

export interface ClassifiedFileItem {
  productSlug: string;
  productName: string;
  model: string;
  relativePath: string;
  smbPath: string;
  fileName: string;
  extension: string;
  subFolders: string[];
  decodedSubPath: string;
  kind: ReleaseFileKind;
  variantType: string;
  version: string | null;
  buildDate: string | null;
  sizeBytes: number;
  mtimeIso: string;
}

export interface ProductGroupSummary {
  slug: string;
  name: string;
  description: string;
  category: ProductDefinition['category'];
  folders: string[];
  presentFolders: string[];
  installerCount: number;
  firmwareCount: number;
  disabledCount: number;
  docCount: number;
  totalFileCount: number;
  totalSizeBytes: number;
  variantTypes: { name: string; count: number }[];
  latestFile: string | null;
  latestVersion: string | null;
  latestMtimeIso: string | null;
}

export interface ModelScanSummary {
  model: string;
  productSlug: string;
  productName: string;
  fileCount: number;
  installerCount: number;
  firmwareCount: number;
  docCount: number;
  totalSizeBytes: number;
  latestFile: string | null;
  latestRelativePath: string | null;
  latestSizeBytes: number | null;
  latestMtimeIso: string | null;
  sampleSubFolders: string[];
}

export interface ScanSummary {
  endpointDisplay: string;
  uncDisplay: string;
  share: string;
  basePath: string;
  usernameMasked: string;
  scannedAtIso: string;
  elapsedMs: number;
  totalModels: number;
  totalDirectories: number;
  totalFiles: number;
  totalInstallers: number;
  totalFirmwares: number;
  totalSizeBytes: number;
  extensionCounts: Record<string, number>;
  models: ModelScanSummary[];
  products: ProductGroupSummary[];
  recentInstallers: ClassifiedFileItem[];
  files: ClassifiedFileItem[];
}

const INSTALLER_EXTENSIONS = new Set(['.exe', '.msi', '.zip', '.7z', '.rar', '.msix']);
const FIRMWARE_EXTENSIONS = new Set(['.bin', '.hex', '.fw']);
const DISABLED_EXTENSIONS = new Set(['.exe1', '.ex1']);
const DOC_EXTENSIONS = new Set(['.md', '.txt']);

export function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function classifyFileKind(extension: string): ReleaseFileKind {
  const ext = extension.toLowerCase();
  if (INSTALLER_EXTENSIONS.has(ext)) return 'installer';
  if (FIRMWARE_EXTENSIONS.has(ext)) return 'firmware';
  if (DISABLED_EXTENSIONS.has(ext)) return 'disabled';
  if (DOC_EXTENSIONS.has(ext)) return 'doc';
  return 'other';
}

export function extractVariantType(subFolders: string[]): string {
  if (subFolders.length === 0) return '기본 (Main)';

  const top = decodeURIComponentSafe(subFolders[0]).trim();
  if (!top) return '기본 (Main)';

  if (top.toLowerCase() === 'firmwares') return 'Firmwares';
  if (top.toLowerCase() === 'changelogs') return 'changelogs';

  // 예: SKH_100CJ_2.0.0.2a -> SKH_100CJ, onsemi-1.0.0.55 -> onsemi, bc-1.0.0.14 -> bc
  const stripped = top.replace(/[-_]\d+\.\d+(?:\.\d+){1,2}[a-z]?$/i, '').trim();
  return stripped || top;
}

export function extractBuildDate(fileName: string): string | null {
  const m = fileName.match(/_(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?=\.[^.]+$)/);
  if (!m) return null;
  return `20${m[1]}-${m[2]}-${m[3]}`;
}

export function extractVersion(fileName: string, subFolders: string[]): string | null {
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  const withoutDate = withoutExt.replace(/_\d{6}$/, '');

  // 1) 파일명 내 점(.) 구분 버전 (예: Ver2.0.0.3, v1.0.0.55, Setup_2.0.1.2, 1.9.1.8a)
  const dotMatches = [...withoutDate.matchAll(/(?:ver|v|setup[_-]?)?(\d+\.\d+\.\d+(?:\.\d+)?[a-z]?)/gi)];
  if (dotMatches.length > 0) {
    return dotMatches[dotMatches.length - 1][1];
  }

  // 2) 펌웨어 언더스코어 버전 (예: ucon161_1_0_0_4 -> 1.0.0.4)
  const underscoreMatch = withoutDate.match(/(?:^|_)(\d+_\d+_\d+(?:_\d+)?)$/);
  if (underscoreMatch) {
    return underscoreMatch[1].replace(/_/g, '.');
  }

  // 3) 하위 폴더명에서 버전 추출 폴백
  for (let i = subFolders.length - 1; i >= 0; i -= 1) {
    const folderMatch = subFolders[i].match(/(\d+\.\d+\.\d+(?:\.\d+)?[a-z]?)/i);
    if (folderMatch) return folderMatch[1];
  }

  return null;
}

export function compareVersions(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  const parseParts = (v: string) => {
    const m = v.match(/^(\d+(?:\.\d+)*)([a-z]*)$/i);
    if (!m) return { nums: [] as number[], suffix: v };
    return {
      nums: m[1].split('.').map((n) => Number.parseInt(n, 10)),
      suffix: m[2].toLowerCase(),
    };
  };

  const pa = parseParts(a);
  const pb = parseParts(b);
  const len = Math.max(pa.nums.length, pb.nums.length);
  for (let i = 0; i < len; i += 1) {
    const na = pa.nums[i] ?? 0;
    const nb = pb.nums[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return pa.suffix.localeCompare(pb.suffix);
}

export function buildProductSummaries(
  presentModelFolders: string[],
  classifiedFiles: ClassifiedFileItem[],
  definitions: ProductDefinition[] = PRODUCT_DEFINITIONS,
): ProductGroupSummary[] {
  const orderedDefs: ProductDefinition[] = [...definitions];
  const knownFolderLower = new Set(
    definitions.flatMap((d) => d.folders.map((f) => f.toLowerCase())),
  );

  for (const folder of presentModelFolders) {
    if (!knownFolderLower.has(folder.toLowerCase())) {
      orderedDefs.push(findProductForFolder(folder, definitions));
    }
  }

  const presentLowerMap = new Map(presentModelFolders.map((f) => [f.toLowerCase(), f]));

  return orderedDefs
    .map((def) => {
      const presentFolders = def.folders
        .map((f) => presentLowerMap.get(f.toLowerCase()))
        .filter((f): f is string => Boolean(f));

      const groupFiles = classifiedFiles.filter((f) => f.productSlug === def.slug);
      let installerCount = 0;
      let firmwareCount = 0;
      let disabledCount = 0;
      let docCount = 0;
      let totalSizeBytes = 0;
      const variantMap = new Map<string, number>();

      let latestPkg: ClassifiedFileItem | null = null;
      let latestAny: ClassifiedFileItem | null = null;

      for (const f of groupFiles) {
        totalSizeBytes += f.sizeBytes;
        if (f.kind === 'installer') installerCount += 1;
        else if (f.kind === 'firmware') firmwareCount += 1;
        else if (f.kind === 'disabled') disabledCount += 1;
        else if (f.kind === 'doc') docCount += 1;

        if (f.kind === 'installer' || f.kind === 'firmware') {
          variantMap.set(f.variantType, (variantMap.get(f.variantType) ?? 0) + 1);
          if (!latestPkg || f.mtimeIso > latestPkg.mtimeIso) {
            latestPkg = f;
          }
        }

        if (!latestAny || f.mtimeIso > latestAny.mtimeIso) {
          latestAny = f;
        }
      }

      const chosen = latestPkg ?? latestAny;
      const variantTypes = Array.from(variantMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      return {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        folders: def.folders,
        presentFolders,
        installerCount,
        firmwareCount,
        disabledCount,
        docCount,
        totalFileCount: groupFiles.length,
        totalSizeBytes,
        variantTypes,
        latestFile: chosen ? chosen.fileName : null,
        latestVersion: chosen ? chosen.version : null,
        latestMtimeIso: chosen ? chosen.mtimeIso : null,
      };
    })
    .filter((p) => p.presentFolders.length > 0 || p.totalFileCount > 0);
}
