/* v1: mount the approved screen-mode-selector Registry module inside Photography settings. */
(function(){
  if(window.__photoScreenModeSettingsBridgeV1)return;
  window.__photoScreenModeSettingsBridgeV1=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const STYLE_HREF='/assets/styles/platform-modules/screen-mode-segmented-v1.css?v=2';
  const EXTENSION_SRC='/assets/js/platform-modules/portable-primitives-extension-v2.js?v=1';
  const COMPOSITION_SRC='/assets/js/platform-modules/portable-primitives-composition-v3.js?v=2';
  let definitionPromise=null;
  let mountCleanup=null;
  let scheduled=0;

  function normalize(value){return ['light','dark','system'].includes(String(value||''))?String(value):'light';}
  function readMode(){try{return normalize(localStorage.getItem(THEME_KEY)||document.documentElement.dataset.themeChoice||'light');}catch{return normalize(document.documentElement.dataset.themeChoice||'light');}}
  function ensureStyle(){
    if(document.querySelector('link[data-screen-mode-canonical-style]'))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=STYLE_HREF;link.dataset.screenModeCanonicalStyle='true';document.head.appendChild(link);
  }
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const base=src.split('?')[0];
      const existing=[...document.scripts].find(node=>(node.getAttribute('src')||'').split('?')[0]===base);
      if(existing){if(existing.dataset.screenModeBridgeLoaded==='true'||existing.readyState==='complete')resolve(existing);else{existing.addEventListener('load',()=>resolve(existing),{once:true});setTimeout(()=>resolve(existing),120);}return;}
      const script=document.createElement('script');script.src=src;script.async=false;script.dataset.screenModeBridgeLoaded='true';script.onload=()=>resolve(script);script.onerror=reject;document.body.appendChild(script);
    });
  }
  async function ensureDefinition(){
    const registry=window.PlatformModuleRegistry;
    if(registry?.get?.('screen-mode-selector'))return registry;
    if(!definitionPromise){
      definitionPromise=(async()=>{
        if(!window.PlatformModuleRegistry)return null;
        await loadScript(EXTENSION_SRC);
        await loadScript(COMPOSITION_SRC);
        return window.PlatformModuleRegistry;
      })();
    }
    return definitionPromise;
  }
  function pruneLegacy(settings,slot){
    settings.querySelectorAll('.theme-setting-card,[data-theme-setting-card]').forEach(node=>{
      if(node===slot||slot?.contains(node)||node.querySelector?.('[data-platform-module="screen-mode-selector"]'))return;
      node.remove();
    });
  }
  async function mountCanonical(){
    scheduled=0;
    const body=document.getElementById('collectionBody');
    const settings=body?.querySelector('.collection-settings');
    if(!settings)return false;
    const registry=await ensureDefinition();
    const definition=registry?.get?.('screen-mode-selector');
    if(!definition)return false;

    let slot=settings.querySelector('[data-collection-screen-mode-slot]');
    if(!slot){
      slot=document.createElement('div');slot.dataset.collectionScreenModeSlot='true';
      const summary=settings.querySelector('.collection-settings__summary');
      if(summary)summary.insertAdjacentElement('afterend',slot);else settings.prepend(slot);
    }
    pruneLegacy(settings,slot);
    if(slot.dataset.screenModeCanonicalMounted==='true'&&slot.querySelector('[data-platform-module="screen-mode-selector"]'))return true;
    try{mountCleanup?.();}catch{}
    const mounted=registry.mount(slot,'screen-mode-selector',{
      title:'화면 모드',
      description:'화이트, 다크 또는 기기 설정에 맞춰 표시할 수 있습니다.',
      mode:readMode()
    },{consumer:'library',canonicalPlacement:'collection-settings'});
    mountCleanup=mounted?.cleanup||null;
    slot.dataset.screenModeCanonicalMounted='true';
    return true;
  }
  function schedule(){
    clearTimeout(scheduled);
    scheduled=setTimeout(()=>{mountCanonical();},0);
  }

  ensureStyle();
  document.addEventListener('platform-collection-render',event=>{
    if(event.detail?.tab==='settings')schedule();
  });
  document.addEventListener('platform-screen-mode-change',event=>{
    const module=event.target?.closest?.('[data-platform-module="screen-mode-selector"]');
    if(!module?.closest?.('[data-collection-screen-mode-slot]'))return;
    const mode=normalize(event.detail?.mode);
    try{localStorage.setItem(THEME_KEY,mode);}catch{}
    window.dispatchEvent(new CustomEvent('photo-theme-change',{detail:{mode,resolved:event.detail?.resolved||mode}}));
  });
  window.addEventListener('pageshow',()=>setTimeout(schedule,100),{passive:true});
  [0,120,360,900].forEach(delay=>setTimeout(schedule,delay));
})();
