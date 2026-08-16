/* v65: canonical question cleanup and deterministic contextual-selection handoff. */
(function(){
  if(window.__photoV65QuestionCanonicalInstalled)return;
  window.__photoV65QuestionCanonicalInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function ensureQuestionStructure(){
    const controls=$('#v40QuestionControls');
    const root=$('.v40-question-segment',controls||document);
    if(!controls||!root)return;

    $$('[id="v40QuestionControls"]').filter(node=>node!==controls).forEach(node=>node.remove());
    $$('.v32-question-hub>.v32-question-segment').forEach(node=>{
      node.hidden=true;
      node.setAttribute('aria-hidden','true');
    });

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

  function openCurrentQuestionUi(){
    const bubble=$('#askBubble');
    if(bubble)bubble.hidden=true;

    /* showBubble() already copied the selected text into #askQuote/state before
       this click. Keep that data, then release the browser selection highlight. */
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
    if(!event.target?.closest?.('#askBubble'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openCurrentQuestionUi();
  },true);

  document.addEventListener('click',event=>{
    if(event.target.closest?.('.collection-tab[data-library-tab="question"],#collectionFab,[data-v40-qmode]'))schedule();
  },true);

  function init(){schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(schedule,100),{passive:true});
})();
