import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { dirSize, scanAssets, findUnusedAssets, findUnusedScripts, readText } from '../../shared/fileUtils';
import { getFlutterCmd, getDartCmd } from '../../shared/execUtils';
import { validatePid } from '../../shared/security';
import { trackTerminal } from '../../shared/terminals';
import { readMetrics, addBuildRecord, addPerfRecord } from '../../shared/metrics';
import type { PostFn } from '../../types';

const execAsync = promisify(exec);

export async function sendManageInfo(root: string, post: PostFn): Promise<void> {
  const buildSize = dirSize(path.join(root, 'build'));
  const dartToolSize = dirSize(path.join(root, '.dart_tool'));
  const iosPodsSize = dirSize(path.join(root, 'ios', 'Pods'));
  const macosPodsSize = dirSize(path.join(root, 'macos', 'Pods'));
  const pubCacheDir = process.env.PUB_CACHE || path.join(process.env.HOME || '', '.pub-cache');
  const pubCacheSize = dirSize(pubCacheDir);

  let genFileCount = 0;
  const libDir = path.join(root, 'lib');
  if (fs.existsSync(libDir)) {
    const countGen = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) countGen(full);
        else if (/\.(g|freezed|gr|config)\.dart$/.test(entry.name)) genFileCount++;
      }
    };
    countGen(libDir);
  }

  const codegenDir = path.join(root, 'tool', 'codegen');
  const codegenScripts: { file: string; name: string; desc: string }[] = [];
  if (fs.existsSync(codegenDir)) {
    const descMap: Record<string, string> = {
      'build_runner_safe.sh': 'Full build_runner build',
      'incremental_codegen.sh': 'Skip if no source changes',
      'generate_assets.dart': 'Generate asset constants',
      'generate_supabase_models.dart': 'Generate Supabase models',
      'check_assets.dart': 'Verify asset references',
    };
    for (const f of fs.readdirSync(codegenDir).sort()) {
      if (['.sh', '.dart'].includes(path.extname(f))) {
        codegenScripts.push({ file: `tool/codegen/${f}`, name: f, desc: descMap[f] ?? f.replace(/[_-]/g, ' ').replace(/\.\w+$/, '') });
      }
    }
  }

  post({ type: 'manageInfo', buildSize, dartToolSize, iosPodsSize, macosPodsSize, pubCacheSize, outdatedCount: -1, genFileCount, codegenScripts });

  execAsync(`${getDartCmd(root)} pub outdated --json 2>/dev/null`, {
    cwd: root, encoding: 'utf-8', timeout: 15000, maxBuffer: 4 * 1024 * 1024,
  }).then(({ stdout }) => {
    const count = stdout ? (JSON.parse(stdout).packages || []).length : 0;
    post({ type: 'outdatedCount', count });
  }).catch(() => { post({ type: 'outdatedCount', count: 0 }); });
}

export function cleanup(root: string, post: PostFn, target: string): void {
  const dirs: Record<string, string[]> = {
    build: ['build'], dart_tool: ['.dart_tool'],
    pods: ['ios/Pods', 'macos/Pods'],
    all: ['build', '.dart_tool', 'ios/Pods', 'macos/Pods'],
  };
  const targets = dirs[target] ?? dirs.all;
  for (const d of targets) {
    const full = path.join(root, d);
    if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
  }
  vscode.window.showInformationMessage(`Cleaned: ${targets.join(', ')}`);
  void sendManageInfo(root, post);
}

export function sendAssets(root: string, post: PostFn): void {
  const assets = scanAssets(root);
  post({ type: 'assets', assets, unused: findUnusedAssets(root, assets), unusedScripts: findUnusedScripts(root) });
}

export function sendUnused(root: string, post: PostFn): void {
  const assets = scanAssets(root);
  post({ type: 'unused', unused: findUnusedAssets(root, assets), unusedScripts: findUnusedScripts(root) });
}

export function sendProcs(root: string, post: PostFn): void {
  const rootName = path.basename(root).replace(/[^a-zA-Z0-9_.-]/g, '');
  let procs: { pid: number; cmd: string; cpu: string; mem: string; elapsed: string }[] = [];
  try {
    const out = execSync(`ps aux | grep -i "${rootName}" | grep -v grep | grep -v "Code Helper" | grep -v "extensionHost"`, { encoding: 'utf-8', timeout: 5000 });
    procs = out.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return { pid: parseInt(parts[1], 10), cmd: parts.slice(10).join(' ').substring(0, 120), cpu: parts[2], mem: parts[3], elapsed: parts[9] ?? '?' };
    }).filter(p => !isNaN(p.pid) && p.cmd.length > 0);
  } catch { /* no matching processes */ }
  post({ type: 'procs', procs });
}

export function killProc(root: string, post: PostFn, pid: number): void {
  const validPid = validatePid(pid);
  if (validPid === null) { vscode.window.showWarningMessage('Invalid PID.'); return; }
  try {
    process.kill(validPid, 'SIGTERM');
    vscode.window.showInformationMessage(`Sent SIGTERM to PID ${validPid}`);
    setTimeout(() => sendProcs(root, post), 1000);
  } catch (e: unknown) {
    vscode.window.showErrorMessage(`Failed to kill PID ${validPid}: ${e}`);
  }
}

// ── Build Runner Watch ──

let buildRunnerTerminal: vscode.Terminal | null = null;

export function toggleBuildRunner(root: string, post: PostFn): void {
  if (buildRunnerTerminal) {
    buildRunnerTerminal.dispose();
    buildRunnerTerminal = null;
    post({ type: 'buildRunnerStatus', running: false });
    return;
  }
  buildRunnerTerminal = vscode.window.createTerminal({ name: 'Build Runner Watch', cwd: root });
  trackTerminal(buildRunnerTerminal);
  buildRunnerTerminal.show();
  buildRunnerTerminal.sendText(`${getDartCmd(root)} run build_runner watch --delete-conflicting-outputs`);
  vscode.window.onDidCloseTerminal(t => {
    if (t === buildRunnerTerminal) { buildRunnerTerminal = null; post({ type: 'buildRunnerStatus', running: false }); }
  });
  post({ type: 'buildRunnerStatus', running: true });
}

// ── Test Runner ──

export function runTests(root: string, mode: string, file?: string): void {
  const f = getFlutterCmd(root);
  const cmds: Record<string, string> = {
    all: `${f} test`,
    coverage: `${f} test --coverage`,
  };
  const cmd = file
    ? `${f} test ${file.replace(/[^a-zA-Z0-9_./-]/g, '')}`
    : cmds[mode] ?? cmds.all;
  const terminal = vscode.window.createTerminal({ name: `Flutter Test (${mode})`, cwd: root });
  trackTerminal(terminal);
  terminal.show();
  terminal.sendText(cmd);
}

// ── Build Size Tracker ──

export function scanBuildSizes(root: string, post: PostFn): void {
  const results: { platform: string; file: string; sizeBytes: number }[] = [];
  const targets: { platform: string; globs: string[] }[] = [
    { platform: 'Android APK', globs: ['build/app/outputs/flutter-apk/app-release.apk', 'build/app/outputs/flutter-apk/app-debug.apk'] },
    { platform: 'Android AAB', globs: ['build/app/outputs/bundle/release/app-release.aab'] },
    { platform: 'iOS', globs: ['build/ios/iphoneos/Runner.app'] },
    { platform: 'macOS', globs: ['build/macos/Build/Products/Release'] },
    { platform: 'Web', globs: ['build/web'] },
  ];
  for (const t of targets) {
    for (const g of t.globs) {
      const full = path.join(root, g);
      if (fs.existsSync(full)) {
        const size = fs.statSync(full).isDirectory() ? dirSize(full) : fs.statSync(full).size;
        if (size > 0) results.push({ platform: t.platform, file: g, sizeBytes: size });
      }
    }
  }
  const metrics = readMetrics(root);
  post({ type: 'buildSizes', results, history: metrics.builds.slice(-10) });
}

export function recordBuildSize(root: string, post: PostFn, platform: string, sizeBytes: number): void {
  const metrics = addBuildRecord(root, { timestamp: new Date().toISOString(), platform, sizeBytes });
  post({ type: 'buildSizes', results: [], history: metrics.builds.slice(-10) });
}

// ── Performance Baseline ──

export async function runProfile(root: string, _post: PostFn): Promise<void> {
  const terminal = vscode.window.createTerminal({ name: 'Flutter Profile', cwd: root });
  trackTerminal(terminal);
  terminal.show();
  terminal.sendText(`${getFlutterCmd(root)} run --profile`);
  vscode.window.showInformationMessage('Profile mode started. Use DevTools to capture metrics, then record manually.');
}

export function getPerfBaseline(root: string, post: PostFn): void {
  const metrics = readMetrics(root);
  post({ type: 'perfBaseline', history: metrics.perf.slice(-10) });
}

export function recordPerf(root: string, post: PostFn, frameTimeMs: number, memoryMb: number): void {
  const metrics = addPerfRecord(root, { timestamp: new Date().toISOString(), frameTimeMs, memoryMb });
  post({ type: 'perfBaseline', history: metrics.perf.slice(-10) });
}

// ── Release Checklist ──

export function getChecklist(root: string, post: PostFn): void {
  const checks: { id: string; label: string; status: 'ok' | 'warn' | 'fail'; detail: string }[] = [];

  const pubspec = readText(path.join(root, 'pubspec.yaml'));
  const versionMatch = pubspec.match(/^version:\s*(.+)$/m);
  const version = versionMatch ? versionMatch[1].trim() : '';
  checks.push({
    id: 'version', label: 'Version set',
    status: version ? 'ok' : 'fail',
    detail: version || 'pubspec.yaml에 version 없음',
  });

  const androidKeyProps = path.join(root, 'android', 'key.properties');
  const hasSigning = fs.existsSync(androidKeyProps);
  checks.push({
    id: 'android-signing', label: 'Android signing',
    status: hasSigning ? 'ok' : 'warn',
    detail: hasSigning ? 'key.properties 존재' : 'key.properties 없음 — debug 서명만 가능',
  });

  const iosExportOptions = path.join(root, 'ios', 'ExportOptions.plist');
  const hasIosExport = fs.existsSync(iosExportOptions);
  checks.push({
    id: 'ios-export', label: 'iOS export options',
    status: hasIosExport ? 'ok' : 'warn',
    detail: hasIosExport ? 'ExportOptions.plist 존재' : 'Xcode에서 archive 시 수동 설정 필요',
  });

  const macReleaseEnt = readText(path.join(root, 'macos', 'Runner', 'Release.entitlements'));
  const hasSandbox = macReleaseEnt.includes('com.apple.security.app-sandbox');
  checks.push({
    id: 'macos-sandbox', label: 'macOS App Sandbox',
    status: hasSandbox ? 'ok' : 'fail',
    detail: hasSandbox ? 'Release entitlement에 sandbox 활성' : 'App Store 배포 불가',
  });

  const hasBuildDir = fs.existsSync(path.join(root, 'build'));
  checks.push({
    id: 'clean-build', label: 'Clean build',
    status: hasBuildDir ? 'warn' : 'ok',
    detail: hasBuildDir ? 'build/ 존재 — flutter clean 후 재빌드 권장' : 'clean 상태',
  });

  const changelogExists = fs.existsSync(path.join(root, 'CHANGELOG.md'));
  checks.push({
    id: 'changelog', label: 'CHANGELOG.md',
    status: changelogExists ? 'ok' : 'warn',
    detail: changelogExists ? '존재' : '스토어 제출 시 변경 로그 필요',
  });

  post({ type: 'checklist', checks });
}
