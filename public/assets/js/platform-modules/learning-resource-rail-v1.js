/* Canonical discovery cards compose canonical filtering and horizontal motion. */
(function(){
  const registry=window.PlatformModuleRegistry,ID='learning-resource-rail';
  if(!registry||registry.get(ID))return;
  const esc=registry.escapeHtml,attr=registry.attr;
  const REGIONS=[{id:'all',label:'전체 지역'},{id:'busan',label:'부산'},{id:'seo-gu',label:'서구'},{id:'any',label:'지역 구분 없음'}];
  const TYPES=[{id:'all',label:'전체'},{id:'education',label:'교육'},{id:'grant',label:'지원사업'}];
  const PLATFORMS=[{id:'all',label:'전체'},{id:'youtube',label:'YouTube'},{id:'instagram',label:'Instagram'}];
  const STATUSES={open:'접수 중',closed:'마감',upcoming:'접수 예정',unknown:'확인 중'};
  const safeUrl=value=>/^https?:\/\//i.test(String(value||''))?String(value):'';
  const array=value=>Array.isArray(value)?value:[];
  function dateValue(value){if(!value)return NaN;const text=String(value);return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text)?`${text}T23:59:59+09:00`:text);}
  function noticeState(item,now=Date.now()){
    if(Number.isFinite(dateValue(item.endsAt))&&dateValue(item.endsAt)<now)return 'closed';
    if(item.status==='closed')return 'closed';
    if(Number.isFinite(dateValue(item.startsAt))&&dateValue(item.startsAt)>now)return 'upcoming';
    // An elapsed start time alone does not prove that registration opened.
    return item.status==='upcoming'?'unknown':STATUSES[item.status]?item.status:'unknown';
  }
  function shortDate(value){const n=dateValue(value);return Number.isFinite(n)?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(n):'';}
  function checkedDate(value){if(/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return shortDate(value);const n=dateValue(value);return Number.isFinite(n)?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(n):'';}
  function cleanItems(items){const seen=new Set();return array(items).filter(item=>item&&item.id&&item.title&&safeUrl(item.url)&&!seen.has(String(item.id))&&seen.add(String(item.id)));}
  function mergeItems(current,incoming){const merged=new Map(cleanItems(current).map(item=>[String(item.id),item]));for(const item of cleanItems(incoming))merged.set(String(item.id),item);return [...merged.values()];}
  function filters(props){return props.kind==='opportunities'?[['region',REGIONS,'지역'],['type',TYPES,'종류']]:[['platform',PLATFORMS,'출처']];}
  function matchesSearch(item,query){const source=[item.title,item.channel,item.description,item.caption,...array(item.hashtags)].filter(Boolean).join(' ').normalize('NFKC').toLowerCase();return String(query||'').normalize('NFKC').toLowerCase().replace(/#/g,' ').split(/\s+/).filter(Boolean).every(term=>source.includes(term));}
  function filterProps(items,label){return {items,activeId:'all',ariaLabel:`${label} 선택`};}
  function itemId(item,props){return `${props.packId||'guide'}:${props.kind==='opportunities'?'notice':'video'}:${item.id}`;}
  function renderCard(item,props){
    const notice=props.kind==='opportunities',status=noticeState(item),region=REGIONS.find(x=>x.id===item.region)?.label||'지역 구분 없음';
    const title=String(item.title),image=safeUrl(item.thumbnail),id=itemId(item,props);
    const source=notice?(item.provider||'공식 기관'):[item.platform||'YouTube',item.channel].filter(Boolean).join(' · '),instagram=item.platform==='Instagram';
    const summary=String(item.summary||item.description||'');
    return `<article class="edu-discovery-card" data-resource-id="${attr(String(item.id))}" data-resource-key="${attr(id)}"${notice?` data-notice-status="${status}"`:''}>
      ${image?`<a class="edu-discovery-card__image" href="${attr(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${attr(image)}" alt="" loading="lazy" draggable="false">${!notice?'<span class="edu-video-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 11 7-11 7z"/></svg></span>':''}</a>`:instagram?'<div class="edu-discovery-card__image edu-discovery-card__image--instagram" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="edu-instagram-dot"/></svg><span>Instagram</span></div>':''}
      <div class="edu-discovery-card__body"><div class="edu-discovery-card__top"><span>${esc(source)}</span><button class="edu-resource-save" type="button" aria-label="${attr(title)} 저장" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg></button></div>
      <h4><a href="${attr(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></h4>
      ${!notice&&(item.published||item.views)?`<p class="edu-video-meta">${esc([item.published,item.views].filter(Boolean).join(' · '))}</p>`:''}
      ${summary?`<p class="edu-discovery-card__summary">${esc(summary)}</p>`:''}
      ${notice?`<div class="edu-discovery-card__tags"><span class="edu-notice-state" data-state="${status}">${STATUSES[status]}</span><span>${esc(region)}</span><span>${item.type==='grant'?'지원사업':'교육'}</span></div><p class="edu-notice-period">${item.startsAt||item.endsAt?`접수 ${shortDate(item.startsAt)||'시작일 미정'} ~ ${shortDate(item.endsAt)||'종료일 미정'}`:'접수 기간은 원문에서 확인해 주세요.'}</p>${status==='unknown'?'<p class="edu-notice-reason">접수 상태를 확인하고 있습니다.</p>':''}`:`<div class="edu-discovery-card__tags">${item.duration?`<span>${esc(item.duration)}</span>`:''}${item.category?`<span>${esc(item.category)}</span>`:''}${array(item.hashtags).slice(0,3).map(tag=>`<button type="button" class="edu-resource-tag" data-resource-query="${attr(String(tag))}">${esc(String(tag).startsWith('#')?tag:'#'+tag)}</button>`).join('')}</div>${item.availabilityAtCapture?`<p class="edu-video-note">${esc(item.availabilityAtCapture)} · 촬영 구성 참고</p>`:instagram?'<p class="edu-video-note">게시물 구성 참고</p>':''}`}
      <div class="edu-discovery-card__footer"><small>${item.checkedAt?`확인 ${esc(shortDate(item.checkedAt))}`:''}</small><a href="${attr(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">${notice?'공고 보기':instagram?'게시물 보기':'영상 보기'} <span aria-hidden="true">↗</span></a></div></div>
    </article>`;
  }
  function rail(items,props,context){return registry.renderDependency(ID,'horizontal-rail',{items,framed:false,ariaLabel:props.title||'추천 자료'},{...context,renderItem:item=>renderCard(item,props)});}
  function render(props={},context={}){
    const notice=props.kind==='opportunities',items=cleanItems(props.items),title=props.title||(notice?'교육·지원사업 공고':'함께 볼 영상');
    const live=props.live===true&&context.consumer==='public';
    const description=props.description||(notice?'지역과 종류를 골라 공고를 확인하세요. 접수 기간이 지나거나 원문에서 종료되면 마감으로 표시됩니다.':'실습에 참고할 영상을 찾아보세요. 제목·내용·해시태그로 검색하고, 마음에 드는 영상을 저장하세요.');
    return `<section class="edu-discovery" data-platform-module="${ID}" data-resource-kind="${notice?'opportunities':'videos'}" data-resource-pack="${attr(props.packId||'guide')}">
      <header class="edu-discovery__head"><div><h3>${esc(title)}</h3><p>${esc(description)}</p></div>${live?'<button type="button" class="edu-resource-refresh">새로고침</button>':''}</header>
      ${!notice?'<form class="edu-resource-search" role="search"><label><span class="edu-search-label">영상 검색</span><input type="search" name="q" maxlength="80" placeholder="제목·내용·해시태그" autocomplete="off"></label><button type="submit">검색</button><button type="button" class="edu-resource-reset" hidden>초기화</button></form>':''}
      ${filters(props).map(([key,options,label])=>`<div class="edu-discovery__filter" data-resource-filter="${key}"><span>${label}</span><div class="edu-discovery__filter-control">${registry.renderDependency(ID,'filter-chip-rail',filterProps(options,label),context)}</div></div>`).join('')}
      <p class="edu-resource-status" role="status">${items.length?`${items.length}개 자료${props.sample?' · 미리보기 예시':''}`:live?(notice?'공고를 확인하고 있습니다.':'추천 영상을 불러오고 있습니다.'):'0개 자료'}</p>
      <div class="edu-discovery__results">${items.length?rail(items,props,context):''}</div>
      <p class="edu-resource-empty"${items.length?' hidden':''}>${live?'':notice?'이 조건에 맞는 공고가 없습니다.':'추천 영상이 없습니다.'}</p>
      <button type="button" class="edu-resource-more" hidden>영상 더 보기</button>
      ${!notice?'<p class="edu-resource-end" hidden>찾은 영상을 모두 표시했습니다. 다른 검색어로도 찾아보세요.</p>':''}
    </section>`;
  }
  function hydrate(host,props={},context={}){
    const root=host.matches?.(`[data-platform-module="${ID}"]`)?host:host.querySelector?.(`[data-platform-module="${ID}"]`);
    if(!root||root.dataset.resourceBound==='true')return;
    root.dataset.resourceBound='true';
    props={...props,kind:root.dataset.resourceKind,packId:props.packId||root.dataset.resourcePack};
    const notice=props.kind==='opportunities',persistent=context.consumer==='public'||context.consumer==='export';
    const store=persistent?window.ContentBookmarkStore:window.ContentBookmarkStore?.create({persistent:false});
    const results=root.querySelector('.edu-discovery__results'),message=root.querySelector('[role="status"]'),empty=root.querySelector('.edu-resource-empty'),more=root.querySelector('.edu-resource-more'),refresh=root.querySelector('.edu-resource-refresh'),search=root.querySelector('.edu-resource-search'),searchInput=search?.querySelector('input'),searchReset=root.querySelector('.edu-resource-reset'),end=root.querySelector('.edu-resource-end');
    const selection={region:'all',type:'all',platform:'all'},childMounts=[];
    let items=cleanItems(props.items),seedItems=cleanItems(props.items),railMount=null,checkedAt=props.checkedAt||'',providers=[],stale=false,fallback=false,loading=false,nextCursor=null,disposed=false,started=false,controller=null,lastRefresh=0,searchQuery='',requestId=0,autoPaused=false,autoHops=0,scrollFrame=0,snapshotLoaded=false,videoLoaded=false,ignoreScrollUntil=0;
    const matchesVideo=item=>(selection.platform==='all'||String(item.platform||'YouTube').toLowerCase()===selection.platform)&&matchesSearch(item,searchQuery);
    function remainingSeeds(){const seen=new Set(items.map(item=>String(item.id)));return seedItems.filter(item=>matchesVideo(item)&&!seen.has(String(item.id)));}
    function firstSeeds(){const matching=seedItems.filter(matchesVideo);if(selection.platform==='all'){const instagram=matching.filter(item=>item.platform==='Instagram').slice(0,4),youtube=matching.filter(item=>item.platform!=='Instagram');return cleanItems([...youtube.slice(0,12-instagram.length),...instagram]).slice(0,12);}return matching.slice(0,12);}
    function visibleItems(){const filtered=items.filter(item=>notice?((selection.region==='all'||item.region===selection.region)&&(selection.type==='all'||item.type===selection.type)):matchesVideo(item));if(notice)filtered.sort((a,b)=>{const order={open:0,upcoming:1,unknown:2,closed:3};return order[noticeState(a)]-order[noticeState(b)]||(dateValue(b.endsAt)||0)-(dateValue(a.endsAt)||0);});return filtered;}
    function syncBookmarks(){root.querySelectorAll('.edu-resource-save').forEach(button=>{const card=button.closest('[data-resource-key]'),item=items.find(x=>String(x.id)===card.dataset.resourceId);const active=Boolean(store?.has(notice?'article':'video',card.dataset.resourceKey));button.classList.toggle('is-favorite',active);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',`${item?.title||'자료'} ${active?'저장 취소':'저장'}`);});}
    function updateMessage(count){
      const failed=providers.filter(p=>['error','unavailable','failed','partial'].includes(p.status)||p.error).length;
      const parts=[`${count}개 ${notice?'공고':'영상'}`];
      if(props.sample)parts.push('미리보기 예시');
      if(checkedAt)parts.push(`마지막 확인 ${checkedDate(checkedAt)}`);
      if(loading)parts.push('업데이트 중');
      else if(stale)parts.push('최신 상태를 확인하지 못해 이전 자료를 표시합니다.');
      else if(fallback)parts.push('확인해 둔 영상 자료');
      if(failed)parts.push(`${failed}개 기관 응답 확인 중`);
      message.textContent=parts.join(' · ');
      root.dataset.resourceState=loading?'loading':stale?'stale':'ready';
      root.setAttribute('aria-busy',String(loading));
      if(refresh)refresh.disabled=loading;
      const localMore=!notice&&remainingSeeds().length>0;more.hidden=notice||(!localMore&&(nextCursor===null||nextCursor===undefined));more.disabled=loading;more.textContent=autoPaused?'다시 불러오기':'영상 더 보기';
      if(end)end.hidden=loading||!started||!more.hidden||count===0;
      if(searchReset)searchReset.hidden=!searchQuery;
    }
    function draw(){
      if(disposed)return;const list=visibleItems(),scroll=results.querySelector('.platform-horizontal-rail__track')?.scrollLeft||0;
      const focused=results.contains(document.activeElement)?document.activeElement:null,focusedCard=focused?.closest('[data-resource-id]'),focusId=focusedCard?.dataset.resourceId,focusSelector=focused?.matches('.edu-resource-save')?'.edu-resource-save':focused?.matches('h4 a')?'h4 a':focused?.matches('.edu-discovery-card__footer a')?'.edu-discovery-card__footer a':null;
      railMount?.cleanup();railMount=null;results.innerHTML=list.length?rail(list,props,context):'';
      const railRoot=results.querySelector('[data-platform-module="horizontal-rail"]');if(railRoot){railMount=registry.hydrateDependency(ID,railRoot,'horizontal-rail',{items:list,framed:false},context);const track=railRoot.querySelector('.platform-horizontal-rail__track');ignoreScrollUntil=scroll>0?Date.now()+50:0;track.scrollLeft=scroll;}
      empty.hidden=list.length>0||loading;empty.textContent=stale&&!list.length?'자료를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.':notice?'이 조건에 맞는 공고가 없습니다. 다른 지역이나 종류도 확인해 보세요.':searchQuery?'이 검색어와 맞는 영상을 찾지 못했습니다. 다른 단어나 해시태그를 입력해 보세요.':'이 출처에서 찾은 영상이 없습니다. 다른 출처도 확인해 보세요.';
      updateMessage(list.length);syncBookmarks();
      if(focusId&&focusSelector){const card=[...results.querySelectorAll('[data-resource-id]')].find(node=>node.dataset.resourceId===focusId);card?.querySelector(focusSelector)?.focus({preventScroll:true});}
    }
    for(const [key,options,label] of filters(props)){const slot=root.querySelector(`[data-resource-filter="${key}"]`),child=slot.querySelector('[data-platform-module="filter-chip-rail"]');childMounts.push(registry.hydrateDependency(ID,child,'filter-chip-rail',filterProps(options,label),context));}
    async function fetchJson(url,timeout){
      const abort=new AbortController();controller=abort;const timer=setTimeout(()=>abort.abort(),timeout);
      try{const response=await fetch(url,{signal:abort.signal,headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return await response.json();}finally{clearTimeout(timer);if(controller===abort)controller=null;}
    }
    async function snapshot(serial){
      if(snapshotLoaded||(notice&&items.length))return;
      try{const data=await fetchJson(`/content-discovery/learning-${notice?'opportunities':'videos'}.json`,5000);if(disposed||serial!==requestId)return;const subject=notice?data:data.subjects?.[props.packId];seedItems=cleanItems(subject?.items).filter(item=>!notice||!Array.isArray(item.subjects)||item.subjects.includes(props.packId));items=notice?seedItems:firstSeeds();snapshotLoaded=true;checkedAt=subject?.checkedAt||data.lastCheckedAt||data.checkedAt||'';providers=data.providers||[];stale=notice;fallback=!notice;draw();}catch{}
    }
    function hasMore(){return !notice&&(nextCursor!==null||remainingSeeds().length>0);}
    async function load(append=false,{reset=false,automatic=false}={}){
      if(disposed||loading||append&&!hasMore())return;
      const serial=++requestId,priorCursor=nextCursor,before=items.length;loading=true;updateMessage(visibleItems().length);
      try{
        if(!append)await snapshot(serial);
        if(disposed||serial!==requestId)return;
        if(!notice&&reset)items=firstSeeds();
        // The reviewed index also pages when the live service is temporarily
        // unavailable. An HTTP failure never discards a cursor or saved cards.
        if(append&&!notice){items=cleanItems([...items,...remainingSeeds().slice(0,12)]);if(nextCursor===null)return;}
        const query=new URLSearchParams({subject:props.packId});
        if(notice){query.set('region','all');query.set('type','all');}
        else{if(selection.platform!=='all')query.set('platform',selection.platform);if(searchQuery)query.set('q',searchQuery);if(append&&nextCursor!==null)query.set('cursor',String(nextCursor));}
        const requestedCursor=append?nextCursor:0;
        const data=await fetchJson(`/api/learning-${notice?'opportunities':'videos'}?${query}`,30000);if(disposed||serial!==requestId)return;
        if(data.ok===false&&!array(data.items).length)throw new Error('source unavailable');
        const received=cleanItems(data.items).filter(item=>notice||matchesVideo(item));
        if(notice){if(received.length||!data.stale)items=received;}
        else items=mergeItems(items,received);
        checkedAt=data.lastCheckedAt||data.checkedAt||checkedAt;providers=data.providers||[];stale=Boolean(data.stale)||data.ok===false;fallback=Boolean(data.isFallback);
        const cursor=Number.isInteger(data.nextCursor)&&data.nextCursor>requestedCursor?data.nextCursor:null;
        nextCursor=!notice&&!append&&!reset&&videoLoaded?priorCursor:cursor;videoLoaded=true;lastRefresh=Date.now();autoPaused=false;
      }catch{if(!disposed&&serial===requestId){stale=true;autoPaused=true;if(!notice&&!append&&!videoLoaded)nextCursor=0;lastRefresh=Date.now();}}
      finally{
        if(serial===requestId){loading=false;if(!disposed){draw();const track=results.querySelector('.platform-horizontal-rail__track'),short=track&&track.scrollWidth<=track.clientWidth+4;
          if(!notice&&!autoPaused&&hasMore()&&((automatic&&items.length===before)||short)&&autoHops<3){autoHops++;Promise.resolve().then(()=>load(true,{automatic:true}));}
        }}
      }
    }
    function resetVideos(query=searchQuery){
      requestId++;controller?.abort();loading=false;videoLoaded=false;searchQuery=String(query||'').trim().replace(/\s+/g,' ').slice(0,80);if(searchInput)searchInput.value=searchQuery;nextCursor=null;autoPaused=false;autoHops=0;items=live?firstSeeds():seedItems;const track=results.querySelector('.platform-horizontal-rail__track');if(track)track.scrollLeft=0;
      draw();if(live){started=true;observer?.disconnect();load(false,{reset:true});}
    }
    const click=event=>{
      const button=event.target.closest?.('.edu-resource-save');
      if(button){const card=button.closest('[data-resource-id]'),item=items.find(x=>String(x.id)===card.dataset.resourceId);if(!item||!store)return;const id=itemId(item,props),type=notice?'article':'video';try{store.set(type,{...item,id,title:item.title,og_title:item.title,url:safeUrl(item.url),thumbnail:item.thumbnail||'',thumbnail_url:item.thumbnail||'',summary:item.summary||item.description||'',platform:notice?item.provider||'공식 기관':item.platform||'YouTube',pack_id:props.packId},!store.has(type,id));syncBookmarks();}catch{message.textContent='저장 공간을 확인해 주세요.';}return;}
      const tag=event.target.closest?.('.edu-resource-tag');if(tag){resetVideos(tag.dataset.resourceQuery);return;}
      if(event.target.closest?.('.edu-resource-reset')){resetVideos('');return;}
      if(live&&event.target.closest?.('.edu-resource-refresh')){autoPaused=false;autoHops=0;load(false,{reset:true});}
      if(live&&event.target.closest?.('.edu-resource-more')){autoPaused=false;autoHops=0;load(true);}
    };
    const filter=event=>{const slot=event.target.closest?.('[data-resource-filter]');if(!slot||!root.contains(slot))return;const key=slot.dataset.resourceFilter,options=key==='region'?REGIONS:key==='type'?TYPES:PLATFORMS;if(!options.some(x=>x.id===event.detail?.value))return;selection[key]=event.detail.value;if(key==='platform'){resetVideos();return;}const track=results.querySelector('.platform-horizontal-rail__track');if(track)track.scrollLeft=0;draw();};
    const submit=event=>{if(event.target!==search)return;event.preventDefault();resetVideos(searchInput.value);};
    const scroll=event=>{if(notice||!live||!started||autoPaused||loading||Date.now()<ignoreScrollUntil||!hasMore()||!event.target.matches?.('.platform-horizontal-rail__track')||!results.contains(event.target)||scrollFrame)return;const track=event.target;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(track.scrollWidth-track.clientWidth-track.scrollLeft<Math.max(500,track.clientWidth)){autoHops=0;load(true,{automatic:true});}});};
    const bookmarks=event=>{if(event.detail?.persistent===persistent)syncBookmarks();};
    const visibility=()=>{if(started&&!document.hidden&&Date.now()-lastRefresh>300000)load();syncBookmarks();};
    const imageError=event=>{if(event.target.matches?.('.edu-discovery-card__image img'))event.target.closest('.edu-discovery-card__image').classList.add('is-unavailable');};
    root.addEventListener('click',click);root.addEventListener('submit',submit);root.addEventListener('scroll',scroll,true);root.addEventListener('platform-filter-select',filter);root.addEventListener('error',imageError,true);document.addEventListener('content-bookmarks-changed',bookmarks);window.addEventListener('pageshow',syncBookmarks);
    let observer=null,timer=null;
    const live=props.live===true&&context.consumer==='public';
    if(live){const start=()=>{if(started)return;started=true;observer?.disconnect();load();};if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))start();},{rootMargin:'500px'});observer.observe(root);}else start();document.addEventListener('visibilitychange',visibility);timer=setInterval(()=>{if(!started||document.hidden)return;if(notice)draw();const r=root.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight&&Date.now()-lastRefresh>=300000)load();},60000);}
    draw();
    return {api:{refresh:()=>live?load():draw(),getItems:()=>visibleItems()},cleanup(){disposed=true;requestId++;controller?.abort();observer?.disconnect();if(timer)clearInterval(timer);if(scrollFrame)cancelAnimationFrame(scrollFrame);railMount?.cleanup();childMounts.forEach(child=>child.cleanup());root.removeEventListener('click',click);root.removeEventListener('submit',submit);root.removeEventListener('scroll',scroll,true);root.removeEventListener('platform-filter-select',filter);root.removeEventListener('error',imageError,true);document.removeEventListener('content-bookmarks-changed',bookmarks);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pageshow',syncBookmarks);delete root.dataset.resourceBound;}};
  }
  const preview={packId:'preview',kind:'opportunities',sample:true,title:'교육·지원사업 공고',description:'지역과 종류를 선택해 자료를 살펴보세요.',items:[{id:'example-busan',title:'스마트폰 영상 실습 과정',summary:'촬영한 장면을 편집해 짧은 영상으로 완성하는 수업 예시입니다.',url:'https://kcmf.or.kr/',provider:'교육기관 · 예시',region:'busan',type:'education',status:'unknown'},{id:'example-seogu',title:'지역 모임 운영 수업',summary:'참여자를 모집하고 모임을 진행하는 수업 예시입니다.',url:'https://www.bsseogu.go.kr/',provider:'지역기관 · 예시',region:'seo-gu',type:'education',status:'unknown'},{id:'example-any',title:'창작 활동 지원 안내',summary:'신청 대상과 지원 범위를 확인하는 공고 예시입니다.',url:'https://www.bizinfo.go.kr/',provider:'지원기관 · 예시',region:'any',type:'grant',status:'unknown'}]};
  registry.register({id:ID,label:'추천 영상·교육 공고',category:'content',status:'approved',source:'platform-core',version:1,consumers:['public','library','editor','export'],isolateInstances:true,dependencies:[{id:'horizontal-rail',kind:'composition',required:true},{id:'filter-chip-rail',kind:'composition',required:true}],ownerFiles:['public/assets/js/core/content-bookmark-store.js','public/assets/js/platform-modules/learning-resource-rail-v1.js','public/assets/styles/components/learning-resource-rail-v1.css'],previewProps:preview,editorProps:preview,render,hydrate});
})();
