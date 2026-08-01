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
  params: string[];
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

  const routeConstants = resolveRouteConstants(root, libDir, routerContent);
  const lines = routerContent.split('\n');
  const routes = parseRouteTree(lines, routerFile, routeConstants);
  post({ type: 'routes', routes, file: routerFile });
}

function resolveRouteConstants(root: string, libDir: string, routerContent: string): Map<string, string> {
  const map = new Map<string, string>();
  const importMatch = routerContent.match(/import\s+['"](?:package:[^/]+\/)?(.+routes[^'"]*)['"]/);
  if (!importMatch) return map;

  const routesRelPath = importMatch[1];
  const candidates = [
    path.join(libDir, routesRelPath),
    path.join(libDir, routesRelPath + '.dart'),
    path.join(path.dirname(path.join(libDir, routerContent.includes('navigation') ? 'navigation' : '')), routesRelPath),
  ];

  let routesContent = '';
  for (const c of candidates) {
    if (fs.existsSync(c)) { routesContent = readText(c); break; }
    const withDart = c.endsWith('.dart') ? c : c + '.dart';
    if (fs.existsSync(withDart)) { routesContent = readText(withDart); break; }
  }

  if (!routesContent) {
    const findRoutesFile = (dir: string): void => {
      if (routesContent) return;
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (routesContent) return;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { findRoutesFile(full); }
        else if (/routes?\.dart$/i.test(entry.name)) {
          const content = readText(full);
          if (content.includes('static') && content.includes('const')) { routesContent = content; }
        }
      }
    };
    findRoutesFile(libDir);
  }

  if (!routesContent) return map;
  const constRe = /static\s+const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = constRe.exec(routesContent)) !== null) {
    map.set(m[1], m[2]);
  }
  return map;
}

function parseRouteTree(lines: string[], file: string, constants: Map<string, string>): RouteNode[] {
  const nodes: RouteNode[] = [];
  const routeRe = /(GoRoute|ShellRoute|StatefulShellRoute)\s*(?:\.\w+)?\s*\(/;
  const branchRe = /StatefulShellBranch\s*\(/;
  const pathInlineRe = /path\s*:\s*['"]([^'"]+)['"]/;
  const pathConstRe = /path\s*:\s*(?:AppRoutes\.)?(\w+)/;
  const nameRe = /name\s*:\s*['"]([^'"]+)['"]/;
  const builderRe = /(?:builder|pageBuilder)\s*:\s*\(.*?\)\s*(?:=>|{)\s*(?:const\s+)?(\w+)/;

  const resolvePath = (line: string): string => {
    const inline = line.match(pathInlineRe);
    if (inline) return inline[1];
    const constMatch = line.match(pathConstRe);
    if (constMatch) {
      const resolved = constants.get(constMatch[1]);
      if (resolved) return resolved;
      return `AppRoutes.${constMatch[1]}`;
    }
    return '';
  };

  const parseBlock = (startIdx: number, endLimit: number): { nodes: RouteNode[]; endIdx: number } => {
    const result: RouteNode[] = [];
    let j = startIdx;
    while (j < endLimit) {
      const line = lines[j];
      const m = line.match(routeRe);
      const bm = !m ? line.match(branchRe) : null;
      if (!m && !bm) { j++; continue; }

      const type = m ? m[1] : 'StatefulShellBranch';
      let path = '';
      let name = '';
      let widget = '';
      const lineNum = j + 1;

      let parenDepth = 0;
      let blockEnd = j;
      for (let k = j; k < endLimit; k++) {
        for (const ch of lines[k]) {
          if (ch === '(') parenDepth++;
          if (ch === ')') parenDepth--;
        }
        if (!path) path = resolvePath(lines[k]);
        if (!name) { const nm = lines[k].match(nameRe); if (nm) name = nm[1]; }
        if (!widget) { const wm = lines[k].match(builderRe); if (wm) widget = wm[1]; }
        if (parenDepth <= 0 && k > j) { blockEnd = k; break; }
        if (k === endLimit - 1) blockEnd = k;
      }

      const children: RouteNode[] = [];
      let routesStart = -1;
      let routesEnd = blockEnd;
      for (let k = j; k <= blockEnd; k++) {
        if ((lines[k].includes('routes') || lines[k].includes('branches')) && lines[k].includes('[')) {
          routesStart = k;
          let bd = 0;
          for (let r = k; r <= blockEnd; r++) {
            for (const ch of lines[r]) {
              if (ch === '[') bd++;
              if (ch === ']') bd--;
            }
            if (bd <= 0 && r > k) { routesEnd = r; break; }
          }
          break;
        }
      }

      if (routesStart >= 0) {
        const childResult = parseBlock(routesStart + 1, routesEnd);
        children.push(...childResult.nodes);
      }

      const resolvedPath = path || (type === 'StatefulShellBranch' ? `[branch]` : '/');
      const params = (resolvedPath.match(/:(\w+)/g) || []).map(p => p.substring(1));

      result.push({
        type,
        path: resolvedPath,
        name,
        widget,
        file,
        line: lineNum,
        children,
        params,
      });

      j = blockEnd + 1;
    }
    return { nodes: result, endIdx: j };
  };

  let routesListStart = -1;
  let routesListEnd = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('routes') && lines[i].includes('[') && lines[i].includes('RouteBase')) {
      routesListStart = i;
      let bd = 0;
      for (let k = i; k < lines.length; k++) {
        for (const ch of lines[k]) {
          if (ch === '[') bd++;
          if (ch === ']') bd--;
        }
        if (bd <= 0 && k > i) { routesListEnd = k; break; }
      }
      break;
    }
  }

  if (routesListStart >= 0) {
    const result = parseBlock(routesListStart + 1, routesListEnd);
    nodes.push(...result.nodes);
  } else {
    const result = parseBlock(0, lines.length);
    nodes.push(...result.nodes);
  }

  return nodes;
}
