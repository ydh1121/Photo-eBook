(function(){
  if(window.PhotoPublicModuleSource)return;

  const registry=window.PlatformModuleRegistry;
  const esc=registry?.escapeHtml||function(value=''){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  };
  const attr=registry?.attr||esc;
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

  const FIXTURE_NAV=[
    {id:'intro','칩':'시작'},{id:'market','칩':'시장'},{id:'education','칩':'교육'},{id:'skills','칩':'실무'},
    {id:'portfolio','칩':'포트폴리오'},{id:'gear','칩':'장비'},{id:'plan','칩':'수익'},{id:'scripts','칩':'영업'},
    {id:'iphone','칩':'아이폰'},{id:'sources','칩':'자료'}
  ];
  const FIXTURE_MARKET=[
    {'순위':1,'분야':'제품 / 쇼핑몰 / 브랜드 촬영','초보 현실 단가':'10~30만/건','자리 잡은 뒤 목표 단가':'30~80만+/건','주요 고객 채널':'스마트스토어 / 자사몰 / 화장품 / 식품 / 소형 브랜드',image:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007'},
    {'순위':2,'분야':'기업 / 전문직 프로필/퍼스널브랜딩','초보 현실 단가':'10~20만/건','자리 잡은 뒤 목표 단가':'20~50만+/건','주요 고객 채널':'대표 / 강사 / 의사 / 변호사 / 회사 임직원',image:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007'},
    {'순위':3,'분야':'매장 / 음식 / 공간 B2B 출장','초보 현실 단가':'12~30만/건','자리 잡은 뒤 목표 단가':'30~70만+/건','주요 고객 채널':'식당 / 카페 / 병원 / 숙소 / 헬스장 / 인테리어',image:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007'}
  ];
  const now=new Date().toISOString();
  const FIXTURE_COLLECTION_ITEMS=[
    {type:'video',id:'fixture-video-product',title:'제품 촬영 조명 세팅',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',category:'제품 촬영',channel:'영상',savedAt:now},
    {type:'video',id:'fixture-video-portrait',title:'인물 촬영 현장 체크리스트',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',category:'인물 촬영',channel:'영상',savedAt:now},
    {type:'video',id:'fixture-video-food',title:'음식 촬영 납품 준비',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',category:'음식 촬영',channel:'영상',savedAt:now},
    {type:'article',id:'fixture-article',title:'상업사진 견적 체크리스트',og_title:'상업사진 견적 체크리스트',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/studio-process.webp?v=b007',platform:'읽을거리',summary:'견적과 납품 범위를 확인하는 예시 항목입니다.',savedAt:now},
    {type:'question',id:'fixture-question',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'촬영 범위와 납품 범위를 먼저 정합니다.',created_at:now}
  ];

  function safeImage(value,fallback=''){
    const src=String(value||'').trim();
    if(src.startsWith('blob:')||/^https?:\/\//i.test(src)||src.startsWith('/'))return src;
    return fallback;
  }
  function fallbackImage(type=''){
    if(/제품/.test(type))return '/assets/images/generated/v1/portfolio/product-brand.webp?v=b007';
    if(/인물/.test(type))return '/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007';
    if(/음식|공간/.test(type))return '/assets/images/generated/v1/portfolio/food-store.webp?v=b007';
    return '/assets/images/generated/v1/portfolio/studio-process.webp?v=b007';
  }
  function collectionIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 4.2h9.4c1.2 0 2.1.9 2.1 2.1v11.4c0 1.2-.9 2.1-2.1 2.1H7.3c-1.2 0-2.1-.9-2.1-2.1V6.3c0-1.2.9-2.1 2.1-2.1Z"/><path d="M9 4.2V2.8h6v1.4M9.1 8.2h5.8M9.1 11.7h5.8M9.1 15.2h3.8"/></svg>';
  }

  function navItems(items){
    const source=Array.isArray(items)&&items.length?items:FIXTURE_NAV;
    return source.map((item,index)=>({
      id:String(item?.id||item?.target||`chapter-${index}`),
      label:String(item?.['칩']||item?.label||item?.title||`메뉴 ${index+1}`)
    }));
  }
  function renderNavigation(props={},context={}){
    const items=navItems(props.items);
    const activeIndex=Math.max(0,Math.min(items.length-1,Number(props.activeIndex||0)));
    const markup=`<div class="nav-placeholder" aria-hidden="true"></div><div class="nav-shell" data-platform-module="top-chapter-navigation">
      <nav class="nav-scroll" aria-label="${attr(props.ariaLabel||'챕터')}">
        ${items.map((item,index)=>`<button class="nav-chip ${index===activeIndex?'is-active':''}" data-target="${attr(item.id)}">${esc(item.label)}</button>`).join('')}
      </nav>
      <div class="read-progress"><div class="read-progress__bar"></div></div>
    </div>`;
    if(context.consumer==='public')return markup;
    return `${markup}<div class="platform-module-preview-chapters" aria-hidden="true">${items.map((item,index)=>`<section id="${attr(item.id)}" class="chapter" data-chapter="${attr(item.id)}" style="min-height:${index===0?720:900}px"></section>`).join('')}</div>`;
  }
  function hydrateNavigation(){
    if(typeof window.setupNavigation==='function')requestAnimationFrame(()=>window.setupNavigation());
  }

  function marketItems(items){
    const source=Array.isArray(items)&&items.length?items:FIXTURE_MARKET;
    return source.map((item,index)=>{
      if(has(item,'분야'))return {...item};
      return {
        '순위':item.rank||index+1,
        '분야':item.title||'',
        '초보 현실 단가':item.leftValue||'',
        '자리 잡은 뒤 목표 단가':item.rightValue||'',
        '주요 고객 채널':item.meta||'',
        image:item.image||''
      };
    });
  }
  function renderHorizontalCardRail(props={}){
    const items=marketItems(props.items);
    return `<div class="scroll-row" data-platform-module="horizontal-card-rail" aria-label="${attr(props.ariaLabel||'시장 분야 비교')}">${items.map((row,index)=>`<article class="market-card">
      <div class="market-card__image"><img src="${attr(row.image||fallbackImage(row['분야']))}" alt="${attr(row['분야'])} 예시"></div>
      <div class="market-card__body">
        <div class="market-rank">TOP ${esc(row['순위']??index+1)}</div>
        <h3>${esc(row['분야']||'')}</h3>
        <div class="market-card__prices">
          <div class="market-card__price"><span>초보 단가</span><b>${esc(row['초보 현실 단가']||'')}</b></div>
          <div class="market-card__price"><span>목표 단가</span><b>${esc(row['자리 잡은 뒤 목표 단가']||'')}</b></div>
        </div>
        <div class="market-card__customer">${esc(row['주요 고객 채널']||'')}</div>
      </div>
    </article>`).join('')}</div>`;
  }

  function filterOptions(items,tab){
    const source=Array.isArray(items)?items:[];
    if(tab==='video')return ['all',...new Set(source.filter(item=>item.type==='video').map(item=>item.category||'기타'))];
    if(tab==='article')return ['all',...new Set(source.filter(item=>item.type==='article').map(item=>item.platform||'기타'))];
    return [];
  }
  function renderFilterButtons(options,active='all'){
    return (Array.isArray(options)?options:[]).map(value=>`<button type="button" data-library-filter="${attr(value)}" class="collection-filter ${String(active)===String(value)?'is-active':''}">${esc(value==='all'?'전체':value)}</button>`).join('');
  }
  function renderFilterRail(props={}){
    const tab=String(props.tab||'video');
    const options=Array.isArray(props.options)&&props.options.length?props.options:filterOptions(props.items||FIXTURE_COLLECTION_ITEMS,tab);
    return `<div id="${attr(props.domId||'collectionFilters')}" class="collection-filters" data-platform-module="filter-chip-rail">${renderFilterButtons(options,props.activeFilter||'all')}</div>`;
  }
  function hydrateFilterRail(host){
    const root=host.matches?.('.collection-filters')?host:host.querySelector('.collection-filters');
    if(!root||root.dataset.platformModuleBound==='true')return;
    root.dataset.platformModuleBound='true';
    const click=event=>{
      const button=event.target.closest?.('.collection-filter');
      if(!button||!root.contains(button))return;
      root.querySelectorAll('.collection-filter').forEach(chip=>chip.classList.toggle('is-active',chip===button));
      root.dispatchEvent(new CustomEvent('platform-filter-select',{bubbles:true,detail:{value:button.dataset.libraryFilter||'all',button}}));
    };
    root.addEventListener('click',click);
    return ()=>root.removeEventListener('click',click);
  }

  function renderFab(props={}){
    return `<button id="${attr(props.domId||'collectionFab')}" class="collection-fab" data-platform-module="floating-action" type="button" aria-label="${attr(props.ariaLabel||'내 모음 열기')}">${collectionIcon()}<span id="collectionFabCount" class="collection-fab__count" hidden>0</span></button>`;
  }
  function renderDeviceHandoff(props={}){
    return `<div class="collection-settings" data-platform-module="device-handoff-accordion">
      <button class="collection-setting-row" id="collectionDeviceLink" type="button"><span><strong>${esc(props.title||'다른 기기에서 이어보기')}</strong><small>${esc(props.description||'저장한 질문을 다른 기기에서도 확인할 수 있게 연결합니다.')}</small></span><b>›</b></button>
      <div class="collection-setting-note">영상과 읽을거리는 이 기기의 내 모음에서 바로 관리할 수 있습니다.</div>
    </div>`;
  }

  function itemTitle(item){return item.type==='question'?(item.question||'저장한 질문'):(item.title||item.og_title||'저장한 항목');}
  function itemMeta(item){
    if(item.type==='video')return item.category||item.channel||'영상';
    if(item.type==='article')return item.platform||'읽을거리';
    return String(item.created_at||'');
  }
  function itemImage(item){
    if(item.type==='video')return safeImage(item.thumbnail,fallbackImage(item.category));
    if(item.type==='article')return safeImage(item.thumbnail_url,fallbackImage('읽을거리'));
    return '';
  }
  function typeLabel(type){return type==='video'?'영상':type==='article'?'읽을거리':'질문';}

  function renderSettingsBody(items){
    const all=Array.isArray(items)?items:[];
    const videoCount=all.filter(item=>item.type==='video').length;
    const articleCount=all.filter(item=>item.type==='article').length;
    const questionCount=all.filter(item=>item.type==='question').length;
    return `<div class="collection-settings">
      <div class="collection-settings__summary"><strong>${videoCount+articleCount+questionCount}</strong><span>저장한 항목</span><div><b>${videoCount}</b> 영상</div><div><b>${articleCount}</b> 읽을거리</div><div><b>${questionCount}</b> 질문</div></div>
      <button class="collection-setting-row" id="collectionDeviceLink" type="button"><span><strong>다른 기기에서 이어보기</strong><small>저장한 질문을 다른 기기에서도 확인할 수 있게 연결합니다.</small></span><b>›</b></button>
      <div class="collection-setting-note">영상과 읽을거리는 이 기기의 내 모음에서 바로 관리할 수 있습니다.</div>
    </div>`;
  }
  function renderCollectionList(items){
    return `<div class="collection-list">${items.map(item=>{
      const title=itemTitle(item),meta=itemMeta(item),image=itemImage(item),id=item.id||'';
      if(item.type==='question')return `<article class="collection-item collection-item--question" data-library-type="question" data-library-id="${attr(id)}"><div class="collection-item__question-icon">Q</div><button class="collection-item__main collection-question-open" type="button"><span class="collection-item__type">질문</span><strong>${esc(title)}</strong><p>${esc(item.selected_text||'')}</p><small>${esc(meta)}</small></button><button class="collection-item__remove" type="button" aria-label="질문 삭제">×</button></article>`;
      return `<article class="collection-item" data-library-type="${attr(item.type)}" data-library-id="${attr(id)}"><a class="collection-item__thumb" href="${attr(item.url||'#')}" target="_blank" rel="noopener"><img src="${attr(image)}" alt="" loading="lazy"></a><a class="collection-item__main" href="${attr(item.url||'#')}" target="_blank" rel="noopener"><span class="collection-item__type">${esc(typeLabel(item.type))} / ${esc(meta)}</span><strong>${esc(title)}</strong><p>${esc(item.description||item.summary||'')}</p></a><button class="collection-item__remove" type="button" aria-label="저장 해제">×</button></article>`;
    }).join('')}</div>`;
  }
  function renderEmpty(tab,needle){
    return `<div class="collection-empty"><div class="collection-empty__icon">${collectionIcon()}</div><strong>${needle?'검색 결과가 없습니다.':'아직 저장한 항목이 없습니다.'}</strong><p>${tab==='video'?'실무 영상의 북마크 버튼을 누르면 여기에 모입니다.':tab==='article'?'읽어볼 글의 북마크 버튼을 누르면 여기에 모입니다.':tab==='question'?'본문에서 문장을 선택한 뒤 질문을 저장하면 여기에 표시됩니다.':'관심 있는 영상과 글, 질문을 저장해 두면 여기서 한 번에 찾을 수 있습니다.'}</p></div>`;
  }
  function renderCollectionShell(){
    return `<div id="collectionLayer" data-platform-module="collection-bottom-sheet">
      ${renderFab({domId:'collectionFab'})}
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
      </section>
    </div>`;
  }

  function hydrateCollection(host,props={},context={}){
    const layer=host.querySelector('#collectionLayer')||host;
    const sheet=$('#collectionSheet',layer),backdrop=$('#collectionBackdrop',layer),fab=$('#collectionFab',layer),close=$('#collectionClose',layer);
    const tabs=$$('.collection-tab',layer),search=$('#collectionSearch',layer),filters=$('#collectionFilters',layer),body=$('#collectionBody',layer),tools=$('#collectionTools',layer);
    if(!sheet||!backdrop||!fab||!body)return;

    let tab=String(props.activeTab||'all');
    let filter=String(props.activeFilter||'all');
    let needle=String(props.search||'');
    let lockedY=0,locked=false,closeTimer=0;
    const fixtureItems=Array.isArray(props.items)?props.items:FIXTURE_COLLECTION_ITEMS;
    const source=context.collectionSource&&typeof context.collectionSource.getItems==='function'
      ? context.collectionSource
      : {getItems:()=>fixtureItems,removeItem:()=>{},openQuestion:()=>{},openSettings:()=>{}};

    function items(){const value=source.getItems();return Array.isArray(value)?value:[];}
    function lockScroll(){
      if(locked)return;locked=true;lockedY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
      document.documentElement.classList.add('collection-open');document.body.classList.add('collection-open');document.body.style.top=`-${lockedY}px`;
    }
    function unlockScroll(){
      if(!locked)return;locked=false;document.documentElement.classList.remove('collection-open');document.body.classList.remove('collection-open');document.body.style.top='';window.scrollTo(0,lockedY);
    }
    function paintFilters(all){
      const options=filterOptions(all,tab);
      if(!options.length){filters.innerHTML='';filters.hidden=true;return;}
      if(!options.includes(filter))filter='all';
      filters.hidden=false;filters.innerHTML=renderFilterButtons(options,filter);
    }
    function paint(){
      const all=items();
      paintFilters(all);
      if(tools)tools.hidden=tab==='settings';
      tabs.forEach(button=>button.classList.toggle('is-active',button.dataset.libraryTab===tab));
      if(tab==='settings'){
        body.innerHTML=renderSettingsBody(all);
        layer.dispatchEvent(new CustomEvent('platform-collection-render',{bubbles:true,detail:{tab}}));
        return;
      }
      let visible=all.filter(item=>tab==='all'||item.type===tab);
      if(filter!=='all')visible=visible.filter(item=>(item.category||item.platform||'기타')===filter);
      const query=needle.trim().toLowerCase();
      if(query)visible=visible.filter(item=>`${itemTitle(item)} ${itemMeta(item)} ${item.summary||''} ${item.selected_text||''}`.toLowerCase().includes(query));
      body.innerHTML=visible.length?renderCollectionList(visible):renderEmpty(tab,query);
      layer.dispatchEvent(new CustomEvent('platform-collection-render',{bubbles:true,detail:{tab,filter,search:needle}}));
    }
    function open(nextTab=tab){
      clearTimeout(closeTimer);tab=String(nextTab||'all');filter='all';
      sheet.hidden=false;backdrop.hidden=false;requestAnimationFrame(()=>sheet.classList.add('is-open'));lockScroll();paint();
      layer.dispatchEvent(new CustomEvent('platform-collection-open',{bubbles:true,detail:{tab}}));
    }
    function shut(){
      sheet.classList.remove('is-open');backdrop.hidden=true;clearTimeout(closeTimer);
      closeTimer=setTimeout(()=>{sheet.hidden=true;unlockScroll();},190);
      layer.dispatchEvent(new CustomEvent('platform-collection-close',{bubbles:true}));
    }
    function onTab(event){
      const button=event.target.closest?.('.collection-tab[data-library-tab]');if(!button||!layer.contains(button))return;
      tab=button.dataset.libraryTab||'all';filter='all';paint();
      layer.dispatchEvent(new CustomEvent('platform-collection-tab',{bubbles:true,detail:{tab}}));
    }
    function onFilter(event){
      const button=event.target.closest?.('.collection-filter');if(!button||!filters.contains(button))return;
      filter=button.dataset.libraryFilter||'all';paint();
      layer.dispatchEvent(new CustomEvent('platform-filter-select',{bubbles:true,detail:{value:filter,button}}));
    }
    function onBody(event){
      const remove=event.target.closest?.('.collection-item__remove');
      if(remove){const card=remove.closest('.collection-item');source.removeItem?.(card?.dataset.libraryType||'',card?.dataset.libraryId||'');paint();return;}
      const question=event.target.closest?.('.collection-question-open');
      if(question){source.openQuestion?.(question.closest('.collection-item')?.dataset.libraryId||'');}
    }
    function onSettings(event){
      const link=event.target.closest?.('#collectionDeviceLink');
      if(link&&context.consumer==='public'&&source.openSettings&&link.dataset.deviceSafeV2!=='true')source.openSettings(link);
    }
    function onSearch(){needle=search?.value||'';paint();}

    fab.addEventListener('click',()=>open('all'));
    close?.addEventListener('click',shut);backdrop.addEventListener('click',shut);
    backdrop.addEventListener('touchmove',event=>event.preventDefault(),{passive:false});
    layer.addEventListener('click',onTab);filters.addEventListener('click',onFilter);body.addEventListener('click',onBody);body.addEventListener('click',onSettings);search?.addEventListener('input',onSearch);

    const handle=$('.collection-handle-wrap',sheet);
    let start=0,delta=0,dragging=false;
    const begin=y=>{dragging=true;start=y;delta=0;sheet.classList.add('is-dragging');};
    const move=y=>{if(!dragging)return;delta=Math.max(0,y-start);sheet.style.setProperty('--drag-y',`${delta}px`);};
    const end=()=>{if(!dragging)return;dragging=false;sheet.classList.remove('is-dragging');sheet.style.removeProperty('--drag-y');if(delta>86)shut();};
    const touchStart=event=>begin(event.touches[0].clientY);
    const touchMove=event=>{move(event.touches[0].clientY);if(delta>0)event.preventDefault();};
    const pointerDown=event=>{if(event.pointerType==='touch')return;begin(event.clientY);handle?.setPointerCapture?.(event.pointerId);};
    const pointerMove=event=>{if(dragging)move(event.clientY);};
    handle?.addEventListener('touchstart',touchStart,{passive:true});handle?.addEventListener('touchmove',touchMove,{passive:false});handle?.addEventListener('touchend',end,{passive:true});
    handle?.addEventListener('pointerdown',pointerDown);handle?.addEventListener('pointermove',pointerMove);handle?.addEventListener('pointerup',end);

    const api={open,close:shut,render:paint,getState:()=>({tab,filter,search:needle}),setState(next={}){if(has(next,'tab'))tab=String(next.tab||'all');if(has(next,'filter'))filter=String(next.filter||'all');if(has(next,'search')){needle=String(next.search||'');if(search)search.value=needle;}paint();}};
    layer.__platformCollectionController=api;host.__platformCollectionController=api;
    paint();if(props.open!==false)open(tab);

    return {
      api,
      cleanup(){
        clearTimeout(closeTimer);unlockScroll();
        layer.removeEventListener('click',onTab);filters.removeEventListener('click',onFilter);body.removeEventListener('click',onBody);body.removeEventListener('click',onSettings);search?.removeEventListener('input',onSearch);
        handle?.removeEventListener('touchstart',touchStart);handle?.removeEventListener('touchmove',touchMove);handle?.removeEventListener('touchend',end);handle?.removeEventListener('pointerdown',pointerDown);handle?.removeEventListener('pointermove',pointerMove);handle?.removeEventListener('pointerup',end);
      }
    };
  }

  window.PhotoPublicModuleSource={
    version:1,
    fixtures:{nav:FIXTURE_NAV,market:FIXTURE_MARKET,collectionItems:FIXTURE_COLLECTION_ITEMS},
    navigation:{render:renderNavigation,hydrate:hydrateNavigation},
    horizontalCardRail:{render:renderHorizontalCardRail},
    filterChipRail:{render:renderFilterRail,hydrate:hydrateFilterRail,filterOptions,renderButtons:renderFilterButtons},
    collectionBottomSheet:{render:renderCollectionShell,hydrate:hydrateCollection},
    deviceHandoff:{render:renderDeviceHandoff},
    floatingAction:{render:renderFab},
    collection:{icon:collectionIcon,renderSettingsBody,renderCollectionList,renderEmpty,itemTitle,itemMeta,itemImage,typeLabel}
  };
})();
