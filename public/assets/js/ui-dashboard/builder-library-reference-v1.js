(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformLibraryReferenceV1)return;
  window.__platformLibraryReferenceV1=true;

  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const root=$('.builder-shell');
  const toolbar=$('.builder-toolbar');
  const tools=$('#builderLibraryTools');
  const filters=$('#builderLibraryFilters');
  const stage=$('.builder-stage');
  const shell=$('#builderCanvasShell');
  const frame=$('#builderFrame');
  const status=$('#builderFrameStatus');
  if(!manifest||!root||!tools||!filters||!shell||!frame)return;

  const CONFIG_STORE='platformBuilderCapabilityConfigsV2';
  const THEME_STORE='platformBuilderPreviewThemeV2';
  const VIEW_STORE='platformBuilderPreviewViewportV2';
  const STATE_STORE='platformBuilderKitStateV2';
  const FILTER_ITEMS_STORE='platformBuilderFilterPreviewItemsV3';
  const FILTER_ITEMS_OLD='platformBuilderFilterPreviewItemsV2';
  const FILTER_SELECTED_STORE='platformBuilderFilterPreviewSelectedV1';
  const ORDER=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const LABEL={'top-chapter-navigation':'상단 메뉴','horizontal-card-rail':'가로 카드','filter-chip-rail':'범용 필터칩','collection-bottom-sheet':'하단 팝업','device-handoff-accordion':'다른 기기','floating-action':'플로팅 버튼'};
  const META={'top-chapter-navigation':'공통 상단 메뉴','horizontal-card-rail':'공통 가로 카드 레일','filter-chip-rail':'공통 필터 레일','collection-bottom-sheet':'공통 하단 팝업','device-handoff-accordion':'공통 다른 기기 연결','floating-action':'공통 플로팅 버튼'};
  const HINT={'top-chapter-navigation':'공개 페이지에서 추출해 승인된 상단 메뉴 모듈을 그대로 실행합니다.','horizontal-card-rail':'승인된 카드 레일 모듈과 기존 PC 드래그·모바일 스크롤을 함께 확인합니다.','filter-chip-rail':'승인된 필터칩 모듈에서 샘플 메뉴와 스타일·간격을 조정합니다.','collection-bottom-sheet':'승인된 하단 팝업 모듈의 탭과 상태를 같은 구조로 확인합니다.','device-handoff-accordion':'승인된 다른 기기 연결 모듈을 실제 interaction owner와 함께 확인합니다.','floating-action':'승인된 플로팅 버튼 모듈을 같은 CSS owner로 확인합니다.'};
  const HEIGHT={'top-chapter-navigation':220,'horizontal-card-rail':500,'filter-chip-rail':230,'collection-bottom-sheet':760,'device-handoff-accordion':360,'floating-action':300};
  const STATE_OPTIONS={'collection-bottom-sheet':[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']],'device-handoff-accordion':[['collapsed','접힘'],['expanded','펼침']]};
  const GROUP_LABEL={basic:'기본',advanced:'세부',motion:'움직임',safety:'안전',input:'입력','left-edge':'왼쪽 끝','right-edge':'오른쪽 끝',visibility:'표시','스타일':'스타일','여백과 간격':'여백과 간격','움직임':'움직임'};
  const VALUE_LABEL={'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',hidden:'숨김',auto:'필요할 때',flat:'플랫',glass:'글래스',liquid:'리퀴드','chapter-wash':'메뉴 배경',line:'얇은 선',measured:'자동 측정','alpha-mask':'알파 마스크'};
  const DEFAULT_FILTER_ITEMS=[{id:'all',label:'전체',family:'inherit'},{id:'product',label:'제품 촬영',family:'inherit'},{id:'portrait',label:'인물 촬영',family:'inherit'},{id:'food',label:'음식 촬영',family:'inherit'}];

  let active=params.get('ui');if(!ORDER.includes(active))active=ORDER[0];
  let theme=readText(THEME_STORE,'light');if(!['light','dark','system'].includes(theme))theme='light';
  let viewport=readText(VIEW_STORE,'desktop');if(!['desktop','mobile'].includes(viewport))viewport='desktop';
  let frameReady=false;

  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const uid=()=>`chip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  function readText(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function writeText(key,value){try{localStorage.setItem(key,value);}catch{}}
  function readJson(key,fallback={}){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:fallback;}catch{return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function capability(id){return manifest.capabilities.find(item=>item.id===id);}
  function savedConfig(id){return readJson(CONFIG_STORE,{})[id]||null;}
  function displayedConfig(id){const values={};(capability(id)?.controls||[]).forEach(control=>values[control.id]=control.default);return {...values,...(savedConfig(id)||{})};}
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function effectiveTheme(){return theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;}

  function normalizeFilterItem(item,index){
    if(item&&typeof item==='object'){
      const label=String(item.label||'').trim();if(!label)return null;
      return {id:String(item.id||`chip-${index}`),label,family:['inherit','material-flat','ios-flat','ios-liquid'].includes(item.family)?item.family:'inherit'};
    }
    const label=String(item||'').trim();return label?{id:`legacy-${index}-${label.slice(0,8)}`,label,family:'inherit'}:null;
  }
  function normalizeFilterItems(value){return (Array.isArray(value)?value:[]).map(normalizeFilterItem).filter(Boolean).slice(0,20);}
  function readFilterItems(){
    const current=normalizeFilterItems(readJson(FILTER_ITEMS_STORE,[]));if(current.length)return current;
    const old=normalizeFilterItems(readJson(FILTER_ITEMS_OLD,[]));if(old.length){writeFilterItems(old);return old;}
    const defaults=DEFAULT_FILTER_ITEMS.map(item=>({...item}));writeFilterItems(defaults);return defaults;
  }
  function writeFilterItems(items){writeJson(FILTER_ITEMS_STORE,normalizeFilterItems(items));}
  function selectedFilterId(){return readText(FILTER_SELECTED_STORE,'');}
  function setSelectedFilterId(id){writeText(FILTER_SELECTED_STORE,id||'');}
  function selectedFilterItem(items=readFilterItems()){
    const id=selectedFilterId();const item=items.find(entry=>entry.id===id)||items[0]||null;
    if(item&&item.id!==id)setSelectedFilterId(item.id);return item;
  }

  function stateFor(id){const value=readJson(STATE_STORE,{})[id];if(value)return value;return id==='collection-bottom-sheet'?'all':id==='device-handoff-accordion'?'collapsed':'';}
  function saveState(id,value,{fromPreview=false}={}){const all=readJson(STATE_STORE,{});all[id]=value;writeJson(STATE_STORE,all);if(!fromPreview)post({type:'platform-kit-state',capabilityId:id,state:value});refreshInspectorState();}

  function saveConfigKey(id,key,value){const all=readJson(CONFIG_STORE,{});const next={...(all[id]||{})};next[key]=value;all[id]=next;writeJson(CONFIG_STORE,all);syncFrame();}
  function resetConfig(id){const all=readJson(CONFIG_STORE,{});delete all[id];writeJson(CONFIG_STORE,all);syncFrame();if(!inspector.hidden)openInspector();}

  function sharedFilterConfig(){return savedConfig('filter-chip-rail')||{};}
  function syncFrame(){
    if(!frameReady)return;
    post({type:'platform-theme',theme});
    for(const id of ORDER)post({type:'platform-ui-reset',capabilityId:id});
    const shared=sharedFilterConfig();
    if(Object.keys(shared).length)post({type:'platform-ui-config',capabilityId:'filter-chip-rail',config:shared});
    const own=savedConfig(active);
    if(own&&Object.keys(own).length)post({type:'platform-ui-config',capabilityId:active,config:own});
    const state=stateFor(active);if(state)post({type:'platform-kit-state',capabilityId:active,state});
    if(active==='filter-chip-rail')post({type:'platform-filter-chip-preview-items',items:readFilterItems()});
  }

  root.dataset.builderView='library';
  if(toolbar)toolbar.hidden=true;if(stage)stage.classList.add('builder-library-kit-hidden-stage');tools.hidden=false;filters.innerHTML='';
  const intro=$('.builder-library-intro',tools);if(intro){intro.querySelector('strong').textContent='UI 라이브러리';intro.querySelector('span').textContent='승인된 공통 모듈을 실제 코드로 실행하고 조정합니다.';}

  const selector=document.createElement('nav');selector.className='builder-kit-selector';selector.setAttribute('aria-label','UI 컴포넌트');filters.appendChild(selector);
  const controlBar=document.createElement('div');controlBar.className='builder-kit-controls builder-kit-controls--primary';controlBar.innerHTML='<div class="builder-kit-switch" id="kitTheme"></div><div class="builder-kit-switch" id="kitViewport"></div>';tools.appendChild(controlBar);
  const workspace=document.createElement('main');workspace.className='builder-kit-workspace';workspace.innerHTML='<header class="builder-kit-head"><div><small id="kitMeta"></small><strong id="kitTitle"></strong><span id="kitHint"></span></div><button type="button" id="kitSettings">설정</button></header><div class="builder-kit-canvas" id="kitCanvas"></div>';tools.insertAdjacentElement('afterend',workspace);
  $('#kitCanvas',workspace).appendChild(shell);shell.classList.add('builder-kit-frame-shell');
  const title=$('#kitTitle',workspace),meta=$('#kitMeta',workspace),hint=$('#kitHint',workspace),themeRoot=$('#kitTheme',controlBar),viewportRoot=$('#kitViewport',controlBar),settings=$('#kitSettings',workspace);
  const inspector=document.createElement('aside');inspector.className='builder-library-audit-inspector builder-kit-inspector';inspector.hidden=true;document.body.appendChild(inspector);

  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';const label=`<span>${esc(control.label)}${control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:''}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-kit-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-kit-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(VALUE_LABEL[option]||option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-kit-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="range" data-kit-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }

  function stateSection(){
    const options=STATE_OPTIONS[active];if(!options)return '';
    const current=stateFor(active);
    return `<section class="builder-control-group builder-preview-state-group"><strong>미리보기 상태</strong><div class="builder-preview-state-options">${options.map(([value,label])=>`<button type="button" data-inspector-state="${esc(value)}" aria-pressed="${current===value}">${esc(label)}</button>`).join('')}</div></section>`;
  }

  function filterItemsSection(){
    if(active!=='filter-chip-rail')return '';
    const items=readFilterItems(),selected=selectedFilterItem(items);
    return `<section class="builder-control-group builder-filter-item-editor"><strong>샘플 필터칩</strong><div class="builder-filter-item-editor__add"><input type="text" maxlength="24" data-filter-add-input placeholder="칩 이름"><button type="button" data-filter-add>추가</button><button type="button" data-filter-remove>마지막 삭제</button><button type="button" data-filter-reset>기본</button></div><div class="builder-filter-item-editor__selected"><span data-filter-selected>${selected?`선택: ${esc(selected.label)}`:'칩을 선택하세요'}</span><label>선택한 칩 스타일<select data-filter-family><option value="inherit" ${selected?.family==='inherit'?'selected':''}>공통값 사용</option><option value="material-flat" ${selected?.family==='material-flat'?'selected':''}>Material</option><option value="ios-flat" ${selected?.family==='ios-flat'?'selected':''}>iOS 플랫</option><option value="ios-liquid" ${selected?.family==='ios-liquid'?'selected':''}>iOS 리퀴드</option></select></label></div></section>`;
  }

  function openInspector(){
    const item=capability(active);if(!item)return;const values=displayedConfig(active);const groups=new Map();
    (item.controls||[]).forEach(control=>{const name=GROUP_LABEL[control.group]||control.group||'설정';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(control);});
    inspector.innerHTML=`<header><div><small>UI 라이브러리</small><strong>${esc(LABEL[active]||item.label)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">공통 모듈 코드는 유지하고, 이 관리단에서 바꾼 값만 별도로 저장합니다.</p>${stateSection()}${filterItemsSection()}${[...groups.entries()].map(([name,controls])=>`<section class="builder-control-group"><strong>${esc(name)}</strong><div class="builder-control-grid">${controls.map(control=>controlHtml(control,values[control.id])).join('')}</div></section>`).join('')}</div><footer><button type="button" data-kit-reset>운영값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector)?.addEventListener('click',()=>inspector.hidden=true);
    $('[data-kit-reset]',inspector)?.addEventListener('click',()=>resetConfig(active));
    $$('[data-kit-control]',inspector).forEach(input=>{const update=()=>{const key=input.dataset.kitControl;const definition=item.controls.find(control=>control.id===key);let value=input.type==='checkbox'?input.checked:input.value;if(definition?.type==='range'||definition?.type==='number')value=Number(value);saveConfigKey(active,key,value);const unit=input.closest('.builder-control')?.querySelector('small');if(unit&&definition?.unit)unit.textContent=`${value}${definition.unit}`;};input.addEventListener('input',update);input.addEventListener('change',update);});
    $$('[data-inspector-state]',inspector).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.inspectorState||'')));
    bindFilterItemEditor();
  }

  function bindFilterItemEditor(){
    if(active!=='filter-chip-rail'||inspector.hidden)return;
    const input=$('[data-filter-add-input]',inspector);
    const add=()=>{const label=String(input?.value||'').trim();if(!label)return;const items=readFilterItems();if(items.length>=20)return;const item={id:uid(),label,family:'inherit'};items.push(item);writeFilterItems(items);setSelectedFilterId(item.id);if(input)input.value='';post({type:'platform-filter-chip-preview-items',items});refreshFilterItemEditor();};
    $('[data-filter-add]',inspector)?.addEventListener('click',add);input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();add();}});
    $('[data-filter-remove]',inspector)?.addEventListener('click',()=>{const items=readFilterItems();if(items.length<=1)return;const removed=items.pop();writeFilterItems(items);if(selectedFilterId()===removed?.id)setSelectedFilterId(items.at(-1)?.id||items[0]?.id||'');post({type:'platform-filter-chip-preview-items',items});refreshFilterItemEditor();});
    $('[data-filter-reset]',inspector)?.addEventListener('click',()=>{const items=DEFAULT_FILTER_ITEMS.map(item=>({...item}));writeFilterItems(items);setSelectedFilterId(items[0].id);post({type:'platform-filter-chip-preview-items',items});refreshFilterItemEditor();});
    $('[data-filter-family]',inspector)?.addEventListener('change',event=>{const items=readFilterItems(),selected=selectedFilterItem(items);if(!selected)return;const family=String(event.target.value||'inherit');const next=items.map(item=>item.id===selected.id?{...item,family}:item);writeFilterItems(next);post({type:'platform-filter-chip-preview-items',items:next});refreshFilterItemEditor();});
  }

  function refreshFilterItemEditor(){
    if(active!=='filter-chip-rail'||inspector.hidden)return;const selected=selectedFilterItem();const label=$('[data-filter-selected]',inspector),select=$('[data-filter-family]',inspector);if(label)label.textContent=selected?`선택: ${selected.label}`:'칩을 선택하세요';if(select&&selected)select.value=selected.family;
  }
  function refreshInspectorState(){
    if(inspector.hidden)return;const current=stateFor(active);$$('[data-inspector-state]',inspector).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.inspectorState===current)));
  }

  function renderSelector(){selector.innerHTML=ORDER.map(id=>`<button type="button" data-kit-ui="${id}" aria-pressed="${id===active}">${esc(LABEL[id])}</button>`).join('');$$('[data-kit-ui]',selector).forEach(button=>button.addEventListener('click',()=>select(button.dataset.kitUi)));}
  function renderTheme(){themeRoot.innerHTML='<span>색상</span>'+[['light','화이트'],['dark','다크'],['system','시스템']].map(([id,label])=>`<button type="button" data-kit-theme="${id}" aria-pressed="${theme===id}">${label}</button>`).join('');$$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.kitTheme;writeText(THEME_STORE,theme);renderTheme();workspace.dataset.theme=effectiveTheme();workspace.dataset.themeChoice=theme;syncFrame();}));}
  function renderViewport(){viewportRoot.innerHTML='<span>화면</span>'+[['desktop','PC'],['mobile','모바일']].map(([id,label])=>`<button type="button" data-kit-viewport="${id}" aria-pressed="${viewport===id}">${label}</button>`).join('');$$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.kitViewport;writeText(VIEW_STORE,viewport);renderViewport();applyViewport();}));}
  function applyViewport(){workspace.dataset.viewport=viewport;frame.style.width=viewport==='mobile'?'390px':'100%';frame.style.maxWidth='100%';}

  function select(id){
    if(!ORDER.includes(id))return;active=id;frameReady=false;renderSelector();title.textContent=LABEL[id];meta.textContent=META[id]||'';hint.textContent=HINT[id]||'';workspace.dataset.activeUi=id;workspace.style.setProperty('--kit-preview-height',`${HEIGHT[id]||420}px`);applyViewport();workspace.dataset.theme=effectiveTheme();workspace.dataset.themeChoice=theme;
    const url=new URL(location.href);url.searchParams.set('view','library');url.searchParams.set('ui',id);history.replaceState({},'',url);
    if(status){status.hidden=false;status.textContent='공통 모듈을 불러오는 중';}
    frame.src=`/ui-dashboard/module-preview/?module=${encodeURIComponent(id)}&kit=library&v=1`;
    if(!inspector.hidden)openInspector();
  }

  settings.addEventListener('click',openInspector);
  frame.addEventListener('load',()=>{setTimeout(()=>{if(frameReady)syncFrame();},80);});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;const data=event.data||{};
    if(data.type==='platform-preview-ready'&&data.capabilityId===active&&data.canonicalModule){frameReady=true;if(status)status.hidden=true;syncFrame();return;}
    if(data.type==='platform-filter-chip-selection'&&active==='filter-chip-rail'){
      const id=String(data.id||'');if(id){setSelectedFilterId(id);refreshFilterItemEditor();}return;
    }
    if(data.type==='platform-preview-state-change'&&data.capabilityId===active&&data.state){saveState(active,data.state,{fromPreview:true});}
  });
  const media=matchMedia('(prefers-color-scheme: dark)');media.addEventListener?.('change',()=>{if(theme==='system'){workspace.dataset.theme=effectiveTheme();syncFrame();}});

  renderSelector();renderTheme();renderViewport();workspace.dataset.theme=effectiveTheme();workspace.dataset.themeChoice=theme;select(active);
})();
