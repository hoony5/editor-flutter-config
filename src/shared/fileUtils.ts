import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { AssetInfo, PubspecDep } from '../types';

export function readText(p: string): string {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return ''; }
}

export function readJson(p: string): Record<string, unknown> {
  const t = readText(p);
  if (!t) return {};
  try { return JSON.parse(t); } catch {
    console.warn(`[flutter-config] JSON parse failed: ${p}`);
    return {};
  }
}

export function dirSize(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else if (entry.isFile()) total += fs.statSync(full).size;
  }
  return total;
}

export function scanAssets(root: string): AssetInfo[] {
  const assetsDir = path.join(root, 'assets');
  if (!fs.existsSync(assetsDir)) return [];
  const results: AssetInfo[] = [];
  const catMap: Record<string, string> = {
    '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image',
    '.webp': 'image', '.svg': 'image', '.bmp': 'image', '.ico': 'image',
    '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.aac': 'audio', '.flac': 'audio',
    '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.webm': 'video',
    '.ttf': 'font', '.otf': 'font', '.woff': 'font', '.woff2': 'font',
    '.json': 'data', '.yaml': 'data', '.yml': 'data', '.csv': 'data',
    '.riv': 'animation', '.lottie': 'animation',
  };
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      results.push({
        path: path.relative(root, full),
        name: entry.name,
        ext,
        sizeBytes: fs.statSync(full).size,
        category: catMap[ext] ?? 'other',
      });
    }
  }
  walk(assetsDir);
  return results.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

export function findUnusedAssets(root: string, assets: AssetInfo[]): string[] {
  const libDir = path.join(root, 'lib');
  if (!fs.existsSync(libDir)) return [];
  let allDart = '';
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.dart')) allDart += readText(full) + '\n';
    }
  }
  walk(libDir);
  allDart += readText(path.join(root, 'pubspec.yaml'));
  return assets
    .filter(a => !allDart.includes(a.name) && !allDart.includes(a.path))
    .map(a => a.path);
}

export function findUnusedScripts(root: string): string[] {
  const toolDir = path.join(root, 'tool');
  if (!fs.existsSync(toolDir)) return [];
  const scripts: string[] = [];
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.isFile()) continue;
      if (['.sh', '.dart', '.py', '.ps1'].includes(path.extname(entry.name))) {
        scripts.push(path.relative(root, full));
      }
    }
  }
  walk(toolDir);
  const combined = readText(path.join(root, 'Makefile')) + readText(path.join(root, 'tool', 'manifest.yaml'));
  return scripts.filter(s => {
    const base = path.basename(s);
    return !combined.includes(base) && !combined.includes(s);
  });
}

export function parsePubspecDeps(root: string): { deps: PubspecDep[]; name: string; version: string; description: string } {
  const text = readText(path.join(root, 'pubspec.yaml'));
  let parsed: Record<string, unknown> = {};
  try { parsed = yaml.parse(text) ?? {}; } catch { /* parse error */ }
  const deps: PubspecDep[] = [];
  const dependencies = (parsed.dependencies ?? {}) as Record<string, unknown>;
  const devDependencies = (parsed.dev_dependencies ?? {}) as Record<string, unknown>;
  for (const [name, val] of Object.entries(dependencies)) {
    if (name === 'flutter' || name === 'flutter_localizations') continue;
    deps.push({ name, version: typeof val === 'string' ? val : String(val ?? ''), isDev: false });
  }
  for (const [name, val] of Object.entries(devDependencies)) {
    if (name === 'flutter_test' || name === 'integration_test') continue;
    deps.push({ name, version: typeof val === 'string' ? val : String(val ?? ''), isDev: true });
  }
  return {
    deps: deps.sort((a, b) => a.name.localeCompare(b.name)),
    name: String(parsed.name ?? ''),
    version: String(parsed.version ?? ''),
    description: String(parsed.description ?? ''),
  };
}

export function parseAnalysisOptions(root: string): { rules: string[]; excluded: string[] } {
  const text = readText(path.join(root, 'analysis_options.yaml'));
  let parsed: Record<string, unknown> = {};
  try { parsed = yaml.parse(text) ?? {}; } catch { /* parse error */ }
  const linter = (parsed.linter ?? {}) as Record<string, unknown>;
  const analyzer = (parsed.analyzer ?? {}) as Record<string, unknown>;
  return {
    rules: (linter.rules ?? []) as string[],
    excluded: (analyzer.exclude ?? []) as string[],
  };
}

export function toggleLintRule(root: string, rule: string, enabled: boolean): void {
  const filePath = path.join(root, 'analysis_options.yaml');
  let text = readText(filePath);
  if (enabled) {
    if (!text.includes(`- ${rule}`)) {
      text = text.replace(/(rules:\n)/, `$1    - ${rule}\n`);
    }
  } else {
    text = text.split('\n').filter(l => l.trim() !== `- ${rule}`).join('\n');
  }
  fs.writeFileSync(filePath, text);
}

export function regexFirst(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}
