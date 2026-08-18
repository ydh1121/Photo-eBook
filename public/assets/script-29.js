/* v68: canonical question cleanup, fresh contextual drafts, and deterministic collection handoff. */
(function(){
  if(window.__photoV66QuestionCanonicalInstalled)return;
  window.__photoV66QuestionCanonicalInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  let writeDriveToken=0;

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
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

    let skin=$(':scope>.v37-liquid-skin',indicator);
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }

    /* Geometry and motion are intentionally NOT written here. script-25 is the
       sole owner of the current v40 pill's spring and endpoint coordinates. */
    root.classList.add('v41-skin-ready','v39-liquid-ready','v36-liquid-ready');
  }

  function schedule(){
    [0,70,180].forEach(delay=>setTimeout(ensureQuestionStructure,delay));
  }

  function forceWrite(){
    if(typeof window.__photoForceQuestionWrite==='function'){
      window.__photoForceQuestionWrite();
      return;
    }
    const write=$('#v40QuestionControls [data-v40-qmode="write"]');
    write?.click();
  }

  function dispatchValueChange(input){
    if(!input)return;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function resetContextualQuestionDraft(){
    /* A contextual GPT bubble always starts a new draft. A previously opened
       saved question must never leak into the next text-selection handoff. */
    const input=$('#askInput');
    if(input){
      input.value='이 부분을 쉽게 설명해줘.';
      dispatchValueChange(input);
    }
  }

  function fillSavedQuestion(item){
    if(!item)return;
    const quote=$('#askQuote');
    const input=$('#askInput');
    if(quote){
      quote.textContent=String(item.selected_text||item.selection||item.quote||'문장을 선택하면 여기에 표시됩니다.');
    }
    if(input){
      input.value=String(item.question||item.prompt||'');
      dispatchValueChange(input);
    }
    const body=$('#collectionBody');
    if(body)body.scrollTop=0;
  }

  function releaseLegacyQuestionModal(){
    /* The original ask sheet still exists as a data/state owner. It must never
       become the visible modal once the collection sheet owns question UI. */
    const legacy=$('#askSheet');
    const backdrop=$('#askBackdrop');
    if(legacy)legacy.hidden=true;
    if(backdrop){
      backdrop.hidden=true;
      backdrop.style.pointerEvents='none';
    }
    document.documentElement.classList.remove('ask-modal-locked');
    document.body.classList.remove('ask-modal-locked','is-modal-open');
    document.body.style.top='';
  }

  function writeModeMounted(){
    const questionTab=$('.collection-tab[data-library-tab="question"]');
    const write=$('#v40QuestionControls [data-v40-qmode="write"]');
    const panel=$('#askWritePanel');
    const body=$('#collectionBody');
    return Boolean(
      questionTab?.classList.contains('is-active')&&
      write?.classList.contains('is-active')&&
      panel&&body&&panel.parentNode===body
    );
  }

  function driveWriteMode(afterMount){
    const token=++writeDriveToken;
    const started=performance.now();
    let mountedPasses=0;
    let filled=false;

    const step=()=>{
      if(token!==writeDriveToken)return;
      releaseLegacyQuestionModal();
      window.__photoPendingQuestionWrite=true;

      const questionTab=$('.collection-tab[data-library-tab="question"]');
      if(questionTab&&!questionTab.classList.contains('is-active'))questionTab.click();

      ensureQuestionStructure();
      forceWrite();

      requestAnimationFrame(()=>{
        if(token!==writeDriveToken)return;
        ensureQuestionStructure();
        if(writeModeMounted()){
          mountedPasses++;
          if(!filled&&typeof afterMount==='function'){
            filled=true;
            afterMount();
          }
        }else mountedPasses=0;

        /* Require more than one stable frame because collection-tab rendering
           is asynchronous and older handlers can repaint the saved list once. */
        if(mountedPasses>=3){
          setTimeout(()=>{
            if(token===writeDriveToken&&writeModeMounted()){
              window.__photoPendingQuestionWrite=false;
            }
          },180);
          return;
        }

        if(performance.now()-started<1500)setTimeout(step,65);
        else{
          /* Last deterministic attempt. Leave the pending flag on briefly so a
             late renderer still resolves to write mode instead of saved mode. */
          window.__photoPendingQuestionWrite=true;
          forceWrite();
          setTimeout(()=>{if(token===writeDriveToken)window.__photoPendingQuestionWrite=false;},420);
        }
      });
    };

    step();
  }

  function openCollectionForQuestionWrite(afterMount){
    window.__photoPendingQuestionWrite=true;
    releaseLegacyQuestionModal();

    const sheet=$('#collectionSheet');
    const fab=$('#collectionFab');
    if(!fab)return;
    if(!sheet||sheet.hidden)fab.click();

    /* Wait only for the collection shell itself; driveWriteMode then owns the
       entire question-tab/write-mode transition until it is visibly mounted. */
    const start=performance.now();
    const wait=()=>{
      const currentSheet=$('#collectionSheet');
      const questionTab=$('.collection-tab[data-library-tab="question"]');
      if(currentSheet&&!currentSheet.hidden&&questionTab){
        driveWriteMode(afterMount);
        return;
      }
      if(performance.now()-start<1200)setTimeout(wait,40);
      else driveWriteMode(afterMount);
    };
    wait();
  }

  function openSavedQuestionFromCollection(id){
    const item=readQuestions().find(row=>String(row?.id||'')===String(id||''));
    if(!item)return;
    openCollectionForQuestionWrite(()=>fillSavedQuestion(item));
  }

  function openCurrentQuestionUi(){
    const bubble=$('#askBubble');
    if(bubble)bubble.hidden=true;

    /* showBubble() has already copied the newly selected text into #askQuote
       and the legacy state object. Only clear the old question draft. */
    resetContextualQuestionDraft();
    try{window.getSelection?.().removeAllRanges();}catch{}
    openCollectionForQuestionWrite(()=>{
      resetContextualQuestionDraft();
      const body=$('#collectionBody');
      if(body)body.scrollTop=0;
      setTimeout(()=>$('#askInput')?.focus(),80);
    });
  }

  window.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    if(target.closest('#askBubble')){
      event.preventDefault();
      event.stopImmediatePropagation();
      openCurrentQuestionUi();
      return;
    }

    /* In the All tab, a saved-question card must first enter the Question tab
       and then open that exact item in write mode. */
    const questionCard=target.closest('.collection-item[data-library-type="question"]');
    if(!questionCard)return;
    const body=questionCard.closest('#collectionBody');
    const bulk=body?.classList.contains('is-bulk-selecting')||$('.collection-select-toggle')?.classList.contains('is-active');
    if(bulk)return;
    if(target.closest('.collection-item__remove,.collection-selectbox,.collection-bulkbar'))return;

    const id=questionCard.dataset.libraryId||'';
    if(!id)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openSavedQuestionFromCollection(id);
  },true);

  document.addEventListener('click',event=>{
    if(event.target.closest?.('.collection-tab[data-library-tab="question"],#collectionFab,[data-v40-qmode]'))schedule();

    /* A deliberate close ends any forced contextual handoff. The next normal
       collection opening can therefore default to the saved list again. */
    if(event.target.closest?.('#collectionClose,#collectionBackdrop')){
      writeDriveToken++;
      window.__photoPendingQuestionWrite=false;
    }
  },true);

  function init(){schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(schedule,100),{passive:true});
})();
