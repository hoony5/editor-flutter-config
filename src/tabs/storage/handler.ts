import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readText, regexFirst } from '../../shared/fileUtils';
import { sanitizeShellArg } from '../../shared/security';
import type { PostFn } from '../../types';

const execAsync = promisify(exec);

async function run(cmd: string, opts: { timeout?: number } = {}): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, {
      timeout: opts.timeout ?? 10000,
      encoding: 'utf-8',
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string };
    return (err.stdout ?? err.stderr ?? '').trim();
  }
}

export type HostPlatform = 'darwin' | 'win32' | 'linux';

export interface StorageLocation {
  label: string;
  path: string;
  accessible: boolean;
  files: StorageFile[];
}

export interface StorageFile {
  name: string;
  size: number;
  modified: string;
  category: 'db' | 'media' | 'download' | 'cache' | 'other';
}

export interface StorageInfo {
  hostPlatform: HostPlatform;
  applicationId: string;
  bundleId: string;
  locations: StorageLocation[];
  adbAvailable: boolean;
  simctlAvailable: boolean;
  bootedSimUdid: string | null;
  connectedDevice: string | null;
}

function categorize(name: string): StorageFile['category'] {
  const ext = path.extname(name).toLowerCase();
  if (['.db', '.sqlite', '.sqlite3', '.realm', '.hive', '.isart'].includes(ext)) return 'db';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.mp3', '.wav', '.heic'].includes(ext)) return 'media';
  if (['.pdf', '.zip', '.apk', '.ipa'].includes(ext)) return 'download';
  if (['.tmp', '.cache', '.log'].includes(ext)) return 'cache';
  return 'other';
}

function listLocalDir(dir: string): StorageFile[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile())
      .map(e => {
        const stat = fs.statSync(path.join(dir, e.name));
        return {
          name: e.name,
          size: stat.size,
          modified: stat.mtime.toISOString().slice(0, 16).replace('T', ' '),
          category: categorize(e.name),
        };
      })
      .sort((a, b) => b.size - a.size)
      .slice(0, 50);
  } catch { return []; }
}

async function listAdbDir(pkg: string, remotePath: string): Promise<StorageFile[]> {
  const sp = sanitizeShellArg(pkg);
  const sr = sanitizeShellArg(remotePath);
  const out = await run(`adb shell run-as ${sp} ls -la ${sr}`);
  if (!out || out.includes('No such file') || out.includes('Permission denied')) return [];
  const files: StorageFile[] = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^-\S+\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\w+\s+\d+\s+[\d:]+)\s+(.+)$/);
    if (!m) continue;
    const name = m[3].trim();
    if (name === '.' || name === '..') continue;
    files.push({ name, size: parseInt(m[1]), modified: m[2], category: categorize(name) });
  }
  return files.sort((a, b) => b.size - a.size).slice(0, 50);
}

async function listSimDir(dataPath: string, sub: string): Promise<StorageFile[]> {
  const full = path.join(dataPath, sub);
  return listLocalDir(full);
}

export async function sendStorageInfo(root: string, post: PostFn): Promise<void> {
  const hostPlatform = process.platform as HostPlatform;

  const buildGradle = readText(path.join(root, 'android', 'app', 'build.gradle'));
  const applicationId = regexFirst(buildGradle, /applicationId\s+["']([^"']+)["']/) ?? '';

  const pbxproj = readText(path.join(root, 'ios', 'Runner.xcodeproj', 'project.pbxproj'));
  const bundleId = regexFirst(pbxproj, /PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([^;]+);/) ?? '';

  const [adbOut, simctlOut] = await Promise.allSettled([
    run('adb devices', { timeout: 5000 }),
    hostPlatform === 'darwin' ? run('xcrun simctl list devices booted -j', { timeout: 5000 }) : Promise.resolve(''),
  ]);

  const adbAvailable = adbOut.status === 'fulfilled' && adbOut.value.includes('device');
  let connectedDevice: string | null = null;
  if (adbAvailable) {
    const dm = adbOut.value.match(/^([a-zA-Z0-9._:-]+)\s+device$/m);
    connectedDevice = dm ? dm[1] : null;
  }

  let simctlAvailable = false;
  let bootedSimUdid: string | null = null;
  if (simctlOut.status === 'fulfilled' && simctlOut.value) {
    try {
      const parsed = JSON.parse(simctlOut.value);
      for (const devs of Object.values(parsed.devices ?? {})) {
        for (const d of devs as { udid: string; state: string }[]) {
          if (d.state === 'Booted') { bootedSimUdid = d.udid; simctlAvailable = true; break; }
        }
        if (bootedSimUdid) break;
      }
    } catch { /* no simctl */ }
  }

  const locations: StorageLocation[] = [];

  if (hostPlatform === 'darwin' && bootedSimUdid && bundleId) {
    const dataPath = await run(`xcrun simctl get_app_container ${bootedSimUdid} ${bundleId} data`);
    if (dataPath && !dataPath.includes('error')) {
      const [docs, caches, tmp] = await Promise.all([
        listSimDir(dataPath, 'Documents'),
        listSimDir(dataPath, 'Library/Caches'),
        listSimDir(dataPath, 'tmp'),
      ]);
      locations.push({ label: 'iOS Sim — Documents', path: path.join(dataPath, 'Documents'), accessible: true, files: docs });
      locations.push({ label: 'iOS Sim — Caches', path: path.join(dataPath, 'Library/Caches'), accessible: true, files: caches });
      locations.push({ label: 'iOS Sim — tmp', path: path.join(dataPath, 'tmp'), accessible: true, files: tmp });
    }
  }

  if (adbAvailable && connectedDevice && applicationId) {
    const [appFlutter, databases, cache, files] = await Promise.all([
      listAdbDir(applicationId, '/data/data/' + applicationId + '/app_flutter'),
      listAdbDir(applicationId, '/data/data/' + applicationId + '/databases'),
      listAdbDir(applicationId, '/data/data/' + applicationId + '/cache'),
      listAdbDir(applicationId, '/data/data/' + applicationId + '/files'),
    ]);
    locations.push({ label: 'Android — app_flutter (documents)', path: `/data/data/${applicationId}/app_flutter`, accessible: appFlutter.length > 0, files: appFlutter });
    locations.push({ label: 'Android — databases', path: `/data/data/${applicationId}/databases`, accessible: databases.length > 0, files: databases });
    locations.push({ label: 'Android — cache', path: `/data/data/${applicationId}/cache`, accessible: cache.length > 0, files: cache });
    locations.push({ label: 'Android — files', path: `/data/data/${applicationId}/files`, accessible: files.length > 0, files: files });
  }

  const desktopPaths = resolveDesktopPaths(hostPlatform, bundleId, applicationId);
  for (const dp of desktopPaths) {
    const exists = fs.existsSync(dp.path);
    locations.push({ label: dp.label, path: dp.path, accessible: exists, files: exists ? listLocalDir(dp.path) : [] });
  }

  post({
    type: 'storageInfo',
    hostPlatform,
    applicationId,
    bundleId,
    locations,
    adbAvailable,
    simctlAvailable,
    bootedSimUdid,
    connectedDevice,
  });
}

function resolveDesktopPaths(platform: HostPlatform, bundleId: string, appId: string): { label: string; path: string }[] {
  const home = os.homedir();
  switch (platform) {
    case 'darwin':
      return bundleId ? [
        { label: 'macOS Desktop — Container', path: path.join(home, 'Library', 'Containers', bundleId, 'Data') },
        { label: 'macOS Desktop — App Support', path: path.join(home, 'Library', 'Application Support', bundleId) },
      ] : [];
    case 'win32': {
      const appData = process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming');
      const name = appId.split('.').pop() ?? 'flutter_app';
      return [{ label: 'Windows — AppData', path: path.join(appData, name) }];
    }
    case 'linux': {
      const name = appId.split('.').pop() ?? 'flutter_app';
      return [{ label: 'Linux — .local/share', path: path.join(home, '.local', 'share', name) }];
    }
  }
}

export async function testDownload(root: string, post: PostFn, targetPath: string): Promise<void> {
  const testContent = `flutter-config-test-${Date.now()}`;
  const testFile = path.join(targetPath, `_download_test_${Date.now()}.tmp`);
  const t0 = Date.now();

  try {
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
    fs.writeFileSync(testFile, testContent, 'utf-8');
    const readBack = fs.readFileSync(testFile, 'utf-8');
    const elapsed = Date.now() - t0;
    const ok = readBack === testContent;
    fs.unlinkSync(testFile);
    post({ type: 'downloadTest', success: ok, path: testFile, elapsedMs: elapsed, error: null });
  } catch (e: unknown) {
    const elapsed = Date.now() - t0;
    post({ type: 'downloadTest', success: false, path: testFile, elapsedMs: elapsed, error: String(e) });
  }
}

export async function testDownloadAdb(post: PostFn, pkg: string, remotePath: string): Promise<void> {
  const sp = sanitizeShellArg(pkg);
  const sr = sanitizeShellArg(remotePath);
  const content = `test-${Date.now()}`;
  const remoteFile = `${sr}/_download_test.tmp`;
  const t0 = Date.now();
  try {
    await run(`adb shell run-as ${sp} sh -c "echo '${content}' > ${remoteFile}"`);
    const readBack = await run(`adb shell run-as ${sp} cat ${remoteFile}`);
    const elapsed = Date.now() - t0;
    const ok = readBack.includes(content);
    await run(`adb shell run-as ${sp} rm ${remoteFile}`);
    post({ type: 'downloadTest', success: ok, path: remoteFile, elapsedMs: elapsed, error: null });
  } catch (e: unknown) {
    post({ type: 'downloadTest', success: false, path: remoteFile, elapsedMs: Date.now() - t0, error: String(e) });
  }
}

export async function openStoragePath(post: PostFn, targetPath: string): Promise<void> {
  const platform = process.platform;
  const safe = sanitizeShellArg(targetPath);
  const cmd = platform === 'darwin' ? `open "${safe}"`
    : platform === 'win32' ? `explorer "${safe}"`
    : `xdg-open "${safe}"`;
  try {
    await run(cmd, { timeout: 5000 });
  } catch { /* ignore */ }
}

const TEXT_EXTS = new Set(['.txt', '.json', '.log', '.csv', '.xml', '.yaml', '.yml', '.md', '.sql', '.cfg', '.ini', '.properties', '.gradle', '.plist']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']);
const DB_EXTS = new Set(['.db', '.sqlite', '.sqlite3', '.realm', '.hive']);

export interface FilePreview {
  name: string;
  ext: string;
  kind: 'text' | 'image' | 'db' | 'binary';
  content: string | null;
  size: number;
  truncated: boolean;
}

export async function previewFile(post: PostFn, filePath: string): Promise<void> {
  const name = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    post({ type: 'filePreview', name, ext, kind: 'binary', content: null, size: 0, truncated: false, error: 'File not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const size = stat.size;

  if (IMAGE_EXTS.has(ext)) {
    const buf = fs.readFileSync(filePath);
    const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    post({ type: 'filePreview', name, ext, kind: 'image', content: `data:${mime};base64,${buf.toString('base64')}`, size, truncated: false });
    return;
  }

  if (TEXT_EXTS.has(ext)) {
    const MAX = 64 * 1024;
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(Math.min(size, MAX));
    fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const content = buf.toString('utf-8');
    post({ type: 'filePreview', name, ext, kind: 'text', content, size, truncated: size > MAX });
    return;
  }

  if (DB_EXTS.has(ext)) {
    let tableInfo = '';
    if (['.db', '.sqlite', '.sqlite3'].includes(ext)) {
      try {
        const out = await run(`sqlite3 "${filePath}" ".tables"`, { timeout: 5000 });
        if (out) {
          const tables = out.split(/\s+/).filter(Boolean);
          const details: string[] = [];
          for (const t of tables.slice(0, 10)) {
            const count = await run(`sqlite3 "${filePath}" "SELECT COUNT(*) FROM \\"${t}\\""`, { timeout: 3000 });
            details.push(`${t}: ${count} rows`);
          }
          tableInfo = details.join('\n');
        }
      } catch { tableInfo = 'sqlite3 not available'; }
    }
    post({ type: 'filePreview', name, ext, kind: 'db', content: tableInfo || `Binary DB file (${(size / 1024).toFixed(1)} KB)`, size, truncated: false });
    return;
  }

  const MAX_HEX = 512;
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(Math.min(size, MAX_HEX));
  fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  const hex = buf.toString('hex').match(/.{1,2}/g)?.join(' ') ?? '';
  post({ type: 'filePreview', name, ext, kind: 'binary', content: hex, size, truncated: size > MAX_HEX });
}

export async function previewFileAdb(post: PostFn, pkg: string, remotePath: string): Promise<void> {
  const sp = sanitizeShellArg(pkg);
  const sr = sanitizeShellArg(remotePath);
  const name = path.basename(remotePath);
  const ext = path.extname(remotePath).toLowerCase();
  const sizeOut = await run(`adb shell run-as ${sp} stat -c%s ${sr}`);
  const size = parseInt(sizeOut) || 0;

  if (TEXT_EXTS.has(ext) || DB_EXTS.has(ext)) {
    const content = await run(`adb shell run-as ${sp} head -c 65536 ${sr}`);
    post({ type: 'filePreview', name, ext, kind: TEXT_EXTS.has(ext) ? 'text' : 'db', content, size, truncated: size > 65536 });
    return;
  }

  if (IMAGE_EXTS.has(ext)) {
    const b64 = await run(`adb shell run-as ${sp} cat ${sr} | base64`);
    const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    post({ type: 'filePreview', name, ext, kind: 'image', content: `data:${mime};base64,${b64.replace(/\n/g, '')}`, size, truncated: false });
    return;
  }

  const hex = await run(`adb shell run-as ${sp} head -c 512 ${sr} | xxd -p`);
  post({ type: 'filePreview', name, ext, kind: 'binary', content: hex.replace(/\n/g, ' '), size, truncated: size > 512 });
}
