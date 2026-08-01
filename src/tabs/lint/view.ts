export const lintJs = `
function renderLint(m){
  var el=document.getElementById('lint-list');
  el.innerHTML=(m.rules||[]).map(function(r){return '<div class="tr"><label>'+E(r)+'</label><label class="sw"><input type="checkbox" checked data-rule="'+E(r)+'"><span class="sl"></span></label></div>';}).join('');
  el.querySelectorAll('[data-rule]').forEach(function(cb){cb.addEventListener('change',function(){
    V.postMessage({type:'toggleLintRule',rule:cb.dataset.rule,enabled:cb.checked});
  });});
}
`;
