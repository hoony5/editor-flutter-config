import { describe, it, expect } from 'vitest';
import { getToolCommand } from '../src/tabs/tools/handler';

describe('getToolCommand', () => {
 it('generates bash command for .sh files', () => {
 const cmd = getToolCommand('scripts/deploy.sh', 'bash');
 expect(cmd).toBe('bash "tool/scripts/deploy.sh"');
 });

 it('generates dartw command for .dart files', () => {
 const cmd = getToolCommand('gen/models.dart', 'dart');
 expect(cmd).toBe('./tool/bin/dartw run "tool/gen/models.dart"');
 });

 it('generates python3 command for .py files', () => {
 const cmd = getToolCommand('analysis/lint.py', 'python3');
 expect(cmd).toBe('python3 "tool/analysis/lint.py"');
 });

 it('generates node command for .js files', () => {
 const cmd = getToolCommand('scripts/build.js', 'node');
 expect(cmd).toBe('node "tool/scripts/build.js"');
 });

 it('generates node command for .mjs files', () => {
 const cmd = getToolCommand('scripts/build.mjs', 'node');
 expect(cmd).toBe('node "tool/scripts/build.mjs"');
 });

 it('generates npx tsx command for .ts files', () => {
 const cmd = getToolCommand('scripts/check.ts', 'npx');
 expect(cmd).toBe('npx tsx "tool/scripts/check.ts"');
 });

 it('generates go run command for .go files', () => {
 const cmd = getToolCommand('tools/migrate.go', 'go');
 expect(cmd).toBe('go run "tool/tools/migrate.go"');
 });

 it('generates zsh command for .zsh files', () => {
 const cmd = getToolCommand('env/setup.zsh', 'zsh');
 expect(cmd).toBe('zsh "tool/env/setup.zsh"');
 });

 it('falls back to runtime command for unknown extensions', () => {
 const cmd = getToolCommand('scripts/run.xyz', 'custom-runtime');
 expect(cmd).toBe('custom-runtime "tool/scripts/run.xyz"');
 });

 it('sanitizes runtime in fallback for unknown extensions', () => {
 const cmd = getToolCommand('scripts/run.xyz', 'rm -rf /; evil');
 expect(cmd).toBe('rm-rfevil "tool/scripts/run.xyz"');
 });

 it('strips dangerous shell characters from file path', () => {
 const cmd = getToolCommand('scripts/$(rm).sh', 'bash');
 expect(cmd).not.toContain('$');
 expect(cmd).not.toContain('(');
 expect(cmd).not.toContain(')');
 expect(cmd).toContain('bash "tool/scripts/');
 });

 it('strips semicolons and pipes from file path', () => {
 const cmd = getToolCommand('scripts/a;b|c.sh', 'bash');
 expect(cmd).toBe('bash "tool/scripts/abc.sh"');
 });

 it('strips backticks from file path', () => {
 const cmd = getToolCommand('scripts/`whoami`.py', 'python3');
 expect(cmd).toBe('python3 "tool/scripts/whoami.py"');
 });

 it('strips ampersand and exclamation from file path', () => {
 const cmd = getToolCommand('scripts/a&b!c.js', 'node');
 expect(cmd).toBe('node "tool/scripts/abc.js"');
 });

 it('preserves safe characters in file path', () => {
 const cmd = getToolCommand('my-scripts/deploy_v2.1.sh', 'bash');
 expect(cmd).toBe('bash "tool/my-scripts/deploy_v2.1.sh"');
 });

 it('handles nested directory paths', () => {
 const cmd = getToolCommand('a/b/c/deep.dart', 'dart');
 expect(cmd).toBe('./tool/bin/dartw run "tool/a/b/c/deep.dart"');
 });

 it('wraps path in double quotes for shell safety', () => {
 const cmd = getToolCommand('my scripts/deploy.sh', 'bash');
 expect(cmd).toBe('bash "tool/my scripts/deploy.sh"');
 });
});
