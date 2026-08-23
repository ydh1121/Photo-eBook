(function(){
  if(window.__platformGlobalChipRuntimeV4)return;
  window.__platformGlobalChipRuntimeV4=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const filterControllers=new WeakMap();
  const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)';
  let current=null;

  function installStyle(){
    if($('#platform-global-chip-style-v4'))return;
    const style=document.createElement('style');
    style.id='platform-global-chip-style-v4';
    style.textContent=`
      /*
       * Canonical source: the former top-chapter-navigation runtime.
       * A family paints the rail. Individual inactive chips stay transparent.
       */
      html[data-platform-chip-family] :is(.nav-scroll,.collection-filters){
        position:relative!important;isolation:isolate!important;border-radius:999px!important
      }
      html[data-platform-chip-family] :is(.nav-chip,.collection-filter){
        position:relative!important;z-index:8!important;border-radius:999px!important;
        background:transparent!important;border-color:transparent!important;box-shadow:none!important;text-shadow:none!important
      }

      /* Former top-nav Material mode: exact runtime values from capability-runtime-v3. */
      html[data-platform-chip-family="material-flat"] .collection-filters,
      html[data-platform-chip-family="material-flat"] .nav-shell .nav-scroll{
        background:#f1f3f6!important;border:1px solid rgba(22,30,48,.07)!important;
        box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important
      }
      html[data-platform-chip-family="material-flat"] :is(.nav-chip,.collection-filter){color:#626a74!important}

      /* Former top-nav iOS Flat mode: exact runtime values from capability-runtime-v3. */
      html[data-platform-chip-family="ios-flat"] .collection-filters,
      html[data-platform-chip-family="ios-flat"] .nav-shell .nav-scroll{
        background:rgba(244,247,251,var(--platform-chip-flat-opacity,.88))!important;
        border:1px solid rgba(22,30,48,.075)!important;
        box-shadow:0 5px 16px rgba(25,38,62,.06)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,12px))!important;
        backdrop-filter:blur(var(--platform-chip-blur,12px))!important
      }
      html[data-platform-chip-family="ios-flat"] :is(.nav-chip,.collection-filter){color:#626a74!important}

      /*
       * Former top-nav iOS Liquid mode. nav-scroll itself keeps the production
       * nav-corrections paint (including reading-progress wash). Collection
       * filters use the same glass surface without the progress layer.
       */
      html[data-platform-chip-family="ios-liquid"] .collection-filters{
        border:1px solid transparent!important;
        background:
          linear-gradient(180deg,
            rgb(255 255 255 / var(--platform-chip-glass-top,.43)),
            rgb(236 241 248 / var(--platform-chip-glass-bottom,.24))) padding-box,
          linear-gradient(125deg,
            rgb(255 255 255 / var(--platform-chip-edge-a,.88)) 0%,
            rgb(255 255 255 / var(--platform-chip-edge-b,.27)) 25%,
            rgb(165 190 225 / var(--platform-chip-edge-c,.14)) 49%,
            rgb(255 255 255 / var(--platform-chip-edge-d,.62)) 76%,
            rgb(255 255 255 / var(--platform-chip-edge-e,.20)) 100%) border-box!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.46),inset 0 -1px 0 rgba(82,104,137,.045),0 7px 22px rgba(35,52,82,.075)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,22px)) saturate(138%)!important;
        backdrop-filter:blur(var(--platform-chip-blur,22px)) saturate(138%)!important
      }
      html[data-platform-chip-family="ios-liquid"] .nav-shell .nav-scroll{
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,22px)) saturate(138%)!important;
        backdrop-filter:blur(var(--platform-chip-blur,22px)) saturate(138%)!important
      }
      html[data-platform-chip-family="ios-liquid"] :is(.nav-chip,.collection-filter){color:#636b76!important}

      html[data-theme="dark"][data-platform-chip-family="material-flat"] .collection-filters,
      html[data-theme="dark"][data-platform-chip-family="material-flat"] .nav-shell .nav-scroll{
        background:#1a1e25!important;border-color:rgba(255,255,255,.08)!important;box-shadow:none!important;color:#c4cad3!important
      }
      html[data-theme="dark"][data-platform-chip-family="material-flat"] :is(.nav-chip,.collection-filter){color:#c4cad3!important}
      html[data-theme="dark"][data-platform-chip-family="ios-flat"] .collection-filters,
      html[data-theme="dark"][data-platform-chip-family="ios-flat"] .nav-shell .nav-scroll{
        background:rgba(27,31,39,var(--platform-chip-flat-dark-opacity,.9))!important;border-color:rgba(255,255,255,.09)!important;
        box-shadow:0 6px 18px rgba(0,0,0,.22)!important;color:#c7ced8!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-blur,12px))!important;backdrop-filter:blur(var(--platform-chip-blur,12px))!important
      }
      html[data-theme="dark"][data-platform-chip-family="ios-flat"] :is(.nav-chip,.collection-filter){color:#c7ced8!important}
      html[data-theme="dark"][data-platform-chip-family="ios-liquid"] .collection-filters{
        background:
          linear-gradient(180deg,rgba(59,71,91,.54),rgba(22,27,35,.56)) padding-box,
          linear-gradient(125deg,rgba(255,255,255,.20),rgba(255,255,255,.055) 30%,rgba(92,135,196,.065) 56%,rgba(255,255,255,.13) 78%,rgba(255,255,255,.035)) border-box!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.075),inset 0 -1px 0 rgba(0,0,0,.17),0 7px 20px rgba(0,0,0,.14)!important;
        -webkit-backdrop-filter:blur(var(--platform-chip-dark-blur,24px)) saturate(132%)!important;
        backdrop-filter:blur(var(--platform-chip-dark-blur,24px)) saturate(132%)!important
      }
      html[data-theme="dark"][data-platform-chip-family="ios-liquid"] .nav-shell .nav-scroll{
        -webkit-backdrop-filter:blur(var(--platform-chip-dark-blur,24px)) saturate(132%)!important;
        backdrop-filter:blur(var(--platform-chip-dark-blur,24px)) saturate(132%)!important
      }
      html[data-theme="dark"][data-platform-chip-family="ios-liquid"] :is(.nav-chip,.collection-filter){color:#b7c0cd!important}

      /* Former top-nav flat selection: solid accent, no residual liquid layer. */
      html[data-platform-chip-family]:not([data-platform-chip-family="ios-liquid"]) :is(.nav-v33-indicator,.platform-filter-chip-indicator){display:none!important}
      html[data-platform-chip-family]:not([data-platform-chip-family="ios-liquid"]) :is(.nav-chip,.collection-filter).is-active{
        background:var(--platform-chip-accent,#437ce7)!important;color:#fff!important;
        border-color:transparent!important;box-shadow:none!important
      }

      /* Canonical liquid fallback before the shared moving selector is mounted. */
      html[data-platform-chip-family="ios-liquid"] .nav-scroll:not(.v33-liquid-ready) .nav-chip.is-active,
      html[data-platform-chip-family="ios-liquid"] .collection-filters:not([data-platform-liquid-ready="true"]) .collection-filter.is-active{
        color:#fff!important;border-color:transparent!important;
        background:linear-gradient(180deg,var(--platform-chip-liquid-top,rgba(102,157,248,.94)) 0%,var(--platform-chip-liquid-mid,rgba(67,124,231,.92)) 52%,var(--platform-chip-liquid-bottom,rgba(44,91,202,.94)) 100%)!important;
        box-shadow:0 5px 14px var(--platform-chip-liquid-shadow,rgba(35,82,176,.22)),inset 0 1px 0 rgba(255,255,255,.30),inset 0 -1px 0 rgba(18,58,146,.13)!important
      }
      html[data-platform-chip-family="ios-liquid"] .nav-scroll.v33-liquid-ready .nav-chip.is-active,
      html[data-platform-chip-family="ios-liquid"] .collection-filters[data-platform-liquid-ready="true"] .collection-filter.is-active{
        background:transparent!important;color:#fff!important;border-color:transparent!important;box-shadow:none!important
      }

      /* Filter selector uses the same v37 skin that the former top nav used. */
      .platform-filter-chip-indicator{
        position:absolute!important;z-index:6!important;left:0!important;top:0!important;display:none;
        overflow:visible!important;border:0!important;background:transparent!important;box-shadow:none!important;
        pointer-events:none!important;border-radius:999px!important;transform-origin:center center!important;
        backface-visibility:hidden!important;contain:layout style!important
      }
      html[data-platform-chip-family="ios-liquid"] .platform-filter-chip-indicator{display:block}
      html[data-platform-chip-family="ios-liquid"] :is(.platform-filter-chip-indicator,.nav-v33-indicator)>.v37-liquid-skin{
        background:
          linear-gradient(180deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,0) 34%),
          linear-gradient(180deg,var(--platform-chip-liquid-top,rgba(102,157,248,.94)) 0%,var(--platform-chip-liquid-mid,rgba(67,124,231,.92)) 52%,var(--platform-chip-liquid-bottom,rgba(44,91,202,.94)) 100%)!important;
        box-shadow:0 5px 14px var(--platform-chip-liquid-shadow,rgba(35,82,176,.22)),inset 0 1px 0 rgba(255,255,255,.30),inset 0 -1px 0 rgba(18,58,146,.13)!important
      }
    `;
    document.head.appendChild(style);
  }

  function durationFor(distance,config){
    if(config?.response==='lively')return Math.round(Math.min(315,Math.max(210,205+distance*.08)));
    if(config?.response==='calm')return Math.round(Math.min(470,Math.max(320,300+distance*.18)));
    return Math.round(Math.min(380,Math.max(255,245+distance*.10)));
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
    const oldX=Number(indicator.dataset.x||x),oldW=Number(indicator.dataset.w||w);
    const distance=Math.max(Math.abs(x-oldX),Math.abs(w-oldW));
    const ms=durationFor(distance,current);
    indicator.style.transition=instant?'none':`transform ${ms}ms ${BREEZE},width ${ms}ms ${BREEZE},height ${ms}ms ${BREEZE}`;
    indicator.style.width=`${w}px`;indicator.style.height=`${h}px`;
    indicator.style.transform=`translate3d(${x}px,${y}px,0)`;
    indicator.dataset.x=String(x);indicator.dataset.w=String(w);
    root.dataset.platformLiquidReady='true';
    if(instant)requestAnimationFrame(()=>{
      if(indicator.isConnected)indicator.style.transition=`transform ${ms}ms ${BREEZE},width ${ms}ms ${BREEZE},height ${ms}ms ${BREEZE}`;
    });
  }

  function installFilterController(root){
    if(!root)return;
    if(filterControllers.has(root)){updateFilterIndicator(root,{instant:true});return;}
    ensureFilterIndicator(root);
    const classObserver=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'&&record.target.matches?.('.collection-filter'))){
        requestAnimationFrame(()=>updateFilterIndicator(root));
      }
    });
    classObserver.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
    const childObserver=new MutationObserver(records=>{
      if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&!node.classList?.contains('platform-filter-chip-indicator')))){
        requestAnimationFrame(()=>updateFilterIndicator(root,{instant:true}));
      }
    });
    childObserver.observe(root,{childList:true,subtree:false});
    const resize=()=>updateFilterIndicator(root,{instant:true});
    window.addEventListener('resize',resize,{passive:true});
    if('ResizeObserver'in window)new ResizeObserver(resize).observe(root);
    filterControllers.set(root,{classObserver,childObserver});
    requestAnimationFrame(()=>updateFilterIndicator(root,{instant:true}));
  }

  function setLiquidPalette(html,accent){
    const normalized=String(accent||'#437ce7').toLowerCase();
    if(normalized==='#437ce7'){
      html.style.setProperty('--platform-chip-liquid-top','rgba(102,157,248,.94)');
      html.style.setProperty('--platform-chip-liquid-mid','rgba(67,124,231,.92)');
      html.style.setProperty('--platform-chip-liquid-bottom','rgba(44,91,202,.94)');
      html.style.setProperty('--platform-chip-liquid-shadow','rgba(35,82,176,.22)');
      return;
    }
    html.style.setProperty('--platform-chip-liquid-top',`color-mix(in srgb,${accent} 66%,white)`);
    html.style.setProperty('--platform-chip-liquid-mid',accent);
    html.style.setProperty('--platform-chip-liquid-bottom',`color-mix(in srgb,${accent} 84%,#173d9b)`);
    html.style.setProperty('--platform-chip-liquid-shadow',`color-mix(in srgb,${accent} 22%,transparent)`);
  }

  function setSurfaceAlpha(html,percent){
    const ratio=Math.max(.2,Math.min(1,Number(percent??100)/100));
    html.style.setProperty('--platform-chip-flat-opacity',String(ratio));
    html.style.setProperty('--platform-chip-flat-dark-opacity',String(Math.min(.98,ratio+.02)));
    html.style.setProperty('--platform-chip-glass-top',String(.43*ratio));
    html.style.setProperty('--platform-chip-glass-bottom',String(.24*ratio));
    html.style.setProperty('--platform-chip-edge-a',String(.88*ratio));
    html.style.setProperty('--platform-chip-edge-b',String(.27*ratio));
    html.style.setProperty('--platform-chip-edge-c',String(.14*ratio));
    html.style.setProperty('--platform-chip-edge-d',String(.62*ratio));
    html.style.setProperty('--platform-chip-edge-e',String(.20*ratio));
  }

  function resetNodes(){
    const html=document.documentElement;
    delete html.dataset.platformChipFamily;
    for(const name of [
      '--platform-chip-accent','--platform-chip-blur','--platform-chip-dark-blur','--platform-chip-flat-opacity','--platform-chip-flat-dark-opacity',
      '--platform-chip-glass-top','--platform-chip-glass-bottom','--platform-chip-edge-a','--platform-chip-edge-b','--platform-chip-edge-c','--platform-chip-edge-d','--platform-chip-edge-e',
      '--platform-chip-liquid-top','--platform-chip-liquid-mid','--platform-chip-liquid-bottom','--platform-chip-liquid-shadow'
    ])html.style.removeProperty(name);
    const nav=$('.nav-scroll');
    if(nav){delete nav.dataset.builderFamily;nav.style.removeProperty('--builder-nav-accent');}
    $$('.collection-filters').forEach(root=>{
      delete root.dataset.builderFamily;delete root.dataset.platformLiquidReady;
      root.style.removeProperty('--builder-filter-accent');
      root.style.removeProperty('gap');root.style.removeProperty('padding-left');root.style.removeProperty('padding-right');
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
    const accent=current.accentColor||'#437ce7';
    if(family)html.dataset.platformChipFamily=family;
    html.style.setProperty('--platform-chip-accent',accent);
    setLiquidPalette(html,accent);
    if(has(current,'surfaceOpacity'))setSurfaceAlpha(html,current.surfaceOpacity);
    if(has(current,'blur')){
      const blur=Math.max(0,Number(current.blur)||0);
      html.style.setProperty('--platform-chip-blur',`${blur}px`);
      html.style.setProperty('--platform-chip-dark-blur',`${blur+2}px`);
    }

    const nav=$('.nav-scroll');
    if(nav){
      if(family)nav.dataset.builderFamily=family;
      nav.style.setProperty('--builder-nav-accent',accent);
      if(family==='ios-liquid')requestAnimationFrame(()=>nav.__photoLiquidController?.repair?.());
    }
    $$('.collection-filters').forEach(root=>{
      if(family)root.dataset.builderFamily=family;
      root.style.setProperty('--builder-filter-accent',accent);
      if(has(current,'gap'))root.style.setProperty('gap',`${Math.max(0,Number(current.gap)||0)}px`,'important');
      if(has(current,'runway')){
        const runway=Math.max(0,Number(current.runway)||0);
        root.style.setProperty('padding-left',`${runway}px`,'important');
        root.style.setProperty('padding-right',`${runway}px`,'important');
      }
      const indicator=$(':scope > .platform-filter-chip-indicator',root);if(indicator)indicator.style.removeProperty('display');
      if(family==='ios-liquid')installFilterController(root);
    });
    if(has(current,'response')&&family!=='ios-liquid'){
      const ms=current.response==='lively'?145:current.response==='standard'?190:240;
      $$(':is(.nav-chip,.collection-filter)').forEach(node=>node.style.transitionDuration=`${ms}ms`);
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

  const observer=new MutationObserver(records=>{
    if(!current||current.family!=='ios-liquid')return;
    if(!records.some(record=>record.addedNodes.length||record.removedNodes.length))return;
    requestAnimationFrame(()=>$$('.collection-filters').forEach(installFilterController));
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  [0,120,420].forEach(delay=>setTimeout(bootstrapFromParent,delay));
})();
