/* Canonical collection hub: public data/business logic + shared PlatformModuleRegistry UI. */
(function(){
  if(window.__photoCollectionHubCanonicalV1)return;
  window.__photoCollectionHubCanonicalV1=true;

  const modules=window.PlatformModuleRegistry;
  if(!modules?.canConsume?.('collection-bottom-sheet','public'))return;

  const VIDEO_IDS_KEY='photoRoadmapVideoFavoritesV1';
  const VIDEO_ITEMS_KEY='photoRoadmapVideoFavoriteItemsV2';
  const ARTICLE_IDS_KEY='photoRoadmapCuratedFavoritesV1';
  const ARTICLE_ITEMS_KEY='photoRoadmapCuratedFavoriteItemsV2';
  const QUESTION_KEY='photoRoadmapQuestionsV2';
  const DEVICE_KEY='photoRoadmapDeviceKeyV1';

  const videoCache=new Map();
  let skillCursor=0;
  let skillLoading=false;
  let collectionMount=null;
  let collectionController=null;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const attr=esc;

  function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function readObject(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
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
    result.category=result.category||category||'상업사진 실무';result.query=result.query||query||'';result.savedAt=result.savedAt||'';
    if(result.id)videoCache.set(result.id,result);return result;
  }
  async function fetchJson(url,timeout=7800){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    try{const response=await fetch(url,{cache:'no-store',signal:controller.signal});const json=await response.json().catch(()=>({}));if(!response.ok||json?.ok===false)throw new Error(json?.message||'요청 실패');return json;}finally{clearTimeout(timer);}
  }
  function bookmarkSvg(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8v15.6l-5-3.1-5 3.1V4.8Z"/></svg>';}

  function videoMarkup(item,{mini=false,fallbackImage=''}={}){
    const normalized=normalizeVideo(item,item?.category,item?.query),favorites=idSet(VIDEO_IDS_KEY),favorite=favorites.has(normalized.id);
    const image=safeImage(normalized.thumbnail,fallbackImage||fallbackSkillImage(normalized.category));
    const meta=[normalized.channel,normalized.views,normalized.duration].filter(Boolean).join(' / ')||'YouTube',fallback=Boolean(normalized.isSearchFallback);
    return `<article class="skill-video-card ${mini?'skill-video-card--mini skill-video-card--matched':'skill-video-card--discover'}" data-video-id="${attr(normalized.id)}" data-video-category="${attr(normalized.category)}" data-video-url="${attr(normalized.url||'')}" data-video-title="${attr(normalized.title||'')}" data-video-image="${attr(image)}">
      <a class="skill-video-card__visual" href="${attr(normalized.url||'#')}" target="_blank" rel="noopener"><img src="${attr(image)}" alt="${attr(normalized.title||'관련 영상')}" loading="lazy"><span class="skill-video-category">${esc(normalized.category)}</span><span class="skill-video-card__play" aria-hidden="true">▶</span>${normalized.duration?`<span class="skill-video-card__duration">${esc(normalized.duration)}</span>`:''}</a>
      <div class="skill-video-card__copy"><div class="skill-video-card__source">${esc(fallback?'관련 영상 검색':meta)}</div><a href="${attr(normalized.url||'#')}" target="_blank" rel="noopener"><strong>${esc(normalized.title||`${normalized.category} 영상 보기`)}</strong></a></div>
      <button class="skill-video-bookmark ${favorite?'is-favorite':''}" type="button" aria-label="영상 저장" aria-pressed="${favorite?'true':'false'}">${bookmarkSvg()}</button>
    </article>`;
  }
  function fallbackVideo(query,category,image){return normalizeVideo({id:`search-${encodeURIComponent(category+'-'+query).slice(0,90)}`,title:`${category} 영상 더 찾아보기`,channel:'YouTube 검색',thumbnail:image,url:`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,category,query,isSearchFallback:true},category,query);}

  function cleanAndPrepareSkillRail(){
    const current=$('#skillsInfiniteRow');if(!current)return null;if(current.dataset.v27Clean==='true')return current;
    const row=current.cloneNode(true);row.dataset.v27Clean='true';row.querySelectorAll('.skills-more-sentinel').forEach(node=>node.remove());
    [...row.children].forEach(child=>{if(child.classList.contains('skill-video-card'))child.remove();});
    $$('.skill-card--media',row).forEach(card=>{
      const title=$('h3',card)?.textContent||'',{category,query}=classifySkill(title);card.dataset.skillCategory=category;card.dataset.skillQuery=query;
      const visual=$('.skill-card__visual img',card);if(visual&&!safeImage(visual.src))visual.src=fallbackSkillImage(category);
      const slot=$('.skill-card__video-slot',card);if(slot)slot.innerHTML=`<div class="skill-video-slot-head"><span>추천 영상</span><small>${esc(category)}</small></div><div class="skill-video-slot-body"><span class="video-slot-loading">관련 영상을 확인하는 중</span></div>`;
    });
    const sentinel=document.createElement('div');sentinel.className='skills-more-sentinel';sentinel.setAttribute('aria-hidden','true');row.appendChild(sentinel);current.replaceWith(row);return row;
  }
  async function hydrateSkillCard(card,index){
    const body=$('.skill-video-slot-body',card);if(!body||body.dataset.loaded==='true')return;body.dataset.loaded='true';
    const category=card.dataset.skillCategory||'상업사진 실무',query=card.dataset.skillQuery||'상업사진 실무',visual=$('.skill-card__visual img',card),fallbackImage=safeImage(visual?.src,fallbackSkillImage(category));
    try{const json=await fetchJson(`/api/videos?q=${encodeURIComponent(query)}&cursor=${index}`);const raw=(json.items||[]).find(item=>item?.url&&!item?.isSearchFallback)||(json.items||[]).find(item=>item?.url);const item=raw?normalizeVideo({...raw,category:raw.category||category,query},category,query):fallbackVideo(query,category,fallbackImage);body.innerHTML=videoMarkup(item,{mini:true,fallbackImage});}
    catch{body.innerHTML=videoMarkup(fallbackVideo(query,category,fallbackImage),{mini:true,fallbackImage});}
  }
  async function hydrateSkillCards(row){const cards=$$('.skill-card--media',row);let cursor=0;const workers=Array.from({length:Math.min(2,Math.max(1,cards.length))},async()=>{while(cursor<cards.length){const index=cursor++;await hydrateSkillCard(cards[index],index);}});await Promise.all(workers);}
  async function appendSkillVideos(row){
    if(!row||skillLoading)return;skillLoading=true;const sentinel=$('.skills-more-sentinel',row);sentinel?.classList.add('is-loading');
    try{let appended=0;for(let attempt=0;attempt<3&&appended<4;attempt++){const json=await fetchJson(`/api/videos?cursor=${skillCursor}`);skillCursor=Number(json.nextCursor)||skillCursor+1;const category=json.category||'상업사진 실무',query=json.query||'';for(const raw of json.items||[]){const item=normalizeVideo({...raw,category:raw.category||category,query:raw.query||query},category,query);if(row.querySelector(`[data-video-id="${CSS.escape(item.id)}"]`))continue;sentinel?.insertAdjacentHTML('beforebegin',videoMarkup(item));appended++;if(appended>=6)break;}}}catch{}finally{sentinel?.classList.remove('is-loading');skillLoading=false;}
  }
  function setupSkillRail(){
    const row=cleanAndPrepareSkillRail();if(!row||row.dataset.v27Bound==='true')return;row.dataset.v27Bound='true';hydrateSkillCards(row);
    let raf=0;const nearEnd=()=>{raf=0;const remaining=row.scrollWidth-row.clientWidth-row.scrollLeft;if(remaining<Math.max(720,row.clientWidth*1.6))appendSkillVideos(row);};
    row.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(nearEnd);},{passive:true});
    const sentinel=$('.skills-more-sentinel',row);if('IntersectionObserver'in window&&sentinel){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))appendSkillVideos(row);},{root:row,rootMargin:'0px 900px 0px 0px',threshold:0.01});observer.observe(sentinel);}appendSkillVideos(row);
  }

  function videoItemFromCard(card){const id=String(card?.dataset.videoId||''),cached=videoCache.get(id);if(cached)return {...cached};return normalizeVideo({id,title:card?.dataset.videoTitle||$('strong',card)?.textContent||'저장한 영상',url:card?.dataset.videoUrl||$('a',card)?.href||'',thumbnail:card?.dataset.videoImage||$('img',card)?.src||'',category:card?.dataset.videoCategory||$('.skill-video-category',card)?.textContent||'상업사진 실무',channel:$('.skill-video-card__source',card)?.textContent||'YouTube'});}
  function articleItemFromCard(card){const id=String(card?.dataset.curatedId||''),visual=$('.curated-card__visual img',card);return {id,title:$('h3',card)?.textContent||'저장한 글',og_title:$('h3',card)?.textContent||'저장한 글',url:$('.curated-open',card)?.href||$('a',card)?.href||'',thumbnail_url:visual?.src||'',platform:$('.curated-platform',card)?.textContent||$('.curated-meta strong',card)?.textContent||'읽을거리',summary:$('.curated-card__body p',card)?.textContent||'',savedAt:''};}

  function syncFavoriteButtons(type,id,active){
    const selector=type==='video'?`[data-video-id="${CSS.escape(id)}"] .skill-video-bookmark`:`.curated-card[data-curated-id="${CSS.escape(id)}"] .curated-bookmark`;
    $$(selector).forEach(button=>{button.classList.toggle('is-favorite',active);button.setAttribute('aria-pressed',active?'true':'false');});
    if(type==='article')$$(`.curated-card[data-curated-id="${CSS.escape(id)}"]`).forEach(card=>card.dataset.favorite=active?'true':'false');
  }
  function setFavorite(type,item,nextState){
    if(window.ContentBookmarkStore){try{window.ContentBookmarkStore.set(type,item,nextState);return;}catch{}}
    const idsKey=type==='video'?VIDEO_IDS_KEY:ARTICLE_IDS_KEY,itemsKey=type==='video'?VIDEO_ITEMS_KEY:ARTICLE_ITEMS_KEY,set=idSet(idsKey),items=readObject(itemsKey),id=String(item?.id||'');if(!id)return;
    if(nextState){set.add(id);items[id]={...item,savedAt:item.savedAt||nowIso()};}else{set.delete(id);delete items[id];}
    writeArray(idsKey,[...set]);writeObject(itemsKey,items);syncFavoriteButtons(type,id,nextState);updateLibraryCounts();renderLibrary();
  }
  function bindFavoriteDelegation(){
    if(document.documentElement.dataset.v27FavoriteDelegated==='true')return;document.documentElement.dataset.v27FavoriteDelegated='true';
    document.addEventListener('click',event=>{
      const videoButton=event.target.closest('.skill-video-bookmark'),articleButton=event.target.closest('.curated-bookmark');
      if(!videoButton&&!articleButton)return;
      if(articleButton?.classList.contains('edu-bookmark'))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(videoButton){const item=videoItemFromCard(videoButton.closest('[data-video-id]'));setFavorite('video',item,!idSet(VIDEO_IDS_KEY).has(item.id));}
      else{const item=articleItemFromCard(articleButton.closest('.curated-card'));setFavorite('article',item,!idSet(ARTICLE_IDS_KEY).has(item.id));}
    },true);
  }
  function migrateVisibleFavorites(){
    const videoItems=readObject(VIDEO_ITEMS_KEY);idSet(VIDEO_IDS_KEY).forEach(id=>{if(videoItems[id])return;const card=$(`[data-video-id="${CSS.escape(id)}"]`);if(card)videoItems[id]={...videoItemFromCard(card),savedAt:nowIso()};});writeObject(VIDEO_ITEMS_KEY,videoItems);
    const articleItems=readObject(ARTICLE_ITEMS_KEY);idSet(ARTICLE_IDS_KEY).forEach(id=>{if(articleItems[id])return;const card=$(`.curated-card[data-curated-id="${CSS.escape(id)}"]`);if(card)articleItems[id]={...articleItemFromCard(card),savedAt:nowIso()};});writeObject(ARTICLE_ITEMS_KEY,articleItems);
  }
  function questions(){return readArray(QUESTION_KEY).map(item=>({...item,type:'question'}));}
  function allSavedItems(){
    const videos=Object.values(readObject(VIDEO_ITEMS_KEY)).map(item=>({...item,type:'video'}));
    const articles=Object.values(readObject(ARTICLE_ITEMS_KEY)).map(item=>({...item,type:'article'}));
    return [...videos,...articles,...questions()].sort((a,b)=>String(b.savedAt||b.created_at||'').localeCompare(String(a.savedAt||a.created_at||'')));
  }

  function removeLibraryItem(type,id){
    if(type==='video'){setFavorite('video',readObject(VIDEO_ITEMS_KEY)[id]||{id},false);return;}
    if(type==='article'){setFavorite('article',readObject(ARTICLE_ITEMS_KEY)[id]||{id},false);return;}
    if(type==='question'){
      writeArray(QUESTION_KEY,readArray(QUESTION_KEY).filter(item=>String(item.id)!==String(id)));
      const deviceId=localStorage.getItem(DEVICE_KEY)||'';if(typeof window.apiRpc==='function'&&deviceId)window.apiRpc('deleteQuestionHistory',{deviceId,id}).catch(()=>{});
      updateLibraryCounts();renderLibrary();
    }
  }
  function openSavedQuestion(id){closeLibrary();setTimeout(()=>{$('#askFab')?.click();setTimeout(()=>{$(`.history-item[data-history-id="${CSS.escape(id)}"] .history-open`)?.click();},160);},210);}
  function openQuestionSettings(){closeLibrary();setTimeout(()=>{$('#askFab')?.click();setTimeout(()=>{$('#askHistoryTab')?.click();setTimeout(()=>$('.ask-settings-btn')?.click(),70);},130);},210);}

  const publicCollectionSource={
    getItems:allSavedItems,
    removeItem:removeLibraryItem,
    openQuestion:openSavedQuestion,
    openSettings:openQuestionSettings
  };

  function ensureLibraryUi(){
    if(collectionController)return collectionController;
    let host=$('#publicCollectionModuleHost');
    if(!host){host=document.createElement('div');host.id='publicCollectionModuleHost';document.body.appendChild(host);}
    collectionMount=modules.mount(host,'collection-bottom-sheet',{open:false,activeTab:'all'},{consumer:'public',collectionSource:publicCollectionSource});
    collectionController=collectionMount.api||host.__platformCollectionController||null;
    return collectionController;
  }
  function openLibrary(tab='all'){ensureLibraryUi()?.open?.(tab);}
  function closeLibrary(){collectionController?.close?.();}
  function renderLibrary(){collectionController?.render?.();}

  function updateLibraryCounts(){
    ensureLibraryUi();
    const total=idSet(VIDEO_IDS_KEY).size+idSet(ARTICLE_IDS_KEY).size+readArray(QUESTION_KEY).length,badge=$('#collectionFabCount');
    if(badge){badge.textContent=String(total);badge.hidden=total===0;}
    const videoCount=$('#savedVideoCount');if(videoCount)videoCount.textContent=String(idSet(VIDEO_IDS_KEY).size);
    const articleCount=$('#savedArticleCount');if(articleCount)articleCount.textContent=String(idSet(ARTICLE_IDS_KEY).size);
  }
  function injectSectionLinks(){
    const skillsHead=$('#skills .section-heading');
    if(skillsHead&&!$('#savedVideoShortcut',skillsHead)){const button=document.createElement('button');button.id='savedVideoShortcut';button.className='collection-section-link';button.type='button';button.innerHTML=`${bookmarkSvg()}<span>저장한 영상 <b id="savedVideoCount">0</b></span>`;button.addEventListener('click',()=>openLibrary('video'));skillsHead.appendChild(button);}
    const curatedHead=$('.curated-head');
    if(curatedHead&&!$('#savedArticleShortcut',curatedHead)){const button=document.createElement('button');button.id='savedArticleShortcut';button.className='collection-section-link';button.type='button';button.innerHTML=`${bookmarkSvg()}<span>저장한 글 <b id="savedArticleCount">0</b></span>`;button.addEventListener('click',()=>openLibrary('article'));curatedHead.appendChild(button);}
    updateLibraryCounts();
  }
  function cleanupCuratedControls(){const refresh=$('#curatedRefresh');if(refresh)refresh.hidden=true;const open=$('#curatedFavoritesOpen');if(open)open.hidden=true;const panel=$('#curatedFavoritesPanel');if(panel)panel.hidden=true;const status=$('#curatedStatus');if(status&&/SEO|갱신|시트/i.test(status.textContent||''))status.textContent='';}
  function repairBrokenImages(){
    if(document.documentElement.dataset.v27ImageRepair==='true')return;document.documentElement.dataset.v27ImageRepair='true';
    document.addEventListener('error',event=>{const img=event.target;if(!(img instanceof HTMLImageElement)||img.dataset.v27Fallback==='true')return;if(!img.closest('.skill-card,.skill-video-card'))return;img.dataset.v27Fallback='true';const category=img.closest('[data-video-category]')?.dataset.videoCategory||img.closest('[data-skill-category]')?.dataset.skillCategory||'상업사진 실무';img.src=fallbackSkillImage(category);},true);
  }

  function initialize(){
    ensureLibraryUi();bindFavoriteDelegation();repairBrokenImages();const row=cleanAndPrepareSkillRail();if(row)setupSkillRail();migrateVisibleFavorites();injectSectionLinks();cleanupCuratedControls();updateLibraryCounts();
  }
  const observer=new MutationObserver(()=>{if($('#app')&&!$('#app').hidden&&($('#skillsInfiniteRow')||$('#curatedLinksRow'))){initialize();setTimeout(()=>{migrateVisibleFavorites();injectSectionLinks();cleanupCuratedControls();},600);}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
  window.addEventListener('pageshow',()=>setTimeout(initialize,80),{passive:true});

  window.PhotoCollectionHub={open:openLibrary,close:closeLibrary,render:renderLibrary,getItems:allSavedItems};
  document.addEventListener('content-bookmarks-changed',event=>{
    if(!event.detail?.persistent)return;
    const {type,id,selected}=event.detail;
    syncFavoriteButtons(type,id,selected);updateLibraryCounts();renderLibrary();
  });
})();
