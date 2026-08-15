/* v40: single-owner liquid motion, stable question controls, selection geometry, and one curated loader. */
(function(){
  if(window.__photoV40Installed)return;
  window.__photoV40Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
  const springTimers=new WeakMap();
  let questionMode='saved';
  let restoringSaved=false;
  let curatedCursor=0;
  let curatedLoading=false;

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  /* ------------------------------------------------------------------
     Liquid motion: v34/v36 keep ownership of indicator travel. v40 only
     gives the skin one restrained settle deformation after travel ends.
     This avoids competing transform writers and the jitter seen in v39.
     ------------------------------------------------------------------ */
  function skinFor(root){
    const indicator=root?.querySelector('.nav-v33-indicator,.collection-v33-indicator,.theme-v34-indicator,.v36-question-indicator');
    if(!indicator)return null;
    let skin=indicator.querySelector(':scope > .v37-liquid-skin');
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }
    return skin;
  }

  function settleSkin(root,direction){
    if(!root||reduced())return;
    clearTimeout(springTimers.get(root));
    const timer=setTimeout(()=>{
      const skin=skinFor(root);
      if(!skin||typeof skin.animate!=='function')return;
      skin.getAnimations().forEach(animation=>animation.cancel());
      const dir=direction||1;
      skin.animate([
        {transform:'translate3d(0,0,0) scaleX(1) scaleY(1)',offset:0},
        {transform:`translate3d(${dir*2.2}px,0,0) scaleX(1.022) scaleY(.989)`,offset:.42},
        {transform:`translate3d(${-dir*.9}px,0,0) scaleX(.995) scaleY(1.004)`,offset:.76},
        {transform:'translate3d(0,0,0) scaleX(1) scaleY(1)',offset:1}
      ],{duration:220,easing:'cubic-bezier(.22,.72,.2,1)'});
    },310);
    springTimers.set(root,timer);
  }

  document.addEventListener('click',event=>{
    const chip=event.target.closest?.('.nav-chip,.collection-tab,.theme-choice button,.v32-question-segment button');
    if(!chip)return;
    const root=chip.closest('.nav-scroll,.collection-tabs,.theme-choice,.v32-question-segment');
    if(!root)return;
    const active=root.querySelector('.is-active');
    const direction=Math.sign((chip.offsetLeft||0)-(active?.offsetLeft||chip.offsetLeft||0))||1;
    settleSkin(root,direction);
  },true);

  /* ------------------------------------------------------------------
     Stable question UI. Controls live outside #collectionBody so normal
     library rerenders cannot delete them. The write panel is parked before
     any tab render and only mounted while "질문 작성" is selected.
     ------------------------------------------------------------------ */
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

  function parkAskPanel(){
    const panel=$('#askWritePanel');
    const parking=ensureParking();
    if(panel&&panel.parentNode!==parking)parking.appendChild(panel);
    return panel;
  }

  function ensureQuestionControls(){
    const tools=$('#collectionTools');
    if(!tools)return null;
    let controls=$('#v40QuestionControls');
    if(!controls){
      controls=document.createElement('div');
      controls.id='v40QuestionControls';
      controls.className='v40-question-controls';
      controls.hidden=true;
      controls.innerHTML=`<div class="v32-question-segment v40-question-segment" role="tablist" aria-label="질문 관리">
        <button type="button" data-v40-qmode="write">질문 작성</button>
        <button type="button" data-v40-qmode="saved" class="is-active">저장한 질문 <span>${readQuestions().length}</span></button>
      </div>`;
      tools.insertAdjacentElement('afterend',controls);
      controls.addEventListener('click',event=>{
        const button=event.target.closest('[data-v40-qmode]');
        if(!button)return;
        setQuestionMode(button.dataset.v40Qmode||'saved');
      });
    }
    const badge=$('[data-v40-qmode="saved"] span',controls);
    if(badge)badge.textContent=String(readQuestions().length);
    return controls;
  }

  function isQuestionTab(){
    return Boolean($('.collection-tab.is-active[data-library-tab="question"]'));
  }

  function showQuestionChrome(){
    const controls=ensureQuestionControls();
    const tools=$('#collectionTools');
    if(!controls||!tools)return;
    controls.hidden=false;
    tools.hidden=false;
    tools.style.display='grid';
    const search=$('.collection-search',tools);
    if(search){search.hidden=false;search.style.display='flex';}
    const filters=$('#collectionFilters',tools);
    if(filters)filters.hidden=true;
  }

  function hideQuestionChrome(){
    const controls=$('#v40QuestionControls');
    if(controls)controls.hidden=true;
  }

  function setControlState(){
    const controls=ensureQuestionControls();
    if(!controls)return;
    $$('[data-v40-qmode]',controls).forEach(button=>button.classList.toggle('is-active',button.dataset.v40Qmode===questionMode));
    const badge=$('[data-v40-qmode="saved"] span',controls);
    if(badge)badge.textContent=String(readQuestions().length);
  }

  function stripLegacyQuestionHub(){
    const body=$('#collectionBody');
    if(!body)return;
    const legacy=$('.v32-question-hub',body);
    if(!legacy)return;

    const panel=$('#askWritePanel',legacy)||$('#askWritePanel');
    if(panel)ensureParking().appendChild(panel);

    if(questionMode==='saved'){
      const saved=$('.v32-question-saved',legacy);
      const nodes=saved?[...saved.childNodes]:[];
      legacy.remove();
      nodes.forEach(node=>body.appendChild(node));
    }else{
      legacy.remove();
    }
  }

  function mountWritePanel(){
    if(!isQuestionTab())return;
    const body=$('#collectionBody');
    const panel=$('#askWritePanel')||$('#v40QuestionParking #askWritePanel');
    if(!body||!panel)return;
    stripLegacyQuestionHub();
    if(panel.parentNode!==body){
      body.replaceChildren(panel);
    }
    body.classList.remove('is-bulk-selecting');
    const toggle=$('.collection-select-toggle');
    if(toggle){toggle.classList.remove('is-active');toggle.textContent='선택';toggle.hidden=true;}
    const bar=$('.collection-bulkbar');
    if(bar)bar.hidden=true;
  }

  function restoreSavedList(){
    if(restoringSaved||!isQuestionTab())return;
    restoringSaved=true;
    parkAskPanel();
    const tab=$('.collection-tab[data-library-tab="question"]');
    if(tab){
      tab.click();
      setTimeout(()=>{
        restoringSaved=false;
        questionMode='saved';
        showQuestionChrome();
        setControlState();
        stripLegacyQuestionHub();
        repairBulkLayout();
      },90);
    }else restoringSaved=false;
  }

  function setQuestionMode(mode){
    questionMode=mode==='write'?'write':'saved';
    showQuestionChrome();
    setControlState();
    if(questionMode==='write'){
      parkAskPanel();
      requestAnimationFrame(mountWritePanel);
    }else{
      restoreSavedList();
    }
  }

  function repairQuestionAfterRender(){
    if(!isQuestionTab())return;
    showQuestionChrome();
    setControlState();
    stripLegacyQuestionHub();
    if(questionMode==='write')mountWritePanel();
    repairBulkLayout();
  }

  /* ------------------------------------------------------------------
     Bulk selection: explicit grid columns prevent Q/thumb/main/remove from
     being pushed behind one another on iPhone widths.
     ------------------------------------------------------------------ */
  function repairBulkLayout(){
    const body=$('#collectionBody');
    if(!body)return;
    const toggle=$('.collection-select-toggle');
    const bulk=Boolean(toggle&&(toggle.classList.contains('is-active')||toggle.textContent.trim()==='완료'));
    body.classList.toggle('is-bulk-selecting',bulk);
    if(!bulk)return;
    $$('.collection-item',body).forEach(card=>{
      let box=$('.collection-selectbox',card);
      if(!box){
        box=document.createElement('button');
        box.type='button';
        box.className='collection-selectbox';
        box.setAttribute('aria-label','항목 선택');
        box.setAttribute('aria-pressed','false');
        card.prepend(box);
      }
    });
  }

  /* ------------------------------------------------------------------
     Curated rail: remove the v39 duplicate sentinel and use exactly one
     existing discovery sentinel. Empty pages advance the cursor, but never
     create a second spinner.
     ------------------------------------------------------------------ */
  function curatedRow(){return $('#curatedLinksRow');}

  function canonicalSentinel(row){
    if(!row)return null;
    $$('.curated-v39-sentinel,.curated-v40-sentinel',row).forEach(node=>node.remove());
    const all=$$('.curated-discovery-sentinel',row);
    all.slice(1).forEach(node=>node.remove());
    let sentinel=all[0];
    if(!sentinel){
      sentinel=document.createElement('div');
      sentinel.className='curated-discovery-sentinel';
      sentinel.setAttribute('aria-hidden','true');
      row.appendChild(sentinel);
    }
    return sentinel;
  }

  function existingCurated(row){
    const keys=new Set();
    $$('.curated-card',row).forEach(card=>{
      if(card.dataset.curatedId)keys.add(String(card.dataset.curatedId));
      const href=$('a[href]',card)?.href;
      if(href)keys.add(href);
    });
    return keys;
  }

  async function loadCuratedMore(){
    const row=curatedRow();
    if(!row||curatedLoading)return;
    curatedLoading=true;
    const sentinel=canonicalSentinel(row);
    sentinel?.classList.add('is-loading');
    try{
      const known=existingCurated(row);
      let fresh=[];
      for(let attempt=0;attempt<4&&!fresh.length;attempt++){
        const response=await fetch(`/api/discover?cursor=${curatedCursor}&limit=10`,{cache:'no-store'});
        const json=await response.json().catch(()=>({}));
        curatedCursor=Number.isFinite(Number(json.nextCursor))?Number(json.nextCursor):curatedCursor+1;
        if(!response.ok)continue;
        fresh=(json.items||[]).filter(item=>{
          const id=String(item?.id||'');
          const url=String(item?.url||'');
          if((id&&known.has(id))||(url&&known.has(url)))return false;
          if(id)known.add(id);
          if(url)known.add(url);
          return Boolean(id||url);
        });
      }
      if(fresh.length&&typeof window.renderCuratedItems==='function'){
        const left=row.scrollLeft;
        window.renderCuratedItems(fresh);
        requestAnimationFrame(()=>{
          const next=curatedRow();
          if(next){next.scrollLeft=left;canonicalSentinel(next);}
        });
      }
    }catch{}
    finally{
      curatedLoading=false;
      canonicalSentinel(curatedRow())?.classList.remove('is-loading');
    }
  }

  function bindCurated(){
    const row=curatedRow();
    if(!row||row.dataset.v40Bound==='true')return;
    row.dataset.v40Bound='true';
    canonicalSentinel(row);
    let raf=0;
    row.addEventListener('scroll',()=>{
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        canonicalSentinel(row);
        const remaining=row.scrollWidth-row.clientWidth-row.scrollLeft;
        if(remaining<Math.max(700,row.clientWidth*1.55))loadCuratedMore();
      });
    },{passive:true});
  }

  function scheduleRepair(){
    [0,40,110,260].forEach(delay=>setTimeout(()=>{
      ensureQuestionControls();
      if(isQuestionTab())repairQuestionAfterRender();
      else hideQuestionChrome();
      bindCurated();
      canonicalSentinel(curatedRow());
    },delay));
  }

  document.addEventListener('click',event=>{
    const tab=event.target.closest?.('.collection-tab');
    if(tab){
      const name=tab.dataset.libraryTab||'';
      if(name!=='question'){
        parkAskPanel();
        questionMode='saved';
        hideQuestionChrome();
      }else if(!restoringSaved){
        questionMode='saved';
      }
      scheduleRepair();
    }

    if(event.target.closest?.('#collectionFab'))scheduleRepair();
    if(event.target.closest?.('.collection-select-toggle,.collection-bulkbar__all,.collection-selectbox')){
      setTimeout(repairBulkLayout,0);
      setTimeout(repairBulkLayout,80);
    }
    if(event.target.closest?.('#askSave')){
      setTimeout(()=>{
        setControlState();
        if(questionMode==='saved')restoreSavedList();
      },100);
    }
  },true);

  function init(){
    parkAskPanel();
    ensureQuestionControls();
    bindCurated();
    scheduleRepair();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(scheduleRepair,120),{passive:true});
})();
