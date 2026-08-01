export const platformJs = `
function _pFile(p){return p==='ios'?'ios/Runner/Info.plist':p==='android'?'android/app/src/main/AndroidManifest.xml':'macos/Runner/DebugProfile.entitlements';}
function _permOn(key,plat){
  if(!key)return false;
  var base=(permState[plat]||[]).indexOf(key)!==-1;
  var f=_pFile(plat);
  for(var i=0;i<_permEdits.length;i++){var e=_permEdits[i];if(e.file===f&&e.key===key&&e.action==='remove')return false;}
  for(var i=0;i<_permEdits.length;i++){var e=_permEdits[i];if(e.file===f&&e.key===key&&(e.action==='add'||!e.action))return true;}
  return base;
}
function _itemActive(item){
  var n=0;var pp=item.p||{};
  var keys=Object.keys(pp);
  for(var i=0;i<keys.length;i++){var pl=keys[i];if(pp[pl]&&_permOn(pp[pl],pl))n++;}
  if(item.subs)for(var j=0;j<item.subs.length;j++){var s=item.subs[j];
    if(s.ios&&_permOn(s.ios,'ios'))n++;
    else if(s.android&&_permOn(s.android,'android'))n++;
    else if(s.macos&&_permOn(s.macos,'macos'))n++;
  }
  return n;
}
function _itemTotal(item){
  var n=0;var pp=item.p||{};
  n+=Object.keys(pp).filter(function(k){return !!pp[k];}).length;
  if(item.subs)n+=item.subs.length;
  return n;
}
function _togglePerm(key,plat){
  if(!key)return;
  var f=_pFile(plat);var on=_permOn(key,plat);
  _permEdits=_permEdits.filter(function(e){return !(e.file===f&&e.key===key);});
  _permEdits.push({file:f,key:key,action:on?'remove':'add',value:on?undefined:'Required for app functionality'});
}
function _classify(file,key){
  if(/NS\\w+UsageDescription/.test(key))return 'Permissions';
  if(file==='AndroidManifest.xml'&&key!=='app label')return 'Permissions';
  if(file==='Entitlements')return 'Security';
  if(/key\\.properties|signing/.test(file))return 'Signing';
  if(key==='DEVELOPMENT_TEAM')return 'Signing';
  if(/applicationId|minSdk|targetSdk|compileSdk|build\\.gradle/.test(key+file))return 'Build';
  if(/URL|scheme|deeplink|intent|url_type/i.test(key))return 'Deep Links';
  return 'App Info';
}
var _DANGER={'NSAllowsArbitraryLoads':'ATS 비활성 — App Store 거부 리스크','NSExceptionDomains':'ATS 예외 — 소명 필요','usesCleartextTraffic':'비암호화 HTTP 허용','NSAppTransportSecurity':'ATS 설정 — 허용 범위 확인'};
function _dangerWarn(key){var ks=Object.keys(_DANGER);for(var i=0;i<ks.length;i++){if(key.indexOf(ks[i])!==-1)return _DANGER[ks[i]];}return null;}
function _hasInterp(v){return /\\$\\(|\\$\\{/.test(v);}
function renderPlatform(){
  if(!platData)return;
  var tabs=document.getElementById('plat-tabs');
  var cats=['Permissions','Security','Signing','Build','Deep Links','App Info'];
  tabs.innerHTML=cats.map(function(c){return '<button class="'+(c===_platCat?'active':'')+'" data-c="'+E(c)+'">'+E(c)+'</button>';}).join('');
  tabs.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){_platCat=b.dataset.c;_platEdits={};_platAdds=[];_platRemoves=new Set();_permEdits=[];renderPlatform();});});
  var el=document.getElementById('plat-content');
  var platforms=Object.keys(platData);
  var q=_platSearch.toLowerCase();

  if(_platCat==='Permissions'){
    var totalActive=0,totalItems=0;
    PC.forEach(function(c){c.items.forEach(function(i){totalItems++;if(_itemActive(i)>0)totalActive++;});});
    var editCount=_permEdits.length;
    var h='<div style="display:flex;gap:4px;margin-bottom:6px;align-items:center">'+
      '<input id="perm-search" placeholder="Search permissions..." value="'+E(_platSearch)+'" style="flex:1;padding:3px 5px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px">'+
      '<button class="ib ib-p" id="perm-save" title="Save"'+(editCount?'':' disabled')+'>'+IC.save+'</button>'+
      '<button class="ib" id="perm-cancel" title="Cancel">'+IC.x+'</button></div>';
    h+='<div class="hint">'+totalActive+'/'+totalItems+' active · '+editCount+' pending</div>';
    var unconfigured=(typeof permUsage!=='undefined'?permUsage:[]).filter(function(u){return u.used&&!u.configured;});
    if(unconfigured.length){
      h+='<div style="background:rgba(210,153,34,.1);border:1px solid #d29922;border-radius:4px;padding:6px 8px;margin-bottom:6px">';
      h+='<div style="font-size:10px;font-weight:600;color:#d29922;margin-bottom:4px">⚠ Code uses these but permission not configured:</div>';
      unconfigured.forEach(function(u){
        h+='<div style="font-size:10px;padding:1px 0;color:#d29922">• '+E(u.label)+' — <span style="opacity:.6">'+E(u.perm)+'</span></div>';
      });
      h+='</div>';
    }

    PC.forEach(function(cat){
      var filtered=cat.items.filter(function(i){return !q||i.l.toLowerCase().indexOf(q)!==-1||(i.d||'').toLowerCase().indexOf(q)!==-1||(i.subs||[]).some(function(s){return s.l.toLowerCase().indexOf(q)!==-1;});});
      if(!filtered.length)return;
      var catActive=filtered.reduce(function(s,i){return s+(_itemActive(i)>0?1:0);},0);
      var catOpen=_expCats.has(cat.c)||!!q;
      h+='<div class="pcat"><div class="pcat-h" data-cat="'+E(cat.c)+'">'+
        '<span class="arrow'+(catOpen?' open':'')+'">'+IC.chev+'</span>'+
        E(cat.c)+'<span class="cnt">'+catActive+'/'+filtered.length+'</span></div>';
      if(catOpen){
        filtered.forEach(function(item){
          var active=_itemActive(item);var total=_itemTotal(item);
          var open=_expPerms.has(item.id)||!!q;
          h+='<div class="pitem-h" data-perm="'+E(item.id)+'">'+
            '<span class="arrow'+(open?' open':'')+'">'+IC.chev+'</span>'+
            '<span class="pl">'+E(item.l)+(item.subs?' <span style="opacity:.4;font-size:10px">'+active+'/'+total+'</span>':'')+'</span><span class="tags">';
          ['ios','android','macos'].forEach(function(pl){
            var k=item.p?item.p[pl]:null;
            var hasSub=item.subs&&item.subs.some(function(s){return !!s[pl];});
            if(!k&&!hasSub)return;
            var on=k?_permOn(k,pl):item.subs.some(function(s){return s[pl]&&_permOn(s[pl],pl);});
            if(on)h+='<span class="ptag t-'+pl+' on">'+pl+'</span>';
          });
          h+='</span></div>';
          if(open){
            h+='<div class="pbody">';
            if(item.d)h+='<div class="pdesc">'+E(item.d)+'</div>';
            if(item.w)h+='<div class="pwarn">⚠ '+E(item.w)+'</div>';
            var meta=typeof PERM_META!=='undefined'?PERM_META[item.id]:null;
            if(meta&&meta.impact)h+='<div style="font-size:10px;color:#f85149;padding:1px 0">Impact: '+E(meta.impact)+'</div>';
            ['ios','android','macos'].forEach(function(pl){
              var k=item.p?item.p[pl]:null;
              var platSubs=(item.subs||[]).filter(function(s){return !!s[pl];});
              if(!k&&!platSubs.length)return;
              h+='<div style="padding:4px 0 2px;font-size:10px;font-weight:600;opacity:.5;text-transform:uppercase;letter-spacing:.3px">'+E(pl)+'</div>';
              if(k){
                var on=_permOn(k,pl);
                var sdkStr=item.sdk&&item.sdk[pl]?item.sdk[pl]:'';
                h+='<div class="psub"><label class="sw"><input type="checkbox" '+(on?'checked':'')+' data-pk="'+E(k)+'" data-pp="'+pl+'"><span class="sl"></span></label>'+
                  '<span style="font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+E(k)+'">'+E(k)+'</span>'+
                  (sdkStr?'<span class="sdk">'+E(sdkStr)+'</span>':'')+'</div>';
              }
              platSubs.forEach(function(sub){
                var on=_permOn(sub[pl],pl);
                h+='<div class="psub" style="'+(on?'':'opacity:.5')+'"><label class="sw"><input type="checkbox" '+(on?'checked':'')+' data-pk="'+E(sub[pl])+'" data-pp="'+pl+'"><span class="sl"></span></label>'+
                  '<span>'+E(sub.l)+'</span>'+
                  (sub.w?'<span class="tip" data-tip="'+E(sub.w)+'" style="color:#d29922;font-size:9px">⚠</span>':'')+
                  (sub.sdk?'<span class="sdk">'+E(sub.sdk)+'</span>':'')+'</div>';
              });
            });
            var meta=typeof PERM_META!=='undefined'?PERM_META[item.id]:null;
            if(meta&&(meta.links.length||meta.acts.length)){
              if(meta.links.length){
                h+='<div style="padding:4px 0 2px;font-size:10px;opacity:.4">References</div>';
                h+='<div style="display:flex;flex-wrap:wrap;gap:3px;padding:2px 0">';
                meta.links.forEach(function(lk){h+='<a href="'+E(lk[1])+'" style="font-size:9px;color:var(--bb);text-decoration:none;border:1px solid var(--ib);border-radius:3px;padding:1px 5px" title="'+E(lk[1])+'">'+E(lk[0])+'</a>';});
                h+='</div>';
              }
              if(meta.acts.length){
                h+='<div style="padding:4px 0 2px;font-size:10px;opacity:.4">Suggested Actions</div>';
                meta.acts.forEach(function(ac){
                  var isCmd=['dart ','flutter ','bash ','sh ','cd ','./','pub ','npx '].some(function(p){return ac[1].indexOf(p)===0;});
                  h+='<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px">'+
                    '<span style="flex:1;opacity:.7">'+E(ac[0])+'</span>'+
                    (isCmd?'<button class="ib perm-act" data-cmd="'+E(ac[1])+'" title="'+E(ac[1])+'" style="font-size:9px">'+IC.play+'</button>':'<span style="font-size:8px;opacity:.4;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+E(ac[1])+'">'+E(ac[1])+'</span>')+'</div>';
                });
              }
            }
            h+='</div>';
          }
        });
      }
      h+='</div>';
    });
    el.innerHTML=h;
    var ps=el.querySelector('#perm-search');
    if(ps)ps.addEventListener('input',function(e){_platSearch=e.target.value;renderPlatform();});
    var psv=el.querySelector('#perm-save');
    if(psv)psv.addEventListener('click',function(){
      if(_permEdits.length){var edits=_permEdits.slice();_permEdits=[];V.postMessage({type:'savePlatformEdit',edits:edits});}
    });
    var pcl=el.querySelector('#perm-cancel');
    if(pcl)pcl.addEventListener('click',function(){_permEdits=[];renderPlatform();});
    el.querySelectorAll('.pcat-h').forEach(function(h2){h2.addEventListener('click',function(){var c=h2.dataset.cat;if(_expCats.has(c))_expCats.delete(c);else _expCats.add(c);renderPlatform();});});
    el.querySelectorAll('.pitem-h').forEach(function(h2){h2.addEventListener('click',function(){var id=h2.dataset.perm;if(_expPerms.has(id))_expPerms.delete(id);else _expPerms.add(id);renderPlatform();});});
    el.querySelectorAll('[data-pk]').forEach(function(cb){cb.addEventListener('change',function(){_togglePerm(cb.dataset.pk,cb.dataset.pp);renderPlatform();});});
    el.querySelectorAll('.perm-act').forEach(function(b){b.addEventListener('click',function(){V.postMessage({type:'runAction',action:'custom',cmd:b.dataset.cmd});});});
    return;
  }

  var editCount2=Object.keys(_platEdits).length+_platAdds.length+_platRemoves.size;
  var h2='<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center">'+
    '<input id="plat-search" placeholder="Search settings..." value="'+E(_platSearch)+'" style="flex:1;padding:3px 5px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:3px;font-size:11px">'+
    '<button class="ib ib-p" id="plat-save" title="Save"'+(editCount2?'':' disabled')+'>'+IC.save+'</button>'+
    '<button class="ib" id="plat-cancel" title="Cancel">'+IC.x+'</button></div>';
  h2+='<div class="et" style="margin-bottom:4px">'+platforms.map(function(p){return '<button class="'+(p===_platSub?'active':'')+'" data-s="'+E(p)+'">'+E(p)+'</button>';}).join('')+'</div>';
  var sections=platData[_platSub]||[];
  sections.forEach(function(s){
    var entries=s.entries.filter(function(kv){return _classify(s.file,kv[0])===_platCat;});
    var filtered2=entries.filter(function(kv){return !q||kv[0].toLowerCase().indexOf(q)!==-1||kv[1].toLowerCase().indexOf(q)!==-1||s.file.toLowerCase().indexOf(q)!==-1;});
    if(!filtered2.length)return;
    var isRealFile=s.file.indexOf(' ')===-1&&s.file.indexOf('/')!==-1;
    h2+='<div class="sec"><div class="sec-t">'+(isRealFile?'<span class="file-link" data-open="'+E(s.file)+'" style="cursor:pointer;text-decoration:underline dotted;opacity:.7">'+E(s.file)+'</span>':E(s.file))+'</div>';
    filtered2.forEach(function(kv){
      var k=kv[0],v=kv[1];var eid=_platSub+'|'+s.file+'|'+k;
      if(_platRemoves.has(eid))return;
      var edited=_platEdits[eid];var val=edited!==undefined?edited:v;
      var mark=edited!==undefined?' style="border-left:2px solid var(--bb);padding-left:4px"':'';
      var dw=_dangerWarn(k);var interp=_hasInterp(String(val));
      h2+='<div class="sr"'+mark+'><span class="l">'+E(k)+(dw?' <span class="tip" data-tip="'+E(dw)+'" style="color:#f85149;font-size:10px">⚠</span>':'')+(interp?' <span class="tip" data-tip="Variable reference — preserved as-is" style="color:#d29922;font-size:9px">\${}</span>':'')+'</span><span style="display:flex;align-items:center;gap:3px;max-width:60%"><span class="v plat-val" data-eid="'+E(eid)+'" data-file="'+E(s.file)+'" data-key="'+E(k)+'" data-orig="'+E(v)+'" style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer">'+E(val)+(edited!==undefined?' *':'')+'</span><span class="plat-rm" data-eid="'+E(eid)+'" style="cursor:pointer;opacity:.3;font-size:11px" title="Remove">−</span></span></div>';
      if(dw)h2+='<div style="font-size:9px;color:#f85149;padding:0 0 2px 8px;opacity:.8">'+E(dw)+'</div>';
    });
    _platAdds.filter(function(a){return a.file===s.file;}).forEach(function(a){
      h2+='<div class="sr" style="border-left:2px solid #3fb950;padding-left:4px"><span class="l">'+E(a.key)+' <span style="color:#3fb950;font-size:9px">new</span></span><span style="font-size:11px;opacity:.7">'+E(a.value)+'</span></div>';
    });
    h2+='<div style="display:flex;gap:3px;margin-top:4px;align-items:center">'+
      '<input class="add-key" data-file="'+E(s.file)+'" placeholder="key" style="flex:1;padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:2px">'+
      '<input class="add-val" data-file="'+E(s.file)+'" placeholder="value" style="flex:1;padding:2px 4px;font-size:11px;background:var(--ibg);color:var(--ifg);border:1px solid var(--ib);border-radius:2px">'+
      '<button class="ib plat-add" data-file="'+E(s.file)+'" title="Add">'+IC.plus+'</button></div></div>';
  });
  if(h2.indexOf('sec-t')===-1)h2+='<div style="opacity:.5;padding:8px">No '+E(_platCat)+' settings for '+E(_platSub)+'. Platform-specific items appear only when the relevant config file exists.</div>';
  el.innerHTML=h2;
  el.querySelectorAll('[data-s]').forEach(function(b){b.addEventListener('click',function(){_platSub=b.dataset.s;_platEdits={};renderPlatform();});});
  var ps2=document.getElementById('plat-search');
  if(ps2)ps2.addEventListener('input',function(e){_platSearch=e.target.value;renderPlatform();});
  var psv2=document.getElementById('plat-save');
  if(psv2)psv2.addEventListener('click',function(){
    var edits=[];
    Object.keys(_platEdits).forEach(function(eid){var p=eid.split('|');edits.push({file:p[1],key:p[2],value:_platEdits[eid]});});
    _platRemoves.forEach(function(eid){var p=eid.split('|');edits.push({file:p[1],key:p[2],action:'remove'});});
    _platAdds.forEach(function(a){edits.push({file:a.file,key:a.key,value:a.value,action:'add'});});
    if(edits.length)V.postMessage({type:'savePlatformEdit',edits:edits});
    _platEdits={};_platAdds=[];_platRemoves=new Set();
  });
  var pcl2=document.getElementById('plat-cancel');
  if(pcl2)pcl2.addEventListener('click',function(){_platEdits={};_platAdds=[];_platRemoves=new Set();renderPlatform();});
  el.querySelectorAll('.plat-rm').forEach(function(b){b.addEventListener('click',function(){_platRemoves.add(b.dataset.eid);renderPlatform();});});
  el.querySelectorAll('.plat-add').forEach(function(b){b.addEventListener('click',function(){
    var sec=b.closest('.sec');var k=sec.querySelector('.add-key'),v=sec.querySelector('.add-val');
    if(k.value.trim()){_platAdds.push({file:b.dataset.file,key:k.value.trim(),value:v.value.trim()});renderPlatform();}
  });});
  el.querySelectorAll('.file-link').forEach(function(l){l.addEventListener('click',function(){V.postMessage({type:'openFile',file:l.dataset.open});});});
  el.querySelectorAll('.plat-val').forEach(function(sp){sp.addEventListener('dblclick',function(){
    var row=sp.closest('.sr');var eid=sp.dataset.eid,orig=sp.dataset.orig;
    row.style.flexDirection='column';row.style.alignItems='stretch';sp.style.display='none';
    var inp=document.createElement('input');
    inp.value=_platEdits[eid]!==undefined?_platEdits[eid]:orig;
    inp.style.cssText='width:100%;font-size:11px;padding:2px 4px;margin-top:2px;background:var(--ibg);color:var(--ifg);border:1px solid var(--bb);border-radius:2px;box-sizing:border-box';
    row.appendChild(inp);inp.focus();inp.select();
    function commit(){var nv=inp.value.trim();if(nv!==orig)_platEdits[eid]=nv;else delete _platEdits[eid];renderPlatform();}
    inp.addEventListener('blur',commit);
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.value=orig;inp.blur();}});
  });});
}
`;
