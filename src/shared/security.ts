import * as path from 'path';

export function safePath(root: string, rel: string): string | null {
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(path.resolve(root) + path.sep) && resolved !== path.resolve(root)) return null;
  return resolved;
}

export function sanitizeShellArg(s: string): string {
  return s.replace(/[^a-zA-Z0-9_./:@=+,-]/g, '');
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validatePid(pid: unknown): number | null {
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid < 2 || pid > 99999) return null;
  return pid;
}

export function sanitizeYamlValue(s: string): string {
  return s.replace(/[\n\r]/g, ' ').replace(/["\\]/g, '');
}

export function sanitizeYamlKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9_.-]/g, '');
}
