export const toolsJs = `
var _loopTool=null;
function renderTools(){
  var el=document.getElementById('tools-list');
  var manifestTools=D&&D.manifest?D.manifest.tools||[]:[];
  var manifestCats=D&&D.manifest?D.manifest.categories||[]:[];
  var scanned=D?D.scannedTools||[]:[];
  if(!manifestTools.length&&!scanned.length){
    el.innerHTML='<div style="opacity:.5;padding:12px;font-size:11px;line-height:1.6">No registered tools.<br>Add scripts to <code>tool/*</code> to get started.</div>';
    return;
  }
  var h='';
  if(manifestTools.length){
    h+=manifestCats.map(function(c){
      var ct=manifestTools.filter(function(t){return t.category===c.id;});
      if(!ct.length)return '';
      return '<div class="sec"><div class="sec-t">'+E(c.name)+'</div>'+ct.map(function(t){
        var hi=t.inputs&&t.inputs.length>0;var ex=expTool===t.id;
        var b='<div class="tool-row"><span class="tn" data-tool="'+E(t.id)+'">'+E(t.name)+' <span class="td">'+E(t.description)+'</span></span>'+
          '<span class="acts"><button class="ib run-t" data-tool="'+E(t.id)+'" title="Run">'+IC.play+'</button>'+
          '<button class="ib loop-t" data-tool="'+E(t.id)+'" title="Repeat">'+IC.loop+'</button></span></div>';
        if(_loopTool===t.id){
          b+='<div class="ti" style="display:flex;gap:4px;align-items:center">'+
            '<input type="number" class="loop-val" value="60" min="1" style="width:50px;padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:2px">'+
            '<select class="loop-unit" style="padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:2px"><option value="1">sec</option><option value="60">min</option></select>'+
            '<button class="ib loop-run" data-tool="'+E(t.id)+'" title="Start">'+IC.play+'</button></div>';
        }
        if(hi&&ex){
          b+='<div class="ti">';
          t.inputs.forEach(function(i){
            b+='<div class="f"><label>'+E(i.name)+'</label>';
            if(i.type==='select')b+='<select data-i="'+E(i.name)+'">'+(i.options||[]).map(function(o){return '<option value="'+E(o)+'"'+(o===i.default?' selected':'')+'>'+E(o)+'</option>';}).join('')+'</select>';
            else b+='<input type="'+(i.type==='password'?'password':'text')+'" data-i="'+E(i.name)+'" value="'+E(i.default||'')+'" placeholder="'+E(i.placeholder||'')+'">';
            b+='</div>';
          });
          b+='</div>';
        }
        return b;
      }).join('')+'</div>';
    }).join('');
  }
  if(scanned.length){
    var groups={};
    scanned.forEach(function(t){if(!groups[t.group])groups[t.group]=[];groups[t.group].push(t);});
    h+='<div class="sec"><div class="sec-t">Scanned Scripts ('+scanned.length+')</div>';
    Object.keys(groups).forEach(function(g){
      var items=groups[g];var readme=items[0]&&items[0].readme;var readmeContent=items[0]&&items[0].readmeContent||'';
      var langs=[...new Set(items.map(function(t){return t.lang;}))];
      h+='<div class="tool-acc" style="border:1px solid var(--ib);border-radius:4px;margin-bottom:4px;overflow:hidden">';
      h+='<div class="tool-acc-hdr" data-group="'+E(g)+'" style="display:flex;align-items:center;gap:4px;padding:5px 8px;background:var(--ibg);cursor:pointer;font-size:11px;font-weight:600;user-select:none">'+
        '<span class="arrow" style="opacity:.4;transition:transform .15s">'+IC.chev+'</span>'+
        E(g)+'/ <span style="opacity:.5;font-weight:400">'+items.length+' scripts</span>'+
        '<span style="margin-left:auto;display:flex;gap:2px">'+langs.map(function(l){return '<span class="bg b" style="font-size:8px">'+E(l)+'</span>';}).join('')+'</span></div>';
      h+='<div class="tool-acc-body" style="display:none;padding:6px 8px">';
      if(readmeContent){
        h+='<div style="font-size:10px;opacity:.6;margin-bottom:6px;padding:4px 6px;background:var(--ibg);border-radius:3px;white-space:pre-wrap;max-height:120px;overflow-y:auto">'+E(readmeContent)+'</div>';
      }
      h+=items.map(function(t){
        var dim=t.available?'':'opacity:.35;';
        var row='<div class="tool-row" style="'+dim+'">'+
          '<span class="tn" style="cursor:default">'+E(t.file.split('/').pop())+'</span>'+
          '<span class="td"><span class="bg '+(t.available?'b':'e')+'" style="font-size:9px">'+E(t.lang)+'</span></span>'+
          '<span class="acts">'+(t.available?'<button class="ib" data-scan="'+E(t.file)+'" data-rt="'+E(t.runtime)+'" title="Run">'+IC.play+'</button><button class="ib" data-scanloop="'+E(t.file)+'" data-rt="'+E(t.runtime)+'" title="Repeat">'+IC.loop+'</button>':'')+'</span></div>';
        if(_loopTool===t.file){
          row+='<div class="ti" style="display:flex;gap:4px;align-items:center">'+
            '<input type="number" class="loop-val" value="60" min="1" style="width:50px;padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:2px">'+
            '<select class="loop-unit" style="padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:2px"><option value="1">sec</option><option value="60">min</option></select>'+
            '<button class="ib loop-scan-run" data-scanfile="'+E(t.file)+'" data-rt="'+E(t.runtime)+'" title="Start">'+IC.play+'</button></div>';
        }
        return row;
      }).join('');
      h+='</div></div>';
    });
    h+='</div>';
  }
  el.innerHTML=h;
  el.querySelectorAll('.tn[data-tool]').forEach(function(b){b.addEventListener('click',function(){var id=b.dataset.tool;expTool=expTool===id?null:id;_loopTool=null;renderTools();});});
  el.querySelectorAll('.run-t').forEach(function(b){b.addEventListener('click',function(){
    var id=b.dataset.tool;var rows=b.closest('.tool-row').parentNode.querySelectorAll('.ti');
    var inp={};rows.forEach(function(r){if(!r.querySelector('.loop-val'))r.querySelectorAll('[data-i]').forEach(function(i){inp[i.dataset.i]=i.value;});});
    V.postMessage({type:'runTool',toolId:id,inputs:inp});
  });});
  el.querySelectorAll('.loop-t').forEach(function(b){b.addEventListener('click',function(){
    _loopTool=_loopTool===b.dataset.tool?null:b.dataset.tool;renderTools();
  });});
  el.querySelectorAll('.loop-run').forEach(function(b){b.addEventListener('click',function(){
    var id=b.dataset.tool;var row=b.closest('.ti');
    var val=row.querySelector('.loop-val');var unit=row.querySelector('.loop-unit');
    var sec=parseInt(val?val.value:'60')*parseInt(unit?unit.value:'1');
    var rows=b.closest('.tool-row').parentNode.querySelectorAll('.ti');
    var inp={};rows.forEach(function(r){if(!r.querySelector('.loop-val'))r.querySelectorAll('[data-i]').forEach(function(i){inp[i.dataset.i]=i.value;});});
    _loopTool=null;V.postMessage({type:'runToolLoop',toolId:id,inputs:inp,intervalSec:sec});
  });});
  el.querySelectorAll('[data-scan]').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'runScanned',file:b.dataset.scan,runtime:b.dataset.rt});});});
  el.querySelectorAll('[data-scanloop]').forEach(function(b){b.addEventListener('click',function(){
    _loopTool=_loopTool===b.dataset.scanloop?null:b.dataset.scanloop;renderTools();
  });});
  el.querySelectorAll('.loop-scan-run').forEach(function(b){b.addEventListener('click',function(){
    var row=b.closest('.ti');
    var val=row.querySelector('.loop-val');var unit=row.querySelector('.loop-unit');
    var sec=parseInt(val?val.value:'60')*parseInt(unit?unit.value:'1');
    _loopTool=null;V.postMessage({type:'runScannedLoop',file:b.dataset.scanfile,runtime:b.dataset.rt,intervalSec:sec});
  });});
  el.querySelectorAll('.file-link').forEach(function(l){l.addEventListener('click',function(){V.postMessage({type:'openFile',file:l.dataset.open});});});
  el.querySelectorAll('.tool-acc-hdr').forEach(function(hdr){hdr.addEventListener('click',function(){
    var body=hdr.nextElementSibling;var arrow=hdr.querySelector('.arrow');
    if(body.style.display==='none'){body.style.display='block';if(arrow)arrow.style.transform='rotate(90deg)';}
    else{body.style.display='none';if(arrow)arrow.style.transform='';}
  });});
}
function initTools(){}
`;
