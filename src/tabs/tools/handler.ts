import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as vscode from 'vscode';
import { readManifest } from '../../shared/execUtils';
import { readText } from '../../shared/fileUtils';
import { sanitizeShellArg } from '../../shared/security';
import { trackTerminal } from '../../shared/terminals';

const RUNTIMES: Record<string, { lang: string; cmd: string }> = {
  '.py': { lang: 'Python', cmd: 'python3' }, '.js': { lang: 'JavaScript', cmd: 'node' },
  '.mjs': { lang: 'JavaScript', cmd: 'node' }, '.ts': { lang: 'TypeScript', cmd: 'npx' },
  '.tsx': { lang: 'TypeScript', cmd: 'npx' }, '.dart': { lang: 'Dart', cmd: 'dart' },
  '.go': { lang: 'Go', cmd: 'go' }, '.rs': { lang: 'Rust', cmd: 'rustc' },
  '.sh': { lang: 'Shell', cmd: 'bash' }, '.bash': { lang: 'Shell', cmd: 'bash' },
  '.zsh': { lang: 'Shell', cmd: 'zsh' }, '.rb': { lang: 'Ruby', cmd: 'ruby' },
  '.php': { lang: 'PHP', cmd: 'php' }, '.lua': { lang: 'Lua', cmd: 'lua' },
  '.pl': { lang: 'Perl', cmd: 'perl' }, '.ps1': { lang: 'PowerShell', cmd: 'pwsh' },
  '.c': { lang: 'C', cmd: 'cc' }, '.cpp': { lang: 'C++', cmd: 'c++' },
  '.cc': { lang: 'C++', cmd: 'c++' }, '.java': { lang: 'Java', cmd: 'java' },
  '.cs': { lang: 'C#', cmd: 'dotnet' }, '.swift': { lang: 'Swift', cmd: 'swift' },
  '.kt': { lang: 'Kotlin', cmd: 'kotlin' }, '.r': { lang: 'R', cmd: 'Rscript' },
  '.R': { lang: 'R', cmd: 'Rscript' }, '.zig': { lang: 'Zig', cmd: 'zig' },
};

const EXCLUDE = /(_test\.|\.g\.|\.freezed\.|node_modules|\.d\.ts$)/;

export interface ScannedTool {
  group: string; file: string; ext: string;
  lang: string; runtime: string; available: boolean; readme: string;
  readmeContent: string;
}

export function scanToolEntries(root: string): ScannedTool[] {
  const toolDir = path.join(root, 'tool');
  if (!fs.existsSync(toolDir)) return [];
  const results: ScannedTool[] = [];
  const runtimeCache = new Map<string, boolean>();

  const checkRuntime = (cmd: string): boolean => {
    if (runtimeCache.has(cmd)) return runtimeCache.get(cmd)!;
    try {
      execSync(`command -v ${cmd}`, { encoding: 'utf-8', timeout: 800, stdio: ['pipe', 'pipe', 'pipe'] });
      runtimeCache.set(cmd, true);
    } catch { runtimeCache.set(cmd, false); }
    return runtimeCache.get(cmd)!;
  };

  try {
    const groups = fs.readdirSync(toolDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'bin');
    for (const group of groups) {
      const groupPath = path.join(toolDir, group.name);
      const files = fs.readdirSync(groupPath).filter(f => RUNTIMES[path.extname(f)] && !EXCLUDE.test(f));
      const hasReadme = fs.existsSync(path.join(groupPath, 'README.md')) ? `tool/${group.name}/README.md` : '';
      let readmeContent = '';
      if (hasReadme) {
        try { readmeContent = readText(path.join(groupPath, 'README.md')).split('\n').slice(0, 25).join('\n'); } catch { /* unreadable */ }
      }
      for (const file of files) {
        const ext = path.extname(file);
        const rt = RUNTIMES[ext];
        results.push({ group: group.name, file: `${group.name}/${file}`, ext, lang: rt.lang, runtime: rt.cmd, available: checkRuntime(rt.cmd), readme: hasReadme, readmeContent });
      }
    }
  } catch { /* tool dir unreadable */ }
  return results.sort((a, b) => a.group.localeCompare(b.group) || a.file.localeCompare(b.file));
}

export function getToolCommand(file: string, runtime: string): string {
  const safeFile = file.replace(/[;|&$`()[\]{}<>!#~]/g, '');
  const q = `tool/${safeFile}`;
  const ext = path.extname(safeFile);
  const cmds: Record<string, string> = {
    '.sh': `bash "${q}"`, '.bash': `bash "${q}"`, '.zsh': `zsh "${q}"`,
    '.dart': `./tool/bin/dartw run "${q}"`,
    '.py': `python3 "${q}"`, '.js': `node "${q}"`, '.mjs': `node "${q}"`,
    '.ts': `npx tsx "${q}"`, '.tsx': `npx tsx "${q}"`,
    '.go': `go run "${q}"`, '.rb': `ruby "${q}"`,
    '.php': `php "${q}"`, '.lua': `lua "${q}"`,
    '.pl': `perl "${q}"`, '.ps1': `pwsh "${q}"`,
    '.rs': `rustc "${q}" -o /tmp/_rs_tool_${Date.now()} && /tmp/_rs_tool_${Date.now()}`,
    '.c': `cc "${q}" -o /tmp/_c_tool_${Date.now()} && /tmp/_c_tool_${Date.now()}`,
    '.cpp': `c++ "${q}" -o /tmp/_cpp_tool_${Date.now()} && /tmp/_cpp_tool_${Date.now()}`,
    '.cc': `c++ "${q}" -o /tmp/_cc_tool_${Date.now()} && /tmp/_cc_tool_${Date.now()}`,
    '.java': `java "${q}"`, '.swift': `swift "${q}"`,
    '.kt': `kotlin "${q}"`, '.r': `Rscript "${q}"`, '.R': `Rscript "${q}"`,
    '.zig': `zig run "${q}"`, '.cs': `dotnet-script "${q}"`,
  };
  return cmds[ext] ?? `${runtime.replace(/[^a-zA-Z0-9_-]/g, '')} "${q}"`;
}

export function runScannedTool(root: string, file: string, runtime: string): void {
  const cmd = getToolCommand(file, runtime);
  const name = file.split('/').pop() ?? file;
  const terminal = vscode.window.createTerminal({ name: `Tool: ${name}`, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(cmd);
}

export function runScannedToolLoop(root: string, file: string, runtime: string, intervalSec: number): void {
  const sec = Math.max(1, Math.floor(Number(intervalSec)) || 60);
  const cmd = getToolCommand(file, runtime);
  const name = file.split('/').pop() ?? file;
  const terminal = vscode.window.createTerminal({ name: `Loop: ${name}`, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(`while true; do echo "=== $(date) ==="; ${cmd}; echo "--- next in ${sec}s ---"; sleep ${sec}; done`);
}

export function runTool(root: string, toolId: string, inputs: Record<string, string>): void {
  const manifest = readManifest(root);
  if (!manifest) return;
  const tool = manifest.tools.find(t => t.id === toolId);
  if (!tool) return;
  let cmd = tool.command;
  for (const [k, v] of Object.entries(inputs)) cmd = cmd.replace(`\${${k}}`, sanitizeShellArg(String(v)));
  const terminal = vscode.window.createTerminal({ name: `Tool: ${tool.name}`, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(cmd);
}

export function runToolLoop(root: string, toolId: string, inputs: Record<string, string>, intervalSec: number): void {
  const manifest = readManifest(root);
  if (!manifest) return;
  const tool = manifest.tools.find(t => t.id === toolId);
  if (!tool) return;
  const sec = Math.max(1, Math.floor(Number(intervalSec)) || 60);
  let cmd = tool.command;
  for (const [k, v] of Object.entries(inputs)) cmd = cmd.replace(`\${${k}}`, sanitizeShellArg(String(v)));
  const terminal = vscode.window.createTerminal({ name: `Loop: ${tool.name}`, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(`while true; do echo "=== $(date) ==="; ${cmd}; echo "--- next in ${sec}s ---"; sleep ${sec}; done`);
}

export function runCodegenScript(root: string, file: string): void {
  const safeFile = file.replace(/[^a-zA-Z0-9_./-]/g, '');
  const cmd = path.extname(safeFile) === '.dart' ? `./tool/bin/dartw run ${safeFile}` : `bash ${safeFile}`;
  const name = safeFile.split('/').pop() ?? safeFile;
  const terminal = vscode.window.createTerminal({ name: `Codegen: ${name}`, cwd: root });
  trackTerminal(terminal); terminal.show();
  terminal.sendText(cmd);
}
