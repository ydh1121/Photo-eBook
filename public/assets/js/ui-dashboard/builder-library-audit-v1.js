(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformLibraryAuditV1)return;
  window.__platformLibraryAuditV1=true;
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;if(!manifest)return;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=$('.builder-shell'),toolbar=$('.builder-toolbar'),tools=$('#builderLibraryTools'),filters=$('#builderLibraryFilters'),stage=$('.builder-stage'),shell=$('#builderCanvasShell'),frame=$('#builderFrame'),status=$('#builderFrameStatus');
  if(!root||!tools||!filters||!stage||!shell||!frame)return;

  const STORE='platformBuilderCapabilityConfigsV2',THEME='platformBuilderPreviewThemeV1',VIEW='platformBuilderPreviewViewportV1';
  const ORDER=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const LABEL={'top-chapter-navigation':'상단 메뉴','horizontal-card-rail':'가로 카드','filter-chip-rail':'필터칩','collection-bottom-sheet':'하단 팝업','device-handoff-accordion':'다른 기기','floating-action':'플로팅 버튼'};
  const CATEGORY={navigation:'탐색','content-motion':'가로 콘텐츠',selector:'선택',overlay:'팝업',interaction:'상호작용',action:'빠른 동작'};
  const VALUES={'deferred-sticky':'기본 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material 플랫','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드','chapter-wash':'메뉴 배경 채움',line:'얇은 진행선',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게',hidden:'숨김',auto:'필요할 때',flat:'플랫',glass:'글래스',liquid:'리퀴드'};
  const QUICK={'top-chapter-navigation':'chipFamily','filter-chip-rail':'family','floating-action':'family'};
  const HEIGHT={'top-chapter-navigation':230,'horizontal-card-rail':560,'filter-chip-rail':260,'collection-bottom-sheet':760,'device-handoff-accordion':560,'floating-action':340};
  let active=params.get('ui');if(!ORDER.includes(active))active=ORDER[0];
  let theme=readText(THEME,'light');if(!['light','dark','system'].includes(theme))theme='light';
  let viewport=readText(VIEW,'desktop');if(!['desktop','mobile'].includes(viewport))viewport='desktop';

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readText(k,f){try{return localStorage.getItem(k)||f;}catch{return f;}}
  function writeText(k,v){try{localStorage.setItem(k,v);}catch{}}
  function read(){try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function write(v){try{localStorage.setItem(STORE,JSON.stringify(v));}catch{}}
  function cap(id){return manifest.capabilities.find(x=>x.id===id);}
  function defaults(id){const out={};(cap(id)?.controls||[]).forEach(c=>out[c.id]=c.default);return out;}
  function display(id){return {...defaults(id),...(read()[id]||{})};}
  function saved(id){return read()[id]||null;}
  function post(msg){try{frame.contentWindow?.postMessage(msg,location.origin);}catch{}}
  function syncFrame(){post({type:'platform-theme',theme});const cfg=saved(active);post(cfg?{type:'platform-ui-config',capabilityId:active,config:cfg}:{type:'platform-ui-reset',capabilityId:active});}
  function saveKey(id,key,value){const all=read(),next={...(all[id]||{})};next[key]=value;all[id]=next;write(all);post({type:'platform-ui-config',capabilityId:id,config:next});renderQuick();}
  function reset(id){const all=read();delete all[id];write(all);post({type:'platform-ui-reset',capabilityId:id});renderQuick();if(!inspector.hidden)openInspector();}

  root.dataset.builderView='library';if(toolbar)toolbar.hidden=true;tools.hidden=false;stage.classList.add('builder-library-audit-stage');
  filters.innerHTML='';tools.querySelector('.builder-library-intro span').textContent='한 번에 하나의 UI만 원본 스타일로 확인합니다.';
  const selector=document.createElement('div');selector.className='builder-library-audit-selector';filters.appendChild(selector);
  const utilities=document.createElement('div');utilities.className='builder-library-audit-utilities';utilities.innerHTML='<div class="builder-audit-switch" id="libraryTheme"></div><div class="builder-audit-switch" id="libraryViewport"></div><div class="builder-audit-switch" id="libraryQuick" hidden></div>';tools.appendChild(utilities);
  const workspace=document.createElement('main');workspace.className='builder-library-audit';workspace.innerHTML='<header class="builder-library-audit__head"><div><small id="libraryMeta"></small><strong id="libraryTitle"></strong><span>공개 페이지의 UI 원본을 그대로 불러옵니다.</span></div><button type="button" id="librarySettings">설정</button></header><div class="builder-library-audit__canvas" id="libraryCanvas"></div>';
  tools.insertAdjacentElement('afterend',workspace);$('#libraryCanvas',workspace).appendChild(shell);shell.classList.add('builder-library-audit__frame-shell');
  const title=$('#libraryTitle'),meta=$('#libraryMeta'),themeRoot=$('#libraryTheme'),viewportRoot=$('#libraryViewport'),quickRoot=$('#libraryQuick'),settings=$('#librarySettings');

  const inspector=document.createElement('aside');inspector.className='builder-library-audit-inspector';inspector.hidden=true;document.body.appendChild(inspector);
  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'',label=`<span>${esc(control.label)}${control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:''}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-library-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-library-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(VALUES[v]||v)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-library-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="range" data-library-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }
  function openInspector(){
    const item=cap(active);if(!item)return;const cfg=display(active),groups=new Map();(item.controls||[]).forEach(control=>{const group=control.group||'설정';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(control);});
    inspector.innerHTML=`<header><div><small>UI 라이브러리</small><strong>${esc(item.label)}</strong></div><button type="button" data-library-close aria-label="닫기">×</button></header><div class="builder-library-audit-inspector__body"><p class="builder-library-origin">운영 화면의 원본에서 시작합니다. 변경한 값만 별도로 저장됩니다.</p>${[...groups.entries()].map(([group,controls])=>`<section class="builder-control-group"><strong>${esc(group)}</strong><div class="builder-control-grid">${controls.map(c=>controlHtml(c,cfg[c.id])).join('')}</div></section>`).join('')}</div><footer><button type="button" data-library-reset>운영값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    inspector.querySelector('[data-library-close]').addEventListener('click',()=>inspector.hidden=true);
    inspector.querySelector('[data-library-reset]').addEventListener('click',()=>reset(active));
    inspector.querySelectorAll('[data-library-control]').forEach(input=>{const update=()=>{const key=input.dataset.libraryControl,def=item.controls.find(c=>c.id===key);let value=input.type==='checkbox'?input.checked:input.value;if(def?.type==='range'||def?.type==='number')value=Number(value);saveKey(active,key,value);const small=input.closest('.builder-control')?.querySelector('small');if(small&&def?.unit)small.textContent=`${value}${def.unit}`;};input.addEventListener('input',update);input.addEventListener('change',update);});
  }

  function renderSelector(){selector.innerHTML=ORDER.map(id=>`<button type="button" data-library-ui="${id}" aria-pressed="${id===active}">${esc(LABEL[id])}</button>`).join('');selector.querySelectorAll('[data-library-ui]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.libraryUi)));}
  function renderTheme(){themeRoot.innerHTML='<span>화면</span>'+[['light','화이트'],['dark','다크'],['system','시스템']].map(([id,label])=>`<button type="button" data-library-theme="${id}" aria-pressed="${theme===id}">${label}</button>`).join('');themeRoot.querySelectorAll('[data-library-theme]').forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.libraryTheme;writeText(THEME,theme);renderTheme();syncFrame();}));}
  function renderViewport(){viewportRoot.innerHTML='<span>보기</span>'+[['desktop','PC'],['mobile','모바일']].map(([id,label])=>`<button type="button" data-library-viewport="${id}" aria-pressed="${viewport===id}">${label}</button>`).join('');viewportRoot.querySelectorAll('[data-library-viewport]').forEach(button=>button.addEventListener('click',()=>{viewport=button.dataset.libraryViewport;writeText(VIEW,viewport);renderViewport();applyViewport();}));}
  function renderQuick(){const key=QUICK[active],control=cap(active)?.controls.find(c=>c.id===key);if(!control){quickRoot.hidden=true;quickRoot.innerHTML='';return;}quickRoot.hidden=false;const current=display(active)[key];quickRoot.innerHTML='<span>스타일</span>'+control.options.map(v=>`<button type="button" data-library-quick="${esc(v)}" aria-pressed="${current===v}">${esc(VALUES[v]||v)}</button>`).join('');quickRoot.querySelectorAll('[data-library-quick]').forEach(button=>button.addEventListener('click',()=>saveKey(active,key,button.dataset.libraryQuick)));}
  function applyViewport(){workspace.dataset.viewport=viewport;frame.style.width=viewport==='mobile'?'390px':'100%';frame.style.maxWidth='100%';}
  function select(id){if(!ORDER.includes(id))return;active=id;renderSelector();renderQuick();const item=cap(id);title.textContent=item?.label||LABEL[id];meta.textContent=`${CATEGORY[item?.category]||item?.category||''} · 공개 UI 원본`;workspace.style.setProperty('--library-preview-height',`${HEIGHT[id]||420}px`);applyViewport();const url=new URL(location.href);url.searchParams.set('view','library');url.searchParams.set('ui',id);history.replaceState({},'',url);status.hidden=false;status.textContent='UI를 준비하는 중';frame.src=`/ui-dashboard/sandbox/?preview=${encodeURIComponent(id)}&v=11`;if(!inspector.hidden)openInspector();}

  settings.addEventListener('click',openInspector);
  frame.addEventListener('load',()=>{setTimeout(syncFrame,60);setTimeout(syncFrame,240);});
  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;if(event.data?.type==='platform-preview-ready'&&event.data.capabilityId===active){status.hidden=true;syncFrame();}});
  renderSelector();renderTheme();renderViewport();select(active);
})();
