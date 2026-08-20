(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest)return;
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library')return;

  const root=document.querySelector('.builder-shell');
  const tools=document.querySelector('#builderLibraryTools');
  const legacyFilters=document.querySelector('#builderLibraryFilters');
  if(!root||!tools)return;

  document.documentElement.dataset.builderLibraryV4='true';
  delete document.documentElement.dataset.builderLibraryV3;
  root.dataset.builderView='library';
  if(legacyFilters)legacyFilters.hidden=true;

  const STORAGE='platformBuilderCapabilityConfigsV2';
  const CATEGORY={navigation:'탐색','content-motion':'가로 콘텐츠',selector:'선택',overlay:'팝업',interaction:'상호작용',action:'빠른 동작'};
  const ORDER=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const LABEL={
    'top-chapter-navigation':'상단 메뉴',
    'horizontal-card-rail':'가로 카드',
    'filter-chip-rail':'필터칩',
    'collection-bottom-sheet':'하단 팝업',
    'device-handoff-accordion':'다른 기기',
    'floating-action':'플로팅 버튼'
  };
  const caps=ORDER.map(id=>manifest.capabilities.find(cap=>cap.id===id)).filter(Boolean);
  let activeId=params.get('ui');
  if(!caps.some(cap=>cap.id===activeId))activeId=caps[0]?.id||'';

  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const read=()=>{try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}};
  const write=value=>{try{localStorage.setItem(STORAGE,JSON.stringify(value));}catch{}};
  const item=id=>manifest.capabilities.find(cap=>cap.id===id);
  const defaults=cap=>{const out={};(cap?.controls||[]).forEach(control=>out[control.id]=control.default);return out;};
  const displayConfig=id=>({...defaults(item(id)),...(read()[id]||{})});
  const savedConfig=id=>read()[id]||null;

  const selector=document.createElement('div');
  selector.className='builder-library-v4__selector';
  selector.setAttribute('role','tablist');
  selector.setAttribute('aria-label','편집할 UI 선택');
  tools.appendChild(selector);

  const workspace=document.createElement('main');
  workspace.className='builder-library-v4';
  workspace.id='builderLibraryV4';
  workspace.innerHTML=`
    <header class="builder-library-v4__head">
      <div class="builder-library-v4__title"><small id="builderLibraryV4Meta"></small><strong id="builderLibraryV4Title"></strong><span>아무 설정도 저장하지 않으면 공개 페이지 원본 그대로 표시됩니다.</span></div>
      <button type="button" id="builderLibraryV4Settings">설정</button>
    </header>
    <div class="builder-library-v4__canvas">
      <iframe id="builderLibraryPreview" class="builder-library-v4__preview" title="실제 UI 미리보기"></iframe>
    </div>`;
  tools.insertAdjacentElement('afterend',workspace);

  const frame=workspace.querySelector('#builderLibraryPreview');
  const title=workspace.querySelector('#builderLibraryV4Title');
  const meta=workspace.querySelector('#builderLibraryV4Meta');
  const settings=workspace.querySelector('#builderLibraryV4Settings');

  const inspector=document.createElement('aside');
  inspector.className='builder-library-inspector';
  inspector.id='builderLibraryInspector';
  inspector.hidden=true;
  document.body.appendChild(inspector);

  function resetFrameCapability(id){
    try{frame.contentWindow?.postMessage({type:'platform-ui-reset-baseline',capabilityId:id},location.origin);}catch{}
    try{document.querySelector('#builderFrame')?.contentWindow?.postMessage({type:'platform-ui-reset-baseline',capabilityId:id},location.origin);}catch{}
  }
  function post(id,config){
    resetFrameCapability(id);
    if(!config)return;
    try{frame.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config},location.origin);}catch{}
    try{document.querySelector('#builderFrame')?.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config},location.origin);}catch{}
  }

  function renderSelector(){
    selector.innerHTML=caps.map(cap=>`<button type="button" role="tab" data-library-ui="${esc(cap.id)}" aria-selected="${cap.id===activeId}">${esc(LABEL[cap.id]||cap.label)}</button>`).join('');
    selector.querySelectorAll('[data-library-ui]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.libraryUi)));
  }

  function select(id){
    const cap=item(id);if(!cap)return;
    activeId=id;
    renderSelector();
    title.textContent=cap.label;
    meta.textContent=`${CATEGORY[cap.category]||cap.category} · 공개 페이지 runtime`;
    const url=new URL(location.href);url.searchParams.set('view','library');url.searchParams.set('ui',id);history.replaceState({},'',url);
    frame.src=`/ui-dashboard/sandbox/?preview=${encodeURIComponent(id)}&v=6`;
    if(!inspector.hidden)openInspector(id);
  }

  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';
    const valueNote=control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:'';
    const label=`<span>${esc(control.label)}${valueNote}</span>`;
    if(control.type==='boolean')return `<label class="builder-library-control builder-library-control--boolean">${label}<input type="checkbox" data-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-library-control">${label}<select data-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-library-control">${label}<input type="color" data-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-library-control">${label}<input type="range" data-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }

  function savePartial(id,key,value){
    const all=read();
    const next={...(all[id]||{})};
    next[key]=value;
    all[id]=next;
    write(all);
    post(id,next);
  }
  function reset(id){
    const all=read();delete all[id];write(all);
    resetFrameCapability(id);
    frame.src=`/ui-dashboard/sandbox/?preview=${encodeURIComponent(id)}&v=6&reset=${Date.now()}`;
    openInspector(id);
  }

  function openInspector(id=activeId){
    const cap=item(id);if(!cap)return;
    const config=displayConfig(id);
    const groups=new Map();
    (cap.controls||[]).forEach(control=>{const key=control.group||'설정';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(control);});
    inspector.innerHTML=`
      <header class="builder-library-inspector__head"><div><small>UI 라이브러리</small><strong>${esc(cap.label)}</strong></div><button type="button" data-close-library-inspector aria-label="닫기">×</button></header>
      <div class="builder-library-inspector__body">
        <div class="builder-library-origin-note">공개 페이지 원본이 기준입니다. 직접 바꾼 항목만 별도 값으로 적용됩니다.</div>
        ${[...groups.entries()].map(([group,controls])=>`<section class="builder-library-inspector__group"><strong>${esc(group)}</strong><div class="builder-library-inspector__grid">${controls.map(control=>controlHtml(control,config[control.id])).join('')}</div></section>`).join('')}
      </div>
      <footer class="builder-library-inspector__foot"><span>변경 즉시 반영</span><button type="button" data-reset-library-inspector>운영값으로 되돌리기</button></footer>`;
    inspector.hidden=false;
    inspector.querySelector('[data-close-library-inspector]')?.addEventListener('click',()=>inspector.hidden=true);
    inspector.querySelector('[data-reset-library-inspector]')?.addEventListener('click',()=>reset(id));
    inspector.querySelectorAll('[data-control]').forEach(input=>{
      const update=()=>{
        const key=input.dataset.control;
        const control=cap.controls.find(control=>control.id===key);
        const value=input.type==='checkbox'?input.checked:(input.type==='range'||control?.type==='number'?Number(input.value):input.value);
        savePartial(id,key,value);
        const small=input.closest('.builder-library-control')?.querySelector('small');
        if(small&&control?.unit)small.textContent=`${input.value}${control.unit}`;
      };
      input.addEventListener('input',update);
      input.addEventListener('change',update);
    });
  }

  settings.addEventListener('click',()=>openInspector());
  frame.addEventListener('load',()=>{const saved=savedConfig(activeId);setTimeout(()=>post(activeId,saved),80);});

  renderSelector();
  select(activeId);
})();
