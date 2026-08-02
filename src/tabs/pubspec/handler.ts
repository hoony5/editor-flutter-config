import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import * as vscode from 'vscode';
import { readText, parsePubspecDeps } from '../../shared/fileUtils';
import { sanitizeYamlValue, sanitizeYamlKey, safePath } from '../../shared/security';
import { trackTerminal } from '../../shared/terminals';
import type { PostFn } from '../../types';

export interface PubspecFull {
  name: string;
  version: string;
  description: string;
  deps: { name: string; version: string; isDev: boolean }[];
  assets: string[];
  fonts: { family: string; file: string }[];
  sdkConstraint: string;
  flutterSdkConstraint: string;
  platforms: string[];
  parseError?: string;
}

export function parsePubspecFull(root: string): PubspecFull {
  const base = parsePubspecDeps(root);
  const text = readText(path.join(root, 'pubspec.yaml'));
  let parsed: Record<string, unknown> = {};
  let parseError: string | undefined;
  try { parsed = yaml.parse(text) ?? {}; } catch (e: unknown) {
    const ye = e as { linePos?: { line: number; col: number }[]; message?: string };
    const loc = ye.linePos ? `line ${ye.linePos[0]?.line}, col ${ye.linePos[0]?.col}` : '';
    parseError = `pubspec.yaml parse error${loc ? ` (${loc})` : ''}: ${ye.message ?? 'unknown'}`;
  }

  const flutter = (parsed.flutter ?? {}) as Record<string, unknown>;
  const env = (parsed.environment ?? {}) as Record<string, unknown>;

  const assets: string[] = [];
  const rawAssets = (flutter.assets ?? []) as unknown[];
  for (const a of rawAssets) {
    if (typeof a === 'string') assets.push(a);
  }

  const fonts: { family: string; file: string }[] = [];
  const rawFonts = (flutter.fonts ?? []) as { family?: string; fonts?: { asset?: string }[] }[];
  for (const f of rawFonts) {
    const family = f.family ?? '';
    for (const ff of f.fonts ?? []) {
      if (ff.asset) fonts.push({ family, file: ff.asset });
    }
  }

  const platformKeys = ['ios', 'android', 'macos', 'windows', 'linux', 'web'];
  const plugin = (parsed.plugin ?? {}) as Record<string, unknown>;
  const pluginPlatforms = (plugin.platforms ?? {}) as Record<string, unknown>;
  const platforms = platformKeys.filter(p => {
    const flutterDir = path.join(root, p);
    return fs.existsSync(flutterDir) || p in pluginPlatforms;
  });

  return {
    ...base,
    assets,
    fonts,
    sdkConstraint: String(env.sdk ?? ''),
    flutterSdkConstraint: String(env.flutter ?? ''),
    platforms,
    parseError,
  };
}

export function readAssetPreview(root: string, assetPath: string): string | null {
  const ext = path.extname(assetPath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext)) return null;
  const full = path.join(root, assetPath);
  if (!fs.existsSync(full)) return null;
  const stat = fs.statSync(full);
  if (stat.size > 300 * 1024) return null;
  const buf = fs.readFileSync(full);
  const mime: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  };
  return `data:${mime[ext] ?? 'image/png'};base64,${buf.toString('base64')}`;
}

const TEXT_EXTS = new Set(['.arb', '.json', '.yaml', '.yml', '.sql', '.md', '.txt', '.csv', '.dart', '.xml', '.html', '.css', '.properties', '.gradle', '.plist', '.entitlements', '.toml', '.ini', '.cfg', '.log', '.sh', '.bat', '.env']);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']);
const FONT_EXTS = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.aac', '.flac']);
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv']);
const DB_EXTS = new Set(['.db', '.sqlite', '.sqlite3']);

const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.avi': 'video/x-msvideo',
};

export function getAssetPreviewData(root: string, post: PostFn, filePath: string): void {
  const full = safePath(root, filePath);
  if (!full || !fs.existsSync(full)) { post({ type: 'assetPreview', filePath, data: null, previewType: 'none' }); return; }
  const ext = path.extname(full).toLowerCase();
  const stat = fs.statSync(full);

  if (TEXT_EXTS.has(ext)) {
    const content = fs.readFileSync(full, 'utf-8');
    const allLines = content.split('\n');
    const preview = allLines.slice(0, 40).join('\n');
    post({ type: 'assetPreview', filePath, data: preview, previewType: 'text', totalLines: allLines.length, sizeBytes: stat.size });
    return;
  }
  if (IMAGE_EXTS.has(ext) && stat.size <= 500 * 1024) {
    const buf = fs.readFileSync(full);
    post({ type: 'assetPreview', filePath, data: `data:${MIME[ext]};base64,${buf.toString('base64')}`, previewType: 'image', sizeBytes: stat.size });
    return;
  }
  if (FONT_EXTS.has(ext) && stat.size <= 500 * 1024) {
    const buf = fs.readFileSync(full);
    post({ type: 'assetPreview', filePath, data: `data:${MIME[ext]};base64,${buf.toString('base64')}`, previewType: 'font', sizeBytes: stat.size });
    return;
  }
  if (AUDIO_EXTS.has(ext) && stat.size <= 5 * 1024 * 1024) {
    const buf = fs.readFileSync(full);
    post({ type: 'assetPreview', filePath, data: `data:${MIME[ext]};base64,${buf.toString('base64')}`, previewType: 'audio', sizeBytes: stat.size });
    return;
  }
  if (VIDEO_EXTS.has(ext) && stat.size <= 10 * 1024 * 1024) {
    const buf = fs.readFileSync(full);
    post({ type: 'assetPreview', filePath, data: `data:${MIME[ext]};base64,${buf.toString('base64')}`, previewType: 'video', sizeBytes: stat.size });
    return;
  }
  if (DB_EXTS.has(ext)) {
    post({ type: 'assetPreview', filePath, data: `SQLite / DB file\nSize: ${fmtBytes(stat.size)}`, previewType: 'info', sizeBytes: stat.size });
    return;
  }
  post({ type: 'assetPreview', filePath, data: `Binary file\nSize: ${fmtBytes(stat.size)}`, previewType: 'info', sizeBytes: stat.size });
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export function sendPubspec(root: string, post: PostFn): void {
  const data = parsePubspecFull(root);
  const previews: Record<string, string> = {};
  const assetFiles: Record<string, { name: string; sizeBytes: number; category: string }[]> = {};

  const catOf = (ext: string): string => {
    const map: Record<string, string> = {
      '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image', '.webp': 'image', '.svg': 'image', '.bmp': 'image', '.ico': 'image',
      '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.aac': 'audio', '.flac': 'audio',
      '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.webm': 'video',
      '.ttf': 'font', '.otf': 'font', '.woff': 'font', '.woff2': 'font',
      '.json': 'data', '.yaml': 'data', '.yml': 'data', '.csv': 'data',
      '.riv': 'animation', '.lottie': 'animation',
    };
    return map[ext] ?? 'other';
  };

  const listDir = (dirRel: string): void => {
    const dir = path.join(root, dirRel);
    if (!fs.existsSync(dir)) return;
    const files: { name: string; sizeBytes: number; category: string }[] = [];
    try {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        try {
          const st = fs.statSync(full);
          if (!st.isFile()) continue;
          const ext = path.extname(f).toLowerCase();
          files.push({ name: f, sizeBytes: st.size, category: catOf(ext) });
          const rel = dirRel + f;
          const prev = readAssetPreview(root, rel);
          if (prev) previews[rel] = prev;
        } catch { /* skip unreadable */ }
      }
    } catch { /* dir unreadable */ }
    files.sort((a, b) => a.name.localeCompare(b.name));
    assetFiles[dirRel] = files;
  };

  for (const a of data.assets) {
    if (a.endsWith('/')) {
      listDir(a);
    } else {
      const prev = readAssetPreview(root, a);
      if (prev) previews[a] = prev;
    }
  }

  post({ type: 'pubspec', ...data, previews, assetFiles });
}

export function writePubspecField(root: string, post: PostFn, field: string, value: string): void {
  const safeField = sanitizeYamlKey(field);
  const safeValue = sanitizeYamlValue(value);
  const filePath = path.join(root, 'pubspec.yaml');
  let text = readText(filePath);
  const regex = new RegExp(`^${safeField}:\\s*.*$`, 'm');
  text = safeField === 'description'
    ? text.replace(regex, `${safeField}: "${safeValue}"`)
    : text.replace(regex, `${safeField}: ${safeValue}`);
  fs.writeFileSync(filePath, text);
  sendPubspec(root, post);
}

export function saveDeps(
  root: string,
  post: PostFn,
  removals: string[],
  additions: { name: string; version: string; isDev: boolean }[],
): void {
  const filePath = path.join(root, 'pubspec.yaml');
  let text = readText(filePath);
  if (removals.length > 0) {
    text = text.split('\n')
      .filter(l => !removals.some(name => l.trim().startsWith(`${name}:`)))
      .join('\n');
  }
  for (const dep of additions) {
    const section = dep.isDev ? 'dev_dependencies:' : 'dependencies:';
    const idx = text.indexOf(section);
    if (idx === -1) continue;
    const nextLine = text.indexOf('\n', idx);
    const safeName = sanitizeYamlKey(dep.name);
    const safeVer = sanitizeYamlValue(dep.version || 'any');
    if (!safeName) continue;
    text = text.substring(0, nextLine + 1) + `  ${safeName}: ${safeVer}\n` + text.substring(nextLine + 1);
  }
  fs.writeFileSync(filePath, text);
  sendPubspec(root, post);
}

export function addAssetPath(root: string, post: PostFn, assetPath: string): void {
  const safePath_ = assetPath.replace(/[^a-zA-Z0-9_./-]/g, '');
  if (!safePath_) return;
  const normalized = safePath_.endsWith('/') ? safePath_ : safePath_ + '/';
  const filePath = path.join(root, 'pubspec.yaml');
  let text = readText(filePath);
  if (text.includes(`- ${normalized}`)) { sendPubspec(root, post); return; }
  const assetsRe = /^(\s+)assets:\s*$/m;
  const m = text.match(assetsRe);
  if (m) {
    text = text.replace(assetsRe, `$&\n${m[1]}  - ${normalized}`);
  } else {
    const flutterRe = /^(\s*)flutter:\s*$/m;
    const fm = text.match(flutterRe);
    if (fm) {
      text = text.replace(flutterRe, `$&\n${fm[1]}  assets:\n${fm[1]}    - ${normalized}`);
    }
  }
  fs.writeFileSync(filePath, text);
  sendPubspec(root, post);
}

export function removeAssetPath(root: string, post: PostFn, assetPath: string): void {
  const filePath = path.join(root, 'pubspec.yaml');
  let text = readText(filePath);
  text = text.split('\n').filter(l => l.trim() !== `- ${assetPath}`).join('\n');
  fs.writeFileSync(filePath, text);
  sendPubspec(root, post);
}

export function loadAssetDirs(root: string, post: PostFn): void {
  const assetsDir = path.join(root, 'assets');
  const discovered: string[] = [];
  if (fs.existsSync(assetsDir)) {
    discovered.push('assets/');
    const walk = (dir: string): void => {
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const rel = path.relative(root, path.join(dir, entry.name)).replace(/\\/g, '/') + '/';
          discovered.push(rel);
          walk(path.join(dir, entry.name));
        }
      }
    };
    walk(assetsDir);
  }
  const filePath = path.join(root, 'pubspec.yaml');
  let text = readText(filePath);
  let added = 0;
  for (const d of discovered.sort()) {
    if (!text.includes(`- ${d}`)) {
      const assetsRe = /^(\s+)assets:\s*$/m;
      const m = text.match(assetsRe);
      if (m) {
        text = text.replace(assetsRe, `$&\n${m[1]}  - ${d}`);
        added++;
      }
    }
  }
  if (added > 0) fs.writeFileSync(filePath, text);
  sendPubspec(root, post);
}

export function analyzeAssetOptimization(root: string, post: PostFn): void {
  const suggestions: { file: string; sizeBytes: number; suggestion: string }[] = [];
  const assetsDir = path.join(root, 'assets');
  if (!fs.existsSync(assetsDir)) { post({ type: 'assetOptimization', suggestions }); return; }

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      let size: number;
      try { size = fs.statSync(full).size; } catch { continue; }
      const rel = path.relative(root, full);

      if (['.png', '.jpg', '.jpeg', '.bmp'].includes(ext) && size > 1024 * 1024) {
        suggestions.push({ file: rel, sizeBytes: size, suggestion: 'WebP 변환 권장 (1MB+)' });
      }
      if (['.png', '.jpg', '.jpeg'].includes(ext) && size > 500 * 1024) {
        suggestions.push({ file: rel, sizeBytes: size, suggestion: '압축 또는 리사이즈 검토 (500KB+)' });
      }
      if (ext === '.wav' && size > 2 * 1024 * 1024) {
        suggestions.push({ file: rel, sizeBytes: size, suggestion: 'OGG/AAC 변환 권장 (2MB+ WAV)' });
      }
      if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext) && size > 5 * 1024 * 1024) {
        suggestions.push({ file: rel, sizeBytes: size, suggestion: 'H.265(HEVC) 인코딩 권장 (5MB+ video)' });
      }
      if (['.mp4', '.mov'].includes(ext) && size > 1 * 1024 * 1024) {
        suggestions.push({ file: rel, sizeBytes: size, suggestion: 'H.265 전환 시 40~60% 절감 가능' });
      }
    }
  };
  walk(assetsDir);

  const fontExts = ['.ttf', '.otf'];
  const declaredFonts: string[] = [];
  const pubspecText = readText(path.join(root, 'pubspec.yaml'));
  const fontRe = /asset:\s*(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = fontRe.exec(pubspecText)) !== null) declaredFonts.push(m[1].trim());

  const unusedFonts: string[] = [];
  const fontsDir = path.join(root, 'fonts');
  if (fs.existsSync(fontsDir)) {
    for (const f of fs.readdirSync(fontsDir)) {
      if (!fontExts.includes(path.extname(f).toLowerCase())) continue;
      const rel = `fonts/${f}`;
      if (!declaredFonts.some(d => d.includes(f))) unusedFonts.push(rel);
    }
  }

  suggestions.sort((a, b) => b.sizeBytes - a.sizeBytes);
  post({ type: 'assetOptimization', suggestions: suggestions.slice(0, 20), unusedFonts });
}

export function assetOptimize(root: string, cmd: string, file: string): void {
  const safe = file.replace(/[;|&$`()[\]{}<>!#~]/g, '');
  const out = safe.replace(/\.\w+$/, '');
  const cmds: Record<string, string> = {
    webp: `cwebp -q 80 "${safe}" -o "${out}.webp" && echo "Done: ${out}.webp"`,
    resize: `sips -Z 50% "${safe}" && echo "Resized: ${safe}"`,
    h264: `ffmpeg -i "${safe}" -c:v libx264 -crf 23 -c:a aac "${out}_h264.mp4" && echo "Done: ${out}_h264.mp4"`,
  };
  const command = cmds[cmd];
  if (!command) return;
  const terminal = vscode.window.createTerminal({ name: `Asset: ${cmd}`, cwd: root });
  trackTerminal(terminal);
  terminal.show();
  terminal.sendText(command);
}

export function scanAssetUsage(root: string, post: PostFn): void {
  const pubspec = parsePubspecFull(root);
  const assets = pubspec.assets;

  // Collect all asset file paths
  const assetFiles: string[] = [];
  for (const a of assets) {
    if (a.endsWith('/')) {
      const dir = path.join(root, a);
      if (fs.existsSync(dir)) {
        const walkDir = (d: string): void => {
          for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) walkDir(full);
            else assetFiles.push(path.relative(root, full).replace(/\\/g, '/'));
          }
        };
        walkDir(dir);
      }
    } else {
      assetFiles.push(a);
    }
  }

  // Scan Dart files for references
  const libDir = path.join(root, 'lib');
  const dartContents: { file: string; content: string }[] = [];
  if (fs.existsSync(libDir)) {
    const walkLib = (d: string): void => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walkLib(full);
        else if (entry.name.endsWith('.dart')) {
          dartContents.push({ file: path.relative(root, full).replace(/\\/g, '/'), content: readText(full) });
        }
      }
    };
    walkLib(libDir);
  }

  const usage = assetFiles.map(asset => {
    const fileName = path.basename(asset);
    const referencedBy = dartContents
      .filter(d => d.content.includes(fileName) || d.content.includes(asset))
      .map(d => d.file);
    return { asset, referencedBy, unused: referencedBy.length === 0 };
  });

  post({ type: 'assetUsage', usage });
}

export function batchOptimize(root: string, post: PostFn): void {
  const assetsDir = path.join(root, 'assets');
  if (!fs.existsSync(assetsDir)) {
    post({ type: 'batchOptimize', script: '', fileCount: 0, totalSavings: '0 B' });
    return;
  }

  const candidates: { rel: string; sizeBytes: number }[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
      let size: number;
      try { size = fs.statSync(full).size; } catch { continue; }
      if (size > 100 * 1024) {
        candidates.push({ rel: path.relative(root, full).replace(/\\/g, '/'), sizeBytes: size });
      }
    }
  };
  walk(assetsDir);

  if (!candidates.length) {
    post({ type: 'batchOptimize', script: '', fileCount: 0, totalSavings: '0 B' });
    return;
  }

  const lines: string[] = [
    '#!/bin/bash',
    '# Batch WebP conversion script',
    '# Generated by Flutter App Config extension',
    '# Requires: cwebp (brew install webp)',
    '',
    'set -e',
    '',
  ];

  let totalOriginal = 0;
  for (const c of candidates) {
    const out = c.rel.replace(/\.\w+$/, '.webp');
    lines.push(`echo "Converting: ${c.rel} (${fmtBytes(c.sizeBytes)})"`);
    lines.push(`cwebp -q 80 "${c.rel}" -o "${out}"`);
    lines.push('');
    totalOriginal += c.sizeBytes;
  }

  lines.push(`echo "Done. Converted ${candidates.length} file(s)."`);
  lines.push('# Estimated savings: ~40-60% of original size');
  lines.push(`# Original total: ${fmtBytes(totalOriginal)}`);

  // Estimate ~50% savings for WebP conversion
  const estimatedSavings = fmtBytes(Math.round(totalOriginal * 0.5));

  post({
    type: 'batchOptimize',
    script: lines.join('\n'),
    fileCount: candidates.length,
    totalSavings: `~${estimatedSavings} (est. 50% of ${fmtBytes(totalOriginal)})`,
  });
}
