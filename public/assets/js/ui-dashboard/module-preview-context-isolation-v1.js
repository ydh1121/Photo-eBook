/* v2: preview framing isolation plus canonical nested-module bridge loading. */
(function(){
  if(window.__platformModulePreviewContextIsolationV2)return;
  window.__platformModulePreviewContextIsolationV2=true;

  function ensureScreenModeBridge(){
    if(document.querySelector('script[data-screen-mode-settings-bridge]'))return;
    const script=document.createElement('script');
    script.src='/assets/js/collection/screen-mode-settings-bridge-v1.js?v=1';
    script.async=false;
    script.dataset.screenModeSettingsBridge='true';
    document.body.appendChild(script);
  }
  ensureScreenModeBridge();

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
