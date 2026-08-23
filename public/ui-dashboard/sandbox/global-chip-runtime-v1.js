(function(){
  if(window.__platformGlobalChipRuntimeV2)return;
  window.__platformGlobalChipRuntimeV2=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const filterControllers=new WeakMap();
  let current=null;

  function installStyle(){
    if($('#platform-global-chip-style-v2'))return;
    const style=document.createElement('style');
    style.id='platform-global-chip-style-v2';
    style.textContent=`
      html[data-platform-chip-family="material-flat"] :is(.nav-chip,.collection-filter){
        border-radius:8px!important;background:#f2f3f5!important;color:#666d78!important;
        border-color:rgba(27,39,63,.07)!important;box-shadow:none!important;
        -webkit-backdrop-filter:none!important;backdrop-filter:none!important
      }
      html[data-platform-chip-family="ios-flat"] :is(.nav-chip,.collection-filter){
        border-radius:999px!important;background:rgba(243,244,247,var(--platform-chip-opacity,1))!important;
        color:#6f747d!important;border-color:rgba(28,40,65,.06)!important;
        box-shadow:0 2px 10px rgba(28,39,62,.045)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,0px))!important;backdrop-filter:blur(var(--platform-chip-blur,0px))!important
      }
      html[data-platform-chip-family="ios-liquid"] .nav-chip{
        border-radius:999px!important;background:transparent!important;color:#667080!important;border-color:transparent!important;
        box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important
      }
      html[data-platform-chip-family="ios-liquid"] .collection-filter{
        border-radius:999px!important;background:rgba(245,248,253,var(--platform-chip-inactive-opacity,.64))!important;
        color:#667080!important;border-color:rgba(255,255,255,.48)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.52),0 3px 12px rgba(30,46,76,.055)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,18px)) saturate(128%)!important;
        backdrop-filter:blur(var(--platform-chip-blur,18px)) saturate(128%)!important
      }
      html[data-theme="dark"][data-platform-chip-family="material-flat"] :is(.nav-chip,.collection-filter){background:#20242b!important;color:#aeb6c2!important;border-color:rgba(255,255,255,.07)!important}
      html[data-theme="dark"][data-platform-chip-family="ios-flat"] :is(.nav-chip,.collection-filter){background:rgba(31,35,43,var(--platform-chip-opacity,1))!important;color:#aeb6c2!important;border-color:rgba(255,255,255,.07)!important}
      html[data-theme="dark"][data-platform-chip-family="ios-liquid"] .nav-chip{background:transparent!important;color:#bac2ce!important;border-color:transparent!important}
      html[data-theme="dark"][data-platform-chip-family="ios-liquid"] .collection-filter{background:rgba(31,37,47,var(--platform-chip-inactive-opacity,.64))!important;color:#bac2ce!important;border-color:rgba(255,255,255,.08)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 5px 14px rgba(0,0,0,.14)!important}

      html[data-platform-chip-family] .collection-filter.is-active,
      html[data-platform-chip-family]:not([data-platform-chip-family="ios-liquid"]) .nav-chip.is-active{
        background:var(--platform-chip-accent,#315fc9)!important;color:#fff!important;
        border-color:var(--platform-chip-accent,#315fc9)!important;box-shadow:none!important
      }
      html[data-platform-chip-family="ios-liquid"] .nav-scroll:not(.v33-liquid-ready) .nav-chip.is-active,
      html[data-platform-chip-family="ios-liquid"] .collection-filters:not([data-platform-liquid-ready="true"]) .collection-filter.is-active{
        background:linear-gradient(180deg,color-mix(in srgb,var(--platform-chip-accent,#437ce7) 76%,white),var(--platform-chip-accent,#437ce7))!important;
        color:#fff!important;border-color:transparent!important;
        box-shadow:0 6px 16px color-mix(in srgb,var(--platform-chip-accent,#437ce7) 25%,transparent),inset 0 1px 0 rgba(255,255,255,.3)!important
      }
      html[data-platform-chip-family="ios-liquid"] .nav-scroll.v33-liquid-ready .nav-chip.is-active,
      html[data-platform-chip-family="ios-liquid"] .collection-filters[data-platform-liquid-ready="true"] .collection-filter.is-active{
        background:transparent!important;color:#fff!important;border-color:transparent!important;box-shadow:none!important
      }
      html[data-platform-chip-family]:not([data-platform-chip-family="ios-liquid"]) .nav-v33-indicator{display:none!important}

      .platform-filter-chip-indicator{
        position:absolute!important;z-index:6!important;left:0!important;top:0!important;display:none;
        overflow:visible!important;border:0!important;background:transparent!important;box-shadow:none!important;
        pointer-events:none!important;border-radius:999px!important;transform-origin:center center!important;
        backface-visibility:hidden!important;will-change:transform,width,height
      }
      html[data-platform-chip-family="ios-liquid"] .platform-filter-chip-indicator{display:block}
      .platform-filter-chip-indicator>.v37-liquid-skin,
      html[data-platform-chip-family="ios-liquid"] .nav-v33-indicator>.v37-liquid-skin{
        background:
          linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 34%),
          linear-gradient(180deg,
            color-mix(in srgb,var(--platform-chip-accent,#437ce7) 58%,white) 0%,
            var(--platform-chip-accent,#437ce7) 54%,
            color-mix(in srgb,var(--platform-chip-accent,#437ce7) 86%,#173d9b) 100%)!important;
        box-shadow:0 6px 17px color-mix(in srgb,var(--platform-chip-accent,#437ce7) 28%,transparent),inset 0 1px 0 rgba(255,255,255,.31),inset 0 -1px 0 rgba(18,58,146,.13)!important
      }
    `;
    document.head.appendChild(style);
  }

  function duration(config){
    if(config?.response==='lively')return 145;
    if(config?.response==='standard')return 215;
    return 270;
  }

  function ensureFilterIndicator(root){
    let indicator=$(':scope > .platform-filter-chip-indicator',root);
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className='platform-filter-chip-indicator';
      indicator.setAttribute('aria-hidden','true');
      indicator.innerHTML='<span class="v37-liquid-skin" aria-hidden="true"></span>';
      root.prepend(indicator);
    }
    return indicator;
  }

  function updateFilterIndicator(root,{instant=false}={}){
    if(!root?.isConnected||document.documentElement.dataset.platformChipFamily!=='ios-liquid')return;
    const active=$('.collection-filter.is-active',root)||$('.collection-filter',root);
    if(!active)return;
    const indicator=ensureFilterIndicator(root);
    const x=active.offsetLeft,y=active.offsetTop,w=active.offsetWidth,h=active.offsetHeight;
    if(!w||!h)return;
    const ms=duration(current);
    indicator.style.transition=instant?'none':`transform ${ms}ms cubic-bezier(.34,1.38,.64,1),width ${ms}ms cubic-bezier(.34,1.38,.64,1),height ${ms}ms cubic-bezier(.34,1.38,.64,1)`;
    indicator.style.width=`${w}px`;indicator.style.height=`${h}px`;
    indicator.style.transform=`translate3d(${x}px,${y}px,0)`;
    root.dataset.platformLiquidReady='true';
    if(instant)requestAnimationFrame(()=>{if(indicator.isConnected)indicator.style.transition=`transform ${ms}ms cubic-bezier(.34,1.38,.64,1),width ${ms}ms cubic-bezier(.34,1.38,.64,1),height ${ms}ms cubic-bezier(.34,1.38,.64,1)`;});
  }

  function installFilterController(root){
    if(!root)return;
    if(filterControllers.has(root)){updateFilterIndicator(root,{instant:true});return;}
    ensureFilterIndicator(root);
    const classObserver=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'))requestAnimationFrame(()=>updateFilterIndicator(root));
    });
    classObserver.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
    const childObserver=new MutationObserver(()=>requestAnimationFrame(()=>updateFilterIndicator(root,{instant:true})));
    childObserver.observe(root,{childList:true,subtree:false});
    const resize=()=>updateFilterIndicator(root,{instant:true});
    window.addEventListener('resize',resize,{passive:true});
    if('ResizeObserver'in window)new ResizeObserver(resize).observe(root);
    filterControllers.set(root,{classObserver,childObserver});
    requestAnimationFrame(()=>updateFilterIndicator(root,{instant:true}));
  }

  function resetNodes(){
    const html=document.documentElement;
    delete html.dataset.platformChipFamily;
    for(const name of ['--platform-chip-accent','--platform-chip-opacity','--platform-chip-inactive-opacity','--platform-chip-blur'])html.style.removeProperty(name);
    const nav=$('.nav-scroll');
    if(nav){delete nav.dataset.builderFamily;nav.style.removeProperty('--builder-nav-accent');}
    $$('.collection-filters').forEach(root=>{
      delete root.dataset.builderFamily;delete root.dataset.platformLiquidReady;
      root.style.removeProperty('--builder-filter-accent');root.style.removeProperty('--builder-filter-opacity');root.style.removeProperty('--builder-filter-blur');
      const indicator=$(':scope > .platform-filter-chip-indicator',root);if(indicator)indicator.style.display='none';
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
    if(has(current,'accentColor'))html.style.setProperty('--platform-chip-accent',current.accentColor||'#437ce7');
    if(has(current,'surfaceOpacity')){
      const opacity=Math.max(.2,Math.min(1,Number(current.surfaceOpacity||100)/100));
      html.style.setProperty('--platform-chip-opacity',String(opacity));
      html.style.setProperty('--platform-chip-inactive-opacity',String(Math.min(.82,Math.max(.42,opacity*.82))));
    }
    if(has(current,'blur'))html.style.setProperty('--platform-chip-blur',`${Math.max(0,Number(current.blur)||0)}px`);

    const nav=$('.nav-scroll');
    if(nav){
      if(family)nav.dataset.builderFamily=family;
      if(has(current,'accentColor'))nav.style.setProperty('--builder-nav-accent',current.accentColor||'#437ce7');
      if(family==='ios-liquid')requestAnimationFrame(()=>nav.__photoLiquidController?.repair?.());
    }
    $$('.collection-filters').forEach(root=>{
      if(family)root.dataset.builderFamily=family;
      if(has(current,'accentColor'))root.style.setProperty('--builder-filter-accent',current.accentColor||'#437ce7');
      if(has(current,'surfaceOpacity'))root.style.setProperty('--builder-filter-opacity',String(Number(current.surfaceOpacity||100)/100));
      if(has(current,'blur'))root.style.setProperty('--builder-filter-blur',`${Math.max(0,Number(current.blur)||0)}px`);
      const indicator=$(':scope > .platform-filter-chip-indicator',root);if(indicator)indicator.style.removeProperty('display');
      if(family==='ios-liquid')installFilterController(root);
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

  const observer=new MutationObserver(()=>{
    if(!current)return;
    requestAnimationFrame(()=>{
      $$('.collection-filters').forEach(root=>{
        if(current?.family==='ios-liquid')installFilterController(root);
      });
    });
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,120,420].forEach(delay=>setTimeout(bootstrapFromParent,delay));
})();