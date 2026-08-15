/* v39: visible liquid travel, stable question/search UI, endless curated rail, and OpenAI handoff polish. */
(function(){
  if(window.__photoV39Installed)return;
  window.__photoV39Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
  const railState=new WeakMap();
  const railObservers=new WeakMap();
  const QUESTION_KEY='photoRoadmapQuestionsV2';

  const rails=[
    {root:'.nav-scroll',item:'.nav-chip',indicator:'.nav-v33-indicator',ready:'v33-liquid-ready'},
    {root:'.collection-tabs',item:'.collection-tab',indicator:'.collection-v33-indicator',ready:'v33-liquid-ready'},
    {root:'.theme-choice',item:'button',indicator:'.theme-v34-indicator',ready:'v34-liquid-ready'},
    {root:'.v32-question-segment',item:'button',indicator:'.v36-question-indicator',ready:'v36-liquid-ready'}
  ];

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function ensureSkin(indicator){
    if(!indicator)return null;
    let skin=$(':scope > .v37-liquid-skin',indicator);
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    return skin;
  }

  function ensureIndicator(root,config){
    if(!root)return null;
    let indicator=$(config.indicator,root);
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className=config.indicator.slice(1);
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }
    ensureSkin(indicator);
    return indicator;
  }

  function activeItem(root,config){
    return $(`${config.item}.is-active`,root)||$(config.item,root);
  }

  function geometry(item){
    return item?{x:item.offsetLeft,y:item.offsetTop,w:item.offsetWidth,h:item.offsetHeight}:null;
  }

  function paintFinal(root,config,item,instant=false){
    if(!root||!item)return;
    const indicator=ensureIndicator(root,config);
    const next=geometry(item);
    if(!indicator||!next||!next.w||!next.h)return;
    const previous=railState.get(root)||next;

    indicator.style.width=`${next.w}px`;
    indicator.style.height=`${next.h}px`;
    indicator.style.transform=`translate3d(${next.x}px,${next.y}px,0)`;
    root.classList.add(config.ready,'v39-liquid-ready');

    const moved=Math.abs(next.x-previous.x)>.5||Math.abs(next.w-previous.w)>.5||Math.abs(next.y-previous.y)>.5;
    if(!instant&&moved&&!reduced()&&typeof indicator.animate==='function'){
      indicator.getAnimations().forEach(a=>a.cancel());
      const skin=ensureSkin(indicator);
      skin?.getAnimations?.().forEach(a=>a.cancel());
      const dx=next.x-previous.x;
      const direction=Math.sign(dx)||1;
      const distance=Math.abs(dx);
      const overshoot=Math.min(5.2,1.8+distance*.0105);
      const stretch=Math.min(1.045,1.015+distance/9000);
      const duration=Math.min(560,350+distance*.28);
      const ratio=Math.max(.58,Math.min(1.72,previous.w/Math.max(1,next.w)));

      indicator.animate([
        {transform:`translate3d(${previous.x}px,${previous.y}px,0) scaleX(${ratio}) scaleY(1)`,offset:0,easing:'cubic-bezier(.22,.7,.2,1)'},
        {transform:`translate3d(${next.x-direction*2}px,${next.y}px,0) scaleX(${stretch}) scaleY(.988)`,offset:.66,easing:'cubic-bezier(.16,.8,.18,1)'},
        {transform:`translate3d(${next.x+direction*overshoot}px,${next.y}px,0) scaleX(.992) scaleY(1.006)`,offset:.84,easing:'cubic-bezier(.18,.75,.2,1)'},
        {transform:`translate3d(${next.x-direction*.9}px,${next.y}px,0) scaleX(1.006) scaleY(.998)`,offset:.94,easing:'cubic-bezier(.2,.8,.2,1)'},
        {transform:`translate3d(${next.x}px,${next.y}px,0) scaleX(1) scaleY(1)`,offset:1}
      ],{duration,fill:'none'});
    }
    railState.set(root,next);
  }

  function bindRail(config){
    const root=$(config.root);
    if(!root)return;
    const item=activeItem(root,config);
    if(item)paintFinal(root,config,item,true);
    if(railObservers.has(root))return;

    const observer=new MutationObserver(records=>{
      const changed=records.some(record=>record.type==='attributes'&&record.attributeName==='class'&&record.target.matches?.(config.item));
      if(!changed)return;
      requestAnimationFrame(()=>{
        const current=activeItem(root,config);
        if(current)paintFinal(root,config,current,false);
      });
    });
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
    railObservers.set(root,observer);
  }

  function ensureAllRails(){rails.forEach(bindRail);}

  /* ------------------------------------------------------------------
     Question hub: secondary filter never disappears, search stays visible,
     and bulk-selection markers survive switching write/saved modes.
     ------------------------------------------------------------------ */
  function questionTabActive(){return $('.collection-tab.is-active[data-library-tab="question"]');}

  function ensureQuestionHub(){
    if(!questionTabActive())return false;
    const body=$('#collectionBody');
    const askPanel=$('#askWritePanel');
    const tools=$('#collectionTools');
    if(!body||!askPanel)return false;

    if(tools){
      tools.hidden=false;
      const filters=$('#collectionFilters',tools);
      if(filters)filters.hidden=true;
      const search=$('.collection-search',tools);
      if(search){search.hidden=false;search.style.display='flex';}
    }

    let hub=$('.v32-question-hub',body);
    if(!hub){
      const savedNodes=[...body.childNodes];
      hub=document.createElement('div');
      hub.className='v32-question-hub';
      hub.innerHTML=`<div class="v32-question-segment" role="tablist" aria-label="질문 관리">
        <button type="button" data-v32-qmode="write">질문 작성</button>
        <button type="button" data-v32-qmode="saved" class="is-active">저장한 질문 <span>${readQuestions().length}</span></button>
      </div><div class="v32-question-write" hidden></div><div class="v32-question-saved"></div>`;
      body.appendChild(hub);
      const saved=$('.v32-question-saved',hub);
      savedNodes.forEach(node=>{if(node!==hub&&node!==askPanel)saved?.appendChild(node);});
      $('.v32-question-write',hub)?.appendChild(askPanel);
    }

    const badge=$('[data-v32-qmode="saved"] span',hub);
    if(badge)badge.textContent=String(readQuestions().length);
    bindRail(rails[3]);
    repairBulkSelection();
    return true;
  }

  function bulkSelecting(){
    const toggle=$('.collection-select-toggle');
    return Boolean(toggle&&(toggle.classList.contains('is-active')||toggle.textContent.trim()==='완료'));
  }

  function repairBulkSelection(){
    const body=$('#collectionBody');
    if(!body||!bulkSelecting())return;
    body.classList.add('is-bulk-selecting');
    $$('.collection-item',body).forEach(card=>{
      if($('.collection-selectbox',card))return;
      const box=document.createElement('button');
      box.type='button';
      box.className='collection-selectbox';
      box.setAttribute('aria-label','항목 선택');
      box.setAttribute('aria-pressed','false');
      card.prepend(box);
    });
  }

  function scheduleQuestionRepair(){
    [0,50,140,320,700].forEach(delay=>setTimeout(()=>{
      ensureQuestionHub();
      ensureAllRails();
      repairBulkSelection();
    },delay));
  }

  /* ------------------------------------------------------------------
     Curated rail: independent near-end loader so the strip cannot stop at a
     spinner even when the older sentinel/listener was replaced by rerendering.
     ------------------------------------------------------------------ */
  let curatedCursor=0;
  let curatedLoading=false;
  let curatedBound=null;

  function curatedKey(item){return String(item?.id||item?.url||'');}
  function visibleCuratedKeys(row){
    const set=new Set();
    $$('.curated-card',row).forEach(card=>{
      if(card.dataset.curatedId)set.add(card.dataset.curatedId);
      const href=$('a[href]',card)?.href;
      if(href)set.add(href);
    });
    return set;
  }

  function ensureCuratedSentinel(row){
    let sentinel=$('.curated-v39-sentinel',row);
    if(!sentinel){
      sentinel=document.createElement('div');
      sentinel.className='curated-v39-sentinel';
      sentinel.setAttribute('aria-hidden','true');
      row.appendChild(sentinel);
    }
    return sentinel;
  }

  async function loadCuratedMore(){
    const row=$('#curatedLinksRow');
    if(!row||curatedLoading)return;
    curatedLoading=true;
    let sentinel=ensureCuratedSentinel(row);
    sentinel.classList.add('is-loading');
    $$('.curated-discovery-sentinel',row).forEach(node=>node.classList.remove('is-loading'));
    try{
      let fresh=[];
      const existing=visibleCuratedKeys(row);
      for(let attempt=0;attempt<5&&!fresh.length;attempt++){
        const response=await fetch(`/api/discover?cursor=${curatedCursor}&limit=10`,{cache:'no-store'});
        const json=await response.json().catch(()=>({}));
        curatedCursor=Number.isFinite(Number(json.nextCursor))?Number(json.nextCursor):curatedCursor+1;
        if(!response.ok)continue;
        fresh=(json.items||[]).filter(item=>{
          const key=curatedKey(item);
          if(!key)return false;
          if(existing.has(key)||existing.has(String(item.url||'')))return false;
          existing.add(key);
          if(item.url)existing.add(String(item.url));
          return true;
        });
      }
      if(fresh.length&&typeof window.renderCuratedItems==='function'){
        window.renderCuratedItems(fresh);
      }
    }catch{}
    finally{
      curatedLoading=false;
      const current=$('#curatedLinksRow');
      if(current){
        $$('.curated-discovery-sentinel',current).forEach(node=>node.classList.remove('is-loading'));
        sentinel=ensureCuratedSentinel(current);
        sentinel.classList.remove('is-loading');
      }
    }
  }

  function nearCuratedEnd(row){
    return row.scrollWidth-row.clientWidth-row.scrollLeft<Math.max(860,row.clientWidth*2.05);
  }

  function bindCuratedRail(){
    const row=$('#curatedLinksRow');
    if(!row)return;
    ensureCuratedSentinel(row);
    if(curatedBound===row)return;
    curatedBound=row;
    let raf=0;
    const check=()=>{
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        if(nearCuratedEnd(row))loadCuratedMore();
      });
    };
    row.addEventListener('scroll',check,{passive:true});
    row.addEventListener('touchend',check,{passive:true});
    row.addEventListener('pointerup',check,{passive:true});
    row.addEventListener('wheel',check,{passive:true});
    setTimeout(()=>{
      if(row.scrollWidth<row.clientWidth*2.4)loadCuratedMore();
    },220);
  }

  /* ------------------------------------------------------------------
     OpenAI handoff: one ChatGPT button only. Use the official ChatGPT site
     icon and the web/universal URL; no separate App Store button.
     ------------------------------------------------------------------ */
  function polishChatGPT(){
    const install=$('#askInstallChatGPT');
    if(install){install.hidden=true;install.remove();}
    const open=$('#askOpenChatGPT');
    if(!open)return;
    open.dataset.v39Openai='true';
    open.innerHTML='<img class="v39-openai-icon" src="https://chatgpt.com/favicon.ico" alt="" aria-hidden="true"><span>ChatGPT 열기</span>';
    open.setAttribute('aria-label','ChatGPT 열기');
  }

  /* ------------------------------------------------------------------
     Copy polish: replace the one awkward revenue sentence in-place.
     ------------------------------------------------------------------ */
  function polishCopy(){
    const from='전체 그림은 카드로 빠르게 보고, 아래에서 이유와 계산을 차근차근 읽습니다.';
    const to='먼저 12개월 흐름을 카드로 훑어보고, 아래에서 매출과 비용이 왜 이렇게 잡히는지 하나씩 확인합니다.';
    $$('h1,h2,h3,h4,p,div,span').forEach(node=>{
      if(node.children.length===0&&node.textContent.trim()===from)node.textContent=to;
    });
  }

  function repairTopColor(){
    const nav=$('.nav-scroll');
    if(!nav)return;
    bindRail(rails[0]);
    const active=activeItem(nav,rails[0]);
    if(active)paintFinal(nav,rails[0],active,true);
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('.collection-tab[data-library-tab="question"],#collectionFab'))scheduleQuestionRepair();
    if(event.target.closest?.('[data-v32-qmode]')){
      setTimeout(()=>{ensureQuestionHub();repairBulkSelection();ensureAllRails();},40);
      setTimeout(()=>{repairBulkSelection();ensureAllRails();},220);
    }
    if(event.target.closest?.('.collection-select-toggle')){
      setTimeout(()=>{repairBulkSelection();ensureQuestionHub();},40);
    }
    if(event.target.closest?.('.nav-chip')){
      setTimeout(repairTopColor,40);
      setTimeout(repairTopColor,220);
    }
    if(event.target.closest?.('#askSave'))setTimeout(()=>{ensureQuestionHub();polishChatGPT();},90);
  },true);

  window.addEventListener('photo-theme-change',()=>requestAnimationFrame(()=>{ensureAllRails();repairTopColor();}),{passive:true});
  window.addEventListener('pageshow',()=>{
    setTimeout(()=>{
      ensureAllRails();
      repairTopColor();
      scheduleQuestionRepair();
      bindCuratedRail();
      polishChatGPT();
      polishCopy();
    },140);
  },{passive:true});

  function init(){
    ensureAllRails();
    repairTopColor();
    bindCuratedRail();
    polishChatGPT();
    polishCopy();
    [280,760,1500].forEach(delay=>setTimeout(()=>{
      ensureAllRails();
      bindCuratedRail();
      polishChatGPT();
      polishCopy();
    },delay));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
