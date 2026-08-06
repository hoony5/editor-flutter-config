export const pubspecJs = `
function renderPubspec(m){
  var pe=document.getElementById('ps-error');
  if(pe){if(m.parseError){pe.textContent=m.parseError;pe.style.display='block';}else{pe.style.display='none';}}
  var pn=document.getElementById('ps-name');if(pn)pn.value=m.name||'';
  var pv=document.getElementById('ps-version');if(pv)pv.value=m.version||'';
  var pd=document.getElementById('ps-desc');if(pd)pd.value=m.description||'';
  _origDeps=m.deps||[];_stagedAdds=[];_depPage=0;
  renderDepList();
  renderPubspecAssets(m);
  renderPubspecConfig(m);
}
function _mdToHtml(src){
  var h=E(src);
  h=h.replace(/^### (.+)$/gm,'<h3 style="font-size:12px;margin:6px 0 2px">$1</h3>');
  h=h.replace(/^## (.+)$/gm,'<h2 style="font-size:13px;margin:8px 0 2px">$1</h2>');
  h=h.replace(/^# (.+)$/gm,'<h1 style="font-size:14px;margin:10px 0 4px">$1</h1>');
  h=h.replace(/\x60\x60\x60([\\s\\S]*?)\x60\x60\x60/g,'<pre style="background:var(--ibg);padding:6px;border-radius:3px;font-size:10px;overflow:auto;margin:4px 0">$1</pre>');
  h=h.replace(/\x60([^\x60]+)\x60/g,'<code style="background:var(--ibg);padding:1px 3px;border-radius:2px;font-size:10px">$1</code>');
  h=h.replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>');
  h=h.replace(/\\*([^*]+)\\*/g,'<em>$1</em>');
  h=h.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,'<a href="$2" style="color:var(--bb)">$1</a>');
  h=h.replace(/^- (.+)$/gm,'<div style="padding-left:10px">• $1</div>');
  return h;
}
function _isDark(){return document.body.classList.contains('vscode-dark')||document.body.classList.contains('vscode-high-contrast');}
function _tokColors(){return _isDark()?{key:'#9cdcfe',str:'#ce9178',num:'#b5cea8',bool:'#569cd6',tag:'#569cd6',attr:'#9cdcfe',val:'#ce9178',com:'#6a9955'}:{key:'#0451a5',str:'#a31515',num:'#098658',bool:'#0000ff',tag:'#800000',attr:'#e50000',val:'#0000ff',com:'#008000'};}
function _csvToHtml(src){
  var lines=src.replace(/\\r/g,'').trim().split('\\n');
  var c=_tokColors();
  var h='<table style="border-collapse:collapse;font-size:10px;width:100%;font-variant-numeric:tabular-nums">';
  lines.forEach(function(line,i){
    var cells=line.split(',');
    h+='<tr>';
    cells.forEach(function(cell){
      var tag=i===0?'th':'td';
      var st='border:1px solid var(--ib);padding:3px 6px;white-space:nowrap;';
      if(i===0)st+='background:var(--ibg);font-weight:600;';
      else{
        var v=cell.trim();
        if(/^-?\d+\.?\d*$/.test(v))st+='color:'+c.num+';text-align:right;';
        else if(/^(true|false)$/i.test(v))st+='color:'+c.bool+';';
      }
      h+='<'+tag+' style="'+st+'">'+E(cell.trim())+'</'+tag+'>';
    });
    h+='</tr>';
  });
  return h+'</table>';
}
function _jsonToHtml(src){
  var h=E(src);var c=_tokColors();
  h=h.replace(/"([^"]+)"(\\s*:)/g,'<span style="color:'+c.key+'">"$1"</span>$2');
  h=h.replace(/:\\s*"([^"]*)"/g,': <span style="color:'+c.str+'">"$1"</span>');
  h=h.replace(/:\\s*(-?\\d+\\.?\\d*)([,\\n])/g,': <span style="color:'+c.num+'">$1</span>$2');
  h=h.replace(/:\\s*(true|false|null)([,\\n])/g,': <span style="color:'+c.bool+'">$1</span>$2');
  return h;
}
function _xmlToHtml(src){
  var h=E(src);var c=_tokColors();
  h=h.replace(/&lt;!--[\\s\\S]*?--&gt;/g,function(m){return '<span style="color:'+c.com+'">'+m+'</span>';});
  h=h.replace(/(&lt;\\/?)([\\w:-]+)/g,'$1<span style="color:'+c.tag+'">$2</span>');
  h=h.replace(/([\\w:-]+)=(&quot;[^&]*&quot;)/g,'<span style="color:'+c.attr+'">$1</span>=<span style="color:'+c.val+'">$2</span>');
  return h;
}
function renderPubspecAssets(m){
  var el=document.getElementById('ps-assets');if(!el)return;
  var assets=m.assets||[];var previews=m.previews||{};var assetFiles=m.assetFiles||{};
  var h='<div style="position:sticky;top:0;z-index:10;background:var(--bg);padding-top:40px;padding-bottom:4px;border-bottom:1px solid var(--ib)">';
  h+='<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center">'+
    '<input id="asset-new-path" placeholder="assets/new-folder/" style="flex:1;padding:3px 5px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px">'+
    '<button class="ib ib-p" id="asset-add-btn" title="Add">'+IC.plus+'</button>'+
    '<button class="ib" id="asset-load-btn" title="Scan & auto-add">'+IC.refresh+'</button></div>';
  h+='<div style="display:flex;gap:4px;margin-bottom:4px">'+
    '<button class="ib" id="asset-usage-btn" title="Scan asset usage in Dart files" style="font-size:9px;padding:2px 6px">📊 Usage</button>'+
    '<button class="ib" id="asset-batch-opt-btn" title="Generate batch WebP optimization script" style="font-size:9px;padding:2px 6px">⚡ Batch Optimize</button></div>';
  h+='<div id="asset-usage-results" style="display:none;margin-bottom:8px"></div>';
  h+='<div id="asset-batch-results" style="display:none;margin-bottom:8px"></div>';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:10px;opacity:.6">'+
    '<span>Size</span><input type="range" id="asset-scale" min="1" max="5" step="1" value="'+_prevScale+'" style="flex:1;height:12px;accent-color:var(--bb)">'+
    '<span id="asset-scale-val">'+_prevScale+'x</span></div>';
  h+='<div id="asset-preview-wrap" style="display:none;position:relative;margin-bottom:14px">'+
    '<div id="asset-preview-panel" style="border:1px solid var(--ib);border-radius:4px;padding:6px;min-height:'+(_panelCollapsed?300:600)+'px;max-height:'+(_panelCollapsed?300:600)+'px;overflow-y:auto"></div>'+
    '<div id="panel-collapse" style="position:absolute;bottom:-11px;right:8px;z-index:11;background:var(--ibg);border:1px solid var(--ib);border-top:none;border-radius:0 0 4px 4px;padding:1px 10px;cursor:pointer;font-size:8px;opacity:.7;user-select:none" title="Toggle height">'+(_panelCollapsed?'▼':'▲')+'</div></div>';
  h+='</div>';
  if(!assets.length){
    h+='<div style="opacity:.5;padding:4px">No assets declared. Add a path or scan.</div>';
    el.innerHTML=h;bindAssetToolbar(el);return;
  }
  assets.forEach(function(a){
    if(a.endsWith('/')){
      var files=assetFiles[a]||[];
      var totalSize=files.reduce(function(s,f){return s+f.sizeBytes;},0);
      h+='<div class="cat-hdr" style="display:flex;align-items:center;justify-content:space-between">'+
        '<span>'+E(a)+' <span style="opacity:.5;font-size:10px">'+files.length+' files · '+fmtB(totalSize)+'</span></span>'+
        '<button class="ib asset-del" data-path="'+E(a)+'" title="Remove" style="color:#f85149;padding:1px 4px">'+IC.x+'</button></div>';
      h+='<div class="asset-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px">';
      files.forEach(function(f){h+=renderAssetCard(a,f,previews);});
      h+='</div>';
      if(!files.length)h+='<div style="opacity:.4;padding:2px 0 2px 12px;font-size:10px">empty or not found</div>';
    }else{
      h+='<div class="asset-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px">';
      h+=renderAssetCard('',{name:a.split('/').pop(),sizeBytes:0,category:'other'},previews,a);
      h+='</div>';
    }
  });
  el.innerHTML=h;
  bindAssetToolbar(el);
  var sc=document.getElementById('asset-scale');
  if(sc)sc.addEventListener('input',function(){_prevScale=parseInt(sc.value);var sv=document.getElementById('asset-scale-val');if(sv)sv.textContent=_prevScale+'x';renderPubspecAssets(m);});
  el.querySelectorAll('.asset-del').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();V.postMessage({type:'removeAssetPath',path:b.dataset.path});});});
  el.querySelectorAll('.asset-card').forEach(function(c){
    c.addEventListener('click',function(){V.postMessage({type:'openFile',file:c.dataset.file});});
  });
  el.querySelectorAll('.asset-prev-btn').forEach(function(b){b.addEventListener('click',function(e){
    e.stopPropagation();
    var wrap=document.getElementById('asset-preview-wrap');var panel=document.getElementById('asset-preview-panel');if(!wrap||!panel)return;
    if(panel.dataset.file===b.dataset.preview&&wrap.style.display!=='none'){wrap.style.display='none';panel.innerHTML='';return;}
    panel.dataset.file=b.dataset.preview;
    panel.innerHTML='<div style="opacity:.5;font-size:10px">Loading...</div>';wrap.style.display='block';
    V.postMessage({type:'getAssetPreview',filePath:b.dataset.preview});
  });});
  el.querySelectorAll('.asset-copy-btn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();showCopyMenu(b.dataset.copy,e.clientX,e.clientY);});});
  el.querySelectorAll('.asset-card').forEach(function(c){c.addEventListener('contextmenu',function(e){e.preventDefault();showCopyMenu(c.dataset.file,e.clientX,e.clientY);});});
  var cb=document.getElementById('panel-collapse');
  if(cb)cb.addEventListener('click',function(){
    _panelCollapsed=!_panelCollapsed;
    var p=document.getElementById('asset-preview-panel');
    if(p){var h=_panelCollapsed?300:600;p.style.minHeight=h+'px';p.style.maxHeight=h+'px';}
    cb.textContent=_panelCollapsed?'▼':'▲';
  });
}
function bindAssetToolbar(el){
  var ab=document.getElementById('asset-add-btn');
  if(ab)ab.addEventListener('click',function(){
    var inp=document.getElementById('asset-new-path');if(!inp)return;
    var v=inp.value.trim();if(v){V.postMessage({type:'addAssetPath',path:v});inp.value='';}
  });
  var lb=document.getElementById('asset-load-btn');
  if(lb)lb.addEventListener('click',function(){V.postMessage({type:'loadAssetDirs'});});
  var ub=document.getElementById('asset-usage-btn');
  if(ub)ub.addEventListener('click',function(){V.postMessage({type:'scanAssetUsage'});});
  var bo=document.getElementById('asset-batch-opt-btn');
  if(bo)bo.addEventListener('click',function(){V.postMessage({type:'batchOptimize'});});
}
function showCopyMenu(file,x,y){
  hideCopyMenu();
  var menu=document.createElement('div');
  menu.id='copy-menu';
  menu.style.cssText='position:fixed;z-index:999;background:var(--ibg);border:1px solid var(--ib);border-radius:4px;padding:2px;box-shadow:0 4px 12px rgba(0,0,0,.4)';
  menu.style.left=Math.min(x,window.innerWidth-150)+'px';
  menu.style.top=Math.min(y,window.innerHeight-60)+'px';
  function item(label,mode){
    var b=document.createElement('button');
    b.className='btn btn-s';
    b.style.cssText='display:block;width:100%;text-align:left;font-size:10px;margin:1px 0;padding:3px 8px';
    b.textContent=label;
    b.addEventListener('click',function(){V.postMessage({type:'copyAssetPath',file:file,mode:mode});hideCopyMenu();});
    return b;
  }
  menu.appendChild(item('Copy relative path','relative'));
  menu.appendChild(item('Copy absolute path','absolute'));
  document.body.appendChild(menu);
  setTimeout(function(){document.addEventListener('click',hideCopyMenu,{once:true});},0);
}
function hideCopyMenu(){
  var m=document.getElementById('copy-menu');
  if(m)m.remove();
}
function renderAssetCard(dirRel,file,previews,fullPath){
  var rel=fullPath||(dirRel+file.name);var prev=previews[rel];
  var icons={image:'🖼',audio:'🔊',video:'🎬',font:'Aa',data:'{}',animation:'✨',other:'📄'};
  var icon=icons[file.category]||'📄';
  var imgH=72+_prevScale*15;
  var h='<div class="asset-card" data-file="'+E(rel)+'" style="border:1px solid var(--ib);border-radius:4px;padding:4px;cursor:pointer;text-align:center;overflow:hidden" title="'+E(rel)+'">';
  if(file.category==='image'&&prev){
    h+='<img src="'+prev+'" style="width:100%;height:'+imgH+'px;object-fit:contain;border-radius:2px;display:block;margin:0 auto 2px">';
  }else{
    h+='<div style="font-size:'+(42+_prevScale*6)+'px;line-height:'+(imgH)+'px">'+icon+'</div>';
  }
  h+='<div style="font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.7" title="'+E(file.name)+'">'+E(file.name)+'</div>';
  h+='<div style="display:flex;justify-content:center;gap:2px;margin-top:2px">';
  h+='<span style="font-size:7px;opacity:.4">'+fmtB(file.sizeBytes)+'</span>';
  h+='<button class="ib asset-prev-btn" data-preview="'+E(rel)+'" title="Preview" style="padding:2px 5px">'+IC.eye+'</button>';
  h+='<button class="ib asset-copy-btn" data-copy="'+E(rel)+'" title="Copy path" style="padding:2px 5px">'+IC.copy+'</button>';
  h+='</div></div>';
  return h;
}
function renderAssetPreview(m){
  var wrap=document.getElementById('asset-preview-wrap');
  var panel=document.getElementById('asset-preview-panel');if(!panel||!wrap)return;
  wrap.style.display='block';
  if(!m.data){panel.innerHTML='<div style="opacity:.5;font-size:10px">Preview not available</div>';return;}
  var pt=m.previewType||'info';
  if(pt==='text'){
    var isMd=/\.md$/i.test(m.filePath);
    var isCsv=/\.csv$/i.test(m.filePath);
    var isJson=/\.json$/i.test(m.filePath);
    var isXml=/\.(xml|plist|entitlements|svg)$/i.test(m.filePath);
    var info=m.totalLines?' <span style="opacity:.4">('+m.totalLines+' lines, showing 40)</span>':'';
    var body;
    if(isCsv)body='<div>'+_csvToHtml(m.data)+'</div>';
    else if(isJson)body='<pre style="font-size:10px;line-height:1.5;white-space:pre;margin:0;background:var(--ibg);padding:6px;border-radius:3px">'+_jsonToHtml(m.data)+'</pre>';
    else if(isXml)body='<pre style="font-size:10px;line-height:1.5;white-space:pre;margin:0;background:var(--ibg);padding:6px;border-radius:3px">'+_xmlToHtml(m.data)+'</pre>';
    else if(isMd)body='<div style="font-size:11px;line-height:1.6;color:var(--fg)">'+_mdToHtml(m.data)+'</div>';
    else body='<pre style="font-size:10px;line-height:1.4;white-space:pre;margin:0;background:var(--ibg);padding:6px;border-radius:3px">'+E(m.data)+'</pre>';
    panel.innerHTML='<div style="font-size:9px;opacity:.5;margin-bottom:4px">'+E(m.filePath)+info+'</div>'+body;
  }else if(pt==='image'){
    var imgH=_panelCollapsed?240:540;
    panel.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:'+imgH+'px"><img src="'+m.data+'" style="max-width:100%;max-height:'+(imgH-20)+'px;object-fit:contain;border-radius:3px"></div>'+
      '<div style="display:flex;gap:4px;margin-top:4px;justify-content:flex-end">'+
      '<button class="ib asset-opt" data-cmd="webp" data-file="'+E(m.filePath)+'" title="Convert to WebP" style="font-size:9px">→ WebP</button>'+
      '<button class="ib asset-opt" data-cmd="resize" data-file="'+E(m.filePath)+'" title="Resize 50%" style="font-size:9px">½ resize</button></div>';
  }else if(pt==='font'){
    var fontId='pf_'+m.filePath.replace(/[^a-zA-Z0-9]/g,'_');
    var style=document.createElement('style');
    style.textContent='@font-face{font-family:"'+fontId+'";src:url('+m.data+');}';
    document.head.appendChild(style);
    panel.innerHTML='<div class="font-sample" style="font-size:'+(14+_prevScale*3)+'px;padding:6px 0;line-height:1.6">AaBbCc 가나다라 0123 The quick brown fox</div>';
    var sample=panel.querySelector('.font-sample');if(sample)sample.style.fontFamily=fontId;
  }else if(pt==='audio'){
    panel.innerHTML='<audio controls src="'+m.data+'" style="width:100%;height:32px"></audio>';
  }else if(pt==='video'){
    panel.innerHTML='<video controls src="'+m.data+'" style="width:100%;border-radius:3px;background:#000"></video>'+
      '<div class="vid-err" style="display:none;font-size:10px;color:#d29922;padding:6px 0">⚠ H.265(HEVC) 코덱은 webview에서 재생 불가. H.264(AVC) 변환 필요.</div>'+
      '<div style="display:flex;gap:4px;margin-top:4px;justify-content:flex-end">'+
      '<button class="ib asset-opt" data-cmd="h264" data-file="'+E(m.filePath)+'" title="Convert to H.264" style="font-size:9px">→ H.264</button></div>';
    var vid=panel.querySelector('video');
    if(vid)vid.addEventListener('error',function(){var e=panel.querySelector('.vid-err');if(e)e.style.display='block';});
  }else{
    panel.innerHTML='<pre style="font-size:10px;white-space:pre-wrap;margin:0">'+E(m.data)+'</pre>';
  }
  panel.querySelectorAll('.asset-opt').forEach(function(b){b.addEventListener('click',function(){
    V.postMessage({type:'assetOptimize',cmd:b.dataset.cmd,file:b.dataset.file});
  });});
}
function renderPubspecConfig(m){
  var el=document.getElementById('ps-config');if(!el)return;
  var h='';
  h+='<div class="sr"><span class="l">Dart SDK</span><span class="v">'+E(m.sdkConstraint||'—')+'</span></div>';
  h+='<div class="sr"><span class="l">Flutter SDK</span><span class="v">'+E(m.flutterSdkConstraint||'—')+'</span></div>';
  h+='<div class="sr"><span class="l">Platforms</span><span class="v">'+(m.platforms||[]).map(function(p){return '<span class="bg b" style="font-size:9px;margin-left:2px">'+E(p)+'</span>';}).join('')+'</span></div>';
  var fonts=m.fonts||[];
  if(fonts.length){
    h+='<div style="padding:4px 0 2px;font-size:10px;opacity:.4">Fonts ('+fonts.length+')</div>';
    fonts.forEach(function(f){h+='<div class="sr"><span class="l">'+E(f.family)+'</span><span class="v" style="font-size:10px;opacity:.6">'+E(f.file)+'</span></div>';});
  }
  el.innerHTML=h;
}
function _filteredDeps(){
  var q=_depSearch.toLowerCase();
  return _origDeps.filter(function(d){return !q||d.name.toLowerCase().indexOf(q)!==-1||d.version.toLowerCase().indexOf(q)!==-1||(d.isDev?'dev':'').indexOf(q)!==-1;});
}
function renderDepList(){
  var el=document.getElementById('dep-list');if(!el)return;
  var filtered=_filteredDeps();
  var deps=filtered.filter(function(d){return !d.isDev;});
  var devDeps=filtered.filter(function(d){return d.isDev;});
  var totalPages=Math.max(1,Math.ceil(filtered.length/_DEP_PER));
  if(_depPage>=totalPages)_depPage=totalPages-1;
  var start=_depPage*_DEP_PER;
  var pageDeps=filtered.slice(start,start+_DEP_PER);
  var h='';
  var depsInPage=pageDeps.filter(function(d){return !d.isDev;});
  var devInPage=pageDeps.filter(function(d){return d.isDev;});
  if(depsInPage.length){
    h+='<div class="dep-sec">Dependencies ('+deps.length+')</div>';
    h+=depsInPage.map(function(d){return '<div class="dep-row"><input type="checkbox" checked data-dep="'+E(d.name)+'" data-dev="false"><span>'+E(d.name)+'</span><span class="ver">'+E(d.version)+'</span><a href="https://pub.dev/packages/'+E(d.name)+'" class="pub-link" title="pub.dev">pub.dev</a></div>';}).join('');
  }
  if(devInPage.length||_depPage===totalPages-1){
    h+='<div class="dep-sec">Dev Dependencies ('+devDeps.length+')</div>';
    h+=devInPage.map(function(d){return '<div class="dep-row"><input type="checkbox" checked data-dep="'+E(d.name)+'" data-dev="true"><span>'+E(d.name)+'</span><span class="ver">'+E(d.version)+'</span><span class="dev">dev</span><a href="https://pub.dev/packages/'+E(d.name)+'" class="pub-link" title="pub.dev">pub.dev</a></div>';}).join('');
  }
  if(_depPage===totalPages-1&&_stagedAdds.length){
    h+=_stagedAdds.map(function(d,i){return '<div class="dep-row" style="border-left:2px solid var(--bb);padding-left:4px"><input type="checkbox" checked data-staged="'+i+'"><span>'+E(d.name)+'</span><span class="ver">'+E(d.version||'any')+'</span>'+(d.isDev?'<span class="dev">dev</span>':'')+'<span class="dev" style="color:#3fb950">new</span></div>';}).join('');
  }
  if(!h)h='<div style="opacity:.5;padding:4px">No results</div>';
  el.innerHTML=h;
  var pg=document.getElementById('dep-pager');
  if(pg){
    if(totalPages>1){
      var ph='';
      if(_depPage>0)ph+='<button class="ib" data-pg="'+(_depPage-1)+'" style="font-size:10px">←</button>';
      ph+='<span style="font-size:11px;opacity:.6;padding:2px 6px">'+(_depPage+1)+' / '+totalPages+' ('+filtered.length+')</span>';
      if(_depPage<totalPages-1)ph+='<button class="ib" data-pg="'+(_depPage+1)+'" style="font-size:10px">→</button>';
      pg.innerHTML=ph;
      pg.querySelectorAll('[data-pg]').forEach(function(b){b.addEventListener('click',function(){_depPage=parseInt(b.dataset.pg);renderDepList();});});
    }else{pg.innerHTML=filtered.length?'<span style="font-size:11px;opacity:.4">'+filtered.length+' packages</span>':'';}
  }
  el.querySelectorAll('[data-dep]').forEach(function(cb){cb.addEventListener('change',function(){
    var row=cb.closest('.dep-row');row.style.opacity=cb.checked?'1':'.4';
    row.querySelector('span').style.textDecoration=cb.checked?'none':'line-through';
  });});
  el.querySelectorAll('[data-staged]').forEach(function(cb){cb.addEventListener('change',function(){
    if(!cb.checked){_stagedAdds.splice(parseInt(cb.dataset.staged),1);renderDepList();}
  });});
}
function initPubspec(){
  var psTabs=document.getElementById('ps-tabs');
  if(psTabs)psTabs.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){
    psTabs.querySelectorAll('button').forEach(function(x){x.classList.remove('active');});
    b.classList.add('active');
    var t=b.dataset.ps;
    var secs={project:'ps-project',deps:'ps-deps',assets:'ps-assets-sec',config:'ps-config-sec'};
    Object.values(secs).forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    var show=document.getElementById(secs[t]);if(show)show.style.display='block';
  });});
  var ds=document.getElementById('dep-search');
  if(ds)ds.addEventListener('input',function(e){_depSearch=e.target.value;_depPage=0;renderDepList();});
  var at=document.getElementById('dep-add-toggle');
  var ar=document.getElementById('dep-add-row');
  if(at&&ar)at.addEventListener('click',function(){
    ar.style.display=ar.style.display==='none'?'flex':'none';
    if(ar.style.display==='flex'){var n=document.getElementById('dep-new-name');if(n)n.focus();}
  });
  var ab=document.getElementById('dep-add-btn');
  if(ab)ab.addEventListener('click',function(){
    var n=document.getElementById('dep-new-name'),v=document.getElementById('dep-new-ver'),dv=document.getElementById('dep-new-dev');
    if(!n)return;var name=n.value.trim();if(!name)return;
    _stagedAdds.push({name:name,version:v?v.value.trim()||'any':'any',isDev:dv?dv.checked:false});
    n.value='';if(v)v.value='';if(dv)dv.checked=false;renderDepList();
  });
  var sv=document.getElementById('dep-save');
  if(sv)sv.addEventListener('click',function(){
    var removals=[];
    document.querySelectorAll('[data-dep]').forEach(function(cb){if(!cb.checked)removals.push(cb.dataset.dep);});
    V.postMessage({type:'saveDeps',removals:removals,additions:_stagedAdds});
  });
  var cn=document.getElementById('dep-cancel');
  if(cn)cn.addEventListener('click',function(){
    _stagedAdds=[];renderDepList();
    document.querySelectorAll('[data-dep]').forEach(function(cb){cb.checked=true;var row=cb.closest('.dep-row');if(row){row.style.opacity='1';var sp=row.querySelector('span');if(sp)sp.style.textDecoration='none';}});
  });
  var ps=document.getElementById('ps-save');
  if(ps)ps.addEventListener('click',function(){
    ['name','version','description'].forEach(function(f){
      var el=document.querySelector('[data-field="'+f+'"]');
      if(el)V.postMessage({type:'writePubspecField',field:f,value:el.value});
    });
  });
}
function renderAssetOpt(m){
  var el=document.getElementById('ps-assets');if(!el)return;
  var sugs=m.suggestions||[];var unusedFonts=m.unusedFonts||[];
  var h=el.innerHTML;
  if(sugs.length){
    h+='<div style="padding:4px 0 2px;font-size:10px;font-weight:600;opacity:.5">Optimization Suggestions</div>';
    h+=sugs.map(function(s){return '<div class="sr"><span class="l" style="font-size:10px">'+E(s.file)+'</span><span class="v" style="font-size:9px;display:flex;gap:4px;align-items:center"><span style="opacity:.5">'+fmtB(s.sizeBytes)+'</span><span style="color:#d29922">'+E(s.suggestion)+'</span></span></div>';}).join('');
  }
  if(unusedFonts.length){
    h+='<div style="padding:4px 0 2px;font-size:10px;font-weight:600;opacity:.5">Unused Fonts</div>';
    h+=unusedFonts.map(function(f){return '<div class="asset-row"><span style="color:#f85149">'+E(f)+'</span><span class="sz">not in pubspec</span></div>';}).join('');
  }
  if(!sugs.length&&!unusedFonts.length)h+='<div style="opacity:.4;padding:4px;font-size:10px">No optimization issues found.</div>';
  el.innerHTML=h;
}
function renderAssetUsage(m){
  var el=document.getElementById('asset-usage-results');if(!el)return;
  var usage=m.usage||[];
  if(!usage.length){el.innerHTML='<div style="opacity:.4;font-size:10px;padding:4px">No assets found to analyze.</div>';el.style.display='block';return;}
  var unusedCount=usage.filter(function(u){return u.unused;}).length;
  var h='<div style="border:1px solid var(--ib);border-radius:4px;padding:6px;font-size:10px">';
  h+='<div style="font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">'+
    '<span>📊 Asset Usage</span>'+
    '<span style="font-size:9px;opacity:.5">'+usage.length+' assets · <span style="color:'+(unusedCount>0?'#f85149':'#3fb950')+'">'+unusedCount+' unused</span></span></div>';
  h+='<div style="max-height:200px;overflow-y:auto">';
  usage.forEach(function(u){
    var color=u.unused?'#f85149':'var(--fg)';
    var badge=u.unused?'<span style="background:#f8514922;color:#f85149;padding:1px 4px;border-radius:2px;font-size:8px">UNUSED</span>'
      :'<span style="background:#3fb95022;color:#3fb950;padding:1px 4px;border-radius:2px;font-size:8px">'+u.referencedBy.length+' ref</span>';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--ib)">';
    h+='<span style="color:'+color+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1" title="'+E(u.asset)+'">'+E(u.asset)+'</span>';
    h+='<span style="margin-left:6px;flex-shrink:0">'+badge+'</span>';
    h+='</div>';
    if(!u.unused&&u.referencedBy.length<=3){
      u.referencedBy.forEach(function(r){
        h+='<div style="padding:1px 0 1px 12px;font-size:9px;opacity:.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+E(r)+'">↳ '+E(r)+'</div>';
      });
    }
  });
  h+='</div></div>';
  el.innerHTML=h;el.style.display='block';
}
function renderBatchOptimize(m){
  var el=document.getElementById('asset-batch-results');if(!el)return;
  if(!m.script){el.innerHTML='<div style="opacity:.4;font-size:10px;padding:4px">No PNG/JPG files over 100KB found in assets/.</div>';el.style.display='block';return;}
  var h='<div style="border:1px solid var(--ib);border-radius:4px;padding:6px;font-size:10px">';
  h+='<div style="font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">'+
    '<span>⚡ Batch Optimize</span>'+
    '<span style="font-size:9px;opacity:.5">'+m.fileCount+' files · savings: '+E(m.totalSavings)+'</span></div>';
  h+='<pre style="background:var(--ibg);padding:6px;border-radius:3px;font-size:9px;line-height:1.4;overflow-x:auto;max-height:200px;overflow-y:auto;white-space:pre;margin:4px 0">'+E(m.script)+'</pre>';
  h+='<div style="display:flex;gap:4px;justify-content:flex-end;margin-top:4px">'+
    '<button class="ib ib-p" id="batch-run-btn" style="font-size:9px;padding:2px 8px">▶ Run in Terminal</button></div>';
  h+='</div>';
  el.innerHTML=h;el.style.display='block';
  var rb=document.getElementById('batch-run-btn');
  if(rb)rb.addEventListener('click',function(){V.postMessage({type:'runBatchScript',script:m.script});});
}
`;
