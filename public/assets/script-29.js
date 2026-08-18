/* v67: canonical question cleanup, fresh contextual drafts, and deterministic collection handoff. */
(function(){
  if(window.__photoV66QuestionCanonicalInstalled)return;
  window.__photoV66QuestionCanonicalInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const QUESTION_KEY='photoRoadmapQuestionsV2';

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

  function openSavedQuestionFromCollection(id){
    const item=readQuestions().find(row=>String(row?.id||'')===String(id||''));
    if(!item)return;

    const questionTab=$('.collection-tab[data-library-tab="question"]');
    window.__photoPendingQuestionWrite=true;
    if(questionTab&&!questionTab.classList.contains('is-active'))questionTab.click();

    const apply=()=>{
      forceWrite();
      requestAnimationFrame(()=>fillSavedQuestion(item));
    };
    setTimeout(apply,questionTab?.classList.contains('is-active')?20:90);
    setTimeout(apply,190);
  }

  function openCurrentQuestionUi(){
    const bubble=$('#askBubble');
    if(bubble)bubble.hidden=true;

    /* showBubble() already copied the newly selected text into #askQuote/state.
       Reset only the question draft so a saved question cannot survive into a
       fresh contextual handoff. */
    resetContextualQuestionDraft();

    try{window.getSelection?.().removeAllRanges();}catch{}

    window.__photoPendingQuestionWrite=true;
    const fab=$('#collectionFab');
    const sheet=$('#collectionSheet');
    const questionTab=$('.collection-tab[data-library-tab="question"]');
    if(!fab||!questionTab){
      window.__photoPendingQuestionWrite=false;
      return;
    }

    if(sheet?.hidden)fab.click();

    setTimeout(()=>{
      questionTab.click();
      /* The collection renderer and cleanup layers can finish on later frames.
         The v40 owner keeps write mode authoritative through that short render
         window, then clears the pending flag itself. */
      [30,120,300].forEach(delay=>setTimeout(()=>{
        ensureQuestionStructure();
        forceWrite();
      },delay));
    },70);
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
       and then open that exact item in write mode. The old handler only worked
       when the Question tab was already active. */
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
  },true);

  function init(){schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(schedule,100),{passive:true});
})();
