export const routerJs = `
var _routesData=null,_routesFile='';
function renderRoutes(m){
  _routesData=m.routes||[];_routesFile=m.file||'';
  var el=document.getElementById('router-content');if(!el)return;
  if(!_routesData.length){
    el.innerHTML='<div style="opacity:.5;padding:8px;font-size:11px">GoRouter declaration not found in lib/.<br>Make sure your router file contains <code>GoRouter(</code>.</div>';
    return;
  }
  var h='<div style="font-size:10px;opacity:.4;padding:2px 0;margin-bottom:4px"><span class="file-link" data-open="'+E(_routesFile)+'" style="cursor:pointer;text-decoration:underline dotted">'+E(_routesFile)+'</span></div>';
  h+=renderRouteNodes(_routesData,0);
  el.innerHTML=h;
  el.querySelectorAll('.file-link').forEach(function(l){l.addEventListener('click',function(){V.postMessage({type:'openFile',file:l.dataset.open});});});
  el.querySelectorAll('.route-node').forEach(function(n){n.addEventListener('click',function(e){
    if(e.target.closest('.route-link'))return;
    var body=n.querySelector('.route-body');
    var arrow=n.querySelector('.route-arrow');
    if(body){body.style.display=body.style.display==='none'?'block':'none';}
    if(arrow)arrow.classList.toggle('open');
  });});
  el.querySelectorAll('.route-link').forEach(function(l){l.addEventListener('click',function(e){
    e.stopPropagation();
    V.postMessage({type:'openFileAtLine',file:l.dataset.file,line:parseInt(l.dataset.line)});
  });});
}
function renderRouteNodes(nodes,depth){
  var h='';
  nodes.forEach(function(n){
    var indent=depth*16;
    var typeColor=n.type==='GoRoute'?'#3fb950':n.type==='ShellRoute'?'#d29922':'#007aff';
    var hasChildren=n.children&&n.children.length>0;
    h+='<div class="route-node" style="margin-left:'+indent+'px;cursor:'+(hasChildren?'pointer':'default')+'">'+
      '<div style="display:flex;align-items:center;gap:4px;padding:3px 2px;border-bottom:1px solid var(--ib);font-size:11px">'+
      (hasChildren?'<span class="route-arrow arrow open" style="flex-shrink:0;opacity:.4">'+IC.chev+'</span>':'<span style="width:9px;flex-shrink:0"></span>')+
      '<span style="color:'+typeColor+';font-size:9px;font-weight:600;flex-shrink:0">'+E(n.type.replace('Route',''))+'</span>'+
      '<span style="font-weight:600">'+E(n.path)+'</span>'+
      (n.name?'<span style="opacity:.4;font-size:9px">'+E(n.name)+'</span>':'')+
      (n.widget?'<span class="route-link" data-file="'+E(n.file)+'" data-line="'+n.line+'" style="margin-left:auto;opacity:.5;font-size:9px;cursor:pointer;text-decoration:underline dotted;flex-shrink:0" title="Open '+E(n.widget)+'">'+E(n.widget)+'</span>':'')+
      '</div>';
    if(hasChildren){
      h+='<div class="route-body" style="border-left:2px solid var(--ib);margin-left:4px;padding-left:4px">';
      h+=renderRouteNodes(n.children,depth+1);
      h+='</div>';
    }
    h+='</div>';
  });
  return h;
}
`;
