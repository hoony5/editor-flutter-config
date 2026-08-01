import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import * as path from 'path';
import { readText, dirSize, regexFirst } from '../../shared/fileUtils';
import { getGitStatus, getFlutterCmd, getDartCmd } from '../../shared/execUtils';
import { trackTerminal } from '../../shared/terminals';
import type { PostFn } from '../../types';

const execAsync = promisify(exec);

async function run(cmd: string, opts: { cwd?: string; timeout?: number } = {}): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, {
      cwd: opts.cwd,
      timeout: opts.timeout ?? 15000,
      encoding: 'utf-8',
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string };
    return (err.stdout ?? err.stderr ?? '').trim();
  }
}

export async function sendStatus(root: string, post: PostFn): Promise<void> {
  const git = getGitStatus(root);
  const buildSize = dirSize(path.join(root, 'build'));
  const dartToolSize = dirSize(path.join(root, '.dart_tool'));
  const fvmrc = readText(path.join(root, '.fvmrc'));
  const pinnedFlutter = regexFirst(fvmrc, /"flutter"\s*:\s*"([^"]+)"/) ?? '';
  const javaHome = (await run('echo $JAVA_HOME')) || '(not set)';

  const f = getFlutterCmd(root);
  const [flutterOut, devOut, simOut, javaOut, jdkOut, psOut] = await Promise.allSettled([
    run(`${f} --version`, { cwd: root }),
    run(`${f} devices --machine-readable`, { cwd: root }),
    run('xcrun simctl list devices -j', { timeout: 5000 }),
    run('java -version 2>&1', { cwd: root, timeout: 5000 }),
    run('/usr/libexec/java_home -V 2>&1', { timeout: 5000 }),
    run('ps aux', { timeout: 3000 }),
  ]);

  const flutterStr = flutterOut.status === 'fulfilled' ? flutterOut.value : '';
  let flutterVersion = regexFirst(flutterStr, /Flutter\s+([\d.]+)/) ?? '';
  let dartVersion = regexFirst(flutterStr, /Dart\s+([\d.]+)/) ?? '';
  const flutterChannel = regexFirst(flutterStr, /channel\s+(\w+)/) ?? 'stable';
  if (!flutterVersion) { flutterVersion = pinnedFlutter || '?'; dartVersion = dartVersion || '(via FVM)'; }

  const javaStr = javaOut.status === 'fulfilled' ? javaOut.value : '';
  const javaVersion = regexFirst(javaStr, /version\s+"([^"]+)"/) ?? (javaStr ? 'installed' : 'not found');

  let devices: { name: string; id: string; platform: string }[] = [];
  if (devOut.status === 'fulfilled') {
    try {
      const parsed = JSON.parse(devOut.value);
      const list = Array.isArray(parsed) ? parsed : parsed.devices ?? [];
      devices = list.map((d: Record<string, unknown>) => ({
        name: String(d.name ?? d.id ?? '?'), id: String(d.id ?? '?'), platform: String(d.targetPlatform ?? d.platform ?? '?'),
      }));
    } catch { /* not JSON */ }
  }

  const psStr = psOut.status === 'fulfilled' ? psOut.value : '';
  const daemonRunning = psStr.includes('flutter daemon') || psStr.includes('flutter_daemon');

  let simulators: { name: string; udid: string; state: string; runtime: string }[] = [];
  if (simOut.status === 'fulfilled') {
    try {
      const simParsed = JSON.parse(simOut.value);
      for (const [runtime, devs] of Object.entries(simParsed.devices ?? {})) {
        const rt = runtime.replace('com.apple.CoreSimulator.SimRuntime.', '').replace(/-/g, '.');
        for (const dev of devs as { name: string; udid: string; state: string; isAvailable?: boolean }[]) {
          if (dev.isAvailable === false) continue;
          simulators.push({ name: dev.name, udid: dev.udid, state: dev.state, runtime: rt });
        }
      }
    } catch { /* no simctl */ }
  }

  let jdks: string[] = [];
  if (jdkOut.status === 'fulfilled') {
    jdks = jdkOut.value.split('\n').filter(l => l.match(/^\s+\d/)).map(l => l.trim());
  }

  post({
    type: 'status',
    versions: { flutter: flutterVersion, dart: dartVersion, java: javaVersion, channel: flutterChannel, pinned: pinnedFlutter, javaHome, jdks },
    devices, daemonRunning, simulators, git, buildSize, dartToolSize,
  });
}

export function runAction(root: string, action: string, cmd?: string): void {
  if (action === 'custom' && cmd) {
    const terminal = vscode.window.createTerminal({ name: 'Action', cwd: root });
    trackTerminal(terminal);
    terminal.show();
    terminal.sendText(cmd.replace(/[^a-zA-Z0-9_./ &=|>-]/g, ''));
    return;
  }
  const f = getFlutterCmd(root);
  const d = getDartCmd(root);
  const actions: Record<string, { cmd: string; name: string }> = {
    'flutter-upgrade': { cmd: `${f} upgrade`, name: 'Flutter Upgrade' },
    'flutter-clean': { cmd: `${f} clean`, name: 'Flutter Clean' },
    'daemon-restart': { cmd: `pkill -f 'flutter daemon' 2>/dev/null; sleep 1; ${f} daemon &`, name: 'Daemon Restart' },
    'pub-get': { cmd: `${f} pub get`, name: 'Pub Get' },
    'pub-cache-clean': { cmd: `${d} pub cache clean --force`, name: 'Pub Cache Clean' },
    'build-runner': { cmd: './tool/codegen/build_runner_safe.sh', name: 'Build Runner' },
    'pod-install': { cmd: 'cd ios && pod install && cd ..', name: 'Pod Install' },
    'gradle-clean': { cmd: 'cd android && ./gradlew clean && cd ..', name: 'Gradle Clean' },
    'devtools': { cmd: `${d} devtools`, name: 'DevTools' },
    'flutter-logs': { cmd: `${f} logs`, name: 'Flutter Logs' },
    'doctor': { cmd: `${f} doctor -v`, name: 'Flutter Doctor' },
  };
  const a = actions[action];
  if (!a) return;
  const terminal = vscode.window.createTerminal({ name: a.name, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(a.cmd);
}

export async function simAction(root: string, post: PostFn, action: string, udid: string): Promise<void> {
  const safeUdid = udid.replace(/[^a-zA-Z0-9-]/g, '');
  const cmds: Record<string, string> = {
    boot: `xcrun simctl boot ${safeUdid}`,
    shutdown: `xcrun simctl shutdown ${safeUdid}`,
    screenshot: `xcrun simctl io ${safeUdid} screenshot ${root}/build/screenshot_$(date +%s).png`,
    open: `open -a Simulator`,
  };
  const cmd = cmds[action];
  if (!cmd) return;
  try {
    await execAsync(cmd, { cwd: root, timeout: 10000 });
    if (action === 'screenshot') vscode.window.showInformationMessage('Screenshot saved to build/');
  } catch (e: unknown) {
    vscode.window.showErrorMessage(`Simulator ${action} failed: ${e}`);
  }
  await sendStatus(root, post);
}

export function hotReload(root: string, reloadType: string): void {
  try {
    const ps = execSync('ps aux', { encoding: 'utf-8', timeout: 3000 });
    if (!ps.includes('flutter') && !ps.includes('dart')) {
      vscode.window.showWarningMessage('No running Flutter process found.');
      return;
    }
  } catch { /* ignore */ }
  const terminal = vscode.window.createTerminal({ name: 'Hot Reload', cwd: root });
  trackTerminal(terminal);
  terminal.show();
  terminal.sendText(reloadType === 'restart' ? 'R' : 'r');
  vscode.window.showInformationMessage(reloadType === 'restart' ? 'Hot Restart (R) sent.' : 'Hot Reload (r) sent.');
}
