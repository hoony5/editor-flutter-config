import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parsePubspecFull, resolveAssetCopyPath } from '../src/tabs/pubspec/handler';

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-pub-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('parsePubspecFull', () => {
  it('parses full pubspec with assets, fonts, platforms', () => {
    fs.writeFileSync(path.join(tmpDir, 'pubspec.yaml'), [
      'name: full_app',
      'version: 2.0.0+1',
      'description: Full test app',
      'environment:',
      '  sdk: ">=3.0.0 <4.0.0"',
      '  flutter: ">=3.10.0"',
      'dependencies:',
      '  flutter:',
      '    sdk: flutter',
      '  dio: ^5.7.0',
      'dev_dependencies:',
      '  flutter_test:',
      '    sdk: flutter',
      '  freezed: ^3.2.3',
      'flutter:',
      '  assets:',
      '    - assets/images/',
      '    - assets/logo.png',
      '  fonts:',
      '    - family: CustomFont',
      '      fonts:',
      '        - asset: fonts/CustomFont-Regular.ttf',
      '        - asset: fonts/CustomFont-Bold.ttf',
    ].join('\n'));

    fs.mkdirSync(path.join(tmpDir, 'ios'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'android'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'macos'), { recursive: true });

    const result = parsePubspecFull(tmpDir);
    expect(result.name).toBe('full_app');
    expect(result.version).toBe('2.0.0+1');
    expect(result.sdkConstraint).toBe('>=3.0.0 <4.0.0');
    expect(result.flutterSdkConstraint).toBe('>=3.10.0');
    expect(result.assets).toContain('assets/images/');
    expect(result.assets).toContain('assets/logo.png');
    expect(result.fonts).toHaveLength(2);
    expect(result.fonts[0].family).toBe('CustomFont');
    expect(result.platforms).toContain('ios');
    expect(result.platforms).toContain('android');
    expect(result.platforms).toContain('macos');
    expect(result.deps.find(d => d.name === 'dio')?.isDev).toBe(false);
    expect(result.deps.find(d => d.name === 'freezed')?.isDev).toBe(true);
  });

  it('handles minimal pubspec', () => {
    const minDir = path.join(tmpDir, 'minimal');
    fs.mkdirSync(minDir, { recursive: true });
    fs.writeFileSync(path.join(minDir, 'pubspec.yaml'), 'name: min_app\nversion: 0.1.0\n');

    const result = parsePubspecFull(minDir);
    expect(result.name).toBe('min_app');
    expect(result.assets).toHaveLength(0);
    expect(result.fonts).toHaveLength(0);
    expect(result.deps).toHaveLength(0);
  });

  it('handles missing pubspec', () => {
    const noDir = path.join(tmpDir, 'nopubspec');
    fs.mkdirSync(noDir, { recursive: true });

    const result = parsePubspecFull(noDir);
    expect(result.name).toBe('');
    expect(result.deps).toHaveLength(0);
  });
});

describe('resolveAssetCopyPath', () => {
  beforeAll(() => {
    fs.mkdirSync(path.join(tmpDir, 'assets', 'images'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'assets', 'images', 'logo.png'), 'x');
  });

  it('returns relative path in relative mode', () => {
    expect(resolveAssetCopyPath(tmpDir, 'assets/images/logo.png', 'relative'))
      .toBe('assets/images/logo.png');
  });

  it('returns absolute path in absolute mode', () => {
    expect(resolveAssetCopyPath(tmpDir, 'assets/images/logo.png', 'absolute'))
      .toBe(path.join(tmpDir, 'assets', 'images', 'logo.png'));
  });

  it('rejects path traversal', () => {
    expect(resolveAssetCopyPath(tmpDir, '../../etc/passwd', 'relative')).toBeNull();
  });

  it('rejects nonexistent files', () => {
    expect(resolveAssetCopyPath(tmpDir, 'assets/nope.png', 'relative')).toBeNull();
  });
});
