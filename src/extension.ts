import * as vscode from 'vscode';
import { ConfigViewProvider } from './provider';
import { readManifest } from './shared/execUtils';
import { sanitizeShellArg } from './shared/security';
import { disposeAllTerminals, trackTerminal } from './shared/terminals';

export function activate(context: vscode.ExtensionContext): void {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '.';
  const provider = new ConfigViewProvider(context.extensionUri, root);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ConfigViewProvider.viewType, provider),
  );

  const manifest = readManifest(root);
  if (manifest) {
    for (const tool of manifest.tools) {
      context.subscriptions.push(
        vscode.commands.registerCommand(`flutterAppConfig.tool.${tool.id}`, async () => {
          const inputs: Record<string, string> = {};
          if (tool.inputs) {
            for (const inp of tool.inputs) {
              if (inp.type === 'select') {
                const picked = await vscode.window.showQuickPick(inp.options ?? [], { placeHolder: inp.name, title: tool.name });
                if (picked) inputs[inp.name] = picked;
              } else {
                const val = await vscode.window.showInputBox({ prompt: inp.name, password: inp.type === 'password', value: inp.default ?? '', placeHolder: inp.placeholder });
                if (val !== undefined) inputs[inp.name] = val;
              }
            }
          }
          let cmd = tool.command;
          for (const [k, v] of Object.entries(inputs)) cmd = cmd.replace(`\${${k}}`, sanitizeShellArg(v));
          const t = vscode.window.createTerminal({ name: `Tool: ${tool.name}`, cwd: root });
          trackTerminal(t);
          t.show();
          t.sendText(cmd);
        }),
      );
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('flutterAppConfig.open', () => {
      vscode.commands.executeCommand('workbench.view.extension.flutterAppConfig');
    }),
  );
}

export function deactivate(): void {
  disposeAllTerminals();
}
