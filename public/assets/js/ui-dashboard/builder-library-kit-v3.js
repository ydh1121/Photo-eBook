(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformLibraryKitV3)return;
  window.__platformLibraryKitV3=true;

  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const shellRoot=document.querySelector('.builder-shell');
  const toolbar=document.querySelector('.builder-toolbar');
  const tools=document.querySelector('#builderLibraryTools');
  const filters=document.querySelector('#builderLibraryFilters');
  const stage=document.querySelector('.builder-stage');
  const canvasShell=document.querySelector('#builderCanvasShell');
  const frame=document.querySelector('#builderFrame');
  const status=document.querySelector('#builderFrameStatus');
  if(!manifest||!shellRoot||!tools||!filters||!canvasShell||!frame)return;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const CONFIG_STORE='platformBuilderCapabilityConfigsV2';
  const THEME_STORE='platformBuilderPreviewThemeV2';
  const VIEW_STORE='platformBuilderPreviewViewportV2';
  const STATE_STORE='platformBuilderKitStateV2';
  const FILTER_ITEMS_STORE='platformBuilderFilterPreviewItemsV3';
  const FILTER_OVERRIDES_STORE='platformBuilderFilterItemOverridesV3';
  const ORDER=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const LABEL={'top-chapter-navigation':'상단 메뉴','horizontal-card-rail':'가로 카드','filter-chip-rail':'범용 필터칩','collection-bottom-sheet':'하단 팝업','device-handoff-accordion':'다른 기기','floating-action':'플로팅 버튼'};
  const META={'top-chapter-navigation':'상단 메뉴와 읽기 진행','horizontal-card-rail':'카드 가로 스크롤','filter-chip-rail':'필터칩 공통 스타일과 개별 스타일','collection-bottom-sheet':'내 모음 하단 팝업','device-handoff-accordion':'다른 기기 연결','floating-action':'내 모음 플로팅 버튼'};
  const HINT={'top-chapter-navigation':'메뉴 고정과 진행 표시를 한 화면에서 조정합니다.','horizontal-card-rail':'카드 시작점, 끝 여백, 페이드를 바로 비교합니다.','filter-chip-rail':'레일은 스크롤만 담당하고, 선택 칩은 레일 위에서 이동합니다.','collection-bottom-sheet':'탭을 바꿔도 같은 팝업 안에서 내용만 바뀝니다.','device-handoff-accordion':'접힘과 펼침 상태를 같은 컴포넌트에서 확인합니다.','floating-action':'표현 방식과 강조 색상을 바로 비교합니다.'};
  const PREVIEW_HEIGHT={'top-chapter-navigation':300,'horizontal-card-rail':560,'filter-chip-rail':320,'collection-bottom-sheet':760,'device-handoff-accordion':480,'floating-action':420};
  const MODE_KEY={'filter-chip-rail':'family','floating-action':'family'};
  const MODE_LABEL={'material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',flat:'플랫',glass:'글래스',liquid:'리퀴드'};
  const STATE_OPTIONS={'collection-bottom-sheet':[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']],'device-handoff-accordion':[['collapsed','접힘'],['expanded','펼침']]};
  const DEFAULT_FILTER_ITEMS=['전체','제품 촬영','인물 촬영','음식 촬영'];
  const VALUE_LABEL={'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',hidden:'숨김',auto:'필요할 때',flat:'플랫',glass:'글래스',liquid:'리퀴드','chapter-wash':'메뉴 배경',line:'얇은 선','alpha-mask':'알파 마스크'};

  let active=params.get('ui');
  if(!ORDER.includes(active))active=ORDER[0];
  let theme=readText(THEME_STORE,'light');
  if(!['light','dark','system'].includes(theme))theme='light';
  let viewport=readText(VIEW_STORE,'desktop');
  if(!['desktop','mobile'].includes(viewport))viewport='desktop';
  let selectedFilterLabel=readFilterItems()[0]||'전체';

  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function readText(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function writeText(key,value){try{localStorage.setItem(key,value);}catch{}}
  function readJson(key,fallback={}){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:fallback;}catch{return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function capability(id){return manifest.capabilities.find(item=>item.id===id);}

  function migrateConfigStore(){
    const all=readJson(CONFIG_STORE,{});
    const filter=all['filter-chip-rail'];
    let changed=false;
    if(filter&&typeof filter==='object'&&Object.prototype.hasOwnProperty.call(filter,'runway')){
      const runway=Math.max(0,Number(filter.runway)||0);
      ['railPaddingTop','railPaddingRight','railPaddingBottom','railPaddingLeft'].forEach(key=>{
        if(!Object.prototype.hasOwnProperty.call(filter,key))filter[key]=runway;
      });
      delete filter.runway;changed=true;
    }
    const nav=all['top-chapter-navigation'];
    if(nav&&typeof nav==='object'){
      if(Object.prototype.hasOwnProperty.call(nav,'chipFamily')){delete nav.chipFamily;changed=true;}
      if(Object.prototype.hasOwnProperty.call(nav,'accentColor')){delete nav.accentColor;changed=true;}
    }
    if(changed)writeJson(CONFIG_STORE,all);
  }
  migrateConfigStore();

  function savedConfig(id){return readJson(CONFIG_STORE,{})[id]||null;}
  function displayedConfig(id){
    const values={};
    (capability(id)?.controls||[]).forEach(control=>values[control.id]=control.default);
    return {...values,...(savedConfig(id)||{})};
  }
  function saveConfigKey(id,key,value){
    const all=readJson(CONFIG_STORE,{});const next={...(all[id]||{})};next[key]=value;all[id]=next;writeJson(CONFIG_STORE,all);syncFrame();renderMode();
  }
  function clearConfigKey(id,key){
    const all=readJson(CONFIG_STORE,{});const next={...(all[id]||{})};delete next[key];if(Object.keys(next).length)all[id]=next;else delete all[id];writeJson(CONFIG_STORE,all);syncFrame();renderMode();
  }
  function resetConfig(id){const all=readJson(CONFIG_STORE,{});delete all[id];writeJson(CONFIG_STORE,all);syncFrame();renderMode();if(!inspector.hidden)openInspector();}

  function stateFor(id){const states=readJson(STATE_STORE,{});if(states[id])return states[id];return id==='device-handoff-accordion'?'collapsed':id==='collection-bottom-sheet'?'all':'';}
  function saveState(id,value,{fromPreview=false}={}){const states=readJson(STATE_STORE,{});states[id]=value;writeJson(STATE_STORE,states);if(!fromPreview)post({type:'platform-kit-state',capabilityId:id,state:value});renderState();}
  function readFilterItems(){const values=readJson(FILTER_ITEMS_STORE,null);if(Array.isArray(values)){const cleaned=values.map(value=>String(value||'').trim()).filter(Boolean).slice(0,24);if(cleaned.length)return cleaned;}return [...DEFAULT_FILTER_ITEMS];}
  function writeFilterItems(items){writeJson(FILTER_ITEMS_STORE,items);post({type:'platform-filter-chip-preview-items',capabilityId:'filter-chip-rail',labels:items});}
  function readFilterOverrides(){const value=readJson(FILTER_OVERRIDES_STORE,{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function writeFilterOverrides(value){writeJson(FILTER_OVERRIDES_STORE,value);post({type:'platform-filter-chip-item-overrides',capabilityId:'filter-chip-rail',overrides:value});}

  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function effectiveTheme(){if(theme!=='system')return theme;return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  function previewConfig(id){
    const own=displayedConfig(id);
    if(id==='top-chapter-navigation'){
      const shared=displayedConfig('filter-chip-rail');
      return {...own,family:shared.family,accentColor:shared.accentColor,gap:own.desktopChipGap??9,railPaddingTop:own.railInset??5.5,railPaddingRight:own.railInset??5.5,railPaddingBottom:own.railInset??5.5,railPaddingLeft:own.railInset??5.5};
    }
    if(id==='collection-bottom-sheet'){
      const shared=displayedConfig('filter-chip-rail');
      return {...own,filterFamily:shared.family,filterAccentColor:shared.accentColor};
    }
    return own;
  }
  function syncFrame(){
    post({type:'platform-theme',theme});
    post({type:'platform-ui-config',capabilityId:active,config:previewConfig(active)});
    const state=stateFor(active);if(state)post({type:'platform-kit-state',capabilityId:active,state});
    if(active==='filter-chip-rail'){
      post({type:'platform-filter-chip-preview-items',capabilityId:active,labels:readFilterItems()});
      post({type:'platform-filter-chip-item-overrides',capabilityId:active,overrides:readFilterOverrides()});
      post({type:'platform-filter-chip-select',capabilityId:active,label:selectedFilterLabel});
    }
  }

  shellRoot.dataset.builderView='library';
  if(toolbar)toolbar.hidden=true;
  if(stage)stage.classList.add('builder-library-kit-hidden-stage');
  tools.hidden=false;
  filters.innerHTML='';
  const intro=$('.builder-library-intro',tools);
  if(intro){intro.querySelector('strong').textContent='UI 라이브러리';intro.querySelector('span').textContent='페이지에서 떼어오지 않고, 컴포넌트 자체를 바로 렌더링합니다.';intro.insertAdjacentHTML('beforeend','<em class="builder-library-runtime-badge">단일 미리보기 런타임</em>');}

  const selector=document.createElement('nav');selector.className='builder-kit-selector';selector.setAttribute('aria-label','UI 컴포넌트');filters.appendChild(selector);
  const controlBar=document.createElement('div');controlBar.className='builder-kit-controls';controlBar.innerHTML='<div class="builder-kit-switch" id="kitTheme"></div><div class="builder-kit-switch" id="kitViewport"></div><div class="builder-kit-switch" id="kitMode" hidden></div><div class="builder-kit-switch" id="kitState" hidden></div><div class="builder-kit-switch builder-kit-filter-items" id="kitFilterItems" hidden></div><div class="builder-kit-switch builder-kit-filter-item-style" id="kitFilterItemStyle" hidden></div>';tools.appendChild(controlBar);
  const workspace=document.createElement('main');workspace.className='builder-kit-workspace';workspace.innerHTML='<header class="builder-kit-head"><div><small id="kitMeta"></small><strong id="kitTitle"></strong><span id="kitHint"></span></div><button type="button" id="kitSettings">세부 설정</button></header><div class="builder-kit-canvas" id="kitCanvas"></div>';tools.insertAdjacentElement('afterend',workspace);$('#kitCanvas',workspace).appendChild(canvasShell);canvasShell.classList.add('builder-kit-frame-shell');

  const title=$('#kitTitle',workspace),meta=$('#kitMeta',workspace),hint=$('#kitHint',workspace),themeRoot=$('#kitTheme',controlBar),viewportRoot=$('#kitViewport',controlBar),modeRoot=$('#kitMode',controlBar),stateRoot=$('#kitState',controlBar),filterItemsRoot=$('#kitFilterItems',controlBar),filterItemStyleRoot=$('#kitFilterItemStyle',controlBar),settings=$('#kitSettings',workspace);
  const inspector=document.createElement('aside');inspector.className='builder-library-audit-inspector builder-kit-inspector';inspector.hidden=true;document.body.appendChild(inspector);

  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';const unit=control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:'';const label=`<span>${esc(control.label)}${unit}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-kit-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-kit-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(VALUE_LABEL[option]||option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-kit-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="range" data-kit-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }

  function openInspector(){
    const item=capability(active);if(!item)return;const values=displayedConfig(active);const groups=new Map();
    (item.controls||[]).forEach(control=>{const name=control.group||'설정';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(control);});
    inspector.innerHTML=`<header><div><small>UI 라이브러리</small><strong>${esc(LABEL[active]||item.label)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">공개 페이지 데이터는 읽지 않습니다. 이 화면의 테스트 값만 관리단에 저장합니다.</p>${[...groups.entries()].map(([name,controls])=>`<section class="builder-control-group"><strong>${esc(name)}</strong><div class="builder-control-grid">${controls.map(control=>controlHtml(control,values[control.id])).join('')}</div></section>`).join('')}<div class="builder-library-architecture"><strong>구조</strong><br>관리단 → 컴포넌트 미리보기 → 설정값 저장<br>공개 페이지 연결은 최종 승인 후 별도 단계에서 진행합니다.</div></div><footer><button type="button" data-kit-reset>기본값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector)?.addEventListener('click',()=>inspector.hidden=true);
    $('[data-kit-reset]',inspector)?.addEventListener('click',()=>resetConfig(active));
    $$('[data-kit-control]',inspector).forEach(input=>{
      const update=()=>{const key=input.dataset.kitControl;const definition=item.controls.find(control=>control.id===key);let value=input.type==='checkbox'?input.checked:input.value;if(definition?.type==='range'||definition?.type==='number')value=Number(value);saveConfigKey(active,key,value);const unit=input.closest('.builder-control')?.querySelector('small');if(unit&&definition?.unit)unit.textContent=`${value}${definition.unit}`;};
      input.addEventListener('input',update);input.addEventListener('change',update);
    });
  }

  function renderSelector(){selector.innerHTML=ORDER.map(id=>`<button type="button" data-kit-ui="${id}" aria-pressed="${id===active}">${esc(LABEL[id])}</button>`).join('');$$('[data-kit-ui]',selector).forEach(button=>button.addEventListener('click',()=>select(button.dataset.kitUi)));}
  function renderTheme(){themeRoot.innerHTML='<span>색상</span>'+[['light','화이트'],['dark','다크'],['system','시스템']].map(([id,label])=>`<button type="button" data-kit-theme="${id}" aria-pressed="${theme===id}">${label}</button>`).join('');$$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.kitTheme;writeText(THEME_STORE,theme);renderTheme();workspace.dataset.theme=effectiveTheme();syncFrame();}));}
  function renderViewport(){viewportRoot.innerHTML='<span>화면</span>'+[['desktop','PC'],['mobile','모바일']].map(([id,label])=>`<button type="button" data-kit-viewport="${id}" aria-pressed="${viewport===id}">${label}</button>`).join('');$$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.kitViewport;writeText(VIEW_STORE,viewport);renderViewport();applyViewport();}));}
  function renderMode(){const key=MODE_KEY[active],control=key?capability(active)?.controls.find(item=>item.id===key):null;if(!key||!control){modeRoot.hidden=true;modeRoot.innerHTML='';return;}modeRoot.hidden=false;const current=displayedConfig(active)[key];modeRoot.innerHTML='<span>표현</span>'+(control.options||[]).map(value=>`<button type="button" data-kit-mode="${esc(value)}" aria-pressed="${current===value}">${esc(MODE_LABEL[value]||value)}</button>`).join('');$$('[data-kit-mode]',modeRoot).forEach(button=>button.addEventListener('click',()=>saveConfigKey(active,key,button.dataset.kitMode)));}
  function renderState(){const options=STATE_OPTIONS[active];if(!options){stateRoot.hidden=true;stateRoot.innerHTML='';return;}stateRoot.hidden=false;const current=stateFor(active);stateRoot.innerHTML='<span>상태</span>'+options.map(([value,label])=>`<button type="button" data-kit-state="${value}" aria-pressed="${current===value}">${label}</button>`).join('');$$('[data-kit-state]',stateRoot).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.kitState)));}
  function renderFilterTools(){
    const visible=active==='filter-chip-rail';filterItemsRoot.hidden=!visible;filterItemStyleRoot.hidden=!visible;if(!visible)return;
    filterItemsRoot.innerHTML='<span>샘플 칩</span><input type="text" maxlength="24" placeholder="칩 이름" aria-label="추가할 칩 이름"><button type="button" data-filter-add>추가</button><button type="button" data-filter-remove>마지막 삭제</button><button type="button" data-filter-reset>기본</button>';
    const input=$('input',filterItemsRoot);const add=()=>{const label=String(input?.value||'').trim();if(!label)return;const items=readFilterItems();if(items.length>=24||items.includes(label))return;items.push(label);writeFilterItems(items);selectedFilterLabel=label;input.value='';renderFilterTools();syncFrame();};
    $('[data-filter-add]',filterItemsRoot)?.addEventListener('click',add);input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();add();}});
    $('[data-filter-remove]',filterItemsRoot)?.addEventListener('click',()=>{const items=readFilterItems();if(items.length<=1)return;const removed=items.pop();writeFilterItems(items);const overrides=readFilterOverrides();delete overrides[removed];writeFilterOverrides(overrides);if(!items.includes(selectedFilterLabel))selectedFilterLabel=items[0];renderFilterTools();syncFrame();});
    $('[data-filter-reset]',filterItemsRoot)?.addEventListener('click',()=>{writeFilterItems([...DEFAULT_FILTER_ITEMS]);writeFilterOverrides({});selectedFilterLabel=DEFAULT_FILTER_ITEMS[0];renderFilterTools();syncFrame();});
    const overrides=readFilterOverrides();const current=overrides[selectedFilterLabel]||'inherit';filterItemStyleRoot.innerHTML=`<span>선택 칩</span><strong>${esc(selectedFilterLabel)}</strong><select aria-label="선택 칩 스타일"><option value="inherit" ${current==='inherit'?'selected':''}>공통값 사용</option><option value="material-flat" ${current==='material-flat'?'selected':''}>Material</option><option value="ios-flat" ${current==='ios-flat'?'selected':''}>iOS 플랫</option><option value="ios-liquid" ${current==='ios-liquid'?'selected':''}>iOS 리퀴드</option></select>`;
    $('select',filterItemStyleRoot)?.addEventListener('change',event=>{const next=readFilterOverrides();const value=event.target.value;if(value==='inherit')delete next[selectedFilterLabel];else next[selectedFilterLabel]=value;writeFilterOverrides(next);syncFrame();});
  }
  function applyViewport(){workspace.dataset.viewport=viewport;frame.style.width='100%';frame.style.maxWidth='100%';}

  function select(id){
    if(!ORDER.includes(id))return;active=id;renderSelector();renderMode();renderState();renderFilterTools();title.textContent=LABEL[id];meta.textContent=META[id]||'';hint.textContent=HINT[id]||'';workspace.dataset.activeUi=id;workspace.style.setProperty('--kit-preview-height',`${PREVIEW_HEIGHT[id]||420}px`);workspace.dataset.theme=effectiveTheme();applyViewport();const url=new URL(location.href);url.searchParams.set('view','library');url.searchParams.set('ui',id);history.replaceState({},'',url);if(status){status.hidden=false;status.textContent='UI를 준비하는 중';}frame.src=`/ui-dashboard/component-preview/?component=${encodeURIComponent(id)}&v=1`;if(!inspector.hidden)openInspector();
  }

  settings.addEventListener('click',openInspector);
  frame.addEventListener('load',()=>{setTimeout(syncFrame,20);setTimeout(syncFrame,100);});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;const data=event.data||{};if(data.capabilityId!==active)return;
    if(data.type==='platform-component-preview-ready'){if(status)status.hidden=true;syncFrame();return;}
    if(data.type==='platform-preview-state-change'&&data.state){saveState(active,data.state,{fromPreview:true});return;}
    if(data.type==='platform-filter-chip-selection-change'&&active==='filter-chip-rail'&&data.label){selectedFilterLabel=String(data.label);renderFilterTools();}
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme==='system'){workspace.dataset.theme=effectiveTheme();syncFrame();}});

  renderSelector();renderTheme();renderViewport();renderMode();renderState();renderFilterTools();workspace.dataset.theme=effectiveTheme();select(active);
})();
