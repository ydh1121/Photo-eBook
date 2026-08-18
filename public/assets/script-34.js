/* v4: canonical question intent + final write-panel reconciler.
   GPT bubble, saved-question reopen, and manual question writing all converge on
   one durable "write" intent. While that intent is active, the collection body
   is reconciled to the actual #askWritePanel node instead of merely painting the
   write tab active and hoping legacy rerenders agree. */
(function(){
  if(window.__photoQuestionIntentBridgeInstalled)return;
  window.__photoQuestionIntentBridgeInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  let intent='saved';
  let pendingBacking=Boolean(window.__photoPendingQuestionWrite);
  let guardObserver=null;
  let reconcileRaf=0;
  let previousForce=window.__photoForceQuestionWrite;

  function isWrite(){return intent==='write';}

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
      requestAnimationFrame(()=>{if(isWrite())startGuard();});
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
    intent=next==='write'?'write':'saved';
    pendingBacking=isWrite();
    window.__photoQuestionIntent=intent;
    if(isWrite())startGuard();
    else stopGuard();
  }
  window.__photoSetQuestionIntent=setIntent;

  /* script-24 and script-29 still read/write this historical flag. The critical
     rule is that ANY legacy `true` assignment is itself a write request. Earlier
     versions only changed pendingBacking, so a handoff that arrived without a
     pointerdown could have pending=true while canonical intent stayed `saved`;
     a later legacy false then won and the saved list reappeared. Promote every
     true assignment into canonical write intent, while delayed false assignments
     cannot clear an already-live write intent. */
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
        /* false is only a compatibility acknowledgement. Deliberate UI actions
           call setIntent('saved'); legacy timers are not allowed to end write. */
      }
    });
  }catch{
    window.__photoPendingQuestionWrite=pendingBacking;
  }

  function reconcileWritePanel(){
    if(!isWrite())return;

    const sheet=$('#collectionSheet');
    if(!sheet||sheet.hidden)return;

    const questionTab=$('.collection-tab[data-library-tab="question"]');
    if(questionTab&&!questionTab.classList.contains('is-active')){
      questionTab.click();
      return;
    }
    if(!questionTab)return;

    const controls=$('#v40QuestionControls');
    const write=$('[data-v40-qmode="write"]',controls||document);
    const saved=$('[data-v40-qmode="saved"]',controls||document);

    /* Keep script-24's private questionMode in sync once, but do not rely on
       the click alone for rendering. The DOM mount below is the final source of
       truth and the observer repairs any later saved-list repaint. */
    if(write&&!write.classList.contains('is-active')){
      write.click();
      return;
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
    const panel=$('#askWritePanel');
    if(!body||!panel)return;

    /* The legacy drawer can leave the write panel hidden after history. Always
       unhide the real node before it becomes collectionBody's sole child. */
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

    /* The old question drawer is only a state/data owner now. It must not become
       a second visible modal during the handoff. */
    const legacy=$('#askSheet');
    const legacyBackdrop=$('#askBackdrop');
    if(legacy)legacy.hidden=true;
    if(legacyBackdrop){legacyBackdrop.hidden=true;legacyBackdrop.style.pointerEvents='none';}
  }
  window.__photoReconcileQuestionWrite=reconcileWritePanel;

  previousForce=window.__photoForceQuestionWrite;
  window.__photoForceQuestionWrite=function(){
    setIntent('write');
    if(typeof previousForce==='function')previousForce();
    else $('#v40QuestionControls [data-v40-qmode="write"]')?.click();
    scheduleReconcile();
  };

  function armWriteFromTarget(target){
    if(!(target instanceof Element))return;
    if(target.closest('#askBubble')){
      setIntent('write');
      return;
    }
    const card=target.closest('.collection-item[data-library-type="question"]');
    if(!card)return;
    const body=card.closest('#collectionBody');
    const bulk=body?.classList.contains('is-bulk-selecting')||$('.collection-select-toggle')?.classList.contains('is-active');
    if(!bulk)setIntent('write');
  }

  /* Pointer/touch/mouse pre-arm keeps the normal physical click fast. The
     compatibility setter above is the fallback for synthetic/keyboard/programmatic
     entry paths where these pointer phases do not happen. */
  window.addEventListener('pointerdown',event=>armWriteFromTarget(event.target),true);
  window.addEventListener('touchstart',event=>armWriteFromTarget(event.target),{capture:true,passive:true});
  window.addEventListener('mousedown',event=>armWriteFromTarget(event.target),true);

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    if(target.closest('#collectionClose,#collectionBackdrop')){
      setIntent('saved');
      return;
    }

    const modeButton=target.closest('[data-v40-qmode]');
    if(modeButton){
      setIntent(modeButton.dataset.v40Qmode==='write'?'write':'saved');
      if(isWrite())scheduleReconcile();
      return;
    }

    const tab=target.closest('.collection-tab');
    if(tab&&tab.dataset.libraryTab!=='question'){
      setIntent('saved');
    }else if(tab?.dataset.libraryTab==='question'&&isWrite()){
      scheduleReconcile();
    }
  },false);

  window.addEventListener('pageshow',()=>{
    if(isWrite())startGuard();
  },{passive:true});

  window.__photoQuestionIntent=intent;
})();
