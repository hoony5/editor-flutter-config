# Flutter Project Settings

Flutter 프로젝트의 **설정·권한·에셋·라우팅·의존성**을 VSCode 사이드바에서 통합 관리하는 확장.
CLI(`fat`)를 통해 AI 에이전트·터미널에서도 동일 기능을 JSON으로 조회할 수 있습니다.

> **특정 Flutter 템플릿에 종속되지 않습니다.** `pubspec.yaml`과 플랫폼 설정 파일이 있는 모든 Flutter 프로젝트에서 동작합니다.

---

## 설치

### VSIX (GitHub Releases)

[Releases](https://github.com/hoony5/editor-flutter-config/releases)에서 `.vsix` 다운로드 →
VSCode → Extensions → `···` → **Install from VSIX**

### 개발 모드

```bash
git clone https://github.com/hoony5/editor-flutter-config.git
cd editor-flutter-config
npm install && npm run compile
# VSCode에서 F5
```

---

## 사이드바 탭 (8개)

### Platform
- **Permissions** — 권한 카테고리별 폴더 UI
  - 플랫폼별 토글 (iOS / Android / macOS), 설명·주의사항, SDK 버전 뱃지
  - 권한별 공식 문서 링크 (Apple / Android / Firebase)
  - 권장 패키지 설치 상태 + `+` 설치 버튼
  - 위험 설정(ATS, cleartext 등) ⚠ 즉시 툴팁 경고
  - `$(VAR)` 보간법 값 자동 감지
- **Security / Signing / Build / Deep Links / App Info** — 플랫폼 설정 인라인 편집, 추가/제거, 저장/취소 staged

### Env
- 프로젝트 전체 env/config JSON 자동 스캔 (디렉토리 그룹핑)
- 키-값 인라인 편집, 파일 삭제 staged (× → 취소선 → 저장 확정)
- **Env Diff** — 파일 2개 키별 비교 (누락·불일치 하이라이트)
- Compose & Run — `dart-define-from-file` 원클릭 실행

### Tools
- `tool/manifest.yaml` 선언형 툴 + 디렉토리 자동 스캔 (25개 런타임)
- ▶ 실행 / ⟳ 반복 (인라인 interval, sec/min)

### Manage
- Build Cache · Platform Cache · Pub Cache 크기/정리
- Codegen 스크립트 + Build Runner watch 토글 + Test Runner
- Build Size 이력 · Performance Baseline · Release Checklist
- 프로세스 스캔·kill · 에셋/미사용 탐지

### Pubspec
- **Project** — name · version · description
- **Dependencies** — dev/release 분리, 검색, 페이지네이션, `pub.dev` 링크
- **Assets** — 폴더 구조, 파일 리스팅 (썸네일), 폰트/오디오/비디오 미리보기, 경로 추가/삭제/자동스캔, 최적화 제안
- **Config** — SDK 제약, 플랫폼, 폰트
- 파싱 에러 → 상단 빨강 배너

### Lint
- `analysis_options.yaml` 룰 토글

### Status
- SDK 버전, FVM 핀, 디바이스/시뮬레이터, Git, 디스크

### Router
- GoRouter 라우트 트리 (경로·위젯·자식), 위젯 클릭 → 소스 이동

---

## CLI (`fat`)

```bash
bin/fat <command> [--root <dir>]
```

| 커맨드 | 설명 |
|---|---|
| `snapshot` | 프로젝트 전체 스냅샷 (JSON) |
| `platform` | 플랫폼 설정·권한 |
| `deps` | 의존성·SDK 제약·플랫폼 |
| `routes` | GoRouter 라우트 트리 |
| `checklist` | 릴리즈 체크리스트 |
| `env` | env 파일 목록 |
| `env-diff <a> <b>` | env 키별 diff |
| `tools` | 툴 스크립트 목록 |
| `metrics` | 빌드·퍼포먼스 이력 |
| `assets` | 에셋 선언 목록 |

모든 출력 JSON. `fat snapshot` 한 번이면 프로젝트 전체 컨텍스트 로드.

---

## 폴더 구조

```
editor-flutter-config/
├── package.json              # 확장 매니페스트
├── tsconfig.json             # ES2022, CommonJS
├── vitest.config.mts         # 테스트 설정
├── LICENSE                   # Apache-2.0
├── README.md / AGENTS.md
├── .vscodeignore / .gitignore
│
├── bin/
│   └── fat                   # CLI 셸 래퍼
│
├── resources/
│   └── gear.svg              # 사이드바 아이콘
│
├── scripts/
│   └── check-webview.js      # 빌드 시 webview JS 구문 검증
│
├── src/
│   ├── extension.ts          # activate / deactivate
│   ├── provider.ts           # WebviewViewProvider, 메시지 라우팅
│   ├── cli.ts                # CLI 엔트리 (vscode mock)
│   ├── types.ts              # 공유 인터페이스
│   │
│   ├── shared/               # 공통 모듈
│   │   ├── fileUtils.ts      # 파일 I/O, YAML 파싱, 에셋 스캔
│   │   ├── execUtils.ts      # manifest, git 상태
│   │   ├── icons.ts          # SVG 아이콘
│   │   ├── styles.ts         # 공용 CSS
│   │   ├── security.ts       # safePath, sanitize, escapeRegex
│   │   ├── terminals.ts      # 터미널 추적·정리
│   │   └── metrics.ts        # 빌드·퍼포먼스 이력
│   │
│   ├── tabs/                 # 탭별 handler + view
│   │   ├── platform/         # 권한 카탈로그(40+), 플랫폼 설정, 위험 경고
│   │   ├── env/              # env 스캔, diff, staged 삭제
│   │   ├── tools/            # 툴 스캔, 실행, 반복
│   │   ├── manage/           # 캐시, 빌드러너, 테스트, 체크리스트
│   │   ├── pubspec/          # 의존성, 에셋 미리보기, 최적화
│   │   ├── lint/             # analysis_options 토글
│   │   ├── status/           # SDK, 디바이스, git
│   │   └── router/           # GoRouter 탐지·파싱·트리
│   │
│   └── webview/
│       └── shell.ts          # HTML 조립, CSP, 메시지 격리
│
├── test/                     # vitest 58개
│   ├── security.test.ts
│   ├── fileUtils.test.ts
│   ├── platform.test.ts
│   ├── env.test.ts
│   ├── pubspec.test.ts
│   └── __mocks__/vscode.ts
│
└── node_modules/vscode/      # CLI용 mock (로컬 전용)
```

---

## UX 원칙

- **아이콘 버튼** — 💾 ✕ + ▶ ⟳ ↻
- **Staged 편집** — 토글/입력 → 메모리 → 저장 확정 / 취소 폐기
- **CSS 툴팁** — ⚠ 호버 즉시 (네이티브 딜레이 없음)
- **테마 대응** — light/dark 자동
- **에러 격리** — 탭별 try/catch
- **CSP** — 외부 리소스 차단

## 보안

- 커맨드 인젝션·경로 순회·Regex/YAML 인젝션 차단
- Secret 가드 fail-closed · PID 검증

## 빌드·테스트·배포

```bash
npm run compile     # tsc + webview 구문 검증
npm test            # vitest 58개
vsce package        # .vsix 생성
vsce login hoony5   # Azure DevOps PAT (최초 1회)
vsce publish patch  # 마켓플레이스 배포
```

---

## License

[Apache-2.0](LICENSE) — Copyright 2024-2026 Hoony (삶은계란) · https://block.salmeun.com
