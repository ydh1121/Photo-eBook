/* v6: single owner for GPT/contextual question handoff.
   The real #askWritePanel is retained across collection rerenders so closing the
   collection and reopening it cannot destroy the write form before the next GPT
   handoff. script-24 remains the visual question-tab controller. */
(function(){
  if(window.__photoQuestionIntentBridgeInstalled)return;
  window.__photoQuestionIntentBridgeInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const QUESTION_KEY='photoRoadmapQuestionsV2';

  let intent='saved';
  let pendingBacking=Boolean(window.__photoPendingQuestionWrite);
  let guardObserver=null;
  let reconcileRaf=0;
  let handoffToken=0;
  let writePanelRef=null;
  const previousForce=window.__photoForceQuestionWrite;

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function isWrite(){return intent==='write';}

  function dispatchValueChange(input){
    if(!input)return;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function ensureParking(){
    let parking=$('#v40QuestionParking');
    if(!parking){
      parking=document.createElement('div');
      parking.id='v40QuestionParking';
      parking.hidden=true;
      document.body.appendChild(parking);
    }
    return parking;
  }

  function getWritePanel(){
    const live=$('#askWritePanel');
    if(live)writePanelRef=live;
    return live||writePanelRef;
  }

  function parkWritePanel(){
    const panel=getWritePanel();
    if(!panel)return null;
    const parking=ensureParking();
    if(panel.parentNode!==parking)parking.appendChild(panel);
    return panel;
  }

  function ensureQuestionStructure(){
    const controls=$('#v40QuestionControls');
    const root=$('.v40-question-segment',controls||document);
    if(!controls||!root)return;

    $$('[id="v40QuestionControls"]').filter(node=>node!==controls).forEach(node=>node.remove());
    $$('.v32-question-hub>.v32-question-segment').forEach(node=>{
      node.hidden=true;
      node.setAttribute('aria-hidden','true');
    });

    const write=$('button[data-v40-qmode="write"]',root);
    if(write&&write.textContent.trim()!=='질문 작성하기')write.textContent='질문 작성하기';

    const indicators=$$('.v36-question-indicator',root);
    indicators.slice(1).forEach(node=>node.remove());
    let indicator=indicators[0];
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className='v36-question-indicator';
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }
    if(!$(':scope>.v37-liquid-skin',indicator)){
      const skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    root.classList.add('v41-skin-ready','v39-liquid-ready','v36-liquid-ready');
  }

  function stopGuard(){
    guardObserver?.disconnect();
    guardObserver=null;
    if(reconcileRaf){cancelAnimationFrame(reconcileRaf);reconcileRaf=0;}
  }

  function scheduleReconcile(){
    if(!isWrite()||reconcileRaf)return;
    reconcileRaf=requestAnimationFrame(()=>{
      reconcileRaf=0;
      reconcileWritePanel();
    });
  }

  function startGuard(){
    if(!isWrite())return;
    const sheet=$('#collectionSheet');
    if(!sheet){
      setTimeout(()=>{if(isWrite())startGuard();},40);
      return;
    }
    if(!guardObserver){
      guardObserver=new MutationObserver(scheduleReconcile);
      guardObserver.observe(sheet,{
        subtree:true,
        childList:true,
        attributes:true,
        attributeFilter:['class','hidden']
      });
    }
    scheduleReconcile();
  }

  function setIntent(next){
    const normalized=next==='write'?'write':'saved';
    if(normalized==='saved')parkWritePanel();
    intent=normalized;
    pendingBacking=isWrite();
    window.__photoQuestionIntent=intent;
    if(isWrite())startGuard();
    else stopGuard();
  }
  window.__photoSetQuestionIntent=setIntent;

  /* Compatibility with script-24 and older question code. Any true assignment
     is a real write request. Delayed legacy false assignments cannot terminate
     write mode; only explicit navigation below calls setIntent('saved'). */
  try{
    Object.defineProperty(window,'__photoPendingQuestionWrite',{
      configurable:true,
      enumerable:true,
      get(){return isWrite()?true:pendingBacking;},
      set(value){
        const next=Boolean(value);
        pendingBacking=next;
        if(next&&!isWrite()){
          intent='write';
          window.__photoQuestionIntent='write';
          startGuard();
        }
      }
    });
  }catch{
    window.__photoPendingQuestionWrite=pendingBacking;
  }

  function releaseLegacyQuestionModal(){
    const legacy=$('#askSheet');
    const backdrop=$('#askBackdrop');
    if(legacy)legacy.hidden=true;
    if(backdrop){backdrop.hidden=true;backdrop.style.pointerEvents='none';}
    document.documentElement.classList.remove('ask-modal-locked');
    document.body.classList.remove('ask-modal-locked','is-modal-open');
    document.body.style.top='';
  }

  function reconcileWritePanel(){
    if(!isWrite())return false;

    const sheet=$('#collectionSheet');
    if(!sheet||sheet.hidden||!sheet.classList.contains('is-open'))return false;

    const questionTab=$('.collection-tab[data-library-tab="question"]');
    if(!questionTab)return false;
    if(!questionTab.classList.contains('is-active')){
      questionTab.click();
      return false;
    }

    ensureQuestionStructure();
    const controls=$('#v40QuestionControls');
    const write=$('[data-v40-qmode="write"]',controls||document);
    const saved=$('[data-v40-qmode="saved"]',controls||document);

    if(write&&!write.classList.contains('is-active')){
      write.click();
      return false;
    }

    if(controls)controls.hidden=false;
    write?.classList.add('is-active');
    saved?.classList.remove('is-active');

    const tools=$('#collectionTools');
    if(tools){
      tools.hidden=false;
      tools.style.display='grid';
      const search=$('.collection-search',tools);
      if(search){search.hidden=false;search.style.display='flex';}
      const filters=$('#collectionFilters',tools);
      if(filters)filters.hidden=true;
    }

    const body=$('#collectionBody');
    const panel=getWritePanel();
    if(!body||!panel)return false;

    panel.hidden=false;
    if(panel.parentNode!==body||body.childElementCount!==1||body.firstElementChild!==panel){
      body.replaceChildren(panel);
    }

    body.classList.remove('is-bulk-selecting');
    const toggle=$('.collection-select-toggle');
    if(toggle){
      toggle.classList.remove('is-active');
      toggle.textContent='선택';
      toggle.hidden=true;
      toggle.setAttribute('aria-pressed','false');
    }
    const bar=$('.collection-bulkbar');
    if(bar)bar.hidden=true;

    releaseLegacyQuestionModal();
    return write?.classList.contains('is-active')&&panel.parentNode===body&&!panel.hidden;
  }
  window.__photoReconcileQuestionWrite=reconcileWritePanel;

  window.__photoForceQuestionWrite=function(){
    setIntent('write');
    if(typeof previousForce==='function')previousForce();
    else $('#v40QuestionControls [data-v40-qmode="write"]')?.click();
    scheduleReconcile();
  };

  function resetFreshDraft(){
    const input=$('#askInput')||getWritePanel()?.querySelector('#askInput');
    if(input){
      input.value='이 부분을 쉽게 설명해줘.';
      dispatchValueChange(input);
    }
  }

  function fillSavedQuestion(item){
    if(!item)return;
    const panel=getWritePanel();
    const quote=$('#askQuote')||panel?.querySelector('#askQuote');
    const input=$('#askInput')||panel?.querySelector('#askInput');
    if(quote)quote.textContent=String(item.selected_text||item.selection||item.quote||'문장을 선택하면 여기에 표시됩니다.');
    if(input){
      input.value=String(item.question||item.prompt||'');
      dispatchValueChange(input);
    }
  }

  function collectionIsOpen(){
    const sheet=$('#collectionSheet');
    return Boolean(sheet&&!sheet.hidden&&sheet.classList.contains('is-open'));
  }

  function ensureCollectionOpen(done){
    const started=performance.now();
    const poll=()=>{
      const sheet=$('#collectionSheet');
      const fab=$('#collectionFab');

      if(collectionIsOpen()){
        done();
        return;
      }

      /* During close animation the sheet is visible but is-open has already
         been removed. Do not click the FAB until that 190ms close finishes or
         the stale close timeout can hide the newly opened sheet again. */
      if(sheet&&!sheet.hidden&&!sheet.classList.contains('is-open')){
        if(performance.now()-started<2200)setTimeout(poll,35);
        return;
      }

      if(fab&&(!sheet||sheet.hidden)){
        /* openLibrary('all') immediately rewrites #collectionBody. Keep the
           question form outside that body before the FAB's legacy handler runs. */
        parkWritePanel();
        fab.click();
        setTimeout(poll,35);
        return;
      }

      if(performance.now()-started<2200)setTimeout(poll,40);
    };
    poll();
  }

  function openWriteHandoff({item=null,fresh=false,focus=false}={}){
    const token=++handoffToken;
    setIntent('write');
    releaseLegacyQuestionModal();
    if(fresh)resetFreshDraft();

    const bubble=$('#askBubble');
    if(bubble)bubble.hidden=true;
    try{window.getSelection?.().removeAllRanges();}catch{}

    ensureCollectionOpen(()=>{
      if(token!==handoffToken||!isWrite())return;
      const started=performance.now();
      let stable=0;
      let hydrated=false;

      const drive=()=>{
        if(token!==handoffToken||!isWrite())return;
        window.__photoPendingQuestionWrite=true;
        const mounted=reconcileWritePanel();
        if(mounted){
          stable++;
          if(!hydrated){
            hydrated=true;
            if(item)fillSavedQuestion(item);
            else if(fresh)resetFreshDraft();
            const body=$('#collectionBody');
            if(body)body.scrollTop=0;
          }
        }else stable=0;

        if(stable>=4){
          if(focus)setTimeout(()=>{
            const input=$('#askInput')||getWritePanel()?.querySelector('#askInput');
            input?.focus();
          },70);
          return;
        }
        if(performance.now()-started<1800)setTimeout(drive,55);
      };
      drive();
    });
  }

  function openSavedQuestion(id){
    const item=readQuestions().find(row=>String(row?.id||'')===String(id||''));
    if(item)openWriteHandoff({item});
  }

  function handleBubbleActivation(event){
    const target=event.target instanceof Element?event.target:null;
    if(!target?.closest('#askBubble'))return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    openWriteHandoff({fresh:true,focus:true});
    return true;
  }

  /* This is intentionally the sole click owner for #askBubble. */
  window.addEventListener('click',event=>{handleBubbleActivation(event);},true);

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    if(target.closest('#collectionClose,#collectionBackdrop')){
      handoffToken++;
      setIntent('saved');
      return;
    }

    const modeButton=target.closest('[data-v40-qmode]');
    if(modeButton){
      handoffToken++;
      const next=modeButton.dataset.v40Qmode==='write'?'write':'saved';
      setIntent(next);
      if(next==='write')scheduleReconcile();
      return;
    }

    const tab=target.closest('.collection-tab');
    if(tab){
      if(tab.dataset.libraryTab!=='question'){
        handoffToken++;
        setIntent('saved');
      }else if(isWrite())scheduleReconcile();
      return;
    }

    const questionCard=target.closest('.collection-item[data-library-type="question"]');
    if(!questionCard)return;
    const body=questionCard.closest('#collectionBody');
    const bulk=body?.classList.contains('is-bulk-selecting')||$('.collection-select-toggle')?.classList.contains('is-active');
    if(bulk||target.closest('.collection-item__remove,.collection-selectbox,.collection-bulkbar'))return;

    const id=questionCard.dataset.libraryId||'';
    if(!id)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openSavedQuestion(id);
  },true);

  window.addEventListener('pageshow',()=>{
    getWritePanel();
    if(isWrite())startGuard();
  },{passive:true});

  /* Capture the original panel node once. Even if an old render path later
     removes it from the DOM, the retained reference lets us reattach it. */
  getWritePanel();
  window.__photoQuestionIntent=intent;
})();
