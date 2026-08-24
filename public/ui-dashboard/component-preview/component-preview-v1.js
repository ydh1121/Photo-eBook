(function(){
  if(window.__platformComponentPreviewV1)return;
  window.__platformComponentPreviewV1=true;

  const params=new URLSearchParams(location.search);
  const component=params.get('component')||'top-chapter-navigation';
  const root=document.querySelector('#componentPreviewRoot');
  const validComponents=new Set(['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action']);
  let config={};
  let state=component==='device-handoff-accordion'?'collapsed':component==='collection-bottom-sheet'?'all':'';
  let filterItems=['전체','제품 촬영','인물 촬영','음식 촬영'];
  let filterOverrides={};
  let activeFilterIndex=0;
  let resizeObserver=null;

  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
  const has=(key)=>Object.prototype.hasOwnProperty.call(config,key);
  const family=()=>['material-flat','ios-flat','ios-liquid'].includes(config.family)?config.family:'ios-flat';
  const accent=()=>String(config.accentColor||'#437ce7');

  function surface(content,extraClass=''){
    root.innerHTML=`<section class="component-preview-surface ${extraClass}">${content}</section>`;
  }

  function applyRootTheme(theme){
    const resolved=theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;
    document.documentElement.dataset.theme=resolved;
    root.dataset.theme=resolved;
  }

  function applyVars(){
    root.style.setProperty('--preview-accent',accent());
    root.style.setProperty('--preview-chip-gap',`${clamp(has('gap')?config.gap:9,0,32)}px`);
    root.style.setProperty('--preview-rail-top',`${clamp(has('railPaddingTop')?config.railPaddingTop:5.5,0,40)}px`);
    root.style.setProperty('--preview-rail-right',`${clamp(has('railPaddingRight')?config.railPaddingRight:5.5,0,64)}px`);
    root.style.setProperty('--preview-rail-bottom',`${clamp(has('railPaddingBottom')?config.railPaddingBottom:5.5,0,40)}px`);
    root.style.setProperty('--preview-rail-left',`${clamp(has('railPaddingLeft')?config.railPaddingLeft:5.5,0,64)}px`);
    root.style.setProperty('--preview-chip-y',`${clamp(has('chipPaddingY')?config.chipPaddingY:7,2,24)}px`);
    root.style.setProperty('--preview-chip-x',`${clamp(has('chipPaddingX')?config.chipPaddingX:10,4,36)}px`);
    root.style.setProperty('--preview-backdrop-blur',`${clamp(config.backdropBlur??12,0,40)}px`);
    root.style.setProperty('--preview-sheet-width',`${clamp(config.maxWidth??760,360,1100)}px`);
    root.style.setProperty('--preview-sheet-height',`${clamp(config.maxHeightDvh??84,50,96)}dvh`);
    root.style.setProperty('--preview-sheet-radius',`${clamp(config.radiusTop??30,0,50)}px`);
  }

  function post(type,payload={}){
    try{window.parent?.postMessage({type,capabilityId:component,...payload},location.origin);}catch{}
  }

  function renderTopNavigation(){
    const navFamily=['material-flat','ios-flat','ios-liquid'].includes(config.family)?config.family:'ios-liquid';
    const labels=['시작','시장','교육','실무','포트폴리오','장비','수익','영업','아이폰','자료'];
    surface(`<div class="component-top-nav" data-family="${navFamily}">
      <nav class="component-top-nav__rail" aria-label="챕터">${labels.map((label,index)=>`<button type="button" class="nav-chip${index===0?' is-active':''}" data-index="${index}">${esc(label)}</button>`).join('')}</nav>
      ${config.progressEnabled===false?'':`<div class="component-top-nav__progress"><span></span></div>`}
    </div>`);
    root.querySelectorAll('.nav-chip').forEach(button=>button.addEventListener('click',()=>{
      root.querySelectorAll('.nav-chip').forEach(node=>node.classList.toggle('is-active',node===button));
      const progress=root.querySelector('.component-top-nav__progress>span');
      if(progress)progress.style.width=`${Math.max(8,((Number(button.dataset.index)+1)/labels.length)*100)}%`;
    }));
  }

  function renderCardRail(){
    const cards=[
      ['/assets/images/generated/v1/portfolio/product-brand.webp?v=b007','제품 촬영','상품 상세페이지와 브랜드 콘텐츠용 촬영'],
      ['/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007','인물 촬영','프로필과 기업 인터뷰용 촬영'],
      ['/assets/images/generated/v1/portfolio/food-store.webp?v=b007','음식 촬영','메뉴와 매장 홍보용 촬영'],
      ['/assets/images/generated/v1/portfolio/studio-process.webp?v=b007','작업 과정','촬영 준비와 현장 진행 과정']
    ];
    surface(`<div class="component-card-window" data-right-fade="${config.rightFade!==false}"><div class="component-card-rail">${cards.map(([src,title,copy],index)=>`<article class="component-card"><img src="${src}" alt=""><div class="component-card__body"><small>SAMPLE ${String(index+1).padStart(2,'0')}</small><h3>${esc(title)}</h3><p>${esc(copy)}</p></div></article>`).join('')}</div></div>`);
    const rail=root.querySelector('.component-card-rail');
    if(rail){
      rail.style.paddingLeft=`${clamp(config.leftPaintRunway??16,0,80)}px`;
      rail.style.paddingRight=`${clamp(config.rightContentPadding??122,0,220)}px`;
      rail.style.scrollbarWidth=config.scrollbar==='auto'?'auto':'none';
    }
  }

  function activeFamily(){
    const label=filterItems[activeFilterIndex]||filterItems[0];
    const override=filterOverrides[label];
    return ['material-flat','ios-flat','ios-liquid'].includes(override)?override:family();
  }

  function syncFilterOverlay({scrollIntoView=false}={}){
    const stage=root.querySelector('.component-chip-stage');
    const viewport=root.querySelector('.component-chip-viewport');
    const rail=root.querySelector('.collection-filters');
    const active=rail?.querySelector('.collection-filter.is-active');
    const overlay=root.querySelector('.component-chip-active');
    if(!stage||!viewport||!rail||!active||!overlay)return;
    if(scrollIntoView)active.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
    requestAnimationFrame(()=>{
      const viewportRect=viewport.getBoundingClientRect();
      const activeRect=active.getBoundingClientRect();
      const x=activeRect.left-viewportRect.left;
      const y=activeRect.top-viewportRect.top;
      overlay.dataset.family=activeFamily();
      overlay.textContent=active.textContent||'';
      overlay.style.width=`${activeRect.width}px`;
      overlay.style.height=`${activeRect.height}px`;
      overlay.style.transform=`translate3d(${x}px,${y}px,0)`;
      overlay.classList.add('is-ready');
    });
  }

  function renderFilterRail(){
    const labels=filterItems.length?filterItems:['전체'];
    if(activeFilterIndex>=labels.length)activeFilterIndex=0;
    const currentFamily=family();
    const selectedLabel=labels[activeFilterIndex]||labels[0];
    const selectedOverride=filterOverrides[selectedLabel]||'inherit';
    surface(`<div class="component-chip-stage" data-family="${currentFamily}">
      <div class="component-chip-viewport">
        <div class="collection-filters" role="tablist" aria-label="필터">${labels.map((label,index)=>`<button type="button" class="collection-filter${index===activeFilterIndex?' is-active':''}" role="tab" data-index="${index}" data-chip-family="${esc(filterOverrides[label]||'inherit')}">${esc(label)}</button>`).join('')}</div>
        <button type="button" class="component-chip-active" aria-hidden="true" data-family="${activeFamily()}">${esc(selectedLabel)}</button>
      </div>
      <div class="component-chip-note"><span>레일은 가로 스크롤만 담당합니다.</span><strong>${esc(selectedLabel)} · ${selectedOverride==='inherit'?'공통 스타일':selectedOverride}</strong></div>
    </div>`);
    const rail=root.querySelector('.collection-filters');
    rail?.addEventListener('scroll',()=>syncFilterOverlay(),{passive:true});
    root.querySelectorAll('.collection-filter').forEach(button=>button.addEventListener('click',()=>{
      activeFilterIndex=Number(button.dataset.index)||0;
      root.querySelectorAll('.collection-filter').forEach(node=>node.classList.toggle('is-active',node===button));
      syncFilterOverlay({scrollIntoView:true});
      post('platform-filter-chip-selection-change',{label:filterItems[activeFilterIndex],index:activeFilterIndex,override:filterOverrides[filterItems[activeFilterIndex]]||'inherit'});
      const note=root.querySelector('.component-chip-note strong');
      if(note)note.textContent=`${filterItems[activeFilterIndex]} · ${filterOverrides[filterItems[activeFilterIndex]]||'공통 스타일'}`;
    }));
    resizeObserver?.disconnect();
    resizeObserver=new ResizeObserver(()=>syncFilterOverlay());
    const viewport=root.querySelector('.component-chip-viewport');
    if(viewport)resizeObserver.observe(viewport);
    requestAnimationFrame(()=>syncFilterOverlay());
    setTimeout(()=>syncFilterOverlay(),80);
  }

  function tabLabel(value){return {all:'전체',video:'영상',article:'읽을거리',question:'질문',settings:'설정'}[value]||'전체';}
  function listItems(kind){
    if(kind==='question')return [
      ['Q','촬영 견적은 어떤 기준으로 잡아야 하나요?','견적 기준을 정리해 둔 질문'],
      ['Q','초기 장비는 어디까지 사야 하나요?','장비 구매 순서를 정리한 질문']
    ].map(([icon,title,copy])=>`<article class="collection-item collection-item--question"><div class="collection-item__question-icon">${icon}</div><button type="button" class="collection-item__main"><strong>${esc(title)}</strong><p>${esc(copy)}</p></button><button type="button" class="collection-item__remove" aria-label="삭제">×</button></article>`).join('');
    const source=kind==='video'?
      [['영상','조명 한 개로 제품 촬영하기'],['영상','프로필 촬영 구도 정리']]:kind==='article'?
      [['읽을거리','초기 견적표를 만드는 방법'],['읽을거리','재구매 고객 관리 체크리스트']]:
      [['영상','제품 촬영 기본 세팅'],['읽을거리','초기 견적표 만들기'],['질문','첫 고객을 어디서 찾을까요?']];
    return source.map(([type,title],index)=>`<article class="collection-item"><div class="collection-item__thumb">${index+1}</div><button type="button" class="collection-item__main"><span class="collection-item__type">${esc(type)}</span><strong>${esc(title)}</strong><p>미리보기용 저장 항목입니다.</p><small>방금 저장</small></button><button type="button" class="collection-item__remove" aria-label="삭제">×</button></article>`).join('');
  }

  function deviceAccordionMarkup(expanded=false){
    return `<section class="collection-device-accordion${expanded?' is-expanded':''}" data-preview-device>
      <button type="button" class="collection-device-link" data-device-toggle aria-expanded="${expanded}"><span><strong>다른 기기에서 이어보기</strong><small>저장한 글을 다른 기기에서도 바로 열 수 있습니다.</small></span><span aria-hidden="true">›</span></button>
      <div class="component-device-panel" data-device-panel ${expanded?'':'hidden'}><div class="collection-device-panel"><p>연결 코드</p><strong>8K2F-19QX</strong><div><button type="button">코드 복사</button><button type="button">기기 연결</button></div></div></div>
    </section>`;
  }

  function settingsMarkup(){
    return `<div class="collection-settings"><div class="collection-settings__summary"><strong>23</strong><span>저장한 항목</span><small>영상 4</small><small>읽을거리 11</small><small>질문 8</small></div><section class="collection-setting-card"><strong>화면 모드</strong><p>관리단 미리보기의 색상 모드와 함께 확인합니다.</p></section>${config.deviceHandoff===false?'':deviceAccordionMarkup(false)}</div>`;
  }

  function renderBottomSheet(){
    const current=['all','video','article','question','settings'].includes(state)?state:'all';
    const showSearch=config.search!==false&&current!=='settings';
    const showFilters=config.filters!==false&&['all','video'].includes(current);
    const body=current==='settings'?settingsMarkup():`<div class="collection-list">${listItems(current)}</div>`;
    root.innerHTML=`<div class="component-bottom-sheet-scene">
      ${config.backdrop===false?'':'<div class="collection-backdrop"></div>'}
      <section class="collection-sheet is-open" aria-label="내 모음">
        ${config.handle===false?'':'<div class="collection-handle-wrap"><span class="collection-handle"></span></div>'}
        <header class="collection-head"><div><small>저장한 항목을 한곳에서</small><h2>내 모음</h2></div><button type="button" class="collection-close" aria-label="닫기">×</button></header>
        ${config.tabs===false?'':`<nav class="collection-tabs" aria-label="내 모음 메뉴">${['all','video','article','question','settings'].map(value=>`<button type="button" class="collection-tab${value===current?' is-active':''}" data-tab="${value}">${tabLabel(value)}</button>`).join('')}</nav>`}
        <div class="collection-tools" ${showSearch||showFilters?'':'hidden'}>${showSearch?'<label class="collection-search"><span>⌕</span><input type="search" placeholder="저장한 항목 검색"></label>':''}${showFilters?`<div class="collection-filters"><button class="collection-filter is-active">전체</button><button class="collection-filter">제품 촬영</button><button class="collection-filter">인물 촬영</button><button class="collection-filter">음식 촬영</button></div>`:''}</div>
        <div class="collection-body">${body}</div>
      </section>
    </div>`;
    root.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
      state=button.dataset.tab||'all';
      renderBottomSheet();
      post('platform-preview-state-change',{state});
    }));
    bindDeviceAccordion();
  }

  function bindDeviceAccordion(){
    root.querySelectorAll('[data-device-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const panel=button.closest('[data-preview-device]')?.querySelector('[data-device-panel]');
      if(!panel)return;
      const expanded=button.getAttribute('aria-expanded')!=='true';
      button.setAttribute('aria-expanded',String(expanded));
      panel.hidden=!expanded;
      button.closest('[data-preview-device]')?.classList.toggle('is-expanded',expanded);
      if(component==='device-handoff-accordion'){
        state=expanded?'expanded':'collapsed';
        post('platform-preview-state-change',{state});
      }
    }));
  }

  function renderDeviceAccordion(){
    surface(`<div class="component-device-wrap">${deviceAccordionMarkup(state==='expanded')}</div>`);
    bindDeviceAccordion();
  }

  function renderFloatingAction(){
    const fabFamily=['flat','glass','liquid'].includes(config.family)?config.family:'glass';
    surface(`<div class="component-fab-scene" data-family="${fabFamily}"><button type="button" class="collection-fab" aria-label="내 모음"><span aria-hidden="true">▤</span><span class="collection-fab__count">23</span></button></div>`);
    const fab=root.querySelector('.collection-fab');
    if(fab)fab.style.background=`linear-gradient(145deg,${accent()},color-mix(in srgb,${accent()} 82%,#183c8b 18%))`;
  }

  function render(){
    applyVars();
    if(!validComponents.has(component)){surface('<p class="component-preview-empty">지원하지 않는 UI입니다.</p>');return;}
    if(component==='top-chapter-navigation')renderTopNavigation();
    else if(component==='horizontal-card-rail')renderCardRail();
    else if(component==='filter-chip-rail')renderFilterRail();
    else if(component==='collection-bottom-sheet')renderBottomSheet();
    else if(component==='device-handoff-accordion')renderDeviceAccordion();
    else if(component==='floating-action')renderFloatingAction();
    applyVars();
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-theme'){applyRootTheme(data.theme||'light');return;}
    if(data.capabilityId&&data.capabilityId!==component)return;
    if(data.type==='platform-ui-reset'){config={};render();return;}
    if(data.type==='platform-ui-config'){config={...(data.config||{})};render();return;}
    if(data.type==='platform-kit-state'){
      state=String(data.state||'');render();return;
    }
    if(data.type==='platform-filter-chip-preview-items'&&component==='filter-chip-rail'){
      const next=Array.isArray(data.labels)?data.labels.map(value=>String(value||'').trim()).filter(Boolean).slice(0,24):[];
      if(next.length)filterItems=next;
      activeFilterIndex=Math.min(activeFilterIndex,Math.max(0,filterItems.length-1));
      render();return;
    }
    if(data.type==='platform-filter-chip-item-overrides'&&component==='filter-chip-rail'){
      filterOverrides=data.overrides&&typeof data.overrides==='object'?{...data.overrides}:{};
      render();return;
    }
    if(data.type==='platform-filter-chip-select'&&component==='filter-chip-rail'){
      const index=filterItems.indexOf(String(data.label||''));
      if(index>=0){activeFilterIndex=index;render();}
    }
  });

  applyRootTheme('light');
  render();
  post('platform-component-preview-ready');
})();
