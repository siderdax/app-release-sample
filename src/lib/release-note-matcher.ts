import type { ClassifiedFileItem } from './release-classifier.ts';
import { compareVersions, extractVersion } from './release-classifier.ts';

export interface ReleaseDocIndex {
  allDocs: ClassifiedFileItem[];
  docsByPath: Map<string, ClassifiedFileItem>;
  docsByDir: Map<string, ClassifiedFileItem[]>;
  changelogDocsByModel: Map<string, Map<string, ClassifiedFileItem>>;
  docsByProductSlug: Map<string, ClassifiedFileItem[]>;
  docsByModel: Map<string, ClassifiedFileItem[]>;
}

function posixDirname(p: string): string {
  const normalized = p.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx < 0 ? '.' : normalized.slice(0, idx);
}

function posixBasenameNoExt(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.');
  return dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
}

function normalizePosixPath(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

/**
 * 문서 파일의 정렬용 버전/빌드 번호 키 추출
 * - 예: EdgePulse-10/changelogs/713.md -> "1.0.0.713" 대신 숫자 빌드 비교 가능하도록 보조 버전 생성
 */
export function extractDocVersionLabel(doc: ClassifiedFileItem): string | null {
  if (doc.version) return doc.version;
  const fromPath = extractVersion(doc.fileName, doc.subFolders);
  if (fromPath) return fromPath;

  const base = posixBasenameNoExt(doc.fileName).trim();
  if (/^\d{2,6}$/.test(base)) {
    return base;
  }
  return null;
}

function compareReleaseDocsDesc(a: ClassifiedFileItem, b: ClassifiedFileItem): number {
  // last-deployed-commit.txt 같은 보조 메타 문서는 버전 노트 아래로 배치
  const aIsAux = /^last-deployed/i.test(a.fileName) ? 1 : 0;
  const bIsAux = /^last-deployed/i.test(b.fileName) ? 1 : 0;
  if (aIsAux !== bIsAux) return aIsAux - bIsAux;

  // 최신 수정일 우선, 동일 시각이면 버전 내림차순
  const mtimeCmp = b.mtimeIso.localeCompare(a.mtimeIso);
  if (mtimeCmp !== 0) return mtimeCmp;

  const verA = extractDocVersionLabel(a);
  const verB = extractDocVersionLabel(b);
  const verCmp = compareVersions(verB, verA);
  if (verCmp !== 0) return verCmp;

  return b.relativePath.localeCompare(a.relativePath, 'en', { sensitivity: 'base' });
}

/**
 * 스캔된 전체 파일 배열로부터 릴리즈 문서(kind === 'doc') 고속 조회 인덱스를 생성합니다.
 */
export function buildReleaseDocIndex(files: ClassifiedFileItem[]): ReleaseDocIndex {
  const allDocs = files.filter((f) => f.kind === 'doc');
  const docsByPath = new Map<string, ClassifiedFileItem>();
  const docsByDir = new Map<string, ClassifiedFileItem[]>();
  const changelogDocsByModel = new Map<string, Map<string, ClassifiedFileItem>>();
  const docsByProductSlug = new Map<string, ClassifiedFileItem[]>();
  const docsByModel = new Map<string, ClassifiedFileItem[]>();

  for (const doc of allDocs) {
    docsByPath.set(doc.relativePath, doc);

    const dir = posixDirname(doc.relativePath);
    const dirList = docsByDir.get(dir) ?? [];
    dirList.push(doc);
    docsByDir.set(dir, dirList);

    const prodList = docsByProductSlug.get(doc.productSlug) ?? [];
    prodList.push(doc);
    docsByProductSlug.set(doc.productSlug, prodList);

    const modelList = docsByModel.get(doc.model) ?? [];
    modelList.push(doc);
    docsByModel.set(doc.model, modelList);

    if (doc.subFolders[0]?.toLowerCase() === 'changelogs' && doc.extension === '.md') {
      const baseKey = posixBasenameNoExt(doc.fileName).toLowerCase();
      let modelMap = changelogDocsByModel.get(doc.model);
      if (!modelMap) {
        modelMap = new Map();
        changelogDocsByModel.set(doc.model, modelMap);
      }
      modelMap.set(baseKey, doc);
    }
  }

  for (const list of docsByProductSlug.values()) {
    list.sort(compareReleaseDocsDesc);
  }
  for (const list of docsByModel.values()) {
    list.sort(compareReleaseDocsDesc);
  }

  return {
    allDocs: [...allDocs].sort(compareReleaseDocsDesc),
    docsByPath,
    docsByDir,
    changelogDocsByModel,
    docsByProductSlug,
    docsByModel,
  };
}

/**
 * 특정 인스톨러 파일에 대응하는 릴리즈 노트/체인지로그 문서를 탐색합니다.
 * 1) 동일 폴더 내 Release.txt (또는 일반 문서)
 * 2) 상위 배포 폴더 내 Release.txt (모델 루트 직하는 오매칭 방지를 위해 제외)
 * 3) 모델 하위 changelogs/<전체버전>.md -> changelogs/<마지막세그먼트(빌드번호)>.md 폴백
 */
export function findReleaseDocForFile(
  file: ClassifiedFileItem,
  index: ReleaseDocIndex,
): ClassifiedFileItem | null {
  if (file.kind === 'firmware') return null;

  const installerDir = posixDirname(file.relativePath);
  const siblingDocs = index.docsByDir.get(installerDir);
  if (siblingDocs && siblingDocs.length > 0) {
    const preferred =
      siblingDocs.find((d) => /^release/i.test(d.fileName)) ??
      siblingDocs.find((d) => !/^last-deployed/i.test(d.fileName));
    if (preferred) return preferred;
  }

  const parentDir = posixDirname(installerDir);
  if (parentDir && parentDir !== '.' && parentDir.includes('/')) {
    const parentDocs = index.docsByDir.get(parentDir);
    const parentRelease = parentDocs?.find((d) => /^release/i.test(d.fileName));
    if (parentRelease) return parentRelease;
  }

  const modelChangelogs = index.changelogDocsByModel.get(file.model);
  if (modelChangelogs) {
    const candidates: string[] = [];
    if (file.version) {
      candidates.push(file.version);
      const parts = file.version.split('.');
      if (parts.length >= 3) {
        candidates.push(parts[parts.length - 1]);
      }
    }
    const buildNumMatch = file.fileName.match(/(?:^|[_\-\s])v?(\d{3,5})(?=[_.\-\s]|$)/i);
    if (buildNumMatch) {
      candidates.push(buildNumMatch[1]);
    }

    for (const key of candidates) {
      const hit = modelChangelogs.get(key.toLowerCase());
      if (hit) return hit;
    }
  }

  return null;
}

/**
 * UI 목록에 표시할 문서의 간결한 제목과 부제를 생성합니다.
 */
export function formatReleaseDocItemMeta(doc: ClassifiedFileItem): {
  title: string;
  subtitle: string;
  badgeText: string | null;
} {
  const ver = extractDocVersionLabel(doc);
  const isChangelog = doc.subFolders[0]?.toLowerCase() === 'changelogs';

  if (isChangelog) {
    const isBuildOnly = ver !== null && /^\d+$/.test(ver);
    return {
      title: isBuildOnly ? `Build ${ver}` : ver ? `v${ver}` : doc.fileName,
      subtitle: `${doc.model} · ${doc.fileName}`,
      badgeText: 'MD',
    };
  }

  if (/^release/i.test(doc.fileName)) {
    return {
      title: doc.variantType !== ' 기본' && doc.variantType !== '기본' ? doc.variantType : doc.model,
      subtitle: doc.decodedSubPath || doc.relativePath,
      badgeText: ver ? `v${ver}` : 'TXT',
    };
  }

  return {
    title: doc.fileName,
    subtitle: doc.decodedSubPath || doc.model,
    badgeText: doc.extension.replace('.', '').toUpperCase() || 'DOC',
  };
}

/**
 * URL 호스트 위치의 사설 IP(10.x, 172.16-31.x, 192.168.x)만 마스킹합니다.
 * 버전 문자열(예: 2.0.0.3, 10.0.0.1)은 건드리지 않습니다.
 */
export function maskInternalIps(text: string): string {
  return text.replace(
    /(https?:\/\/)(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}(:\d+)?/gi,
    '$1internal-repo$2',
  );
}

/**
 * 마크다운 내부 이미지 URL을 우리 포털의 로컬 캐시 인라인 스트리밍 엔드포인트로 변환합니다.
 * - http://<내부IP>/JenkinsRelease/<경로> -> /api/download?path=<경로>&inline=1
 * - 문서 기준 상대경로(./2.0.0.0/foo.png) -> /api/download?path=<합성경로>&inline=1
 */
export function resolveMarkdownImageSrc(
  rawSrc: string,
  docRelativePath: string,
): { src: string; resolvedRelativePath: string | null } {
  const trimmed = rawSrc.trim();

  const jenkinsMatch = trimmed.match(/^https?:\/\/[^/]+\/JenkinsRelease\/(.+)$/i);
  if (jenkinsMatch) {
    let decoded = jenkinsMatch[1];
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // ignore
    }
    const cleanRel = normalizePosixPath(decoded);
    return {
      src: `/api/download?path=${encodeURIComponent(cleanRel)}&inline=1`,
      resolvedRelativePath: cleanRel,
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      src: maskInternalIps(trimmed),
      resolvedRelativePath: null,
    };
  }

  if (/^data:image\//i.test(trimmed)) {
    return { src: trimmed, resolvedRelativePath: null };
  }

  const docDir = posixDirname(docRelativePath);
  const resolved = normalizePosixPath(`${docDir}/${trimmed}`);
  return {
    src: `/api/download?path=${encodeURIComponent(resolved)}&inline=1`,
    resolvedRelativePath: resolved,
  };
}

/**
 * 한글·영문 마크다운 헤딩 앵커 슬러그 생성 (#이전-버전-마이그레이션-방법 등 호환)
 */
export function slugifyHeading(rawText: string): string {
  return rawText
    .toLowerCase()
    .replace(/[`*_~[\]()!]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
