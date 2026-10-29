export interface ProductDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  folders: string[];
}

export const PRODUCT_DEFINITIONS: ProductDefinition[] = [
  {
    slug: 'optimetrix-3000',
    name: 'OptiMetrix 3000',
    description: '반도체 박막 두께 실시간 초정밀 광학 계측 및 3D 웨이퍼 맵 분석 소프트웨어',
    category: '장비 S/W',
    folders: ['OptiMetrix-3000', 'OptiMetrix-Dual', 'OptiMetrix-Ultra'],
  },
  {
    slug: 'nexus-control',
    name: 'NEXUS Control Suite',
    description: '차세대 차등 모션 제어 및 공정 시퀀스 통합 런타임 플랫폼 (EtherCAT 32축 지원)',
    category: '장비 S/W',
    folders: ['NexusControl'],
  },
  {
    slug: 'vision-craft-x5',
    name: 'VisionCraft X5',
    description: '초고속 머신비전 광학 결함 검사 및 TensorRT 기반 딥러닝 추론 엔진',
    category: '장비 S/W',
    folders: ['VisionCraft-X5'],
  },
  {
    slug: 'aero-flow-m2',
    name: 'AeroFlow M2',
    description: '정밀 유량 제어기(MFC) 및 밸브 시퀀서 임베디드 런타임 제어기',
    category: '장비 S/W',
    folders: ['AeroFlow-M2'],
  },
  {
    slug: 'edge-pulse-10',
    name: 'EdgePulse 10',
    description: '스마트 팩토리 IIoT 엣지 게이트웨이 및 실시간 MQTT 텔레메트리 에이전트',
    category: '장비 S/W',
    folders: ['EdgePulse-10'],
  },
  {
    slug: 'metro-gauge-70',
    name: 'MetroGauge 70',
    description: '휴대용 정밀 단차 계측 단말 및 무선 BLE 현장 진단 소프트웨어',
    category: '장비 S/W',
    folders: ['MetroGauge-70'],
  },
  {
    slug: 'hydro-clean-auto',
    name: 'HydroClean Auto',
    description: '다단 고압 분사 노즐 세척 및 살균 공정 시퀀스 자동화 컨트롤러',
    category: '장비 S/W',
    folders: ['HydroClean-Auto'],
  },
  {
    slug: 'diagram-craft-pro',
    name: 'DiagramCraft Pro',
    description: 'ISA 5.1 표준 공정 배관계장도(P&ID) 벡터 다이어그램 에디터 및 심볼 라이브러리',
    category: '유틸리티',
    folders: ['DiagramCraft'],
  },
  {
    slug: 'telemetry-scope',
    name: 'TelemetryScope',
    description: '대용량 장비 시계열 로그 인덱서 및 실시간 이벤트 이상 감지 분석기',
    category: '유틸리티',
    folders: ['TelemetryScope'],
  },
];

export function toProductSlug(folderName: string): string {
  return folderName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findProductForFolder(
  folderName: string,
  definitions: ProductDefinition[] = PRODUCT_DEFINITIONS,
): ProductDefinition {
  const normalized = folderName.toLowerCase();
  const matched = definitions.find((def) =>
    def.folders.some((f) => f.toLowerCase() === normalized),
  );
  if (matched) return matched;

  return {
    slug: `auto-${toProductSlug(folderName)}`,
    name: folderName,
    description: `${folderName} 릴리즈 패키지`,
    category: '장비 S/W',
    folders: [folderName],
  };
}
