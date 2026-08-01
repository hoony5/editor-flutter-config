export const routerJs = `
var _routesData=null,_routesFile='';
function renderRoutes(m){
  _routesData=m.routes||[];_routesFile=m.file||'';
  var el=document.getElementById('router-content');if(!el)return;
  if(!_routesData.length){
    el.innerHTML='<div style="padding:8px;font-size:11px;line-height:1.6">'+
      '<div style="opacity:.5;margin-bottom:8px">GoRouter declaration not found in <code>lib/</code>.</div>'+
      '<div style="font-weight:600;margin-bottom:4px">Detection criteria:</div>'+
      '<div style="opacity:.7;font-size:10px;margin-bottom:8px">Scans all <code>.dart</code> files in <code>lib/</code> for <code>GoRouter(</code>, <code>GoRoute(</code>, or <code>StatefulShellRoute</code>. '+
      'Files with the most <code>GoRoute(</code> occurrences win. Route constants (e.g. <code>AppRoutes.home</code>) are resolved from <code>*routes*.dart</code> files.</div>'+
      '<div style="font-weight:600;margin-bottom:4px">Example — this will be detected:</div>'+
      '<pre style="font-size:10px;background:var(--ibg);padding:8px;border-radius:4px;overflow-x:auto;line-height:1.5">'+
      E("final router = GoRouter(\\n  routes: <RouteBase>[\\n    GoRoute(\\n      path: '/home',\\n      builder: (context, state) => const HomePage(),\\n      routes: [\\n        GoRoute(\\n          path: 'detail/:id',\\n          builder: (context, state) => DetailPage(\\n            id: state.pathParameters['id']!,\\n          ),\\n        ),\\n      ],\\n    ),\\n    StatefulShellRoute.indexedStack(\\n      builder: (context, state, nav) => MainShell(nav),\\n      branches: [\\n        StatefulShellBranch(\\n          routes: [GoRoute(path: '/tab1', builder: ...)],\\n        ),\\n      ],\\n    ),\\n  ],\\n);")+
      '</pre>'+
      '<div style="opacity:.5;font-size:10px;margin-top:6px">Tip: file name containing <code>router</code> or <code>route</code> gets priority in fallback search.</div>'+
      '</div>';
    return;
  }
  var h='<div style="font-size:10px;opacity:.4;padding:2px 0;margin-bottom:4px"><span class="file-link" data-open="'+E(_routesFile)+'" style="cursor:pointer;text-decoration:underline dotted">'+E(_routesFile)+'</span></div>';
  h+=renderRouteNodes(_routesData,0);
  el.innerHTML=h;
  el.querySelectorAll('.file-link').forEach(function(l){l.addEventListener('click',function(){V.postMessage({type:'openFile',file:l.dataset.open});});});
  el.querySelectorAll('.route-node').forEach(function(n){n.addEventListener('click',function(e){
    if(e.target.closest('.route-link')||e.target.closest('.route-deeplink'))return;
    var body=n.querySelector('.route-body');
    var arrow=n.querySelector('.route-arrow');
    if(body){body.style.display=body.style.display==='none'?'block':'none';}
    if(arrow)arrow.classList.toggle('open');
  });});
  el.querySelectorAll('.route-link').forEach(function(l){l.addEventListener('click',function(e){
    e.stopPropagation();
    V.postMessage({type:'openFileAtLine',file:l.dataset.file,line:parseInt(l.dataset.line)});
  });});
  el.querySelectorAll('.route-deeplink').forEach(function(b){b.addEventListener('click',function(e){
    e.stopPropagation();
    var existing=b.parentElement.querySelector('.deeplink-cmds');
    if(existing){existing.remove();return;}
    var p=b.dataset.path;
    var div=document.createElement('div');
    div.className='deeplink-cmds';
    div.style.cssText='font-size:9px;padding:4px 8px;background:var(--ibg);border-radius:3px;margin:2px 0;word-break:break-all';
    div.innerHTML='<div style="opacity:.5;margin-bottom:2px">iOS Simulator:</div><code>xcrun simctl openurl booted "myapp://'+E(p)+'"</code>'+
      '<div style="opacity:.5;margin:4px 0 2px">Android:</div><code>adb shell am start -a android.intent.action.VIEW -d "myapp://'+E(p)+'"</code>';
    b.parentElement.appendChild(div);
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
      (n.path&&n.path!=='/'&&n.path!=='[branch]'?'<button class="ib route-deeplink" data-path="'+E(n.path)+'" title="Deep-link test commands" style="padding:0 3px;font-size:8px;margin-left:4px">⧉</button>':'')+
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
