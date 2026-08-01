import * as vscode from 'vscode';

const tracked = new Set<vscode.Terminal>();

export function trackTerminal(t: vscode.Terminal): void {
  tracked.add(t);
  vscode.window.onDidCloseTerminal(closed => {
    if (closed === t) tracked.delete(t);
  });
}

export function disposeAllTerminals(): void {
  for (const t of tracked) t.dispose();
  tracked.clear();
}
