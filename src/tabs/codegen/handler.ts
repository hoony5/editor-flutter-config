import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import * as vscode from 'vscode';
import { readText } from '../../shared/fileUtils';
import { trackTerminal } from '../../shared/terminals';
import type { PostFn } from '../../types';

interface AnnotationHit {
  file: string;
  line: number;
  annotation: string;
  className: string;
}

interface CodegenStatus {
  annotations: Record<string, AnnotationHit[]>;
  generatedFiles: { pattern: string; count: number }[];
  missing: { file: string; expected: string }[];
  buildYaml: Record<string, unknown> | null;
  lastBuild: string | null;
}

const ANNOTATION_PATTERNS: { key: string; regex: RegExp; genExt: string }[] = [
  { key: '@freezed', regex: /@freezed|@Freezed\(/, genExt: '.freezed.dart' },
  { key: '@riverpod', regex: /@riverpod|@Riverpod\(/, genExt: '.g.dart' },
  { key: '@RestApi', regex: /@RestApi\(/, genExt: '.g.dart' },
  { key: '@JsonSerializable', regex: /@JsonSerializable\(/, genExt: '.g.dart' },
  { key: '@immutable', regex: /@immutable/, genExt: '' },
  { key: '@injectable', regex: /@injectable|@Injectable\(|@singleton|@Singleton\(|@lazySingleton|@LazySingleton\(/, genExt: '.config.dart' },
];

export function scanCodegenStatus(root: string, post: PostFn): void {
  const libDir = path.join(root, 'lib');
  const annotations: Record<string, AnnotationHit[]> = {};
  const missing: { file: string; expected: string }[] = [];

  for (const p of ANNOTATION_PATTERNS) annotations[p.key] = [];

  if (fs.existsSync(libDir)) {
    const walk = (dir: string): void => {
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'generated') walk(full);
        } else if (entry.name.endsWith('.dart') && !entry.name.endsWith('.g.dart') && !entry.name.endsWith('.freezed.dart') && !entry.name.endsWith('.config.dart')) {
          const content = readText(full);
          const lines = content.split('\n');
          const rel = path.relative(root, full);
          for (let i = 0; i < lines.length; i++) {
            for (const p of ANNOTATION_PATTERNS) {
              if (p.regex.test(lines[i])) {
                const classMatch = lines.slice(i + 1, i + 5).join('\n').match(/(?:class|abstract\s+class|mixin)\s+(\w+)/);
                annotations[p.key].push({ file: rel, line: i + 1, annotation: p.key, className: classMatch ? classMatch[1] : '?' });
                if (p.genExt) {
                  const genFile = full.replace(/\.dart$/, p.genExt);
                  if (!fs.existsSync(genFile)) {
                    missing.push({ file: rel, expected: path.basename(genFile) });
                  }
                }
              }
            }
          }
        }
      }
    };
    walk(libDir);
  }

  const genPatterns = ['*.g.dart', '*.freezed.dart', '*.config.dart', '*.gr.dart'];
  const generatedFiles = genPatterns.map(pattern => {
    let count = 0;
    const countWalk = (dir: string): void => {
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) countWalk(full);
        else {
          const ext = pattern.replace('*', '');
          if (entry.name.endsWith(ext)) count++;
        }
      }
    };
    if (fs.existsSync(libDir)) countWalk(libDir);
    return { pattern, count };
  });

  const buildYamlPath = path.join(root, 'build.yaml');
  let buildYaml: Record<string, unknown> | null = null;
  if (fs.existsSync(buildYamlPath)) {
    try { buildYaml = yaml.parse(readText(buildYamlPath)); } catch { /* parse error */ }
  }

  let lastBuild: string | null = null;
  const dartToolBuild = path.join(root, '.dart_tool', 'build');
  if (fs.existsSync(dartToolBuild)) {
    try {
      const stat = fs.statSync(dartToolBuild);
      lastBuild = stat.mtime.toISOString();
    } catch { /* stat error */ }
  }

  post({ type: 'codegenStatus', annotations, generatedFiles, missing, buildYaml, lastBuild });
}

export function runBuildRunner(root: string, mode: string, post: PostFn): void {
  const cmds: Record<string, string> = {
    build: './tool/bin/dartw run build_runner build --delete-conflicting-outputs',
    watch: './tool/bin/dartw run build_runner watch --delete-conflicting-outputs',
    clean: './tool/bin/dartw run build_runner clean',
  };
  const cmd = cmds[mode];
  if (!cmd) return;
  const terminal = vscode.window.createTerminal({ name: `Build Runner (${mode})`, cwd: root });
  trackTerminal(terminal);
  terminal.show();
  terminal.sendText(cmd);
}

export function runBuildFilter(root: string, file: string): void {
  const safe = file.replace(/[^a-zA-Z0-9_./-]/g, '');
  const terminal = vscode.window.createTerminal({ name: 'Build Runner (filter)', cwd: root });
  trackTerminal(terminal);
  terminal.show();
  terminal.sendText(`./tool/bin/dartw run build_runner build --delete-conflicting-outputs --build-filter="${safe}"`);
}

export function saveBuildYaml(root: string, post: PostFn, content: string): void {
  const filePath = path.join(root, 'build.yaml');
  try {
    yaml.parse(content);
  } catch (e: unknown) {
    post({ type: 'buildYamlError', error: `YAML parse error: ${(e as Error).message}` });
    return;
  }
  fs.writeFileSync(filePath, content);
  post({ type: 'buildYamlSaved' });
  scanCodegenStatus(root, post);
}
