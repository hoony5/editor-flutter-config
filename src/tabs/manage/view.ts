export const manageJs = `
function renderManage(m){
  var el=document.getElementById('manage-content');
  function szCls(b){return b>524288000?'r':b>104857600?'y':'g';}
  var h='';
  h+='<div class="sec"><div class="sec-t">Build Cache</div>'+
    '<div class="mrow"><span class="ml">build/</span><span class="mv '+szCls(m.buildSize)+'">'+fmtB(m.buildSize)+'</span><button class="ib" data-clean="build" title="Clean">'+IC.x+'</button></div>'+
    '<div class="mrow"><span class="ml">.dart_tool/</span><span class="mv '+szCls(m.dartToolSize)+'">'+fmtB(m.dartToolSize)+'</span><button class="ib" data-clean="dart_tool" title="Clean">'+IC.x+'</button></div>'+
    '<div class="hint">'+(m.buildSize+m.dartToolSize>524288000?'Large cache — clean if builds are slow or disk is low.':'Cache sizes normal.')+'</div></div>';
  h+='<div class="sec"><div class="sec-t">Platform Cache</div>'+
    '<div class="mrow"><span class="ml">iOS Pods</span><span class="mv '+szCls(m.iosPodsSize)+'">'+fmtB(m.iosPodsSize)+'</span><button class="ib" data-clean="pods" title="Clean">'+IC.x+'</button><button class="btn btn-s" data-act="pod-install" style="font-size:10px;padding:1px 6px">install</button></div>'+
    '<div class="mrow"><span class="ml">macOS Pods</span><span class="mv '+szCls(m.macosPodsSize)+'">'+fmtB(m.macosPodsSize)+'</span></div>'+
    '<div class="mrow"><span class="ml">Android Gradle</span><span class="mv">—</span><button class="btn btn-s" data-act="gradle-clean" style="font-size:10px;padding:1px 6px">clean</button></div>'+
    '<div class="hint">Clean Pods after Podfile changes. Gradle clean after build.gradle edits.</div></div>';
  h+='<div class="sec"><div class="sec-t">Pub Cache</div>'+
    '<div class="mrow"><span class="ml">~/.pub-cache</span><span class="mv '+szCls(m.pubCacheSize)+'">'+fmtB(m.pubCacheSize)+'</span></div>'+
    '<div class="mrow"><span class="ml">Outdated packages</span><span class="mv '+(m.outdatedCount<0?'':m.outdatedCount>0?'y':'g')+'" id="outdated-val">'+(m.outdatedCount<0?'...':m.outdatedCount)+'</span></div>'+
    '<div style="display:flex;gap:4px;margin-top:4px"><button class="btn btn-s" data-act="pub-get" style="font-size:10px">pub get</button>'+
    '<button class="btn btn-d" data-act="pub-cache-clean" style="font-size:10px">cache clean</button></div>'+
    '<div class="hint">'+(m.pubCacheSize>1073741824?'Pub cache exceeds 1GB — clean only if disk space is critical.':'Clean pub cache only when disk space is critical.')+'</div></div>';
  h+='<div class="sec"><div class="sec-t">Codegen · '+m.genFileCount+' generated files</div>';
  if(m.codegenScripts&&m.codegenScripts.length){
    h+=m.codegenScripts.map(function(s){
      return '<div class="tool-row"><span class="tn" style="cursor:default">'+E(s.name)+' <span class="td">'+E(s.desc)+'</span></span>'+
        '<span class="acts"><button class="ib" data-codegen="'+E(s.file)+'" title="Run">'+IC.play+'</button></span></div>';
    }).join('');
    h+='<div class="hint">Run incremental_codegen after changing .dart sources. build_runner_safe for full rebuild.</div>';
  }else{h+='<div style="opacity:.5;padding:4px">No codegen scripts in tool/codegen/</div>';}
  h+='</div>';
  h+='<div class="sec"><div class="sec-t">Full Reset</div><button class="btn btn-d" data-clean="all" style="font-size:11px">Full Reset (build + .dart_tool + Pods)</button></div>';
  h+='<div class="sec"><div class="sec-t">Processes</div><button class="ib" id="scan-procs-btn" title="Scan">'+IC.refresh+'</button>'+
    '<div id="procs-view" style="margin-top:4px;max-height:200px;overflow-y:auto"><div style="opacity:.5;padding:4px">Click scan to check</div></div></div>';
  h+='<div class="sec"><div class="sec-t">Assets</div><button class="ib" id="scan-assets-btn" title="Scan">'+IC.refresh+'</button>'+
    '<div id="assets-view" style="margin-top:4px;max-height:300px;overflow-y:auto"></div></div>';
  h+='<div class="sec"><div class="sec-t">Unused Detection</div><button class="ib" id="scan-unused-btn" title="Scan">'+IC.refresh+'</button>'+
    '<div id="unused-view" style="margin-top:4px;max-height:200px;overflow-y:auto"></div></div>';
  h+='<div class="sec"><div class="sec-t">Build Runner</div>'+
    '<div style="display:flex;gap:4px;align-items:center"><button class="btn btn-s" id="br-toggle" style="font-size:10px">Watch Toggle</button>'+
    '<span id="br-status" class="bg" style="font-size:9px">idle</span></div></div>';
  h+='<div class="sec"><div class="sec-t">Test Runner</div>'+
    '<div style="display:flex;gap:4px;flex-wrap:wrap">'+
    '<button class="btn btn-s" data-test="all" style="font-size:10px">All Tests</button>'+
    '<button class="btn btn-s" data-test="coverage" style="font-size:10px">Coverage</button></div></div>';
  h+='<div class="sec"><div class="sec-t">Build Size</div>'+
    '<button class="ib" id="scan-build-btn" title="Scan Build Sizes">'+IC.refresh+'</button>'+
    '<div id="build-size-view" style="margin-top:4px"></div></div>';
  h+='<div class="sec"><div class="sec-t">Performance Baseline</div>'+
    '<div style="display:flex;gap:4px"><button class="btn btn-s" id="perf-run" style="font-size:10px">Profile Run</button>'+
    '<button class="ib" id="perf-load" title="Load Baseline">'+IC.refresh+'</button></div>'+
    '<div id="perf-view" style="margin-top:4px"></div></div>';
  h+='<div class="sec"><div class="sec-t">Release Checklist</div>'+
    '<button class="ib" id="checklist-btn" title="Run Checklist">'+IC.refresh+'</button>'+
    '<div id="checklist-view" style="margin-top:4px"></div></div>';
  el.innerHTML=h;
  el.querySelectorAll('[data-clean]').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'cleanup',target:b.dataset.clean});});});
  el.querySelectorAll('[data-act]').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'runAction',action:b.dataset.act});});});
  el.querySelectorAll('[data-codegen]').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'runCodegen',file:b.dataset.codegen});});});
  var sp=document.getElementById('scan-procs-btn');if(sp)sp.addEventListener('click',function(){V.postMessage({type:'scanProcs'});});
  var sa=document.getElementById('scan-assets-btn');if(sa)sa.addEventListener('click',function(){V.postMessage({type:'scanAssets'});});
  var su=document.getElementById('scan-unused-btn');if(su)su.addEventListener('click',function(){V.postMessage({type:'scanUnused'});});
  var br=document.getElementById('br-toggle');if(br)br.addEventListener('click',function(){V.postMessage({type:'toggleBuildRunner'});});
  el.querySelectorAll('[data-test]').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'runTests',mode:b.dataset.test});});});
  var sb=document.getElementById('scan-build-btn');if(sb)sb.addEventListener('click',function(){V.postMessage({type:'scanBuildSizes'});});
  var pr=document.getElementById('perf-run');if(pr)pr.addEventListener('click',function(){V.postMessage({type:'runProfile'});});
  var pl=document.getElementById('perf-load');if(pl)pl.addEventListener('click',function(){V.postMessage({type:'getPerfBaseline'});});
  var cl=document.getElementById('checklist-btn');if(cl)cl.addEventListener('click',function(){V.postMessage({type:'getChecklist'});});
}
function renderProcs(m){
  var el=document.getElementById('procs-view');if(!el)return;
  var procs=m.procs||[];
  if(!procs.length){el.innerHTML='<div style="opacity:.5;padding:4px">No project processes found</div>';return;}
  el.innerHTML='<div style="font-size:10px;opacity:.4;padding:2px 0">'+procs.length+' processes</div>'+
    procs.map(function(p){
      var cpuF=parseFloat(p.cpu);var memF=parseFloat(p.mem);var warn=cpuF>50||memF>10;
      return '<div class="sr" style="'+(warn?'border-left:2px solid #f85149;padding-left:4px':'')+'">'+
        '<span class="l" style="font-size:10px;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+E(p.cmd)+'">'+
          '<span style="opacity:.4">PID '+p.pid+'</span> '+E(p.cmd.split('/').pop()||p.cmd)+'</span>'+
        '<span class="v" style="display:flex;gap:4px;align-items:center;font-size:10px">'+
          '<span class="bg '+(warn?'e':'ok')+'" style="font-size:9px">CPU '+E(p.cpu)+'%</span>'+
          '<span class="bg '+(memF>5?'w':'ok')+'" style="font-size:9px">MEM '+E(p.mem)+'%</span>'+
          '<button class="ib" data-kill="'+p.pid+'" title="Kill" style="color:#f85149">'+IC.x+'</button></span></div>';
    }).join('');
  el.querySelectorAll('[data-kill]').forEach(function(b){b.addEventListener('click',function(){b.innerHTML='...';b.disabled=true;V.postMessage({type:'killProc',pid:parseInt(b.dataset.kill)});});});
}
function renderAssets(m){
  var el=document.getElementById('assets-view');if(!el)return;
  var cats={};m.assets.forEach(function(a){if(!cats[a.category])cats[a.category]=[];cats[a.category].push(a);});
  el.innerHTML=Object.entries(cats).map(function(kv){
    var cat=kv[0],items=kv[1];var total=items.reduce(function(s,a){return s+a.sizeBytes;},0);
    return '<div class="cat-hdr">'+E(cat)+' ('+items.length+' files, '+fmtB(total)+')</div>'+
      items.map(function(a){return '<div class="asset-row"><span>'+E(a.name)+'</span><span class="sz">'+fmtB(a.sizeBytes)+'</span></div>';}).join('');
  }).join('');
}
function renderUnused(m){
  var el=document.getElementById('unused-view');if(!el)return;
  var h='';
  if(m.unused&&m.unused.length)h+='<div class="cat-hdr">Unused Assets ('+m.unused.length+')</div>'+m.unused.map(function(u){return '<div class="asset-row"><span>'+E(u)+'</span></div>';}).join('');
  if(m.unusedScripts&&m.unusedScripts.length)h+='<div class="cat-hdr">Unused Scripts ('+m.unusedScripts.length+')</div>'+m.unusedScripts.map(function(s){return '<div class="asset-row"><span>'+E(s)+'</span></div>';}).join('');
  if(!h)h='<div style="opacity:.5;padding:4px">No unused files found.</div>';
  el.innerHTML=h;
}
function renderBuildSizes(m){
  var el=document.getElementById('build-size-view');if(!el)return;
  var h='';
  var results=m.results||[];
  if(results.length){
    h+='<div style="font-size:10px;opacity:.4;padding:2px 0">Current builds</div>';
    h+=results.map(function(r){return '<div class="sr"><span class="l">'+E(r.platform)+'</span><span class="v">'+fmtB(r.sizeBytes)+'</span></div>';}).join('');
  }
  var history=m.history||[];
  if(history.length){
    h+='<div style="font-size:10px;opacity:.4;padding:4px 0 2px">History (last '+history.length+')</div>';
    h+=history.slice().reverse().map(function(r){
      var d=new Date(r.timestamp);var ds=d.getMonth()+1+'/'+d.getDate()+' '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');
      return '<div class="sr"><span class="l" style="font-size:10px">'+E(r.platform)+' <span style="opacity:.4">'+ds+'</span></span><span class="v" style="font-size:10px">'+fmtB(r.sizeBytes)+'</span></div>';
    }).join('');
  }
  if(!h)h='<div style="opacity:.5;padding:4px">No build outputs found. Run flutter build first.</div>';
  el.innerHTML=h;
}
function renderPerfBaseline(m){
  var el=document.getElementById('perf-view');if(!el)return;
  var history=m.history||[];
  if(!history.length){el.innerHTML='<div style="opacity:.5;padding:4px">No performance data. Run profile and record metrics.</div>';return;}
  el.innerHTML='<div style="font-size:10px;opacity:.4;padding:2px 0">Frame time / Memory (last '+history.length+')</div>'+
    history.slice().reverse().map(function(r){
      var d=new Date(r.timestamp);var ds=d.getMonth()+1+'/'+d.getDate();
      var ftCls=r.frameTimeMs>16?'r':r.frameTimeMs>8?'y':'g';
      return '<div class="sr"><span class="l" style="font-size:10px">'+ds+'</span><span class="v" style="font-size:10px;display:flex;gap:6px">'+
        '<span class="mv '+ftCls+'">'+r.frameTimeMs.toFixed(1)+'ms</span>'+
        '<span class="mv">'+r.memoryMb.toFixed(0)+'MB</span></span></div>';
    }).join('');
}
function renderChecklist(m){
  var el=document.getElementById('checklist-view');if(!el)return;
  var checks=m.checks||[];
  if(!checks.length){el.innerHTML='<div style="opacity:.5;padding:4px">Click refresh to run checklist.</div>';return;}
  var icons={ok:'<span class="bg ok" style="font-size:9px">PASS</span>',warn:'<span class="bg w" style="font-size:9px">WARN</span>',fail:'<span class="bg e" style="font-size:9px">FAIL</span>'};
  el.innerHTML=checks.map(function(c){
    return '<div class="sr"><span class="l" style="font-size:11px">'+E(c.label)+'</span><span class="v" style="display:flex;align-items:center;gap:4px">'+(icons[c.status]||'')+
      '<span style="font-size:9px;opacity:.5;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+E(c.detail)+'">'+E(c.detail)+'</span></span></div>';
  }).join('');
}
`;
