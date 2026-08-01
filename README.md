# Flutter Project Settings

Let's be honest — managing Flutter platform configs is annoying. You're jumping between Xcode for iOS permissions, Android Studio for manifest entries, editing `Info.plist` by hand, wondering if you forgot to add that Bluetooth permission on Android...

This extension puts all of that in one sidebar panel. Toggle permissions, edit env files, preview assets, check your routes, manage code generation — without leaving VSCode.

It works with **any Flutter project**. No special setup, no template lock-in. If you've got a `pubspec.yaml`, you're good.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-106%20passing-brightgreen.svg)](test/)
[![VSCode](https://img.shields.io/badge/VSCode-1.96%2B-007ACC.svg)](https://code.visualstudio.com)

<!-- TODO: Add screenshots -->
<!-- ![Permissions Tab](resources/screenshot-permissions.png) -->

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

**Marketplace** — search "Flutter Project Settings" in Extensions, or:
```bash
code --install-extension hoony5.editor-flutter-config
```

**VSIX** — grab it from [GitHub Releases](https://github.com/hoony5/editor-flutter-config/releases) → Extensions → `···` → Install from VSIX

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
npm test            # 106 tests
vsce publish patch  # ship it
```

---

## License

[Apache-2.0](LICENSE) — Copyright 2024–2026 Hoony (삶은계란) · https://block.salmeun.com

---

> *Built with AI assistance (Qwen Code, Claude Code, OpenAI Codex) — because configuring permissions by hand is nobody's idea of a good time.*
