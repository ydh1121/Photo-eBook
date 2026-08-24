(function(){
  const registry=window.PlatformModuleRegistry;
  if(!registry||window.__photoCorePlatformModulesV1)return;
  window.__photoCorePlatformModulesV1=true;

  const esc=registry.escapeHtml;
  const attr=registry.attr;
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);

  const DEFAULT_NAV=[
    {id:'intro',label:'시작'},{id:'market',label:'시장'},{id:'education',label:'교육'},{id:'skills',label:'실무'},
    {id:'portfolio',label:'포트폴리오'},{id:'gear',label:'장비'},{id:'plan',label:'수익'},{id:'scripts',label:'영업'},
    {id:'iphone',label:'아이폰'},{id:'sources',label:'자료'}
  ];
  const DEFAULT_FILTERS=[
    {id:'all',label:'전체'},{id:'product',label:'제품 촬영'},{id:'portrait',label:'인물 촬영'},{id:'food',label:'음식 촬영'}
  ];
  const DEFAULT_CARDS=[
    {rank:'1',title:'제품 / 쇼핑몰 / 브랜드 촬영',image:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',alt:'제품 촬영',leftLabel:'초보 단가',leftValue:'10~30만/건',rightLabel:'목표 단가',rightValue:'30~80만/건',meta:'스마트스토어 / 자사몰 / 소형 브랜드'},
    {rank:'2',title:'기업 / 전문직 프로필',image:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',alt:'인물 촬영',leftLabel:'초보 단가',leftValue:'10~20만/건',rightLabel:'목표 단가',rightValue:'20~50만/건',meta:'대표 / 강사 / 의사 / 회사 임직원'},
    {rank:'3',title:'매장 / 음식 / 공간 촬영',image:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',alt:'음식 촬영',leftLabel:'초보 단가',leftValue:'12~30만/건',rightLabel:'목표 단가',rightValue:'30~70만/건',meta:'식당 / 카페 / 병원 / 숙소 / 인테리어'},
    {rank:'4',title:'브랜드 콘텐츠 패키지',image:'/assets/images/generated/v1/portfolio/studio-process.webp?v=b007',alt:'작업 과정',leftLabel:'구성',leftValue:'사진 + 숏폼',rightLabel:'활용',rightValue:'SNS / 광고',meta:'반복 제작과 장기 운영을 확인합니다.'}
  ];

  function collectionIcon(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 4.2h9.4c1.2 0 2.1.9 2.1 2.1v11.4c0 1.2-.9 2.1-2.1 2.1H7.3c-1.2 0-2.1-.9-2.1-2.1V6.3c0-1.2.9-2.1 2.1-2.1Z"/><path d="M9 4.2V2.8h6v1.4M9.1 8.2h5.8M9.1 11.7h5.8M9.1 15.2h3.8"/></svg>';
  }

  function normalizeNav(items){
    const source=Array.isArray(items)&&items.length?items:DEFAULT_NAV;
    return source.map((item,index)=>({
      id:String(item?.id||item?.target||`chapter-${index}`),
      label:String(item?.label||item?.['칩']||item?.title||`메뉴 ${index+1}`)
    }));
  }

  function normalizeFilters(items){
    const source=Array.isArray(items)?items:DEFAULT_FILTERS;
    return source.map((item,index)=>{
      if(item&&typeof item==='object')return {id:String(item.id||item.value||`filter-${index}`),label:String(item.label||item.value||`필터 ${index+1}`),family:String(item.family||'inherit')};
      return {id:`filter-${index}`,label:String(item),family:'inherit'};
    });
  }

  function renderNav(props={},context={}){
    const items=normalizeNav(props.items);
    const activeIndex=Math.max(0,Math.min(items.length-1,Number(props.activeIndex||0)));
    const nav=`<div class="nav-placeholder" aria-hidden="true"></div><div class="nav-shell" data-platform-module="top-chapter-navigation">
      <nav class="nav-scroll" aria-label="${attr(props.ariaLabel||'챕터')}">
        ${items.map((item,index)=>`<button class="nav-chip ${index===activeIndex?'is-active':''}" data-target="${attr(item.id)}">${esc(item.label)}</button>`).join('')}
      </nav>
      <div class="read-progress"><div class="read-progress__bar"></div></div>
    </div>`;
    if(context.consumer==='public')return nav;
    return `${nav}<div class="platform-module-nav-targets" aria-hidden="true">${items.map(item=>`<section id="${attr(item.id)}" class="chapter" data-chapter="${attr(item.id)}"></section>`).join('')}</div>`;
  }

  function renderFilterButtons(items,activeId){
    return items.map(item=>`<button type="button" data-library-filter="${attr(item.id)}" data-platform-chip-override="${attr(item.family)}" class="collection-filter ${item.id===activeId?'is-active':''}">${esc(item.label)}</button>`).join('');
  }

  function renderFilterRail(props={}){
    const items=normalizeFilters(props.items);
    const activeId=String(props.activeId||items[0]?.id||'');
    const buttons=renderFilterButtons(items,activeId);
    if(props.innerOnly===true)return buttons;
    const id=props.domId===false?'':` id="${attr(props.domId||'collectionFilters')}"`;
    return `<div${id} class="collection-filters" data-platform-module="filter-chip-rail">${buttons}</div>`;
  }

  function hydrateFilterRail(host){
    const root=host.matches?.('.collection-filters')?host:host.querySelector('.collection-filters');
    if(!root||root.dataset.platformModuleBound==='true')return;
    root.dataset.platformModuleBound='true';
    const click=event=>{
      const button=event.target.closest?.('.collection-filter');
      if(!button||!root.contains(button))return;
      root.querySelectorAll('.collection-filter').forEach(chip=>chip.classList.toggle('is-active',chip===button));
      root.dispatchEvent(new CustomEvent('platform-filter-select',{bubbles:true,detail:{id:button.dataset.libraryFilter||'',button}}));
    };
    root.addEventListener('click',click);
    return ()=>root.removeEventListener('click',click);
  }

  function renderCardRail(props={}){
    const items=Array.isArray(props.items)&&props.items.length?props.items:DEFAULT_CARDS;
    return `<div class="scroll-row" data-platform-module="horizontal-card-rail" aria-label="${attr(props.ariaLabel||'가로 카드')}">${items.map((item,index)=>`<article class="market-card">
      <div class="market-card__image"><img src="${attr(item.image||'')}" alt="${attr(item.alt||item.title||'카드 이미지')}"></div>
      <div class="market-card__body"><div class="market-rank">TOP ${esc(item.rank||index+1)}</div><h3>${esc(item.title||'')}</h3>
      <div class="market-card__prices"><div class="market-card__price"><span>${esc(item.leftLabel||'')}</span><b>${esc(item.leftValue||'')}</b></div><div class="market-card__price"><span>${esc(item.rightLabel||'')}</span><b>${esc(item.rightValue||'')}</b></div></div>
      <div class="market-card__customer">${esc(item.meta||'')}</div></div>
    </article>`).join('')}</div>`;
  }

  function renderDeviceRow(props={}){
    return `<button class="collection-setting-row" id="collectionDeviceLink" data-platform-module="device-handoff-accordion" type="button" aria-expanded="false"><span><strong>${esc(props.title||'다른 기기에서 이어보기')}</strong><small>${esc(props.description||'저장한 질문을 다른 기기에서도 확인할 수 있게 연결합니다.')}</small></span><b>›</b></button>`;
  }

  function renderFab(props={}){
    return `<button id="${attr(props.domId||'collectionFab')}" class="collection-fab" data-platform-module="floating-action" type="button" aria-label="${attr(props.ariaLabel||'내 모음 열기')}">${collectionIcon()}<span id="collectionFabCount" class="collection-fab__count" hidden>0</span></button>`;
  }

  function renderCollectionShell(props={}){
    const activeTab=String(props.activeTab||'all');
    const tabs=[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']];
    const filterMarkup=renderFilterRail({items:Array.isArray(props.filterItems)?props.filterItems:DEFAULT_FILTERS,activeId:props.activeFilter||'all'});
    const defaultBody='<div class="collection-empty"><div class="collection-empty__icon">'+collectionIcon()+'</div><strong>아직 저장한 항목이 없습니다.</strong><p>관심 있는 영상과 글, 질문을 저장해 두면 여기서 한 번에 찾을 수 있습니다.</p></div>';
    const bodyMarkup=has(props,'bodyHtml')?String(props.bodyHtml||''):defaultBody;
    return `<div id="collectionLayer" data-platform-module="collection-bottom-sheet">
      ${renderFab({domId:'collectionFab'})}
      <div id="collectionBackdrop" class="collection-backdrop" ${props.open?'':'hidden'}></div>
      <section id="collectionSheet" class="collection-sheet ${props.open?'is-open':''}" ${props.open?'':'hidden'} aria-label="내 모음">
        <div class="collection-handle-wrap"><div class="collection-handle"></div></div>
        <div class="collection-head"><div><small>저장한 항목과 질문을 한곳에서</small><h2>내 모음</h2></div><button id="collectionClose" class="collection-close" type="button" aria-label="닫기">×</button></div>
        <div class="collection-tabs" role="tablist">${tabs.map(([id,label])=>`<button class="collection-tab ${id===activeTab?'is-active':''}" data-library-tab="${id}" type="button">${label}</button>`).join('')}</div>
        <div class="collection-tools" id="collectionTools"><label class="collection-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input id="collectionSearch" type="search" placeholder="저장한 항목 검색" autocomplete="off"></label>${filterMarkup}</div>
        <div id="collectionBody" class="collection-body">${bodyMarkup}</div>
      </section>
    </div>`;
  }

  function hydrateCollectionPreview(host,props={},context={}){
    if(context.consumer==='public')return;
    const layer=host.querySelector('#collectionLayer')||host;
    const sheet=layer.querySelector('#collectionSheet');
    const backdrop=layer.querySelector('#collectionBackdrop');
    const fab=layer.querySelector('#collectionFab');
    const close=layer.querySelector('#collectionClose');
    function open(){if(sheet){sheet.hidden=false;requestAnimationFrame(()=>sheet.classList.add('is-open'));}if(backdrop)backdrop.hidden=false;}
    function shut(){sheet?.classList.remove('is-open');if(backdrop)backdrop.hidden=true;}
    fab?.addEventListener('click',open);close?.addEventListener('click',shut);backdrop?.addEventListener('click',shut);
    layer.querySelectorAll('.collection-tab').forEach(button=>button.addEventListener('click',()=>{
      layer.querySelectorAll('.collection-tab').forEach(tab=>tab.classList.toggle('is-active',tab===button));
      layer.dataset.previewTab=button.dataset.libraryTab||'all';
      layer.dispatchEvent(new CustomEvent('platform-collection-tab',{bubbles:true,detail:{tab:button.dataset.libraryTab||'all'}}));
    }));
    const filterHost=layer.querySelector('.collection-filters');if(filterHost)hydrateFilterRail(filterHost);
    if(props.open!==false)open();
  }

  const publicOwners={
    nav:['public/content-packs/photography/runtime/chapter-renderers.js','public/assets/js/navigation/chapter-navigation.js','public/assets/styles/desktop/nav-corrections.css'],
    card:['public/content-packs/photography/runtime/chapter-renderers.js','public/assets/js/desktop/rail-drag.js','public/assets/styles/collection/horizontal-rails.css'],
    collection:['public/assets/js/collection/collection-hub.js','public/assets/styles/collection/hub.css'],
    device:['public/assets/js/collection/device-handoff.js','public/assets/styles/collection/device-accordion.css']
  };

  registry.register({id:'top-chapter-navigation',label:'상단 메뉴',category:'navigation',status:'approved',source:'public-extracted',sourceRoute:'/',consumers:['public','library','editor'],version:2,ownerFiles:publicOwners.nav,previewProps:{items:DEFAULT_NAV},editorProps:{items:DEFAULT_NAV},render:renderNav,hydrate(host,props,context){if(context.consumer==='library'&&typeof window.setupNavigation==='function')requestAnimationFrame(()=>window.setupNavigation());}});
  registry.register({id:'filter-chip-rail',label:'범용 필터칩',category:'navigation',status:'approved',source:'public-extracted',sourceRoute:'/',consumers:['public','library','editor'],version:2,ownerFiles:publicOwners.collection,previewProps:{items:DEFAULT_FILTERS,activeId:'all'},editorProps:{items:DEFAULT_FILTERS,activeId:'all',domId:false},render:renderFilterRail,hydrate:hydrateFilterRail});
  registry.register({id:'horizontal-card-rail',label:'가로 카드',category:'content',status:'approved',source:'public-extracted',sourceRoute:'/',consumers:['public','library','editor'],version:2,ownerFiles:publicOwners.card,previewProps:{items:DEFAULT_CARDS},editorProps:{items:DEFAULT_CARDS},render:renderCardRail});
  registry.register({id:'collection-bottom-sheet',label:'하단 팝업',category:'overlay',status:'approved',source:'public-extracted',sourceRoute:'/',consumers:['public','library','editor'],version:2,ownerFiles:publicOwners.collection,previewProps:{open:true,activeTab:'all',filterItems:DEFAULT_FILTERS},editorProps:{open:true,activeTab:'all',filterItems:DEFAULT_FILTERS},render:renderCollectionShell,hydrate:hydrateCollectionPreview});
  registry.register({id:'device-handoff-accordion',label:'다른 기기',category:'overlay',status:'approved',source:'public-extracted',sourceRoute:'/',consumers:['public','library','editor'],version:2,ownerFiles:publicOwners.device,previewProps:{},editorProps:{},render:renderDeviceRow,hydrate(host,props,context){if(context.consumer==='library'&&typeof window.dispatchEvent==='function')setTimeout(()=>window.dispatchEvent(new Event('pageshow')),0);}});
  registry.register({id:'floating-action',label:'플로팅 버튼',category:'action',status:'approved',source:'public-extracted',sourceRoute:'/',consumers:['public','library','editor'],version:2,ownerFiles:publicOwners.collection,previewProps:{domId:'collectionFabPreview'},editorProps:{domId:'collectionFabPreview'},render:renderFab});
})();
