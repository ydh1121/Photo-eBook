/* v37: event-driven liquid polish and bulk collection actions. Current v40 question motion is excluded here and owned by script-25. */
(function(){
  if(window.__photoV36Installed)return;
  window.__photoV36Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const VIDEO_IDS_KEY='photoRoadmapVideoFavoritesV1';
  const VIDEO_ITEMS_KEY='photoRoadmapVideoFavoriteItemsV2';
  const ARTICLE_IDS_KEY='photoRoadmapCuratedFavoritesV1';
  const ARTICLE_ITEMS_KEY='photoRoadmapCuratedFavoriteItemsV2';
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const DEVICE_KEY='photoRoadmapDeviceKeyV1';

  function readArray(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}
  }
  function readObject(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
  }
  function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function writeObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}

  /* ------------------------------------------------------------------------
     Legacy question rail only. The current .v40-question-segment keeps the
     shared visual class but must never be moved by this retired controller.
     ------------------------------------------------------------------------ */
  function syncQuestionIndicator(root,instant=false){
    if(!root||!root.isConnected||root.classList.contains('v40-question-segment'))return;
    const active=$('button.is-active',root)||$('button',root);
    if(!active)return;

    let indicator=$('.v36-question-indicator',root);
    if(!indicator){
      indicator=document.createElement('span');
      indicator.className='v36-question-indicator';
      indicator.setAttribute('aria-hidden','true');
      root.prepend(indicator);
    }

    const tx=active.offsetLeft;
    const ty=active.offsetTop;
    const tw=active.offsetWidth;
    const th=active.offsetHeight;
    if(!tw||!th)return;

    const oldX=Number(indicator.dataset.x||tx);
    const oldY=Number(indicator.dataset.y||ty);
    const oldW=Number(indicator.dataset.w||tw);
    const oldH=Number(indicator.dataset.h||th);
    indicator.dataset.x=String(tx);
    indicator.dataset.y=String(ty);
    indicator.dataset.w=String(tw);
    indicator.dataset.h=String(th);
    indicator.style.width=tw+'px';
    indicator.style.height=th+'px';
    indicator.style.transform=`translate3d(${tx}px,${ty}px,0)`;
    root.classList.add('v36-liquid-ready');

    if(instant||reduced()||indicator.dataset.ready!=='true'){
      indicator.dataset.ready='true';
      return;
    }

    const dx=tx-oldX;
    const direction=Math.sign(dx||1);
    const overshoot=direction*clamp(Math.abs(dx)*.012,1.1,2.6);
    if(typeof indicator.animate==='function'){
      indicator.getAnimations().forEach(animation=>animation.cancel());
      indicator.animate([
        {transform:`translate3d(${oldX}px,${oldY}px,0) scaleX(${oldW/Math.max(1,tw)}) scaleY(${oldH/Math.max(1,th)})`},
        {offset:.80,transform:`translate3d(${tx+overshoot}px,${ty}px,0) scaleX(1.008) scaleY(.996)`},
        {transform:`translate3d(${tx}px,${ty}px,0) scaleX(1) scaleY(1)`}
      ],{duration:340,easing:'cubic-bezier(.2,.78,.2,1)'});
    }
    indicator.dataset.ready='true';
  }

  function ensureQuestionIndicator(instant=true){
    const root=$('.v32-question-segment:not(.v40-question-segment)');
    if(root)requestAnimationFrame(()=>syncQuestionIndicator(root,instant));
  }

  /* ------------------------------------------------------------------------
     Top navigation self-heal after scrolling stops. This only reads/writes
     once after scroll idle and avoids per-frame work.
     ------------------------------------------------------------------------ */
  function syncTopIndicator(){
    const nav=$('.nav-scroll');
    const indicator=$('.nav-v33-indicator',nav||document);
    const active=$('.nav-chip.is-active',nav||document);
    if(!nav||!indicator||!active)return;
    const w=active.offsetWidth,h=active.offsetHeight;
    if(!w||!h)return;
    indicator.style.width=w+'px';
    indicator.style.height=h+'px';
    indicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    nav.classList.add('v33-liquid-ready');
  }

  let navIdleTimer=0;
  function scheduleTopHeal(){
    clearTimeout(navIdleTimer);
    navIdleTimer=setTimeout(syncTopIndicator,120);
  }

  /* ------------------------------------------------------------------------
     Multi-select deletion. All work is triggered by opening/tab actions;
     there is deliberately no document-wide MutationObserver.
     ------------------------------------------------------------------------ */
  let bulkMode=false;
  const selected=new Set();

  function keyFor(card){return `${card?.dataset.libraryType||''}:${card?.dataset.libraryId||''}`;}
  function currentCards(){return $$('#collectionBody .collection-item');}
  function currentTab(){return $('.collection-tab.is-active')?.dataset.libraryTab||'all';}

  function updateVisibleFavoriteButton(type,id){
    const safe=window.CSS?.escape?CSS.escape(String(id)):String(id).replace(/["\\]/g,'\\$&');
    const selector=type==='video'?`[data-video-id="${safe}"] .skill-video-bookmark`:`.curated-card[data-curated-id="${safe}"] .curated-bookmark`;
    $$(selector).forEach(button=>{
      button.classList.remove('is-favorite');
      button.setAttribute('aria-pressed','false');
    });
  }

  function deleteLocal(type,id){
    if(type==='video'){
      writeArray(VIDEO_IDS_KEY,readArray(VIDEO_IDS_KEY).filter(value=>String(value)!==String(id)));
      const items=readObject(VIDEO_ITEMS_KEY);delete items[id];writeObject(VIDEO_ITEMS_KEY,items);
      updateVisibleFavoriteButton('video',id);
      return;
    }
    if(type==='article'){
      writeArray(ARTICLE_IDS_KEY,readArray(ARTICLE_IDS_KEY).filter(value=>String(value)!==String(id)));
      const items=readObject(ARTICLE_ITEMS_KEY);delete items[id];writeObject(ARTICLE_ITEMS_KEY,items);
      updateVisibleFavoriteButton('article',id);
      return;
    }
    if(type==='question'){
      writeArray(QUESTION_KEY,readArray(QUESTION_KEY).filter(item=>String(item?.id)!==String(id)));
      const deviceId=localStorage.getItem(DEVICE_KEY)||'';
      if(deviceId&&typeof window.apiRpc==='function')window.apiRpc('deleteQuestionHistory',{deviceId,id}).catch(()=>{});
    }
  }

  function refreshCounts(){
    const videoCount=readArray(VIDEO_IDS_KEY).length;
    const articleCount=readArray(ARTICLE_IDS_KEY).length;
    const questionCount=readArray(QUESTION_KEY).length;
    const total=videoCount+articleCount+questionCount;
    const badge=$('#collectionFabCount');
    if(badge){badge.textContent=String(total);badge.hidden=total===0;}
    const sv=$('#savedVideoCount');if(sv)sv.textContent=String(videoCount);
    const sa=$('#savedArticleCount');if(sa)sa.textContent=String(articleCount);
    const q=$('.v32-question-segment [data-v32-qmode="saved"] span');if(q)q.textContent=String(questionCount);
  }

  function enhanceCollectionCards(){
    const body=$('#collectionBody');
    if(!body)return;
    currentCards().forEach(card=>{
      const key=keyFor(card);
      if(!key||key===':')return;
      let box=$('.collection-selectbox',card);
      if(!box){
        box=document.createElement('button');
        box.type='button';
        box.className='collection-selectbox';
        box.setAttribute('aria-label','항목 선택');
        card.prepend(box);
      }
      const isSelected=selected.has(key);
      card.classList.toggle('is-selected',isSelected);
      box.setAttribute('aria-pressed',isSelected?'true':'false');
    });
    body.classList.toggle('is-bulk-selecting',bulkMode);
  }

  function syncBulkUi(){
    const body=$('#collectionBody');
    const toggle=$('.collection-select-toggle');
    const bar=$('.collection-bulkbar');
    if(body)body.classList.toggle('is-bulk-selecting',bulkMode);
    if(toggle){
      toggle.textContent=bulkMode?'완료':'선택';
      toggle.classList.toggle('is-active',bulkMode);
      toggle.hidden=currentTab()==='settings'||!currentCards().length;
    }
    if(bar){
      bar.hidden=!bulkMode;
      const count=$('.collection-bulkbar__count',bar);if(count)count.textContent=`${selected.size}개 선택`;
      const del=$('.collection-bulkbar__delete',bar);if(del)del.disabled=selected.size===0;
      const cards=currentCards().filter(card=>keyFor(card)!==':');
      const allSelected=cards.length>0&&cards.every(card=>selected.has(keyFor(card)));
      const all=$('.collection-bulkbar__all',bar);if(all)all.textContent=allSelected?'전체 해제':'전체 선택';
    }
  }

  function ensureBulkUi(){
    const sheet=$('#collectionSheet');
    const head=$('.collection-head',sheet||document);
    const body=$('#collectionBody');
    if(!sheet||!head||!body)return;

    let toggle=$('.collection-select-toggle',head);
    if(!toggle){
      toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='collection-select-toggle';
      toggle.textContent='선택';
      toggle.setAttribute('aria-label','여러 항목 선택');
      head.appendChild(toggle);
    }

    let bar=$('.collection-bulkbar',sheet);
    if(!bar){
      bar=document.createElement('div');
      bar.className='collection-bulkbar';
      bar.hidden=true;
      bar.innerHTML='<button type="button" class="collection-bulkbar__all">전체 선택</button><div class="collection-bulkbar__count">0개 선택</div><button type="button" class="collection-bulkbar__delete" disabled>삭제</button>';
      sheet.appendChild(bar);
    }

    enhanceCollectionCards();
    syncBulkUi();
  }

  function setBulkMode(next){
    bulkMode=Boolean(next)&&currentTab()!=='settings';
    if(!bulkMode)selected.clear();
    enhanceCollectionCards();
    syncBulkUi();
  }

  function toggleCard(card){
    if(!card)return;
    const key=keyFor(card);
    if(!key||key===':')return;
    if(selected.has(key))selected.delete(key);else selected.add(key);
    card.classList.toggle('is-selected',selected.has(key));
    $('.collection-selectbox',card)?.setAttribute('aria-pressed',selected.has(key)?'true':'false');
    syncBulkUi();
  }

  function toggleAllVisible(){
    const cards=currentCards().filter(card=>keyFor(card)!==':');
    const allSelected=cards.length>0&&cards.every(card=>selected.has(keyFor(card)));
    cards.forEach(card=>{
      const key=keyFor(card);
      if(allSelected)selected.delete(key);else selected.add(key);
    });
    enhanceCollectionCards();
    syncBulkUi();
  }

  function deleteSelected(){
    if(!selected.size)return;
    [...selected].forEach(key=>{
      const split=key.indexOf(':');
      const type=key.slice(0,split),id=key.slice(split+1);
      if(type&&id)deleteLocal(type,id);
    });
    selected.clear();
    bulkMode=false;
    refreshCounts();
    const active=$('.collection-tab.is-active');
    if(active)active.click();
    setTimeout(()=>{ensureBulkUi();syncBulkUi();ensureQuestionIndicator(true);},80);
  }

  function scheduleCollectionRefresh(delay=70){
    setTimeout(()=>{
      ensureBulkUi();
      ensureQuestionIndicator(true);
    },delay);
  }

  function installEvents(){
    document.addEventListener('click',event=>{
      const questionMode=event.target.closest?.('[data-v32-qmode]');
      if(questionMode){setTimeout(()=>ensureQuestionIndicator(false),0);}

      const topChip=event.target.closest?.('.nav-chip');
      if(topChip)setTimeout(syncTopIndicator,420);

      const collectionTab=event.target.closest?.('.collection-tab');
      if(collectionTab){
        if(bulkMode)setBulkMode(false);
        scheduleCollectionRefresh(90);
      }

      if(event.target.closest?.('#collectionFab'))scheduleCollectionRefresh(120);
      if(event.target.closest?.('#collectionClose,#collectionBackdrop'))setBulkMode(false);
      if(event.target.closest?.('#askSave'))scheduleCollectionRefresh(100);

      const toggle=event.target.closest?.('.collection-select-toggle');
      if(toggle){
        event.preventDefault();
        event.stopImmediatePropagation();
        setBulkMode(!bulkMode);
        return;
      }

      const all=event.target.closest?.('.collection-bulkbar__all');
      if(all){event.preventDefault();toggleAllVisible();return;}
      const del=event.target.closest?.('.collection-bulkbar__delete');
      if(del){event.preventDefault();deleteSelected();return;}

      const box=event.target.closest?.('.collection-selectbox');
      if(box){
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleCard(box.closest('.collection-item'));
        return;
      }

      const card=event.target.closest?.('.collection-item');
      if(bulkMode&&card){
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleCard(card);
      }
    },true);

    document.addEventListener('input',event=>{
      if(event.target?.matches?.('#collectionSearch'))requestAnimationFrame(()=>{enhanceCollectionCards();syncBulkUi();});
    },{passive:true});

    window.addEventListener('scroll',scheduleTopHeal,{passive:true});
    window.addEventListener('resize',()=>{scheduleTopHeal();ensureQuestionIndicator(true);},{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(()=>{syncTopIndicator();ensureQuestionIndicator(true);},180),{passive:true});
    window.addEventListener('photo-theme-change',()=>requestAnimationFrame(()=>{syncTopIndicator();ensureQuestionIndicator(true);}));
  }

  function init(){
    installEvents();
    setTimeout(()=>{
      syncTopIndicator();
      ensureBulkUi();
      ensureQuestionIndicator(true);
    },220);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.addEventListener('pageshow',()=>setTimeout(()=>{
    syncTopIndicator();
    ensureBulkUi();
    ensureQuestionIndicator(true);
  },160),{passive:true});
})();
