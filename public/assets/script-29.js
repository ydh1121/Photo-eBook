/* v63: canonicalize the question sub-filter without competing with its spring owner. */
(function(){
  if(window.__photoV63QuestionCanonicalInstalled)return;
  window.__photoV63QuestionCanonicalInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function ensureQuestionIndicator(){
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

    const active=$('button[data-v40-qmode].is-active',root)||$('button[data-v40-qmode]',root);
    if(!active)return;
    const w=active.offsetWidth;
    const h=active.offsetHeight;
    if(!w||!h)return;

    /* Initialization only. script-25 remains the sole movement/animation owner.
       The visual left/right inset is handled by CSS so no second controller can
       fight the spring transform or create jitter. */
    if(indicator.dataset.v63CanonicalReady!=='true'){
      indicator.style.transition='none';
      indicator.style.width=w+'px';
      indicator.style.height=h+'px';
      indicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
      indicator.dataset.x=String(active.offsetLeft);
      indicator.dataset.y=String(active.offsetTop);
      indicator.dataset.w=String(w);
      indicator.dataset.h=String(h);
      indicator.dataset.ready='true';
      indicator.dataset.v41Measured='true';
      indicator.dataset.v63CanonicalReady='true';
      root.classList.add('v41-skin-ready','v39-liquid-ready','v36-liquid-ready');
      requestAnimationFrame(()=>{
        if(indicator.isConnected){
          indicator.style.transition='transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), width 380ms cubic-bezier(0.34, 1.56, 0.64, 1), height 380ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });
    }
  }

  function schedule(){
    [0,70,180].forEach(delay=>setTimeout(ensureQuestionIndicator,delay));
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('.collection-tab[data-library-tab="question"],#collectionFab,[data-v40-qmode]'))schedule();
  },true);

  function init(){schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(schedule,100),{passive:true});
})();
