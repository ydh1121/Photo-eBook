/* v33: inertial liquid selectors, stable progress, and theme modes. */
(function(){
  if(window.__photoV33Installed)return;
  window.__photoV33Installed=true;

  const THEME_KEY='photoRoadmapThemeV1';
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const springJobs=new WeakMap();

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

  function cancelSpring(node){
    const job=springJobs.get(node);
    if(job?.raf)cancelAnimationFrame(job.raf);
    springJobs.delete(node);
  }

  function springRailTo(rail,item){
    if(!rail||!item)return;
    const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
    const inset=Math.max(8,parseFloat(getComputedStyle(rail).paddingLeft)||8);
    const target=clamp(item.offsetLeft-inset,0,max);
    cancelSpring(rail);
    if(reduced()||Math.abs(rail.scrollLeft-target)<1){rail.scrollLeft=target;return;}

    let x=rail.scrollLeft;
    let v=0;
    let frames=0;
    const startDistance=Math.abs(target-x);
    const tick=()=>{
      const d=target-x;
      const boost=clamp(startDistance/520,0,1);
      const k=.048+boost*.050;
      v=(v+d*k)*.80;
      x+=v;
      rail.scrollLeft=x;
      frames++;
      if((Math.abs(d)<.35&&Math.abs(v)<.22)||frames>96){
        rail.scrollLeft=target;
        springJobs.delete(rail);
        return;
      }
      const raf=requestAnimationFrame(tick);
      springJobs.set(rail,{raf});
    };
    const raf=requestAnimationFrame(tick);
    springJobs.set(rail,{raf});
  }

  function patchNavScrollIntoView(){
    if(Element.prototype.__photoV33ScrollIntoView)return;
    Element.prototype.__photoV33ScrollIntoView=true;
    const previous=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(options){
      if(this instanceof HTMLElement&&this.matches('.nav-chip')){
        const rail=this.closest('.nav-scroll');
        if(rail){setTimeout(()=>springRailTo(rail,this),20);return;}
      }
      return previous.call(this,options);
    };
  }

  function makeLiquidController(rail,{itemSelector,indicatorClass,readyClass,slow=false,lead=false}={}){
    if(!rail||rail.dataset.v33Liquid==='true')return null;
    rail.dataset.v33Liquid='true';
    rail.querySelectorAll('.nav-liquid-indicator,.collection-liquid-indicator').forEach(node=>node.remove());

    const indicator=document.createElement('span');
    indicator.className=indicatorClass;
    indicator.setAttribute('aria-hidden','true');
    rail.prepend(indicator);

    const state={x:0,y:0,w:0,h:0,vx:0,vy:0,vw:0,vh:0,tx:0,ty:0,tw:0,th:0,ready:false,raf:0};

    function paint(){
      indicator.style.width=`${Math.max(0,state.w)}px`;
      indicator.style.height=`${Math.max(0,state.h)}px`;
      const stretch=clamp(Math.abs(state.vx)/150,0,.035);
      indicator.style.transform=`translate3d(${state.x}px,${state.y}px,0) scaleX(${1+stretch})`;
    }

    function settleTo(item,instant=false){
      if(!item)return;
      state.tx=item.offsetLeft;
      state.ty=item.offsetTop;
      state.tw=item.offsetWidth;
      state.th=item.offsetHeight;

      if(!state.ready||instant||reduced()){
        state.x=state.tx;state.y=state.ty;state.w=state.tw;state.h=state.th;
        state.vx=state.vy=state.vw=state.vh=0;
        paint();
        state.ready=true;
        rail.classList.add(readyClass);
        if(lead)springRailTo(rail,item);
        return;
      }

      if(state.raf)cancelAnimationFrame(state.raf);
      const initial=Math.max(Math.abs(state.tx-state.x),Math.abs(state.tw-state.w));
      let frames=0;
      const tick=()=>{
        const boost=clamp(initial/(slow?340:460),0,1);
        const k=slow ? (.036+boost*.024) : (.060+boost*.060);
        const damping=slow?.835:.77;
        state.vx=(state.vx+(state.tx-state.x)*k)*damping;
        state.vy=(state.vy+(state.ty-state.y)*k)*damping;
        state.vw=(state.vw+(state.tw-state.w)*k)*damping;
        state.vh=(state.vh+(state.th-state.h)*k)*damping;
        state.x+=state.vx;state.y+=state.vy;state.w+=state.vw;state.h+=state.vh;
        paint();
        frames++;
        const error=Math.max(Math.abs(state.tx-state.x),Math.abs(state.tw-state.w),Math.abs(state.ty-state.y),Math.abs(state.th-state.h));
        const speed=Math.max(Math.abs(state.vx),Math.abs(state.vw),Math.abs(state.vy),Math.abs(state.vh));
        if((error<.25&&speed<.18)||frames>(slow?120:96)){
          state.x=state.tx;state.y=state.ty;state.w=state.tw;state.h=state.th;
          state.vx=state.vy=state.vw=state.vh=0;
          paint();state.raf=0;return;
        }
        state.raf=requestAnimationFrame(tick);
      };
      state.raf=requestAnimationFrame(tick);
      if(lead)setTimeout(()=>springRailTo(rail,item),slow?110:55);
    }

    function activeItem(){return $(itemSelector+'.is-active',rail)||$(itemSelector,rail);}
    function update(instant=false){const item=activeItem();if(item)settleTo(item,instant);}

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'))requestAnimationFrame(()=>update(false));
    });
    observer.observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});

    const resize=new ResizeObserver(()=>requestAnimationFrame(()=>update(true)));
    resize.observe(rail);
    $$(itemSelector,rail).forEach(item=>resize.observe(item));
    rail.addEventListener('pointerdown',()=>cancelSpring(rail),{passive:true});
    rail.addEventListener('touchstart',()=>cancelSpring(rail),{passive:true});
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
    makeLiquidController(tabs,{itemSelector:'.collection-tab',indicatorClass:'collection-v33-indicator',readyClass:'v33-liquid-ready',slow:true,lead:true});
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
    if(!settings||$('.theme-setting-card',settings))return;
    const summary=$('.collection-settings__summary',settings);
    if(summary)summary.insertAdjacentHTML('afterend',themeCardMarkup());
    else settings.insertAdjacentHTML('afterbegin',themeCardMarkup());
    $$('.theme-choice button',settings).forEach(button=>button.addEventListener('click',()=>applyTheme(button.dataset.themeChoice||'light')));
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
