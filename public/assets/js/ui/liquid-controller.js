/* v1: canonical liquid controller for nav, collection tabs, and theme controls.
   Loaded immediately after the base markup helpers so first paint never depends
   on a late enhancement race. This file intentionally owns these selectors and
   prevents the retired script-27 controller from attaching a second owner. */
(function(){
  if(window.__photoCanonicalLiquidInstalled)return;
  window.__photoCanonicalLiquidInstalled=true;

  /* script-27 uses this guard. Claim ownership before that deferred asset runs. */
  window.__photoV49CoreInstalled=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)';
  const EDGE='cubic-bezier(0.34, 1.24, 0.64, 1)';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
  const controllers=new WeakMap();

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
    $$('.theme-choice button').forEach(button=>button.classList.toggle('is-active',button.dataset.themeChoice===choice));
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

  function skinMarkup(){
    return '<span class="v37-liquid-skin" aria-hidden="true"></span>';
  }

  /* Seed the top-nav indicator in the actual first-paint HTML. MutationObserver
     then measures it in the same rendering turn that #app receives its markup. */
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
      current.style.transition=(instant||reduced())
        ?'none'
        :`transform ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}`;
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

  function installNav(){
    const nav=$('.nav-scroll');
    if(!nav)return false;
    installReadingProgress(nav);
    makeController(nav,{itemSelector:'.nav-chip',indicatorClass:'nav-v33-indicator',readyClass:'v33-liquid-ready',durationScale:1.10});
    return true;
  }

  function installCollectionTabs(){
    const tabs=$('.collection-tabs');
    if(!tabs)return false;
    makeController(tabs,{itemSelector:'.collection-tab',indicatorClass:'collection-v33-indicator',readyClass:'v33-liquid-ready',slow:true});
    return true;
  }

  function themeCardMarkup(){
    const choice=currentThemeChoice();
    return `<section class="theme-setting-card" aria-label="화면 모드"><div class="theme-setting-card__copy"><strong>화면 모드</strong><small>화이트, 다크 또는 기기 설정에 맞춰 표시할 수 있습니다.</small></div><div class="theme-choice" role="group" aria-label="화면 모드 선택"><button type="button" data-theme-choice="light" class="${choice==='light'?'is-active':''}">화이트</button><button type="button" data-theme-choice="dark" class="${choice==='dark'?'is-active':''}">다크</button><button type="button" data-theme-choice="system" class="${choice==='system'?'is-active':''}">시스템</button></div></section>`;
  }

  function injectThemeControls(){
    const settings=$('.collection-settings');
    if(!settings)return false;
    let card=$('.theme-setting-card',settings);
    if(!card){
      const summary=$('.collection-settings__summary',settings);
      if(summary)summary.insertAdjacentHTML('afterend',themeCardMarkup());
      else settings.insertAdjacentHTML('afterbegin',themeCardMarkup());
      card=$('.theme-setting-card',settings);
    }
    const choice=$('.theme-choice',card||settings);
    if(!choice)return false;
    makeController(choice,{itemSelector:'button',indicatorClass:'theme-v34-indicator',readyClass:'v34-liquid-ready',slow:true});
    $$('button[data-theme-choice]',choice).forEach(button=>{
      if(button.dataset.canonicalThemeBound==='true')return;
      button.dataset.canonicalThemeBound='true';
      button.addEventListener('click',()=>applyTheme(button.dataset.themeChoice||'light'));
    });
    return true;
  }

  function watchInitialNav(){
    if(installNav())return;
    const app=$('#app');
    if(!app)return;
    const observer=new MutationObserver(()=>{
      if(installNav())observer.disconnect();
    });
    observer.observe(app,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
    [80,220,520,1100,2200].forEach(delay=>setTimeout(()=>{if(installNav())observer.disconnect();},delay));
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#collectionFab')){
      requestAnimationFrame(installCollectionTabs);
      setTimeout(installCollectionTabs,40);
      return;
    }
    if(event.target.closest?.('.collection-tab')){
      requestAnimationFrame(installCollectionTabs);
      if(event.target.closest?.('[data-library-tab="settings"]')){
        setTimeout(()=>{injectThemeControls();installCollectionTabs();},50);
      }
      return;
    }
  },true);

  window.addEventListener('pageshow',()=>{
    setTimeout(()=>{installNav();installCollectionTabs();injectThemeControls();},80);
  },{passive:true});
  window.addEventListener('photo-theme-change',()=>{
    requestAnimationFrame(()=>{
      $('.nav-scroll')?.__photoLiquidController?.repair();
      $('.collection-tabs')?.__photoLiquidController?.repair();
      $('.theme-choice')?.__photoLiquidController?.repair();
    });
  },{passive:true});

  installTheme();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchInitialNav,{once:true});
  else watchInitialNav();
})();
