(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest)return;

  const STORAGE_KEY='platformUiCapabilityPresetsV1';
  const root=document.querySelector('.ui-dashboard');
  const list=document.querySelector('#uiCapabilityList');
  const workspace=document.querySelector('#uiWorkspace');
  const presetList=document.querySelector('#uiPresetList');
  const presetName=document.querySelector('#uiPresetName');
  const savePresetButton=document.querySelector('#uiPresetSave');
  const exportButton=document.querySelector('#uiPresetExport');
  if(!root||!list||!workspace||!presetList)return;

  const VALUE_LABELS={
    'deferred-sticky':'스크롤 후 고정',sticky:'항상 고정',static:'고정 안 함',
    'material-flat':'Material 플랫','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',
    'chapter-wash':'메뉴 배경 채움',line:'얇은 진행선',
    calm:'차분함',standard:'기본 반응',lively:'빠르고 경쾌함',
    none:'없음',low:'약하게',medium:'보통',high:'강하게',
    'alpha-mask':'투명 페이드',hidden:'숨김',auto:'필요할 때 표시',
    measured:'내용 높이에 맞춤',flat:'플랫',glass:'글래스',liquid:'리퀴드',
    candidate:'검토 중',draft:'미결정',approved:'승인',redesign:'재설계',deprecated:'폐기'
  };
  const CATEGORY_LABELS={navigation:'탐색', 'content-motion':'가로 콘텐츠',selector:'선택',overlay:'팝업',interaction:'상호작용',status:'상태 표시',action:'빠른 동작'};
  const SOURCE_LABELS={'photography-extracted':'사진 페이지에서 추출',platform:'플랫폼 공통',system:'플랫폼 기본',user:'직접 저장',server:'서버 저장'};
  const GROUP_LABELS={basic:'기본 설정',advanced:'고급 설정',motion:'움직임',safety:'안전 설정',input:'입력 방식','left-edge':'왼쪽 가장자리','right-edge':'오른쪽 가장자리',visibility:'표시 방식',default:'기본 설정'};

  const state={currentId:manifest.capabilities[0]?.id||'',configs:new Map(),saved:readSaved()};
  for(const capability of manifest.capabilities)state.configs.set(capability.id,defaultsFor(capability));

  function readSaved(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function writeSaved(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.saved));}catch{}}
  function current(){return manifest.capabilities.find(item=>item.id===state.currentId)||manifest.capabilities[0];}
  function defaultsFor(capability){const config={};for(const control of capability.controls||[])config[control.id]=control.default;return config;}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function unitValue(control,value){return `${value}${control.unit||''}`;}
  function valueLabel(value){return VALUE_LABELS[value]||String(value??'');}
  function categoryLabel(value){return CATEGORY_LABELS[value]||String(value??'');}
  function sourceLabel(value){return SOURCE_LABELS[value]||String(value??'');}
  function statusLabel(value){return VALUE_LABELS[value]||String(value??'');}
  function motionMs(response,scale=1){const base=response==='calm'?460:response==='lively'?190:300;return Math.round(base*Number(scale||1));}
  function overshootScale(value){return value==='high'?1.08:value==='medium'?1.05:value==='low'?1.025:1;}

  function renderList(){
    list.innerHTML=manifest.capabilities.map(item=>`<button type="button" class="ui-capability-item" data-capability-id="${escapeHtml(item.id)}" aria-pressed="${item.id===state.currentId?'true':'false'}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(statusLabel(item.status))}</span></button>`).join('');
    list.querySelectorAll('[data-capability-id]').forEach(button=>button.addEventListener('click',()=>{state.currentId=button.dataset.capabilityId;render();}));
  }

  function controlMarkup(control,value){
    const disabled=control.locked?'disabled':'';
    const group=control.group?` data-control-group="${escapeHtml(control.group)}"`:'';
    const lock=control.locked?'<em class="ui-control-lock">고정</em>':'';
    if(control.type==='boolean')return `<label class="ui-control ui-control--boolean"${group}><span>${escapeHtml(control.label)}${lock}</span><span class="ui-switch"><input type="checkbox" data-ui-control="${escapeHtml(control.id)}" ${value?'checked':''} ${disabled}><i></i></span></label>`;
    if(control.type==='enum')return `<label class="ui-control"${group}><span>${escapeHtml(control.label)}${lock}</span><select data-ui-control="${escapeHtml(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${escapeHtml(option)}" ${option===value?'selected':''}>${escapeHtml(valueLabel(option))}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="ui-control"${group}><span>${escapeHtml(control.label)}${lock}</span><input type="color" data-ui-control="${escapeHtml(control.id)}" value="${escapeHtml(value||'#315fc9')}" ${disabled}></label>`;
    if(control.type==='range'||control.type==='number')return `<label class="ui-control"${group}><span>${escapeHtml(control.label)} ${lock}<small data-ui-value-for="${escapeHtml(control.id)}">${escapeHtml(unitValue(control,value))}</small></span><input type="${control.type==='range'?'range':'number'}" data-ui-control="${escapeHtml(control.id)}" value="${escapeHtml(value)}" min="${escapeHtml(control.min??0)}" max="${escapeHtml(control.max??100)}" step="${escapeHtml(control.step??1)}" ${disabled}></label>`;
    return `<label class="ui-control"${group}><span>${escapeHtml(control.label)}${lock}</span><input type="text" data-ui-control="${escapeHtml(control.id)}" value="${escapeHtml(value||'')}" ${disabled}></label>`;
  }

  function controlsMarkup(capability,config){
    const groups=new Map();
    for(const control of capability.controls||[]){const key=control.group||'default';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(control);}
    return [...groups.entries()].map(([group,controls])=>`<section class="ui-control-group"><header><strong>${escapeHtml(GROUP_LABELS[group]||'설정')}</strong>${group==='safety'?'<span>안전 동작은 수정할 수 없습니다</span>':''}</header><div class="ui-control-grid">${controls.map(control=>controlMarkup(control,config[control.id])).join('')}</div></section>`).join('');
  }

  function summaryItems(capability,config){
    switch(capability.id){
      case 'top-chapter-navigation':return [config.enabled?'사용 중':'사용 안 함',valueLabel(config.stickyMode),valueLabel(config.chipFamily),config.progressEnabled?valueLabel(config.progressMode):'진행 표시 없음'];
      case 'horizontal-card-rail':return [config.desktopDrag?'PC 드래그 사용':'PC 드래그 안 함',config.rightFade?'오른쪽 페이드':'오른쪽 페이드 없음',`끝 여백 ${Number(config.rightContentPadding||0)}px`,`스크롤바 ${valueLabel(config.scrollbar)}`];
      case 'filter-chip-rail':return [valueLabel(config.family),`반응 ${valueLabel(config.response)}`,`튕김 ${valueLabel(config.overshoot)}`,`칩 간격 ${Number(config.gap||0)}px`];
      case 'collection-bottom-sheet':return [config.enabled?'사용 중':'사용 안 함',config.backdrop?'배경 가림 사용':'배경 가림 없음',config.tabs?'탭 사용':'탭 없음',config.search?'검색 사용':'검색 없음'];
      case 'device-handoff-accordion':return [config.enabled?'사용 중':'사용 안 함',`열림 반응 ${valueLabel(config.response)}`,config.copyAction?'복사 사용':'복사 없음',config.connectAction?'연결 사용':'연결 없음'];
      case 'reading-progress':return [config.enabled?'사용 중':'사용 안 함',`두께 ${Number(config.thickness||0)}px`,`투명도 ${Number(config.opacity||0)}%`];
      case 'floating-action':return [valueLabel(config.family),`반응 ${valueLabel(config.response)}`,`튕김 ${valueLabel(config.overshoot)}`];
      default:return [];
    }
  }

  function summaryMarkup(capability,config){return `<div class="ui-live-summary">${summaryItems(capability,config).map(item=>`<span>${escapeHtml(item)}</span>`).join('')}</div>`;}

  function previewMarkup(capability,config){
    const duration=motionMs(config.response,config.durationScale);
    const scale=overshootScale(config.overshoot);
    switch(capability.id){
      case 'top-chapter-navigation':{
        const gap=Number(config.desktopChipGap||config.mobileChipGap||6);
        const start=Math.max(0,Math.min(100,Number(config.progressOpacityStart||24)));
        const end=Math.max(0,Math.min(100,Number(config.progressOpacityEnd||16)));
        const wash=config.progressEnabled&&config.progressMode==='chapter-wash';
        const line=config.progressEnabled&&config.progressMode==='line';
        const deferredLead=config.stickyMode==='deferred-sticky'?'<div class="ui-demo-nav__lead"><strong>페이지 상단</strong><p>아래로 스크롤하면 메뉴가 화면 위에 고정됩니다.</p></div>':'';
        return `<div class="ui-live-instruction">안쪽 화면을 스크롤하거나 메뉴칩을 눌러보세요.</div><div class="ui-demo-nav" style="--demo-accent:${escapeHtml(config.accentColor)};--demo-motion:${duration}ms;--demo-overshoot:${scale}"><div class="ui-demo-nav__viewport" data-live-nav-scroll>${deferredLead}<div class="ui-demo-nav__bar" data-live-nav data-sticky-mode="${escapeHtml(config.stickyMode)}"><div class="ui-demo-nav__rail" data-progress-wash="${wash?'true':'false'}" style="--demo-chip-gap:${gap}px;--demo-progress-color:${escapeHtml(config.progressColor||config.accentColor)};--demo-progress-start:${start}%;--demo-progress-end:${end}%;--demo-nav-inset:${Number(config.railInset||5.5)}px;--demo-progress-pct:0%"><button type="button" class="ui-demo-chip is-active" data-demo-chapter="start">시작</button><button type="button" class="ui-demo-chip" data-demo-chapter="market">시장</button><button type="button" class="ui-demo-chip" data-demo-chapter="learn">교육</button><button type="button" class="ui-demo-chip" data-demo-chapter="work">실무</button><button type="button" class="ui-demo-chip" data-demo-chapter="profit">수익</button></div>${line?`<div class="ui-demo-progress"><i data-live-progress-line style="background:${escapeHtml(config.progressColor||config.accentColor)}"></i></div>`:''}</div><div class="ui-demo-nav__content">${[['start','시작','어떤 일을 팔지 정합니다.'],['market','시장','실제 수요와 작업 범위를 비교합니다.'],['learn','교육','필요한 기술부터 순서대로 익힙니다.'],['work','실무','포트폴리오와 첫 외주를 준비합니다.'],['profit','수익','반복 주문과 운영 기준을 정리합니다.']].map(([id,title,text])=>`<section data-demo-section="${id}"><small>${title}</small><strong>${text}</strong><p>이 영역은 상단 메뉴의 스크롤·고정·진행 표시를 직접 확인하기 위한 미리보기입니다.</p></section>`).join('')}</div></div></div>`;
      }
      case 'horizontal-card-rail':
        return `<div class="ui-live-instruction">손가락으로 밀어보세요. PC에서는 설정에 따라 마우스로 끌 수 있습니다.</div><div class="ui-demo-rail-shell"><div class="ui-demo-rail" tabindex="0" data-live-rail data-desktop-drag="${config.desktopDrag?'true':'false'}" data-left-fade="${config.leftFade?'true':'false'}" data-right-fade="${config.rightFade?'true':'false'}" data-shadow-guard="${config.leftShadowGuard?'true':'false'}" data-scrollbar="${escapeHtml(config.scrollbar)}" data-threshold="${Number(config.dragThreshold||5)}" data-click-suppress="${Number(config.clickSuppressMs||220)}" style="--demo-left:${Number(config.leftPaintRunway||0)}px;--demo-right:${Number(config.rightContentPadding||0)}px;--demo-fade-width:${Number(config.rightFadeWidth||0)}px">${[1,2,3,4,5].map(index=>`<article><b>카드 ${String(index).padStart(2,'0')}</b><p>${index===1?'왼쪽 그림자 여백과 시작점을 확인합니다.':index===5?'오른쪽 페이드 뒤의 실제 끝 여백을 확인합니다.':'카드를 직접 가로로 이동해 동작을 확인합니다.'}</p><a href="#demo-card-${index}" data-demo-card-link>링크 동작 확인</a></article>`).join('')}</div><div class="ui-live-feedback" data-live-rail-feedback>가로 위치 0%</div></div>`;
      case 'filter-chip-rail':{
        const opacity=Math.max(0,Math.min(100,Number(config.surfaceOpacity??100)))/100;
        return `<div class="ui-live-instruction">필터칩을 직접 눌러 선택 상태와 움직임을 확인하세요.</div><div class="ui-demo-filter" data-family="${escapeHtml(config.family)}" style="--demo-accent:${escapeHtml(config.accentColor)};--demo-gap:${Number(config.gap||0)}px;--demo-blur:${Number(config.blur||0)}px;--demo-opacity:${opacity};--demo-runway:${Number(config.runway||0)}px;--demo-motion:${duration}ms;--demo-overshoot:${scale}"><div class="ui-demo-filter__rail">${['전체','영상','읽을거리','질문'].map((label,index)=>`<button type="button" class="${index===0?'is-active':''}" data-live-filter>${label}</button>`).join('')}</div><div class="ui-live-feedback" data-live-filter-feedback>전체 선택</div></div>`;
      }
      case 'collection-bottom-sheet':{
        if(!config.enabled)return '<div class="ui-live-disabled"><strong>하단 팝업 사용 안 함</strong><p>‘사용’을 켜면 실제 팝업을 조작할 수 있습니다.</p></div>';
        const previewWidth=Math.min(96,Math.max(58,Number(config.maxWidth||760)/9));
        const height=Math.min(270,Math.max(185,Number(config.maxHeightDvh||84)*2.75));
        return `<div class="ui-live-instruction">팝업을 열고 닫거나 탭·필터·검색을 직접 조작해보세요.</div><div class="ui-demo-sheet-stage" data-live-sheet-stage style="--demo-backdrop-blur:${Number(config.backdropBlur||0)}px"><div class="ui-demo-sheet-page"><strong>저장한 항목</strong><p>본문 뒤에서 하단 팝업이 열리는 상황을 재현합니다.</p><button type="button" data-live-sheet-open>하단 팝업 열기</button></div>${config.backdrop?'<button type="button" class="ui-demo-sheet-backdrop is-visible" data-live-sheet-backdrop aria-label="팝업 닫기"></button>':''}<div class="ui-demo-sheet is-open" data-live-sheet style="left:${(100-previewWidth)/2}%;right:${(100-previewWidth)/2}%;height:${height}px;border-radius:${Number(config.radiusTop||30)}px ${Number(config.radiusTop||30)}px 0 0;backdrop-filter:blur(${Number(config.sheetBlur||26)}px) saturate(${Number(config.sheetSaturation||135)}%);-webkit-backdrop-filter:blur(${Number(config.sheetBlur||26)}px) saturate(${Number(config.sheetSaturation||135)}%)">${config.handle?'<div class="ui-demo-sheet__handle"></div>':''}<div class="ui-demo-sheet__head"><strong>저장한 항목</strong><button type="button" data-live-sheet-close>닫기</button></div>${config.tabs?'<div class="ui-demo-sheet__tabs">'+['전체','영상','질문','설정'].map((label,index)=>`<button type="button" class="${index===0?'is-active':''}" data-live-sheet-tab>${label}</button>`).join('')+'</div>':''}${config.search?'<label class="ui-demo-sheet__search"><span>검색</span><input type="search" placeholder="저장한 항목 검색"></label>':''}${config.filters?'<div class="ui-demo-sheet__filters"><button type="button" class="is-active" data-live-sheet-filter>전체</button><button type="button" data-live-sheet-filter>즐겨찾기</button><button type="button" data-live-sheet-filter>최근</button></div>':''}<div class="ui-demo-sheet__body"><div class="ui-demo-saved-row"><span>포트폴리오 체크리스트</span>${config.bulkSelection?'<input type="checkbox" aria-label="항목 선택">':''}</div><div class="ui-demo-saved-row"><span>장비 구매 기준</span>${config.bulkSelection?'<input type="checkbox" aria-label="항목 선택">':''}</div>${config.themeSelector?'<div class="ui-demo-sheet__theme"><span>화면 테마</span><button type="button" class="is-active" data-live-sheet-theme>밝게</button><button type="button" data-live-sheet-theme>어둡게</button></div>':''}${config.deviceHandoff?'<button type="button" class="ui-demo-sheet__handoff">다른 기기 연결</button>':''}</div></div></div>`;
      }
      case 'device-handoff-accordion':
        if(!config.enabled)return '<div class="ui-live-disabled"><strong>다른 기기 연결 사용 안 함</strong><p>‘사용’을 켜면 아코디언 동작을 확인할 수 있습니다.</p></div>';
        return `<div class="ui-live-instruction">아코디언을 열고 코드 복사·연결 동작을 눌러보세요.</div><div class="ui-demo-accordion" style="--demo-motion:${duration}ms"><button type="button" data-demo-accordion aria-expanded="false"><span>다른 기기 연결</span><i>⌄</i></button><div class="ui-demo-accordion__panel" data-demo-accordion-panel><p>이 기기의 연결 코드를 복사하거나 다른 기기에서 받은 코드를 입력합니다.</p><div class="ui-demo-handoff-code"><code>PHOTO-8K2M</code>${config.copyAction?'<button type="button" data-live-copy-code>코드 복사</button>':''}</div>${config.connectAction?'<div class="ui-demo-handoff-connect"><input type="text" placeholder="연결 코드 입력"><button type="button" data-live-connect-code>연결</button></div>':''}${config.statusMessage?'<div class="ui-live-feedback" data-live-handoff-feedback>연결 전</div>':''}</div></div>`;
      case 'reading-progress':{
        if(!config.enabled)return '<div class="ui-live-disabled"><strong>읽기 진행선 사용 안 함</strong><p>‘사용’을 켜면 스크롤에 따른 진행률을 확인할 수 있습니다.</p></div>';
        const opacity=Math.max(0,Math.min(100,Number(config.opacity||100)))/100;
        return `<div class="ui-live-instruction">아래 문서를 직접 스크롤하세요. 진행선이 실제 스크롤 위치를 따라갑니다.</div><div class="ui-demo-reading"><div class="ui-demo-reading__track" style="height:${Number(config.thickness||2)}px"><div class="ui-demo-reading__fill" data-live-reading-fill style="--demo-accent:${escapeHtml(config.color)};--demo-opacity:${opacity};width:0%"></div></div><div class="ui-demo-reading__percent" data-live-reading-percent>0%</div><div class="ui-demo-reading__article" data-live-reading-scroll>${Array.from({length:8},(_,index)=>`<section><small>${String(index+1).padStart(2,'0')}</small><strong>${index<2?'준비 단계':index<5?'실행 단계':'운영 단계'}</strong><p>이 문단은 읽기 진행선의 실제 스크롤 반응을 확인하기 위한 예시 내용입니다. 아래로 계속 스크롤해 진행률 변화를 확인하세요.</p></section>`).join('')}</div></div>`;
      }
      case 'floating-action':
        return `<div class="ui-live-instruction">플로팅 버튼을 눌러 빠른 메뉴를 열고 항목을 선택해보세요.</div><div class="ui-demo-fab-stage" data-family="${escapeHtml(config.family)}" style="--demo-accent:${escapeHtml(config.accentColor)};--demo-motion:${duration}ms;--demo-overshoot:${scale}"><div class="ui-demo-fab-menu" data-live-fab-menu><button type="button" data-live-fab-action="저장">저장</button><button type="button" data-live-fab-action="공유">공유</button><button type="button" data-live-fab-action="질문">질문</button></div><button type="button" class="ui-demo-fab" data-live-fab aria-expanded="false">+</button><div class="ui-live-feedback" data-live-fab-feedback>메뉴 닫힘</div></div>`;
      default:return '<div class="ui-empty">미리보기를 준비 중입니다.</div>';
    }
  }

  function renderWorkspace(){
    const capability=current();
    if(!capability)return;
    const config=state.configs.get(capability.id)||defaultsFor(capability);
    workspace.innerHTML=`<section class="ui-card"><header class="ui-card__head"><div><small>${escapeHtml(categoryLabel(capability.category))}</small><h2>${escapeHtml(capability.label)}</h2><p>${escapeHtml(sourceLabel(capability.source))} · ${escapeHtml(statusLabel(capability.status))}</p></div><button type="button" class="ui-reset-button" data-ui-reset>기본값으로 되돌리기</button></header><div class="ui-preview-head"><div><strong>실시간 미리보기</strong><span>설정값은 저장하기 전에도 즉시 반영됩니다. 화면을 직접 조작해보세요.</span></div>${summaryMarkup(capability,config)}</div><div class="ui-preview-stage"><div class="ui-preview">${previewMarkup(capability,config)}</div></div><div class="ui-controls">${controlsMarkup(capability,config)}</div><details class="ui-technical"><summary>연결된 구현 파일</summary><div>${(capability.owners||[]).length?(capability.owners||[]).map(owner=>`<code>${escapeHtml(owner)}</code>`).join(''):'아직 공통 구현 파일이 연결되지 않았습니다.'}</div></details></section>`;
    workspace.querySelector('[data-ui-reset]')?.addEventListener('click',()=>{state.configs.set(capability.id,defaultsFor(capability));renderWorkspace();});
    workspace.querySelectorAll('[data-ui-control]').forEach(input=>{
      const eventName=input.type==='range'||input.type==='color'?'input':'change';
      input.addEventListener(eventName,()=>{
        const control=(capability.controls||[]).find(item=>item.id===input.dataset.uiControl);
        if(!control)return;
        let value=input.type==='checkbox'?input.checked:input.value;
        if(control.type==='range'||control.type==='number')value=Number(value);
        config[control.id]=value;
        const valueNode=workspace.querySelector(`[data-ui-value-for="${CSS.escape(control.id)}"]`);
        if(valueNode)valueNode.textContent=unitValue(control,value);
        refreshPreview(capability,config);
      });
    });
    bindPreviewInteractions(capability,config);
  }

  function refreshPreview(capability,config){
    const preview=workspace.querySelector('.ui-preview');
    if(preview)preview.innerHTML=previewMarkup(capability,config);
    const summary=workspace.querySelector('.ui-live-summary');
    if(summary)summary.outerHTML=summaryMarkup(capability,config);
    bindPreviewInteractions(capability,config);
  }

  function allPresetsFor(capability){
    const byId=new Map();
    for(const item of capability.presets||[])byId.set(item.id,{...item,source:item.source||'system'});
    for(const item of state.saved.filter(item=>item.capabilityId===capability.id))byId.set(item.id,{...item,source:item.source||'user'});
    return [...byId.values()];
  }

  function renderPresets(){
    const capability=current();
    const presets=allPresetsFor(capability);
    presetList.innerHTML=presets.length?presets.map(item=>`<article class="ui-preset"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(sourceLabel(item.source||'user'))} · ${escapeHtml(statusLabel(item.status||'draft'))}</span><button type="button" data-preset-id="${escapeHtml(item.id)}">불러오기</button></article>`).join(''):'<div class="ui-empty">저장된 설정이 없습니다.</div>';
    presetList.querySelectorAll('[data-preset-id]').forEach(button=>button.addEventListener('click',()=>{
      const preset=presets.find(item=>item.id===button.dataset.presetId);
      if(!preset)return;
      state.configs.set(capability.id,{...defaultsFor(capability),...clone(preset.config||{})});
      renderWorkspace();
    }));
  }

  function savePreset(){
    const capability=current();
    const name=String(presetName?.value||'').trim();
    if(!capability||!name){presetName?.focus();return;}
    const item={id:`preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,capabilityId:capability.id,name,config:clone(state.configs.get(capability.id)||{}),source:'user',status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),version:1};
    state.saved.push(item);writeSaved();if(presetName)presetName.value='';renderPresets();
  }

  function exportPresets(){
    const payload={schema:'platform-ui-presets/v1',exportedAt:new Date().toISOString(),presets:state.saved};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='platform-ui-presets.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }

  function bindPreviewInteractions(capability,config){
    bindTopNav(capability,config);
    bindRail(capability,config);
    bindFilters();
    bindSheet();
    bindAccordion();
    bindReading();
    bindFab();
  }

  function bindTopNav(capability,config){
    if(capability.id!=='top-chapter-navigation')return;
    const viewport=workspace.querySelector('[data-live-nav-scroll]');
    const bar=workspace.querySelector('[data-live-nav]');
    if(!viewport||!bar)return;
    const chips=[...bar.querySelectorAll('[data-demo-chapter]')];
    const sections=[...viewport.querySelectorAll('[data-demo-section]')];
    const rail=bar.querySelector('.ui-demo-nav__rail');
    const line=bar.querySelector('[data-live-progress-line]');
    function update(){
      const max=Math.max(1,viewport.scrollHeight-viewport.clientHeight);
      const pct=Math.max(0,Math.min(100,(viewport.scrollTop/max)*100));
      rail?.style.setProperty('--demo-progress-pct',`${pct}%`);
      if(line)line.style.width=`${pct}%`;
      let active=sections[0]?.dataset.demoSection||'';
      const probe=viewport.scrollTop+bar.offsetHeight+70;
      for(const section of sections){if(section.offsetTop<=probe)active=section.dataset.demoSection;}
      chips.forEach(chip=>chip.classList.toggle('is-active',chip.dataset.demoChapter===active));
    }
    viewport.addEventListener('scroll',update,{passive:true});
    chips.forEach(chip=>chip.addEventListener('click',()=>{
      const section=sections.find(item=>item.dataset.demoSection===chip.dataset.demoChapter);if(!section)return;
      viewport.scrollTo({top:Math.max(0,section.offsetTop-bar.offsetHeight-8),behavior:'smooth'});
    }));
    update();
  }

  function bindRail(capability,config){
    if(capability.id!=='horizontal-card-rail')return;
    const rail=workspace.querySelector('[data-live-rail]');
    const feedback=workspace.querySelector('[data-live-rail-feedback]');
    if(!rail)return;
    let startX=0,startLeft=0,dragging=false,moved=false,suppressUntil=0;
    const threshold=Number(config.dragThreshold||5);
    function update(){const max=Math.max(1,rail.scrollWidth-rail.clientWidth);const pct=Math.round((rail.scrollLeft/max)*100);if(feedback)feedback.textContent=`가로 위치 ${Math.max(0,Math.min(100,pct))}%`;}
    rail.addEventListener('scroll',update,{passive:true});
    rail.addEventListener('pointerdown',event=>{
      if(!config.desktopDrag||event.pointerType!=='mouse'||event.button!==0)return;
      startX=event.clientX;startLeft=rail.scrollLeft;dragging=true;moved=false;rail.setPointerCapture?.(event.pointerId);rail.classList.add('is-grabbed');
    });
    rail.addEventListener('pointermove',event=>{
      if(!dragging)return;const delta=event.clientX-startX;if(Math.abs(delta)>=threshold)moved=true;if(moved){rail.scrollLeft=startLeft-delta;event.preventDefault();}
    });
    const finish=event=>{if(!dragging)return;dragging=false;rail.classList.remove('is-grabbed');if(moved)suppressUntil=Date.now()+Number(config.clickSuppressMs||0);try{rail.releasePointerCapture?.(event.pointerId);}catch{}};
    rail.addEventListener('pointerup',finish);rail.addEventListener('pointercancel',finish);
    rail.querySelectorAll('[data-demo-card-link]').forEach(link=>link.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopPropagation();return;}event.preventDefault();if(feedback)feedback.textContent='카드 링크 클릭 확인';}));
    update();
  }

  function bindFilters(){
    const buttons=[...workspace.querySelectorAll('[data-live-filter]')];if(!buttons.length)return;
    const feedback=workspace.querySelector('[data-live-filter-feedback]');
    buttons.forEach(button=>button.addEventListener('click',()=>{buttons.forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');button.classList.remove('is-popping');void button.offsetWidth;button.classList.add('is-popping');if(feedback)feedback.textContent=`${button.textContent.trim()} 선택`;}));
  }

  function bindSheet(){
    const stage=workspace.querySelector('[data-live-sheet-stage]');if(!stage)return;
    const sheet=stage.querySelector('[data-live-sheet]');const backdrop=stage.querySelector('[data-live-sheet-backdrop]');
    const setOpen=open=>{sheet?.classList.toggle('is-open',open);backdrop?.classList.toggle('is-visible',open);stage.classList.toggle('is-open',open);};
    stage.querySelector('[data-live-sheet-open]')?.addEventListener('click',()=>setOpen(true));
    stage.querySelector('[data-live-sheet-close]')?.addEventListener('click',()=>setOpen(false));
    backdrop?.addEventListener('click',()=>setOpen(false));
    const tabs=[...stage.querySelectorAll('[data-live-sheet-tab]')];tabs.forEach(button=>button.addEventListener('click',()=>{tabs.forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');}));
    const filters=[...stage.querySelectorAll('[data-live-sheet-filter]')];filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');}));
    const themes=[...stage.querySelectorAll('[data-live-sheet-theme]')];themes.forEach(button=>button.addEventListener('click',()=>{themes.forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');stage.classList.toggle('is-dark',button.textContent.includes('어둡게'));}));
  }

  function bindAccordion(){
    const button=workspace.querySelector('[data-demo-accordion]');const panel=workspace.querySelector('[data-demo-accordion-panel]');if(!button||!panel)return;
    panel.style.maxHeight='0px';panel.setAttribute('aria-hidden','true');
    button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',open?'true':'false');panel.setAttribute('aria-hidden',open?'false':'true');panel.style.maxHeight=open?`${panel.scrollHeight}px`:'0px';button.parentElement?.classList.toggle('is-open',open);});
    const feedback=workspace.querySelector('[data-live-handoff-feedback]');
    workspace.querySelector('[data-live-copy-code]')?.addEventListener('click',async()=>{try{await navigator.clipboard?.writeText('PHOTO-8K2M');}catch{}if(feedback)feedback.textContent='연결 코드를 복사했습니다.';});
    workspace.querySelector('[data-live-connect-code]')?.addEventListener('click',()=>{const input=workspace.querySelector('.ui-demo-handoff-connect input');if(feedback)feedback.textContent=String(input?.value||'').trim()?'연결 요청을 확인했습니다.':'연결 코드를 입력하세요.';});
  }

  function bindReading(){
    const scroll=workspace.querySelector('[data-live-reading-scroll]');const fill=workspace.querySelector('[data-live-reading-fill]');const percent=workspace.querySelector('[data-live-reading-percent]');if(!scroll||!fill)return;
    function update(){const max=Math.max(1,scroll.scrollHeight-scroll.clientHeight);const pct=Math.max(0,Math.min(100,(scroll.scrollTop/max)*100));fill.style.width=`${pct}%`;if(percent)percent.textContent=`${Math.round(pct)}%`;}
    scroll.addEventListener('scroll',update,{passive:true});update();
  }

  function bindFab(){
    const button=workspace.querySelector('[data-live-fab]');const menu=workspace.querySelector('[data-live-fab-menu]');const feedback=workspace.querySelector('[data-live-fab-feedback]');if(!button||!menu)return;
    button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',open?'true':'false');button.textContent=open?'×':'+';menu.classList.toggle('is-open',open);if(feedback)feedback.textContent=open?'메뉴 열림':'메뉴 닫힘';});
    menu.querySelectorAll('[data-live-fab-action]').forEach(action=>action.addEventListener('click',()=>{if(feedback)feedback.textContent=`${action.dataset.liveFabAction} 선택`;menu.classList.remove('is-open');button.setAttribute('aria-expanded','false');button.textContent='+';}));
  }

  function render(){renderList();renderWorkspace();renderPresets();}
  savePresetButton?.addEventListener('click',savePreset);exportButton?.addEventListener('click',exportPresets);
  render();
})();
