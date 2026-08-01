import * as vscode from 'vscode';
import { sharedCss } from '../shared/styles';
import { platformCss } from '../tabs/platform/permCatalog';

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}

export function buildHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.js'));
  const nonce = getNonce();
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: ${webview.cspSource}; script-src 'nonce-${nonce}';">
<style>${sharedCss}${platformCss}</style></head><body>

<div class="hdr">
  <span class="title">Flutter App Tools</span>
  <button class="ib" id="refresh-btn" title="Refresh"></button>
</div>

<div class="tabs">
  <div class="tab active" data-t="platform">Platform</div>
  <div class="tab" data-t="env">Env</div>
  <div class="tab" data-t="tools">Tools</div>
  <div class="tab" data-t="manage">Manage</div>
  <div class="tab" data-t="pubspec">Pubspec</div>
  <div class="tab" data-t="lint">Lint</div>
  <div class="tab" data-t="status">Status</div>
  <div class="tab" data-t="router">Router</div>
  <div class="tab" data-t="codegen">Codegen</div>
  <div class="tab" data-t="storage">Storage</div>
</div>

<div id="p-platform" class="p active"><div class="et" id="plat-tabs"></div><div id="plat-content"><div style="opacity:.5;padding:8px">Loading...</div></div></div>
<div id="p-env" class="p"><div class="et" id="env-tabs"></div><div id="cfg-form"></div>
  <div class="sec" style="margin-top:8px"><div class="sec-t">Env Diff</div>
    <div style="display:flex;gap:4px;align-items:center">
      <select id="diff-a" style="flex:1;padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px"></select>
      <span style="opacity:.4;font-size:10px">vs</span>
      <select id="diff-b" style="flex:1;padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px"></select>
      <button class="ib" id="diff-btn" title="Compare">⇄</button>
    </div>
    <div id="env-diff-view" style="margin-top:4px"></div>
  </div>
</div>
<div id="p-tools" class="p"><div id="tools-list"></div></div>
<div id="p-manage" class="p"><div id="manage-content"><div style="opacity:.5;padding:8px">Loading...</div></div></div>
<div id="p-pubspec" class="p">
  <div class="et" id="ps-tabs" style="align-items:center">
    <button class="active" data-ps="project">Project</button>
    <button data-ps="deps">Dependencies</button>
    <button data-ps="assets">Assets</button>
    <button data-ps="config">Config</button>
    <a href="https://pub.dev" class="pub-link" style="margin-left:auto" title="pub.dev">pub.dev</a>
  </div>
  <div id="ps-error" style="display:none;background:rgba(248,81,73,.12);border:1px solid #f85149;border-radius:3px;padding:6px 8px;margin-bottom:6px;font-size:10px;color:#f85149;white-space:pre-wrap"></div>
  <div id="ps-project" class="sec"><div class="sec-t">Project</div>
    <div class="f"><label>Name</label><input id="ps-name" data-field="name"></div>
    <div class="f"><label>Version</label><input id="ps-version" data-field="version"></div>
    <div class="f"><label>Description</label><input id="ps-desc" data-field="description"></div>
    <div style="display:flex;justify-content:flex-end;padding-top:4px"><button class="ib ib-p" id="ps-save" title="Save"></button></div>
  </div>
  <div id="ps-deps" class="sec" style="display:none"><div class="sec-t">Dependencies</div>
    <div style="display:flex;gap:3px;margin-bottom:4px;align-items:center">
      <input id="dep-search" placeholder="Search..." style="flex:1;padding:3px 5px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px">
      <button class="ib" id="dep-add-toggle" title="Add package">+</button>
      <button class="ib ib-p" id="dep-save" title="Save"></button>
      <button class="ib" id="dep-cancel" title="Cancel"></button>
    </div>
    <div id="dep-add-row" style="display:none;gap:4px;margin-bottom:6px;align-items:center">
      <input id="dep-new-name" placeholder="package name" style="flex:1;padding:3px 5px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px">
      <input id="dep-new-ver" placeholder="^1.0.0" style="width:70px;padding:3px 5px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px">
      <label style="font-size:11px;white-space:nowrap"><input type="checkbox" id="dep-new-dev" style="margin:0 2px 0 0">dev</label>
      <button class="ib ib-p" id="dep-add-btn" title="Confirm add">+</button>
    </div>
    <div id="dep-list"></div>
    <div id="dep-pager" style="display:flex;gap:4px;justify-content:center;margin-top:4px"></div>
  </div>
  <div id="ps-assets-sec" class="sec" style="display:none"><div class="sec-t">Assets</div><div id="ps-assets"><div style="opacity:.5;padding:4px">Loading...</div></div></div>
  <div id="ps-config-sec" class="sec" style="display:none"><div class="sec-t">Flutter Config</div><div id="ps-config"><div style="opacity:.5;padding:4px">Loading...</div></div></div>
</div>
<div id="p-lint" class="p"><div class="sec"><div class="sec-t">Lint Rules</div><div id="lint-list"></div></div></div>
<div id="p-status" class="p"><div id="status-c"></div></div>
<div id="p-router" class="p"><div id="router-content"><div style="opacity:.5;padding:8px">Loading...</div></div></div>
<div id="p-codegen" class="p"><div id="codegen-content"><div style="opacity:.5;padding:8px">Loading...</div></div></div>
<div id="p-storage" class="p"><div id="storage-c"><div style="opacity:.5;padding:8px">Loading...</div></div></div>

<script nonce="${nonce}" src="${scriptUri}"></script>
</body></html>`;
}
