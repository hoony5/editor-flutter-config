# Flutter Project Settings

> Manage your Flutter project's **permissions, environment, assets, routing, dependencies, and code generation** — all from the VSCode sidebar. No more switching between Xcode, Android Studio, and text editors.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-106%20passing-brightgreen.svg)](test/)
[![VSCode](https://img.shields.io/badge/VSCode-1.96%2B-007ACC.svg)](https://code.visualstudio.com)

<!-- Replace with actual screenshot -->
<!-- ![Screenshot](resources/screenshot.png) -->

---

## Features

### 🔐 Platform Permissions
- **40+ permissions** organized by category (Camera, Location, Bluetooth, Notifications, etc.)
- Per-platform toggles (iOS / Android / macOS) with SDK version badges
- Official documentation links (Apple / Android / Firebase) for each permission
- **Reverse analysis**: scans your `lib/` code and warns when you use an API (e.g., `Geolocator`) but haven't configured the corresponding permission
- Dangerous settings warnings (ATS, cleartext traffic) with instant tooltips
- Staged editing with confirmation dialog and XML validation + auto-rollback

### 🌍 Environment Management
- Auto-discovers all env/config files across your project (JSON + dotenv)
- Inline key-value editing with folder-style variable display
- **Env Diff**: compare two env files side-by-side with missing/mismatch highlighting
- One-click Compose & Run with `--dart-define-from-file`

### 🛠 Tools
- Auto-scans `tool/` directory for scripts (25+ runtimes: Dart, Python, Shell, Node, Go, etc.)
- Accordion groups with inline README preview
- ▶ Run / ⟳ Repeat with configurable interval (sec/min)

### 📦 Pubspec Manager
- **Dependencies**: search, paginate, dev/release separation, direct `pub.dev` links
- **Assets**: folder tree with thumbnails, font/audio/video preview, syntax-highlighted text preview (JSON, CSV, XML, Markdown)
- Asset optimization suggestions (WebP conversion, resize, H.264)
- Parse error banner for invalid `pubspec.yaml`

### ⚙️ Codegen Hub
- `build_runner` management: build / watch / clean from the sidebar
- Annotation scanner: `@freezed`, `@riverpod`, `@RestApi`, `@JsonSerializable`, `@injectable`
- **Missing generation detection**: warns when annotated classes lack generated files
- `build.yaml` accordion editor

### 🗺 Router
- Parses GoRouter configuration including `StatefulShellRoute`, `StatefulShellBranch`, and nested routes
- Resolves route constants (e.g., `AppRoutes.home` → `/home`)
- Click any widget name to jump to its source line

### 📊 Status & Manage
- SDK versions, FVM pin, devices/simulators, Git status, disk usage
- Build cache cleanup, test runner, release checklist
- Process scanner with kill

### 🔍 Lint
- Toggle `analysis_options.yaml` rules on/off

---

## CLI for AI Agents

Every feature is also available as a CLI that outputs JSON — designed for AI coding agents to load project context in one command:

```bash
bin/fat snapshot          # Full project snapshot (permissions + deps + assets + routes + env)
bin/fat platform          # Platform config & permissions
bin/fat deps              # Dependencies & SDK constraints
bin/fat routes            # GoRouter route tree
bin/fat checklist         # Release readiness checklist
bin/fat env               # Env file listing
bin/fat env-diff a.json b.json  # Key-by-key diff
bin/fat tools             # Available tool scripts
bin/fat metrics           # Build size & performance history
```

---

## Installation

### From VSCode Marketplace
Search **"Flutter Project Settings"** in the Extensions sidebar, or:
```bash
code --install-extension hoony5.editor-flutter-config
```

### From VSIX
Download from [GitHub Releases](https://github.com/hoony5/editor-flutter-config/releases) →
VSCode → Extensions → `···` → **Install from VSIX**

### From Source
```bash
git clone https://github.com/hoony5/editor-flutter-config.git
cd editor-flutter-config
npm install && npm run compile
# Press F5 in VSCode to launch Extension Development Host
```

---

## Requirements

- Any Flutter project with a `pubspec.yaml`
- Auto-detects `tool/bin/flutterw` / `tool/bin/dartw` wrappers; falls back to standard `flutter` / `dart` commands
- No project-specific configuration needed

---

## Screenshots

<!-- TODO: Add actual screenshots -->
<!-- Place screenshots in resources/ and reference them here -->
<!-- Recommended screenshots:
  1. resources/screenshot-permissions.png — Permissions tab with folder UI
  2. resources/screenshot-env.png — Env tab with diff view
  3. resources/screenshot-pubspec.png — Pubspec assets with preview
  4. resources/screenshot-codegen.png — Codegen Hub
  5. resources/screenshot-router.png — Router tree
-->

---

## Development

```bash
npm run compile     # TypeScript + webview bundle
npm test            # 106 tests (vitest)
vsce package        # Build .vsix
```

## Publishing

```bash
vsce login hoony5       # Azure DevOps PAT (first time only)
vsce publish patch      # 0.2.0 → 0.2.1
vsce publish minor      # 0.2.0 → 0.3.0
```

---

## Security

- CSP with nonce (no `unsafe-inline` scripts)
- Command injection prevention (`sanitizeShellArg`)
- Path traversal protection (`safePath`)
- Regex/YAML injection prevention (`escapeRegex`, `sanitizeYaml`)
- Secret guard: blocks writing secrets to git-tracked files (fail-closed)
- XML validation with auto-rollback on save failure

---

## License

[Apache-2.0](LICENSE) — Copyright 2024–2026 Hoony (삶은계란) · https://block.salmeun.com

---

> *This project was developed with AI assistance (Qwen Code, Claude Code, OpenAI Codex).*
