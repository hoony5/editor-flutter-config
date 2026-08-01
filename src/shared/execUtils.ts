import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { Manifest } from '../types';
import { readText } from './fileUtils';

export function readManifest(root: string): Manifest | null {
  const p = path.join(root, 'tool', 'manifest.yaml');
  if (!fs.existsSync(p)) return null;
  try { return yaml.parse(readText(p)) as Manifest; } catch { return null; }
}

export function getGitStatus(root: string): { branch: string; dirty: number; lastCommit: string } {
  try {
    const branch = execSync('git branch --show-current', { cwd: root, encoding: 'utf-8', timeout: 5000 }).trim();
    const porcelain = execSync('git status --porcelain', { cwd: root, encoding: 'utf-8', timeout: 5000 }).trim();
    const dirty = porcelain ? porcelain.split('\n').length : 0;
    const lastCommit = execSync('git log -1 --oneline', { cwd: root, encoding: 'utf-8', timeout: 5000 }).trim();
    return { branch, dirty, lastCommit };
  } catch {
    return { branch: '-', dirty: 0, lastCommit: '-' };
  }
}
