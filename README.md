# Industrial Software Release Portal (Sample Web App)

> **샘플 쇼케이스용 인더스트리얼 소프트웨어 및 펌웨어 배포 관리 포털 웹 애플리케이션**  
> 반도체 계측, 머신비전 검사, 엣지 게이트웨이, 장비 제어 S/W의 배포 이력 모니터링, 버전별 체인지로그 열람, 바이너리 다운로드를 제공하는 고성능 단독 실행형 대시보드입니다.

---

## 🌟 프로젝트 개요 (Overview)

본 프로젝트는 산업용 임베디드 장비 및 자동화 소프트웨어의 릴리즈 배포 자산을 체계적으로 관리하고 모니터링하기 위해 구축된 엔터프라이즈급 릴리즈 포털입니다.  
**샘플 웹앱 및 데모 쇼케이스**용으로 사내망 전용 스토리지(SMB3/CIFS) 종속성을 분리하고, 실제 산업 현장의 데이터 구조를 정밀하게 재현한 **인메모리 모의 데이터 엔진(Mock Data Engine)**을 탑재하여 외부 네트워크나 환경 변수 설정 없이도 모든 UI/UX 기능(차트, 검색, 마크다운 뷰어, 테마 스위처, 다운로드 시뮬레이션)을 100% 인터랙티브하게 체험할 수 있습니다.

---

## 🚀 주요 기능 및 UX 특징

### 1. Forest Emerald & Slate 듀얼 테마 시스템 (Dark / Light / System)
- 산업 제어 룸 및 클린룸의 현장 조도 환경에 최적화된 **에메랄드/세이지 민트 컬러 팔레트** 구축.
- `next-themes`와 Tailwind CSS v4 `@custom-variant dark`를 결합하여 깜빡임 없는 테마 전환 구현.
- 다크 모드 특화 텍스트 대비율 조율: 본문 `#dde4e1`, 세컨더리 `#e5ebe8`, 뮤트 텍스트 `#93a39b`, 루미너스 에메랄드 글래스 액센트.

### 2. Bento 그리드 & 반응형 메트릭 시각화
- **실시간 KPI 카드**: 제품군 수, 인스톨러 총 수량, 펌웨어 수, 총 배포 용량을 카운트업 애니메이션(`AnimatedNumber`)으로 표현.
- **도넛 차트 & 카테고리 구성 비율**: 메이저 장비 S/W 및 유틸리티 비율 시각화.
- **수평 시퀀셜 바 차트 (Bar Chart)**: 패키지 개수(Count) 및 파일 용량(Size) 기준의 탭 전환형 순위 시각화.
- **스크롤 리빌 (Scroll Reveal)**: 뷰포트 진입에 따른 유려한 페이드인 모션.

### 3. 고도화된 릴리즈 노트 & 체인지로그 뷰어
- `react-markdown` 및 `remark-gfm` 기반의 GitHub Flavored Markdown 렌더링.
- 릴리즈 하이라이트, 패치 내역, 시스템 사양 테이블, SHA-256 체크섬 표기 지원.
- 동일 제품군 내 **다중 버전 히스토리 사이드바** 및 버전 검색 필터링 연동.
- 일반 텍스트(`.txt`) 및 인코딩 자동 감지 렌더링.

### 4. ⌘K (Ctrl+K) 전역 커맨드 검색 팔레트
- `cmdk` + Radix UI 기반 키보드 네비게이션.
- 제품명, 버전, 파일명, 카테고리를 실시간 퍼지 검색하여 해당 제품 페이지나 파일로 즉시 이동.

### 5. 다차원 릴리즈 필터링 & 파일 다운로드 시뮬레이션
- 제품별 상세 뷰(`products/[slug]`)에서 파생 모델(Variant), 폴더, 텍스트 검색을 통한 실시간 다차원 필터링.
- 파일명 클릭 시 로딩 스피너 및 진행 상태(`준비 중...` → `다운로드 완료`)를 거쳐 브라우저 표준 파일 다운로드 트리거.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** (App Router, Turbopack) | 최신 Next.js SSR 및 정적 최적화 |
| **Core** | **React 19** & **TypeScript 5.x / 7.x** | 최신 React 동시성 및 엄격한 타입 안정성 |
| **Styling** | **Tailwind CSS v4** | 최신 CSS 엔진 기반 고성능 유틸리티 스타일링 |
| **UI Components** | **shadcn/ui** (Radix UI) | 접근성 준수 헤드리스 컴포넌트 라이브러리 |
| **Icons** | **Lucide React** | 일관된 모던 벡터 아이콘 셋 |
| **Markdown** | **react-markdown** & **remark-gfm** | 표준 마크다운 및 테이블/Gfm 확장 지원 |
| **Command Menu**| **cmdk** | 고성능 전역 검색 모달 및 키바인딩 |

---

## 📂 디렉토리 구조 (Directory Structure)

```text
app_release_sample/
├── config/
│   └── products.json             # 산업용 소프트웨어 제품군 메타데이터 정의
├── public/
│   └── logo.png                  # 포털 브랜딩 로고 및 에셋
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── download/         # 모의 파일 스트리밍 다운로드 엔드포인트
│   │   │   ├── release-note/     # 마크다운 릴리즈 노트 제공 엔드포인트
│   │   │   └── scan/             # 배포 스토리지 모의 스캔 엔드포인트
│   │   ├── products/[slug]/      # 제품별 상세 배포 내역 동적 라우트
│   │   ├── globals.css           # Tailwind v4 디자인 토큰 및 듀얼 테마 변수
│   │   ├── layout.tsx            # 전역 루트 레이아웃 & ThemeProvider
│   │   └── page.tsx              # 메인 릴리즈 대시보드 페이지
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 기본 원자 단위 컴포넌트
│   │   ├── AppShell.tsx          # 접이식 반응형 사이드바, 헤더, 브레드크럼
│   │   ├── CommandSearchModal.tsx# 전역 ⌘K 빠른 검색 모달
│   │   ├── FileDownloadLink.tsx  # 다운로드 상태 관리 및 링크 컴포넌트
│   │   ├── ProductReleaseView.tsx# 제품별 릴리즈 테이블, 다차원 필터
│   │   ├── ReleaseNoteContent.tsx# react-markdown 기반 렌더러
│   │   ├── ReleaseNoteDialog.tsx # 버전 히스토리 다이얼로그 모달
│   │   ├── ScanDashboard.tsx     # 메인 Bento KPI, 차트, 제품 바로가기 그리드
│   │   ├── ThemeProvider.tsx     # next-themes 전역 래퍼
│   │   └── ThemeToggle.tsx       # 다크/라이트/시스템 모드 전환 토글
│   └── lib/
│       ├── mock-data.ts          # 고품질 산업용 소프트웨어 모의 릴리즈 데이터셋
│       ├── product-catalog.ts    # 제품 슬러그 및 폴더 매핑 유틸리티
│       ├── release-classifier.ts # 파일 확장자, 버전, 패키지 종류 분류기
│       ├── release-note-matcher.ts# 릴리즈-체인지로그 매칭 및 인덱서
│       ├── smb-scanner.ts        # 스토리지 스캔 인터페이스 (Mock 연동)
│       └── utils.ts              # cn() 클래스 병합 유틸리티
├── components.json               # shadcn/ui 설정
├── next.config.ts                # Next.js 빌드 설정
├── package.json                  # 프로젝트 의존성 정보
├── postcss.config.mjs            # PostCSS 설정
├── tsconfig.json                 # TypeScript 컴파일러 설정
├── LICENSE                       # 프로젝트 라이선스 (MIT)
├── THIRD_PARTY_LICENSES.md       # 서드파티 오픈소스 라이선스 고지서
└── README.md                     # 프로젝트 설명서
```

---

## ⚡ 빠른 시작 (Quick Start)

본 프로젝트는 외부 데이터베이스나 사내 파일 공유 서버 연결 없이 로컬에서 바로 실행할 수 있습니다.

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하여 포털을 확인합니다.

### 3. 프로덕션 빌드 및 실행
```bash
npm run build
npm run start
```

---

## 🖥️ 주요 화면 구성

1. **Dashboard (`/`)**
   - 상단 KPI 메트릭 요약 (전체 모델, 인스톨러, 펌웨어, 총 용량).
   - 좌측 최신 릴리즈 인스톨러 카드 & 릴리즈 노트 원클릭 모달.
   - 중앙 도넛 차트 (카테고리별 점유율) & 우측 시퀀셜 바 차트 (개수/용량 랭킹).
   - 하단 제품군별 바로가기 카드 그리드 & 전체 파일 정렬 테이블.

2. **Product Detail (`/products/[slug]`)**
   - 제품별 요약 카드 및 파생 모델(Variant) 탭 필터링.
   - 릴리즈 파일 목록 테이블 (버전, 빌드일자, 파일 크기, 다운로드 액션).
   - 릴리즈 노트 열람 버튼 클릭 시 마크다운 체인지로그 다이얼로그 팝업.

3. **Command Palette (`Ctrl+K` 또는 `⌘K`)**
   - 키보드로 전역 검색 창을 호출하여 원하는 소프트웨어 모델이나 특정 버전으로 바로 이동.

---

## 📄 라이선스 (License)

- **프로젝트 라이선스**: [MIT License](LICENSE) (자유로운 열람, 학습, 수정 및 포트폴리오 활용 가능)
- **오픈소스 패키지 고지**: 프로젝트에 사용된 서드파티 라이브러리 라이선스 세부 정보는 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)에서 확인할 수 있습니다.
