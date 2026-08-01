import * as fs from 'fs';
import * as path from 'path';
import { readText } from '../../shared/fileUtils';
import type { PostFn } from '../../types';

export interface RouteNode {
  type: string;
  path: string;
  name: string;
  widget: string;
  file: string;
  line: number;
  children: RouteNode[];
}

export function scanRoutes(root: string, post: PostFn): void {
  const libDir = path.join(root, 'lib');
  if (!fs.existsSync(libDir)) { post({ type: 'routes', routes: [], file: '' }); return; }

  let routerFile = '';
  let routerContent = '';
  let bestScore = 0;

  const scoreFile = (content: string): number => {
    let score = 0;
    const re = /GoRoute\s*\(/g;
    while (re.exec(content)) score++;
    if (content.includes('ShellRoute')) score += 2;
    if (content.includes('StatefulShellRoute')) score += 3;
    return score;
  };

  const findRouter = (dir: string): void => {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'generated' || entry.name === 'build') continue;
        findRouter(full);
      } else if (entry.name.endsWith('.dart')) {
        const content = readText(full);
        if (!content.includes('GoRouter')) continue;
        const score = scoreFile(content);
        if (score > bestScore) {
          bestScore = score;
          routerFile = path.relative(root, full);
          routerContent = content;
        }
      }
    }
  };

  findRouter(libDir);

  if (!routerContent) {
    const findByName = (dir: string): void => {
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name.startsWith('.') || entry.name === 'generated' || entry.name === 'build') continue;
          findByName(full);
        } else if (/router|route/i.test(entry.name) && entry.name.endsWith('.dart')) {
          const content = readText(full);
          if (content.includes('GoRoute') || content.includes('routes')) {
            const score = scoreFile(content);
            if (score > bestScore) {
              bestScore = score;
              routerFile = path.relative(root, full);
              routerContent = content;
            }
          }
        }
      }
    };
    findByName(libDir);
  }
  if (!routerContent) { post({ type: 'routes', routes: [], file: '' }); return; }

  const lines = routerContent.split('\n');
  const routes = parseRouteTree(lines, routerFile);
  post({ type: 'routes', routes, file: routerFile });
}

function parseRouteTree(lines: string[], file: string): RouteNode[] {
  const nodes: RouteNode[] = [];
  const routeRe = /(GoRoute|ShellRoute|StatefulShellRoute)\s*\(/;
  const pathRe = /path\s*:\s*['"]([^'"]+)['"]/;
  const nameRe = /name\s*:\s*['"]([^'"]+)['"]/;
  const builderRe = /(?:builder|pageBuilder)\s*:\s*\(.*?\)\s*(?:=>|{)\s*(?:const\s+)?(\w+)/;
  const parseBlock = (startIdx: number, depth: number): { node: RouteNode; endIdx: number } | null => {
    for (let j = startIdx; j < lines.length; j++) {
      const line = lines[j];
      const m = line.match(routeRe);
      if (!m) continue;

      const type = m[1];
      let path = '';
      let name = '';
      let widget = '';
      let lineNum = j + 1;

      for (let k = j; k < Math.min(j + 15, lines.length); k++) {
        const l = lines[k];
        if (!path) { const pm = l.match(pathRe); if (pm) path = pm[1]; }
        if (!name) { const nm = l.match(nameRe); if (nm) name = nm[1]; }
        if (!widget) { const wm = l.match(builderRe); if (wm) widget = wm[1]; }
        if (path && name && widget) break;
        if (l.includes('routes') && l.includes('[')) break;
      }

      const children: RouteNode[] = [];
      let endIdx = j;
      let bracketDepth = 0;
      let inRoutes = false;

      for (let k = j; k < lines.length; k++) {
        const l = lines[k];
        if (l.includes('routes') && l.includes('[')) { inRoutes = true; bracketDepth = 0; }
        if (inRoutes) {
          for (const ch of l) {
            if (ch === '[') bracketDepth++;
            if (ch === ']') bracketDepth--;
          }
          if (bracketDepth <= 0 && inRoutes && k > j) {
            const childResult = parseBlock(j + 1, depth + 1);
            if (childResult) {
              children.push(childResult.node);
              endIdx = childResult.endIdx;
            }
            break;
          }
        }
        if (k > j + 50) break;
      }

      return {
        node: { type, path: path || '/', name, widget, file, line: lineNum, children },
        endIdx: Math.max(endIdx, j + 1),
      };
    }
    return null;
  };

  let idx = 0;
  while (idx < lines.length) {
    const result = parseBlock(idx, 0);
    if (!result) break;
    nodes.push(result.node);
    idx = result.endIdx + 1;
  }

  return nodes;
}
