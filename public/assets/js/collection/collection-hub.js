/* v27: stable skill media, classified endless video rail and unified saved-items hub. */
(function(){
  const VIDEO_IDS_KEY='photoRoadmapVideoFavoritesV1';
  const VIDEO_ITEMS_KEY='photoRoadmapVideoFavoriteItemsV2';
  const ARTICLE_IDS_KEY='photoRoadmapCuratedFavoritesV1';
  const ARTICLE_ITEMS_KEY='photoRoadmapCuratedFavoriteItemsV2';
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const DEVICE_KEY='photoRoadmapDeviceKeyV1';

  const videoCache=new Map();
  let skillCursor=0;
  let skillLoading=false;
  let libraryTab='all';
  let libraryFilter='all';
  let librarySearch='';
  let lockedY=0;
  let libraryLocked=false;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const attr=esc;

  function readArray(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}
  }
  function readObject(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
  }
  function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function writeObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function idSet(key){return new Set(readArray(key).map(String));}
  function nowIso(){return new Date().toISOString();}

  function safeImage(value,fallback=''){
    const src=String(value||'').trim();
    if(src.startsWith('blob:')||/^https?:\/\//i.test(src)||src.startsWith('/'))return src;
    return fallback;
  }

  function fallbackSkillImage(category='상업사진 실무'){
    if(/제품/.test(category))return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=86';
    if(/인물/.test(category))return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=86';
    if(/공간/.test(category))return 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=86';
    if(/음식/.test(category))return 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=86';
    return 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=86';
  }

  function classifySkill(title=''){
    const text=String(title||'');
    if(/인물|피부|Dodge|Burn|Liquify/.test(text))return {category:'인물 리터칭',query:'인물 사진 리터칭 포토샵 피부 보정'};
    if(/제품|누끼|스크래치|패키지/.test(text))return {category:'제품 리터칭',query:'제품 사진 포토샵 누끼 리터칭'};
    if(/공간|인테리어|건축/.test(text))return {category:'공간 보정',query:'인테리어 공간 사진 보정 라이트룸'};
    if(/RAW|셀렉|납품|고객/.test(text))return {category:'셀렉 / 납품',query:'상업사진 셀렉 납품 워크플로우'};
    if(/라이트룸|색보정|컬러/.test(text))return {category:'색보정',query:'라이트룸 컬러 보정 사진'};
    return {category:'상업사진 실무',query:'상업사진 포토샵 리터칭'};
  }

  function normalizeVideo(item,category='',query=''){
    const result={...(item||{})};
    result.id=String(result.id||result.url||`video-${Math.random().toString(36).slice(2)}`);
    result.category=result.category||category||'상업사진 실무';
    result.query=result.query||query||'';
    result.savedAt=result.savedAt||'';
    if(result.id)videoCache.set(result.id,result);
    return result;
  }

  async function fetchJson(url,timeout=7800){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await fetch(url,{cache:'no-store',signal:controller.signal});
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json?.ok===false)throw new Error(json?.message||'요청 실패');
      return json;
    }finally{clearTimeout(timer);}
  }

  function bookmarkSvg(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8v15.6l-5-3.1-5 3.1V4.8Z"/></svg>';
  }

  function videoMarkup(item,{mini=false,fallbackImage=''}={}){
    const normalized=normalizeVideo(item,item?.category,item?.query);
    const favorites=idSet(VIDEO_IDS_KEY);
    const favorite=favorites.has(normalized.id);
    const image=safeImage(normalized.thumbnail,fallbackImage||fallbackSkillImage(normalized.category));
    const meta=[normalized.channel,normalized.views,normalized.duration].filter(Boolean).join(' / ')||'YouTube';
    const fallback=Boolean(normalized.isSearchFallback);
    return `<article class="skill-video-card ${mini?'skill-video-card--mini skill-video-card--matched':'skill-video-card--discover'}" data-video-id="${attr(normalized.id)}" data-video-category="${attr(normalized.category)}" data-video-url="${attr(normalized.url||'')}" data-video-title="${attr(normalized.title||'')}" data-video-image="${attr(image)}">
      <a class="skill-video-card__visual" href="${attr(normalized.url||'#')}" target="_blank" rel="noopener">
        <img src="${attr(image)}" alt="${attr(normalized.title||'관련 영상')}" loading="lazy">
        <span class="skill-video-category">${esc(normalized.category)}</span>
        <span class="skill-video-card__play" aria-hidden="true">▶</span>
        ${normalized.duration?`<span class="skill-video-card__duration">${esc(normalized.duration)}</span>`:''}
      </a>
      <div class="skill-video-card__copy">
        <div class="skill-video-card__source">${esc(fallback?'관련 영상 검색':meta)}</div>
        <a href="${attr(normalized.url||'#')}" target="_blank" rel="noopener"><strong>${esc(normalized.title||`${normalized.category} 영상 보기`)}</strong></a>
      </div>
      <button class="skill-video-bookmark ${favorite?'is-favorite':''}" type="button" aria-label="영상 저장" aria-pressed="${favorite?'true':'false'}">${bookmarkSvg()}</button>
    </article>`;
  }

  function fallbackVideo(query,category,image){
    return normalizeVideo({
      id:`search-${encodeURIComponent(category+'-'+query).slice(0,90)}`,
      title:`${category} 영상 더 찾아보기`,
      channel:'YouTube 검색',
      thumbnail:image,
      url:`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      category,query,isSearchFallback:true
    },category,query);
  }

  function cleanAndPrepareSkillRail(){
    const current=$('#skillsInfiniteRow');
    if(!current)return null;
    if(current.dataset.v27Clean==='true')return current;

    const row=current.cloneNode(true);
    row.dataset.v27Clean='true';
    row.querySelectorAll('.skills-more-sentinel').forEach(node=>node.remove());
    [...row.children].forEach(child=>{
      if(child.classList.contains('skill-video-card'))child.remove();
    });

    $$('.skill-card--media',row).forEach(card=>{
      const title=$('h3',card)?.textContent||'';
      const {category,query}=classifySkill(title);
      card.dataset.skillCategory=category;
      card.dataset.skillQuery=query;
      const visual=$('.skill-card__visual img',card);
      if(visual&&!safeImage(visual.src))visual.src=fallbackSkillImage(category);
      const slot=$('.skill-card__video-slot',card);
      if(slot){
        slot.innerHTML=`<div class="skill-video-slot-head"><span>추천 영상</span><small>${esc(category)}</small></div><div class="skill-video-slot-body"><span class="video-slot-loading">관련 영상을 확인하는 중</span></div>`;
      }
    });

    const sentinel=document.createElement('div');
    sentinel.className='skills-more-sentinel';
    sentinel.setAttribute('aria-hidden','true');
    row.appendChild(sentinel);
    current.replaceWith(row);
    return row;
  }

  async function hydrateSkillCard(card,index){
    const body=$('.skill-video-slot-body',card);
    if(!body||body.dataset.loaded==='true')return;
    body.dataset.loaded='true';
    const category=card.dataset.skillCategory||'상업사진 실무';
    const query=card.dataset.skillQuery||'상업사진 실무';
    const visual=$('.skill-card__visual img',card);
    const fallbackImage=safeImage(visual?.src,fallbackSkillImage(category));
    try{
      const json=await fetchJson(`/api/videos?q=${encodeURIComponent(query)}&cursor=${index}`);
      const raw=(json.items||[]).find(item=>item?.url&&!item?.isSearchFallback)||(json.items||[]).find(item=>item?.url);
      const item=raw?normalizeVideo({...raw,category:raw.category||category,query},category,query):fallbackVideo(query,category,fallbackImage);
      body.innerHTML=videoMarkup(item,{mini:true,fallbackImage});
    }catch{
      body.innerHTML=videoMarkup(fallbackVideo(query,category,fallbackImage),{mini:true,fallbackImage});
    }
  }

  async function hydrateSkillCards(row){
    const cards=$$('.skill-card--media',row);
    let cursor=0;
    const workers=Array.from({length:Math.min(2,Math.max(1,cards.length))},async()=>{
      while(cursor<cards.length){
        const index=cursor++;
        await hydrateSkillCard(cards[index],index);
      }
    });
    await Promise.all(workers);
  }

  async function appendSkillVideos(row){
    if(!row||skillLoading)return;
    skillLoading=true;
    const sentinel=$('.skills-more-sentinel',row);
    sentinel?.classList.add('is-loading');
    try{
      let appended=0;
      for(let attempt=0;attempt<3&&appended<4;attempt++){
        const json=await fetchJson(`/api/videos?cursor=${skillCursor}`);
        skillCursor=Number(json.nextCursor)||skillCursor+1;
        const category=json.category||'상업사진 실무';
        const query=json.query||'';
        for(const raw of json.items||[]){
          const item=normalizeVideo({...raw,category:raw.category||category,query:raw.query||query},category,query);
          if(row.querySelector(`[data-video-id="${CSS.escape(item.id)}"]`))continue;
          sentinel?.insertAdjacentHTML('beforebegin',videoMarkup(item));
          appended++;
          if(appended>=6)break;
        }
      }
    }catch{}
    finally{
      sentinel?.classList.remove('is-loading');
      skillLoading=false;
    }
  }

  function setupSkillRail(){
    const row=cleanAndPrepareSkillRail();
    if(!row||row.dataset.v27Bound==='true')return;
    row.dataset.v27Bound='true';
    hydrateSkillCards(row);

    let raf=0;
    const nearEnd=()=>{
      raf=0;
      const remaining=row.scrollWidth-row.clientWidth-row.scrollLeft;
      if(remaining<Math.max(720,row.clientWidth*1.6))appendSkillVideos(row);
    };
    row.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(nearEnd);},{passive:true});

    const sentinel=$('.skills-more-sentinel',row);
    if('IntersectionObserver'in window&&sentinel){
      const observer=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting))appendSkillVideos(row);
      },{root:row,rootMargin:'0px 900px 0px 0px',threshold:0.01});
      observer.observe(sentinel);
    }
    appendSkillVideos(row);
  }

  function videoItemFromCard(card){
    const id=String(card?.dataset.videoId||'');
    const cached=videoCache.get(id);
    if(cached)return {...cached};
    return normalizeVideo({
      id,
      title:card?.dataset.videoTitle||$('strong',card)?.textContent||'저장한 영상',
      url:card?.dataset.videoUrl||$('a',card)?.href||'',
      thumbnail:card?.dataset.videoImage||$('img',card)?.src||'',
      category:card?.dataset.videoCategory||$('.skill-video-category',card)?.textContent||'상업사진 실무',
      channel:$('.skill-video-card__source',card)?.textContent||'YouTube'
    });
  }

  function articleItemFromCard(card){
    const id=String(card?.dataset.curatedId||'');
    const visual=$('.curated-card__visual img',card);
    return {
      id,
      title:$('h3',card)?.textContent||'저장한 글',
      og_title:$('h3',card)?.textContent||'저장한 글',
      url:$('.curated-open',card)?.href||$('a',card)?.href||'',
      thumbnail_url:visual?.src||'',
      platform:$('.curated-platform',card)?.textContent||$('.curated-meta strong',card)?.textContent||'읽을거리',
      summary:$('.curated-card__body p',card)?.textContent||'',
      savedAt:''
    };
  }

  function setFavorite(type,item,nextState){
    const idsKey=type==='video'?VIDEO_IDS_KEY:ARTICLE_IDS_KEY;
    const itemsKey=type==='video'?VIDEO_ITEMS_KEY:ARTICLE_ITEMS_KEY;
    const set=idSet(idsKey);
    const items=readObject(itemsKey);
    const id=String(item?.id||'');
    if(!id)return;
    if(nextState){
      set.add(id);
      items[id]={...item,savedAt:item.savedAt||nowIso()};
    }else{
      set.delete(id);
      delete items[id];
    }
    writeArray(idsKey,[...set]);
    writeObject(itemsKey,items);
    syncFavoriteButtons(type,id,nextState);
    updateLibraryCounts();
    renderLibrary();
  }

  function syncFavoriteButtons(type,id,active){
    const selector=type==='video'?`[data-video-id="${CSS.escape(id)}"] .skill-video-bookmark`:`.curated-card[data-curated-id="${CSS.escape(id)}"] .curated-bookmark`;
    $$(selector).forEach(button=>{
      button.classList.toggle('is-favorite',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    if(type==='article'){
      $$(`.curated-card[data-curated-id="${CSS.escape(id)}"]`).forEach(card=>card.dataset.favorite=active?'true':'false');
    }
  }

  function bindFavoriteDelegation(){
    if(document.documentElement.dataset.v27FavoriteDelegated==='true')return;
    document.documentElement.dataset.v27FavoriteDelegated='true';
    document.addEventListener('click',event=>{
      const videoButton=event.target.closest('.skill-video-bookmark');
      const articleButton=event.target.closest('.curated-bookmark');
      if(!videoButton&&!articleButton)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(videoButton){
        const card=videoButton.closest('[data-video-id]');
        const item=videoItemFromCard(card);
        const next=!idSet(VIDEO_IDS_KEY).has(item.id);
        setFavorite('video',item,next);
      }else{
        const card=articleButton.closest('.curated-card');
        const item=articleItemFromCard(card);
        const next=!idSet(ARTICLE_IDS_KEY).has(item.id);
        setFavorite('article',item,next);
      }
    },true);
  }

  function migrateVisibleFavorites(){
    const videoItems=readObject(VIDEO_ITEMS_KEY);
    idSet(VIDEO_IDS_KEY).forEach(id=>{
      if(videoItems[id])return;
      const card=$(`[data-video-id="${CSS.escape(id)}"]`);
      if(card)videoItems[id]={...videoItemFromCard(card),savedAt:nowIso()};
    });
    writeObject(VIDEO_ITEMS_KEY,videoItems);

    const articleItems=readObject(ARTICLE_ITEMS_KEY);
    idSet(ARTICLE_IDS_KEY).forEach(id=>{
      if(articleItems[id])return;
      const card=$(`.curated-card[data-curated-id="${CSS.escape(id)}"]`);
      if(card)articleItems[id]={...articleItemFromCard(card),savedAt:nowIso()};
    });
    writeObject(ARTICLE_ITEMS_KEY,articleItems);
  }

  function questions(){
    return readArray(QUESTION_KEY).map(item=>({...item,type:'question'}));
  }

  function allSavedItems(){
    const videos=Object.values(readObject(VIDEO_ITEMS_KEY)).map(item=>({...item,type:'video'}));
    const articles=Object.values(readObject(ARTICLE_ITEMS_KEY)).map(item=>({...item,type:'article'}));
    const qs=questions();
    return [...videos,...articles,...qs].sort((a,b)=>String(b.savedAt||b.created_at||'').localeCompare(String(a.savedAt||a.created_at||'')));
  }

  function collectionIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 4.2h9.4c1.2 0 2.1.9 2.1 2.1v11.4c0 1.2-.9 2.1-2.1 2.1H7.3c-1.2 0-2.1-.9-2.1-2.1V6.3c0-1.2.9-2.1 2.1-2.1Z"/><path d="M9 4.2V2.8h6v1.4M9.1 8.2h5.8M9.1 11.7h5.8M9.1 15.2h3.8"/></svg>';
  }

  function ensureLibraryUi(){
    if($('#collectionLayer'))return;
    const layer=document.createElement('div');
    layer.id='collectionLayer';
    layer.innerHTML=`
      <button id="collectionFab" class="collection-fab" type="button" aria-label="내 모음 열기">${collectionIcon()}<span id="collectionFabCount" class="collection-fab__count" hidden>0</span></button>
      <div id="collectionBackdrop" class="collection-backdrop" hidden></div>
      <section id="collectionSheet" class="collection-sheet" hidden aria-label="내 모음">
        <div class="collection-handle-wrap"><div class="collection-handle"></div></div>
        <div class="collection-head"><div><small>저장한 항목과 질문을 한곳에서</small><h2>내 모음</h2></div><button id="collectionClose" class="collection-close" type="button" aria-label="닫기">×</button></div>
        <div class="collection-tabs" role="tablist">
          <button class="collection-tab is-active" data-library-tab="all" type="button">전체</button>
          <button class="collection-tab" data-library-tab="video" type="button">영상</button>
          <button class="collection-tab" data-library-tab="article" type="button">읽을거리</button>
          <button class="collection-tab" data-library-tab="question" type="button">질문</button>
          <button class="collection-tab" data-library-tab="settings" type="button" aria-label="설정">설정</button>
        </div>
        <div class="collection-tools" id="collectionTools"><label class="collection-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input id="collectionSearch" type="search" placeholder="저장한 항목 검색" autocomplete="off"></label><div id="collectionFilters" class="collection-filters"></div></div>
        <div id="collectionBody" class="collection-body"></div>
      </section>`;
    document.body.appendChild(layer);

    $('#collectionFab').addEventListener('click',()=>openLibrary('all'));
    $('#collectionClose').addEventListener('click',closeLibrary);
    $('#collectionBackdrop').addEventListener('click',closeLibrary);
    $('#collectionBackdrop').addEventListener('touchmove',event=>event.preventDefault(),{passive:false});
    $$('.collection-tab').forEach(button=>button.addEventListener('click',()=>{
      libraryTab=button.dataset.libraryTab||'all';
      libraryFilter='all';
      $$('.collection-tab').forEach(tab=>tab.classList.toggle('is-active',tab===button));
      renderLibrary();
    }));
    $('#collectionSearch').addEventListener('input',event=>{librarySearch=event.target.value||'';renderLibrary();});
    bindLibraryDrag();
    updateLibraryCounts();
  }

  function lockLibraryScroll(){
    if(libraryLocked)return;
    libraryLocked=true;
    lockedY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    document.documentElement.classList.add('collection-open');
    document.body.classList.add('collection-open');
    document.body.style.top=`-${lockedY}px`;
  }
  function unlockLibraryScroll(){
    if(!libraryLocked)return;
    libraryLocked=false;
    document.documentElement.classList.remove('collection-open');
    document.body.classList.remove('collection-open');
    document.body.style.top='';
    window.scrollTo(0,lockedY);
  }

  function openLibrary(tab='all'){
    ensureLibraryUi();
    libraryTab=tab;
    libraryFilter='all';
    $$('.collection-tab').forEach(button=>button.classList.toggle('is-active',button.dataset.libraryTab===tab));
    const sheet=$('#collectionSheet');
    const backdrop=$('#collectionBackdrop');
    sheet.hidden=false;backdrop.hidden=false;
    requestAnimationFrame(()=>sheet.classList.add('is-open'));
    lockLibraryScroll();
    renderLibrary();
  }
  function closeLibrary(){
    const sheet=$('#collectionSheet');
    const backdrop=$('#collectionBackdrop');
    if(!sheet)return;
    sheet.classList.remove('is-open');
    setTimeout(()=>{sheet.hidden=true;backdrop.hidden=true;unlockLibraryScroll();},190);
  }

  function bindLibraryDrag(){
    const sheet=$('#collectionSheet');
    const handle=$('.collection-handle-wrap',sheet);
    if(!sheet||!handle)return;
    let start=0,delta=0,dragging=false;
    const begin=y=>{dragging=true;start=y;delta=0;sheet.classList.add('is-dragging');};
    const move=y=>{if(!dragging)return;delta=Math.max(0,y-start);sheet.style.setProperty('--drag-y',`${delta}px`);};
    const end=()=>{
      if(!dragging)return;
      dragging=false;sheet.classList.remove('is-dragging');sheet.style.removeProperty('--drag-y');
      if(delta>86)closeLibrary();
    };
    handle.addEventListener('touchstart',e=>begin(e.touches[0].clientY),{passive:true});
    handle.addEventListener('touchmove',e=>{move(e.touches[0].clientY);if(delta>0)e.preventDefault();},{passive:false});
    handle.addEventListener('touchend',end,{passive:true});
    handle.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;begin(e.clientY);handle.setPointerCapture?.(e.pointerId);});
    handle.addEventListener('pointermove',e=>{if(dragging)move(e.clientY);});
    handle.addEventListener('pointerup',end);
  }

  function typeLabel(type){return type==='video'?'영상':type==='article'?'읽을거리':'질문';}
  function itemTitle(item){return item.type==='question'?(item.question||'저장한 질문'):(item.title||item.og_title||'저장한 항목');}
  function itemMeta(item){
    if(item.type==='video')return item.category||item.channel||'영상';
    if(item.type==='article')return item.platform||'읽을거리';
    return String(item.created_at||'');
  }
  function itemImage(item){
    if(item.type==='video')return safeImage(item.thumbnail,fallbackSkillImage(item.category));
    if(item.type==='article')return safeImage(item.thumbnail_url,fallbackSkillImage('읽을거리'));
    return '';
  }

  function filterOptions(items){
    if(libraryTab==='video')return ['all',...new Set(items.filter(i=>i.type==='video').map(i=>i.category||'기타'))];
    if(libraryTab==='article')return ['all',...new Set(items.filter(i=>i.type==='article').map(i=>i.platform||'기타'))];
    return [];
  }

  function renderFilters(items){
    const root=$('#collectionFilters');
    if(!root)return;
    const options=filterOptions(items);
    if(!options.length){root.innerHTML='';root.hidden=true;return;}
    root.hidden=false;
    root.innerHTML=options.map(value=>`<button type="button" data-library-filter="${attr(value)}" class="collection-filter ${libraryFilter===value?'is-active':''}">${esc(value==='all'?'전체':value)}</button>`).join('');
    $$('.collection-filter',root).forEach(button=>button.addEventListener('click',()=>{libraryFilter=button.dataset.libraryFilter||'all';renderLibrary();}));
  }

  function renderLibrary(){
    const body=$('#collectionBody');
    const tools=$('#collectionTools');
    if(!body)return;
    const all=allSavedItems();
    renderFilters(all);
    if(tools)tools.hidden=libraryTab==='settings';

    if(libraryTab==='settings'){
      const videoCount=all.filter(i=>i.type==='video').length;
      const articleCount=all.filter(i=>i.type==='article').length;
      const questionCount=all.filter(i=>i.type==='question').length;
      body.innerHTML=`<div class="collection-settings">
        <div class="collection-settings__summary"><strong>${videoCount+articleCount+questionCount}</strong><span>저장한 항목</span><div><b>${videoCount}</b> 영상</div><div><b>${articleCount}</b> 읽을거리</div><div><b>${questionCount}</b> 질문</div></div>
        <button class="collection-setting-row" id="collectionDeviceLink" type="button"><span><strong>다른 기기에서 이어보기</strong><small>저장한 질문을 다른 기기에서도 확인할 수 있게 연결합니다.</small></span><b>›</b></button>
        <div class="collection-setting-note">영상과 읽을거리는 이 기기의 내 모음에서 바로 관리할 수 있습니다.</div>
      </div>`;
      $('#collectionDeviceLink')?.addEventListener('click',openQuestionSettings);
      return;
    }

    let items=all.filter(item=>libraryTab==='all'||item.type===libraryTab);
    if(libraryFilter!=='all')items=items.filter(item=>(item.category||item.platform||'기타')===libraryFilter);
    const needle=librarySearch.trim().toLowerCase();
    if(needle)items=items.filter(item=>`${itemTitle(item)} ${itemMeta(item)} ${item.summary||''} ${item.selected_text||''}`.toLowerCase().includes(needle));

    if(!items.length){
      body.innerHTML=`<div class="collection-empty"><div class="collection-empty__icon">${collectionIcon()}</div><strong>${needle?'검색 결과가 없습니다.':'아직 저장한 항목이 없습니다.'}</strong><p>${libraryTab==='video'?'실무 영상의 북마크 버튼을 누르면 여기에 모입니다.':libraryTab==='article'?'읽어볼 글의 북마크 버튼을 누르면 여기에 모입니다.':libraryTab==='question'?'본문에서 문장을 선택한 뒤 질문을 저장하면 여기에 표시됩니다.':'관심 있는 영상과 글, 질문을 저장해 두면 여기서 한 번에 찾을 수 있습니다.'}</p></div>`;
      return;
    }

    body.innerHTML=`<div class="collection-list">${items.map(item=>{
      const title=itemTitle(item),meta=itemMeta(item),image=itemImage(item);
      const id=item.id||'';
      if(item.type==='question')return `<article class="collection-item collection-item--question" data-library-type="question" data-library-id="${attr(id)}"><div class="collection-item__question-icon">Q</div><button class="collection-item__main collection-question-open" type="button"><span class="collection-item__type">질문</span><strong>${esc(title)}</strong><p>${esc(item.selected_text||'')}</p><small>${esc(meta)}</small></button><button class="collection-item__remove" type="button" aria-label="질문 삭제">×</button></article>`;
      return `<article class="collection-item" data-library-type="${attr(item.type)}" data-library-id="${attr(id)}"><a class="collection-item__thumb" href="${attr(item.url||'#')}" target="_blank" rel="noopener"><img src="${attr(image)}" alt="" loading="lazy"></a><a class="collection-item__main" href="${attr(item.url||'#')}" target="_blank" rel="noopener"><span class="collection-item__type">${esc(typeLabel(item.type))} / ${esc(meta)}</span><strong>${esc(title)}</strong><p>${esc(item.description||item.summary||'')}</p></a><button class="collection-item__remove" type="button" aria-label="저장 해제">×</button></article>`;
    }).join('')}</div>`;

    $$('.collection-item__remove',body).forEach(button=>button.addEventListener('click',()=>{
      const card=button.closest('.collection-item');
      removeLibraryItem(card?.dataset.libraryType||'',card?.dataset.libraryId||'');
    }));
    $$('.collection-question-open',body).forEach(button=>button.addEventListener('click',()=>openSavedQuestion(button.closest('.collection-item')?.dataset.libraryId||'')));
  }

  function removeLibraryItem(type,id){
    if(type==='video'){
      const item=readObject(VIDEO_ITEMS_KEY)[id]||{id};
      setFavorite('video',item,false);
      return;
    }
    if(type==='article'){
      const item=readObject(ARTICLE_ITEMS_KEY)[id]||{id};
      setFavorite('article',item,false);
      return;
    }
    if(type==='question'){
      writeArray(QUESTION_KEY,readArray(QUESTION_KEY).filter(item=>String(item.id)!==String(id)));
      const deviceId=localStorage.getItem(DEVICE_KEY)||'';
      if(typeof window.apiRpc==='function'&&deviceId)window.apiRpc('deleteQuestionHistory',{deviceId,id}).catch(()=>{});
      updateLibraryCounts();
      renderLibrary();
    }
  }

  function openSavedQuestion(id){
    closeLibrary();
    setTimeout(()=>{
      $('#askFab')?.click();
      setTimeout(()=>{
        const target=$(`.history-item[data-history-id="${CSS.escape(id)}"] .history-open`);
        target?.click();
      },160);
    },210);
  }

  function openQuestionSettings(){
    closeLibrary();
    setTimeout(()=>{
      $('#askFab')?.click();
      setTimeout(()=>{
        $('#askHistoryTab')?.click();
        setTimeout(()=>$('.ask-settings-btn')?.click(),70);
      },130);
    },210);
  }

  function updateLibraryCounts(){
    const total=idSet(VIDEO_IDS_KEY).size+idSet(ARTICLE_IDS_KEY).size+readArray(QUESTION_KEY).length;
    const badge=$('#collectionFabCount');
    if(badge){badge.textContent=String(total);badge.hidden=total===0;}
    const videoCount=$('#savedVideoCount');if(videoCount)videoCount.textContent=String(idSet(VIDEO_IDS_KEY).size);
    const articleCount=$('#savedArticleCount');if(articleCount)articleCount.textContent=String(idSet(ARTICLE_IDS_KEY).size);
  }

  function injectSectionLinks(){
    const skillsHead=$('#skills .section-heading');
    if(skillsHead&&!$('#savedVideoShortcut',skillsHead)){
      const button=document.createElement('button');
      button.id='savedVideoShortcut';button.className='collection-section-link';button.type='button';
      button.innerHTML=`${bookmarkSvg()}<span>저장한 영상 <b id="savedVideoCount">0</b></span>`;
      button.addEventListener('click',()=>openLibrary('video'));
      skillsHead.appendChild(button);
    }
    const curatedHead=$('.curated-head');
    if(curatedHead&&!$('#savedArticleShortcut',curatedHead)){
      const button=document.createElement('button');
      button.id='savedArticleShortcut';button.className='collection-section-link';button.type='button';
      button.innerHTML=`${bookmarkSvg()}<span>저장한 글 <b id="savedArticleCount">0</b></span>`;
      button.addEventListener('click',()=>openLibrary('article'));
      curatedHead.appendChild(button);
    }
    updateLibraryCounts();
  }

  function cleanupCuratedControls(){
    const refresh=$('#curatedRefresh');
    if(refresh)refresh.hidden=true;
    const open=$('#curatedFavoritesOpen');
    if(open)open.hidden=true;
    const panel=$('#curatedFavoritesPanel');
    if(panel)panel.hidden=true;
    const status=$('#curatedStatus');
    if(status&&/SEO|갱신|시트/i.test(status.textContent||''))status.textContent='';
  }

  function repairBrokenImages(){
    if(document.documentElement.dataset.v27ImageRepair==='true')return;
    document.documentElement.dataset.v27ImageRepair='true';
    document.addEventListener('error',event=>{
      const img=event.target;
      if(!(img instanceof HTMLImageElement)||img.dataset.v27Fallback==='true')return;
      if(!img.closest('.skill-card,.skill-video-card'))return;
      img.dataset.v27Fallback='true';
      const category=img.closest('[data-video-category]')?.dataset.videoCategory||img.closest('[data-skill-category]')?.dataset.skillCategory||'상업사진 실무';
      img.src=fallbackSkillImage(category);
    },true);
  }

  function initialize(){
    ensureLibraryUi();
    bindFavoriteDelegation();
    repairBrokenImages();
    const row=cleanAndPrepareSkillRail();
    if(row)setupSkillRail();
    migrateVisibleFavorites();
    injectSectionLinks();
    cleanupCuratedControls();
    updateLibraryCounts();
  }

  const observer=new MutationObserver(()=>{
    if($('#app')&&!$('#app').hidden&&($('#skillsInfiniteRow')||$('#curatedLinksRow'))){
      initialize();
      setTimeout(()=>{migrateVisibleFavorites();injectSectionLinks();cleanupCuratedControls();},600);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
  window.addEventListener('pageshow',()=>setTimeout(initialize,80),{passive:true});
})();
