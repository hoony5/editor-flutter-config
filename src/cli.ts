#!/usr/bin/env node
import * as path from 'path';

import { sendPlatformConfig } from './tabs/platform/handler';
import { scanEnvFiles, diffEnvFiles } from './tabs/env/handler';
import { parsePubspecFull } from './tabs/pubspec/handler';
import { scanRoutes } from './tabs/router/handler';
import { getChecklist } from './tabs/manage/handler';
import { scanToolEntries } from './tabs/tools/handler';
import { readManifest } from './shared/execUtils';
import { readMetrics } from './shared/metrics';
import { scanCodegenStatus } from './tabs/codegen/handler';
import { runDoctor, diffBranches } from './tabs/doctor/handler';
import type { PostFn } from './types';

function collect(): { post: PostFn; data: () => unknown } {
  let captured: unknown = null;
  return { post: (msg: unknown) => { captured = msg; }, data: () => captured };
}

function out(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

const args = process.argv.slice(2);
const cmd = args[0];
const rootIdx = args.indexOf('--root');
const root = rootIdx !== -1 && args[rootIdx + 1] ? path.resolve(args[rootIdx + 1]) : process.cwd();

const HELP = `fat - Flutter App Tools CLI

Usage: fat <command> [options]

Commands:
  snapshot          Full project snapshot
  platform          Platform configuration & permissions
  env               List env/config files
  env-diff <a> <b>  Diff two env files
  deps              Dependencies & dev dependencies
  assets            Asset declarations
  routes            GoRouter route tree
  checklist         Release readiness checklist
  codegen           Code generation status (annotations, missing files)
  doctor            Diagnose common project misconfigurations
  diff [branch]     Compare platform configs between git branches (default: main)
  tools             Available tool scripts
  metrics           Build size & performance history

Options:
  --root <dir>      Project root (default: cwd)
  --help            Show this help
`;

if (!cmd || cmd === '--help' || cmd === '-h') { console.log(HELP); process.exit(0); }

switch (cmd) {
  case 'snapshot': {
    const c1 = collect(); sendPlatformConfig(root, c1.post);
    const pubspec = parsePubspecFull(root);
    const envFiles = scanEnvFiles(root);
    const c2 = collect(); scanRoutes(root, c2.post);
    const c3 = collect(); getChecklist(root, c3.post);
    const tools = scanToolEntries(root);
    const manifest = readManifest(root);
    const metrics = readMetrics(root);
    out({
      platform: c1.data(),
      pubspec,
      envFiles,
      routes: c2.data(),
      checklist: c3.data(),
      tools: tools.map(t => ({ group: t.group, file: t.file, lang: t.lang, available: t.available })),
      manifest: manifest ? { categories: manifest.categories, tools: manifest.tools.map(t => t.id) } : null,
      metrics,
    });
    break;
  }
  case 'platform': {
    const c = collect(); sendPlatformConfig(root, c.post);
    out(c.data());
    break;
  }
  case 'env': {
    out({ envFiles: scanEnvFiles(root) });
    break;
  }
  case 'env-diff': {
    const fileA = args[1]; const fileB = args[2];
    if (!fileA || !fileB) { console.error('Usage: fat env-diff <fileA> <fileB>'); process.exit(1); }
    const c = collect(); diffEnvFiles(root, c.post, fileA, fileB);
    out(c.data());
    break;
  }
  case 'deps': {
    const p = parsePubspecFull(root);
    out({ name: p.name, version: p.version, deps: p.deps, sdkConstraint: p.sdkConstraint, platforms: p.platforms, parseError: p.parseError });
    break;
  }
  case 'assets': {
    const p = parsePubspecFull(root);
    out({ assets: p.assets, parseError: p.parseError });
    break;
  }
  case 'routes': {
    const c = collect(); scanRoutes(root, c.post);
    out(c.data());
    break;
  }
  case 'checklist': {
    const c = collect(); getChecklist(root, c.post);
    out(c.data());
    break;
  }
  case 'tools': {
    const tools = scanToolEntries(root);
    out({ tools: tools.map(t => ({ group: t.group, file: t.file, lang: t.lang, runtime: t.runtime, available: t.available })) });
    break;
  }
  case 'metrics': {
    out(readMetrics(root));
    break;
  }
  case 'codegen': {
    const c = collect(); scanCodegenStatus(root, c.post);
    out(c.data());
    break;
  }
  case 'doctor': {
    const c = collect(); runDoctor(root, c.post);
    out(c.data());
    break;
  }
  case 'diff': {
    const branch = args[1];
    const c = collect(); diffBranches(root, c.post, branch);
    out(c.data());
    break;
  }
  default:
    console.error(`Unknown command: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
}
