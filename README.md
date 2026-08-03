# Flutter Project Settings

Flutter 플랫폼 설정(권한·env·에셋·라우팅·codegen)을 사이드바 하나로. Unity Project Settings에서 영감.
토글하면 `Info.plist`·`AndroidManifest.xml`·`.entitlements`에 자동 기록. 어떤 Flutter 프로젝트든 동작.
AI 에이전트가 JSON으로 프로젝트 컨텍스트를 로드할 수 있는 CLI(`bin/fat`) 포함.

**사용법·CLI 커맨드·트러블슈팅**: 이 문서 아래 섹션 참조.

> Built with AI assistance (Qwen Code, Claude Code, OpenAI Codex).

**이런 상황에 유용**: Xcode/Android Studio 오가며 권한 설정할 때, env 파일 간 누락 키 찾을 때, codegen 돌렸는지 까먹었을 때, AI 에이전트에게 프로젝트 구조를 한 번에 알려줄 때.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-111%20passing-brightgreen.svg)](test/)
[![VSCode](https://img.shields.io/badge/VSCode-1.96%2B-007ACC.svg)](https://code.visualstudio.com)

## Screenshots

| Permissions | Tools | Pubspec |
|---|---|---|
| ![Permissions](https://github.com/hoony5/editor-flutter-config/raw/main/resources/permissions.png) | ![Tools](https://github.com/hoony5/editor-flutter-config/raw/main/resources/tools.png) | ![Pubspec](https://github.com/hoony5/editor-flutter-config/raw/main/resources/pubspec.png) |

| Codegen | Status |
|---|---|
| ![Codegen](https://github.com/hoony5/editor-flutter-config/raw/main/resources/codegen.png) | ![Status](https://github.com/hoony5/editor-flutter-config/raw/main/resources/status.png) |

---

## What you get

### Permissions, finally manageable
40+ permissions organized by category — Camera, Location, Bluetooth, Notifications, you name it. Each one shows which platforms it applies to, what SDK version you need, and links straight to the official docs.

The cool part? It **scans your code** and warns you when you're using something like `Geolocator` but forgot to configure the location permission. No more runtime crashes because you missed a plist entry.

Dangerous settings (looking at you, `NSAllowsArbitraryLoads`) get flagged with a warning tooltip so you don't accidentally ship something that'll get rejected.

### Env files without the headache
Auto-discovers all your env and config files (JSON and dotenv). Edit them inline, compare two files side-by-side to spot missing keys, and run with `--dart-define-from-file` in one click.

### Assets you can actually see
Folder tree with thumbnails. Preview fonts with sample text, play audio, watch video. JSON, CSV, XML, Markdown files get syntax-highlighted previews. It'll even suggest converting that 2MB PNG to WebP.

### Tools — run project scripts from the sidebar
Create a `tool/<group>/` folder in your project and drop in entry-point scripts — then run them with one click.

- Auto-scans `tool/*` for 20+ runtimes (Shell, Dart, Python, JS/TS, Go, Swift, Kotlin, …) and badges which are installed on your machine
- ▶ runs in an integrated terminal; ⟳ repeats on an interval (loop mode)
- A `README.md` inside a group folder renders inline as its description
- `tool/manifest.yaml` registers categorized tools with descriptions and typed inputs (text/select/password)
- Execution is confined to your project: paths must resolve inside `tool/`, script names are allowlist-sanitized before reaching the shell

### Codegen Hub
Run `build_runner` from the sidebar. See all your `@freezed`, `@riverpod`, `@RestApi` annotations at a glance. Get warned when you've annotated a class but forgot to run the generator.

### Router visualization
Parses your GoRouter config — including `StatefulShellRoute` and nested routes — and shows it as a tree. Click any widget name to jump straight to the source.

### Everything else
Dependencies with `pub.dev` links, lint rule toggles, SDK versions, device list, build cache cleanup, release checklist, process manager. It's a lot, but it's all organized in tabs so you only see what you need.

---

## CLI (for AI agents & terminal lovers)

Every feature is also a CLI command that outputs JSON. One command gives your AI coding agent the full project context:

```bash
bin/fat snapshot    # permissions + deps + assets + routes + env + codegen — everything
bin/fat platform    # just platform config
bin/fat deps        # dependencies
bin/fat routes      # route tree
bin/fat codegen     # annotation scan + missing generated files
bin/fat env-diff develop.json release.json   # spot the missing keys
```

---

## Install

Works with **VSCode and all VSCode-based editors** (Cursor, Windsurf, Antigravity, etc.)

**Marketplace** (VSCode) — search "Flutter Project Settings", or:
```bash
code --install-extension hoony5.editor-flutter-config
```

**Cursor / Windsurf / Antigravity** — Extensions → `···` → **Install from VSIX** → select the `.vsix` from [GitHub Releases](https://github.com/hoony5/editor-flutter-config/releases)

> ⚠️ **Android Studio** is IntelliJ-based and does **not** support VSCode extensions. A separate IntelliJ plugin would be needed.

**From source**:
```bash
git clone https://github.com/hoony5/editor-flutter-config.git
cd editor-flutter-config && npm install && npm run compile
# F5 in VSCode
```

---

## Good to know

- Auto-detects `flutterw`/`dartw` wrappers in your project; falls back to `flutter`/`dart` if they're not there
- Saves create a `.bak` backup and validate XML before committing — bad edits roll back automatically
- Secrets (keys, tokens, passwords) are blocked from being written to git-tracked files
- CSP with nonce, input sanitization, path traversal protection — the boring security stuff that matters

---

## Development

```bash
npm run compile     # build
npm test            # 111 tests
vsce publish patch  # ship it
```

---

## Troubleshooting

**Extension shows "Loading..." forever**
- Open `Help → Toggle Developer Tools → Console` and check for errors
- Make sure your project has a `pubspec.yaml` at the root
- If you're on a network mount or external disk, make sure it's connected

**Permissions tab shows empty or wrong data**
- The extension reads `ios/Runner/Info.plist`, `android/app/src/main/AndroidManifest.xml`, and `macos/Runner/*.entitlements`
- If these files don't exist yet (new project), the tab will show "(file not found)" — that's normal
- After editing permissions in Xcode/Android Studio, the extension auto-refreshes (file watcher with 800ms debounce)

**"Gradle build failed: Unsupported class file major version"**
- This is a Java version mismatch, not an extension issue
- Check `java -version` — Gradle 9.x supports up to Java 24
- Fix: set `JAVA_HOME` to a compatible JDK in your shell profile

**Router tab says "GoRouter declaration not found"**
- The scanner looks for `GoRouter(`, `GoRoute(`, or `StatefulShellRoute` in `.dart` files under `lib/`
- Your router file must contain at least one of these patterns
- Route constants like `AppRoutes.home` are resolved from `*routes*.dart` files — make sure your route constants file exists and uses `static const` declarations
- See the example code in the Router tab for the expected format

**Save permission changes but nothing happens**
- A confirmation dialog shows your changes before applying — click "Apply"
- If XML validation fails after saving, the extension automatically rolls back from the `.bak` backup
- Check the `.bak` file next to your plist/manifest if something went wrong

**CLI (`fat`) returns empty JSON**
- Run from your project root: `cd /path/to/flutter/project && bin/fat snapshot`
- Or specify the root: `bin/fat snapshot --root /path/to/flutter/project`
- The CLI auto-detects `flutterw`/`dartw` wrappers; falls back to `flutter`/`dart`

**Env files not showing**
- Scans for `*.json` files in paths containing `config` or `env`, plus `.env*` dotenv files
- `node_modules`, `build`, `.dart_tool`, `.git` directories are skipped
- Both JSON (`{"KEY": "value"}`) and dotenv (`KEY=value`) formats are supported

---

## What happens when you save

When you toggle a permission and hit save:

1. **Confirmation** — a modal shows exactly what will change (`+ NSCameraUsageDescription (Info.plist)`)
2. **Backup** — a `.bak` copy is created before any file is modified
3. **Validation** — the modified XML is checked for structural integrity
4. **Rollback** — if validation fails, the `.bak` is restored automatically
5. **Secret guard** — if the key or value looks like a secret (password, token, api_key) and the file is git-tracked, the write is **blocked**

Existing keys are **updated in place** — no duplicates. New keys are inserted before the closing `</dict>` (plist) or before `<application>` (manifest).

---

## AI-Agent Ready

This extension is designed to be used by AI coding agents (Claude Code, Qwen Code, OpenAI Codex, etc.) as a **project context loader**. Instead of an agent parsing 30+ platform files, one CLI command gives it everything:

```bash
bin/fat snapshot   # → JSON: permissions, deps, assets, routes, env, codegen status
```

The agent gets structured JSON it can reason about — which permissions are configured, which are missing, what routes exist, what codegen needs to run — without reading a single `Info.plist` or `AndroidManifest.xml`.

Every CLI command outputs JSON. Every feature in the sidebar has a CLI equivalent. The extension is the UI; the CLI is the API.

---

## License

[Apache-2.0](LICENSE) — Copyright 2024–2026 Hoony (삶은계란) · https://block.salmeun.com
