/* v3: canonical liquid controller shared by navigation and filter-chip rails.
   Screen mode no longer owns or injects a separate theme-choice control; it composes
   the approved filter-chip module, which attaches to this motion owner explicitly. */
(function(){
  if(window.__photoCanonicalLiquidInstalled)return;
  window.__photoCanonicalLiquidInstalled=true;
  window.__photoV49CoreInstalled=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)';
  const EDGE='cubic-bezier(0.34, 1.24, 0.64, 1)';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
  const controllers=new WeakMap();
  let mountRaf=0;

  function currentThemeChoice(){
    const dom=document.documentElement.dataset.themeChoice;
    if(['light','dark','system'].includes(dom))return dom;
    try{
      const stored=localStorage.getItem(THEME_KEY);
      if(['light','dark','system'].includes(stored))return stored;
    }catch{}
    return 'light';
  }

  function applyTheme(choice){
    choice=['light','dark','system'].includes(choice)?choice:'light';
    const dark=choice==='dark'||(choice==='system'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.themeChoice=choice;
    document.documentElement.dataset.theme=dark?'dark':'light';
    document.documentElement.style.colorScheme=dark?'dark':'light';
    try{localStorage.setItem(THEME_KEY,choice);}catch{}
    window.dispatchEvent(new CustomEvent('photo-theme-change',{detail:{choice,effective:dark?'dark':'light'}}));
  }

  function installTheme(){
    applyTheme(currentThemeChoice());
    const media=window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener?.('change',()=>{
      if(currentThemeChoice()==='system')applyTheme('system');
    });
    window.setPhotoRoadmapTheme=applyTheme;
  }

  function skinMarkup(){return '<span class="v37-liquid-skin" aria-hidden="true"></span>';}

  if(typeof window.nav==='function'&&!window.__photoCanonicalNavMarkup){
    window.__photoCanonicalNavMarkup=true;
    const baseNav=window.nav;
    window.nav=function(...args){
      const html=String(baseNav(...args)||'');
      if(html.includes('nav-v33-indicator'))return html;
      return html.replace(
        '<nav class="nav-scroll" aria-label="챕터">',
        `<nav class="nav-scroll" aria-label="챕터"><span class="nav-v33-indicator" aria-hidden="true">${skinMarkup()}</span>`
      );
    };
  }

  function ensureIndicator(root,indicatorClass){
    if(!root)return null;
    const indicators=$$(`:scope > .${indicatorClass}`,root);
    indicators.slice(1).forEach(node=>node.remove());
    let indicator=indicators[0];
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className=indicatorClass;
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }
    let skin=$(':scope > .v37-liquid-skin',indicator);
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    return indicator;
  }

  function makeController(root,{itemSelector,indicatorClass,readyClass,slow=false,durationScale=1}={}){
    if(!root)return null;
    const existing=controllers.get(root);
    if(existing){existing.repair();return existing;}

    const state={x:0,y:0,w:0,h:0,ready:false,lastWidth:root.clientWidth||0};
    let indicator=ensureIndicator(root,indicatorClass);

    function durationFor(x,w){
      const distance=Math.max(Math.abs(x-state.x),Math.abs(w-state.w));
      const base=clamp((slow?300:245)+distance*(slow?.18:.10),slow?320:255,slow?470:380);
      return Math.round(base*durationScale);
    }
    function activeItem(){return $(itemSelector+'.is-active',root)||$(itemSelector,root);}
    function geometry(){
      const item=activeItem();
      if(!item)return null;
      const x=item.offsetLeft,y=item.offsetTop,w=item.offsetWidth,h=item.offsetHeight;
      if(!w||!h)return null;
      return {item,x,y,w,h};
    }
    function setTransition(current,duration,easing,instant){
      current.style.transition=(instant||reduced())?'none':`transform ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}`;
    }
    function update({instant=false}={}){
      if(!root.isConnected)return;
      const next=geometry();
      if(!next)return;
      indicator=ensureIndicator(root,indicatorClass);
      const first=!state.ready;
      const duration=durationFor(next.x,next.w);
      const firstItem=$(itemSelector,root);
      const easing=root.matches('.nav-scroll')&&next.item===firstItem?EDGE:BREEZE;
      setTransition(indicator,duration,easing,instant||first);
      indicator.style.width=next.w+'px';
      indicator.style.height=next.h+'px';
      indicator.style.transform=`translate3d(${next.x}px,${next.y}px,0)`;
      indicator.dataset.x=String(next.x);
      indicator.dataset.y=String(next.y);
      indicator.dataset.w=String(next.w);
      indicator.dataset.h=String(next.h);
      indicator.dataset.ready='true';
      state.x=next.x;state.y=next.y;state.w=next.w;state.h=next.h;state.ready=true;
      root.classList.add(readyClass,'v41-skin-ready','v39-liquid-ready');
      if((instant||first)&&!reduced())requestAnimationFrame(()=>{
        if(indicator?.isConnected)setTransition(indicator,duration,easing,false);
      });
    }
    function repair(){
      if(!root.isConnected)return;
      const hadIndicator=Boolean(indicator?.isConnected&&indicator.parentNode===root);
      const hadSkin=hadIndicator&&Boolean($(':scope > .v37-liquid-skin',indicator));
      if(hadIndicator&&hadSkin&&root.classList.contains(readyClass)&&root.classList.contains('v41-skin-ready'))return;
      indicator=ensureIndicator(root,indicatorClass);
      update({instant:true});
    }

    const classObserver=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'&&record.target.matches?.(itemSelector))){
        requestAnimationFrame(()=>update({instant:false}));
      }
    });
    classObserver.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});

    const childObserver=new MutationObserver(()=>{
      const hasIndicator=Boolean($(`:scope > .${indicatorClass}`,root));
      const hasSkin=Boolean($(`:scope > .${indicatorClass} > .v37-liquid-skin`,root));
      if(!hasIndicator||!hasSkin)requestAnimationFrame(repair);
    });
    childObserver.observe(root,{childList:true,subtree:true});

    const onResize=()=>{
      const width=root.clientWidth||0;
      if(Math.abs(width-state.lastWidth)<2)return;
      state.lastWidth=width;
      clearTimeout(root.__photoLiquidResizeTimer);
      root.__photoLiquidResizeTimer=setTimeout(()=>update({instant:true}),90);
    };
    window.addEventListener('resize',onResize,{passive:true});
    window.visualViewport?.addEventListener?.('resize',onResize,{passive:true});

    const controller={update,repair};
    controllers.set(root,controller);
    root.__photoLiquidController=controller;
    requestAnimationFrame(()=>update({instant:true}));
    return controller;
  }

  function installReadingProgress(nav){
    if(!nav||nav.dataset.canonicalProgress==='true')return;
    nav.dataset.canonicalProgress='true';
    let raf=0;
    const update=()=>{
      raf=0;
      const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const ratio=clamp((window.scrollY||window.pageYOffset||0)/max,0,1);
      nav.style.setProperty('--v32-progress',`${(ratio*100).toFixed(3)}%`);
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    update();
  }

  function attachNavigation(nav){
    if(!nav)return null;
    installReadingProgress(nav);
    return makeController(nav,{itemSelector:'.nav-chip',indicatorClass:'nav-v33-indicator',readyClass:'v33-liquid-ready',durationScale:1.10});
  }
  function attachFilterRail(root){
    if(!root)return null;
    return makeController(root,{itemSelector:'.collection-tab',indicatorClass:'collection-v33-indicator',readyClass:'v33-liquid-ready',slow:true});
  }
  function installNav(){
    const nav=$('.nav-scroll');
    if(!nav)return false;
    attachNavigation(nav);
    return true;
  }
  function installCollectionTabs(root=document){
    const tabs=$$('.collection-tabs',root);
    if(!tabs.length)return false;
    tabs.forEach(attachFilterRail);
    return true;
  }

  function nodeContainsNav(node){
    return Boolean(node?.nodeType===1&&(node.matches?.('.nav-scroll')||node.querySelector?.('.nav-scroll')));
  }
  function nodeContainsFilterRail(node){
    return Boolean(node?.nodeType===1&&(node.matches?.('.collection-tabs')||node.querySelector?.('.collection-tabs')));
  }
  function scheduleMountInstall(){
    if(mountRaf)return;
    mountRaf=requestAnimationFrame(()=>{mountRaf=0;installNav();installCollectionTabs();});
  }
  function watchNavigationMounts(){
    installNav();
    installCollectionTabs();
    const body=document.body;
    if(!body||body.dataset.canonicalLiquidNavWatch==='true')return;
    body.dataset.canonicalLiquidNavWatch='true';
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if([...record.addedNodes].some(node=>nodeContainsNav(node)||nodeContainsFilterRail(node))){scheduleMountInstall();return;}
      }
    });
    observer.observe(body,{childList:true,subtree:true});
    [80,220,520,1100,2200].forEach(delay=>setTimeout(()=>{installNav();installCollectionTabs();},delay));
  }

  window.PhotoLiquidController=Object.freeze({attachNavigation,attachFilterRail});

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#collectionFab')){
      requestAnimationFrame(()=>installCollectionTabs());
      setTimeout(()=>installCollectionTabs(),40);
      return;
    }
    if(event.target.closest?.('.collection-tab'))requestAnimationFrame(()=>installCollectionTabs());
  },true);

  window.addEventListener('pageshow',()=>{
    setTimeout(()=>{installNav();installCollectionTabs();},80);
  },{passive:true});
  window.addEventListener('photo-theme-change',()=>{
    requestAnimationFrame(()=>{
      $$('.nav-scroll').forEach(root=>root.__photoLiquidController?.repair());
      $$('.collection-tabs').forEach(root=>root.__photoLiquidController?.repair());
    });
  },{passive:true});

  installTheme();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchNavigationMounts,{once:true});
  else watchNavigationMounts();
})();
