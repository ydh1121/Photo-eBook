/* v1: preview framing isolation only. Never implements module component UI. */
(function(){
  if(window.__platformModulePreviewContextIsolationV1)return;
  window.__platformModulePreviewContextIsolationV1=true;
  const moduleId=new URLSearchParams(location.search).get('module')||'';
  if(moduleId!=='device-handoff-accordion')return;

  const selectors=['.theme-setting-card','[data-theme-setting-card]'];
  function clean(){
    const host=document.querySelector('#platformModuleHost');
    selectors.forEach(selector=>document.querySelectorAll(selector).forEach(node=>{
      /* Screen/theme controls belong to their own canonical module. In this
         isolated device-handoff preview they are page-context leakage. */
      if(!host||host.contains(node)||node.closest('#platformModulePreviewRoot'))node.remove();
    }));
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(clean));
  observer.observe(document.documentElement,{subtree:true,childList:true});
  clean();
})();
