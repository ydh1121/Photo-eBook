(function(){
  if(window.__platformSandboxRuntimeAuditPatchV1)return;
  window.__platformSandboxRuntimeAuditPatchV1=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const params=new URLSearchParams(location.search);
  const preview=params.get('preview')||'';

  function installStyle(){
    if($('#platform-sandbox-runtime-audit-style'))return;
    const style=document.createElement('style');
    style.id='platform-sandbox-runtime-audit-style';
    style.textContent=`
      html[data-theme="dark"] .nav-scroll[data-builder-family="material-flat"]{
        background:#1a1e25!important;border-color:rgba(255,255,255,.08)!important;box-shadow:none!important;color:#c4cad3!important
      }
      html[data-theme="dark"] .nav-scroll[data-builder-family="ios-flat"]{
        background:rgba(27,31,39,.9)!important;border-color:rgba(255,255,255,.09)!important;box-shadow:0 6px 18px rgba(0,0,0,.22)!important;color:#c7ced8!important
      }
      html[data-theme="dark"] .collection-filters[data-builder-family="material-flat"] .collection-filter{
        background:#20242b!important;border-color:rgba(255,255,255,.07)!important;color:#aeb6c2!important
      }
      html[data-theme="dark"] .collection-filters[data-builder-family="ios-flat"] .collection-filter{
        background:rgba(31,35,43,var(--builder-filter-opacity,1))!important;border-color:rgba(255,255,255,.07)!important;color:#aeb6c2!important
      }
      html[data-theme="dark"] .collection-filters[data-builder-family="ios-liquid"] .collection-filter{
        background:rgba(31,37,47,var(--builder-filter-opacity,.78))!important;border-color:rgba(255,255,255,.09)!important;color:#bac2ce!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 7px 18px rgba(0,0,0,.2)!important
      }
      html[data-theme="dark"] .collection-filters[data-builder-family] .collection-filter.is-active{
        background:var(--builder-filter-accent,#315fc9)!important;color:#fff!important;border-color:var(--builder-filter-accent,#315fc9)!important
      }
      .collection-fab[data-builder-family="flat"]{
        background:var(--builder-fab-accent,#315fc9)!important;background-image:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important
      }
      .collection-device-accordion[data-builder-response="lively"]>.collection-device-panel-v2{transition-duration:.18s!important}
      .collection-device-accordion[data-builder-response="standard"]>.collection-device-panel-v2{transition-duration:.36s!important}
      .collection-device-accordion[data-builder-response="calm"]>.collection-device-panel-v2{transition-duration:.52s!important}
      .collection-device-accordion[data-builder-response="lively"] .collection-device-panel-inner{transition-duration:.16s!important}
      .collection-device-accordion[data-builder-response="standard"] .collection-device-panel-inner{transition-duration:.34s!important}
      .collection-device-accordion[data-builder-response="calm"] .collection-device-panel-inner{transition-duration:.48s!important}
      .collection-device-accordion[data-builder-response="lively"]>#collectionDeviceLink::after{transition-duration:.18s!important}
      .collection-device-accordion[data-builder-response="standard"]>#collectionDeviceLink::after{transition-duration:.32s!important}
      .collection-device-accordion[data-builder-response="calm"]>#collectionDeviceLink::after{transition-duration:.46s!important}
      #sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]>.sandbox-preview-device-context{
        display:block!important;width:min(100%,680px)!important;max-width:100%!important;margin:0!important;padding:0!important;background:transparent!important
      }
    `;
    document.head.appendChild(style);
  }

  function ensureDeviceContext(){
    if(preview!=='device-handoff-accordion')return;
    const root=$('#sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]');
    const accordion=root?.querySelector('.collection-device-accordion');
    if(!root||!accordion)return;
    if(accordion.parentElement?.classList.contains('collection-settings'))return;
    const context=document.createElement('div');
    context.className='collection-settings sandbox-preview-device-context';
    accordion.before(context);
    context.appendChild(accordion);
  }

  function reconcileBulkSelection(allowed=true){
    const body=$('#collectionBody');
    const settings=$('.collection-tab.is-active[data-library-tab="settings"]');
    const hasItems=Boolean(body?.querySelector('.collection-item'));
    $$('.collection-select-toggle').forEach(node=>node.hidden=!allowed||Boolean(settings)||!hasItems);
    $$('.collection-bulkbar').forEach(node=>node.hidden=!allowed||Boolean(settings)||!body?.classList.contains('is-bulk-selecting'));
  }

  function reconcileSheet(config=null,{reset=false}={}){
    const sheet=$('#collectionSheet'),backdrop=$('#collectionBackdrop');
    if(!sheet)return;

    if(reset){
      $('.theme-setting-card',sheet)?.removeAttribute('hidden');
      $('.collection-device-accordion',sheet)?.removeAttribute('hidden');
      $('#collectionDeviceLink',sheet)?.removeAttribute('hidden');
      reconcileBulkSelection(true);
      if(sheet.classList.contains('is-open')||preview==='collection-bottom-sheet'){
        sheet.hidden=false;
        if(backdrop)backdrop.hidden=false;
      }
      return;
    }

    if(has(config,'enabled')&&config.enabled===true&&(sheet.classList.contains('is-open')||preview==='collection-bottom-sheet')){
      sheet.hidden=false;
      if(backdrop)backdrop.hidden=false;
    }
    if(has(config,'themeSelector')){
      const card=$('.theme-setting-card',sheet);
      if(card)card.hidden=config.themeSelector===false;
    }
    if(has(config,'deviceHandoff')){
      const accordion=$('.collection-device-accordion',sheet);
      const link=$('#collectionDeviceLink',sheet);
      if(accordion)accordion.hidden=config.deviceHandoff===false;
      else if(link)link.hidden=config.deviceHandoff===false;
    }
    if(has(config,'bulkSelection'))reconcileBulkSelection(config.bulkSelection!==false);
  }

  function applyFabAudit(config){
    const fab=$('#collectionFab');if(!fab)return;
    if(has(config,'accentColor'))fab.style.setProperty('--builder-fab-accent',config.accentColor||'#315fc9');
    else fab.style.removeProperty('--builder-fab-accent');
  }

  function handleRuntimeMessage(event){
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-ui-reset'){
      if(data.capabilityId==='device-handoff-accordion'){
        const accordion=$('.collection-device-accordion');
        if(accordion)delete accordion.dataset.builderResponse;
      }else if(data.capabilityId==='collection-bottom-sheet'){
        requestAnimationFrame(()=>reconcileSheet(null,{reset:true}));
      }else if(data.capabilityId==='floating-action'){
        $('#collectionFab')?.style.removeProperty('--builder-fab-accent');
      }
      return;
    }
    if(data.type!=='platform-ui-config')return;
    if(data.capabilityId==='collection-bottom-sheet')requestAnimationFrame(()=>reconcileSheet(data.config||{}));
    else if(data.capabilityId==='floating-action')requestAnimationFrame(()=>applyFabAudit(data.config||{}));
  }

  installStyle();
  ensureDeviceContext();
  new MutationObserver(()=>ensureDeviceContext()).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('message',handleRuntimeMessage);
})();
