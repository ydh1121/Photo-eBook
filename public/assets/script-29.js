/* v60: canonical question-subfilter geometry with local resize resync. */
(function(){
  if(window.__photoV60QuestionGeometryInstalled)return;
  window.__photoV60QuestionGeometryInstalled=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)';
  let resizeObserver=null;
  let observedRoot=null;

  function getParts(){
    const controls=$('#v40QuestionControls');
    const root=$('.v40-question-segment',controls||document);
    if(!controls||!root)return null;

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

    root.classList.add('v41-skin-ready','v39-liquid-ready','v36-liquid-ready');
    return {controls,root,indicator};
  }

  function syncTo(button,{animate=false}={}){
    const parts=getParts();
    if(!parts||!button||!parts.root.contains(button))return;
    const {root,indicator}=parts;
    const x=button.offsetLeft;
    const y=button.offsetTop;
    if(!Number.isFinite(x)||!Number.isFinite(y))return;

    indicator.getAnimations?.().forEach(animation=>animation.cancel());
    indicator.style.transition=animate
      ?`transform 380ms ${BREEZE}`
      :'none';
    indicator.style.transform=`translate3d(${x}px,${y}px,0)`;
    indicator.dataset.x=String(x);
    indicator.dataset.y=String(y);
    indicator.dataset.ready='true';
    indicator.dataset.v41Measured='true';
    indicator.dataset.v60GeometryReady='true';

    if(!animate){
      requestAnimationFrame(()=>{
        if(indicator.isConnected)indicator.style.transition=`transform 380ms ${BREEZE}`;
      });
    }
  }

  function syncActive({animate=false}={}){
    const parts=getParts();
    if(!parts)return;
    const active=$('button.is-active',parts.root)||$('button',parts.root);
    if(active)syncTo(active,{animate});
  }

  function bindResize(){
    const parts=getParts();
    if(!parts||typeof ResizeObserver==='undefined')return;
    if(observedRoot===parts.root&&resizeObserver)return;
    resizeObserver?.disconnect();
    observedRoot=parts.root;
    resizeObserver=new ResizeObserver(()=>requestAnimationFrame(()=>syncActive({animate:false})));
    resizeObserver.observe(parts.root);
  }

  function repair(){
    const parts=getParts();
    if(!parts)return;
    bindResize();
    syncActive({animate:false});
  }

  function scheduleRepair(){
    [0,70,180,360].forEach(delay=>setTimeout(repair,delay));
  }

  document.addEventListener('click',event=>{
    const qmode=event.target.closest?.('[data-v40-qmode]');
    if(qmode){
      /* script-25 may also see this click; this later-loaded controller owns the
         final question-indicator transform and always uses the CURRENT slot. */
      syncTo(qmode,{animate:true});
      setTimeout(()=>syncActive({animate:false}),430);
      return;
    }
    if(event.target.closest?.('.collection-tab[data-library-tab="question"],#collectionFab'))scheduleRepair();
  },true);

  function init(){scheduleRepair();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(scheduleRepair,100),{passive:true});
})();
