/* v6: mount the dependency-aware screen-mode-selector inside Photography settings. */
(function(){
  if(window.__photoScreenModeSettingsBridgeV6)return;
  window.__photoScreenModeSettingsBridgeV6=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const SCREEN_STYLE='/assets/styles/platform-modules/screen-mode-segmented-v1.css?v=3';
  const FILTER_STYLE='/assets/styles/platform-modules/filter-chip-rail-v1.css?v=6';
  const EXTENSION_SRC='/assets/js/platform-modules/portable-primitives-extension-v2.js?v=4';
  const COMPOSITION_SRC='/assets/js/platform-modules/portable-primitives-composition-v3.js?v=6';
  let definitionPromise=null;
  let mountCleanup=null;
  let scheduled=0;
  let observer=null;

  function normalize(value){return ['light','dark','system'].includes(String(value||''))?String(value):'light';}
  function readMode(){try{return normalize(localStorage.getItem(THEME_KEY)||document.documentElement.dataset.themeChoice||'light');}catch{return normalize(document.documentElement.dataset.themeChoice||'light');}}
  function ensureStyle(href,key){
    if(document.querySelector(`link[data-${key}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.setAttribute(`data-${key}`,'true');document.head.appendChild(link);
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
    const current=window.PlatformModuleRegistry;
    if(current?.get?.('screen-mode-selector'))return current;
    if(!definitionPromise){
      definitionPromise=(async()=>{
        if(!window.PlatformModuleRegistry)return null;
        await loadScript(EXTENSION_SRC);
        await loadScript(COMPOSITION_SRC);
        const registry=window.PlatformModuleRegistry;
        const definition=registry?.get?.('screen-mode-selector');
        const dependency=registry?.resolveDependency?.('screen-mode-selector','filter-chip-rail','public');
        return definition&&dependency&&registry.canConsume?.('screen-mode-selector','public')?registry:null;
      })();
    }
    return definitionPromise;
  }
  function pruneLegacy(settings,slot=null){
    if(!settings)return slot;
    const canonicalSelector='[data-platform-module="screen-mode-selector"]';
    [...settings.querySelectorAll('.theme-setting-card,[data-theme-setting-card]')].forEach(node=>{
      if(slot&&node===slot){node.classList.remove('theme-setting-card');node.removeAttribute('data-theme-setting-card');return;}
      if(slot&&node.contains(slot)){node.insertAdjacentElement('beforebegin',slot);node.remove();return;}
      const canonical=node.querySelector?.(canonicalSelector);
      if(canonical){
        if(!slot){slot=document.createElement('div');slot.dataset.collectionScreenModeSlot='true';node.insertAdjacentElement('beforebegin',slot);}
        if(!slot.querySelector(canonicalSelector))slot.appendChild(canonical);
      }
      node.remove();
    });
    return slot;
  }
  function currentSettings(){return document.getElementById('collectionBody')?.querySelector('.collection-settings')||null;}
  function currentSlot(settings=currentSettings()){return settings?.querySelector('[data-collection-screen-mode-slot]')||null;}
  function pruneCurrent(){const settings=currentSettings();if(!settings)return {settings:null,slot:null};const slot=pruneLegacy(settings,currentSlot(settings));return {settings,slot};}
  async function mountCanonical(){
    scheduled=0;
    const body=document.getElementById('collectionBody');
    const settings=body?.querySelector('.collection-settings');
    if(!settings)return false;
    let slot=pruneLegacy(settings,settings.querySelector('[data-collection-screen-mode-slot]'));
    const registry=await ensureDefinition();
    const definition=registry?.get?.('screen-mode-selector');
    if(!definition||!registry?.canConsume?.('screen-mode-selector','public'))return false;
    if(!registry.resolveDependency?.('screen-mode-selector','filter-chip-rail','public'))return false;
    if(!slot||!slot.isConnected)slot=settings.querySelector('[data-collection-screen-mode-slot]');
    if(!slot){
      slot=document.createElement('div');slot.dataset.collectionScreenModeSlot='true';
      const summary=settings.querySelector('.collection-settings__summary');
      if(summary)summary.insertAdjacentElement('afterend',slot);else settings.prepend(slot);
    }
    slot=pruneLegacy(settings,slot)||slot;
    if(slot.dataset.screenModeCanonicalMounted==='true'&&slot.querySelector('[data-platform-module="screen-mode-selector"]')){pruneLegacy(settings,slot);return true;}
    try{mountCleanup?.();}catch{}
    const mounted=registry.mount(slot,'screen-mode-selector',{title:'화면 모드',description:'화이트, 다크 또는 기기 설정에 맞춰 표시할 수 있습니다.',mode:readMode()},{consumer:'public',canonicalPlacement:'collection-settings'});
    mountCleanup=mounted?.cleanup||null;
    slot.dataset.screenModeCanonicalMounted='true';
    pruneLegacy(settings,slot);
    requestAnimationFrame(()=>pruneCurrent());
    setTimeout(()=>pruneCurrent(),120);
    return true;
  }
  function schedule(){clearTimeout(scheduled);scheduled=setTimeout(()=>{mountCanonical();},0);}
  function observeCollection(){
    const body=document.getElementById('collectionBody');
    if(!body||observer)return;
    observer=new MutationObserver(()=>{
      const settings=body.querySelector('.collection-settings');
      if(!settings)return;
      let slot=settings.querySelector('[data-collection-screen-mode-slot]');
      slot=pruneLegacy(settings,slot);
      if(!slot?.querySelector('[data-platform-module="screen-mode-selector"]'))schedule();
    });
    observer.observe(body,{childList:true,subtree:true});
    const {settings}=pruneCurrent();
    if(settings&&!currentSlot(settings)?.querySelector('[data-platform-module="screen-mode-selector"]'))schedule();
  }

  ensureStyle(FILTER_STYLE,'screen-mode-filter-style');
  ensureStyle(SCREEN_STYLE,'screen-mode-canonical-style');
  document.addEventListener('platform-collection-render',event=>{
    if(event.detail?.tab==='settings'){
      observeCollection();
      const {settings,slot}=pruneCurrent();
      if(settings&&!slot?.querySelector('[data-platform-module="screen-mode-selector"]'))schedule();
    }
  });
  document.addEventListener('platform-screen-mode-change',event=>{
    const module=event.target?.closest?.('[data-platform-module="screen-mode-selector"]');
    if(!module?.closest?.('[data-collection-screen-mode-slot]'))return;
    const mode=normalize(event.detail?.mode);
    try{localStorage.setItem(THEME_KEY,mode);}catch{}
    window.dispatchEvent(new CustomEvent('photo-theme-change',{detail:{mode,resolved:event.detail?.resolved||mode}}));
  });
  window.addEventListener('pageshow',()=>setTimeout(()=>{observeCollection();pruneCurrent();schedule();},100),{passive:true});
  [0,120,360,900].forEach(delay=>setTimeout(()=>{observeCollection();pruneCurrent();schedule();},delay));
})();
