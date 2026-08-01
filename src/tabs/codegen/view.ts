export const codegenJs = `
var _codegenData=null;
function renderCodegen(m){
  _codegenData=m;
  var el=document.getElementById('codegen-content');if(!el)return;
  var h='';
  h+='<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">'+
    '<button class="ib ib-p" id="br-build" title="build_runner build">'+IC.play+' build</button>'+
    '<button class="ib" id="br-watch" title="build_runner watch">'+IC.loop+' watch</button>'+
    '<button class="ib" id="br-clean" title="build_runner clean">'+IC.x+' clean</button>'+
    '<button class="ib" id="br-refresh" title="Rescan">'+IC.refresh+'</button></div>';
  if(m.lastBuild){
    var d=new Date(m.lastBuild);
    h+='<div style="font-size:10px;opacity:.5;margin-bottom:8px">Last build: '+d.toLocaleString()+'</div>';
  }
  var genTotal=(m.generatedFiles||[]).reduce(function(s,g){return s+g.count;},0);
  h+='<div class="sec"><div class="sec-t">Generated Files ('+genTotal+')</div>';
  (m.generatedFiles||[]).forEach(function(g){
    h+='<div class="sr"><span class="l">'+E(g.pattern)+'</span><span class="v"><span class="bg b" style="font-size:9px">'+g.count+'</span></span></div>';
  });
  h+='</div>';
  var annKeys=Object.keys(m.annotations||{}).filter(function(k){return m.annotations[k].length>0;});
  if(annKeys.length){
    h+='<div class="sec"><div class="sec-t">Annotations</div>';
    annKeys.forEach(function(key){
      var hits=m.annotations[key];
      h+='<div class="cg-ann" style="border:1px solid var(--ib);border-radius:4px;margin-bottom:4px;overflow:hidden">';
      h+='<div class="cg-ann-hdr" style="display:flex;align-items:center;gap:4px;padding:5px 8px;background:var(--ibg);cursor:pointer;font-size:11px;font-weight:600;user-select:none">'+
        '<span class="arrow" style="opacity:.4;transition:transform .15s">'+IC.chev+'</span>'+
        E(key)+' <span class="bg b" style="font-size:9px;margin-left:auto">'+hits.length+'</span></div>';
      h+='<div class="cg-ann-body" style="display:none;padding:4px 8px">';
      hits.forEach(function(hit){
        h+='<div class="sr" style="cursor:pointer" data-file="'+E(hit.file)+'" data-line="'+hit.line+'">'+
          '<span class="l" style="font-size:10px">'+E(hit.className)+' <span style="opacity:.4">'+E(hit.file)+':'+hit.line+'</span></span></div>';
      });
      h+='</div></div>';
    });
    h+='</div>';
  }
  if(m.missing&&m.missing.length){
    h+='<div class="sec"><div class="sec-t" style="color:#d29922">⚠ Missing Generated ('+m.missing.length+')</div>';
    m.missing.forEach(function(mi){
      h+='<div class="sr"><span class="l" style="font-size:10px;color:#d29922">'+E(mi.file)+' → '+E(mi.expected)+'</span>'+
        '<button class="ib cg-build-one" data-file="'+E(mi.file)+'" title="Build this file" style="padding:1px 4px;margin-left:4px">'+IC.play+'</button></div>';
    });
    h+='</div>';
  }
  if(m.buildYaml){
    h+='<div class="sec"><div class="sec-t">build.yaml</div>';
    h+='<div id="build-yaml-view" style="font-size:10px">';
    h+=renderBuildYamlTree(m.buildYaml,'');
    h+='</div>';
    h+='<div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end">'+
      '<button class="ib" id="byaml-edit" title="Edit build.yaml">✎ edit</button></div>';
    h+='</div>';
  }else{
    h+='<div class="sec"><div class="sec-t">build.yaml</div>'+
      '<div style="opacity:.5;font-size:10px;padding:4px">No build.yaml found. build_runner uses default config.</div></div>';
  }
  el.innerHTML=h;
  el.querySelectorAll('.cg-ann-hdr').forEach(function(hdr){hdr.addEventListener('click',function(){
    var body=hdr.nextElementSibling;var arrow=hdr.querySelector('.arrow');
    if(body.style.display==='none'){body.style.display='block';if(arrow)arrow.style.transform='rotate(90deg)';}
    else{body.style.display='none';if(arrow)arrow.style.transform='';}
  });});
  el.querySelectorAll('.sr[data-file]').forEach(function(row){row.addEventListener('click',function(){
    V.postMessage({type:'openFileAtLine',file:row.dataset.file,line:parseInt(row.dataset.line)});
  });});
  el.querySelectorAll('.cg-build-one').forEach(function(b){b.addEventListener('click',function(){
    V.postMessage({type:'buildFilter',file:b.dataset.file});
  });});
  var bb=document.getElementById('br-build');if(bb)bb.addEventListener('click',function(){V.postMessage({type:'runBuildRunner',mode:'build'});});
  var bw=document.getElementById('br-watch');if(bw)bw.addEventListener('click',function(){V.postMessage({type:'runBuildRunner',mode:'watch'});});
  var bc=document.getElementById('br-clean');if(bc)bc.addEventListener('click',function(){V.postMessage({type:'runBuildRunner',mode:'clean'});});
  var brf=document.getElementById('br-refresh');if(brf)brf.addEventListener('click',function(){V.postMessage({type:'scanCodegen'});});
  var be=document.getElementById('byaml-edit');if(be)be.addEventListener('click',function(){V.postMessage({type:'openFile',file:'build.yaml'});});
}
function renderBuildYamlTree(obj,prefix){
  var h='';
  var keys=Object.keys(obj);
  keys.forEach(function(k){
    var v=obj[k];
    var path=prefix?prefix+'.'+k:k;
    if(v&&typeof v==='object'&&!Array.isArray(v)){
      h+='<div class="byaml-node" style="margin-left:'+(prefix?12:0)+'px">';
      h+='<div class="byaml-hdr" style="display:flex;align-items:center;gap:4px;padding:2px 0;cursor:pointer;font-size:10px;font-weight:600">'+
        '<span class="arrow" style="opacity:.4;font-size:8px">'+IC.chev+'</span>'+E(k)+'</div>';
      h+='<div class="byaml-body" style="display:none">';
      h+=renderBuildYamlTree(v,path);
      h+='</div></div>';
    }else if(Array.isArray(v)){
      h+='<div style="margin-left:'+(prefix?12:0)+'px;padding:2px 0;font-size:10px">'+
        '<span style="font-weight:600">'+E(k)+'</span>: ['+v.map(function(i){return E(String(i));}).join(', ')+']</div>';
    }else{
      h+='<div style="margin-left:'+(prefix?12:0)+'px;padding:2px 0;font-size:10px">'+
        '<span style="font-weight:600">'+E(k)+'</span>: <span style="opacity:.7">'+E(String(v))+'</span></div>';
    }
  });
  return h;
}
`;
