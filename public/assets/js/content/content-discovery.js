/* v26: true endless Brunch/Tistory discovery, durable favorites and resilient video cards. */
(function(){
  const DISCOVERED_FAVORITES_KEY='photoRoadmapCuratedFavoriteItemsV2';
  const VIDEO_FAVORITES_KEY='photoRoadmapVideoFavoritesV1';
  const articleMap=new Map();
  const videoSeen=new Set();
  let articleCursor=0;
  let articleLoading=false;
  let articleEmptyStreak=0;
  let videoCursor=0;
  let videoLoading=false;

  const baseRenderCuratedItems=window.renderCuratedItems;
  const baseLoadCuratedLinks=window.loadCuratedLinks;

  function readJson(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}
    catch{return fallback;}
  }
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function favoriteIds(){
    try{return new Set(JSON.parse(localStorage.getItem('photoRoadmapCuratedFavoritesV1')||'[]'));}
    catch{return new Set();}
  }
  function savedFavoriteItems(){
    const value=readJson(DISCOVERED_FAVORITES_KEY,{});
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }
  function saveFavoriteSnapshot(item){
    if(!item?.id)return;
    const all=savedFavoriteItems();
    all[String(item.id)]=item;
    writeJson(DISCOVERED_FAVORITES_KEY,all);
  }
  function removeFavoriteSnapshot(id){
    const all=savedFavoriteItems();
    delete all[String(id)];
    writeJson(DISCOVERED_FAVORITES_KEY,all);
  }

  function mergeArticles(items){
    (items||[]).forEach(item=>{
      const id=String(item?.id||'');
      const url=String(item?.url||'');
      if(!id&&!url)return;
      const key=id||url;
      const previous=articleMap.get(key)||{};
      articleMap.set(key,{...previous,...item,id:id||previous.id||`link-${key.length}`});
    });
    return [...articleMap.values()];
  }

  if(typeof baseRenderCuratedItems==='function'){
    window.renderCuratedItems=function(items){
      const row=document.querySelector('#curatedLinksRow');
      if(row){
        row.dataset.loopAppending='true';
        row.querySelectorAll('[data-loop-clone]').forEach(node=>node.remove());
      }
      const scrollLeft=row?.scrollLeft||0;
      const merged=mergeArticles(items);
      const result=baseRenderCuratedItems(merged);
      const next=document.querySelector('#curatedLinksRow');
      if(next){
        next.dataset.loopAppending='true';
        next.querySelectorAll('[data-loop-clone]').forEach(node=>node.remove());
        requestAnimationFrame(()=>{next.scrollLeft=scrollLeft;});
      }
      return result;
    };
  }

  if(typeof baseLoadCuratedLinks==='function'){
    window.loadCuratedLinks=async function(options={}){
      const result=await baseLoadCuratedLinks(options);
      requestAnimationFrame(()=>{
        blockLegacyCuratedClones();
        setupArticleDiscovery();
        renderDurableFavorites();
      });
      return result;
    };
  }

  function blockLegacyCuratedClones(){
    const row=document.querySelector('#curatedLinksRow');
    if(!row)return;
    row.dataset.loopAppending='true';
    row.querySelectorAll('[data-loop-clone]').forEach(node=>node.remove());
  }

  async function fetchJsonWithTimeout(url,options={},timeout=6500){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await fetch(url,{...options,signal:controller.signal,cache:'no-store'});
      const json=await response.json().catch(()=>({}));
      if(!response.ok||json?.ok===false)throw new Error(json?.message||'요청 실패');
      return json;
    }finally{clearTimeout(timer);}
  }

  function ensureArticleSentinel(){
    const row=document.querySelector('#curatedLinksRow');
    if(!row)return null;
    let sentinel=row.querySelector('.curated-discovery-sentinel');
    if(!sentinel){
      sentinel=document.createElement('div');
      sentinel.className='curated-discovery-sentinel';
      sentinel.setAttribute('aria-hidden','true');
      row.appendChild(sentinel);
    }
    return sentinel;
  }

  async function loadMoreArticles({force=false}={}){
    const row=document.querySelector('#curatedLinksRow');
    if(!row||articleLoading)return;
    articleLoading=true;
    const sentinel=ensureArticleSentinel();
    sentinel?.classList.add('is-loading');
    try{
      let fresh=[];
      for(let attempt=0;attempt<3&&!fresh.length;attempt++){
        const json=await fetchJsonWithTimeout(`/api/discover?cursor=${articleCursor}&limit=8`,{},7600);
        articleCursor=Number(json.nextCursor)||articleCursor+1;
        fresh=(json.items||[]).filter(item=>{
          const id=String(item?.id||'');
          const url=String(item?.url||'');
          if((id&&articleMap.has(id))||[...articleMap.values()].some(old=>old.url&&old.url===url))return false;
          return Boolean(id||url);
        });
      }
      if(fresh.length){
        articleEmptyStreak=0;
        window.renderCuratedItems(fresh);
        const status=document.querySelector('#curatedStatus');
        if(status)status.textContent=`촬영 팁 ${articleMap.size}개`;
      }else articleEmptyStreak++;
    }catch{articleEmptyStreak++;}
    finally{
      articleLoading=false;
      ensureArticleSentinel()?.classList.remove('is-loading');
    }
  }

  function setupArticleDiscovery(){
    const row=document.querySelector('#curatedLinksRow');
    if(!row||row.dataset.discoveryBound==='true')return;
    row.dataset.discoveryBound='true';
    blockLegacyCuratedClones();
    ensureArticleSentinel();
    let raf=0;
    row.addEventListener('scroll',()=>{
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        const remaining=row.scrollWidth-row.clientWidth-row.scrollLeft;
        if(remaining<Math.max(760,row.clientWidth*1.7))loadMoreArticles();
      });
    },{passive:true});
    const refresh=document.querySelector('#curatedRefresh');
    refresh?.addEventListener('click',()=>{
      articleEmptyStreak=0;
      loadMoreArticles({force:true});
    });
  }

  function escHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function attrHtml(value){return escHtml(value);}
  function articleTitle(item){return item?.og_title||item?.title||'사진 참고 글';}
  function articleImage(item){return item?.thumbnail_url||(typeof window.imageFor==='function'?window.imageFor('portfolio'):'');}

  function renderDurableFavorites(){
    const list=document.querySelector('#curatedFavoritesList');
    const count=document.querySelector('#curatedFavoriteCount');
    if(!list)return;
    const ids=favoriteIds();
    const snapshots=savedFavoriteItems();
    const byId=new Map([...articleMap.values()].map(item=>[String(item.id||''),item]));
    const items=[...ids].map(id=>byId.get(id)||snapshots[id]).filter(Boolean);
    if(count)count.textContent=String(ids.size);
    if(!items.length){
      list.innerHTML='<div class="curated-favorites-empty">아직 저장한 글이 없습니다. 관심 있는 글의 북마크 버튼을 누르면 여기에 모입니다.</div>';
      return;
    }
    list.innerHTML=items.map(item=>`<div class="curated-favorite-row" data-favorite-id="${attrHtml(item.id)}">
      <a href="${attrHtml(item.url)}" target="_blank" rel="noopener"><img src="${attrHtml(articleImage(item))}" alt="" loading="lazy"></a>
      <div class="curated-favorite-row__copy"><small>${escHtml(item.platform||'외부 글')}</small><a href="${attrHtml(item.url)}" target="_blank" rel="noopener">${escHtml(articleTitle(item))}</a></div>
      <button class="curated-favorite-remove" type="button" aria-label="즐겨찾기에서 삭제">×</button>
    </div>`).join('');
    list.querySelectorAll('.curated-favorite-remove').forEach(button=>button.addEventListener('click',()=>{
      const row=button.closest('[data-favorite-id]');
      const id=String(row?.dataset.favoriteId||'');
      const set=favoriteIds();
      set.delete(id);
      try{localStorage.setItem('photoRoadmapCuratedFavoritesV1',JSON.stringify([...set]));}catch{}
      removeFavoriteSnapshot(id);
      document.querySelectorAll(`.curated-card[data-curated-id="${CSS.escape(id)}"]`).forEach(card=>{
        card.dataset.favorite='false';
        const mark=card.querySelector('.curated-bookmark');
        mark?.classList.remove('is-favorite');
        mark?.setAttribute('aria-pressed','false');
      });
      renderDurableFavorites();
    }));
  }
  window.renderCuratedFavoritesList=renderDurableFavorites;

  document.addEventListener('click',event=>{
    const bookmark=event.target.closest('.curated-bookmark');
    if(!bookmark)return;
    setTimeout(()=>{
      const card=bookmark.closest('.curated-card');
      const id=String(card?.dataset.curatedId||'');
      const item=[...articleMap.values()].find(row=>String(row.id||'')===id);
      if(!id)return;
      if(favoriteIds().has(id)&&item)saveFavoriteSnapshot(item);
      else removeFavoriteSnapshot(id);
      renderDurableFavorites();
    },0);
  });

  function videoFavoriteIds(){
    try{return new Set(JSON.parse(localStorage.getItem(VIDEO_FAVORITES_KEY)||'[]'));}
    catch{return new Set();}
  }
  function bookmarkSvg(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8v15.6l-5-3.1-5 3.1V4.8Z"/></svg>';}
  function fallbackThumb(card){
    return card?.querySelector('.skill-card__visual img')?.src||(window.imageFor?.('skills')||window.imageFor?.('portfolio')||'');
  }
  function makeFallbackVideo(query,card){
    return {
      id:`search-${encodeURIComponent(query).slice(0,60)}`,
      title:`${query} 영상 보기`,
      channel:'YouTube 검색',
      views:'',duration:'',thumbnail:fallbackThumb(card),
      url:`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      isSearchFallback:true
    };
  }
  function videoMarkup(item,{mini=false,card=null}={}){
    const id=String(item?.id||'');
    const favorite=videoFavoriteIds().has(id);
    const image=item?.thumbnail||fallbackThumb(card);
    const meta=[item?.channel,item?.views,item?.duration].filter(Boolean).join(' / ')||'YouTube';
    return `<article class="skill-video-card ${mini?'skill-video-card--mini':''}" data-video-id="${attrHtml(id)}">
      <a class="skill-video-card__visual" href="${attrHtml(item?.url||'#')}" target="_blank" rel="noopener">
        <img src="${attrHtml(image)}" alt="${attrHtml(item?.title||'관련 영상')}" loading="lazy">
        <span class="skill-video-card__play" aria-hidden="true">▶</span>
        ${item?.duration?`<span class="skill-video-card__duration">${escHtml(item.duration)}</span>`:''}
      </a>
      <div class="skill-video-card__copy"><div class="skill-video-card__source">${escHtml(meta)}</div><a href="${attrHtml(item?.url||'#')}" target="_blank" rel="noopener"><strong>${escHtml(item?.title||'관련 영상 보기')}</strong></a></div>
      <button class="skill-video-bookmark ${favorite?'is-favorite':''}" type="button" aria-label="영상 즐겨찾기" aria-pressed="${favorite?'true':'false'}">${bookmarkSvg()}</button>
    </article>`;
  }

  async function loadVideoForCard(card,index){
    const slot=card.querySelector('.skill-card__video-slot');
    if(!slot||slot.dataset.v26Loaded==='true')return;
    slot.dataset.v26Loaded='true';
    const query=card.dataset.skillQuery||'상업사진 실무';
    try{
      const json=await fetchJsonWithTimeout(`/api/videos?q=${encodeURIComponent(query)}&cursor=${index}`,{},6500);
      const item=(json.items||[]).find(value=>value?.url)||makeFallbackVideo(query,card);
      if(item?.id)videoSeen.add(String(item.id));
      slot.innerHTML=videoMarkup(item,{mini:true,card});
    }catch{
      slot.innerHTML=videoMarkup(makeFallbackVideo(query,card),{mini:true,card});
    }
  }

  async function hydrateVideoSlots(){
    const cards=[...document.querySelectorAll('.skill-card--media[data-skill-query]')];
    let index=0;
    const workers=Array.from({length:Math.min(2,cards.length||1)},async()=>{
      while(index<cards.length){
        const current=index++;
        await loadVideoForCard(cards[current],current);
      }
    });
    await Promise.all(workers);
  }

  async function appendVideoCards(){
    const row=document.querySelector('#skillsInfiniteRow');
    if(!row||videoLoading)return;
    videoLoading=true;
    let sentinel=row.querySelector('.skills-more-sentinel');
    sentinel?.classList.add('is-loading');
    try{
      const json=await fetchJsonWithTimeout(`/api/videos?cursor=${videoCursor}`,{},6500);
      videoCursor=Number(json.nextCursor)||videoCursor+1;
      let items=(json.items||[]).filter(item=>item?.url);
      if(!items.length)items=[makeFallbackVideo('상업사진 촬영 실무',row.querySelector('.skill-card--media'))];
      const fresh=items.filter(item=>{
        const id=String(item?.id||'');
        if(!id||videoSeen.has(id)||row.querySelector(`[data-video-id="${CSS.escape(id)}"]`))return false;
        videoSeen.add(id);return true;
      });
      if(fresh.length)sentinel?.insertAdjacentHTML('beforebegin',fresh.map(item=>videoMarkup(item)).join(''));
    }catch{
      const item=makeFallbackVideo('상업사진 촬영 실무',row.querySelector('.skill-card--media'));
      if(!row.querySelector(`[data-video-id="${CSS.escape(item.id)}"]`))sentinel?.insertAdjacentHTML('beforebegin',videoMarkup(item));
    }finally{sentinel?.classList.remove('is-loading');videoLoading=false;}
  }

  function setupVideoRail(){
    const row=document.querySelector('#skillsInfiniteRow');
    if(!row||row.dataset.v26VideoBound==='true')return;
    row.dataset.v26VideoBound='true';
    let raf=0;
    row.addEventListener('scroll',()=>{
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        if(row.scrollWidth-row.clientWidth-row.scrollLeft<Math.max(700,row.clientWidth*1.5))appendVideoCards();
      });
    },{passive:true});
    hydrateVideoSlots();
    setTimeout(()=>{
      document.querySelectorAll('.skill-card__video-slot .video-slot-loading').forEach(slot=>{
        const card=slot.closest('.skill-card--media');
        if(card)slot.parentElement.innerHTML=videoMarkup(makeFallbackVideo(card.dataset.skillQuery||'상업사진 실무',card),{mini:true,card});
      });
    },7000);
  }

  function init(){
    blockLegacyCuratedClones();
    setupArticleDiscovery();
    renderDurableFavorites();
    setupVideoRail();
  }

  const observer=new MutationObserver(()=>{
    if(document.querySelector('#curatedLinksRow')||document.querySelector('#skillsInfiniteRow')){
      observer.disconnect();
      requestAnimationFrame(init);
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(init),{once:true});
  else requestAnimationFrame(init);
})();
