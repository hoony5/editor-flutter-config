import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { readManifest } from './shared/execUtils';
import { safePath } from './shared/security';
import { scanToolEntries } from './tabs/tools/handler';
import * as codegenHandler from './tabs/codegen/handler';
import { scanEnvFiles } from './tabs/env/handler';
import { buildHtml } from './webview/shell';
import * as platformHandler from './tabs/platform/handler';
import * as envHandler from './tabs/env/handler';
import * as toolsHandler from './tabs/tools/handler';
import * as manageHandler from './tabs/manage/handler';
import * as pubspecHandler from './tabs/pubspec/handler';
import * as lintHandler from './tabs/lint/handler';
import * as statusHandler from './tabs/status/handler';
import * as routerHandler from './tabs/router/handler';
import * as storageHandler from './tabs/storage/handler';

export class ConfigViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'flutterAppConfig.settingsView';
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly root: string,
  ) {}

  resolveWebviewView(wv: vscode.WebviewView): void {
    this.view = wv;
    wv.webview.options = { enableScripts: true };
    wv.webview.html = buildHtml(wv.webview, this.extensionUri);
    wv.webview.onDidReceiveMessage(async (m) => {
      const post = this.post.bind(this);
      const root = this.root;
      try {
      switch (m.type) {
        case 'loadData':
        case 'refresh':
          this.sendAll();
          break;
        case 'loadTools':
          this.post({ type: 'toolsData', scannedTools: scanToolEntries(this.root) });
          break;
        case 'loadEnv':
          envHandler.sendEnvFile(root, post, m.fileName);
          break;
        case 'loadStatus':
          await statusHandler.sendStatus(root, post);
          break;
        case 'loadPlatform':
          platformHandler.sendPlatformConfig(root, post);
          break;
        case 'loadManage':
          await manageHandler.sendManageInfo(root, post);
          break;
        case 'createEnv':
          envHandler.createEnvFile(root, post, m.fileName);
          this.sendAll();
          break;
        case 'deleteEnv':
          envHandler.deleteEnvFile(root, m.fileName);
          this.sendAll();
          break;
        case 'runAction':
          statusHandler.runAction(root, m.action, m.cmd);
          break;
        case 'runScanned':
          toolsHandler.runScannedTool(root, m.file, m.runtime);
          break;
        case 'runScannedLoop':
          toolsHandler.runScannedToolLoop(root, m.file, m.runtime, m.intervalSec);
          break;
        case 'runCodegen':
          toolsHandler.runCodegenScript(root, m.file);
          break;
        case 'simAction':
          await statusHandler.simAction(root, post, m.action, m.udid);
          break;
        case 'savePlatformEdit':
          await platformHandler.savePlatformEdit(root, post, m.edits);
          break;
        case 'openFile':
          this.openFile(m.file);
          break;
        case 'composeRun':
          envHandler.composeAndRun(root, m.target);
          break;
        case 'promptCreateEnv':
          await envHandler.promptCreateEnv(root);
          this.sendAll();
          break;
        case 'runTool':
          toolsHandler.runTool(root, m.toolId, m.inputs);
          break;
        case 'runToolLoop':
          toolsHandler.runToolLoop(root, m.toolId, m.inputs, m.intervalSec);
          break;
        case 'saveConfig':
          envHandler.saveConfig(root, m.filePath, m.key, m.value);
          this.sendAll();
          break;
        case 'scanAssets':
          manageHandler.sendAssets(root, post);
          break;
        case 'scanUnused':
          manageHandler.sendUnused(root, post);
          break;
        case 'cleanup':
          manageHandler.cleanup(root, post, m.target);
          break;
        case 'readPubspec':
          pubspecHandler.sendPubspec(root, post);
          break;
        case 'writePubspecField':
          pubspecHandler.writePubspecField(root, post, m.field, m.value);
          break;
        case 'saveDeps':
          pubspecHandler.saveDeps(root, post, m.removals, m.additions);
          break;
        case 'readLintRules':
          lintHandler.sendLintRules(root, post);
          break;
        case 'toggleLintRule':
          lintHandler.doToggleLint(root, post, m.rule, m.enabled);
          break;
        case 'scanProcs':
          manageHandler.sendProcs(root, post);
          break;
        case 'killProc':
          manageHandler.killProc(root, post, m.pid);
          break;
        case 'toggleBuildRunner':
          manageHandler.toggleBuildRunner(root, post);
          break;
        case 'runTests':
          manageHandler.runTests(root, m.mode, m.file);
          break;
        case 'scanBuildSizes':
          manageHandler.scanBuildSizes(root, post);
          break;
        case 'recordBuildSize':
          manageHandler.recordBuildSize(root, post, m.platform, m.sizeBytes);
          break;
        case 'runProfile':
          await manageHandler.runProfile(root, post);
          break;
        case 'getPerfBaseline':
          manageHandler.getPerfBaseline(root, post);
          break;
        case 'recordPerf':
          manageHandler.recordPerf(root, post, m.frameTimeMs, m.memoryMb);
          break;
        case 'getChecklist':
          manageHandler.getChecklist(root, post);
          break;
        case 'diffEnv':
          envHandler.diffEnvFiles(root, post, m.fileA, m.fileB);
          break;
        case 'hotReload':
          statusHandler.hotReload(root, m.reloadType);
          break;
        case 'analyzeAssets':
          pubspecHandler.analyzeAssetOptimization(root, post);
          break;
        case 'addAssetPath':
          pubspecHandler.addAssetPath(root, post, m.path);
          break;
        case 'removeAssetPath':
          pubspecHandler.removeAssetPath(root, post, m.path);
          break;
        case 'loadAssetDirs':
          pubspecHandler.loadAssetDirs(root, post);
          break;
        case 'getAssetPreview':
          pubspecHandler.getAssetPreviewData(root, post, m.filePath);
          break;
        case 'assetOptimize':
          pubspecHandler.assetOptimize(root, m.cmd, m.file);
          break;
        case 'scanAssetUsage':
          pubspecHandler.scanAssetUsage(root, post);
          break;
        case 'batchOptimize':
          pubspecHandler.batchOptimize(root, post);
          break;
        case 'runBatchScript': {
          const scriptPath = path.join(root, '.batch_optimize.sh');
          fs.writeFileSync(scriptPath, m.script, { mode: 0o755 });
          const terminal = vscode.window.createTerminal({ name: 'Batch Optimize', cwd: root });
          terminal.show();
          terminal.sendText(`bash .batch_optimize.sh && rm -f .batch_optimize.sh`);
          break;
        }
        case 'scanRoutes':
          routerHandler.scanRoutes(root, post);
          break;
        case 'scanCodegen':
          codegenHandler.scanCodegenStatus(root, post);
          break;
        case 'runBuildRunner':
          codegenHandler.runBuildRunner(root, m.mode, post);
          break;
        case 'runBuildRunnerStream':
          codegenHandler.runBuildRunnerStream(root, post, m.mode);
          break;
        case 'stopBuildRunner':
          codegenHandler.stopBuildRunner();
          break;
        case 'buildFilter':
          codegenHandler.runBuildFilter(root, m.file);
          break;
        case 'saveBuildYaml':
          codegenHandler.saveBuildYaml(root, post, m.content);
          break;
        case 'openFileAtLine':
          this.openFileAtLine(m.file, m.line);
          break;
        case 'loadStorage':
          await storageHandler.sendStorageInfo(root, post);
          break;
        case 'testDownload':
          await storageHandler.testDownload(root, post, m.path);
          break;
        case 'testDownloadAdb': {
          const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
          if (!fs.existsSync(gradlePath)) {
            this.post({ type: 'downloadTest', success: false, path: m.path ?? '', elapsedMs: 0, error: 'android/app/build.gradle not found' });
            break;
          }
          const gradle = fs.readFileSync(gradlePath, 'utf-8');
          const appId = gradle.match(/applicationId\s+["']([^"']+)["']/)?.[1] ?? '';
          await storageHandler.testDownloadAdb(post, appId, m.path);
          break;
        }
        case 'openStoragePath':
          await storageHandler.openStoragePath(post, m.path);
          break;
      }
      } catch (e) { console.error('[flutter-config] message handler error:', m.type, e); }
    });

    const watchPatterns = [
      '**/Info.plist', '**/AndroidManifest.xml', '**/*.entitlements',
      '**/build.gradle', '**/pubspec.yaml', '**/build.yaml',
    ];
    const watcher = vscode.workspace.createFileSystemWatcher(`{${watchPatterns.join(',')}}`);
    const debounce = (() => { let t: ReturnType<typeof setTimeout>; return () => { clearTimeout(t); t = setTimeout(() => { this.post({ type: 'fileChanged' }); }, 800); }; })();
    watcher.onDidChange(debounce);
    watcher.onDidCreate(debounce);
    watcher.onDidDelete(debounce);
  }

  private post(msg: unknown): void {
    this.view?.webview.postMessage(msg);
  }

  private sendAll(): void {
    const manifest = readManifest(this.root);
    const envFiles = scanEnvFiles(this.root);
    this.post({ type: 'data', manifest, envFiles, scannedTools: [], pubspec: null });
  }

  private openFile(file: string): void {
    const filePath = safePath(this.root, file);
    if (!filePath || !fs.existsSync(filePath)) {
      vscode.window.showWarningMessage('File not found or invalid path.');
      return;
    }
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath), {
      viewColumn: vscode.ViewColumn.Beside,
      preview: true,
    });
  }

  private openFileAtLine(file: string, line: number): void {
    const filePath = safePath(this.root, file);
    if (!filePath || !fs.existsSync(filePath)) return;
    vscode.window.showTextDocument(vscode.Uri.file(filePath), {
      viewColumn: vscode.ViewColumn.Beside,
      preview: true,
      selection: new vscode.Range(Math.max(0, line - 1), 0, Math.max(0, line - 1), 0),
    });
  }
}
