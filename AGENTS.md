# Flutter App Tools — Agent Guide

이 디렉토리는 Flutter 프로젝트 설정 관리 도구(VSCode 확장 + CLI)입니다.
Apache-2.0 · Copyright 2024-2026 Hoony (삶은계란) · https://block.salmeun.com

## 에이전트 빠른 시작

프로젝트 컨텍스트를 한 번에 로드:

```bash
./tool/editor-flutter-config/bin/fat snapshot
```

개별 조회:

```bash
fat deps          # 의존성·SDK 제약
fat platform      # 플랫폼 설정·권한 상태
fat routes        # GoRouter 라우트 트리 (파일·라인 포함)
fat checklist     # 릴리즈 준비 상태
fat env           # env 파일 목록
fat env-diff config/env/develop.json config/env/release.json
fat tools         # 실행 가능한 툴 스크립트
```

모든 출력은 JSON. `--root <dir>`로 대상 프로젝트 지정.

## 파일 매핑

| 조회 대상 | 프로젝트 파일 |
|---|---|
| iOS 권한 | `ios/Runner/Info.plist` (NS*UsageDescription) |
| Android 권한 | `android/app/src/main/AndroidManifest.xml` |
| macOS 권한 | `macos/Runner/*.entitlements` |
| iOS 서명 | `ios/Runner.xcodeproj/project.pbxproj` (DEVELOPMENT_TEAM) |
| Android 서명 | `android/key.properties` |
| 빌드 설정 | `android/app/build.gradle` |
| env 설정 | `config/env/*.json` |
| 의존성 | `pubspec.yaml` |
| 라우팅 | `lib/**/*router*.dart` (GoRouter) |
| 에셋 | `pubspec.yaml` > `flutter.assets` + `assets/` 디렉토리 |
| 린트 | `analysis_options.yaml` |

## 주의

- `fat`은 읽기 전용. 파일 수정은 VSCode 확장 UI 또는 직접 편집.
- `node_modules/vscode/`는 CLI용 mock. 확장 런타임에서는 실제 VSCode API 사용.
- 빌드: `npm run compile` (tsc + webview JS 구문 검증)
- 테스트: `npm test` (vitest 58개)
