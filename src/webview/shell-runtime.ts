export const shellRuntimeJs = `
var V=acquireVsCodeApi();
var D=null,envFile='',envData=null,envTypes=null,statusData=null,platData=null,permState={ios:[],android:[],macos:[]},pubDeps=[],permUsage=[],platTab='ios',expTool=null,manageData=null,pubspecData=null,storageData=null;
var _platEdits={},_platSearch='',_platCat='Permissions',_platSub='ios',_platAdds=[],_platRemoves=new Set();
var _permEdits=[],_expCats=new Set(),_expPerms=new Set();
var _origDeps=[],_stagedAdds=[],_depPage=0,_depSearch='',_DEP_PER=20;
var _envDeletes=new Set();
var _prevScale=1,_panelCollapsed=false;
var _codegenData=null;

document.getElementById('refresh-btn').innerHTML=IC.refresh;
document.getElementById('ps-save').innerHTML=IC.save;
document.getElementById('dep-save').innerHTML=IC.save;
document.getElementById('dep-cancel').innerHTML=IC.x;
document.getElementById('dep-add-btn').innerHTML=IC.plus;

document.querySelectorAll('.tab').forEach(function(t){t.addEventListener('click',function(){
  document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');});
  document.querySelectorAll('.p').forEach(function(x){x.classList.remove('active');});
  t.classList.add('active');document.getElementById('p-'+t.dataset.t).classList.add('active');
  if(t.dataset.t==='pubspec')V.postMessage({type:'readPubspec'});
  if(t.dataset.t==='lint')V.postMessage({type:'readLintRules'});
  if(t.dataset.t==='tools')V.postMessage({type:'loadTools'});
  if(t.dataset.t==='status'&&!statusData)V.postMessage({type:'loadStatus'});
  if(t.dataset.t==='platform'&&!platData)V.postMessage({type:'loadPlatform'});
  if(t.dataset.t==='manage'&&!manageData)V.postMessage({type:'loadManage'});
  if(t.dataset.t==='env'&&!envFile)V.postMessage({type:'refresh'});
  if(t.dataset.t==='router')V.postMessage({type:'scanRoutes'});
  if(t.dataset.t==='codegen')V.postMessage({type:'scanCodegen'});
  if(t.dataset.t==='storage'&&!storageData)V.postMessage({type:'loadStorage'});
});});
document.getElementById('refresh-btn').addEventListener('click',function(){statusData=null;manageData=null;storageData=null;V.postMessage({type:'refresh'});});

window.addEventListener('message',function(e){
  var m=e.data;
  try{if(m.type==='data'){D=m;pubspecData=m.pubspec||null;render();}}catch(err){console.error('data:',err);}
  try{if(m.type==='toolsData'){if(D)D.scannedTools=m.scannedTools;renderTools();}}catch(err){console.error('tools:',err);}
  try{if(m.type==='envData'){envData=m.data;envTypes=m.types||null;renderCfg();}}catch(err){console.error('envData:',err);}
  try{if(m.type==='status'){statusData=m;renderStatus();}}catch(err){console.error('status:',err);}
  try{if(m.type==='platformConfig'){platData=m.platforms;permState=m.permState||{ios:[],android:[],macos:[]};pubDeps=m.pubDeps||[];permUsage=m.permUsage||[];renderPlatform();}}catch(err){console.error('platform:',err);}
  try{if(m.type==='manageInfo'){manageData=m;renderManage(m);}}catch(err){console.error('manage:',err);}
  try{if(m.type==='outdatedCount'&&manageData){manageData.outdatedCount=m.count;var oc=document.getElementById('outdated-val');if(oc){oc.textContent=m.count;oc.className='mv '+(m.count>0?'y':'g');}}}catch(err){console.error('outdated:',err);}
  try{if(m.type==='assets'){renderAssets(m);}}catch(err){console.error('assets:',err);}
  try{if(m.type==='unused'){renderUnused(m);}}catch(err){console.error('unused:',err);}
  try{if(m.type==='pubspec'){pubspecData=m;renderPubspec(m);}}catch(err){console.error('pubspec:',err);}
  try{if(m.type==='lintRules'){renderLint(m);}}catch(err){console.error('lint:',err);}
  try{if(m.type==='procs'){renderProcs(m);}}catch(err){console.error('procs:',err);}
  try{if(m.type==='buildRunnerStatus'){var bs=document.getElementById('br-status');if(bs){bs.textContent=m.running?'running':'idle';bs.className='bg '+(m.running?'ok':'');}}}catch(err){console.error('buildRunner:',err);}
  try{if(m.type==='buildSizes'){renderBuildSizes(m);}}catch(err){console.error('buildSizes:',err);}
  try{if(m.type==='perfBaseline'){renderPerfBaseline(m);}}catch(err){console.error('perf:',err);}
  try{if(m.type==='checklist'){renderChecklist(m);}}catch(err){console.error('checklist:',err);}
  try{if(m.type==='envDiff'){renderEnvDiff(m);}}catch(err){console.error('envDiff:',err);}
  try{if(m.type==='assetOptimization'){renderAssetOpt(m);}}catch(err){console.error('assetOpt:',err);}
  try{if(m.type==='assetPreview'){renderAssetPreview(m);}}catch(err){console.error('assetPreview:',err);}
  try{if(m.type==='routes'){renderRoutes(m);}}catch(err){console.error('routes:',err);}
  try{if(m.type==='codegenStatus'){renderCodegen(m);}}catch(err){console.error('codegen:',err);}
  try{if(m.type==='buildYamlError'){var byv=document.getElementById('build-yaml-view');if(byv)byv.innerHTML='<div style="color:#f85149;font-size:10px">'+E(m.error)+'</div>';}}catch(err){console.error('buildYamlError:',err);}
  try{if(m.type==='buildYamlSaved'){V.postMessage({type:'scanCodegen'});}}catch(err){console.error('buildYamlSaved:',err);}
  try{if(m.type==='fileChanged'){platData=null;V.postMessage({type:'loadPlatform'});}}catch(err){console.error('fileChanged:',err);}
  try{if(m.type==='storageInfo'){storageData=m;renderStorage();}}catch(err){console.error('storage:',err);}
  try{if(m.type==='downloadTest'){renderDownloadTest(m);}}catch(err){console.error('downloadTest:',err);}
});

function render(){if(!D)return;try{renderEnv();}catch(e){console.error('renderEnv:',e);}try{renderTools();}catch(e){console.error('renderTools:',e);}V.postMessage({type:'loadPlatform'});}
`;
