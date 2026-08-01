export const sharedCss = `
:root{--bg:var(--vscode-editor-background);--fg:var(--vscode-editor-foreground);--ibg:var(--vscode-input-background);--ifg:var(--vscode-input-foreground);--ib:var(--vscode-input-border,#444);--bb:var(--vscode-button-background);--bf:var(--vscode-button-foreground);--bh:var(--vscode-button-hoverBackground)}
*{box-sizing:border-box;margin:0;padding:0}
body{font:13px/1.5 var(--vscode-font-family);color:var(--fg);background:var(--bg)}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:4px 8px;border-bottom:1px solid var(--ib);position:sticky;top:0;background:var(--bg);z-index:20}
.hdr .title{font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px;opacity:.7}
.tabs{display:flex;border-bottom:1px solid var(--ib);position:sticky;top:25px;background:var(--bg);z-index:10;overflow-x:auto}
.tab{padding:6px 8px;cursor:pointer;border-bottom:2px solid transparent;opacity:.5;font-size:11px;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}
.tab:hover{opacity:.8}.tab.active{opacity:1;border-bottom-color:var(--bb);font-weight:600}
.p{display:none;padding:8px}.p.active{display:block}
.sec{margin-bottom:10px}.sec-t{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;opacity:.6;padding:4px 0 3px;border-bottom:1px solid var(--ib);margin-bottom:4px}
.f{display:flex;align-items:center;padding:5px 0;border-bottom:1px solid var(--ib)}.f label{flex:1;min-width:0;font-size:13px;padding-right:12px;opacity:.85}
.f input,.f select{width:180px;flex-shrink:0;padding:4px 6px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:12px}
.f input:focus,.f select:focus{outline:1px solid var(--bb)}
.tr{display:flex;align-items:center;padding:5px 0;border-bottom:1px solid var(--ib)}
.tr>label:first-child{flex:1;min-width:0;font-size:12px;padding-right:12px;opacity:.85}
.sw{position:relative;width:26px;height:14px;flex-shrink:0}
.sw input{opacity:0;width:0;height:0}
.sl{position:absolute;inset:0;background:var(--ib);border-radius:7px;cursor:pointer;transition:background .2s}
.sl::before{content:'';position:absolute;width:10px;height:10px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:transform .2s}
.sw input:checked+.sl{background:var(--bb)}.sw input:checked+.sl::before{transform:translateX(12px)}
.ib{background:transparent;border:1px solid var(--ib);color:var(--fg);border-radius:3px;padding:5px 8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0}
.ib:hover{background:var(--ibg)}.ib svg{display:block}
.ib:disabled{opacity:.3;cursor:default}
.ib-p{background:var(--bb);color:var(--bf);border-color:var(--bb)}
.ib-p:hover{background:var(--bh)}
.ib-p:disabled{opacity:.45;background:var(--bb);color:var(--bf)}
.btn{padding:3px 10px;background:var(--bb);color:var(--bf);border:none;border-radius:3px;cursor:pointer;font-size:11px;margin-top:3px}
.btn:hover{background:var(--bh)}
.btn-s{background:transparent;border:1px solid var(--ib);color:var(--fg)}
.btn-d{background:transparent;border:1px solid #f85149;color:#f85149}
.et{display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap}
.et button{padding:2px 6px;border:1px solid var(--ib);border-radius:3px;background:transparent;color:var(--fg);cursor:pointer;font-size:11px}
.et button.active{background:var(--bb);color:var(--bf);border-color:var(--bb)}
.sr{display:flex;align-items:center;padding:5px 0;border-bottom:1px solid var(--ib);font-size:12px}
.sr .l{flex:1;min-width:0;opacity:.7;padding-right:12px}.sr .v{flex-shrink:0;font-weight:600;text-align:right}
.bg{display:inline-block;padding:0 5px;border-radius:6px;font-size:10px;font-weight:600}
.bg.ok{background:#3fb950;color:#000}.bg.w{background:#d29922;color:#000}.bg.e{background:#f85149;color:#fff}
.bg.b{background:#007acc;color:#fff}
.dep-row{display:flex;align-items:center;padding:5px 0;border-bottom:1px solid var(--ib);font-size:12px}
.dep-row input[type=checkbox]{margin:0 8px 0 0;flex-shrink:0}
.dep-row .ver{margin-left:auto;opacity:.5;font-size:11px;padding-left:8px}
.dep-row .dev{opacity:.4;font-size:10px;font-style:italic;padding-left:4px}
.pub-link{font-size:9px;color:var(--bb);text-decoration:none;border:1px solid var(--ib);border-radius:3px;padding:0 4px;margin-left:6px;opacity:.6;flex-shrink:0}
.pub-link:hover{opacity:1;text-decoration:underline}
.tip{position:relative;cursor:help}
.tip:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;padding:3px 7px;font-size:9px;white-space:nowrap;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none}
.asset-row{display:flex;justify-content:space-between;padding:2px 0;font-size:11px;border-bottom:1px solid var(--ib)}
.asset-row .sz{opacity:.6;font-variant-numeric:tabular-nums}
.cat-hdr{font-size:11px;font-weight:600;padding:4px 0 2px;opacity:.7}
.hint{font-size:10px;opacity:.45;padding:3px 0;line-height:1.4}
.mrow{display:flex;align-items:center;padding:4px 0;border-bottom:1px solid var(--ib);font-size:12px;gap:6px}
.mrow .ml{flex:1;min-width:0;opacity:.75}.mrow .mv{font-weight:600;font-variant-numeric:tabular-nums;font-size:11px}
.mrow .mv.g{color:#3fb950}.mrow .mv.y{color:#d29922}.mrow .mv.r{color:#f85149}
.tool-row{display:flex;align-items:center;gap:4px;padding:4px 2px;border-bottom:1px solid var(--ib)}
.tool-row .tn{flex:1;min-width:0;font-size:11px;cursor:pointer}
.tool-row .tn:hover{text-decoration:underline dotted}
.tool-row .td{opacity:.4;font-size:10px}
.tool-row .acts{display:flex;gap:2px;flex-shrink:0}
.dep-sec{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;opacity:.5;padding:6px 0 2px;border-bottom:1px solid var(--ib)}
`;
