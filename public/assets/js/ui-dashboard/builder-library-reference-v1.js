(function(){
  if(window.__platformCanonicalLibraryV1)return;
  window.__platformCanonicalLibraryV1=true;

  const registry=window.PlatformModuleRegistry;
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const root=$('.builder-shell');
  const tools=$('#builderLibraryTools');
  const filters=$('#builderLibraryFilters');
  const stage=$('.builder-stage');
  const shell=$('#builderCanvasShell');
  const frame=$('#builderFrame');
  const status=$('#builderFrameStatus');
  if(!registry||!manifest||!root||!tools||!filters||!shell||!frame)return;

  const approved=registry.listFor('library');
  const ORDER=approved.map(item=>item.id);
  if(!ORDER.length){if(status)status.textContent='승인된 공통 모듈이 없습니다.';return;}

  const CONFIG_STORE='platformBuilderCapabilityConfigsV2';
  const THEME_STORE='platformBuilderPreviewThemeV2';
  const VIEW_STORE='platformBuilderPreviewViewportV2';
  const STATE_STORE='platformBuilderKitStateV2';
  const FILTER_ITEMS_STORE='platformBuilderFilterPreviewItemsV3';
  const FILTER_ITEMS_OLD='platformBuilderFilterPreviewItemsV2';
  const FILTER_SELECTED_STORE='platformBuilderFilterPreviewSelectedV1';
  const DEFAULT_FILTER_ITEMS=[
    {id:'all',label:'전체',family:'inherit'},
    {id:'product',label:'제품 촬영',family:'inherit'},
    {id:'portrait',label:'인물 촬영',family:'inherit'},
    {id:'food',label:'음식 촬영',family:'inherit'}
  ];
  const HEIGHT={
    'top-chapter-navigation':220,
    'horizontal-card-rail':500,
    'filter-chip-rail':230,
    'collection-bottom-sheet':760,
    'device-handoff-accordion':480,
    'floating-action':300
  };
  const STATE_OPTIONS={
    'collection-bottom-sheet':[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']],
    'device-handoff-accordion':[['collapsed','접힘'],['expanded','펼침']]
  };
  const SOURCE_LABEL={'public-extracted':'공개 페이지 추출','block-lab-approved':'블록 연구실 승인','platform-core':'플랫폼 공통'};
  const GROUP_LABEL={basic:'기본',advanced:'세부',motion:'움직임',safety:'안전',input:'입력','left-edge':'왼쪽 끝','right-edge':'오른쪽 끝',visibility:'표시','스타일':'스타일','여백과 간격':'여백과 간격','움직임':'움직임'};
  const VALUE_LABEL={'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',hidden:'숨김',auto:'필요할 때',flat:'플랫',glass:'글래스',liquid:'리퀴드','chapter-wash':'메뉴 배경',line:'얇은 선',measured:'자동 측정','alpha-mask':'알파 마스크'};

  const params=new URLSearchParams(location.search);
  let active=ORDER.includes(params.get('ui'))?params.get('ui'):ORDER[0];
  let theme=readText(THEME_STORE,'light');if(!['light','dark','system'].includes(theme))theme='light';
  let viewport=readText(VIEW_STORE,'desktop');if(!['desktop','mobile'].includes(viewport))viewport='desktop';
  let frameReady=false;

  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const uid=()=>`chip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  function readText(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function writeText(key,value){try{localStorage.setItem(key,value);}catch{}}
  function readJson(key,fallback={}){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:fallback;}catch{return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function definition(id=active){return registry.get(id);}
  function capability(id=active){return manifest.capabilities.find(item=>item.id===id)||null;}
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
  function writeFilterItems(items){writeJson(FILTER_ITEMS_STORE,normalizeFilterItems(items));}
  function readFilterItems(){
    const current=normalizeFilterItems(readJson(FILTER_ITEMS_STORE,[]));if(current.length)return current;
    const old=normalizeFilterItems(readJson(FILTER_ITEMS_OLD,[]));if(old.length){writeFilterItems(old);return old;}
    const defaults=DEFAULT_FILTER_ITEMS.map(item=>({...item}));writeFilterItems(defaults);return defaults;
  }
  function selectedFilterId(){return readText(FILTER_SELECTED_STORE,'');}
  function setSelectedFilterId(id){writeText(FILTER_SELECTED_STORE,id||'');}
  function selectedFilterItem(items=readFilterItems()){
    const id=selectedFilterId();const item=items.find(entry=>entry.id===id)||items[0]||null;
    if(item&&item.id!==id)setSelectedFilterId(item.id);return item;
  }

  function stateFor(id){
    const stored=readJson(STATE_STORE,{})[id];if(stored)return stored;
    if(id==='collection-bottom-sheet')return'all';
    if(id==='device-handoff-accordion')return'collapsed';
    return'';
  }
  function saveState(id,value,{fromPreview=false}={}){
    const all=readJson(STATE_STORE,{});all[id]=value;writeJson(STATE_STORE,all);
    if(!fromPreview)post({type:'platform-kit-state',capabilityId:id,state:value});
    refreshInspectorState();
  }
  function saveConfigKey(id,key,value){
    const all=readJson(CONFIG_STORE,{});const next={...(all[id]||{})};next[key]=value;all[id]=next;writeJson(CONFIG_STORE,all);syncFrame();
  }
  function resetConfig(id){
    const all=readJson(CONFIG_STORE,{});delete all[id];writeJson(CONFIG_STORE,all);syncFrame();if(!inspector.hidden)openInspector();
  }

  root.dataset.builderView='library';
  tools.hidden=false;
  if(stage)stage.hidden=false;
  filters.innerHTML='';

  const selector=document.createElement('nav');
  selector.className='builder-kit-selector';selector.setAttribute('aria-label','승인된 공통 UI 모듈');filters.appendChild(selector);
  const controlBar=document.createElement('div');
  controlBar.className='builder-kit-controls builder-kit-controls--primary';
  controlBar.innerHTML='<div class="builder-kit-switch" id="kitTheme"></div><div class="builder-kit-switch" id="kitViewport"></div>';
  tools.appendChild(controlBar);

  const workspace=document.createElement('main');
  workspace.className='builder-kit-workspace';
  workspace.innerHTML='<header class="builder-kit-head"><div><small id="kitMeta"></small><strong id="kitTitle"></strong><span id="kitHint"></span></div><button type="button" id="kitSettings">설정</button></header><div class="builder-kit-canvas" id="kitCanvas"></div>';
  tools.insertAdjacentElement('afterend',workspace);
  $('#kitCanvas',workspace).appendChild(shell);shell.classList.add('builder-kit-frame-shell');

  const title=$('#kitTitle',workspace),meta=$('#kitMeta',workspace),hint=$('#kitHint',workspace);
  const themeRoot=$('#kitTheme',controlBar),viewportRoot=$('#kitViewport',controlBar),settings=$('#kitSettings',workspace);
  const inspector=document.createElement('aside');inspector.className='builder-library-audit-inspector builder-kit-inspector';inspector.hidden=true;document.body.appendChild(inspector);

  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';
    const label=`<span>${esc(control.label)}${control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:''}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-kit-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-kit-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(VALUE_LABEL[option]||option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-kit-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="range" data-kit-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }

  function stateSection(){
    const options=STATE_OPTIONS[active];if(!options)return'';
    const current=stateFor(active);
    return `<section class="builder-control-group builder-preview-state-group"><strong>미리보기 상태</strong><div class="builder-preview-state-options">${options.map(([value,label])=>`<button type="button" data-inspector-state="${esc(value)}" aria-pressed="${current===value}">${esc(label)}</button>`).join('')}</div></section>`;
  }

  function filterItemsSection(){
    if(active!=='filter-chip-rail')return'';
    const items=readFilterItems(),selected=selectedFilterItem(items);
    return `<section class="builder-control-group builder-filter-item-editor"><strong>샘플 필터칩</strong><div class="builder-filter-item-editor__add"><input type="text" maxlength="24" data-filter-add-input placeholder="칩 이름"><button type="button" data-filter-add>추가</button><button type="button" data-filter-remove>마지막 삭제</button><button type="button" data-filter-reset>기본</button></div><div class="builder-filter-item-editor__selected"><span data-filter-selected>${selected?`선택: ${esc(selected.label)}`:'칩을 선택하세요'}</span><label>선택한 칩 스타일<select data-filter-family><option value="inherit" ${selected?.family==='inherit'?'selected':''}>공통값 사용</option><option value="material-flat" ${selected?.family==='material-flat'?'selected':''}>Material</option><option value="ios-flat" ${selected?.family==='ios-flat'?'selected':''}>iOS 플랫</option><option value="ios-liquid" ${selected?.family==='ios-liquid'?'selected':''}>iOS 리퀴드</option></select></label></div></section>`;
  }

  function openInspector(){
    const def=definition(),cap=capability(),values=displayedConfig(active),groups=new Map();
    (cap?.controls||[]).forEach(control=>{const name=GROUP_LABEL[control.group]||control.group||'설정';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(control);});
    const provenance=registry.provenance(active);
    inspector.innerHTML=`<header><div><small>승인된 공통 모듈</small><strong>${esc(def?.label||active)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">${esc(SOURCE_LABEL[provenance?.source]||provenance?.source||'공통 모듈')}에서 승격된 코드입니다. 블록 연구실 코드는 직접 불러오지 않습니다.</p>${stateSection()}${filterItemsSection()}${[...groups.entries()].map(([name,controls])=>`<section class="builder-control-group"><strong>${esc(name)}</strong><div class="builder-control-grid">${controls.map(control=>controlHtml(control,values[control.id])).join('')}</div></section>`).join('')}</div><footer><button type="button" data-kit-reset>기본값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector)?.addEventListener('click',()=>inspector.hidden=true);
    $('[data-kit-reset]',inspector)?.addEventListener('click',()=>resetConfig(active));
    $$('[data-kit-control]',inspector).forEach(input=>{
      const update=()=>{const key=input.dataset.kitControl;const definition=(cap?.controls||[]).find(control=>control.id===key);let value=input.type==='checkbox'?input.checked:input.value;if(definition?.type==='range'||definition?.type==='number')value=Number(value);saveConfigKey(active,key,value);const unit=input.closest('.builder-control')?.querySelector('small');if(unit&&definition?.unit)unit.textContent=`${value}${definition.unit}`;};
      input.addEventListener('input',update);input.addEventListener('change',update);
    });
    $$('[data-inspector-state]',inspector).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.inspectorState||'')));
    bindFilterItemEditor();
  }

  function bindFilterItemEditor(){
    if(active!=='filter-chip-rail'||inspector.hidden)return;
    const input=$('[data-filter-add-input]',inspector);
    const send=items=>post({type:'platform-filter-chip-preview-items',items});
    const add=()=>{const label=String(input?.value||'').trim();if(!label)return;const items=readFilterItems();if(items.length>=20)return;const item={id:uid(),label,family:'inherit'};items.push(item);writeFilterItems(items);setSelectedFilterId(item.id);if(input)input.value='';send(items);refreshFilterItemEditor();};
    $('[data-filter-add]',inspector)?.addEventListener('click',add);input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();add();}});
    $('[data-filter-remove]',inspector)?.addEventListener('click',()=>{const items=readFilterItems();if(items.length<=1)return;const removed=items.pop();writeFilterItems(items);if(selectedFilterId()===removed?.id)setSelectedFilterId(items.at(-1)?.id||items[0]?.id||'');send(items);refreshFilterItemEditor();});
    $('[data-filter-reset]',inspector)?.addEventListener('click',()=>{const items=DEFAULT_FILTER_ITEMS.map(item=>({...item}));writeFilterItems(items);setSelectedFilterId(items[0].id);send(items);refreshFilterItemEditor();});
    $('[data-filter-family]',inspector)?.addEventListener('change',event=>{const items=readFilterItems(),selected=selectedFilterItem(items);if(!selected)return;const family=String(event.target.value||'inherit');const next=items.map(item=>item.id===selected.id?{...item,family}:item);writeFilterItems(next);send(next);refreshFilterItemEditor();});
  }

  function refreshFilterItemEditor(){
    if(active!=='filter-chip-rail'||inspector.hidden)return;const selected=selectedFilterItem();const label=$('[data-filter-selected]',inspector),select=$('[data-filter-family]',inspector);if(label)label.textContent=selected?`선택: ${selected.label}`:'칩을 선택하세요';if(select&&selected)select.value=selected.family;
  }
  function refreshInspectorState(){if(inspector.hidden)return;const current=stateFor(active);$$('[data-inspector-state]',inspector).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.inspectorState===current)));}

  function renderSelector(){
    selector.innerHTML=approved.map(item=>`<button type="button" data-kit-ui="${esc(item.id)}" aria-pressed="${item.id===active}">${esc(item.label)}</button>`).join('');
    $$('[data-kit-ui]',selector).forEach(button=>button.addEventListener('click',()=>select(button.dataset.kitUi)));
  }
  function renderTheme(){
    themeRoot.innerHTML='<span>색상</span>'+[['light','화이트'],['dark','다크'],['system','시스템']].map(([id,label])=>`<button type="button" data-kit-theme="${id}" aria-pressed="${theme===id}">${label}</button>`).join('');
    $$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.kitTheme;writeText(THEME_STORE,theme);renderTheme();workspace.dataset.theme=effectiveTheme();workspace.dataset.themeChoice=theme;syncFrame();}));
  }
  function renderViewport(){
    viewportRoot.innerHTML='<span>화면</span>'+[['desktop','PC'],['mobile','모바일']].map(([id,label])=>`<button type="button" data-kit-viewport="${id}" aria-pressed="${viewport===id}">${label}</button>`).join('');
    $$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.kitViewport;writeText(VIEW_STORE,viewport);renderViewport();applyViewport();}));
  }
  function applyViewport(){workspace.dataset.viewport=viewport;frame.style.width=viewport==='mobile'?'390px':'100%';frame.style.maxWidth='100%';}

  function syncFrame(){
    if(!frameReady)return;
    post({type:'platform-theme',theme});
    ORDER.forEach(id=>post({type:'platform-ui-reset',capabilityId:id}));
    const shared=savedConfig('filter-chip-rail');if(shared&&Object.keys(shared).length)post({type:'platform-ui-config',capabilityId:'filter-chip-rail',config:shared});
    const own=savedConfig(active);if(own&&Object.keys(own).length)post({type:'platform-ui-config',capabilityId:active,config:own});
    const state=stateFor(active);if(state)post({type:'platform-kit-state',capabilityId:active,state});
    if(active==='filter-chip-rail'||active==='collection-bottom-sheet')post({type:'platform-filter-chip-preview-items',items:readFilterItems()});
  }

  function select(id){
    if(!ORDER.includes(id))return;
    active=id;frameReady=false;renderSelector();
    const def=definition(id),provenance=registry.provenance(id);
    title.textContent=def?.label||id;
    meta.textContent=SOURCE_LABEL[provenance?.source]||provenance?.source||'';
    hint.textContent=`${id} · v${provenance?.version||1}`;
    workspace.dataset.activeUi=id;workspace.style.setProperty('--kit-preview-height',`${HEIGHT[id]||420}px`);applyViewport();workspace.dataset.theme=effectiveTheme();workspace.dataset.themeChoice=theme;
    const url=new URL(location.href);url.searchParams.delete('view');url.searchParams.set('ui',id);history.replaceState({},'',url);
    if(status){status.hidden=false;status.textContent='공통 모듈을 불러오는 중';}
    frame.src=`/ui-dashboard/module-preview/?module=${encodeURIComponent(id)}&embed=library&v=2`;
    if(!inspector.hidden)openInspector();
  }

  settings.addEventListener('click',openInspector);
  frame.addEventListener('load',()=>setTimeout(()=>{if(frameReady)syncFrame();},80));
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;const data=event.data||{};
    if(data.type==='platform-preview-ready'&&data.moduleId===active&&data.canonicalModule){frameReady=true;if(status)status.hidden=true;syncFrame();return;}
    if(data.type==='platform-filter-chip-selection'&&active==='filter-chip-rail'){const id=String(data.id||'');if(id){setSelectedFilterId(id);refreshFilterItemEditor();}return;}
    if(data.type==='platform-preview-state-change'&&data.moduleId===active&&data.state)saveState(active,data.state,{fromPreview:true});
  });
  const media=matchMedia('(prefers-color-scheme: dark)');media.addEventListener?.('change',()=>{if(theme==='system'){workspace.dataset.theme=effectiveTheme();syncFrame();}});

  renderSelector();renderTheme();renderViewport();select(active);
})();
