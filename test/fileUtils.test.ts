import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readText, readJson, dirSize, parsePubspecDeps, parseAnalysisOptions, toggleLintRule, scanAssets, findUnusedAssets } from '../src/shared/fileUtils';

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-test-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readText', () => {
  it('reads existing file', () => {
    const p = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(p, 'hello');
    expect(readText(p)).toBe('hello');
  });

  it('returns empty string for missing file', () => {
    expect(readText(path.join(tmpDir, 'nonexistent.txt'))).toBe('');
  });
});

describe('readJson', () => {
  it('parses valid JSON', () => {
    const p = path.join(tmpDir, 'valid.json');
    fs.writeFileSync(p, '{"key": "value"}');
    expect(readJson(p)).toEqual({ key: 'value' });
  });

  it('returns empty object for invalid JSON', () => {
    const p = path.join(tmpDir, 'invalid.json');
    fs.writeFileSync(p, '{broken');
    expect(readJson(p)).toEqual({});
  });

  it('returns empty object for missing file', () => {
    expect(readJson(path.join(tmpDir, 'missing.json'))).toEqual({});
  });
});

describe('dirSize', () => {
  it('calculates directory size', () => {
    const dir = path.join(tmpDir, 'sizetest');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'a.txt'), 'a'.repeat(100));
    fs.writeFileSync(path.join(dir, 'b.txt'), 'b'.repeat(200));
    expect(dirSize(dir)).toBe(300);
  });

  it('returns 0 for missing directory', () => {
    expect(dirSize(path.join(tmpDir, 'nodir'))).toBe(0);
  });

  it('skips symlinks', () => {
    const dir = path.join(tmpDir, 'symtest');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'real.txt'), 'x'.repeat(50));
    const linkTarget = path.join(tmpDir, 'symtarget');
    fs.mkdirSync(linkTarget, { recursive: true });
    fs.writeFileSync(path.join(linkTarget, 'big.txt'), 'y'.repeat(1000));
    fs.symlinkSync(linkTarget, path.join(dir, 'link'));
    expect(dirSize(dir)).toBe(50);
  });
});

describe('parsePubspecDeps', () => {
  it('parses dependencies and dev_dependencies', () => {
    const p = path.join(tmpDir, 'pubspec.yaml');
    fs.writeFileSync(p, [
      'name: test_app',
      'version: 1.0.0',
      'description: A test app',
      'dependencies:',
      '  flutter:',
      '    sdk: flutter',
      '  dio: ^5.7.0',
      '  crypto: ^3.0.3',
      'dev_dependencies:',
      '  flutter_test:',
      '    sdk: flutter',
      '  build_runner: ^2.4.9',
    ].join('\n'));

    const result = parsePubspecDeps(tmpDir);
    expect(result.name).toBe('test_app');
    expect(result.version).toBe('1.0.0');
    expect(result.deps).toHaveLength(3);
    expect(result.deps.find(d => d.name === 'dio')).toEqual({ name: 'dio', version: '^5.7.0', isDev: false });
    expect(result.deps.find(d => d.name === 'build_runner')).toEqual({ name: 'build_runner', version: '^2.4.9', isDev: true });
    expect(result.deps.find(d => d.name === 'flutter')).toBeUndefined();
    expect(result.deps.find(d => d.name === 'flutter_test')).toBeUndefined();
  });

  it('handles missing pubspec gracefully', () => {
    const emptyDir = path.join(tmpDir, 'empty');
    fs.mkdirSync(emptyDir, { recursive: true });
    const result = parsePubspecDeps(emptyDir);
    expect(result.deps).toHaveLength(0);
    expect(result.name).toBe('');
  });
});

describe('parseAnalysisOptions', () => {
  it('parses lint rules', () => {
    const p = path.join(tmpDir, 'analysis_options.yaml');
    fs.writeFileSync(p, [
      'linter:',
      '  rules:',
      '    - prefer_const_constructors',
      '    - avoid_print',
      'analyzer:',
      '  exclude:',
      '    - "**/*.g.dart"',
    ].join('\n'));

    const result = parseAnalysisOptions(tmpDir);
    expect(result.rules).toContain('prefer_const_constructors');
    expect(result.rules).toContain('avoid_print');
    expect(result.excluded).toContain('**/*.g.dart');
  });
});

describe('toggleLintRule', () => {
  it('adds a rule', () => {
    const p = path.join(tmpDir, 'analysis_toggle.yaml');
    fs.writeFileSync(p, 'linter:\n  rules:\n    - avoid_print\n');
    const origCwd = process.cwd();
    fs.copyFileSync(p, path.join(tmpDir, 'analysis_options.yaml'));
    toggleLintRule(tmpDir, 'prefer_final_locals', true);
    const text = fs.readFileSync(path.join(tmpDir, 'analysis_options.yaml'), 'utf-8');
    expect(text).toContain('- prefer_final_locals');
  });

  it('removes a rule', () => {
    fs.writeFileSync(path.join(tmpDir, 'analysis_options.yaml'), 'linter:\n  rules:\n    - avoid_print\n    - prefer_final_locals\n');
    toggleLintRule(tmpDir, 'avoid_print', false);
    const text = fs.readFileSync(path.join(tmpDir, 'analysis_options.yaml'), 'utf-8');
    expect(text).not.toContain('- avoid_print');
    expect(text).toContain('- prefer_final_locals');
  });
});

describe('scanAssets', () => {
  it('scans asset files with categories', () => {
    const assetsDir = path.join(tmpDir, 'assets');
    fs.mkdirSync(path.join(assetsDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(assetsDir, 'fonts'), { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'images', 'logo.png'), 'x'.repeat(500));
    fs.writeFileSync(path.join(assetsDir, 'fonts', 'main.ttf'), 'y'.repeat(1000));
    fs.writeFileSync(path.join(assetsDir, 'data.json'), '{}');

    const result = scanAssets(tmpDir);
    expect(result).toHaveLength(3);
    expect(result.find(a => a.name === 'logo.png')?.category).toBe('image');
    expect(result.find(a => a.name === 'main.ttf')?.category).toBe('font');
    expect(result.find(a => a.name === 'data.json')?.category).toBe('data');
    expect(result[0].sizeBytes).toBeGreaterThanOrEqual(result[result.length - 1].sizeBytes);
  });

  it('returns empty for missing assets dir', () => {
    const noAssets = path.join(tmpDir, 'noassets');
    fs.mkdirSync(noAssets, { recursive: true });
    expect(scanAssets(noAssets)).toHaveLength(0);
  });
});

describe('findUnusedAssets', () => {
  it('detects unused assets', () => {
    const projDir = path.join(tmpDir, 'proj');
    const libDir = path.join(projDir, 'lib');
    const assetsDir = path.join(projDir, 'assets');
    fs.mkdirSync(libDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'used.png'), 'img');
    fs.writeFileSync(path.join(assetsDir, 'unused.png'), 'img');
    fs.writeFileSync(path.join(libDir, 'main.dart'), "import 'dart:ui';\nfinal img = 'used.png';\n");
    fs.writeFileSync(path.join(projDir, 'pubspec.yaml'), 'name: proj\n');

    const assets = scanAssets(projDir);
    const unused = findUnusedAssets(projDir, assets);
    expect(unused).toContain(path.join('assets', 'unused.png'));
    expect(unused).not.toContain(path.join('assets', 'used.png'));
  });
});
