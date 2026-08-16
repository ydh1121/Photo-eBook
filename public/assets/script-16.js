/* v43: stable liquid selectors with Breeze spring easing, smooth rail motion, progress, and theme modes. */
(function(){
  if(window.__photoV33Installed)return;
  window.__photoV33Installed=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const BREEZE_EASING='cubic-bezier(0.34, 1.56, 0.64, 1)';
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const motionJobs=new WeakMap();

  function waitFor(selector,timeout=14000){
    return new Promise(resolve=>{
      const first=$(selector);
      if(first)return resolve(first);
      const started=performance.now();
      const timer=setInterval(()=>{
        const node=$(selector);
        if(node||performance.now()-started>timeout){clearInterval(timer);resolve(node||null);}
      },80);
    });
  }

  function applyTheme(choice){
    choice=['light','dark','system'].includes(choice)?choice:'light';
    const dark=choice==='dark'||(choice==='system'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.themeChoice=choice;
    document.documentElement.dataset.theme=dark?'dark':'light';
    document.documentElement.style.colorScheme=dark?'dark':'light';
    try{localStorage.setItem(THEME_KEY,choice);}catch{}
    let meta=$('meta[name="theme-color"]');
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta);}
    meta.content=dark?'#0d0f13':'#ffffff';
    $$('.theme-choice button').forEach(button=>button.classList.toggle('is-active',button.dataset.themeChoice===choice));
    window.dispatchEvent(new CustomEvent('photo-theme-change',{detail:{choice,effective:dark?'dark':'light'}}));
  }

  function currentThemeChoice(){
    const fromDom=document.documentElement.dataset.themeChoice;
    if(['light','dark','system'].includes(fromDom))return fromDom;
    try{
      const stored=localStorage.getItem(THEME_KEY);
      if(['light','dark','system'].includes(stored))return stored;
    }catch{}
    return 'light';
  }

  function installTheme(){
    applyTheme(currentThemeChoice());
    const media=window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener?.('change',()=>{if(currentThemeChoice()==='system')applyTheme('system');});
    window.setPhotoRoadmapTheme=applyTheme;
  }

  function installProgress(nav){
    if(!nav||nav.dataset.v33Progress==='true')return;
    nav.dataset.v33Progress='true';
    let ticking=false;
    const update=()=>{
      ticking=false;
      const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const value=clamp((window.scrollY||0)/max,0,1);
      nav.style.setProperty('--v32-progress',`${(value*100).toFixed(2)}%`);
    };
    const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    update();
  }

  function cancelMotion(node){
    const job=motionJobs.get(node);
    if(job?.raf)cancelAnimationFrame(job.raf);
    motionJobs.delete(node);
  }

  function smootherStep(t){return t*t*t*(t*(t*6-15)+10);}

  function moveRailTo(rail,item,{slow=false}={}){
    if(!rail||!item)return;
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    const inset=Math.max(8,parseFloat(getComputedStyle(rail).paddingLeft)||8);
    const target=clamp(item.offsetLeft-inset,0,max);
    cancelMotion(rail);
    const start=rail.scrollLeft;
    const distance=target-start;
    if(reduced()||Math.abs(distance)<1){rail.scrollLeft=target;return;}

    const duration=clamp((slow?285:235)+Math.abs(distance)*(slow?.16:.11),slow?300:245,slow?470:390);
    const started=performance.now();
    const tick=now=>{
      const t=clamp((now-started)/duration,0,1);
      const eased=smootherStep(t);
      rail.scrollLeft=start+distance*eased;
      if(t>=1){rail.scrollLeft=target;motionJobs.delete(rail);return;}
      const raf=requestAnimationFrame(tick);
      motionJobs.set(rail,{raf});
    };
    const raf=requestAnimationFrame(tick);
    motionJobs.set(rail,{raf});
  }

  function patchNavScrollIntoView(){
    if(Element.prototype.__photoV33ScrollIntoView)return;
    Element.prototype.__photoV33ScrollIntoView=true;
    const previous=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(options){
      if(this instanceof HTMLElement&&this.matches('.nav-chip')){
        const rail=this.closest('.nav-scroll');
        if(rail){setTimeout(()=>moveRailTo(rail,this),24);return;}
      }
      return previous.call(this,options);
    };
  }

  function makeLiquidController(rail,{itemSelector,indicatorClass,readyClass,slow=false,lead=false}={}){
    if(!rail)return null;
    if(rail.dataset.v33Liquid==='true'){
      const existing=rail.querySelector('.'+indicatorClass);
      return existing?{update:()=>{}}:null;
    }
    rail.dataset.v33Liquid='true';
    rail.querySelectorAll('.nav-liquid-indicator,.collection-liquid-indicator').forEach(node=>node.remove());

    const indicator=document.createElement('span');
    indicator.className=indicatorClass;
    indicator.setAttribute('aria-hidden','true');
    rail.prepend(indicator);

    const state={x:0,y:0,w:0,h:0,ready:false};

    function durationFor(x,w){
      const distance=Math.max(Math.abs(x-state.x),Math.abs(w-state.w));
      return clamp((slow?300:245)+distance*(slow?.18:.10),slow?320:255,slow?470:380);
    }

    function setGeometry(item,{instant=false}={}){
      if(!item)return;
      const x=item.offsetLeft;
      const y=item.offsetTop;
      const w=item.offsetWidth;
      const h=item.offsetHeight;
      if(!w||!h)return;

      const first=!state.ready;
      const duration=durationFor(x,w);
      indicator.getAnimations?.().forEach(animation=>animation.cancel());
      indicator.style.transition=(first||instant||reduced())
        ? 'none'
        : `transform ${duration}ms ${BREEZE_EASING}, width ${duration}ms ${BREEZE_EASING}, height ${duration}ms ${BREEZE_EASING}`;
      indicator.style.width=`${w}px`;
      indicator.style.height=`${h}px`;
      indicator.style.transform=`translate3d(${x}px,${y}px,0)`;
      indicator.dataset.x=String(x);
      indicator.dataset.y=String(y);
      indicator.dataset.w=String(w);
      indicator.dataset.h=String(h);
      indicator.dataset.ready='true';

      state.x=x;state.y=y;state.w=w;state.h=h;state.ready=true;
      rail.classList.add(readyClass);

      if(first&&!reduced()){
        requestAnimationFrame(()=>{
          indicator.style.transition=`transform ${duration}ms ${BREEZE_EASING}, width ${duration}ms ${BREEZE_EASING}, height ${duration}ms ${BREEZE_EASING}`;
        });
      }
      if(lead)setTimeout(()=>moveRailTo(rail,item,{slow}),slow?72:42);
    }

    function activeItem(){return $(itemSelector+'.is-active',rail)||$(itemSelector,rail);}
    function update(instant=false){const item=activeItem();if(item)setGeometry(item,{instant});}

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'))requestAnimationFrame(()=>update(false));
    });
    observer.observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});

    const resize=new ResizeObserver(()=>requestAnimationFrame(()=>update(true)));
    resize.observe(rail);
    $$(itemSelector,rail).forEach(item=>resize.observe(item));
    rail.addEventListener('pointerdown',()=>cancelMotion(rail),{passive:true});
    rail.addEventListener('touchstart',()=>cancelMotion(rail),{passive:true});
    requestAnimationFrame(()=>update(true));
    return {update};
  }

  async function setupTopNavigation(){
    patchNavScrollIntoView();
    const nav=await waitFor('.nav-scroll');
    if(!nav)return;
    installProgress(nav);
    makeLiquidController(nav,{itemSelector:'.nav-chip',indicatorClass:'nav-v33-indicator',readyClass:'v33-liquid-ready',slow:false,lead:true});
  }

  async function setupCollectionTabs(){
    const tabs=await waitFor('.collection-tabs',18000);
    if(!tabs)return;
    makeLiquidController(tabs,{itemSelector:'.collection-tab',indicatorClass:'collection-v33-indicator',readyClass:'v33-liquid-ready',slow:true,lead:false});
  }

  function setupThemeChoiceLiquid(root=document){
    const choice=$('.theme-choice',root)||$('.theme-choice');
    if(!choice)return;
    if(choice.dataset.v34ThemeLiquid==='true')return;
    choice.dataset.v34ThemeLiquid='true';
    makeLiquidController(choice,{itemSelector:'button',indicatorClass:'theme-v34-indicator',readyClass:'v34-liquid-ready',slow:true,lead:false});
  }

  function themeCardMarkup(){
    const choice=currentThemeChoice();
    return `<section class="theme-setting-card" aria-label="화면 모드">
      <div class="theme-setting-card__copy"><strong>화면 모드</strong><small>기본값은 화이트입니다. 시스템은 기기의 화면 설정을 따릅니다.</small></div>
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
    if(!$('.theme-setting-card',settings)){
      const summary=$('.collection-settings__summary',settings);
      if(summary)summary.insertAdjacentHTML('afterend',themeCardMarkup());
      else settings.insertAdjacentHTML('afterbegin',themeCardMarkup());
      $$('.theme-choice button',settings).forEach(button=>button.addEventListener('click',()=>{
        applyTheme(button.dataset.themeChoice||'light');
        requestAnimationFrame(()=>setupThemeChoiceLiquid(settings));
      }));
    }
    requestAnimationFrame(()=>setupThemeChoiceLiquid(settings));
  }

  async function setupThemeControls(){
    const body=await waitFor('#collectionBody',18000);
    if(!body)return;
    const observer=new MutationObserver(()=>injectThemeControls());
    observer.observe(body,{childList:true,subtree:true});
    injectThemeControls();
  }

  installTheme();
  setupTopNavigation();
  setupCollectionTabs();
  setupThemeControls();
  window.addEventListener('pageshow',()=>{
    applyTheme(currentThemeChoice());
    setTimeout(()=>{setupTopNavigation();setupCollectionTabs();injectThemeControls();},120);
  },{passive:true});
})();
