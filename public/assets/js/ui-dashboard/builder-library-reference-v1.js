(function(){
  if(window.__platformCanonicalLibraryV4)return;
  window.__platformCanonicalLibraryV4=true;

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
  const SOURCE_LABEL={'public-extracted':'공개 페이지에서 추출','block-lab-approved':'블록 연구실 승인','platform-core':'플랫폼 공통'};
  const VALUE_LABEL={'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',hidden:'숨김',auto:'자동',flat:'플랫',glass:'글래스',liquid:'리퀴드','chapter-wash':'메뉴 배경',line:'얇은 선',measured:'자동 측정','alpha-mask':'알파 마스크'};
  const HEIGHT={'top-chapter-navigation':300,'horizontal-card-rail':600,'filter-chip-rail':320,'collection-bottom-sheet':820,'device-handoff-accordion':620,'floating-action':520};
  const STATE_OPTIONS={'collection-bottom-sheet':[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']],'device-handoff-accordion':[['collapsed','접힘'],['expanded','펼침']]};

  const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
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
  function baselineStyle(id=active){
    const def=definition(id);if(def?.styleDefaults)return registry.clone(def.styleDefaults);
    const value={};(capability(id)?.controls||[]).forEach(control=>value[control.id]=control.default);return value;
  }
  function styleFor(id=active){return {...baselineStyle(id),...(readJson(STYLE_KEY,{})[id]||{})};}
  function saveStyleKey(id,key,value){const all=readJson(STYLE_KEY,{});all[id]={...(all[id]||{}),[key]:value};writeJson(STYLE_KEY,all);post({type:'platform-module-style',moduleId:id,config:styleFor(id)});}
  function resetStyle(id=active){const all=readJson(STYLE_KEY,{});delete all[id];writeJson(STYLE_KEY,all);post({type:'platform-module-style',moduleId:id,config:styleFor(id)});openInspector();}
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
  function renderTheme(){themeRoot.innerHTML=`<span>테마</span>${[['light','화이트'],['dark','다크'],['system','시스템']].map(([value,label])=>`<button type="button" data-kit-theme="${value}" aria-pressed="${theme===value?'true':'false'}">${label}</button>`).join('')}`;$$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.kitTheme;writeText(THEME_KEY,theme);renderTheme();syncFrame();}));}
  function renderViewport(){viewportRoot.innerHTML=`<span>화면</span>${[['desktop','PC'],['mobile','모바일']].map(([value,label])=>`<button type="button" data-kit-viewport="${value}" aria-pressed="${viewport===value?'true':'false'}">${label}</button>`).join('')}`;$$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.kitViewport;writeText(VIEWPORT_KEY,viewport);renderViewport();applyViewport();syncFrame();}));}
  function renderHead(){const def=definition(),origin=provenance();title.textContent=def?.label||active;meta.textContent=`${SOURCE_LABEL[origin?.source]||origin?.source||'공통 모듈'} · v${origin?.version||1}`;hint.textContent='현재 값은 블록 에디터에서 새 모듈을 추가할 때 기본값으로 사용됩니다.';}

  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';
    const suffix=control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:'';
    const label=`<span>${esc(control.label)}${suffix}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-style-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-style-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(VALUE_LABEL[option]||option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-style-control="${esc(control.id)}" value="${esc(value||'#437ce7')}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="range" data-style-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }
  function stateHtml(){const options=STATE_OPTIONS[active];if(!options)return'';const current=stateFor(active);return `<section class="builder-control-group"><strong>미리보기 상태</strong><div class="builder-preview-state-options">${options.map(([value,label])=>`<button type="button" data-inspector-state="${esc(value)}" aria-pressed="${current===value?'true':'false'}">${esc(label)}</button>`).join('')}</div></section>`;}
  function openInspector(){
    const origin=provenance(),def=definition(),cap=capability(),values=styleFor(active);const files=(origin?.ownerFiles||[]).map(file=>`<li><code>${esc(file)}</code></li>`).join('');
    inspector.innerHTML=`<header><div><small>MODULE SETTINGS</small><strong>${esc(def?.label||active)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">공개 페이지의 실제 모듈을 편집합니다. 변경값은 신규 페이지의 기본 모듈 설정으로 저장됩니다.</p>${stateHtml()}<section class="builder-control-group"><strong>스타일</strong><div class="builder-control-grid">${(cap?.controls||[]).map(control=>controlHtml(control,values[control.id])).join('')||'<p>추가 스타일 설정이 없습니다.</p>'}</div></section><section class="builder-control-group"><strong>코드 정보</strong><p><code>${esc(active)}</code> · ${esc((origin?.consumers||[]).join(' / '))}</p><ul class="builder-module-owner-files">${files}</ul></section></div><footer><button type="button" data-style-reset>공개 페이지 기본값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector)?.addEventListener('click',()=>inspector.hidden=true);
    $('[data-style-reset]',inspector)?.addEventListener('click',()=>resetStyle(active));
    $$('[data-inspector-state]',inspector).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.inspectorState||'')));
    $$('[data-style-control]',inspector).forEach(input=>{
      const update=()=>{const key=input.dataset.styleControl;const control=(cap?.controls||[]).find(item=>item.id===key);let value=input.type==='checkbox'?input.checked:input.value;if(control?.type==='range'||control?.type==='number')value=Number(value);saveStyleKey(active,key,value);const small=input.closest('.builder-control')?.querySelector('small');if(small&&control?.unit)small.textContent=`${value}${control.unit}`;};
      input.addEventListener('input',update);input.addEventListener('change',update);
    });
  }

  function applyViewport(){frame.dataset.viewport=viewport;shell.dataset.viewport=viewport;if(viewport==='mobile'){frame.style.width='390px';shell.style.width='min(100%, 430px)';}else{frame.style.width='100%';shell.style.width='100%';}frame.style.height=`${HEIGHT[active]||560}px`;}
  function syncFrame(){if(!frameReady)return;post({type:'platform-theme',theme:effectiveTheme()});post({type:'platform-module-style',moduleId:active,config:styleFor(active)});const current=stateFor(active);if(current)post({type:'platform-kit-state',capabilityId:active,state:current});}
  function setUrl(){const url=new URL(location.href);url.searchParams.set('ui',active);history.replaceState(null,'',url);}
  function loadFrame(){frameReady=false;if(status){status.hidden=false;status.textContent='공개 페이지 공통 모듈을 불러오는 중';}frame.src=`/ui-dashboard/module-preview/?module=${encodeURIComponent(active)}&embed=library&v=3`;applyViewport();}
  function select(id){if(!order.includes(id))return;active=id;setUrl();renderSelector();renderHead();loadFrame();if(!inspector.hidden)openInspector();}

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow)return;const data=event.data||{};if(data.moduleId!==active&&data.capabilityId!==active)return;
    if(data.type==='platform-preview-ready'){frameReady=true;if(status)status.hidden=true;syncFrame();return;}
    if(data.type==='platform-preview-error'){if(status){status.hidden=false;status.textContent=data.message||'모듈을 불러오지 못했습니다.';}return;}
    if(data.type==='platform-preview-state-change'&&STATE_OPTIONS[active])saveState(active,data.state||'',{fromPreview:true});
  });

  frame.addEventListener('load',()=>setTimeout(syncFrame,80));settings.addEventListener('click',openInspector);matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme==='system')syncFrame();});
  renderSelector();renderTheme();renderViewport();renderHead();loadFrame();
})();
