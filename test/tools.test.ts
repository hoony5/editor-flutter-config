import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getToolCommand, resolveToolFile } from '../src/tabs/tools/handler';

let plainRoot: string;
let wrapperRoot: string;

beforeAll(() => {
  plainRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-plain-'));
  wrapperRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-wrapper-'));
  const binDir = path.join(wrapperRoot, 'tool', 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(path.join(binDir, 'dartw'), '#!/bin/sh\n');
  fs.writeFileSync(path.join(binDir, 'flutterw'), '#!/bin/sh\n');
  fs.mkdirSync(path.join(plainRoot, 'tool', 'dev'), { recursive: true });
  fs.writeFileSync(path.join(plainRoot, 'tool', 'dev', 'deploy.sh'), '#!/bin/sh\n');
});

afterAll(() => {
  fs.rmSync(plainRoot, { recursive: true, force: true });
  fs.rmSync(wrapperRoot, { recursive: true, force: true });
});

describe('getToolCommand', () => {
 it('generates bash command for .sh files', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/deploy.sh', 'bash');
 expect(cmd).toBe('bash "tool/scripts/deploy.sh"');
 });

 it('generates dart command for .dart files (no wrapper)', () => {
 const cmd = getToolCommand(plainRoot, 'gen/models.dart', 'dart');
 expect(cmd).toBe('dart run "tool/gen/models.dart"');
 });

 it('generates dartw command for .dart files (with wrapper)', () => {
 const cmd = getToolCommand(wrapperRoot, 'gen/models.dart', 'dart');
 expect(cmd).toBe('./tool/bin/dartw run "tool/gen/models.dart"');
 });

 it('generates python3 command for .py files', () => {
 const cmd = getToolCommand(plainRoot, 'analysis/lint.py', 'python3');
 expect(cmd).toBe('python3 "tool/analysis/lint.py"');
 });

 it('generates node command for .js files', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/build.js', 'node');
 expect(cmd).toBe('node "tool/scripts/build.js"');
 });

 it('generates node command for .mjs files', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/build.mjs', 'node');
 expect(cmd).toBe('node "tool/scripts/build.mjs"');
 });

 it('generates npx tsx command for .ts files', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/check.ts', 'npx');
 expect(cmd).toBe('npx tsx "tool/scripts/check.ts"');
 });

 it('generates go run command for .go files', () => {
 const cmd = getToolCommand(plainRoot, 'tools/migrate.go', 'go');
 expect(cmd).toBe('go run "tool/tools/migrate.go"');
 });

 it('generates zsh command for .zsh files', () => {
 const cmd = getToolCommand(plainRoot, 'env/setup.zsh', 'zsh');
 expect(cmd).toBe('zsh "tool/env/setup.zsh"');
 });

 it('falls back to runtime command for unknown extensions', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/run.xyz', 'custom-runtime');
 expect(cmd).toBe('custom-runtime "tool/scripts/run.xyz"');
 });

 it('sanitizes runtime in fallback for unknown extensions', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/run.xyz', 'rm -rf /; evil');
 expect(cmd).toBe('rm-rfevil "tool/scripts/run.xyz"');
 });

 it('strips dangerous shell characters from file path', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/$(rm).sh', 'bash');
 expect(cmd).not.toContain('$');
 expect(cmd).not.toContain('(');
 expect(cmd).not.toContain(')');
 expect(cmd).toContain('bash "tool/scripts/');
 });

 it('strips semicolons and pipes from file path', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/a;b|c.sh', 'bash');
 expect(cmd).toBe('bash "tool/scripts/abc.sh"');
 });

 it('strips backticks from file path', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/`whoami`.py', 'python3');
 expect(cmd).toBe('python3 "tool/scripts/whoami.py"');
 });

 it('strips ampersand and exclamation from file path', () => {
 const cmd = getToolCommand(plainRoot, 'scripts/a&b!c.js', 'node');
 expect(cmd).toBe('node "tool/scripts/abc.js"');
 });

 it('preserves safe characters in file path', () => {
 const cmd = getToolCommand(plainRoot, 'my-scripts/deploy_v2.1.sh', 'bash');
 expect(cmd).toBe('bash "tool/my-scripts/deploy_v2.1.sh"');
 });

 it('handles nested directory paths with wrapper', () => {
 const cmd = getToolCommand(wrapperRoot, 'a/b/c/deep.dart', 'dart');
 expect(cmd).toBe('./tool/bin/dartw run "tool/a/b/c/deep.dart"');
 });

 it('handles nested directory paths without wrapper', () => {
 const cmd = getToolCommand(plainRoot, 'a/b/c/deep.dart', 'dart');
 expect(cmd).toBe('dart run "tool/a/b/c/deep.dart"');
 });

 it('wraps path in double quotes for shell safety', () => {
 const cmd = getToolCommand(plainRoot, 'my scripts/deploy.sh', 'bash');
 expect(cmd).toBe('bash "tool/my scripts/deploy.sh"');
 });

 it('strips double quotes from file path', () => {
 const cmd = getToolCommand(plainRoot, 'a"b.sh', 'bash');
 expect(cmd).toBe('bash "tool/ab.sh"');
 });

 it('strips newlines and backslashes from file path', () => {
 const cmd = getToolCommand(plainRoot, 'a\nb\\c.sh', 'bash');
 expect(cmd).toBe('bash "tool/abc.sh"');
 });
});

describe('resolveToolFile', () => {
 it('resolves existing files under tool/', () => {
 const abs = resolveToolFile(plainRoot, 'dev/deploy.sh');
 expect(abs).toBe(path.join(plainRoot, 'tool', 'dev', 'deploy.sh'));
 });

 it('rejects path traversal outside tool/', () => {
 expect(resolveToolFile(plainRoot, '../../etc/passwd')).toBeNull();
 });

 it('rejects nonexistent files', () => {
 expect(resolveToolFile(plainRoot, 'dev/nope.sh')).toBeNull();
 });
});
