import { PRODUCT_DEFINITIONS, type ProductDefinition } from './product-catalog.ts';
import type {
  ClassifiedFileItem,
  ProductGroupSummary,
  ModelScanSummary,
  ScanSummary,
} from './release-classifier.ts';

// ---------------------------------------------------------------------------
// 가상 릴리즈 노트 마크다운 데이터 (Sample Markdown Changelogs)
// ---------------------------------------------------------------------------
export const MOCK_RELEASE_NOTES: Record<string, string> = {
  'NexusControl/changelogs/2.4.1.md': `# NEXUS Control Suite Release v2.4.1

> **배포 일자**: 2026-10-24  
> **빌드 버전**: \`2.4.1.1082\`  
> **분류**: 정기 유지보수 및 안정화 패치 (Stable)

---

### 🚀 주요 개선 사항 (Highlights)
- **EtherCAT 32축 동시 제어 지연 시간 단축**: 실시간 커널 버퍼링 엔진 리팩토링으로 서보 동기 지연이 18ms에서 3.2ms로 82% 개선되었습니다.
- **다크/라이트 테마 통합 HMI**: 산업 현장 조도 환경에 맞추어 자동 테마 전환을 지원합니다.
- **다중 센서 동기화 프로토콜 v2 적용**: 광학식 계측 센서와 디지털 IO 트리거 간 동기 오차를 0.5μs 미만으로 유지합니다.

---

### 🛠️ 버그 수정 (Bug Fixes)
- \`[Comm]\` 장시간 실행 시 TCP Keep-alive 타이머 만료로 인한 일시적 세션 끊김 현상 수정.
- \`[UI]\` 4K 고해상도 모니터 환경에서 차트 렌더링 시 텍스트 겹침 현상 수정.
- \`[Recipe]\` 다중 파라미터 일괄 저장 시 일부 플로트 값이 반올림되어 기록되던 오류 수정.

---

### 📦 시스템 요구 사항 및 무결성
| 구분 | 권장 사양 |
| :--- | :--- |
| **운영체제** | Windows 10 / 11 IoT Enterprise 64-bit |
| **권장 하드웨어** | Intel Core i7-12700 이상 / RAM 32GB 이상 |
| **파일 크기** | 193,146,880 Bytes (184.2 MB) |
| **SHA-256** | \`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\` |
`,

  'NexusControl/changelogs/2.4.0.md': `# NEXUS Control Suite Release v2.4.0

> **배포 일자**: 2026-09-18  
> **빌드 버전**: \`2.4.0.0915\`  
> **분류**: 메이저 기능 추가 릴리즈 (Feature Release)

---

### 🌟 신규 기능 (New Features)
- **차세대 모션 컨트롤러 드라이버 탑재**: EtherCAT 기반 고성능 서보 드라이브 다축 동시 보간 제어 지원.
- **스마트 자동 보정(Auto Calibration) 마법사**: 센서 오차 자동 보정 알고리즘 추가.
- **장비 텔레메트리 REST API 게이트웨이 내장**: 공장 MES/SCADA 시스템과 실시간 연동 지원.
`,

  'NexusControl/changelogs/2.3.8.md': `# NEXUS Control Suite Release v2.3.8

> **배포 일자**: 2026-08-05  
> **빌드 버전**: \`2.3.8.0801\`  
> **분류**: 현장 긴급 안정화 패치 (Hotfix)

---

### 🛠️ 주요 수정 사항
- 비상 정지(E-STOP) 시그널 수신 시 서보 브레이크 체결 지연 버그 패치.
- 데이터 로거 디스크 용량 한계 도달 시 자동 FIFO 정리 로직 추가.
`,

  'OptiMetrix-3000/changelogs/3.2.0.md': `# OptiMetrix 3000 Series Release v3.2.0

> **배포 일자**: 2026-10-20  
> **빌드 버전**: \`3.2.0.2201\`  
> **대상 장비**: OptiMetrix-3000, OptiMetrix-Dual, OptiMetrix-Ultra

---

### 🌟 업데이트 하이라이트
- **반도체 박막 두께 실시간 광학 측정 모듈 최적화**: 0.05nm 분해능 초정밀 계측 달성.
- **웨이퍼 맵 3D 시각화 개선**: WebGL 가속 기반 실시간 등고선 매핑 뷰어 탑재.
- **FDC(Fault Detection & Classification) 연동 강화**: SECS/GEM 통신 드라이버 안정화.

---

### 📋 패키지 정보
- **OptiMetrix_Setup_v3.2.0.exe**: 기본 인스톨러 (225.8 MB)
- **OptiMetrix_Dual_v3.2.0.exe**: 고정밀 듀얼 챔버 지원 모델 (239.7 MB)
- **OptiMetrix_Ultra_v2.9.1.exe**: 광학 모듈 전용 릴리즈 (204.4 MB)
`,

  'VisionCraft-X5/changelogs/4.0.2.md': `# VisionCraft X5 Release v4.0.2

> **배포 일자**: 2026-10-26  
> **빌드 버전**: \`4.0.2.1026\`  
> **분류**: 머신비전 AI 추론 엔진 업데이트

---

### 🚀 신규 기능 및 개선점
- **TensorRT 10.x 가속 엔진 통합**: 4K 120fps 카메라 프레임 실시간 결함 검출 달성.
- **초소형 스크래치 검출 정확도 향상**: False-Positive 검출률 42% 감소.
- **다중 카메라 트리거 지터 최소화**: GigE Vision 2.1 하드웨어 타임스탬프 동기화.
`,

  'AeroFlow-M2/changelogs/1.8.6.md': `# AeroFlow M2 Controller Release v1.8.6

> **배포 일자**: 2026-10-12  
> **빌드 버전**: \`1.8.6.1010\`  
> **분류**: 유량 제어기 펌웨어 및 운영 런타임

---

### 🔧 변경 내역
- MFC(Mass Flow Controller) 밸브 응답 커브 비선형 보정 알고리즘 추가.
- 아날로그 입력 ADC 필터링 노이즈 저감 알고리즘 개선.
`,

  'EdgePulse-10/changelogs/1.5.3.md': `# EdgePulse 10 Service Release v1.5.3

> **배포 일자**: 2026-10-18  
> **빌드 버전**: \`1.5.3.098\`  
> **분류**: 엣지 게이트웨이 서비스

---

### 💡 개선 사항
- MQTT v5 메시지 큐 버퍼링 및 네트워크 단절 시 로컬 SQLite 캐싱 로직 보강.
- TLS 1.3 암호화 통신 프로파일 지원.
`,

  'MetroGauge-70/changelogs/2.1.0.md': `# MetroGauge 70 Release v2.1.0

> **배포 일자**: 2026-09-25  
> **빌드 버전**: \`2.1.0.0920\`  
> **분류**: 휴대용 계측 툴

---

### 💡 신규 기능
- 블루투스 BLE 현장 계측 데이터 실시간 무선 스트리밍 지원.
- 배터리 전력 소비 15% 최적화 모드 탑재.
`,

  'HydroClean-Auto/changelogs/1.2.8.md': `# HydroClean Auto Release v1.2.8

> **배포 일자**: 2026-08-20  
> **빌드 버전**: \`1.2.8.0815\`

---

### 💡 변경 사항
- 세척 노즐 분사 압력 이상 감지 인터록 시퀀스 강화.
- 펌프 작동 시간 기반 예방 보전(PM) 알람 추가.
`,

  'DiagramCraft/changelogs/3.5.0.md': `# DiagramCraft Pro Release v3.5.0

> **배포 일자**: 2026-10-22  
> **빌드 버전**: \`3.5.0.1018\`  
> **분류**: 공정 배관계장도 도면 유틸리티

---

### 🎨 신규 기능 및 개선점
- **ISA 5.1 계측 심볼 라이브러리 확장**: 240+ 신규 밸브 및 센서 그래픽 심볼 추가.
- **AutoCAD DXF/DWG 및 SVG 내보내기 고도화**: 레이어 및 라인 속성 100% 보존.
- **실시간 배관 루프 유효성 검사**: 닫히지 않은 유체 라인 자동 하이라이트.
`,

  'TelemetryScope/changelogs/1.4.0.md': `# TelemetryScope Release v1.4.0

> **배포 일자**: 2026-10-11  
> **빌드 버전**: \`1.4.0.0930\`

---

### 📊 기능 요약
- 10GB 초과 대용량 텍스트 로그 파일 초고속 인덱싱 및 정규식 필터링 지원.
- 이상 상태(Anomaly) 발생 시점 타임라인 자동 북마크.
`,
};

// ---------------------------------------------------------------------------
// 가상 파일 목록 생성 (Sample ClassifiedFileItems)
// ---------------------------------------------------------------------------
export const MOCK_FILES: ClassifiedFileItem[] = [
  // 1. NEXUS Control Suite
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/NexusControl_Installer_v2.4.1.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\NexusControl_Installer_v2.4.1.exe',
    fileName: 'NexusControl_Installer_v2.4.1.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'NexusControl_Installer_v2.4.1.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '2.4.1',
    buildDate: '2026-10-24',
    sizeBytes: 193146880,
    mtimeIso: '2026-10-24T14:35:00.000Z',
  },
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/NexusControl_Installer_v2.4.0.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\NexusControl_Installer_v2.4.0.exe',
    fileName: 'NexusControl_Installer_v2.4.0.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'NexusControl_Installer_v2.4.0.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '2.4.0',
    buildDate: '2026-09-18',
    sizeBytes: 191365120,
    mtimeIso: '2026-09-18T11:20:00.000Z',
  },
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/NexusControl_Installer_v2.3.8.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\NexusControl_Installer_v2.3.8.exe',
    fileName: 'NexusControl_Installer_v2.3.8.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'NexusControl_Installer_v2.3.8.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '2.3.8',
    buildDate: '2026-08-05',
    sizeBytes: 188534784,
    mtimeIso: '2026-08-05T16:10:00.000Z',
  },
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/changelogs/2.4.1.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\changelogs\\2.4.1.md',
    fileName: '2.4.1.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/2.4.1.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '2.4.1',
    buildDate: '2026-10-24',
    sizeBytes: 2450,
    mtimeIso: '2026-10-24T14:38:00.000Z',
  },
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/changelogs/2.4.0.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\changelogs\\2.4.0.md',
    fileName: '2.4.0.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/2.4.0.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '2.4.0',
    buildDate: '2026-09-18',
    sizeBytes: 1820,
    mtimeIso: '2026-09-18T11:22:00.000Z',
  },
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/changelogs/2.3.8.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\changelogs\\2.3.8.md',
    fileName: '2.3.8.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/2.3.8.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '2.3.8',
    buildDate: '2026-08-05',
    sizeBytes: 1450,
    mtimeIso: '2026-08-05T16:12:00.000Z',
  },
  {
    productSlug: 'nexus-control',
    productName: 'NEXUS Control Suite',
    model: 'NexusControl',
    relativePath: 'NexusControl/Firmwares/Nexus_DSP_v1.3.4.bin',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\NexusControl\\Firmwares\\Nexus_DSP_v1.3.4.bin',
    fileName: 'Nexus_DSP_v1.3.4.bin',
    extension: '.bin',
    subFolders: ['Firmwares'],
    decodedSubPath: 'Firmwares/Nexus_DSP_v1.3.4.bin',
    kind: 'firmware',
    variantType: 'Firmwares',
    version: '1.3.4',
    buildDate: '2026-10-15',
    sizeBytes: 2516582,
    mtimeIso: '2026-10-15T09:40:00.000Z',
  },

  // 2. OptiMetrix 3000
  {
    productSlug: 'optimetrix-3000',
    productName: 'OptiMetrix 3000',
    model: 'OptiMetrix-3000',
    relativePath: 'OptiMetrix-3000/OptiMetrix_Setup_v3.2.0.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\OptiMetrix-3000\\OptiMetrix_Setup_v3.2.0.exe',
    fileName: 'OptiMetrix_Setup_v3.2.0.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'OptiMetrix_Setup_v3.2.0.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '3.2.0',
    buildDate: '2026-10-20',
    sizeBytes: 225850000,
    mtimeIso: '2026-10-20T10:15:00.000Z',
  },
  {
    productSlug: 'optimetrix-3000',
    productName: 'OptiMetrix 3000',
    model: 'OptiMetrix-3000',
    relativePath: 'OptiMetrix-3000/OptiMetrix_Setup_v3.1.5.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\OptiMetrix-3000\\OptiMetrix_Setup_v3.1.5.exe',
    fileName: 'OptiMetrix_Setup_v3.1.5.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'OptiMetrix_Setup_v3.1.5.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '3.1.5',
    buildDate: '2026-08-30',
    sizeBytes: 220300000,
    mtimeIso: '2026-08-30T15:20:00.000Z',
  },
  {
    productSlug: 'optimetrix-3000',
    productName: 'OptiMetrix 3000',
    model: 'OptiMetrix-Dual',
    relativePath: 'OptiMetrix-Dual/OptiMetrix_Dual_v3.2.0.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\OptiMetrix-Dual\\OptiMetrix_Dual_v3.2.0.exe',
    fileName: 'OptiMetrix_Dual_v3.2.0.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'OptiMetrix_Dual_v3.2.0.exe',
    kind: 'installer',
    variantType: 'High-Precision Dual',
    version: '3.2.0',
    buildDate: '2026-10-15',
    sizeBytes: 239700000,
    mtimeIso: '2026-10-15T17:00:00.000Z',
  },
  {
    productSlug: 'optimetrix-3000',
    productName: 'OptiMetrix 3000',
    model: 'OptiMetrix-Ultra',
    relativePath: 'OptiMetrix-Ultra/OptiMetrix_Ultra_v2.9.1.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\OptiMetrix-Ultra\\OptiMetrix_Ultra_v2.9.1.exe',
    fileName: 'OptiMetrix_Ultra_v2.9.1.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'OptiMetrix_Ultra_v2.9.1.exe',
    kind: 'installer',
    variantType: 'Optics Ultra',
    version: '2.9.1',
    buildDate: '2026-07-11',
    sizeBytes: 204472320,
    mtimeIso: '2026-07-11T13:40:00.000Z',
  },
  {
    productSlug: 'optimetrix-3000',
    productName: 'OptiMetrix 3000',
    model: 'OptiMetrix-3000',
    relativePath: 'OptiMetrix-3000/changelogs/3.2.0.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\OptiMetrix-3000\\changelogs\\3.2.0.md',
    fileName: '3.2.0.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/3.2.0.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '3.2.0',
    buildDate: '2026-10-20',
    sizeBytes: 1980,
    mtimeIso: '2026-10-20T10:18:00.000Z',
  },

  // 3. VisionCraft X5
  {
    productSlug: 'vision-craft-x5',
    productName: 'VisionCraft X5',
    model: 'VisionCraft-X5',
    relativePath: 'VisionCraft-X5/VisionCraftX5_Setup_v4.0.2.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\VisionCraft-X5\\VisionCraftX5_Setup_v4.0.2.exe',
    fileName: 'VisionCraftX5_Setup_v4.0.2.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'VisionCraftX5_Setup_v4.0.2.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '4.0.2',
    buildDate: '2026-10-26',
    sizeBytes: 537700000,
    mtimeIso: '2026-10-26T16:50:00.000Z',
  },
  {
    productSlug: 'vision-craft-x5',
    productName: 'VisionCraft X5',
    model: 'VisionCraft-X5',
    relativePath: 'VisionCraft-X5/VisionCraftX5_Setup_v4.0.0.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\VisionCraft-X5\\VisionCraftX5_Setup_v4.0.0.exe',
    fileName: 'VisionCraftX5_Setup_v4.0.0.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'VisionCraftX5_Setup_v4.0.0.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '4.0.0',
    buildDate: '2026-09-02',
    sizeBytes: 522400000,
    mtimeIso: '2026-09-02T14:10:00.000Z',
  },
  {
    productSlug: 'vision-craft-x5',
    productName: 'VisionCraft X5',
    model: 'VisionCraft-X5',
    relativePath: 'VisionCraft-X5/VisionCraftX5_Setup_v3.8.9.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\VisionCraft-X5\\VisionCraftX5_Setup_v3.8.9.exe',
    fileName: 'VisionCraftX5_Setup_v3.8.9.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'VisionCraftX5_Setup_v3.8.9.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '3.8.9',
    buildDate: '2026-06-15',
    sizeBytes: 487600000,
    mtimeIso: '2026-06-15T18:20:00.000Z',
  },
  {
    productSlug: 'vision-craft-x5',
    productName: 'VisionCraft X5',
    model: 'VisionCraft-X5',
    relativePath: 'VisionCraft-X5/changelogs/4.0.2.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\VisionCraft-X5\\changelogs\\4.0.2.md',
    fileName: '4.0.2.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/4.0.2.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '4.0.2',
    buildDate: '2026-10-26',
    sizeBytes: 1750,
    mtimeIso: '2026-10-26T16:55:00.000Z',
  },

  // 4. AeroFlow M2
  {
    productSlug: 'aero-flow-m2',
    productName: 'AeroFlow M2',
    model: 'AeroFlow-M2',
    relativePath: 'AeroFlow-M2/AeroFlowM2_Runtime_v1.8.6.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\AeroFlow-M2\\AeroFlowM2_Runtime_v1.8.6.exe',
    fileName: 'AeroFlowM2_Runtime_v1.8.6.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'AeroFlowM2_Runtime_v1.8.6.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.8.6',
    buildDate: '2026-10-12',
    sizeBytes: 99100000,
    mtimeIso: '2026-10-12T11:45:00.000Z',
  },
  {
    productSlug: 'aero-flow-m2',
    productName: 'AeroFlow M2',
    model: 'AeroFlow-M2',
    relativePath: 'AeroFlow-M2/AeroFlowM2_Runtime_v1.8.4.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\AeroFlow-M2\\AeroFlowM2_Runtime_v1.8.4.exe',
    fileName: 'AeroFlowM2_Runtime_v1.8.4.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'AeroFlowM2_Runtime_v1.8.4.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.8.4',
    buildDate: '2026-08-14',
    sizeBytes: 97600000,
    mtimeIso: '2026-08-14T09:30:00.000Z',
  },
  {
    productSlug: 'aero-flow-m2',
    productName: 'AeroFlow M2',
    model: 'AeroFlow-M2',
    relativePath: 'AeroFlow-M2/Firmwares/AeroFlow_MCU_v1.12.hex',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\AeroFlow-M2\\Firmwares\\AeroFlow_MCU_v1.12.hex',
    fileName: 'AeroFlow_MCU_v1.12.hex',
    extension: '.hex',
    subFolders: ['Firmwares'],
    decodedSubPath: 'Firmwares/AeroFlow_MCU_v1.12.hex',
    kind: 'firmware',
    variantType: 'Firmwares',
    version: '1.12.0',
    buildDate: '2026-09-10',
    sizeBytes: 1153433,
    mtimeIso: '2026-09-10T14:20:00.000Z',
  },
  {
    productSlug: 'aero-flow-m2',
    productName: 'AeroFlow M2',
    model: 'AeroFlow-M2',
    relativePath: 'AeroFlow-M2/changelogs/1.8.6.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\AeroFlow-M2\\changelogs\\1.8.6.md',
    fileName: '1.8.6.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/1.8.6.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '1.8.6',
    buildDate: '2026-10-12',
    sizeBytes: 1200,
    mtimeIso: '2026-10-12T11:48:00.000Z',
  },

  // 5. EdgePulse 10
  {
    productSlug: 'edge-pulse-10',
    productName: 'EdgePulse 10',
    model: 'EdgePulse-10',
    relativePath: 'EdgePulse-10/EdgePulse10_Service_v1.5.3.zip',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\EdgePulse-10\\EdgePulse10_Service_v1.5.3.zip',
    fileName: 'EdgePulse10_Service_v1.5.3.zip',
    extension: '.zip',
    subFolders: [],
    decodedSubPath: 'EdgePulse10_Service_v1.5.3.zip',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.5.3',
    buildDate: '2026-10-18',
    sizeBytes: 67320000,
    mtimeIso: '2026-10-18T13:10:00.000Z',
  },
  {
    productSlug: 'edge-pulse-10',
    productName: 'EdgePulse 10',
    model: 'EdgePulse-10',
    relativePath: 'EdgePulse-10/EdgePulse10_Service_v1.5.0.zip',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\EdgePulse-10\\EdgePulse10_Service_v1.5.0.zip',
    fileName: 'EdgePulse10_Service_v1.5.0.zip',
    extension: '.zip',
    subFolders: [],
    decodedSubPath: 'EdgePulse10_Service_v1.5.0.zip',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.5.0',
    buildDate: '2026-07-22',
    sizeBytes: 65000000,
    mtimeIso: '2026-07-22T10:00:00.000Z',
  },
  {
    productSlug: 'edge-pulse-10',
    productName: 'EdgePulse 10',
    model: 'EdgePulse-10',
    relativePath: 'EdgePulse-10/changelogs/1.5.3.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\EdgePulse-10\\changelogs\\1.5.3.md',
    fileName: '1.5.3.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/1.5.3.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '1.5.3',
    buildDate: '2026-10-18',
    sizeBytes: 1350,
    mtimeIso: '2026-10-18T13:15:00.000Z',
  },

  // 6. MetroGauge 70
  {
    productSlug: 'metro-gauge-70',
    productName: 'MetroGauge 70',
    model: 'MetroGauge-70',
    relativePath: 'MetroGauge-70/MetroGauge70_Setup_v2.1.0.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\MetroGauge-70\\MetroGauge70_Setup_v2.1.0.exe',
    fileName: 'MetroGauge70_Setup_v2.1.0.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'MetroGauge70_Setup_v2.1.0.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '2.1.0',
    buildDate: '2026-09-25',
    sizeBytes: 117440000,
    mtimeIso: '2026-09-25T15:30:00.000Z',
  },
  {
    productSlug: 'metro-gauge-70',
    productName: 'MetroGauge 70',
    model: 'MetroGauge-70',
    relativePath: 'MetroGauge-70/MetroGauge70_Setup_v2.0.4.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\MetroGauge-70\\MetroGauge70_Setup_v2.0.4.exe',
    fileName: 'MetroGauge70_Setup_v2.0.4.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'MetroGauge70_Setup_v2.0.4.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '2.0.4',
    buildDate: '2026-06-18',
    sizeBytes: 113700000,
    mtimeIso: '2026-06-18T11:15:00.000Z',
  },
  {
    productSlug: 'metro-gauge-70',
    productName: 'MetroGauge 70',
    model: 'MetroGauge-70',
    relativePath: 'MetroGauge-70/changelogs/2.1.0.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\MetroGauge-70\\changelogs\\2.1.0.md',
    fileName: '2.1.0.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/2.1.0.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '2.1.0',
    buildDate: '2026-09-25',
    sizeBytes: 1100,
    mtimeIso: '2026-09-25T15:35:00.000Z',
  },

  // 7. HydroClean Auto
  {
    productSlug: 'hydro-clean-auto',
    productName: 'HydroClean Auto',
    model: 'HydroClean-Auto',
    relativePath: 'HydroClean-Auto/HydroClean_v1.2.8.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\HydroClean-Auto\\HydroClean_v1.2.8.exe',
    fileName: 'HydroClean_v1.2.8.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'HydroClean_v1.2.8.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.2.8',
    buildDate: '2026-08-20',
    sizeBytes: 82100000,
    mtimeIso: '2026-08-20T17:20:00.000Z',
  },
  {
    productSlug: 'hydro-clean-auto',
    productName: 'HydroClean Auto',
    model: 'HydroClean-Auto',
    relativePath: 'HydroClean-Auto/HydroClean_v1.2.5.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\HydroClean-Auto\\HydroClean_v1.2.5.exe',
    fileName: 'HydroClean_v1.2.5.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'HydroClean_v1.2.5.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.2.5',
    buildDate: '2026-05-30',
    sizeBytes: 80600000,
    mtimeIso: '2026-05-30T10:45:00.000Z',
  },
  {
    productSlug: 'hydro-clean-auto',
    productName: 'HydroClean Auto',
    model: 'HydroClean-Auto',
    relativePath: 'HydroClean-Auto/changelogs/1.2.8.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\HydroClean-Auto\\changelogs\\1.2.8.md',
    fileName: '1.2.8.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/1.2.8.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '1.2.8',
    buildDate: '2026-08-20',
    sizeBytes: 950,
    mtimeIso: '2026-08-20T17:25:00.000Z',
  },

  // 8. DiagramCraft Pro
  {
    productSlug: 'diagram-craft-pro',
    productName: 'DiagramCraft Pro',
    model: 'DiagramCraft',
    relativePath: 'DiagramCraft/DiagramCraft_Setup_v3.5.0.msi',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\DiagramCraft\\DiagramCraft_Setup_v3.5.0.msi',
    fileName: 'DiagramCraft_Setup_v3.5.0.msi',
    extension: '.msi',
    subFolders: [],
    decodedSubPath: 'DiagramCraft_Setup_v3.5.0.msi',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '3.5.0',
    buildDate: '2026-10-22',
    sizeBytes: 152200000,
    mtimeIso: '2026-10-22T09:10:00.000Z',
  },
  {
    productSlug: 'diagram-craft-pro',
    productName: 'DiagramCraft Pro',
    model: 'DiagramCraft',
    relativePath: 'DiagramCraft/DiagramCraft_Setup_v3.4.2.msi',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\DiagramCraft\\DiagramCraft_Setup_v3.4.2.msi',
    fileName: 'DiagramCraft_Setup_v3.4.2.msi',
    extension: '.msi',
    subFolders: [],
    decodedSubPath: 'DiagramCraft_Setup_v3.4.2.msi',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '3.4.2',
    buildDate: '2026-08-10',
    sizeBytes: 147800000,
    mtimeIso: '2026-08-10T14:30:00.000Z',
  },
  {
    productSlug: 'diagram-craft-pro',
    productName: 'DiagramCraft Pro',
    model: 'DiagramCraft',
    relativePath: 'DiagramCraft/changelogs/3.5.0.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\DiagramCraft\\changelogs\\3.5.0.md',
    fileName: '3.5.0.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/3.5.0.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '3.5.0',
    buildDate: '2026-10-22',
    sizeBytes: 1650,
    mtimeIso: '2026-10-22T09:15:00.000Z',
  },

  // 9. TelemetryScope
  {
    productSlug: 'telemetry-scope',
    productName: 'TelemetryScope',
    model: 'TelemetryScope',
    relativePath: 'TelemetryScope/TelemetryScope_v1.4.0.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\TelemetryScope\\TelemetryScope_v1.4.0.exe',
    fileName: 'TelemetryScope_v1.4.0.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'TelemetryScope_v1.4.0.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.4.0',
    buildDate: '2026-10-11',
    sizeBytes: 58090000,
    mtimeIso: '2026-10-11T16:00:00.000Z',
  },
  {
    productSlug: 'telemetry-scope',
    productName: 'TelemetryScope',
    model: 'TelemetryScope',
    relativePath: 'TelemetryScope/TelemetryScope_v1.3.1.exe',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\TelemetryScope\\TelemetryScope_v1.3.1.exe',
    fileName: 'TelemetryScope_v1.3.1.exe',
    extension: '.exe',
    subFolders: [],
    decodedSubPath: 'TelemetryScope_v1.3.1.exe',
    kind: 'installer',
    variantType: '기본 (Main)',
    version: '1.3.1',
    buildDate: '2026-07-15',
    sizeBytes: 55370000,
    mtimeIso: '2026-07-15T12:00:00.000Z',
  },
  {
    productSlug: 'telemetry-scope',
    productName: 'TelemetryScope',
    model: 'TelemetryScope',
    relativePath: 'TelemetryScope/changelogs/1.4.0.md',
    smbPath: '\\\\storage.release-hub.internal\\Distribution\\TelemetryScope\\changelogs\\1.4.0.md',
    fileName: '1.4.0.md',
    extension: '.md',
    subFolders: ['changelogs'],
    decodedSubPath: 'changelogs/1.4.0.md',
    kind: 'doc',
    variantType: 'changelogs',
    version: '1.4.0',
    buildDate: '2026-10-11',
    sizeBytes: 1120,
    mtimeIso: '2026-10-11T16:05:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Model & Product Group Summaries
// ---------------------------------------------------------------------------
export function getMockScanSummary(): ScanSummary {
  const products: ProductGroupSummary[] = PRODUCT_DEFINITIONS.map((def) => {
    const productFiles = MOCK_FILES.filter((f) => f.productSlug === def.slug);
    const installers = productFiles.filter((f) => f.kind === 'installer');
    const firmwares = productFiles.filter((f) => f.kind === 'firmware');
    const docs = productFiles.filter((f) => f.kind === 'doc');
    const totalSizeBytes = productFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

    const sortedByDate = [...installers].sort(
      (a, b) => new Date(b.mtimeIso).getTime() - new Date(a.mtimeIso).getTime(),
    );
    const latest = sortedByDate[0] || null;

    const variantCounts = new Map<string, number>();
    for (const f of productFiles) {
      variantCounts.set(f.variantType, (variantCounts.get(f.variantType) || 0) + 1);
    }

    return {
      slug: def.slug,
      name: def.name,
      description: def.description,
      category: def.category as '장비 S/W' | '유틸리티',
      folders: def.folders,
      presentFolders: def.folders,
      installerCount: installers.length,
      firmwareCount: firmwares.length,
      disabledCount: 0,
      docCount: docs.length,
      totalFileCount: productFiles.length,
      totalSizeBytes,
      variantTypes: Array.from(variantCounts.entries()).map(([name, count]) => ({ name, count })),
      latestFile: latest ? latest.fileName : null,
      latestVersion: latest ? latest.version : null,
      latestMtimeIso: latest ? latest.mtimeIso : null,
    };
  });

  // Group by distinct folder/model
  const modelMap = new Map<string, ClassifiedFileItem[]>();
  for (const f of MOCK_FILES) {
    const key = f.model;
    if (!modelMap.has(key)) modelMap.set(key, []);
    modelMap.get(key)!.push(f);
  }

  const models: ModelScanSummary[] = Array.from(modelMap.entries()).map(([model, files]) => {
    const first = files[0];
    const installers = files.filter((f) => f.kind === 'installer');
    const firmwares = files.filter((f) => f.kind === 'firmware');
    const docs = files.filter((f) => f.kind === 'doc');
    const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

    const sorted = [...installers].sort(
      (a, b) => new Date(b.mtimeIso).getTime() - new Date(a.mtimeIso).getTime(),
    );
    const latest = sorted[0] || null;

    return {
      model,
      productSlug: first.productSlug,
      productName: first.productName,
      fileCount: files.length,
      installerCount: installers.length,
      firmwareCount: firmwares.length,
      docCount: docs.length,
      totalSizeBytes,
      latestFile: latest ? latest.fileName : null,
      latestRelativePath: latest ? latest.relativePath : null,
      latestSizeBytes: latest ? latest.sizeBytes : null,
      latestMtimeIso: latest ? latest.mtimeIso : null,
      sampleSubFolders: Array.from(new Set(files.flatMap((f) => f.subFolders))),
    };
  });

  const extensionCounts: Record<string, number> = {};
  for (const f of MOCK_FILES) {
    extensionCounts[f.extension] = (extensionCounts[f.extension] || 0) + 1;
  }

  const installers = MOCK_FILES.filter((f) => f.kind === 'installer');
  const recentInstallers = [...installers]
    .sort((a, b) => new Date(b.mtimeIso).getTime() - new Date(a.mtimeIso).getTime())
    .slice(0, 8);

  return {
    endpointDisplay: 'Sample Showcase (Cloud Storage Simulation)',
    uncDisplay: '\\\\storage.release-hub.internal\\Distribution',
    share: 'Distribution',
    basePath: 'Releases',
    usernameMasked: 'sample-guest',
    scannedAtIso: new Date().toISOString(),
    elapsedMs: 24,
    totalModels: models.length,
    totalDirectories: 18,
    totalFiles: MOCK_FILES.length,
    totalInstallers: installers.length,
    totalFirmwares: MOCK_FILES.filter((f) => f.kind === 'firmware').length,
    totalSizeBytes: MOCK_FILES.reduce((acc, f) => acc + f.sizeBytes, 0),
    extensionCounts,
    models,
    products,
    recentInstallers,
    files: MOCK_FILES,
  };
}
