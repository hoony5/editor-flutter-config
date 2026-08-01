import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as yaml from 'yaml';
import { readText } from '../../shared/fileUtils';
import { getFlutterCmd, getDartCmd } from '../../shared/execUtils';
import { scanPermissionUsage } from '../platform/handler';
import { scanCodegenStatus } from '../codegen/handler';
import { scanEnvFiles, diffEnvFiles } from '../env/handler';
import type { PostFn } from '../../types';

interface DoctorCheck {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

function collectPost(): { post: PostFn; data: () => unknown } {
  let captured: unknown = null;
  return { post: (msg: unknown) => { captured = msg; }, data: () => captured };
}

export function runDoctor(root: string, post: PostFn): void {
  const checks: DoctorCheck[] = [];

  // 1. Missing permissions
  try {
    const usage = scanPermissionUsage(root);
    const missing = usage.filter(u => u.used && !u.configured);
    if (missing.length === 0) {
      checks.push({ id: 'permissions', label: 'Platform permissions', status: 'ok', detail: 'All used permissions are configured' });
    } else {
      const items = missing.map(m => `${m.label} (${m.platform}: ${m.perm})`).join('; ');
      checks.push({ id: 'permissions', label: 'Platform permissions', status: 'warn', detail: `${missing.length} permission(s) used in code but not configured: ${items}` });
    }
  } catch (e: unknown) {
    checks.push({ id: 'permissions', label: 'Platform permissions', status: 'fail', detail: `Scan failed: ${(e as Error).message}` });
  }

  // 2. Stale codegen
  try {
    const c = collectPost();
    scanCodegenStatus(root, c.post);
    const result = c.data() as { missing?: { file: string; expected: string }[] } | null;
    const missing = result?.missing ?? [];
    if (missing.length === 0) {
      checks.push({ id: 'codegen', label: 'Code generation', status: 'ok', detail: 'All annotated classes have generated files' });
    } else {
      const items = missing.map(m => `${m.file} → ${m.expected}`).join('; ');
      checks.push({ id: 'codegen', label: 'Code generation', status: 'warn', detail: `${missing.length} missing generated file(s): ${items}` });
    }
  } catch (e: unknown) {
    checks.push({ id: 'codegen', label: 'Code generation', status: 'fail', detail: `Scan failed: ${(e as Error).message}` });
  }

  // 3. Env mismatches
  try {
    const envFiles = scanEnvFiles(root).filter(f => f.endsWith('.json'));
    if (envFiles.length < 2) {
      checks.push({ id: 'env', label: 'Env file consistency', status: 'ok', detail: envFiles.length === 0 ? 'No JSON env files found' : 'Only one JSON env file — nothing to compare' });
    } else {
      const mismatches: string[] = [];
      for (let i = 0; i < envFiles.length; i++) {
        for (let j = i + 1; j < envFiles.length; j++) {
          const c = collectPost();
          diffEnvFiles(root, c.post, envFiles[i], envFiles[j]);
          const result = c.data() as { rows?: { key: string; inA: boolean; inB: boolean; same: boolean }[] } | null;
          const rows = result?.rows ?? [];
          const diff = rows.filter(r => !r.same);
          for (const r of diff) {
            const where = !r.inA ? `missing in ${envFiles[j]}` : !r.inB ? `missing in ${envFiles[i]}` : `value differs`;
            mismatches.push(`${r.key} (${envFiles[i]} ↔ ${envFiles[j]}: ${where})`);
          }
        }
      }
      if (mismatches.length === 0) {
        checks.push({ id: 'env', label: 'Env file consistency', status: 'ok', detail: `All ${envFiles.length} JSON env files have matching keys` });
      } else {
        checks.push({ id: 'env', label: 'Env file consistency', status: 'warn', detail: `${mismatches.length} key mismatch(es): ${mismatches.join('; ')}` });
      }
    }
  } catch (e: unknown) {
    checks.push({ id: 'env', label: 'Env file consistency', status: 'fail', detail: `Scan failed: ${(e as Error).message}` });
  }

  // 4. Missing platform files
  const platformFiles = [
    'ios/Runner/Info.plist',
    'android/app/src/main/AndroidManifest.xml',
    'macos/Runner/DebugProfile.entitlements',
  ];
  const missingPlatform = platformFiles.filter(f => !fs.existsSync(path.join(root, f)));
  if (missingPlatform.length === 0) {
    checks.push({ id: 'platform-files', label: 'Platform files', status: 'ok', detail: 'All platform config files present' });
  } else {
    checks.push({ id: 'platform-files', label: 'Platform files', status: 'warn', detail: `Missing: ${missingPlatform.join(', ')}` });
  }

  // 5. Flutter/Dart availability
  const flutterCmd = getFlutterCmd(root);
  const dartCmd = getDartCmd(root);
  const toolResults: string[] = [];
  let toolFail = false;
  for (const [name, cmd] of [['flutter', flutterCmd], ['dart', dartCmd]] as const) {
    try {
      execSync(`${cmd} --version`, { cwd: root, encoding: 'utf-8', timeout: 15000, stdio: 'pipe' });
      toolResults.push(`${name}: available`);
    } catch {
      toolResults.push(`${name}: NOT FOUND (${cmd})`);
      toolFail = true;
    }
  }
  checks.push({ id: 'toolchain', label: 'Flutter/Dart availability', status: toolFail ? 'fail' : 'ok', detail: toolResults.join('; ') });

  // 6. pubspec.yaml validity
  const pubspecPath = path.join(root, 'pubspec.yaml');
  if (!fs.existsSync(pubspecPath)) {
    checks.push({ id: 'pubspec', label: 'pubspec.yaml', status: 'fail', detail: 'pubspec.yaml not found' });
  } else {
    try {
      const parsed = yaml.parse(readText(pubspecPath));
      if (parsed && typeof parsed === 'object' && parsed.name) {
        checks.push({ id: 'pubspec', label: 'pubspec.yaml', status: 'ok', detail: `Valid — package "${parsed.name}"` });
      } else {
        checks.push({ id: 'pubspec', label: 'pubspec.yaml', status: 'warn', detail: 'Parses but missing "name" field' });
      }
    } catch (e: unknown) {
      checks.push({ id: 'pubspec', label: 'pubspec.yaml', status: 'fail', detail: `YAML parse error: ${(e as Error).message}` });
    }
  }

  post({ type: 'doctor', checks });
}

const BRANCH_DIFF_FILES = [
  'ios/Runner/Info.plist',
  'android/app/src/main/AndroidManifest.xml',
  'macos/Runner/DebugProfile.entitlements',
];

export function diffBranches(root: string, post: PostFn, branch?: string): void {
  const target = (branch || 'main').replace(/[^a-zA-Z0-9_./-]/g, '');

  let currentBranch: string;
  try {
    currentBranch = execSync('git branch --show-current', { cwd: root, encoding: 'utf-8', timeout: 5000 }).trim();
  } catch {
    currentBranch = '(unknown)';
  }

  const diffs: { file: string; diff: string }[] = [];
  for (const file of BRANCH_DIFF_FILES) {
    if (!fs.existsSync(path.join(root, file))) {
      diffs.push({ file, diff: `(file not found: ${file})` });
      continue;
    }
    try {
      const diff = execSync(`git diff ${target} -- ${file}`, { cwd: root, encoding: 'utf-8', timeout: 10000 }).trim();
      diffs.push({ file, diff: diff || '(no differences)' });
    } catch (e: unknown) {
      diffs.push({ file, diff: `(git diff failed: ${(e as Error).message})` });
    }
  }

  post({ type: 'branchDiff', branch: target, currentBranch, diffs });
}
