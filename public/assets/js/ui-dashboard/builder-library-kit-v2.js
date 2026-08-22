(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformLibraryKitV2)return;
  window.__platformLibraryKitV2=true;

  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest)return;
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
  if(!root||!tools||!filters||!shell||!frame)return;

  const CONFIG_STORE='platformBuilderCapabilityConfigsV2';
  const THEME_STORE='platformBuilderPreviewThemeV2';
  const VIEW_STORE='platformBuilderPreviewViewportV2';
  const STATE_STORE='platformBuilderKitStateV2';
  const ORDER=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const LABEL={
    'top-chapter-navigation':'상단 메뉴',
    'horizontal-card-rail':'가로 카드',
    'filter-chip-rail':'범용 필터칩',
    'collection-bottom-sheet':'하단 팝업',
    'device-handoff-accordion':'다른 기기',
    'floating-action':'플로팅 버튼'
  };
  const META={
    'top-chapter-navigation':'실제 상단 메뉴 런타임',
    'horizontal-card-rail':'실제 가로 레일 런타임',
    'filter-chip-rail':'하단 팝업의 실제 필터칩',
    'collection-bottom-sheet':'실제 내 모음 하단 팝업',
    'device-handoff-accordion':'다른 기기 연결 아코디언만 표시',
    'floating-action':'실제 플로팅 액션 버튼'
  };
  const MODE_KEY={
    'top-chapter-navigation':'chipFamily',
    'filter-chip-rail':'family',
    'floating-action':'family'
  };
  const MODE_LABEL={
    'material-flat':'Material',
    'ios-flat':'iOS 플랫',
    'ios-liquid':'iOS 리퀴드',
    flat:'플랫',glass:'글래스',liquid:'리퀴드'
  };
  const STATE_OPTIONS={
    'collection-bottom-sheet':[
      ['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']
    ],
    'device-handoff-accordion':[
      ['collapsed','접힘'],['expanded','펼침']
    ]
  };
  const HEIGHT={
    'top-chapter-navigation':260,
    'horizontal-card-rail':610,
    'filter-chip-rail':300,
    'collection-bottom-sheet':760,
    'device-handoff-accordion':560,
    'floating-action':340
  };

  let active=params.get('ui');
  if(!ORDER.includes(active))active=ORDER[0];
  let theme=readText(THEME_STORE,'light');
  if(!['light','dark','system'].includes(theme))theme='light';
  let viewport=readText(VIEW_STORE,'desktop');
  if(!['desktop','mobile'].includes(viewport))viewport='desktop';

  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function readText(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
  function writeText(key,value){try{localStorage.setItem(key,value);}catch{}}
  function readJson(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function capability(id){return manifest.capabilities.find(item=>item.id===id);}
  function savedConfig(id){return readJson(CONFIG_STORE)[id]||null;}
  function displayedConfig(id){
    const values={};
    (capability(id)?.controls||[]).forEach(control=>values[control.id]=control.default);
    return {...values,...(savedConfig(id)||{})};
  }
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}

  function stateFor(id){
    const states=readJson(STATE_STORE);
    if(states[id])return states[id];
    if(id==='device-handoff-accordion')return 'collapsed';
    if(id==='collection-bottom-sheet')return 'all';
    return '';
  }
  function saveState(id,value){
    const states=readJson(STATE_STORE);states[id]=value;writeJson(STATE_STORE,states);
    post({type:'platform-kit-state',capabilityId:id,state:value});
    renderState();
  }

  function saveConfigKey(id,key,value){
    const all=readJson(CONFIG_STORE);
    const next={...(all[id]||{})};next[key]=value;all[id]=next;writeJson(CONFIG_STORE,all);
    post({type:'platform-ui-config',capabilityId:id,config:next});
    renderMode();
  }
  function clearConfigKey(id,key){
    const all=readJson(CONFIG_STORE);
    const next={...(all[id]||{})};delete next[key];
    if(Object.keys(next).length)all[id]=next;else delete all[id];
    writeJson(CONFIG_STORE,all);
    post({type:'platform-ui-reset',capabilityId:id});
    if(Object.keys(next).length)post({type:'platform-ui-config',capabilityId:id,config:next});
    renderMode();
  }
  function resetConfig(id){
    const all=readJson(CONFIG_STORE);delete all[id];writeJson(CONFIG_STORE,all);
    post({type:'platform-ui-reset',capabilityId:id});
    renderMode();
    if(!inspector.hidden)openInspector();
  }

  function effectiveTheme(){
    if(theme!=='system')return theme;
    return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  function syncThemeSurface(){
    workspace.dataset.theme=effectiveTheme();
    workspace.dataset.themeChoice=theme;
  }
  function syncFrame(){
    post({type:'platform-theme',theme});
    const config=savedConfig(active);
    if(config)post({type:'platform-ui-config',capabilityId:active,config});
    else post({type:'platform-ui-reset',capabilityId:active});
    const state=stateFor(active);
    if(state)post({type:'platform-kit-state',capabilityId:active,state});
  }

  root.dataset.builderView='library';
  if(toolbar)toolbar.hidden=true;
  if(stage)stage.classList.add('builder-library-kit-hidden-stage');
  tools.hidden=false;
  filters.innerHTML='';
  const intro=$('.builder-library-intro',tools);
  if(intro){
    intro.querySelector('strong').textContent='UI 라이브러리';
    intro.querySelector('span').textContent='실제 UI를 하나씩 불러와 상태와 모드를 바로 확인합니다.';
  }

  const selector=document.createElement('nav');
  selector.className='builder-kit-selector';
  selector.setAttribute('aria-label','UI 컴포넌트');
  filters.appendChild(selector);

  const controlBar=document.createElement('div');
  controlBar.className='builder-kit-controls';
  controlBar.innerHTML='<div class="builder-kit-switch" id="kitTheme"></div><div class="builder-kit-switch" id="kitViewport"></div><div class="builder-kit-switch" id="kitMode" hidden></div><div class="builder-kit-switch" id="kitState" hidden></div>';
  tools.appendChild(controlBar);

  const workspace=document.createElement('main');
  workspace.className='builder-kit-workspace';
  workspace.innerHTML=`
    <header class="builder-kit-head">
      <div>
        <small id="kitMeta"></small>
        <strong id="kitTitle"></strong>
        <span id="kitHint">공개 페이지와 같은 UI 런타임을 사용합니다.</span>
      </div>
      <button type="button" id="kitSettings">세부 설정</button>
    </header>
    <div class="builder-kit-canvas" id="kitCanvas"></div>`;
  tools.insertAdjacentElement('afterend',workspace);
  $('#kitCanvas',workspace).appendChild(shell);
  shell.classList.add('builder-kit-frame-shell');

  const title=$('#kitTitle',workspace);
  const meta=$('#kitMeta',workspace);
  const hint=$('#kitHint',workspace);
  const themeRoot=$('#kitTheme',controlBar);
  const viewportRoot=$('#kitViewport',controlBar);
  const modeRoot=$('#kitMode',controlBar);
  const stateRoot=$('#kitState',controlBar);
  const settings=$('#kitSettings',workspace);

  const inspector=document.createElement('aside');
  inspector.className='builder-library-audit-inspector builder-kit-inspector';
  inspector.hidden=true;
  document.body.appendChild(inspector);

  const GROUP_LABEL={basic:'기본',advanced:'세부',motion:'움직임',safety:'안전',input:'입력','left-edge':'왼쪽 끝','right-edge':'오른쪽 끝',visibility:'표시'};
  const VALUE_LABEL={
    'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함',
    'material-flat':'Material','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드',
    calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',
    hidden:'숨김',auto:'필요할 때',flat:'플랫',glass:'글래스',liquid:'리퀴드',
    'chapter-wash':'메뉴 배경',line:'얇은 선',measured:'자동 측정','alpha-mask':'알파 마스크'
  };
  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';
    const label=`<span>${esc(control.label)}${control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:''}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-kit-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-kit-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(VALUE_LABEL[option]||option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-kit-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="range" data-kit-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }
  function openInspector(){
    const item=capability(active);if(!item)return;
    const values=displayedConfig(active);
    const groups=new Map();
    (item.controls||[]).forEach(control=>{
      const name=GROUP_LABEL[control.group]||control.group||'설정';
      if(!groups.has(name))groups.set(name,[]);
      groups.get(name).push(control);
    });
    inspector.innerHTML=`
      <header><div><small>라이브 UI 키트</small><strong>${esc(LABEL[active]||item.label)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header>
      <div class="builder-library-audit-inspector__body">
        <p class="builder-library-origin">초기 상태는 공개 페이지 원본입니다. 직접 바꾼 값만 override로 저장됩니다.</p>
        ${[...groups.entries()].map(([name,controls])=>`<section class="builder-control-group"><strong>${esc(name)}</strong><div class="builder-control-grid">${controls.map(control=>controlHtml(control,values[control.id])).join('')}</div></section>`).join('')}
      </div>
      <footer><button type="button" data-kit-reset>운영값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector).addEventListener('click',()=>inspector.hidden=true);
    $('[data-kit-reset]',inspector).addEventListener('click',()=>resetConfig(active));
    $$('[data-kit-control]',inspector).forEach(input=>{
      const update=()=>{
        const key=input.dataset.kitControl;
        const definition=item.controls.find(control=>control.id===key);
        let value=input.type==='checkbox'?input.checked:input.value;
        if(definition?.type==='range'||definition?.type==='number')value=Number(value);
        saveConfigKey(active,key,value);
        const unit=input.closest('.builder-control')?.querySelector('small');
        if(unit&&definition?.unit)unit.textContent=`${value}${definition.unit}`;
      };
      input.addEventListener('input',update);
      input.addEventListener('change',update);
    });
  }

  function renderSelector(){
    selector.innerHTML=ORDER.map(id=>`<button type="button" data-kit-ui="${id}" aria-pressed="${id===active}">${esc(LABEL[id])}</button>`).join('');
    $$('[data-kit-ui]',selector).forEach(button=>button.addEventListener('click',()=>select(button.dataset.kitUi)));
  }
  function renderTheme(){
    themeRoot.innerHTML='<span>색상</span>'+[['light','화이트'],['dark','다크'],['system','시스템']].map(([id,label])=>`<button type="button" data-kit-theme="${id}" aria-pressed="${theme===id}">${label}</button>`).join('');
    $$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{
      theme=button.dataset.kitTheme;writeText(THEME_STORE,theme);renderTheme();syncThemeSurface();syncFrame();
    }));
  }
  function renderViewport(){
    viewportRoot.innerHTML='<span>화면</span>'+[['desktop','PC'],['mobile','모바일']].map(([id,label])=>`<button type="button" data-kit-viewport="${id}" aria-pressed="${viewport===id}">${label}</button>`).join('');
    $$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{
      viewport=button.dataset.kitViewport;writeText(VIEW_STORE,viewport);renderViewport();applyViewport();
    }));
  }
  function renderMode(){
    const key=MODE_KEY[active];
    const control=key?capability(active)?.controls.find(item=>item.id===key):null;
    if(!key||!control){modeRoot.hidden=true;modeRoot.innerHTML='';return;}
    modeRoot.hidden=false;
    const saved=savedConfig(active)||{};
    const current=Object.prototype.hasOwnProperty.call(saved,key)?saved[key]:'original';
    const values=['original',...(control.options||[])];
    modeRoot.innerHTML='<span>표현</span>'+values.map(value=>`<button type="button" data-kit-mode="${esc(value)}" aria-pressed="${current===value}">${value==='original'?'원본':esc(MODE_LABEL[value]||value)}</button>`).join('');
    $$('[data-kit-mode]',modeRoot).forEach(button=>button.addEventListener('click',()=>{
      const value=button.dataset.kitMode;
      if(value==='original')clearConfigKey(active,key);else saveConfigKey(active,key,value);
    }));
  }
  function renderState(){
    const options=STATE_OPTIONS[active];
    if(!options){stateRoot.hidden=true;stateRoot.innerHTML='';return;}
    stateRoot.hidden=false;
    const current=stateFor(active);
    stateRoot.innerHTML='<span>상태</span>'+options.map(([value,label])=>`<button type="button" data-kit-state="${esc(value)}" aria-pressed="${current===value}">${esc(label)}</button>`).join('');
    $$('[data-kit-state]',stateRoot).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.kitState)));
  }
  function applyViewport(){
    workspace.dataset.viewport=viewport;
    frame.style.width=viewport==='mobile'?'390px':'100%';
    frame.style.maxWidth='100%';
  }

  function select(id){
    if(!ORDER.includes(id))return;
    active=id;
    renderSelector();renderMode();renderState();
    title.textContent=LABEL[id];
    meta.textContent=META[id]||'';
    hint.textContent=id==='filter-chip-rail'
      ?'내 모음 하단 팝업에서 실제로 쓰는 필터칩만 분리해 표시합니다.'
      :id==='device-handoff-accordion'
        ?'내 모음 설정의 다른 기기 연결 아코디언만 분리해 표시합니다.'
        :'공개 페이지와 같은 UI 런타임을 단독으로 표시합니다.';
    workspace.style.setProperty('--kit-preview-height',`${HEIGHT[id]||420}px`);
    applyViewport();syncThemeSurface();
    const url=new URL(location.href);url.searchParams.set('view','library');url.searchParams.set('ui',id);history.replaceState({},'',url);
    if(status){status.hidden=false;status.textContent='UI를 준비하는 중';}
    frame.src=`/ui-dashboard/sandbox/?preview=${encodeURIComponent(id)}&kit=2&v=14`;
    if(!inspector.hidden)openInspector();
  }

  settings.addEventListener('click',openInspector);
  frame.addEventListener('load',()=>{setTimeout(syncFrame,40);setTimeout(syncFrame,180);setTimeout(syncFrame,420);});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type==='platform-preview-ready'&&event.data.capabilityId===active){
      if(status)status.hidden=true;
      syncFrame();
    }
  });
  const media=matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change',()=>{if(theme==='system'){syncThemeSurface();syncFrame();}});

  renderSelector();renderTheme();renderViewport();renderMode();renderState();syncThemeSurface();select(active);
})();
