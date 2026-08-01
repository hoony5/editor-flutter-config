export const window = {
  showInformationMessage: () => {},
  showWarningMessage: () => {},
  showErrorMessage: () => {},
  showInputBox: async () => undefined,
  createTerminal: () => ({ show: () => {}, sendText: () => {}, dispose: () => {} }),
  onDidCloseTerminal: () => ({ dispose: () => {} }),
  registerWebviewViewProvider: () => ({ dispose: () => {} }),
};
export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/tmp/test-project' } }],
};
export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: () => {},
};
export const Uri = { file: (p: string) => ({ fsPath: p }) };
export const ViewColumn = { Beside: 2 };
