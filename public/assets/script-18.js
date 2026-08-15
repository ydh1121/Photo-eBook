/* v35: canonical liquid selectors, bulk collection deletion, and rail jitter guard. */
(function(){
  if(window.__photoV35Installed)return;
  window.__photoV35Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const liquidControllers=new WeakMap();

  const VIDEO_IDS_KEY='photoRoadmapVideoFavoritesV1';
  const VIDEO_ITEMS_KEY='photoRoadmapVideoFavoriteItemsV2';
  const ARTICLE_IDS_KEY='photoRoadmapCuratedFavoritesV1';
  const ARTICLE_ITEMS_KEY='photoRoadmapCuratedFavoriteItemsV2';
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const DEVICE_KEY='photoRoadmapDeviceKeyV1';

  function smooth(t){return t*t*(3-2*t);}
  function smoother(t){return t*t*t*(t*(t*6-15)+10);}

  function setupLiquidRail(rail,itemSelector){
    if(!rail)return;
    const existingController=liquidControllers.get(rail);
    if(existingController){existingController.update(true);return;}

    rail.querySelectorAll('.liquid-v35-indicator').forEach(node=>node.remove());
    const indicator=document.createElement('span');
    indicator.className='liquid-v35-indicator';
    indicator.setAttribute('aria-hidden','true');
    rail.prepend(indicator);

    const state={x:0,y:0,w:0,h:0,ready:false,raf:0,target:null};

    function active(){return $(itemSelector+'.is-active',rail)||$(itemSelector,rail);}
    function paint(x=state.x,y=state.y,w=state.w,h=state.h){
      state.x=x;state.y=y;state.w=w;state.h=h;
      indicator.style.width=`${Math.max(0,w)}px`;
      indicator.style.height=`${Math.max(0,h)}px`;
      indicator.style.transform=`translate3d(${x}px,${y}px,0)`;
    }
    function stop(){if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;}

    function moveTo(item,instant=false){
      if(!item||!item.isConnected)return;
      state.target=item;
      const tx=item.offsetLeft,ty=item.offsetTop,tw=item.offsetWidth,th=item.offsetHeight;
      if(!tw||!th)return;

      if(!state.ready||instant||reduced()){
        stop();
        paint(tx,ty,tw,th);
        state.ready=true;
        rail.classList.add('v35-liquid-ready');
        return;
      }

      stop();
      const from={x:state.x,y:state.y,w:state.w,h:state.h};
      const dx=tx-from.x;
      const distance=Math.abs(dx);
      const direction=Math.sign(dx||1);
      const overshoot=direction*clamp(distance*.022,1.5,5.0);
      const duration=clamp(250+distance*.13,270,410);
      const settleStart=.82;
      const started=performance.now();

      function tick(now){
        const t=clamp((now-started)/duration,0,1);
        let px;
        if(t<settleStart){
          const p=smoother(t/settleStart);
          px=from.x+((tx+overshoot)-from.x)*p;
        }else{
          const p=smooth((t-settleStart)/(1-settleStart));
          px=(tx+overshoot)+(tx-(tx+overshoot))*p;
        }
        const e=smoother(t);
        const py=from.y+(ty-from.y)*e;
        const pw=from.w+(tw-from.w)*e;
        const ph=from.h+(th-from.h)*e;
        paint(px,py,pw,ph);
        if(t>=1){paint(tx,ty,tw,th);state.raf=0;return;}
        state.raf=requestAnimationFrame(tick);
      }
      state.raf=requestAnimationFrame(tick);
    }

    function update(instant=false){const item=active();if(item)moveTo(item,instant);}

    const classObserver=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&record.attributeName==='class'))requestAnimationFrame(()=>update(false));
    });
    classObserver.observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});

    const resizeObserver=new ResizeObserver(()=>requestAnimationFrame(()=>update(!state.ready)));
    resizeObserver.observe(rail);

    const controller={update,disconnect(){stop();classObserver.disconnect();resizeObserver.disconnect();}};
    liquidControllers.set(rail,controller);
    requestAnimationFrame(()=>update(true));
  }

  function installLiquidRails(){
    const nav=$('.nav-scroll');
    if(nav)setupLiquidRail(nav,'.nav-chip');
    const tabs=$('.collection-tabs');
    if(tabs)setupLiquidRail(tabs,'.collection-tab');
    $$('.theme-choice').forEach(root=>setupLiquidRail(root,'button'));
    $$('.v32-question-segment').forEach(root=>setupLiquidRail(root,'button'));
  }

  let liquidScanRaf=0;
  function scheduleLiquidScan(){
    if(liquidScanRaf)return;
    liquidScanRaf=requestAnimationFrame(()=>{liquidScanRaf=0;installLiquidRails();});
  }

  function readArray(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}
  }
  function readObject(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
  }
  function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function writeObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}

  let bulkMode=false;
  const selected=new Set();

  function keyFor(card){return `${card?.dataset.libraryType||''}:${card?.dataset.libraryId||''}`;}
  function currentCards(){return $$('.collection-body .collection-item');}
  function currentTab(){return $('.collection-tab.is-active')?.dataset.libraryTab||'all';}

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
      toggle.addEventListener('click',()=>setBulkMode(!bulkMode));
    }

    let bar=$('.collection-bulkbar',sheet);
    if(!bar){
      bar=document.createElement('div');
      bar.className='collection-bulkbar';
      bar.hidden=true;
      bar.innerHTML='<button type="button" class="collection-bulkbar__all">전체 선택</button><div class="collection-bulkbar__count">0개 선택</div><button type="button" class="collection-bulkbar__delete" disabled>삭제</button>';
      sheet.appendChild(bar);
      $('.collection-bulkbar__all',bar).addEventListener('click',toggleAllVisible);
      $('.collection-bulkbar__delete',bar).addEventListener('click',deleteSelected);
    }

    toggle.hidden=currentTab()==='settings'||!currentCards().length;
    enhanceCollectionCards();
    syncBulkUi();
  }

  function setBulkMode(next){
    bulkMode=Boolean(next)&&currentTab()!=='settings';
    if(!bulkMode)selected.clear();
    enhanceCollectionCards();
    syncBulkUi();
  }

  function enhanceCollectionCards(){
    const body=$('#collectionBody');
    if(!body)return;
    currentCards().forEach(card=>{
      let box=$('.collection-selectbox',card);
      if(!box){
        box=document.createElement('button');
        box.type='button';
        box.className='collection-selectbox';
        box.setAttribute('aria-label','항목 선택');
        card.prepend(box);
      }
      const key=keyFor(card);
      card.classList.toggle('is-selected',selected.has(key));
      box.setAttribute('aria-pressed',selected.has(key)?'true':'false');
    });
    body.classList.toggle('is-bulk-selecting',bulkMode);
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
    const cards=currentCards();
    const allSelected=cards.length&&cards.every(card=>selected.has(keyFor(card)));
    cards.forEach(card=>{
      const key=keyFor(card);
      if(allSelected)selected.delete(key);else selected.add(key);
    });
    enhanceCollectionCards();
    syncBulkUi();
  }

  function updateVisibleFavoriteButton(type,id){
    const selector=type==='video'?`[data-video-id="${CSS.escape(id)}"] .skill-video-bookmark`:`.curated-card[data-curated-id="${CSS.escape(id)}"] .curated-bookmark`;
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

  function rerenderCollection(){
    refreshCounts();
    const search=$('#collectionSearch');
    if(search){search.dispatchEvent(new Event('input',{bubbles:true}));return;}
    $('.collection-tab.is-active')?.click();
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
    rerenderCollection();
    requestAnimationFrame(()=>{ensureBulkUi();syncBulkUi();});
  }

  function syncBulkUi(){
    const body=$('#collectionBody');
    const toggle=$('.collection-select-toggle');
    const bar=$('.collection-bulkbar');
    if(body)body.classList.toggle('is-bulk-selecting',bulkMode);
    if(toggle){toggle.textContent=bulkMode?'완료':'선택';toggle.classList.toggle('is-active',bulkMode);}
    if(bar){
      bar.hidden=!bulkMode;
      const count=$('.collection-bulkbar__count',bar);if(count)count.textContent=`${selected.size}개 선택`;
      const del=$('.collection-bulkbar__delete',bar);if(del)del.disabled=selected.size===0;
      const cards=currentCards();
      const allSelected=cards.length&&cards.every(card=>selected.has(keyFor(card)));
      const all=$('.collection-bulkbar__all',bar);if(all)all.textContent=allSelected?'전체 해제':'전체 선택';
    }
  }

  function installBulkEvents(){
    if(document.documentElement.dataset.v35BulkEvents==='true')return;
    document.documentElement.dataset.v35BulkEvents='true';

    document.addEventListener('click',event=>{
      const tab=event.target.closest?.('.collection-tab');
      if(tab&&bulkMode){setBulkMode(false);setTimeout(ensureBulkUi,0);return;}
      if(event.target.closest?.('#collectionClose,#collectionBackdrop')){setBulkMode(false);return;}

      const box=event.target.closest?.('.collection-selectbox');
      if(box){event.preventDefault();event.stopImmediatePropagation();toggleCard(box.closest('.collection-item'));return;}

      const card=event.target.closest?.('.collection-item');
      if(bulkMode&&card){
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleCard(card);
      }
    },true);
  }

  function installRailJitterGuard(){
    if(document.documentElement.dataset.v35RailGuard==='true')return;
    document.documentElement.dataset.v35RailGuard='true';
    let state=null;
    const railSelector='main .chapter .scroll-row,main .chapter .skills-infinite-row,main .chapter .curated-links-row,main .chapter [class*="-rail"],main .chapter [class*="-carousel"]';

    document.addEventListener('touchstart',event=>{
      const rail=event.target.closest?.(railSelector);
      const touch=event.touches?.[0];
      if(!rail||!touch)return;
      state={rail,x:touch.clientX,y:touch.clientY,left:rail.scrollLeft,intent:''};
    },{passive:true});

    document.addEventListener('touchmove',event=>{
      if(!state||!event.touches?.[0])return;
      const touch=event.touches[0];
      const dx=touch.clientX-state.x,dy=touch.clientY-state.y;
      if(!state.intent&&Math.max(Math.abs(dx),Math.abs(dy))>8){
        state.intent=Math.abs(dy)>Math.abs(dx)*1.12?'vertical':'horizontal';
        state.rail.classList.toggle('v35-vertical-gesture',state.intent==='vertical');
      }
      if(state.intent==='vertical'&&Math.abs(state.rail.scrollLeft-state.left)>.5)state.rail.scrollLeft=state.left;
    },{passive:true});

    const clear=()=>{
      if(state?.rail)state.rail.classList.remove('v35-vertical-gesture');
      state=null;
    };
    document.addEventListener('touchend',clear,{passive:true});
    document.addEventListener('touchcancel',clear,{passive:true});
  }

  function installObservers(){
    const observer=new MutationObserver(()=>{
      scheduleLiquidScan();
      ensureBulkUi();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  function init(){
    installBulkEvents();
    installRailJitterGuard();
    installLiquidRails();
    ensureBulkUi();
    installObservers();
    window.addEventListener('resize',scheduleLiquidScan,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(scheduleLiquidScan,220),{passive:true});
    window.addEventListener('photo-theme-change',()=>requestAnimationFrame(scheduleLiquidScan));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(()=>{installLiquidRails();ensureBulkUi();},120),{passive:true});
})();
