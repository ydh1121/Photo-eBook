(function(){
  if(window.__platformGlobalChipRuntimeV1)return;
  window.__platformGlobalChipRuntimeV1=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  let current=null;

  function installStyle(){
    if($('#platform-global-chip-style-v1'))return;
    const style=document.createElement('style');
    style.id='platform-global-chip-style-v1';
    style.textContent=`
      html[data-platform-chip-family="material-flat"] :is(.nav-chip,.collection-filter){
        border-radius:8px!important;
        background:#f2f3f5!important;
        color:#666d78!important;
        border-color:rgba(27,39,63,.07)!important;
        box-shadow:none!important;
        -webkit-backdrop-filter:none!important;backdrop-filter:none!important
      }
      html[data-platform-chip-family="ios-flat"] :is(.nav-chip,.collection-filter){
        border-radius:999px!important;
        background:rgba(243,244,247,var(--platform-chip-opacity,1))!important;
        color:#6f747d!important;
        border-color:rgba(28,40,65,.06)!important;
        box-shadow:0 2px 10px rgba(28,39,62,.045)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,0px))!important;backdrop-filter:blur(var(--platform-chip-blur,0px))!important
      }
      html[data-platform-chip-family="ios-liquid"] :is(.nav-chip,.collection-filter){
        border-radius:999px!important;
        background:rgba(245,248,253,var(--platform-chip-opacity,.78))!important;
        color:#667080!important;
        border-color:rgba(255,255,255,.42)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.56),0 5px 16px rgba(30,46,76,.08)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,18px)) saturate(135%)!important;backdrop-filter:blur(var(--platform-chip-blur,18px)) saturate(135%)!important
      }
      html[data-theme="dark"][data-platform-chip-family="material-flat"] :is(.nav-chip,.collection-filter){background:#20242b!important;color:#aeb6c2!important;border-color:rgba(255,255,255,.07)!important}
      html[data-theme="dark"][data-platform-chip-family="ios-flat"] :is(.nav-chip,.collection-filter){background:rgba(31,35,43,var(--platform-chip-opacity,1))!important;color:#aeb6c2!important;border-color:rgba(255,255,255,.07)!important}
      html[data-theme="dark"][data-platform-chip-family="ios-liquid"] :is(.nav-chip,.collection-filter){background:rgba(31,37,47,var(--platform-chip-opacity,.78))!important;color:#bac2ce!important;border-color:rgba(255,255,255,.09)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 7px 18px rgba(0,0,0,.2)!important}
      html[data-platform-chip-family] .collection-filter.is-active,
      html[data-platform-chip-family]:not([data-platform-chip-family="ios-liquid"]) .nav-chip.is-active{
        background:var(--platform-chip-accent,#315fc9)!important;
        color:#fff!important;
        border-color:var(--platform-chip-accent,#315fc9)!important;
        box-shadow:none!important
      }
      html[data-platform-chip-family="ios-liquid"] .collection-filter.is-active{
        background:var(--platform-chip-accent,#315fc9)!important;color:#fff!important;border-color:var(--platform-chip-accent,#315fc9)!important;
        box-shadow:0 7px 18px color-mix(in srgb,var(--platform-chip-accent,#315fc9) 28%,transparent),inset 0 1px 0 rgba(255,255,255,.3)!important
      }
      html[data-platform-chip-family]:not([data-platform-chip-family="ios-liquid"]) .nav-v33-indicator{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function duration(config){
    if(config?.response==='lively')return 140;
    if(config?.response==='standard')return 190;
    return 240;
  }

  function resetNodes(){
    const html=document.documentElement;
    delete html.dataset.platformChipFamily;
    for(const name of ['--platform-chip-accent','--platform-chip-opacity','--platform-chip-blur'])html.style.removeProperty(name);
    const nav=$('.nav-scroll');
    if(nav){
      delete nav.dataset.builderFamily;
      nav.style.removeProperty('--builder-nav-accent');
    }
    $$('.collection-filters').forEach(root=>{
      delete root.dataset.builderFamily;
      root.style.removeProperty('--builder-filter-accent');
      root.style.removeProperty('--builder-filter-opacity');
      root.style.removeProperty('--builder-filter-blur');
    });
    $$(':is(.nav-chip,.collection-filter)').forEach(node=>node.style.removeProperty('transition-duration'));
  }

  function apply(config){
    current=config&&typeof config==='object'?{...config}:null;
    resetNodes();
    if(!current)return;
    const html=document.documentElement;
    const family=String(current.family||'').trim();
    if(family)html.dataset.platformChipFamily=family;
    if(has(current,'accentColor'))html.style.setProperty('--platform-chip-accent',current.accentColor||'#315fc9');
    if(has(current,'surfaceOpacity'))html.style.setProperty('--platform-chip-opacity',String(Math.max(.2,Math.min(1,Number(current.surfaceOpacity||100)/100))));
    if(has(current,'blur'))html.style.setProperty('--platform-chip-blur',`${Math.max(0,Number(current.blur)||0)}px`);

    const nav=$('.nav-scroll');
    if(nav){
      if(family)nav.dataset.builderFamily=family;
      if(has(current,'accentColor'))nav.style.setProperty('--builder-nav-accent',current.accentColor||'#315fc9');
    }
    $$('.collection-filters').forEach(root=>{
      if(family)root.dataset.builderFamily=family;
      if(has(current,'accentColor'))root.style.setProperty('--builder-filter-accent',current.accentColor||'#315fc9');
      if(has(current,'surfaceOpacity'))root.style.setProperty('--builder-filter-opacity',String(Number(current.surfaceOpacity||100)/100));
      if(has(current,'blur'))root.style.setProperty('--builder-filter-blur',`${Math.max(0,Number(current.blur)||0)}px`);
    });
    if(has(current,'response')){
      const ms=duration(current);
      $$(':is(.nav-chip,.collection-filter)').forEach(node=>node.style.transitionDuration=`${ms}ms`);
      const indicator=$('.nav-v33-indicator');if(indicator)indicator.style.transitionDuration=`${ms}ms`;
    }
  }

  function bootstrapFromParent(){
    try{
      if(window.parent===window)return;
      const all=JSON.parse(window.parent.localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}');
      const config=all&&typeof all==='object'?all['filter-chip-rail']:null;
      apply(config&&typeof config==='object'?config:null);
    }catch{}
  }

  installStyle();
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.capabilityId!=='filter-chip-rail')return;
    if(data.type==='platform-ui-reset')apply(null);
    else if(data.type==='platform-ui-config')apply(data.config||{});
  });

  const observer=new MutationObserver(()=>{if(current)queueMicrotask(()=>apply(current));});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,120,420].forEach(delay=>setTimeout(bootstrapFromParent,delay));
})();
