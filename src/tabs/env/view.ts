export const envJs = `
var _envDeletes=new Set();
function renderEnv(){
  var el=document.getElementById('env-tabs');
  var files=D.envFiles||[];
  if(!files.length){el.innerHTML='<div style="opacity:.5;padding:8px;font-size:11px">No env/config files found</div>';return;}
  var groups={};
  files.forEach(function(f){
    var dir=f.indexOf('/')!==-1?f.substring(0,f.lastIndexOf('/')):'.';
    if(!groups[dir])groups[dir]=[];
    groups[dir].push(f);
  });
  var pending=_envDeletes.size;
  var h='<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;justify-content:flex-end">'+
    '<button class="ib ib-p" id="env-save" title="Save"'+(pending?'':' disabled')+'>'+IC.save+(pending?' <span style="font-size:10px">'+pending+'</span>':'')+'</button>'+
    '<button class="ib" id="env-cancel" title="Cancel">'+IC.x+'</button></div>';
  Object.keys(groups).sort().forEach(function(dir){
    h+='<div style="font-size:10px;opacity:.4;padding:4px 0 2px;width:100%">'+E(dir)+'/</div>';
    h+='<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:2px">';
    groups[dir].forEach(function(f){
      var name=f.substring(f.lastIndexOf('/')+1);
      var isShared=name==='shared.json';
      var marked=_envDeletes.has(f);
      var del=!isShared?'<span class="env-del" data-del="'+E(f)+'" style="margin-left:3px;opacity:'+(marked?'1':'.4')+';cursor:pointer;color:'+(marked?'#f85149':'inherit')+'">'+(marked?'✓':'×')+'</span>':'';
      h+='<button class="'+(f===envFile?'active':'')+'" data-e="'+E(f)+'" style="'+(marked?'opacity:.4;text-decoration:line-through':'')+'">'+E(name.replace(/\\.json$/,''))+del+'</button>';
    });
    h+='</div>';
  });
  h+='<button class="env-add" style="border-style:dashed;opacity:.6;margin-top:4px">'+IC.plus+'</button>';
  el.innerHTML=h;
  el.querySelectorAll('[data-e]').forEach(function(b){b.addEventListener('click',function(e){
    if(e.target.classList.contains('env-del'))return;
    envFile=b.dataset.e;envData=null;renderEnv();
    document.getElementById('cfg-form').innerHTML='<div style="opacity:.5;padding:8px">Loading...</div>';
    V.postMessage({type:'loadEnv',fileName:envFile});
  });});
  el.querySelectorAll('.env-del').forEach(function(x){x.addEventListener('click',function(e){
    e.stopPropagation();
    var f=x.dataset.del;
    if(_envDeletes.has(f))_envDeletes.delete(f);else _envDeletes.add(f);
    renderEnv();
  });});
  var addBtn=el.querySelector('.env-add');
  if(addBtn)addBtn.addEventListener('click',function(){V.postMessage({type:'promptCreateEnv'});});
  var es=document.getElementById('env-save');
  if(es)es.addEventListener('click',function(){
    _envDeletes.forEach(function(f){V.postMessage({type:'deleteEnv',fileName:f});});
    if(envFile&&_envDeletes.has(envFile)){envFile='';envData=null;}
    _envDeletes.clear();
    V.postMessage({type:'refresh'});
  });
  var ec=document.getElementById('env-cancel');
  if(ec)ec.addEventListener('click',function(){
    _envDeletes.clear();renderEnv();
    if(envData)renderCfg();
  });
  if(!envFile&&files.length>0){envFile=files[0];V.postMessage({type:'loadEnv',fileName:envFile});}
  var da=document.getElementById('diff-a'),db=document.getElementById('diff-b');
  if(da&&db){
    var opts=files.map(function(f){return '<option value="'+E(f)+'">'+E(f)+'</option>';}).join('');
    da.innerHTML=opts;db.innerHTML=opts;
    if(files.length>1)db.selectedIndex=1;
    var diffBtn=document.getElementById('diff-btn');
    if(diffBtn)diffBtn.onclick=function(){V.postMessage({type:'diffEnv',fileA:da.value,fileB:db.value});};
  }
}
function renderCfg(){
  var el=document.getElementById('cfg-form');
  if(!envData){el.innerHTML='<div style="opacity:.5;padding:8px">Select a file</div>';return;}
  var entries=Object.entries(envData);
  if(!entries.length){el.innerHTML='<div style="opacity:.5;padding:8px">No config entries</div>';return;}
  var baseName=envFile.substring(envFile.lastIndexOf('/')+1).replace(/\\.json$/,'');
  el.innerHTML='<div style="font-size:11px;opacity:.5;padding:2px 0 6px"><span class="file-link" data-open="'+E(envFile)+'" style="cursor:pointer;text-decoration:underline dotted">'+E(envFile)+'</span></div>'+
    entries.map(function(kv){
      var k=kv[0],sv=String(kv[1]);
      var sec=/key|token|secret|pass/i.test(k);
      var typeInfo=envTypes&&envTypes[k]?envTypes[k]:null;
      var h='<div class="env-var" style="border:1px solid var(--ib);border-radius:4px;margin-bottom:4px;overflow:hidden">';
      h+='<div class="env-var-hdr" style="display:flex;align-items:center;gap:4px;padding:5px 8px;background:var(--ibg);cursor:pointer;font-size:11px;font-weight:600;user-select:none">'+
        '<span class="arrow open" style="opacity:.4;transition:transform .15s">'+IC.chev+'</span>'+E(k)+
        (typeInfo?'<span class="bg b" style="font-size:8px;margin-left:4px">'+E(typeInfo.type)+'</span>':'')+'</div>';
      if(typeInfo&&!typeInfo.valid)h+='<div style="font-size:9px;color:#f85149;padding:1px 0 1px 20px">⚠ '+E(typeInfo.hint)+'</div>';
      h+='<div class="env-var-body" style="padding:6px 8px">';
      if(sv==='true'||sv==='false'){
        h+='<label class="sw"><input type="checkbox" data-k="'+E(k)+'" data-orig="'+E(sv)+'"'+(sv==='true'?' checked':'')+'><span class="sl"></span></label>';
      }else{
        h+='<input type="'+(sec?'password':'text')+'" data-k="'+E(k)+'" data-orig="'+E(sv)+'" value="'+E(sv)+'" style="width:100%;padding:4px 6px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px;box-sizing:border-box">';
      }
      h+='</div></div>';
      return h;
    }).join('')+
    '<div style="display:flex;gap:4px;margin-top:6px;justify-content:flex-end">'+
    '<button class="ib ib-p" id="save-cfg" title="Save">'+IC.save+'</button>'+
    '<button class="ib" id="cancel-cfg" title="Cancel">'+IC.x+'</button>'+
    '<button class="btn" id="run-cfg" style="background:#3fb950;color:#000;font-size:11px">Run ▶ ('+E(baseName)+')</button></div>';
  el.querySelectorAll('.env-var-hdr').forEach(function(hdr){hdr.addEventListener('click',function(){
    var body=hdr.nextElementSibling;var arrow=hdr.querySelector('.arrow');
    if(body.style.display==='none'){body.style.display='block';if(arrow)arrow.classList.add('open');}
    else{body.style.display='none';if(arrow)arrow.classList.remove('open');}
  });});
  document.getElementById('run-cfg').addEventListener('click',function(){V.postMessage({type:'composeRun',target:baseName});});
  document.getElementById('save-cfg').addEventListener('click',function(){
    el.querySelectorAll('[data-k]').forEach(function(i){
      var v=i.type==='checkbox'?(i.checked?'true':'false'):i.value;
      V.postMessage({type:'saveConfig',filePath:envFile,key:i.dataset.k,value:v});
    });
  });
  document.getElementById('cancel-cfg').addEventListener('click',function(){
    el.querySelectorAll('[data-k]').forEach(function(i){
      var orig=i.dataset.orig;
      if(i.type==='checkbox')i.checked=orig==='true';
      else i.value=orig;
    });
  });
  el.querySelectorAll('.file-link').forEach(function(l){l.addEventListener('click',function(){V.postMessage({type:'openFile',file:l.dataset.open});});});
}
function renderEnvDiff(m){
  var el=document.getElementById('env-diff-view');if(!el)return;
  var rows=m.rows||[];
  if(!rows.length){el.innerHTML='<div style="opacity:.5;padding:4px">Select two files to compare.</div>';return;}
  var nameA=m.fileA.split('/').pop();var nameB=m.fileB.split('/').pop();
  var h='<div style="display:flex;font-size:10px;opacity:.5;padding:2px 0;border-bottom:1px solid var(--ib)"><span style="flex:1">Key</span><span style="width:80px;text-align:center">'+E(nameA)+'</span><span style="width:80px;text-align:center">'+E(nameB)+'</span></div>';
  h+=rows.map(function(r){
    var bg=!r.inA?'background:rgba(248,81,73,.1);':!r.inB?'background:rgba(248,81,73,.1);':!r.same?'background:rgba(210,153,34,.1);':'';
    return '<div style="display:flex;font-size:10px;padding:2px 0;border-bottom:1px solid var(--ib);'+bg+'">'+
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E(r.key)+(!r.inA?' <span style="color:#f85149;font-size:8px">missing</span>':!r.inB?' <span style="color:#f85149;font-size:8px">missing</span>':'')+'</span>'+
      '<span style="width:80px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:'+(r.inA?'.8':'.3')+'">'+(r.valA!==null?E(r.valA):'—')+'</span>'+
      '<span style="width:80px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:'+(r.inB?'.8':'.3')+'">'+(r.valB!==null?E(r.valB):'—')+'</span></div>';
  }).join('');
  el.innerHTML=h;
}
`;
