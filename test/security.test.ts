import { describe, it, expect } from 'vitest';
import { safePath, sanitizeShellArg, escapeRegex, validatePid, sanitizeYamlValue, sanitizeYamlKey } from '../src/shared/security';
import * as path from 'path';

const ROOT = '/Users/test/project';

describe('safePath', () => {
  it('resolves valid relative path within root', () => {
    expect(safePath(ROOT, 'config/env/dev.json')).toBe(path.resolve(ROOT, 'config/env/dev.json'));
  });

  it('resolves nested path', () => {
    expect(safePath(ROOT, 'ios/Runner/Info.plist')).toBe(path.resolve(ROOT, 'ios/Runner/Info.plist'));
  });

  it('blocks parent traversal', () => {
    expect(safePath(ROOT, '../../etc/passwd')).toBeNull();
  });

  it('blocks absolute path outside root', () => {
    expect(safePath(ROOT, '/etc/passwd')).toBeNull();
  });

  it('allows root itself', () => {
    expect(safePath(ROOT, '.')).toBe(path.resolve(ROOT));
  });

  it('blocks sneaky traversal via subdirectory', () => {
    expect(safePath(ROOT, 'config/../../etc/passwd')).toBeNull();
  });
});

describe('sanitizeShellArg', () => {
  it('preserves safe characters', () => {
    expect(sanitizeShellArg('hello-world_v2.0')).toBe('hello-world_v2.0');
  });

  it('removes semicolons and pipes', () => {
    expect(sanitizeShellArg('foo; rm -rf /')).toBe('foorm-rf/');
  });

  it('removes command substitution', () => {
    expect(sanitizeShellArg('$(curl evil.com)')).toBe('curlevil.com');
  });

  it('removes backticks', () => {
    expect(sanitizeShellArg('`whoami`')).toBe('whoami');
  });

  it('preserves path separators and colons', () => {
    expect(sanitizeShellArg('tool/codegen/build.sh')).toBe('tool/codegen/build.sh');
  });
});

describe('escapeRegex', () => {
  it('escapes dots', () => {
    expect(escapeRegex('key.properties')).toBe('key\\.properties');
  });

  it('escapes special regex chars', () => {
    expect(escapeRegex('a+b*c?')).toBe('a\\+b\\*c\\?');
  });

  it('escapes brackets and parens', () => {
    expect(escapeRegex('[test](value)')).toBe('\\[test\\]\\(value\\)');
  });

  it('leaves plain strings unchanged', () => {
    expect(escapeRegex('NSCameraUsageDescription')).toBe('NSCameraUsageDescription');
  });
});

describe('validatePid', () => {
  it('accepts valid PID', () => {
    expect(validatePid(1234)).toBe(1234);
  });

  it('rejects PID 0', () => {
    expect(validatePid(0)).toBeNull();
  });

  it('rejects PID 1 (init)', () => {
    expect(validatePid(1)).toBeNull();
  });

  it('rejects negative PID', () => {
    expect(validatePid(-5)).toBeNull();
  });

  it('rejects non-integer', () => {
    expect(validatePid(3.14)).toBeNull();
  });

  it('rejects string', () => {
    expect(validatePid('1234' as unknown)).toBeNull();
  });

  it('rejects too large PID', () => {
    expect(validatePid(100000)).toBeNull();
  });
});

describe('sanitizeYamlValue', () => {
  it('removes newlines', () => {
    expect(sanitizeYamlValue('line1\nline2')).toBe('line1 line2');
  });

  it('removes double quotes and backslashes', () => {
    expect(sanitizeYamlValue('say "hello" \\ world')).toBe('say hello  world');
  });

  it('preserves normal text', () => {
    expect(sanitizeYamlValue('A Flutter app template')).toBe('A Flutter app template');
  });
});

describe('sanitizeYamlKey', () => {
  it('preserves valid key characters', () => {
    expect(sanitizeYamlKey('my-package_name.v2')).toBe('my-package_name.v2');
  });

  it('removes spaces and special chars', () => {
    expect(sanitizeYamlKey('bad key!@#')).toBe('badkey');
  });

  it('removes newlines for injection prevention', () => {
    expect(sanitizeYamlKey('foo\nevil: *')).toBe('fooevil');
  });
});
