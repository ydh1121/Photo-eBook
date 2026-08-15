/* v32: liquid-glass navigation, unified question hub, and interaction polish. */
(function(){
  if(window.__photoV32Installed)return;
  window.__photoV32Installed=true;

  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const rafState=new WeakMap();
  const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

  function waitFor(selector,timeout=12000){
    return new Promise(resolve=>{
      const hit=$(selector);
      if(hit)return resolve(hit);
      const started=performance.now();
      const timer=setInterval(()=>{
        const node=$(selector);
        if(node||performance.now()-started>timeout){
          clearInterval(timer);
          resolve(node||null);
        }
      },90);
    });
  }

  function cancelSpring(scroller){
    const state=rafState.get(scroller);
    if(state?.raf)cancelAnimationFrame(state.raf);
    rafState.delete(scroller);
  }

  function springScrollX(scroller,target){
    if(!scroller)return;
    const max=Math.max(0,scroller.scrollWidth-scroller.clientWidth);
    target=clamp(target,0,max);
    cancelSpring(scroller);
    if(reduceMotion()||Math.abs(scroller.scrollLeft-target)<1){
      scroller.scrollLeft=target;
      return;
    }
    let position=scroller.scrollLeft;
    let velocity=0;
    let frames=0;
    const tick=()=>{
      const distance=target-position;
      velocity=(velocity+distance*.13)*.73;
      position+=velocity;
      scroller.scrollLeft=position;
      frames++;
      if((Math.abs(distance)<.35&&Math.abs(velocity)<.25)||frames>72){
        scroller.scrollLeft=target;
        rafState.delete(scroller);
        return;
      }
      const raf=requestAnimationFrame(tick);
      rafState.set(scroller,{raf});
    };
    const raf=requestAnimationFrame(tick);
    rafState.set(scroller,{raf});
  }

  function leadingTarget(scroller,chip){
    if(!scroller||!chip)return 0;
    const inset=Math.max(8,parseFloat(getComputedStyle(scroller).paddingLeft)||8);
    return clamp(chip.offsetLeft-inset,0,Math.max(0,scroller.scrollWidth-scroller.clientWidth));
  }

  function animateLiquidIndicator(indicator,target,{horizontalScroller=null}={}){
    if(!indicator||!target)return;
    const x=target.offsetLeft;
    const y=target.offsetTop;
    const w=target.offsetWidth;
    const h=target.offsetHeight;
    const oldX=Number(indicator.dataset.x||x);
    const oldY=Number(indicator.dataset.y||y);
    const oldW=Number(indicator.dataset.w||w);
    const oldH=Number(indicator.dataset.h||h);
    const dx=x-oldX;
    const overshoot=Math.sign(dx||1)*clamp(Math.abs(dx)*.055,4,13);

    indicator.dataset.x=String(x);
    indicator.dataset.y=String(y);
    indicator.dataset.w=String(w);
    indicator.dataset.h=String(h);
    indicator.style.width=`${w}px`;
    indicator.style.height=`${h}px`;
    indicator.style.transform=`translate3d(${x}px,${y}px,0)`;

    const moved=Math.abs(dx)>.5||Math.abs(w-oldW)>.5||Math.abs(y-oldY)>.5||Math.abs(h-oldH)>.5;
    if(moved&&!reduceMotion()&&typeof indicator.animate==='function'&&indicator.dataset.ready==='true'){
      indicator.getAnimations().forEach(animation=>animation.cancel());
      indicator.animate([
        {transform:`translate3d(${oldX}px,${oldY}px,0) scaleX(${oldW/Math.max(1,w)}) scaleY(${oldH/Math.max(1,h)})`,filter:'saturate(1)'},
        {offset:.72,transform:`translate3d(${x+overshoot}px,${y}px,0) scaleX(1.035) scaleY(.985)`,filter:'saturate(1.14)'},
        {transform:`translate3d(${x}px,${y}px,0) scaleX(1) scaleY(1)`,filter:'saturate(1)'}
      ],{duration:470,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    indicator.dataset.ready='true';

    if(horizontalScroller){
      clearTimeout(horizontalScroller.__v32LeadTimer);
      horizontalScroller.__v32LeadTimer=setTimeout(()=>springScrollX(horizontalScroller,leadingTarget(horizontalScroller,target)),78);
    }
  }

  function installLiquidSelector(root,{itemSelector,indicatorClass,scrollActive=false}={}){
    if(!root||root.dataset.v32Liquid==='true')return;
    root.dataset.v32Liquid='true';
    const indicator=document.createElement('span');
    indicator.className=indicatorClass;
    indicator.setAttribute('aria-hidden','true');
    root.prepend(indicator);

    const update=()=>{
      const active=$(itemSelector+'.is-active',root)||$(itemSelector,root);
      if(active)animateLiquidIndicator(indicator,active,{horizontalScroller:scrollActive?root:null});
    };

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'))requestAnimationFrame(update);
    });
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
    const resize=new ResizeObserver(()=>requestAnimationFrame(update));
    resize.observe(root);
    $$(itemSelector,root).forEach(item=>resize.observe(item));
    requestAnimationFrame(update);
  }

  function patchNavScrollIntoView(){
    if(Element.prototype.__photoV32ScrollIntoView)return;
    Element.prototype.__photoV32ScrollIntoView=true;
    const native=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(options){
      if(this instanceof HTMLElement&&this.matches('.nav-chip')){
        const scroller=this.closest('.nav-scroll');
        if(scroller){
          clearTimeout(scroller.__v32NavTimer);
          scroller.__v32NavTimer=setTimeout(()=>springScrollX(scroller,leadingTarget(scroller,this)),72);
          return;
        }
      }
      return native.call(this,options);
    };
  }

  async function setupTopNav(){
    patchNavScrollIntoView();
    const nav=await waitFor('.nav-scroll');
    if(!nav)return;
    if(!nav.querySelector('.nav-progress-liquid')){
      const progress=document.createElement('span');
      progress.className='nav-progress-liquid';
      progress.setAttribute('aria-hidden','true');
      nav.prepend(progress);
      let ticking=false;
      const updateProgress=()=>{
        ticking=false;
        const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
        const value=clamp((window.scrollY||0)/max,0,1);
        progress.style.transform=`scaleX(${value})`;
      };
      const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(updateProgress);}};
      window.addEventListener('scroll',schedule,{passive:true});
      window.addEventListener('resize',schedule,{passive:true});
      updateProgress();
    }
    installLiquidSelector(nav,{itemSelector:'.nav-chip',indicatorClass:'nav-liquid-indicator',scrollActive:true});
  }

  function updateCollectionLiquid(){
    const tabs=$('.collection-tabs');
    if(!tabs)return;
    installLiquidSelector(tabs,{itemSelector:'.collection-tab',indicatorClass:'collection-liquid-indicator',scrollActive:true});
  }

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  let askHomeMarker=null;
  let loginHomeMarker=null;

  function ensureHomeMarkers(){
    const askPanel=$('#askWritePanel');
    if(askPanel&&!askHomeMarker){
      askHomeMarker=document.createComment('v32-ask-home');
      askPanel.parentNode?.insertBefore(askHomeMarker,askPanel);
    }
    const login=$('#askHistoryPanel .login-card');
    if(login&&!loginHomeMarker){
      loginHomeMarker=document.createComment('v32-login-home');
      login.parentNode?.insertBefore(loginHomeMarker,login);
    }
  }

  function restoreMovedPanels(){
    const askPanel=$('#askWritePanel')||document.querySelector('.v32-question-write > #askWritePanel');
    if(askPanel&&askHomeMarker?.parentNode&&askPanel.parentNode!==askHomeMarker.parentNode){
      askHomeMarker.parentNode.insertBefore(askPanel,askHomeMarker.nextSibling);
    }
    const login=$('.collection-settings .login-card')||$('#askHistoryPanel .login-card');
    if(login&&loginHomeMarker?.parentNode&&login.parentNode!==loginHomeMarker.parentNode){
      loginHomeMarker.parentNode.insertBefore(login,loginHomeMarker.nextSibling);
    }
  }

  function setQuestionHubMode(mode){
    const hub=$('.v32-question-hub');
    if(!hub)return;
    const write=hub.querySelector('.v32-question-write');
    const saved=hub.querySelector('.v32-question-saved');
    const writeButton=hub.querySelector('[data-v32-qmode="write"]');
    const savedButton=hub.querySelector('[data-v32-qmode="saved"]');
    const isSaved=mode==='saved';
    if(write)write.hidden=isSaved;
    if(saved)saved.hidden=!isSaved;
    writeButton?.classList.toggle('is-active',!isSaved);
    savedButton?.classList.toggle('is-active',isSaved);
  }

  function makeQuestionHub(mode='saved'){
    const body=$('#collectionBody');
    const askPanel=$('#askWritePanel');
    if(!body||!askPanel)return;
    ensureHomeMarkers();

    const existing=body.querySelector('.v32-question-hub');
    if(existing){
      setQuestionHubMode(mode);
      return;
    }

    const savedFragment=document.createDocumentFragment();
    while(body.firstChild)savedFragment.appendChild(body.firstChild);

    const hub=document.createElement('div');
    hub.className='v32-question-hub';
    hub.innerHTML=`<div class="v32-question-segment" role="tablist" aria-label="질문 관리">
      <button type="button" data-v32-qmode="write">질문 작성</button>
      <button type="button" data-v32-qmode="saved">저장한 질문 <span>${readQuestions().length}</span></button>
    </div><div class="v32-question-write"></div><div class="v32-question-saved"></div>`;
    body.appendChild(hub);
    const tools=$('#collectionTools');
    if(tools)tools.hidden=true;
    hub.querySelector('.v32-question-write').appendChild(askPanel);
    hub.querySelector('.v32-question-saved').appendChild(savedFragment);

    const note=$('.ask-note',askPanel);
    if(note)note.textContent='질문을 저장해 두면 나중에 다시 열어볼 수 있습니다.';

    hub.addEventListener('click',event=>{
      const button=event.target.closest('[data-v32-qmode]');
      if(!button)return;
      setQuestionHubMode(button.dataset.v32Qmode||'write');
    });
    setQuestionHubMode(mode);
  }

  function loadSavedQuestionIntoAsk(id){
    const historyTab=$('#askHistoryTab');
    if(!historyTab)return Promise.resolve(false);
    historyTab.click();
    return new Promise(resolve=>setTimeout(()=>{
      const target=$(`.history-item[data-history-id="${CSS.escape(String(id||''))}"] .history-open`);
      if(target){target.click();resolve(true);}
      else resolve(false);
    },80));
  }

  function openCollectionQuestion(mode='write'){
    restoreMovedPanels();
    const fab=$('#collectionFab');
    const questionTab=$('.collection-tab[data-library-tab="question"]');
    if(!fab||!questionTab)return;
    if($('#collectionSheet')?.hidden)fab.click();
    setTimeout(()=>{
      questionTab.click();
      setTimeout(()=>makeQuestionHub(mode),34);
    },34);
  }

  function mountSettingsInline(){
    const settings=$('.collection-settings');
    const login=$('#askHistoryPanel .login-card');
    if(!settings||!login)return;
    ensureHomeMarkers();
    const trigger=$('#collectionDeviceLink');
    if(trigger)trigger.hidden=true;
    login.classList.add('v32-inline-sync');
    const title=$('h4',login);if(title)title.textContent='기기 간 질문 이어보기';
    const copy=$('#copySyncKey');if(copy)copy.textContent='연결 키 복사';
    const change=$('#changeSyncKey');if(change)change.textContent='다른 기기 연결';
    const p=$('p',login);if(p)p.textContent='다른 기기에서도 저장한 질문을 이어서 보려면 연결 키를 사용하세요.';
    settings.appendChild(login);
  }

  function normalizeSyncMessage(){
    const state=$('#syncState');
    if(!state)return;
    const text=state.textContent||'';
    if(/Google Sheet와 동기화 중|동기화 중/.test(text))state.textContent='질문 기록을 확인하고 있습니다.';
    else if(/Google Sheet와 동기화됨|동기화됨/.test(text))state.textContent='질문 기록이 최신 상태입니다.';
    else if(/Google Sheet/.test(text))state.textContent='이 기기의 질문 기록은 그대로 유지됩니다.';
  }

  async function setupUnifiedQuestionHub(){
    const collection=await waitFor('#collectionSheet',15000);
    const bubble=await waitFor('#askBubble',15000);
    if(!collection||!bubble)return;
    ensureHomeMarkers();
    updateCollectionLiquid();

    bubble.textContent='질문하기';

    document.addEventListener('click',event=>{
      const contextual=event.target.closest?.('#askBubble');
      if(contextual){
        event.preventDefault();
        event.stopImmediatePropagation();
        openCollectionQuestion('write');
        return;
      }

      const qRemove=event.target.closest?.('.collection-item--question .collection-item__remove');
      if(qRemove&&$('.v32-question-hub')){
        restoreMovedPanels();
        setTimeout(()=>makeQuestionHub('saved'),50);
      }

      const qOpen=event.target.closest?.('.collection-question-open');
      if(qOpen){
        event.preventDefault();
        event.stopImmediatePropagation();
        const id=qOpen.closest('.collection-item')?.dataset.libraryId||'';
        loadSavedQuestionIntoAsk(id).then(()=>openCollectionQuestion('write'));
        return;
      }

      const tab=event.target.closest?.('.collection-tab');
      if(tab){
        const name=tab.dataset.libraryTab||'';
        if(name!=='question'&&name!=='settings')restoreMovedPanels();
        setTimeout(()=>{
          updateCollectionLiquid();
          if(name==='question')makeQuestionHub('saved');
          if(name==='settings')mountSettingsInline();
        },36);
      }

      const settingsLink=event.target.closest?.('#collectionDeviceLink');
      if(settingsLink){
        event.preventDefault();
        event.stopImmediatePropagation();
        mountSettingsInline();
      }

      if(event.target.closest?.('#collectionClose')||event.target.closest?.('#collectionBackdrop')){
        restoreMovedPanels();
      }
    },true);

    const sheetObserver=new MutationObserver(()=>{
      if(!collection.classList.contains('is-open'))restoreMovedPanels();
    });
    sheetObserver.observe(collection,{attributes:true,attributeFilter:['class','hidden']});

    const syncState=$('#syncState');
    if(syncState){
      const syncObserver=new MutationObserver(normalizeSyncMessage);
      syncObserver.observe(syncState,{childList:true,subtree:true,characterData:true});
      normalizeSyncMessage();
    }

    const askSave=$('#askSave');
    askSave?.addEventListener('click',()=>setTimeout(()=>{
      const badge=$('.v32-question-segment [data-v32-qmode="saved"] span');
      if(badge)badge.textContent=String(readQuestions().length);
    },80));

    const oldSheet=$('#askSheet');
    const oldBackdrop=$('#askBackdrop');
    if(oldSheet)oldSheet.setAttribute('aria-hidden','true');
    if(oldBackdrop)oldBackdrop.setAttribute('aria-hidden','true');
  }

  function setupCollectionFabPolish(){
    document.documentElement.classList.add('v32-ui');
  }

  function init(){
    setupCollectionFabPolish();
    setupTopNav();
    setupUnifiedQuestionHub();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
