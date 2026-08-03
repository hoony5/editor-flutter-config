const esbuild = require('esbuild');
const path = require('path');

const root = path.join(__dirname, '..');

const common = {
  bundle: true,
  platform: 'node',
  minify: true,
  sourcemap: false,
  logLevel: 'silent',
};

esbuild.buildSync({
  ...common,
  entryPoints: [path.join(root, 'src', 'extension.ts')],
  outfile: path.join(root, 'out', 'extension.js'),
  external: ['vscode'],
});

esbuild.buildSync({
  ...common,
  entryPoints: [path.join(root, 'src', 'cli.ts')],
  outfile: path.join(root, 'out', 'cli.js'),
  alias: { vscode: path.join(root, 'scripts', 'vscode-stub.js') },
});

console.log('bundle OK (extension.js + cli.js)');
