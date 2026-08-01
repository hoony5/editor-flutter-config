import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { readJson, readText } from '../../shared/fileUtils';
import { getFlutterCmd, getDartCmd } from '../../shared/execUtils';
import { safePath } from '../../shared/security';
import { trackTerminal } from '../../shared/terminals';
import type { PostFn } from '../../types';

const SKIP_DIRS = new Set(['node_modules', 'build', '.dart_tool', '.git', 'out', '.agents', '.claude', '.qwen', 'ios', 'android', 'macos', 'windows', 'web', 'linux', '.fvm']);

export function scanEnvFiles(root: string): string[] {
  const results: string[] = [];
  function walk(dir: string, depth: number): void {
    if (depth > 4) return;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && !/^\.env($|[._])/.test(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full, depth + 1);
      } else if (entry.isFile()) {
        const rel = path.relative(root, full);
        if (entry.name.endsWith('.json') && /config|env/i.test(rel)) results.push(rel);
        else if (/^\.env($|[._])/.test(entry.name)) results.push(rel);
      }
    }
  }
  walk(root, 0);
  return results.sort();
}

export function inferEnvType(value: string): { type: string; valid: boolean; hint: string } {
  const v = value.trim();

  // URL
  if (/^https?:\/\//i.test(v)) {
    try { new URL(v); return { type: 'URL', valid: true, hint: '' }; }
    catch { return { type: 'URL', valid: false, hint: 'Malformed URL' }; }
  }

  // Boolean
  if (/^(true|false)$/i.test(v)) return { type: 'boolean', valid: true, hint: '' };

  // Number
  if (/^-?\d+(\.\d+)?$/.test(v)) return { type: 'number', valid: true, hint: '' };

  // Port number
  if (/^\d{2,5}$/.test(v) && parseInt(v) <= 65535) return { type: 'port', valid: true, hint: '' };

  // UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return { type: 'UUID', valid: true, hint: '' };

  // JWT-like (Supabase keys)
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) return { type: 'JWT', valid: true, hint: '' };

  // Supabase URL
  if (/^https:\/\/[a-z]+\.supabase\.co$/i.test(v)) return { type: 'Supabase URL', valid: true, hint: '' };

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { type: 'email', valid: true, hint: '' };

  // Path
  if (/^[\/~]/.test(v) || /^[A-Z]:\\/.test(v)) return { type: 'path', valid: true, hint: '' };

  // Empty
  if (!v) return { type: 'empty', valid: false, hint: 'Empty value' };

  // Default: string
  return { type: 'string', valid: true, hint: '' };
}

export function sendEnvFile(root: string, post: PostFn, filePath: string): void {
  const resolved = safePath(root, filePath);
  if (!resolved) return;
  const isDotenv = path.basename(resolved).startsWith('.env');
  const data = isDotenv ? readDotenv(resolved) : readJson(resolved);
  const types: Record<string, { type: string; valid: boolean; hint: string }> = {};
  for (const [key, value] of Object.entries(data)) {
    types[key] = inferEnvType(String(value));
  }
  post({ type: 'envData', fileName: filePath, data, types });
}

function readDotenv(filePath: string): Record<string, string> {
  const text = readText(filePath);
  if (!text) return {};
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

export function createEnvFile(root: string, _post: PostFn, filePath: string): void {
  const fullPath = safePath(root, filePath);
  if (!fullPath) { vscode.window.showWarningMessage('Invalid path.'); return; }
  if (fs.existsSync(fullPath)) {
    vscode.window.showWarningMessage(`${filePath} already exists.`);
    return;
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify({}, null, 2) + '\n');
  vscode.window.showInformationMessage(`Created ${filePath}`);
}

export function deleteEnvFile(root: string, filePath: string): void {
  const fullPath = safePath(root, filePath);
  if (!fullPath) return;
  if (!fs.existsSync(fullPath)) return;
  if (filePath.endsWith('shared.json')) {
    vscode.window.showWarningMessage('shared.json cannot be deleted.');
    return;
  }
  fs.unlinkSync(fullPath);
  vscode.window.showInformationMessage(`Deleted ${filePath}`);
}

export function saveConfig(root: string, filePath: string, key: string, value: string): void {
  const fullPath = safePath(root, filePath);
  if (!fullPath) return;
  const json = readJson(fullPath) as Record<string, string>;
  json[key] = value;
  fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n');
}

export async function promptCreateEnv(root: string): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: 'New env file path (relative to project root)',
    placeHolder: 'config/env/production.json',
    value: 'config/env/',
    validateInput: (v) => {
      const fn = v.endsWith('.json') ? v : v + '.json';
      return /^[a-zA-Z0-9_./-]+\.json$/.test(fn) ? undefined : 'Invalid path';
    },
  });
  if (name) {
    createEnvFile(root, () => {}, name.endsWith('.json') ? name : name + '.json');
  }
}

export function composeAndRun(root: string, target: string): void {
  const t = (target || 'develop').replace(/[^a-zA-Z0-9_-]/g, '');
  const terminal = vscode.window.createTerminal({ name: `Flutter Run (${t})`, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(
    `${getDartCmd(root)} run tool/env/compose_dart_defines.dart --target ${t} --output build/config/${t}.json && ` +
    `${getFlutterCmd(root)} run --dart-define-from-file=build/config/${t}.json`,
  );
}

export function diffEnvFiles(root: string, post: PostFn, fileA: string, fileB: string): void {
  const pathA = safePath(root, fileA);
  const pathB = safePath(root, fileB);
  if (!pathA || !pathB) return;
  const a = readJson(pathA) as Record<string, unknown>;
  const b = readJson(pathB) as Record<string, unknown>;
  const allKeys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const rows = allKeys.map(key => ({
    key,
    inA: key in a,
    inB: key in b,
    valA: key in a ? String(a[key]) : null,
    valB: key in b ? String(b[key]) : null,
    same: key in a && key in b && String(a[key]) === String(b[key]),
  }));
  post({ type: 'envDiff', fileA, fileB, rows });
}
