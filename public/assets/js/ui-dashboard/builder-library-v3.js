(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest)return;
  const params=new URLSearchParams(location.search);if(params.get('view')!=='library')return;
  const root=document.querySelector('.builder-shell');const tools=document.querySelector('#builderLibraryTools');const filters=document.querySelector('#builderLibraryFilters');
  if(!root||!tools)return;
  document.documentElement.dataset.builderLibraryV3='true';root.dataset.builderView='library';

  const STORAGE='platformBuilderCapabilityConfigsV1';
  const labels={navigation:'탐색', 'content-motion':'가로 콘텐츠',selector:'선택',overlay:'팝업',interaction:'상호작용',status:'상태 표시',action:'빠른 동작'};
  const heights={'top-chapter-navigation':180,'horizontal-card-rail':500,'filter-chip-rail':210,'collection-bottom-sheet':760,'device-handoff-accordion':760,'reading-progress':180,'floating-action':260};
  let activeFilter='all',activeId='';
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v&&typeof v==='object'?v:{};}catch{return {};}}
  function write(v){try{localStorage.setItem(STORAGE,JSON.stringify(v));}catch{}}
  function item(id){return manifest.capabilities.find(x=>x.id===id);}
  function defaults(cap){const o={};(cap?.controls||[]).forEach(c=>o[c.id]=c.default);return o;}
  function config(id){return {...defaults(item(id)),...(read()[id]||{})};}
  function save(id,next){const all=read();all[id]=next;write(all);broadcast(id,next);}
  function broadcast(id,cfg){document.querySelectorAll('.builder-library-v3__preview').forEach(frame=>{try{frame.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config:cfg},location.origin);}catch{}});const main=document.querySelector('#builderFrame');try{main?.contentWindow?.postMessage({type:'platform-ui-config',capabilityId:id,config:cfg},location.origin);}catch{}}
  function broadcastAll(frame){const all=read();try{frame.contentWindow?.postMessage({type:'platform-ui-config-all',configs:all},location.origin);}catch{}}

  const floor=document.createElement('main');floor.className='builder-library-v3';floor.id='builderLibraryV3';
  manifest.capabilities.forEach(cap=>{
    const row=document.createElement('section');row.className='builder-library-v3__row';row.dataset.category=cap.category;row.dataset.capability=cap.id;
    row.innerHTML=`<header class="builder-library-v3__head"><div class="builder-library-v3__copy"><strong>${esc(cap.label)}</strong><small>${esc(labels[cap.category]||cap.category)} · 공개 페이지 runtime</small></div><button type="button" data-library-settings="${esc(cap.id)}">설정</button></header><iframe class="builder-library-v3__preview" data-library-preview="${esc(cap.id)}" title="${esc(cap.label)} 실제 UI 미리보기" loading="lazy" src="/ui-dashboard/sandbox/?preview=${encodeURIComponent(cap.id)}&v=4" style="height:${heights[cap.id]||360}px"></iframe>`;
    floor.appendChild(row);
  });
  tools.insertAdjacentElement('afterend',floor);

  const inspector=document.createElement('aside');inspector.className='builder-library-inspector';inspector.id='builderLibraryInspector';inspector.hidden=true;document.body.appendChild(inspector);
  function controlHtml(control,value){
    const disabled=control.locked?'disabled':'';const label=`<span>${esc(control.label)}${control.unit?`<small>${esc(value)}${esc(control.unit)}</small>`:''}</span>`;
    if(control.type==='boolean')return `<label class="builder-library-control builder-library-control--boolean">${label}<input type="checkbox" data-control="${esc(control.id)}" ${value?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-library-control">${label}<select data-control="${esc(control.id)}" ${disabled}>${(control.options||[]).map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-library-control">${label}<input type="color" data-control="${esc(control.id)}" value="${esc(value||'#315fc9')}" ${disabled}></label>`;
    return `<label class="builder-library-control">${label}<input type="range" data-control="${esc(control.id)}" value="${esc(value)}" min="${esc(control.min??0)}" max="${esc(control.max??100)}" step="${esc(control.step??1)}" ${disabled}></label>`;
  }
  function openInspector(id){
    const cap=item(id);if(!cap)return;activeId=id;const cfg=config(id);
    const groups=new Map();(cap.controls||[]).forEach(c=>{const key=c.group||'설정';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);});
    inspector.innerHTML=`<header class="builder-library-inspector__head"><div><small>UI 라이브러리</small><strong>${esc(cap.label)}</strong></div><button type="button" data-close-library-inspector aria-label="닫기">×</button></header><div class="builder-library-inspector__body">${[...groups.entries()].map(([group,controls])=>`<section class="builder-library-inspector__group"><strong>${esc(group)}</strong><div class="builder-library-inspector__grid">${controls.map(c=>controlHtml(c,cfg[c.id])).join('')}</div></section>`).join('')}</div><footer class="builder-library-inspector__foot"><span>변경 즉시 미리보기에 반영됩니다.</span><button type="button" data-reset-library-inspector>초기화</button></footer>`;
    inspector.hidden=false;
    inspector.querySelector('[data-close-library-inspector]')?.addEventListener('click',()=>inspector.hidden=true);
    inspector.querySelector('[data-reset-library-inspector]')?.addEventListener('click',()=>{save(id,defaults(cap));openInspector(id);});
    inspector.querySelectorAll('[data-control]').forEach(input=>{
      const update=()=>{const next=config(id),key=input.dataset.control;next[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;save(id,next);const small=input.closest('.builder-library-control')?.querySelector('small');const def=cap.controls.find(c=>c.id===key);if(small&&def?.unit)small.textContent=`${input.value}${def.unit}`;};
      input.addEventListener('input',update);input.addEventListener('change',update);
    });
  }
  floor.addEventListener('click',event=>{const button=event.target.closest('[data-library-settings]');if(button)openInspector(button.dataset.librarySettings);});
  floor.querySelectorAll('iframe').forEach(frame=>frame.addEventListener('load',()=>broadcastAll(frame)));

  function renderFilters(){
    if(!filters)return;const cats=[...new Set(manifest.capabilities.map(c=>c.category))];
    filters.innerHTML=[['all','전체'],...cats.map(c=>[c,labels[c]||c])].map(([id,label])=>`<button type="button" data-v3-filter="${esc(id)}" aria-pressed="${activeFilter===id}">${esc(label)}</button>`).join('');
    filters.querySelectorAll('[data-v3-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.v3Filter;renderFilters();floor.querySelectorAll('.builder-library-v3__row').forEach(row=>row.hidden=activeFilter!=='all'&&row.dataset.category!==activeFilter);}));
  }
  renderFilters();
})();
