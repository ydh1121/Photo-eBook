/* v61: exact mirrored geometry for the question sub-filter. */
(function(){
  if(window.__photoV61QuestionGeometryInstalled)return;
  window.__photoV61QuestionGeometryInstalled=true;

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

  function geometryFor(root,button){
    const buttons=$$('button[data-v40-qmode]',root);
    const index=buttons.indexOf(button);
    if(index<0)return null;

    const cs=getComputedStyle(root);
    const padL=parseFloat(cs.paddingLeft)||0;
    const padR=parseFloat(cs.paddingRight)||0;
    const padT=parseFloat(cs.paddingTop)||0;
    const slotW=button.offsetWidth;
    const compact=window.innerWidth<=360;
    const pillInset=compact?14:18;
    const pillCap=compact?146:154;
    const pillW=Math.max(0,Math.min(slotW-pillInset,pillCap));
    const inner=(slotW-pillW)/2;

    /* One coordinate system only: the positioned padding box. The left endpoint
       is measured from the left content edge; the right endpoint is mirrored
       from the right content edge. This avoids accumulating grid gap/padding a
       second time on the right-hand destination. */
    const x=index===0
      ? padL+inner
      : root.clientWidth-padR-inner-pillW;

    return {x,y:padT,w:pillW,h:button.offsetHeight};
  }

  function syncTo(button,{animate=false}={}){
    const parts=getParts();
    if(!parts||!button||!parts.root.contains(button))return;
    const {root,indicator}=parts;
    const next=geometryFor(root,button);
    if(!next||!next.w||!next.h)return;

    indicator.getAnimations?.().forEach(animation=>animation.cancel());
    indicator.style.setProperty('margin-left','0px','important');
    indicator.style.setProperty('width',`${next.w}px`,'important');
    indicator.style.setProperty('min-width',`${next.w}px`,'important');
    indicator.style.setProperty('max-width',`${next.w}px`,'important');
    indicator.style.setProperty('height',`${next.h}px`,'important');
    indicator.style.setProperty('min-height',`${next.h}px`,'important');
    indicator.style.setProperty('max-height',`${next.h}px`,'important');
    indicator.style.transition=animate
      ?`transform 380ms ${BREEZE}`
      :'none';
    indicator.style.transform=`translate3d(${next.x}px,${next.y}px,0)`;
    indicator.dataset.x=String(next.x);
    indicator.dataset.y=String(next.y);
    indicator.dataset.w=String(next.w);
    indicator.dataset.h=String(next.h);
    indicator.dataset.ready='true';
    indicator.dataset.v41Measured='true';
    indicator.dataset.v61GeometryReady='true';

    if(!animate){
      requestAnimationFrame(()=>{
        if(indicator.isConnected)indicator.style.transition=`transform 380ms ${BREEZE}`;
      });
    }
  }

  function syncActive({animate=false}={}){
    const parts=getParts();
    if(!parts)return;
    const active=$('button[data-v40-qmode].is-active',parts.root)||$('button[data-v40-qmode]',parts.root);
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
      /* script-25 runs earlier. This later-loaded controller owns the final
         question-indicator endpoint and rewrites it to the mirrored geometry. */
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
