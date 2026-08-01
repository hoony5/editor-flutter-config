export const storageJs = `
var storageData=null;
function renderStorage(){
  var el=document.getElementById('storage-c');
  if(!storageData){el.innerHTML='<div style="opacity:.5;padding:8px">Loading storage...</div>';return;}
  var d=storageData;
  var platLabel=d.hostPlatform==='darwin'?'macOS':d.hostPlatform==='win32'?'Windows':'Linux';
  var h='<div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap;align-items:center">'+
    '<button class="ib" id="sto-refresh" title="Refresh">'+IC.refresh+'</button>'+
    '<span class="bg" style="font-size:9px">'+E(platLabel)+'</span>'+
    (d.adbAvailable?'<span class="bg ok" style="font-size:9px">ADB</span>':'<span class="bg w" style="font-size:9px">ADB</span>')+
    (d.hostPlatform==='darwin'?(d.simctlAvailable?'<span class="bg ok" style="font-size:9px">Simctl</span>':'<span class="bg w" style="font-size:9px">Simctl</span>'):'')+
    '</div>';

  h+='<div class="sec"><div class="sec-t">App Identity</div>'+
    '<div class="sr"><span class="l">applicationId</span><span class="v" style="font-size:10px">'+(d.applicationId?E(d.applicationId):'<span class="bg w">not set</span>')+'</span></div>'+
    '<div class="sr"><span class="l">bundleId</span><span class="v" style="font-size:10px">'+(d.bundleId?E(d.bundleId):'<span class="bg w">not set</span>')+'</span></div>'+
    (d.connectedDevice?'<div class="sr"><span class="l">Device</span><span class="v" style="font-size:10px">'+E(d.connectedDevice)+'</span></div>':'')+
    (d.bootedSimUdid?'<div class="sr"><span class="l">Booted Sim</span><span class="v" style="font-size:10px">'+E(d.bootedSimUdid.slice(0,8))+'...</span></div>':'')+
    '</div>';

  if(!d.locations.length){
    h+='<div style="opacity:.5;padding:12px;font-size:11px;line-height:1.6">No accessible storage locations.<br>Connect a device or boot a simulator.</div>';
    el.innerHTML=h;bindStorage(el);return;
  }

  d.locations.forEach(function(loc,i){
    var dim=loc.accessible?'':'opacity:.4;';
    h+='<div class="sec" style="'+dim+'"><div class="sec-t" style="display:flex;justify-content:space-between;align-items:center">'+
      '<span>'+E(loc.label)+' <span style="opacity:.4;font-size:9px">('+loc.files.length+')</span></span>'+
      '<span style="display:flex;gap:2px">'+
      (loc.accessible?'<button class="ib" data-open-path="'+E(loc.path)+'" title="Open in Finder/Explorer" style="font-size:10px">📂</button>':'')+
      '<button class="ib" data-test="'+i+'" title="Write/Read Test" style="font-size:10px">🧪</button>'+
      '</span></div>';
    h+='<div style="font-size:9px;opacity:.4;padding:0 0 4px;word-break:break-all">'+E(loc.path)+'</div>';
    if(loc.files.length){
      h+='<div style="max-height:160px;overflow-y:auto">';
      loc.files.forEach(function(f){
        var catColor=f.category==='db'?'#a78bfa':f.category==='media'?'#34d399':f.category==='download'?'#fbbf24':f.category==='cache'?'#6b7280':'#9ca3af';
        h+='<div class="sr" style="padding:2px 0"><span class="l" style="font-size:10px;display:flex;align-items:center;gap:3px">'+
          '<span style="width:6px;height:6px;border-radius:50%;background:'+catColor+';display:inline-block"></span>'+
          E(f.name)+'</span>'+
          '<span class="v" style="font-size:9px;opacity:.6">'+fmtB(f.size)+' · '+E(f.modified)+'</span></div>';
      });
      h+='</div>';
    } else if(loc.accessible){
      h+='<div style="font-size:10px;opacity:.4;padding:2px 0">Empty</div>';
    } else {
      h+='<div style="font-size:10px;opacity:.4;padding:2px 0">Not accessible</div>';
    }
    h+='</div>';
  });

  h+='<div class="sec"><div class="sec-t">Legend</div>'+
    '<div style="display:flex;gap:8px;font-size:9px;opacity:.6;flex-wrap:wrap">'+
    '<span><span style="color:#a78bfa">●</span> DB</span>'+
    '<span><span style="color:#34d399">●</span> Media</span>'+
    '<span><span style="color:#fbbf24">●</span> Download</span>'+
    '<span><span style="color:#6b7280">●</span> Cache</span>'+
    '<span><span style="color:#9ca3af">●</span> Other</span></div></div>';

  h+='<div id="sto-result" style="margin-top:4px"></div>';
  el.innerHTML=h;
  bindStorage(el);
}
function bindStorage(el){
  var rb=document.getElementById('sto-refresh');
  if(rb)rb.addEventListener('click',function(){storageData=null;el.innerHTML='<div style="opacity:.5;padding:8px">Refreshing...</div>';V.postMessage({type:'loadStorage'});});
  el.querySelectorAll('[data-test]').forEach(function(b){b.addEventListener('click',function(){
    var idx=parseInt(b.dataset.test);
    var loc=storageData.locations[idx];
    if(!loc)return;
    var res=document.getElementById('sto-result');
    if(res)res.innerHTML='<div style="font-size:10px;opacity:.6;padding:4px">Testing write/read at '+E(loc.label)+'...</div>';
    if(loc.path.startsWith('/data/data/')){
      V.postMessage({type:'testDownloadAdb',path:loc.path});
    }else{
      V.postMessage({type:'testDownload',path:loc.path});
    }
  });});
  el.querySelectorAll('[data-open-path]').forEach(function(b){b.addEventListener('click',function(){
    V.postMessage({type:'openStoragePath',path:b.dataset.openPath});
  });});
}
function renderDownloadTest(m){
  var res=document.getElementById('sto-result');
  if(!res)return;
  if(m.success){
    res.innerHTML='<div style="background:rgba(52,211,153,.1);border:1px solid #34d399;border-radius:3px;padding:6px 8px;font-size:10px;color:#34d399">'+
      '✓ Write/Read OK — '+m.elapsedMs+'ms<br><span style="opacity:.6;word-break:break-all">'+E(m.path)+'</span></div>';
  }else{
    res.innerHTML='<div style="background:rgba(248,81,73,.1);border:1px solid #f85149;border-radius:3px;padding:6px 8px;font-size:10px;color:#f85149">'+
      '✗ Failed — '+m.elapsedMs+'ms<br><span style="opacity:.8">'+E(m.error||'unknown')+'</span></div>';
  }
}
`;
