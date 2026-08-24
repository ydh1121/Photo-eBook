(function(){
  if(window.__platformCanonicalLibraryV3)return;
  window.__platformCanonicalLibraryV3=true;

  const registry=window.PlatformModuleRegistry;
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
  const SOURCE_LABEL={
    'public-extracted':'공개 페이지에서 추출',
    'block-lab-approved':'블록 연구실 승인',
    'platform-core':'플랫폼 공통'
  };
  const HEIGHT={
    'top-chapter-navigation':300,
    'horizontal-card-rail':600,
    'filter-chip-rail':320,
    'collection-bottom-sheet':820,
    'device-handoff-accordion':620,
    'floating-action':520
  };
  const STATE_OPTIONS={
    'collection-bottom-sheet':[['all','전체'],['video','영상'],['article','읽을거리'],['question','질문'],['settings','설정']],
    'device-handoff-accordion':[['collapsed','접힘'],['expanded','펼침']]
  };

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
  function stateFor(id){
    const stored=readJson(STATE_KEY,{})[id];
    if(stored)return stored;
    if(id==='collection-bottom-sheet')return'all';
    if(id==='device-handoff-accordion')return'collapsed';
    return'';
  }
  function saveState(id,value){
    const all=readJson(STATE_KEY,{});all[id]=value;writeJson(STATE_KEY,all);
    post({type:'platform-kit-state',capabilityId:id,state:value});
    renderStateControls();
  }
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function effectiveTheme(){return theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;}

  root.dataset.builderView='library';
  tools.hidden=false;if(stage)stage.hidden=false;filters.innerHTML='';

  const selector=document.createElement('nav');
  selector.className='builder-kit-selector';
  selector.setAttribute('aria-label','승인된 공통 UI 모듈');
  filters.appendChild(selector);

  const controlBar=document.createElement('div');
  controlBar.className='builder-kit-controls builder-kit-controls--primary';
  controlBar.innerHTML='<div class="builder-kit-switch" id="kitTheme"></div><div class="builder-kit-switch" id="kitViewport"></div>';
  tools.appendChild(controlBar);

  const workspace=document.createElement('main');
  workspace.className='builder-kit-workspace';
  workspace.innerHTML=`<header class="builder-kit-head"><div><small id="kitMeta"></small><strong id="kitTitle"></strong><span id="kitHint"></span></div><button type="button" id="kitDetails">코드 정보</button></header><div class="builder-kit-statebar" id="kitStatebar" hidden></div><div class="builder-kit-canvas" id="kitCanvas"></div>`;
  tools.insertAdjacentElement('afterend',workspace);
  $('#kitCanvas',workspace).appendChild(shell);
  shell.classList.add('builder-kit-frame-shell');

  const title=$('#kitTitle',workspace),meta=$('#kitMeta',workspace),hint=$('#kitHint',workspace);
  const themeRoot=$('#kitTheme',controlBar),viewportRoot=$('#kitViewport',controlBar),statebar=$('#kitStatebar',workspace);
  const details=$('#kitDetails',workspace);
  const inspector=document.createElement('aside');
  inspector.className='builder-library-audit-inspector builder-kit-inspector';
  inspector.hidden=true;document.body.appendChild(inspector);

  function renderSelector(){
    selector.innerHTML=approved.map(item=>`<button type="button" data-kit-ui="${esc(item.id)}" aria-pressed="${item.id===active?'true':'false'}">${esc(item.label)}</button>`).join('');
    $$('[data-kit-ui]',selector).forEach(button=>button.addEventListener('click',()=>select(button.dataset.kitUi)));
  }
  function renderTheme(){
    themeRoot.innerHTML=`<span>테마</span>${[['light','화이트'],['dark','다크'],['system','시스템']].map(([value,label])=>`<button type="button" data-kit-theme="${value}" aria-pressed="${theme===value?'true':'false'}">${label}</button>`).join('')}`;
    $$('[data-kit-theme]',themeRoot).forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.kitTheme;writeText(THEME_KEY,theme);renderTheme();syncFrame();}));
  }
  function renderViewport(){
    viewportRoot.innerHTML=`<span>화면</span>${[['desktop','PC'],['mobile','모바일']].map(([value,label])=>`<button type="button" data-kit-viewport="${value}" aria-pressed="${viewport===value?'true':'false'}">${label}</button>`).join('')}`;
    $$('[data-kit-viewport]',viewportRoot).forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.kitViewport;writeText(VIEWPORT_KEY,viewport);renderViewport();applyViewport();}));
  }
  function renderStateControls(){
    const options=STATE_OPTIONS[active];
    if(!options){statebar.hidden=true;statebar.innerHTML='';return;}
    const current=stateFor(active);statebar.hidden=false;
    statebar.innerHTML=`<span>상태</span>${options.map(([value,label])=>`<button type="button" data-kit-state="${esc(value)}" aria-pressed="${current===value?'true':'false'}">${esc(label)}</button>`).join('')}`;
    $$('[data-kit-state]',statebar).forEach(button=>button.addEventListener('click',()=>saveState(active,button.dataset.kitState||'')));
  }
  function renderHead(){
    const def=definition(),origin=provenance();
    title.textContent=def?.label||active;
    meta.textContent=`${SOURCE_LABEL[origin?.source]||origin?.source||'공통 모듈'} · v${origin?.version||1}`;
    hint.textContent='공개 페이지와 동일한 renderer · CSS · interaction owner를 실행합니다.';
  }
  function openInspector(){
    const origin=provenance(),def=definition();
    const files=(origin?.ownerFiles||[]).map(file=>`<li><code>${esc(file)}</code></li>`).join('');
    inspector.innerHTML=`<header><div><small>CANONICAL MODULE</small><strong>${esc(def?.label||active)}</strong></div><button type="button" data-kit-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">${esc(SOURCE_LABEL[origin?.source]||origin?.source||'공통 모듈')} 코드입니다. 라이브러리용 복제 renderer는 사용하지 않습니다.</p><section class="builder-control-group"><strong>모듈 ID</strong><code>${esc(active)}</code></section><section class="builder-control-group"><strong>사용 위치</strong><p>${esc((origin?.consumers||[]).join(' / '))}</p></section><section class="builder-control-group"><strong>코드 소유자</strong><ul class="builder-module-owner-files">${files}</ul></section></div>`;
    inspector.hidden=false;
    $('[data-kit-close]',inspector)?.addEventListener('click',()=>inspector.hidden=true);
  }
  function applyViewport(){
    frame.dataset.viewport=viewport;
    shell.dataset.viewport=viewport;
    if(viewport==='mobile'){
      frame.style.width='390px';shell.style.width='min(100%, 430px)';
    }else{
      frame.style.width='100%';shell.style.width='100%';
    }
    frame.style.height=`${HEIGHT[active]||560}px`;
  }
  function syncFrame(){
    if(!frameReady)return;
    post({type:'platform-theme',theme:effectiveTheme()});
    const current=stateFor(active);if(current)post({type:'platform-kit-state',capabilityId:active,state:current});
  }
  function setUrl(){
    const url=new URL(location.href);url.searchParams.set('ui',active);history.replaceState(null,'',url);
  }
  function loadFrame(){
    frameReady=false;if(status){status.hidden=false;status.textContent='공개 페이지 공통 모듈을 불러오는 중';}
    frame.src=`/ui-dashboard/module-preview/?module=${encodeURIComponent(active)}&embed=library&v=2`;
    applyViewport();
  }
  function select(id){
    if(!order.includes(id))return;
    active=id;setUrl();renderSelector();renderHead();renderStateControls();loadFrame();
  }

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
    const data=event.data||{};
    if(data.moduleId!==active&&data.capabilityId!==active)return;
    if(data.type==='platform-preview-ready'){
      frameReady=true;if(status)status.hidden=true;syncFrame();return;
    }
    if(data.type==='platform-preview-error'){
      if(status){status.hidden=false;status.textContent=data.message||'모듈을 불러오지 못했습니다.';}return;
    }
    if(data.type==='platform-preview-state-change'&&STATE_OPTIONS[active])saveState(active,data.state||'');
  });

  frame.addEventListener('load',()=>setTimeout(syncFrame,80));
  details.addEventListener('click',openInspector);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(theme==='system')syncFrame();});

  renderSelector();renderTheme();renderViewport();renderHead();renderStateControls();loadFrame();
})();
