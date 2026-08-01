import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanRoutes } from '../src/tabs/router/handler';

let tmpDir: string;
let lastMessage: Record<string, unknown> | null = null;

const post = (msg: unknown): void => {
 lastMessage = msg as Record<string, unknown>;
};

beforeAll(() => {
 tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flext-router-'));
});

afterAll(() => {
 fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('scanRoutes', () => {
 it('parses GoRouter configuration with path, name, and widget', () => {
 const dir = path.join(tmpDir, 'basic-router');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'router.dart'), [
 "import 'package:go_router/go_router.dart';",
 '',
 'final router = GoRouter(',
 '  routes: [',
 "    GoRoute(",
 "      path: '/',",
 "      name: 'home',",
 '      builder: (context, state) => const HomePage(),',
 '    ),',
 "    GoRoute(",
 "      path: '/settings',",
 "      name: 'settings',",
 '      builder: (context, state) => const SettingsPage(),',
 '    ),',
 '  ],',
 ');',
 ].join('\n'));

 lastMessage = null;
 scanRoutes(dir, post);

 expect(lastMessage).not.toBeNull();
 expect(lastMessage!.type).toBe('routes');
 expect(lastMessage!.file).toBe(path.join('lib', 'router.dart'));

 const routes = lastMessage!.routes as { path: string; name: string; widget: string; type: string }[];
 expect(routes.length).toBeGreaterThanOrEqual(2);

 const home = routes.find(r => r.name === 'home');
 expect(home).toBeDefined();
 expect(home!.path).toBe('/');
 expect(home!.widget).toBe('HomePage');
 expect(home!.type).toBe('GoRoute');

 const settings = routes.find(r => r.name === 'settings');
 expect(settings).toBeDefined();
 expect(settings!.path).toBe('/settings');
 expect(settings!.widget).toBe('SettingsPage');
 });

 it('detects ShellRoute type', () => {
 const dir = path.join(tmpDir, 'shell-router');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'app_router.dart'), [
 "import 'package:go_router/go_router.dart';",
 '',
 'final router = GoRouter(',
 '  routes: [',
 '    ShellRoute(',
 "      path: '/dashboard',",
 '      builder: (context, state, child) => DashboardShell(child: child),',
 '      routes: [',
 "        GoRoute(",
 "          path: 'overview',",
 "          name: 'overview',",
 '          builder: (context, state) => const OverviewPage(),',
 '        ),',
 '      ],',
 '    ),',
 '  ],',
 ');',
 ].join('\n'));

 lastMessage = null;
 scanRoutes(dir, post);

 const routes = lastMessage!.routes as { type: string; path: string }[];
 expect(routes.length).toBeGreaterThanOrEqual(1);
 const shell = routes.find(r => r.type === 'ShellRoute');
 expect(shell).toBeDefined();
 expect(shell!.path).toBe('/dashboard');
 });

 it('returns empty routes when no GoRouter file exists', () => {
 const dir = path.join(tmpDir, 'no-router');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'main.dart'), [
 'void main() {',
 '  runApp(MyApp());',
 '}',
 ].join('\n'));

 lastMessage = null;
 scanRoutes(dir, post);

 expect(lastMessage!.type).toBe('routes');
 expect(lastMessage!.routes).toHaveLength(0);
 expect(lastMessage!.file).toBe('');
 });

 it('returns empty routes when lib directory is missing', () => {
 const dir = path.join(tmpDir, 'no-lib');
 fs.mkdirSync(dir, { recursive: true });

 lastMessage = null;
 scanRoutes(dir, post);

 expect(lastMessage!.type).toBe('routes');
 expect(lastMessage!.routes).toHaveLength(0);
 });

 it('finds router file by name pattern when GoRouter keyword is absent', () => {
 const dir = path.join(tmpDir, 'name-match');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 // File named "routes.dart" with GoRoute but no "GoRouter" keyword
 fs.writeFileSync(path.join(libDir, 'routes.dart'), [
 'final appRoutes = [',
 "  GoRoute(",
 "    path: '/profile',",
 "    name: 'profile',",
 '    builder: (context, state) => const ProfilePage(),',
 '  ),',
 '];',
 ].join('\n'));

 lastMessage = null;
 scanRoutes(dir, post);

 const routes = lastMessage!.routes as { name: string; path: string }[];
 expect(routes.length).toBeGreaterThanOrEqual(1);
 const profile = routes.find(r => r.name === 'profile');
 expect(profile).toBeDefined();
 expect(profile!.path).toBe('/profile');
 });

 it('extracts line numbers for routes', () => {
 const dir = path.join(tmpDir, 'line-numbers');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 fs.writeFileSync(path.join(libDir, 'router.dart'), [
 '// line 1',
 '// line 2',
 'final router = GoRouter(',
 '  routes: [',
 "    GoRoute(",
 "      path: '/a',",
 "      name: 'a',",
 '      builder: (context, state) => const APage(),',
 '    ),',
 '  ],',
 ');',
 ].join('\n'));

 lastMessage = null;
 scanRoutes(dir, post);

 const routes = lastMessage!.routes as { line: number; name: string }[];
 expect(routes.length).toBeGreaterThanOrEqual(1);
 const routeA = routes.find(r => r.name === 'a');
 expect(routeA).toBeDefined();
 expect(routeA!.line).toBe(5); // GoRoute( is on line 5
 });

 it('prefers file with higher GoRoute count', () => {
 const dir = path.join(tmpDir, 'score-pick');
 const libDir = path.join(dir, 'lib');
 fs.mkdirSync(libDir, { recursive: true });

 // File with 1 GoRoute
 fs.writeFileSync(path.join(libDir, 'small_router.dart'), [
 'final smallRouter = GoRouter(',
 '  routes: [',
 '    GoRoute(',
 "      path: '/one',",
 "      name: 'one',",
 '      builder: (c, s) => const OnePage(),',
 '    ),',
 '  ],',
 ');',
 ].join('\n'));

 // File with 3 GoRoutes — should be preferred
 fs.writeFileSync(path.join(libDir, 'big_router.dart'), [
 'final bigRouter = GoRouter(',
 '  routes: [',
 '    GoRoute(',
 "      path: '/a',",
 "      name: 'a',",
 '      builder: (c, s) => const APage(),',
 '    ),',
 '    GoRoute(',
 "      path: '/b',",
 "      name: 'b',",
 '      builder: (c, s) => const BPage(),',
 '    ),',
 '    GoRoute(',
 "      path: '/c',",
 "      name: 'c',",
 '      builder: (c, s) => const CPage(),',
 '    ),',
 '  ],',
 ');',
 ].join('\n'));

 lastMessage = null;
 scanRoutes(dir, post);

 expect(lastMessage!.file).toBe(path.join('lib', 'big_router.dart'));
 const routes = lastMessage!.routes as { name: string }[];
 expect(routes.length).toBeGreaterThanOrEqual(3);
 });
});
