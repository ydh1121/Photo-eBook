(function(){
  if(window.__platformSandboxRuntimeAuditPatchV1)return;
  window.__platformSandboxRuntimeAuditPatchV1=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const params=new URLSearchParams(location.search);
  const preview=params.get('preview')||'';
  const RAILS='.scroll-row,.skills-infinite-row,.curated-links-row,#skillsInfiniteRow,#curatedLinksRow';

  function num(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback;}
  function rgba(hex,alpha){
    const raw=String(hex||'#4081ef').replace('#','').trim();
    const normalized=raw.length===3?raw.split('').map(char=>char+char).join(''):raw.padEnd(6,'0').slice(0,6);
    const parsed=parseInt(normalized,16);
    if(!Number.isFinite(parsed))return `rgba(64,129,239,${alpha})`;
    return `rgba(${(parsed>>16)&255},${(parsed>>8)&255},${parsed&255},${alpha})`;
  }
  function removeImportant(node,names){for(const name of names)node?.style?.removeProperty(name);}

  function installStyle(){
    if($('#platform-sandbox-runtime-audit-style'))return;
    const style=document.createElement('style');
    style.id='platform-sandbox-runtime-audit-style';
    style.textContent=`
      @media(min-width:1024px){
        .nav-scroll[data-builder-family="material-flat"]::before,
        .nav-scroll[data-builder-family="ios-flat"]::before{content:none!important;display:none!important}
        .nav-scroll[data-builder-family="material-flat"],
        .nav-scroll[data-builder-family="ios-flat"]{border-radius:999px!important;overflow:hidden!important}
      }
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
      .desktop-rail-window[data-builder-right-fade="false"]::after{display:none!important}
      .desktop-rail-window[data-builder-right-fade="true"]::after{display:block!important}
      #app .scroll-row[data-builder-scrollbar="auto"],
      #app .skills-infinite-row[data-builder-scrollbar="auto"],
      #app .curated-links-row[data-builder-scrollbar="auto"],
      #sandboxPreviewRoot [data-builder-scrollbar="auto"]{
        overflow-x:auto!important;scrollbar-width:auto!important
      }
      #app .scroll-row[data-builder-scrollbar="auto"]::-webkit-scrollbar,
      #app .skills-infinite-row[data-builder-scrollbar="auto"]::-webkit-scrollbar,
      #app .curated-links-row[data-builder-scrollbar="auto"]::-webkit-scrollbar,
      #sandboxPreviewRoot [data-builder-scrollbar="auto"]::-webkit-scrollbar{
        display:block!important;width:auto!important;height:8px!important
      }
      .collection-fab[data-builder-family="flat"]{
        background:var(--builder-fab-accent,#315fc9)!important;background-image:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:0 5px 15px rgba(30,55,110,.16)!important
      }
      .collection-fab[data-builder-response]{transition-property:transform,background,box-shadow,filter!important;transition-timing-function:cubic-bezier(.22,.72,.22,1)!important}
      .collection-fab[data-builder-response="lively"]{transition-duration:.13s!important}
      .collection-fab[data-builder-response="standard"]{transition-duration:.18s!important}
      .collection-fab[data-builder-response="calm"]{transition-duration:.24s!important}
      .collection-fab[data-builder-response]:active{transform:scale(.96)!important}
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

  function resetTopNavAudit(){
    const shell=$('.nav-shell');
    if(shell){shell.hidden=false;shell.style.removeProperty('display');}
    const progress=$('.nav-chapter-progress');
    if(!progress)return;
    progress.hidden=false;
    removeImportant(progress,['display','background','opacity','top','bottom','height','border-radius']);
  }

  function applyTopNavAudit(config){
    const shell=$('.nav-shell');
    if(shell&&has(config,'enabled')){
      shell.hidden=false;
      if(config.enabled===false)shell.style.setProperty('display','none','important');
      else shell.style.removeProperty('display');
    }
    const progress=$('.nav-chapter-progress');if(!progress)return;
    if(has(config,'progressEnabled')){
      progress.hidden=false;
      progress.style.setProperty('display',config.progressEnabled===false?'none':'block','important');
    }
    if(has(config,'progressMode')){
      if(config.progressMode==='line'){
        progress.style.setProperty('top','auto','important');
        progress.style.setProperty('bottom','0','important');
        progress.style.setProperty('height','2px','important');
        progress.style.setProperty('border-radius','999px','important');
      }else{
        removeImportant(progress,['top','bottom','height','border-radius']);
      }
    }
    if(has(config,'progressColor')||has(config,'progressOpacityStart')||has(config,'progressOpacityEnd')){
      const color=config.progressColor||'#4081ef';
      const start=num(config.progressOpacityStart,24)/100;
      const end=num(config.progressOpacityEnd,16)/100;
      progress.style.setProperty('background',`linear-gradient(90deg,${rgba(color,start)},${rgba(color,end)})`,'important');
    }
  }

  function resetRailAudit(){
    $$(RAILS).forEach(row=>{
      removeImportant(row,['padding-left','padding-right','-webkit-mask-image','mask-image','overflow-x','scrollbar-width']);
      row.style.removeProperty('--builder-fade-left');
      row.style.removeProperty('--builder-fade-right');
    });
    $$('.desktop-rail-window').forEach(wrapper=>{
      wrapper.style.removeProperty('--desktop-shadow-runway');
      wrapper.style.removeProperty('--desktop-rail-blur');
      delete wrapper.dataset.builderRightFade;
    });
  }

  function maskFor(left,right,leftWidth,rightWidth){
    if(left&&right)return `linear-gradient(90deg,transparent 0,#000 ${leftWidth}px,#000 calc(100% - ${rightWidth}px),transparent 100%)`;
    if(left)return `linear-gradient(90deg,transparent 0,#000 ${leftWidth}px,#000 100%)`;
    if(right)return `linear-gradient(90deg,#000 0,#000 calc(100% - ${rightWidth}px),transparent 100%)`;
    return 'none';
  }

  function applyRailAudit(config){
    const rows=$$(RAILS);
    const wrappers=$$('.desktop-rail-window');
    if(has(config,'leftShadowGuard')||has(config,'leftPaintRunway')){
      const left=config.leftShadowGuard===false?0:num(config.leftPaintRunway,16);
      rows.forEach(row=>row.style.setProperty('padding-left',`${left}px`,'important'));
      wrappers.forEach(wrapper=>wrapper.style.setProperty('--desktop-shadow-runway',`${left}px`,'important'));
    }
    if(has(config,'rightContentPadding'))rows.forEach(row=>row.style.setProperty('padding-right',`${num(config.rightContentPadding,122)}px`,'important'));
    if(has(config,'leftFade')||has(config,'rightFade')||has(config,'rightFadeWidth')){
      const left=config.leftFade===true;
      const right=config.rightFade!==false;
      const leftWidth=Math.max(18,num(config.leftPaintRunway,16));
      const rightWidth=Math.max(0,num(config.rightFadeWidth,112));
      const mask=maskFor(left,right,leftWidth,rightWidth);
      rows.forEach(row=>{
        row.style.setProperty('-webkit-mask-image',mask,'important');
        row.style.setProperty('mask-image',mask,'important');
      });
      wrappers.forEach(wrapper=>{
        wrapper.dataset.builderRightFade=String(right);
        if(has(config,'rightFadeWidth'))wrapper.style.setProperty('--desktop-rail-blur',`${rightWidth}px`,'important');
      });
      if(has(config,'rightFadeWidth')&&!has(config,'rightContentPadding'))rows.forEach(row=>row.style.setProperty('padding-right','122px','important'));
    }
    if(has(config,'scrollbar')){
      rows.forEach(row=>{
        row.dataset.builderScrollbar=config.scrollbar;
        row.style.setProperty('scrollbar-width',config.scrollbar==='auto'?'auto':'none','important');
        if(config.scrollbar==='auto')row.style.setProperty('overflow-x','auto','important');
        else row.style.removeProperty('overflow-x');
      });
    }
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

  function resetDeviceAudit(){
    const accordion=$('.collection-device-accordion');
    if(accordion){accordion.hidden=false;delete accordion.dataset.builderResponse;}
  }

  function applyDeviceAudit(config){
    const accordion=$('.collection-device-accordion');
    if(accordion&&has(config,'enabled'))accordion.hidden=config.enabled===false;
  }

  function resetFabAudit(){
    const fab=$('#collectionFab');if(!fab)return;
    fab.style.removeProperty('--builder-fab-accent');
    removeImportant(fab,['background','background-image']);
    delete fab.dataset.builderResponse;
  }

  function applyFabAudit(config){
    const fab=$('#collectionFab');if(!fab)return;
    const accent=config.accentColor||'#315fc9';
    if(has(config,'accentColor'))fab.style.setProperty('--builder-fab-accent',accent);
    if(has(config,'family')||has(config,'accentColor')){
      const family=config.family||fab.dataset.builderFamily||'glass';
      const background=family==='flat'
        ?accent
        :`linear-gradient(145deg,color-mix(in srgb,${accent} 86%,#fff),color-mix(in srgb,${accent} 90%,#111))`;
      fab.style.setProperty('background',background,'important');
    }
    if(has(config,'response'))fab.dataset.builderResponse=config.response;
  }

  function handleRuntimeMessage(event){
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-ui-reset'){
      if(data.capabilityId==='top-chapter-navigation')requestAnimationFrame(resetTopNavAudit);
      else if(data.capabilityId==='horizontal-card-rail')requestAnimationFrame(resetRailAudit);
      else if(data.capabilityId==='device-handoff-accordion')requestAnimationFrame(resetDeviceAudit);
      else if(data.capabilityId==='collection-bottom-sheet')requestAnimationFrame(()=>reconcileSheet(null,{reset:true}));
      else if(data.capabilityId==='floating-action')requestAnimationFrame(resetFabAudit);
      return;
    }
    if(data.type!=='platform-ui-config')return;
    if(data.capabilityId==='top-chapter-navigation')requestAnimationFrame(()=>applyTopNavAudit(data.config||{}));
    else if(data.capabilityId==='horizontal-card-rail')requestAnimationFrame(()=>applyRailAudit(data.config||{}));
    else if(data.capabilityId==='device-handoff-accordion')requestAnimationFrame(()=>applyDeviceAudit(data.config||{}));
    else if(data.capabilityId==='collection-bottom-sheet')requestAnimationFrame(()=>reconcileSheet(data.config||{}));
    else if(data.capabilityId==='floating-action')requestAnimationFrame(()=>applyFabAudit(data.config||{}));
  }

  installStyle();
  ensureDeviceContext();
  new MutationObserver(()=>ensureDeviceContext()).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('message',handleRuntimeMessage);
})();
