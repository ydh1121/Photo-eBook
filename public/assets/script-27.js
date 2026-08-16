/* v54: restore single-owner liquid spring motion with surgical self-heal only. */
(function(){
  if(window.__photoV49CoreInstalled)return;
  window.__photoV49CoreInstalled=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const BREEZE_EASING='cubic-bezier(0.34, 1.56, 0.64, 1)';
  const EDGE_EASING='cubic-bezier(0.34, 1.24, 0.64, 1)';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;

  function waitFor(selector,timeout=14000){
    return new Promise(resolve=>{
      const first=$(selector);
      if(first)return resolve(first);
      const started=performance.now();
      const timer=setInterval(()=>{
        const node=$(selector);
        if(node||performance.now()-started>timeout){
          clearInterval(timer);
          resolve(node||null);
        }
      },100);
    });
  }

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

  function ensureSkin(indicator){
    if(!indicator)return null;
    let skin=$(':scope > .v37-liquid-skin',indicator);
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    return skin;
  }

  function installReadingProgress(nav){
    if(!nav||nav.dataset.v52ProgressBound==='true')return;
    nav.dataset.v52ProgressBound='true';
    let raf=0;
    const update=()=>{
      raf=0;
      const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const ratio=clamp((window.scrollY||window.pageYOffset||0)/max,0,1);
      nav.style.setProperty('--v32-progress',`${(ratio*100).toFixed(3)}%`);
    };
    const schedule=()=>{
      if(raf)return;
      raf=requestAnimationFrame(update);
    };
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener?.('resize',schedule,{passive:true});
    update();
  }

  function makeLiquidController(root,{itemSelector,indicatorClass,readyClass,slow=false,durationScale=1}={}){
    if(!root)return null;
    if(root.dataset.v49Liquid==='true'){
      root.__photoLiquidRepair?.();
      return root.__photoLiquidController||null;
    }
    root.dataset.v49Liquid='true';

    $$(`:scope > .${indicatorClass}`,root).slice(1).forEach(node=>node.remove());
    let indicator=$(`:scope > .${indicatorClass}`,root);
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className=indicatorClass;
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }
    ensureSkin(indicator);

    const state={x:0,y:0,w:0,h:0,ready:false};

    function durationFor(x,w){
      const distance=Math.max(Math.abs(x-state.x),Math.abs(w-state.w));
      const base=clamp((slow?300:245)+distance*(slow?.18:.10),slow?320:255,slow?470:380);
      return Math.round(base*durationScale);
    }

    function liveIndicator(){
      let changed=false;
      if(!indicator?.isConnected||indicator.parentNode!==root){
        $$(`:scope > .${indicatorClass}`,root).slice(1).forEach(node=>node.remove());
        indicator=$(`:scope > .${indicatorClass}`,root);
        if(!indicator){
          indicator=document.createElement('span');
          indicator.className=indicatorClass;
          indicator.setAttribute('aria-hidden','true');
          root.prepend(indicator);
        }
        changed=true;
      }
      if(!$(':scope > .v37-liquid-skin',indicator)){
        ensureSkin(indicator);
        changed=true;
      }
      return {indicator,changed};
    }

    function update({instant=false}={}){
      if(!root.isConnected)return;
      const item=$(itemSelector+'.is-active',root)||$(itemSelector,root);
      if(!item)return;
      const live=liveIndicator();
      const current=live.indicator;
      const x=item.offsetLeft,y=item.offsetTop,w=item.offsetWidth,h=item.offsetHeight;
      if(!w||!h)return;

      const first=!state.ready;
      const duration=durationFor(x,w);
      const firstItem=$(itemSelector,root);
      const edgeTarget=root.matches('.nav-scroll')&&item===firstItem;
      const easing=edgeTarget?EDGE_EASING:BREEZE_EASING;
      current.style.transition=(first||instant||reduced())
        ? 'none'
        : `transform ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}`;
      current.style.width=w+'px';
      current.style.height=h+'px';
      current.style.transform=`translate3d(${x}px,${y}px,0)`;
      current.dataset.x=String(x);
      current.dataset.y=String(y);
      current.dataset.w=String(w);
      current.dataset.h=String(h);
      current.dataset.ready='true';
      current.dataset.v41Measured='true';
      state.x=x;state.y=y;state.w=w;state.h=h;state.ready=true;
      root.classList.add(readyClass,'v41-skin-ready','v39-liquid-ready');

      if((first||instant)&&!reduced())requestAnimationFrame(()=>{
        if(current.isConnected)current.style.transition=`transform ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}`;
      });
    }

    function repair(){
      if(!root.isConnected)return;
      const hadIndicator=Boolean(indicator?.isConnected&&indicator.parentNode===root);
      const hadSkin=hadIndicator&&Boolean($(':scope > .v37-liquid-skin',indicator));
      const hadReady=root.classList.contains(readyClass)&&root.classList.contains('v41-skin-ready');
      if(hadIndicator&&hadSkin&&hadReady)return;
      liveIndicator();
      update({instant:true});
    }

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'&&record.target.matches?.(itemSelector))){
        requestAnimationFrame(()=>update({instant:false}));
      }
    });
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});

    let resizeTimer=0;
    const onResize=()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>update({instant:true}),90);
    };
    window.addEventListener('resize',onResize,{passive:true});
    window.visualViewport?.addEventListener?.('resize',onResize,{passive:true});

    const controller={update,repair};
    root.__photoLiquidRepair=repair;
    root.__photoLiquidController=controller;
    requestAnimationFrame(()=>update({instant:true}));
    return controller;
  }

  function themeCardMarkup(){
    const choice=currentThemeChoice();
    return `<section class="theme-setting-card" aria-label="화면 모드">
      <div class="theme-setting-card__copy"><strong>화면 모드</strong><small>화이트, 다크 또는 기기 설정에 맞춰 표시할 수 있습니다.</small></div>
      <div class="theme-choice" role="group" aria-label="화면 모드 선택">
        <button type="button" data-theme-choice="light" class="${choice==='light'?'is-active':''}">화이트</button>
        <button type="button" data-theme-choice="dark" class="${choice==='dark'?'is-active':''}">다크</button>
        <button type="button" data-theme-choice="system" class="${choice==='system'?'is-active':''}">시스템</button>
      </div>
    </section>`;
  }

  function injectThemeControls(){
    const settings=$('.collection-settings');
    if(!settings)return;
    let card=$('.theme-setting-card',settings);
    if(!card){
      const summary=$('.collection-settings__summary',settings);
      if(summary)summary.insertAdjacentHTML('afterend',themeCardMarkup());
      else settings.insertAdjacentHTML('afterbegin',themeCardMarkup());
      card=$('.theme-setting-card',settings);
    }
    const choice=$('.theme-choice',card||settings);
    if(choice){
      makeLiquidController(choice,{itemSelector:'button',indicatorClass:'theme-v34-indicator',readyClass:'v34-liquid-ready',slow:true});
      $$('button[data-theme-choice]',choice).forEach(button=>{
        if(button.dataset.v49ThemeBound==='true')return;
        button.dataset.v49ThemeBound='true';
        button.addEventListener('click',()=>applyTheme(button.dataset.themeChoice||'light'));
      });
    }
  }

  function repairExistingLiquids(){
    $('.nav-scroll')?.__photoLiquidRepair?.();
    $('.collection-tabs')?.__photoLiquidRepair?.();
    $('.theme-choice')?.__photoLiquidRepair?.();
  }
  window.__photoRepairTopLiquid=()=>$('.nav-scroll')?.__photoLiquidRepair?.();

  async function initLiquid(){
    const nav=await waitFor('.nav-scroll');
    if(nav){
      installReadingProgress(nav);
      makeLiquidController(nav,{itemSelector:'.nav-chip',indicatorClass:'nav-v33-indicator',readyClass:'v33-liquid-ready',slow:false,durationScale:1.10});
    }

    const tabs=await waitFor('.collection-tabs',18000);
    if(tabs)makeLiquidController(tabs,{itemSelector:'.collection-tab',indicatorClass:'collection-v33-indicator',readyClass:'v33-liquid-ready',slow:true});

    injectThemeControls();
  }

  document.addEventListener('click',event=>{
    const tab=event.target.closest?.('.collection-tab[data-library-tab="settings"]');
    if(tab)setTimeout(injectThemeControls,70);
    if(event.target.closest?.('#collectionFab'))setTimeout(()=>{injectThemeControls();repairExistingLiquids();},120);
    if(event.target.closest?.('#collectionClose,#collectionBackdrop'))setTimeout(repairExistingLiquids,260);
  },{passive:true});

  installTheme();
  initLiquid();
  window.addEventListener('pageshow',()=>setTimeout(()=>{initLiquid();injectThemeControls();repairExistingLiquids();},120),{passive:true});
})();
