(function(){
  if(window.__platformCanonicalLibraryV6)return;
  window.__platformCanonicalLibraryV6=true;

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
  if(!registry||!root||!tools||!filters||!shell||!frame)return;

  const approved=registry.listFor('library');
  const order=approved.map(item=>item.id);
  if(!order.length){if(status)status.textContent='승인된 공통 모듈이 없습니다.';return;}

  const THEME_KEY='platformLibraryThemeV3';
  const VIEWPORT_KEY='platformLibraryViewportV3';
  const STATE_KEY='platformLibraryStateV3';
  const STYLE_KEY='platformModuleDefaultsV1';
  const CONTENT_KEY='platformModuleContentDefaultsV1';
  const SOURCE_LABEL={'public-extracted':'공개 페이지에서 추출','block-lab-approved':'블록 연구실 승인','platform-core':'플랫폼 공통'};
  const VALUE_LABEL={'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',hidden:'숨김',auto:'자동',flat:'플랫',glass:'글래스',liquid:'리퀴드','chapter-wash':'메뉴 배경',line:'얇은 선',measured:'자동 측정','alpha-mask':'알파 마스크'};
  const PREVIEW_SPEC={
    'top-chapter-navigation':{desktop:440,mobile:420,interaction:'vertical-scroll'},
    'horizontal-card-rail':{desktop:700,mobile:650,interaction:'horizontal-scroll'},
    'filter-chip-rail':{desktop:300,mobile:280,interaction:'selector'},
    'collection-bottom-sheet':{desktop:900,mobile:820,interaction:'overlay'},
    'device-handoff-accordion':{desktop:720,mobile:720,interaction:'accordion'},
    'floating-action':{desktop:420,mobile:420,interaction:'action'}
  };
  const STATE_OPTIONS={'collection-bottom-sheet':[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']],'device-handoff-accordion':[['collapsed','접힘'],['expanded','펼침']]};

  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const readText=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
  const writeText=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
  const readJson=(key,fallback={})=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:fallback;}catch{return fallback;}};
  const writeJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const params=new URLSearchParams(location.search);
  let active=order.includes(params.get('ui'))?params.get('ui'):order[0];
  let theme=readText(THEME_KEY,'light');if(!['light','dark','system'].includes(theme))theme='light';
  let viewport=readText(VIEWPORT_KEY,'desktop');if(!['desktop','mobile'].includes(viewport))viewport='desktop';
  let frameReady=false;

  function definition(id=active){return registry.get(id);}
  function provenance(id=active){return registry.provenance(id);}
  function capability(id=active){return manifest?.capabilities?.find(item=>item.id===id)||null;}
  function baselineStyle(id=active){const def=definition(id);if(def?.styleDefaults)return registry.clone(def.styleDefaults);const value={};(capability(id)?.controls||[]).forEach(control=>value[control.id]=control.default);return value;}
  function styleFor(id=active){return {...baselineStyle(id),...(readJson(STYLE_KEY,{})[id]||{})};}
  function saveStyleKey(id,key,value){const all=readJson(STYLE_KEY,{});all[id]={...(all[id]||{}),[key]:value};writeJson(STYLE_KEY,all);post({type:'platform-module-style',moduleId:id,config:styleFor(id)});}
  function resetStyle(id=active){const all=readJson(STYLE_KEY,{});delete all[id];writeJson(STYLE_KEY,all);post({type:'platform-module-style',moduleId:id,config:styleFor(id)});openInspector();}
  function baselineContent(id=active){return registry.clone(registry.previewProps(id)||{});}
  function contentFor(id=active){return {...baselineContent(id),...(readJson(CONTENT_KEY,{})[id]||{})};}
  function saveContent(id,patch){const all=readJson(CONTENT_KEY,{});all[id]={...(all[id]||{}),...(patch||{})};writeJson(CONTENT_KEY,all);post({type:'platform-module-props',moduleId:id,props:contentFor(id)});}
  function resetContent(id=active){const all=readJson(CONTENT_KEY,{});delete all[id];writeJson(CONTENT_KEY,all);post({type:'platform-module-props',moduleId:id,props:contentFor(id)});openInspector();}
  function stateFor(id){const stored=readJson(STATE_KEY,{})[id];if(stored)return stored;if(id==='collection-bottom-sheet')return'all';if(id==='device-handoff-accordion')return'collapsed';return'';}
  function saveState(id,value,{fromPreview=false}={}){const all=readJson(STATE_KEY,{});all[id]=value;writeJson(STATE_KEY,all);if(!fromPreview)post({type:'platform-kit-state',capabilityId:id,state:value});if(!inspector.hidden)openInspector();}
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function effectiveTheme(){return theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;}

  root.dataset.builderView='library';tools.hidden=false;if(stage)stage.hidden=false;filters.innerHTML='';
  const selector=document.createElement('nav');selector.className='builder-kit-selector';selector.setAttribute('aria-label','승인된 공통 UI 모듈');filters.appendChild(selector);
  const controlBar=document.createElement('div');controlBar.className='builder-kit-controls builder-kit-controls--primary';controlBar.innerHTML='<div class="builder-kit-switch" id="kitTheme"></div><div class="builder-kit-switch" id="kitViewport"></div>';tools.appendChild(controlBar);
  const workspace=document.createElement('main');workspace.className='builder-kit-workspace';workspace.innerHTML='<header class="builder-kit-head"><div><small id="kitMeta"></small><strong id="kitTitle"></strong><span id="kitHint"></span></div><button type="button" id="kitSettings">스타일 / 상태</button></header><div class="builder-kit-canvas" id="kitCanvas"></div>';tools.insertAdjacentElement('afterend',workspace);
  $('#kitCanvas',workspace).appendChild(shell);shell.classList.add('builder-kit-frame-shell');

  const title=$('#kitTitle',workspace),meta=$('#kitMeta',workspace),hint=$('#kitHint',workspace),themeRoot=$('#kitTheme',controlBar),viewportRoot=$('#kitViewport',controlBar),settings=$('#kitSettings',workspace);
  const inspector=document.createElement('aside');inspector.className='builder-library-audit-inspector builder-kit-inspector';inspector.hidden=true;document.body.appendChild(inspector);

  function renderSelector(){selector.innerHTML=approved.map(item=>`<button type="button" data-kit-ui="${esc(item.id)}" aria-pressed="${item.id===active?'true':'false'}">${esc(item.label)}</button>`).join('');$$('[data-kit-ui]',selector).forEach(button=>button.addEventListener('click',()=>select(button.dataset.kitUi)));}
  function renderTheme(){themeRoot.innerHTML=`<span>테마</span>${[['light','화이트'],['dark','다크'],['system','시스템']].map(([value,label])=>`<button type="button" data-kit-theme="${value}" aria-pressed="${theme===value?'true':'false'}">${label}</button>`).join('')}`;$$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.kitTheme;writeText(THEME_KEY,theme);renderTheme();applyViewport();syncFrame();}));}
  function renderViewport(){viewportRoot.innerHTML=`<span>화면</span>${[['desktop','PC'],['mobile','모바일']].map(([value,label])=>`<button type="button" data-kit-viewport="${value}" aria-pressed="${viewport===value?'true':'false'}">${label}</button>`).join('')}`;$$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.kitViewport;writeText(VIEWPORT_KEY,viewport);renderViewport();applyViewport();syncFrame();}));}
  function renderHead(){const def=definition(),origin=provenance();title.textContent=def?.label||active;meta.textContent=`${SOURCE_LABEL[origin?.source]||origin?.source||'공통 모듈'} · v${origin?.version||1}`;hint.textContent='내용과 스타일 기본값은 블록 에디터에서 새 모듈을 추가할 때 복사됩니다.';}

  function controlHtml(control,value){const disabled=control.locked?'disabled':'';const suffix=control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:'';const label=`<span>${esc(control.label)}${suffix}</span>`;if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-style-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;if(control.type==='enum')return `<label class="builder-control">${label}<select data-style-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(VALUE_LABEL[option]||option)}</option>`).join('')}</select></label>`;if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-style-control="${esc(control.id)}" value="${esc(value||'#437ce7')}" ${disabled}></label>`;return `<label class="builder-control">${label}<input type="range" data-style-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;}
  function stateHtml(){const options=STATE_OPTIONS[active];if(!options)return'';const current=stateFor(active);return `<section class="builder-control-group"><strong>미리보기 상태</strong><div class="builder-preview-state-options">${options.map(([value,label])=>`<button type="button" data-inspector-state="${esc(value)}" aria-pressed="${current===value?'true':'false'}">${esc(label)}</button>`).join('')}</div></section>`;}
  function filterItems(){const value=contentFor('filter-chip-rail').items;const source=Array.isArray(value)?value:[];return source.map((item,index)=>String(item&&typeof item==='object'?(item.label||item.value||item.name||''):item||'').trim()||`메뉴 ${index+1}`);}
  function filterMenuHtml(){if(active!=='filter-chip-rail')return'';const items=filterItems();return `<section class="builder-control-group builder-module-content-editor"><div class="builder-control-group__title"><strong>메뉴 항목</strong><small>신규 페이지의 범용 필터칩 기본 메뉴</small></div><div class="builder-menu-list">${items.map((label,index)=>`<div class="builder-menu-row" data-menu-index="${index}"><input type="text" value="${esc(label)}" data-menu-label="${index}" aria-label="메뉴 ${index+1}"><button type="button" data-menu-up="${index}" ${index===0?'disabled':''} aria-label="위로">↑</button><button type="button" data-menu-down="${index}" ${index===items.length-1?'disabled':''} aria-label="아래로">↓</button><button type="button" data-menu-remove="${index}" ${items.length<=1?'disabled':''}>삭제</button></div>`).join('')}</div><button type="button" class="builder-menu-add" data-menu-add>+ 메뉴 추가</button></section>`;}
  function writeFilterItems(items){saveContent('filter-chip-rail',{items:[...items],activeId:'all'});}
  function bindFilterMenu(){
    if(active!=='filter-chip-rail')return;
    $$('[data-menu-label]',inspector).forEach(input=>input.addEventListener('change',()=>{const items=filterItems();const index=Number(input.dataset.menuLabel);items[index]=input.value.trim()||`메뉴 ${index+1}`;writeFilterItems(items);input.value=items[index];}));
    $('[data-menu-add]',inspector)?.addEventListener('click',()=>{const items=filterItems();items.push(`메뉴 ${items.length+1}`);writeFilterItems(items);openInspector();});
    $$('[data-menu-remove]',inspector).forEach(button=>button.addEventListener('click',()=>{const items=filterItems();if(items.length<=1)return;items.splice(Number(button.dataset.menuRemove),1);writeFilterItems(items);openInspector();}));
    $$('[data-menu-up]',inspector).forEach(button=>button.addEventListener('click',()=>{const items=filterItems(),index=Number(button.dataset.menuUp);if(index<=0)return;[items[index-1],items[index]]=[items[index],items[index-1]];writeFilterItems(items);openInspector();}));
    $$('[data-menu-down]',inspector).forEach(button=>button.addEventListener('click',()=>{const items=filterItems(),index=Number(button.dataset.menuDown);if(index<0||index>=items.length-1)return;[items[index+1],items[index]]=[items[index],items[index+1]];writeFilterItems(items);openInspector();}));
  }
  function openInspector(){
    const origin=provenance(),def=definition(),cap=capability(),values=styleFor(active);const files=(origin?.ownerFiles||[]).map(file=>`<li><code>${esc(file)}</code></li>`).join('');
    inspector.innerHTML=`<header><div><small>MODULE SETTINGS</small><strong>${esc(def?.label||active)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">공개 페이지의 실제 모듈을 편집합니다. 저장된 기본값은 새 모듈을 추가할 때 인스턴스로 복사됩니다.</p>${filterMenuHtml()}${stateHtml()}<section class="builder-control-group"><strong>스타일</strong><div class="builder-control-grid">${(cap?.controls||[]).map(control=>controlHtml(control,values[control.id])).join('')||'<p>추가 스타일 설정이 없습니다.</p>'}</div></section><section class="builder-control-group"><strong>코드 정보</strong><p><code>${esc(active)}</code> · ${esc((origin?.consumers||[]).join(' / '))}</p><ul class="builder-module-owner-files">${files}</ul></section></div><footer>${active==='filter-chip-rail'?'<button type="button" data-content-reset>메뉴 기본값 복원</button>':''}<button type="button" data-style-reset>스타일 기본값 복원</button></footer>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector)?.addEventListener('click',()=>inspector.hidden=true);
    $('[data-style-reset]',inspector)?.addEventListener('click',()=>resetStyle(active));
    $('[data-content-reset]',inspector)?.addEventListener('click',()=>resetContent(active));
    $$('[data-inspector-state]',inspector).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.inspectorState||'')));
    $$('[data-style-control]',inspector).forEach(input=>{const update=()=>{const key=input.dataset.styleControl;const control=(cap?.controls||[]).find(item=>item.id===key);let value=input.type==='checkbox'?input.checked:input.value;if(control?.type==='range'||control?.type==='number')value=Number(value);saveStyleKey(active,key,value);const small=input.closest('.builder-control')?.querySelector('small');if(small&&control?.unit)small.textContent=`${value}${control.unit}`;};input.addEventListener('input',update);input.addEventListener('change',update);});
    bindFilterMenu();
  }

  function previewSpec(){return PREVIEW_SPEC[active]||{desktop:560,mobile:560,interaction:'module'};}
  function applyViewport(){const spec=previewSpec();workspace.dataset.activeUi=active;workspace.dataset.viewport=viewport;workspace.dataset.theme=effectiveTheme();shell.dataset.viewport=viewport;shell.dataset.interaction=spec.interaction;shell.style.setProperty('--kit-preview-height',`${viewport==='mobile'?spec.mobile:spec.desktop}px`);if(viewport==='mobile'){frame.style.width='390px';shell.style.width='min(100%, 430px)';}else{frame.style.width='100%';shell.style.width='100%';}frame.style.height='100%';}
  function syncFrame(){if(!frameReady)return;post({type:'platform-theme',theme:effectiveTheme()});post({type:'platform-module-props',moduleId:active,props:contentFor(active)});post({type:'platform-module-style',moduleId:active,config:styleFor(active)});const current=stateFor(active);if(current)post({type:'platform-kit-state',capabilityId:active,state:current});}
  function setUrl(){const url=new URL(location.href);url.searchParams.set('ui',active);history.replaceState(null,'',url);}
  function loadFrame(){frameReady=false;if(status){status.hidden=false;status.textContent='공개 페이지 공통 모듈을 불러오는 중';}frame.src=`/ui-dashboard/module-preview/?module=${encodeURIComponent(active)}&embed=library&v=4`;applyViewport();}
  function select(id){if(!order.includes(id))return;active=id;setUrl();renderSelector();renderHead();loadFrame();if(!inspector.hidden)openInspector();}

  /* The preview-ready message owns initial synchronization. A second delayed
     load-time sync remounted fast modules with identical props and could reopen
     a bottom sheet immediately after a close/drag interaction. */
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;const data=event.data||{};if(data.moduleId!==active&&data.capabilityId!==active)return;if(data.type==='platform-preview-ready'){frameReady=true;if(status)status.hidden=true;syncFrame();return;}if(data.type==='platform-preview-error'){if(status){status.hidden=false;status.textContent=data.message||'모듈을 불러오지 못했습니다.';}return;}if(data.type==='platform-preview-state-change'&&STATE_OPTIONS[active])saveState(active,data.state||'',{fromPreview:true});});

  settings.addEventListener('click',openInspector);matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme==='system'){applyViewport();syncFrame();}});
  renderSelector();renderTheme();renderViewport();renderHead();applyViewport();loadFrame();
})();