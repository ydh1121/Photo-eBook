/* v64: canonical question cleanup and one safe route from contextual text selection into the current question UI. */
(function(){
  if(window.__photoV64QuestionCanonicalInstalled)return;
  window.__photoV64QuestionCanonicalInstalled=true;

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
       single owner of the question pill's spring and mirrored endpoints. */
    root.classList.add('v41-skin-ready','v39-liquid-ready','v36-liquid-ready');
  }

  function schedule(){
    [0,70,180].forEach(delay=>setTimeout(ensureQuestionStructure,delay));
  }

  function openCurrentQuestionUi(){
    const bubble=$('#askBubble');
    if(bubble)bubble.hidden=true;
    try{window.getSelection?.().removeAllRanges();}catch{}

    const fab=$('#collectionFab');
    const sheet=$('#collectionSheet');
    const questionTab=$('.collection-tab[data-library-tab="question"]');
    if(!fab||!questionTab)return;

    if(sheet?.hidden)fab.click();

    setTimeout(()=>{
      questionTab.click();
      setTimeout(()=>{
        ensureQuestionStructure();
        const write=$('#v40QuestionControls [data-v40-qmode="write"]');
        if(write&&!write.classList.contains('is-active'))write.click();
        else if(write)write.dispatchEvent(new Event('click',{bubbles:true}));
      },130);
    },70);
  }

  /* script-15 still has the retired v32 document-capture route for #askBubble.
     Window capture runs before document capture, so stop that legacy route here
     and send the selection straight into the current v40 collection workflow. */
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
