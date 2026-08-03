const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

const { iconsJs } = require(path.join(outDir, 'shared', 'icons'));
const { permCatalogJs } = require(path.join(outDir, 'tabs', 'platform', 'permCatalog'));
const { shellRuntimeJs } = require(path.join(outDir, 'webview', 'shell-runtime'));
const { platformJs } = require(path.join(outDir, 'tabs', 'platform', 'view'));
const { envJs } = require(path.join(outDir, 'tabs', 'env', 'view'));
const { toolsJs } = require(path.join(outDir, 'tabs', 'tools', 'view'));
const { manageJs } = require(path.join(outDir, 'tabs', 'manage', 'view'));
const { pubspecJs } = require(path.join(outDir, 'tabs', 'pubspec', 'view'));
const { lintJs } = require(path.join(outDir, 'tabs', 'lint', 'view'));
const { statusJs } = require(path.join(outDir, 'tabs', 'status', 'view'));
const { routerJs } = require(path.join(outDir, 'tabs', 'router', 'view'));
const { codegenJs } = require(path.join(outDir, 'tabs', 'codegen', 'view'));

let storageJs = '';
try { storageJs = require(path.join(outDir, 'tabs', 'storage', 'view')).storageJs || ''; } catch { /* optional */ }

const fragments = [
  iconsJs,
  'function fmtB(b){if(b<1024)return b+"B";if(b<1048576)return(b/1024).toFixed(1)+"KB";if(b<1073741824)return(b/1048576).toFixed(1)+"MB";return(b/1073741824).toFixed(1)+"GB";}',
  'function E(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML;}',
  permCatalogJs,
  shellRuntimeJs,
  platformJs,
  envJs,
  toolsJs,
  manageJs,
  pubspecJs,
  lintJs,
  statusJs,
  routerJs,
  codegenJs,
  storageJs,
  'try{initPubspec();}catch(e){console.error("initPubspec:",e);}',
  'try{initTools();}catch(e){console.error("initTools:",e);}',
  'V.postMessage({type:"loadData"});',
];

const fullJs = fragments.join('\n');

const webviewDir = path.join(outDir, 'webview');
if (!fs.existsSync(webviewDir)) fs.mkdirSync(webviewDir, { recursive: true });

const min = esbuild.transformSync(fullJs, { minify: true, target: 'es2020' });
fs.writeFileSync(path.join(webviewDir, 'main.js'), min.code);

try {
  new Function(fullJs);
  console.log('webview JS syntax OK (' + fullJs.length + ' chars)');
} catch (e) {
  console.error('FAIL: webview JS syntax error:', e.message);
  process.exit(1);
}
