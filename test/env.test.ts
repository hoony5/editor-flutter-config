import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanEnvFiles } from '../src/tabs/env/handler';

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-env-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('scanEnvFiles', () => {
  it('finds config/env JSON files', () => {
    const envDir = path.join(tmpDir, 'config', 'env');
    fs.mkdirSync(envDir, { recursive: true });
    fs.writeFileSync(path.join(envDir, 'develop.json'), '{}');
    fs.writeFileSync(path.join(envDir, 'production.json'), '{}');
    fs.writeFileSync(path.join(envDir, 'shared.json'), '{}');

    const files = scanEnvFiles(tmpDir);
    expect(files).toContain(path.join('config', 'env', 'develop.json'));
    expect(files).toContain(path.join('config', 'env', 'production.json'));
    expect(files).toContain(path.join('config', 'env', 'shared.json'));
  });

  it('finds .env files at root', () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), 'KEY=value');
    fs.writeFileSync(path.join(tmpDir, '.env.local'), 'KEY=value');

    const files = scanEnvFiles(tmpDir);
    expect(files).toContain('.env');
    expect(files).toContain('.env.local');
  });

  it('skips excluded directories', () => {
    const nmDir = path.join(tmpDir, 'node_modules', 'pkg');
    fs.mkdirSync(nmDir, { recursive: true });
    fs.writeFileSync(path.join(nmDir, 'config.json'), '{}');

    const buildDir = path.join(tmpDir, 'build', 'config');
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(path.join(buildDir, 'env.json'), '{}');

    const files = scanEnvFiles(tmpDir);
    expect(files.some(f => f.includes('node_modules'))).toBe(false);
    expect(files.some(f => f.includes('build'))).toBe(false);
  });

  it('returns sorted results', () => {
    const files = scanEnvFiles(tmpDir);
    const sorted = [...files].sort();
    expect(files).toEqual(sorted);
  });

  it('returns empty for empty directory', () => {
    const emptyDir = path.join(tmpDir, 'empty_proj');
    fs.mkdirSync(emptyDir, { recursive: true });
    expect(scanEnvFiles(emptyDir)).toHaveLength(0);
  });
});
