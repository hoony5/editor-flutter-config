import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanCodegenStatus } from '../src/tabs/codegen/handler';

let tmpDir: string;
let lastMessage: Record<string, unknown> | null = null;

const post = (msg: unknown): void => {
 lastMessage = msg as Record<string, unknown>;
};

beforeAll(() => {
 tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-codegen-'));
});

afterAll(() => {
 fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('scanCodegenStatus', () => {
 it('detects @freezed annotations and missing generated files', () => {
 const dir = path.join(tmpDir, 'freezed-proj');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'user.dart'), [
 "import 'package:freezed_annotation/freezed_annotation.dart';",
 '',
 '@freezed',
 'class User with _$User {',
 '  const factory User({required String name}) = _User;',
 '}',
 ].join('\n'));

 lastMessage = null;
 scanCodegenStatus(dir, post);

 expect(lastMessage).not.toBeNull();
 expect(lastMessage!.type).toBe('codegenStatus');

 const annotations = lastMessage!.annotations as Record<string, unknown[]>;
 expect(annotations['@freezed']).toHaveLength(1);

 const hit = (annotations['@freezed'] as { file: string; className: string }[])[0];
 expect(hit.file).toBe(path.join('lib', 'user.dart'));
 expect(hit.className).toBe('User');

 const missing = lastMessage!.missing as { file: string; expected: string }[];
 expect(missing.length).toBeGreaterThanOrEqual(1);
 expect(missing.some(m => m.expected === 'user.freezed.dart')).toBe(true);
 });

 it('detects @riverpod annotations', () => {
 const dir = path.join(tmpDir, 'riverpod-proj');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'providers.dart'), [
 "import 'package:riverpod_annotation/riverpod_annotation.dart';",
 '',
 '@riverpod',
 'class CounterNotifier extends _$CounterNotifier {',
 '  int build() => 0;',
 '}',
 '',
 '@Riverpod()',
 'class AsyncProvider extends _$AsyncProvider {',
 '  Future<String> build() async => "hello";',
 '}',
 ].join('\n'));

 lastMessage = null;
 scanCodegenStatus(dir, post);

 const annotations = lastMessage!.annotations as Record<string, unknown[]>;
 expect(annotations['@riverpod']).toHaveLength(2);
 });

 it('detects multiple annotation types in one file', () => {
 const dir = path.join(tmpDir, 'multi-proj');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'model.dart'), [
 '@freezed',
 'class Config with _$Config {',
 '  const factory Config() = _Config;',
 '}',
 '',
 '@JsonSerializable()',
 'class Dto {',
 '  final String id;',
 '  Dto(this.id);',
 '}',
 '',
 '@immutable',
 'class Constants {',
 '  static const x = 1;',
 '}',
 ].join('\n'));

 lastMessage = null;
 scanCodegenStatus(dir, post);

 const annotations = lastMessage!.annotations as Record<string, unknown[]>;
 expect(annotations['@freezed']).toHaveLength(1);
 expect(annotations['@JsonSerializable']).toHaveLength(1);
 expect(annotations['@immutable']).toHaveLength(1);
 });

 it('does not report missing when generated file exists', () => {
 const dir = path.join(tmpDir, 'gen-exists-proj');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'item.dart'), [
 '@freezed',
 'class Item with _$Item {',
 '  const factory Item() = _Item;',
 '}',
 ].join('\n'));
 // Create the generated file so it should NOT be missing
 fs.writeFileSync(path.join(libDir, 'item.freezed.dart'), '// generated');

 lastMessage = null;
 scanCodegenStatus(dir, post);

 const missing = lastMessage!.missing as { file: string; expected: string }[];
 expect(missing.some(m => m.expected === 'item.freezed.dart')).toBe(false);
 });

 it('counts generated files by pattern', () => {
 const dir = path.join(tmpDir, 'count-proj');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'a.g.dart'), '// gen');
 fs.writeFileSync(path.join(libDir, 'b.g.dart'), '// gen');
 fs.writeFileSync(path.join(libDir, 'c.freezed.dart'), '// gen');

 lastMessage = null;
 scanCodegenStatus(dir, post);

 const generatedFiles = lastMessage!.generatedFiles as { pattern: string; count: number }[];
 const gDart = generatedFiles.find(g => g.pattern === '*.g.dart');
 const freezedDart = generatedFiles.find(g => g.pattern === '*.freezed.dart');
 expect(gDart?.count).toBe(2);
 expect(freezedDart?.count).toBe(1);
 });

 it('parses build.yaml when present', () => {
 const dir = path.join(tmpDir, 'buildyaml-proj');
 fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
 fs.writeFileSync(path.join(dir, 'build.yaml'), [
 'targets:',
 '  $default:',
 '    builders:',
 '      freezed:',
 '        options:',
 '          explicit_to_json: true',
 ].join('\n'));

 lastMessage = null;
 scanCodegenStatus(dir, post);

 expect(lastMessage!.buildYaml).not.toBeNull();
 const buildYaml = lastMessage!.buildYaml as Record<string, unknown>;
 expect(buildYaml.targets).toBeDefined();
 });

 it('returns null buildYaml when build.yaml is absent', () => {
 const dir = path.join(tmpDir, 'no-buildyaml-proj');
 fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });

 lastMessage = null;
 scanCodegenStatus(dir, post);

 expect(lastMessage!.buildYaml).toBeNull();
 });

 it('handles empty lib directory', () => {
 const dir = path.join(tmpDir, 'empty-proj');
 fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });

 lastMessage = null;
 scanCodegenStatus(dir, post);

 const annotations = lastMessage!.annotations as Record<string, unknown[]>;
 expect(annotations['@freezed']).toHaveLength(0);
 expect(annotations['@riverpod']).toHaveLength(0);
 expect(lastMessage!.missing).toHaveLength(0);
 });

 it('handles missing lib directory', () => {
 const dir = path.join(tmpDir, 'no-lib-proj');
 fs.mkdirSync(dir, { recursive: true });

 lastMessage = null;
 scanCodegenStatus(dir, post);

 expect(lastMessage!.type).toBe('codegenStatus');
 const annotations = lastMessage!.annotations as Record<string, unknown[]>;
 expect(annotations['@freezed']).toHaveLength(0);
 });

 it('skips .g.dart and .freezed.dart files during scan', () => {
 const dir = path.join(tmpDir, 'skip-gen-proj');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 // This generated file contains @freezed but should be skipped
 fs.writeFileSync(path.join(libDir, 'model.freezed.dart'), [
 '@freezed',
 'class ShouldNotCount with _$ShouldNotCount {}',
 ].join('\n'));
 fs.writeFileSync(path.join(libDir, 'model.g.dart'), [
 '@JsonSerializable()',
 'class AlsoSkipped {}',
 ].join('\n'));

 lastMessage = null;
 scanCodegenStatus(dir, post);

 const annotations = lastMessage!.annotations as Record<string, unknown[]>;
 expect(annotations['@freezed']).toHaveLength(0);
 expect(annotations['@JsonSerializable']).toHaveLength(0);
 });
});
