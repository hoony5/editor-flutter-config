export const statusJs = `
function renderStatus(){
  var el=document.getElementById('status-c');
  if(!statusData){el.innerHTML='<div style="opacity:.5;padding:8px">Loading status...</div>';return;}
  var v=statusData.versions||{};var g=statusData.git||{};
  var devs=statusData.devices||[];var sims=statusData.simulators||[];
  var pinMatch=!v.pinned||v.flutter===v.pinned;
  var h='<div style="display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap">'+
    '<button class="ib" id="st-refresh" title="Refresh">'+IC.refresh+'</button>'+
    '<button class="btn" data-act="flutter-upgrade" style="font-size:10px">Upgrade</button>'+
    '<button class="btn btn-s" data-act="devtools" style="font-size:10px">DevTools</button>'+
    '<button class="btn btn-s" data-act="flutter-logs" style="font-size:10px">Logs</button>'+
    '<button class="btn btn-s" data-act="doctor" style="font-size:10px">Doctor</button></div>';
  h+='<div class="sec"><div class="sec-t">SDK Versions</div>'+
    '<div class="sr"><span class="l">Flutter</span><span class="v">'+E(v.flutter||'?')+' <span style="opacity:.4;font-size:10px">'+E(v.channel||'')+'</span></span></div>'+
    '<div class="sr"><span class="l">Dart</span><span class="v">'+E(v.dart||'?')+'</span></div>'+
    '<div class="sr"><span class="l">Java</span><span class="v">'+E(v.java||'?')+'</span></div>'+
    '<div class="sr"><span class="l">JAVA_HOME</span><span class="v" style="font-size:10px;max-width:55%;overflow:hidden;text-overflow:ellipsis">'+E(v.javaHome||'?')+'</span></div>'+
    '<div class="sr"><span class="l">Pinned (.fvmrc)</span><span class="v">'+(v.pinned?'<span class="bg '+(pinMatch?'ok':'w')+'">'+E(v.pinned)+(pinMatch?'':' ≠ '+E(v.flutter))+'</span>':'<span class="bg w">none</span>')+'</span></div>';
  if(v.jdks&&v.jdks.length){h+='<div style="font-size:10px;opacity:.5;padding:2px 0">Installed JDKs:</div>'+v.jdks.map(function(j){return '<div class="sr" style="padding-left:8px"><span class="l" style="font-size:10px;opacity:.6">'+E(j)+'</span></div>';}).join('');}
  h+='</div>';
  h+='<div class="sec"><div class="sec-t">Runtime</div>'+
    '<div class="sr"><span class="l">Flutter Daemon</span><span class="bg '+(statusData.daemonRunning?'ok':'w')+'">'+(statusData.daemonRunning?'Running':'Stopped')+'</span></div>'+
    '<div class="sr"><span class="l">Devices</span><span class="bg '+(devs.length>0?'ok':'w')+'">'+devs.length+' connected</span></div>';
  if(devs.length)h+=devs.map(function(d){return '<div class="sr" style="padding-left:10px"><span class="l" style="opacity:.6">'+E(d.name)+'</span><span class="v" style="font-size:10px;opacity:.5">'+E(d.id)+' · '+E(d.platform)+'</span></div>';}).join('');
  h+='</div>';
  var booted=sims.filter(function(s){return s.state==='Booted';});
  var shutdown=sims.filter(function(s){return s.state==='Shutdown';});
  h+='<div class="sec"><div class="sec-t">Simulators ('+sims.length+')</div>';
  if(booted.length)h+=booted.map(function(s){return '<div class="sr"><span class="l">'+E(s.name)+' <span style="opacity:.4;font-size:9px">'+E(s.runtime)+'</span></span><span class="v" style="display:flex;gap:2px"><span class="bg ok" style="font-size:9px">Booted</span><button class="btn btn-s" style="font-size:9px;padding:1px 4px" data-sim="shutdown" data-udid="'+E(s.udid)+'">Stop</button><button class="btn btn-s" style="font-size:9px;padding:1px 4px" data-sim="screenshot" data-udid="'+E(s.udid)+'">📷</button></span></div>';}).join('');
  if(shutdown.length){
    h+=shutdown.slice(0,8).map(function(s){return '<div class="sr"><span class="l" style="opacity:.5">'+E(s.name)+' <span style="opacity:.3;font-size:9px">'+E(s.runtime)+'</span></span><span class="v"><button class="btn btn-s" style="font-size:9px;padding:1px 4px" data-sim="boot" data-udid="'+E(s.udid)+'">Boot</button></span></div>';}).join('');
    if(shutdown.length>8)h+='<div style="font-size:10px;opacity:.4;padding:2px">... +'+(shutdown.length-8)+' more</div>';
  }
  if(!sims.length)h+='<div style="opacity:.5;padding:4px">No simulators (macOS only)</div>';
  h+='</div>';
  h+='<div class="sec"><div class="sec-t">Git</div>'+
    '<div class="sr"><span class="l">Branch</span><span class="v">'+E(g.branch||'-')+'</span></div>'+
    '<div class="sr"><span class="l">Uncommitted</span><span class="bg '+((g.dirty||0)>0?'w':'ok')+'">'+(g.dirty||0)+' files</span></div>'+
    '<div class="sr"><span class="l">Last Commit</span><span class="v" style="font-size:11px;opacity:.7">'+E(g.lastCommit||'-')+'</span></div></div>';
  h+='<div class="sec"><div class="sec-t">Disk</div>'+
    '<div class="sr"><span class="l">build/</span><span class="v">'+fmtB(statusData.buildSize||0)+'</span></div>'+
    '<div class="sr"><span class="l">.dart_tool/</span><span class="v">'+fmtB(statusData.dartToolSize||0)+'</span></div></div>';
  el.innerHTML=h;
  var rb=document.getElementById('st-refresh');
  if(rb)rb.addEventListener('click',function(){statusData=null;el.innerHTML='<div style="opacity:.5;padding:8px">Refreshing...</div>';V.postMessage({type:'loadStatus'});});
  el.querySelectorAll('[data-act]').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'runAction',action:b.dataset.act});});});
  el.querySelectorAll('[data-sim]').forEach(function(b){b.addEventListener('click',function(){
    statusData=null;el.innerHTML='<div style="opacity:.5;padding:8px">Processing...</div>';
    V.postMessage({type:'simAction',action:b.dataset.sim,udid:b.dataset.udid});
  });});
}
`;
