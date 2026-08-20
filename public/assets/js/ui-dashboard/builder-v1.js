(function(){
  const uiManifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const blockManifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  if(!uiManifest)return;

  const root=document.querySelector('.builder-shell');
  const frame=document.querySelector('#builderFrame');
  const frameStatus=document.querySelector('#builderFrameStatus');
  const panelLayer=document.querySelector('#builderPanelLayer');
  const mobileDock=document.querySelector('#builderMobileDock');
  const libraryTools=document.querySelector('#builderLibraryTools');
  const libraryFilters=document.querySelector('#builderLibraryFilters');
  const editToggle=document.querySelector('#builderEditToggle');
  const pageSelect=document.querySelector('#builderPageSelect');
  const resetButton=document.querySelector('#builderResetPage');
  const saveLayoutButton=document.querySelector('#builderSaveLayout');
  const addAdButton=document.querySelector('#builderAddAd');
  const paletteButton=document.querySelector('#builderOpenBlockPalette');
  const palette=document.querySelector('#builderBlockPalette');
  const blockFilter=document.querySelector('#builderBlockFilter');
  const blockList=document.querySelector('#builderBlockList');
  if(!root||!frame||!panelLayer)return;

  const STORAGE={configs:'platformBuilderCapabilityConfigsV1',panels:'platformBuilderPanelPositionsV1',layout:'platformBuilderLayoutV1',notes:'platformBuilderNotesV1',presets:'platformUiCapabilityPresetsV1'};
  const TOKEN_KEY='platformEditorAdminToken';
  const TARGETS={
    'top-chapter-navigation':['.nav-shell','.nav-scroll'],
    'horizontal-card-rail':['.desktop-rail-window','.scroll-row'],
    'filter-chip-rail':['.collection-filters','#collectionFilters'],
    'collection-bottom-sheet':['#collectionSheet','.collection-sheet'],
    'device-handoff-accordion':['.collection-device-accordion','#collectionDeviceLink'],
    'reading-progress':['.nav-chapter-progress','.read-progress'],
    'floating-action':['#collectionFab','.collection-fab']
  };
  const CATEGORY_LABELS={navigation:'탐색','content-motion':'가로 콘텐츠',selector:'선택',overlay:'팝업',interaction:'상호작용',status:'상태 표시',action:'빠른 동작'};
  const GROUP_LABELS={basic:'기본',advanced:'세부 설정',motion:'움직임',safety:'안전',input:'입력','left-edge':'왼쪽 가장자리','right-edge':'오른쪽 가장자리',visibility:'표시',default:'설정'};
  const VALUE_LABELS={'deferred-sticky':'스크롤 후 고정',sticky:'항상 고정',static:'고정 안 함','material-flat':'Material 플랫','ios-flat':'iOS 플랫','ios-liquid':'iOS 리퀴드','chapter-wash':'메뉴 배경 채움',line:'얇은 진행선',calm:'차분함',standard:'기본',lively:'빠름',none:'없음',low:'약하게',medium:'보통',high:'강하게','alpha-mask':'투명 페이드',hidden:'숨김',auto:'필요할 때',measured:'내용 높이',flat:'플랫',glass:'글래스',liquid:'리퀴드'};
  const state={view:new URLSearchParams(location.search).get('view')==='library'?'library':'page',editMode:true,configs:readJson(STORAGE.configs,{}),notes:readJson(STORAGE.notes,{}),panels:new Map(),activePanel:'',selectedBlock:null,draggedBlock:null,libraryFilter:'all',frameDoc:null,frameWin:null,blockCategory:'all',timer:0};

  function readJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback;}catch{return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function cap(id){return uiManifest.capabilities.find(item=>item.id===id);}
  function defaultsFor(item){const out={};for(const c of item?.controls||[])out[c.id]=c.default;return out;}
  function configFor(id){return {...defaultsFor(cap(id)),...(state.configs[id]||{})};}
  function saveConfig(id,config){state.configs[id]=config;writeJson(STORAGE.configs,state.configs);}
  function isMobile(){return matchMedia('(max-width:760px)').matches;}
  function valueLabel(value){return VALUE_LABELS[value]||String(value??'');}
  function qsa(doc,selectors){const out=[];for(const selector of selectors||[])for(const node of doc.querySelectorAll(selector))if(!out.includes(node))out.push(node);return out;}
  function targets(id){return state.frameDoc?qsa(state.frameDoc,TARGETS[id]||[]):[];}
  function primaryTarget(id){return targets(id)[0]||null;}
  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}}

  document.querySelectorAll('[data-builder-view-button]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.builderViewButton)));

  function setView(view){
    state.view=view==='library'?'library':'page';root.dataset.builderView=state.view;
    document.querySelectorAll('[data-builder-view-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.builderViewButton===state.view)));
    libraryTools.hidden=state.view!=='library';
    const url=new URL(location.href);if(state.view==='library')url.searchParams.set('view','library');else url.searchParams.delete('view');history.replaceState({},'',url);
    if(state.frameDoc){if(state.view==='library')buildLibraryFloor();else restorePageView();}
  }

  frame.addEventListener('load',()=>{
    state.frameDoc=frame.contentDocument;state.frameWin=frame.contentWindow;frameStatus.hidden=false;frameStatus.textContent='실제 페이지 UI를 찾는 중';
    clearTimeout(state.timer);prepareFrame(0);
  });

  function prepareFrame(attempt){
    const doc=state.frameDoc;if(!doc)return;const app=doc.querySelector('#app');
    if(!app&&attempt<20){state.timer=setTimeout(()=>prepareFrame(attempt+1),180);return;}
    injectRuntime(doc);markCapabilities();prepareBlocks();reapplyAll();renderLibraryFilters();if(state.view==='library')buildLibraryFloor();frameStatus.hidden=true;
    [700,1800,3500].forEach(delay=>setTimeout(()=>{markCapabilities();prepareBlocks();reapplyAll();if(state.view==='library')buildLibraryFloor();},delay));
  }

  function injectRuntime(doc){
    doc.documentElement.dataset.platformBuilder='true';doc.documentElement.dataset.builderEdit=String(state.editMode);
    let style=doc.querySelector('#platform-builder-runtime-style');if(!style){style=doc.createElement('style');style.id='platform-builder-runtime-style';doc.head.appendChild(style);}
    style.textContent=`
      [data-builder-capability]{position:relative!important}[data-builder-capability]>.platform-builder-gear{position:absolute!important;z-index:2147483000!important;top:7px!important;right:7px!important;width:30px!important;height:30px!important;display:grid!important;place-items:center!important;padding:0!important;border:1px solid rgba(20,28,45,.13)!important;border-radius:10px!important;background:rgba(255,255,255,.94)!important;color:#38404a!important;box-shadow:0 7px 18px rgba(20,28,45,.12)!important;font:700 15px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;opacity:0!important;transform:translateY(-3px)!important;pointer-events:none!important;transition:opacity .15s,transform .15s!important}[data-builder-capability]:hover>.platform-builder-gear{opacity:1!important;transform:none!important;pointer-events:auto!important}html[data-builder-edit="true"] [data-builder-capability]{outline:1px solid transparent!important;outline-offset:3px!important}html[data-builder-edit="true"] [data-builder-capability]:hover{outline-color:rgba(49,95,201,.34)!important}.platform-builder-block{position:relative!important}.platform-builder-block>.platform-builder-block-handle{position:absolute!important;z-index:2147482990!important;left:8px!important;top:8px!important;height:29px!important;padding:0 8px!important;border:1px solid rgba(20,28,45,.11)!important;border-radius:9px!important;background:rgba(255,255,255,.92)!important;color:#4c545e!important;box-shadow:0 6px 16px rgba(20,28,45,.10)!important;font:700 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;opacity:0!important;pointer-events:none!important;cursor:grab!important}html[data-builder-edit="true"] .platform-builder-block:hover>.platform-builder-block-handle{opacity:1!important;pointer-events:auto!important}.platform-builder-block.is-builder-dragging{opacity:.45!important}.platform-builder-block.is-builder-drop-target{outline:2px solid rgba(49,95,201,.48)!important;outline-offset:4px!important}.platform-builder-ad{min-height:118px!important;display:grid!important;place-items:center!important;margin:28px auto!important;padding:22px!important;border:1px dashed rgba(40,48,62,.24)!important;background:linear-gradient(145deg,rgba(247,248,250,.92),rgba(238,241,245,.92))!important;color:#6a727d!important;text-align:center!important}.platform-builder-ad strong{display:block!important;color:#343a43!important;font-size:13px!important}.platform-builder-ad span{display:block!important;margin-top:6px!important;font-size:10px!important}html[data-builder-library="true"] body{background:#fff!important}html[data-builder-library="true"] body>*:not(#platformBuilderLibraryFloor):not(script):not(style){display:none!important}#platformBuilderLibraryFloor{display:flex!important;flex-direction:column!important;gap:78px!important;width:min(100%,1180px)!important;min-height:100vh!important;margin:0 auto!important;padding:72px clamp(16px,4vw,56px) 120px!important;background:#fff!important}#platformBuilderLibraryFloor>[data-library-capability]{position:relative!important;max-width:100%!important}#platformBuilderLibraryFloor>[hidden]{display:none!important}@media(max-width:760px){[data-builder-capability]>.platform-builder-gear{display:none!important}html[data-builder-edit="true"] [data-builder-capability]{outline-color:rgba(49,95,201,.16)!important;outline-offset:2px!important}html[data-builder-edit="true"] .platform-builder-block>.platform-builder-block-handle{opacity:1!important;pointer-events:auto!important}#platformBuilderLibraryFloor{gap:56px!important;padding:52px 14px 100px!important}}`;
  }

  function markCapabilities(){
    const doc=state.frameDoc;if(!doc)return;
    for(const capability of uiManifest.capabilities){
      targets(capability.id).slice(0,24).forEach((node,index)=>{
        node.dataset.builderCapability=capability.id;
        if(!node.querySelector(':scope > .platform-builder-gear')){
          const gear=doc.createElement('button');gear.type='button';gear.className='platform-builder-gear';gear.textContent='⚙';gear.setAttribute('aria-label',`${capability.label} 설정`);
          gear.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openInspector(capability.id,node);});node.appendChild(gear);
          node.addEventListener('click',event=>{if(!isMobile()||!state.editMode||state.view==='library'||event.target.closest?.('.platform-builder-block-handle'))return;event.preventDefault();event.stopPropagation();openInspector(capability.id,node);},true);
        }
        if(index===0)node.dataset.builderPrimary='true';
      });
    }
  }

  function prepareBlocks(){
    const doc=state.frameDoc;if(!doc||state.view==='library')return;const app=doc.querySelector('#app');if(!app)return;
    const candidates=[...app.children].filter(node=>node.tagName!=='SCRIPT'&&node.tagName!=='STYLE'&&node.id!=='platformBuilderLibraryFloor');
    candidates.forEach((node,index)=>{
      node.classList.add('platform-builder-block');node.dataset.builderBlockId=node.dataset.builderBlockId||node.id||`production_${index+1}`;node.draggable=state.editMode;
      if(!node.querySelector(':scope > .platform-builder-block-handle')){const handle=doc.createElement('button');handle.type='button';handle.className='platform-builder-block-handle';handle.textContent='⠿ 이동';handle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();state.selectedBlock=node;});node.prepend(handle);}
      if(node.dataset.builderDragBound==='true')return;node.dataset.builderDragBound='true';
      node.addEventListener('dragstart',event=>{if(!state.editMode)return event.preventDefault();state.draggedBlock=node;state.selectedBlock=node;node.classList.add('is-builder-dragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',node.dataset.builderBlockId||'');});
      node.addEventListener('dragend',()=>{state.draggedBlock=null;node.classList.remove('is-builder-dragging');doc.querySelectorAll('.is-builder-drop-target').forEach(n=>n.classList.remove('is-builder-drop-target'));captureLayout();});
      node.addEventListener('dragover',event=>{if(!state.draggedBlock||state.draggedBlock===node)return;event.preventDefault();node.classList.add('is-builder-drop-target');});
      node.addEventListener('dragleave',()=>node.classList.remove('is-builder-drop-target'));
      node.addEventListener('drop',event=>{event.preventDefault();node.classList.remove('is-builder-drop-target');const source=state.draggedBlock;if(!source||source===node||source.parentNode!==node.parentNode)return;const rect=node.getBoundingClientRect();node.parentNode.insertBefore(source,event.clientY<rect.top+rect.height/2?node:node.nextSibling);captureLayout();});
      node.addEventListener('click',event=>{if(state.editMode&&!event.target.closest('a,button,input,select,textarea'))state.selectedBlock=node;},true);
    });
    applySavedLayout(app);
  }

  function captureLayout(){const app=state.frameDoc?.querySelector('#app');if(!app)return[];const ids=[...app.children].filter(n=>n.classList.contains('platform-builder-block')).map(n=>n.dataset.builderBlockId).filter(Boolean);writeJson(STORAGE.layout,{page:pageSelect?.value||'/photography/',ids,updatedAt:new Date().toISOString()});return ids;}
  function applySavedLayout(app){const saved=readJson(STORAGE.layout,null);if(!saved||saved.page!==(pageSelect?.value||'/photography/')||!Array.isArray(saved.ids))return;const byId=new Map([...app.children].map(node=>[node.dataset.builderBlockId,node]));saved.ids.forEach(id=>{const node=byId.get(id);if(node)app.appendChild(node);});}

  function addAdvertisement(variant='inline-banner'){
    const doc=state.frameDoc,app=doc?.querySelector('#app');if(!doc||!app)return;const section=doc.createElement('section');section.className='platform-builder-block platform-builder-ad';section.dataset.builderBlockId=`ad_${Date.now()}`;section.dataset.builderBlockType='advertisement';section.dataset.builderAdVariant=variant;section.innerHTML='<div><strong>광고 블록</strong><span>실제 페이지 흐름에서 위치와 크기를 검토하는 자리입니다.</span></div>';
    const anchor=state.selectedBlock?.isConnected?state.selectedBlock:null;if(anchor)anchor.parentNode.insertBefore(section,anchor.nextSibling);else app.appendChild(section);state.selectedBlock=section;prepareBlocks();section.scrollIntoView({behavior:'smooth',block:'center'});captureLayout();toast('광고 블록을 조립 화면에 추가했습니다.');
  }

  function controlMarkup(control,value){
    const disabled=control.locked?'disabled':'';const val=value??control.default;const label=`<span>${escapeHtml(control.label)}${control.unit?` <small>${escapeHtml(val)}${escapeHtml(control.unit)}</small>`:''}</span>`;
    if(control.type==='boolean')return `<label class="builder-control builder-control--boolean">${label}<input type="checkbox" data-builder-control="${escapeHtml(control.id)}" ${val?'checked':''} ${disabled}></label>`;
    if(control.type==='enum')return `<label class="builder-control">${label}<select data-builder-control="${escapeHtml(control.id)}" ${disabled}>${(control.options||[]).map(v=>`<option value="${escapeHtml(v)}" ${v===val?'selected':''}>${escapeHtml(valueLabel(v))}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="builder-control">${label}<input type="color" data-builder-control="${escapeHtml(control.id)}" value="${escapeHtml(val||'#315fc9')}" ${disabled}></label>`;
    if(control.type==='range'||control.type==='number')return `<label class="builder-control">${label}<input type="${control.type==='range'?'range':'number'}" data-builder-control="${escapeHtml(control.id)}" value="${escapeHtml(val)}" min="${escapeHtml(control.min??0)}" max="${escapeHtml(control.max??100)}" step="${escapeHtml(control.step??1)}" ${disabled}></label>`;
    return `<label class="builder-control">${label}<input type="text" data-builder-control="${escapeHtml(control.id)}" value="${escapeHtml(val||'')}" ${disabled}></label>`;
  }
  function controlsMarkup(item,config){const groups=new Map();for(const control of item.controls||[]){const key=control.group||'default';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(control);}return [...groups].map(([key,controls])=>`<section class="builder-control-group"><strong>${escapeHtml(GROUP_LABELS[key]||'설정')}</strong><div class="builder-control-grid">${controls.map(c=>controlMarkup(c,config[c.id])).join('')}</div></section>`).join('');}
  function actualMarkup(target){if(!target||!state.frameWin)return'';const style=state.frameWin.getComputedStyle(target);return `<div class="builder-inspector__actual"><span>현재 크기<b>${Math.round(target.getBoundingClientRect().width)} × ${Math.round(target.getBoundingClientRect().height)}</b></span><span>표시 방식<b>${escapeHtml(style.display)}</b></span><span>간격<b>${escapeHtml(style.gap||'—')}</b></span><span>모서리<b>${escapeHtml(style.borderRadius||'—')}</b></span></div>`;}

  function openInspector(id,target){
    const item=cap(id);if(!item)return;if(state.panels.has(id)){focusPanel(id);return;}const config=configFor(id);const panel=document.createElement('section');panel.className='builder-inspector';panel.dataset.inspectorId=id;panel.innerHTML=`<header class="builder-inspector__head"><div><small>${escapeHtml(CATEGORY_LABELS[item.category]||item.category)}</small><strong>${escapeHtml(item.label)}</strong></div><button type="button" data-close-inspector aria-label="닫기">×</button></header><div class="builder-inspector__body">${actualMarkup(target)}${controlsMarkup(item,config)}<section class="builder-inspector__memo"><label>수정 요청 메모<textarea data-builder-note placeholder="예: 선택된 칩 그림자를 조금 줄이고 PC에서는 왼쪽 여백을 4px 늘려주세요.">${escapeHtml(state.notes[id]||'')}</textarea></label><p>서버 연결 상태에서 저장하면 UI_PRESETS 시트의 메모로 남습니다.</p></section></div><footer class="builder-inspector__foot"><button type="button" data-reset-inspector>초기값</button><button type="button" data-save-preset>설정 저장</button><button type="button" data-primary data-save-note>메모 저장</button></footer>`;
    panelLayer.appendChild(panel);state.panels.set(id,panel);restorePanelPosition(id,panel);installPanelDrag(panel,id);bindPanel(panel,id);focusPanel(id);
  }
  function bindPanel(panel,id){panel.querySelector('[data-close-inspector]').addEventListener('click',()=>closeInspector(id));panel.querySelector('[data-reset-inspector]').addEventListener('click',()=>resetInspector(id));panel.querySelector('[data-save-preset]').addEventListener('click',()=>savePreset(id));panel.querySelector('[data-save-note]').addEventListener('click',()=>saveNote(id,panel));panel.querySelectorAll('[data-builder-control]').forEach(input=>input.addEventListener('input',()=>{const item=cap(id);const control=item.controls.find(c=>c.id===input.dataset.builderControl);let value=input.type==='checkbox'?input.checked:input.value;if(control?.type==='range'||control?.type==='number')value=Number(value);const cfg=configFor(id);cfg[control.id]=value;saveConfig(id,cfg);applyConfig(id,cfg);const small=input.closest('.builder-control')?.querySelector('small');if(small)small.textContent=`${value}${control.unit||''}`;}));}
  function focusPanel(id){state.activePanel=id;state.panels.forEach((panel,key)=>{panel.classList.toggle('is-active',key===id);panel.style.zIndex=String(10+(key===id?state.panels.size+10:0));});renderMobileDock();}
  function closeInspector(id){const panel=state.panels.get(id);if(!panel)return;panel.remove();state.panels.delete(id);if(state.activePanel===id)state.activePanel=[...state.panels.keys()].pop()||'';renderMobileDock();}
  function resetInspector(id){const item=cap(id);if(!item)return;const cfg=defaultsFor(item);saveConfig(id,cfg);const old=state.panels.get(id);if(old){old.remove();state.panels.delete(id);}applyConfig(id,cfg);openInspector(id,primaryTarget(id));}
  function installPanelDrag(panel,id){const head=panel.querySelector('.builder-inspector__head');let drag=null;head.addEventListener('pointerdown',event=>{if(isMobile()||event.target.closest('button'))return;const rect=panel.getBoundingClientRect();drag={x:event.clientX-rect.left,y:event.clientY-rect.top};head.setPointerCapture?.(event.pointerId);focusPanel(id);});head.addEventListener('pointermove',event=>{if(!drag)return;panel.style.left=`${Math.max(6,Math.min(innerWidth-panel.offsetWidth-6,event.clientX-drag.x))}px`;panel.style.top=`${Math.max(70,Math.min(innerHeight-panel.offsetHeight-6,event.clientY-drag.y))}px`;panel.style.right='auto';panel.style.bottom='auto';});head.addEventListener('pointerup',event=>{if(!drag)return;drag=null;head.releasePointerCapture?.(event.pointerId);savePanelPosition(id,panel);});}
  function savePanelPosition(id,panel){const positions=readJson(STORAGE.panels,{});positions[id]={left:parseFloat(panel.style.left)||panel.offsetLeft,top:parseFloat(panel.style.top)||panel.offsetTop};writeJson(STORAGE.panels,positions);}
  function restorePanelPosition(id,panel){const positions=readJson(STORAGE.panels,{}),pos=positions[id],index=state.panels.size;if(pos){panel.style.left=`${Math.max(8,Math.min(innerWidth-370,pos.left))}px`;panel.style.top=`${Math.max(70,pos.top)}px`;}else{panel.style.left=`${Math.max(12,innerWidth-390-index*26)}px`;panel.style.top=`${86+index*24}px`;}}
  function renderMobileDock(){if(!isMobile()||!state.panels.size){mobileDock.hidden=true;mobileDock.innerHTML='';return;}mobileDock.hidden=false;mobileDock.innerHTML=[...state.panels.keys()].map(id=>`<button type="button" data-mobile-panel="${escapeHtml(id)}" aria-pressed="${id===state.activePanel?'true':'false'}">${escapeHtml(cap(id)?.label||id)}</button>`).join('');mobileDock.querySelectorAll('[data-mobile-panel]').forEach(button=>button.addEventListener('click',()=>focusPanel(button.dataset.mobilePanel)));}

  function applyConfig(id,config){
    const doc=state.frameDoc;if(!doc)return;const nodes=targets(id);const set=(node,name,value)=>node?.style.setProperty(name,value,'important');
    if(id==='top-chapter-navigation')nodes.forEach(node=>{if(node.matches('.nav-scroll')){set(node,'gap',`${innerWidth>760?Number(config.desktopChipGap||5):Number(config.mobileChipGap||6)}px`);set(node,'padding-left',`${Number(config.railInset||14)}px`);}node.dataset.builderStickyMode=config.stickyMode||'deferred-sticky';});
    if(id==='horizontal-card-rail')nodes.forEach(node=>{set(node,'--desktop-shadow-runway',`${Number(config.leftPaintRunway||0)}px`);if(node.matches('.scroll-row'))set(node,'padding-right',`${Number(config.rightContentPadding||0)}px`);node.style.scrollbarWidth=config.scrollbar==='hidden'?'none':'';node.dataset.builderDesktopDrag=String(config.desktopDrag!==false);});
    if(id==='filter-chip-rail')nodes.forEach(node=>{set(node,'gap',`${Number(config.gap||7)}px`);set(node,'padding-left',`${Number(config.runway||0)}px`);set(node,'padding-right',`${Number(config.runway||0)}px`);node.querySelectorAll('.collection-filter').forEach(chip=>{set(chip,'border-radius','999px');if(chip.classList.contains('is-active')){set(chip,'background',config.accentColor||'#202226');set(chip,'color','#fff');}else{set(chip,'background','#f3f4f7');set(chip,'color','#6f747d');}});});
    if(id==='collection-bottom-sheet')nodes.forEach(node=>{set(node,'max-width',`${Number(config.maxWidth||760)}px`);set(node,'height',`min(${Number(config.maxHeightDvh||84)}dvh,780px)`);set(node,'border-radius',`${Number(config.radiusTop||30)}px ${Number(config.radiusTop||30)}px 0 0`);set(node,'backdrop-filter',`blur(${Number(config.sheetBlur||26)}px) saturate(${Number(config.sheetSaturation||135)}%)`);});
    if(id==='device-handoff-accordion')nodes.forEach(node=>{set(node,'transition-duration',`${config.response==='calm'?460:config.response==='lively'?190:300}ms`);});
    if(id==='reading-progress')nodes.forEach(node=>{set(node,'height',`${Number(config.thickness||2)}px`);set(node,'opacity',String(Number(config.opacity||100)/100));set(node,'background',config.color||'#4081ef');});
    if(id==='floating-action')nodes.forEach(node=>{set(node,'background',config.family==='flat'?(config.accentColor||'#315fc9'):`color-mix(in srgb,${config.accentColor||'#315fc9'} 92%,#fff)`);set(node,'transition-duration',`${config.response==='calm'?430:config.response==='lively'?190:290}ms`);});
  }
  function reapplyAll(){for(const item of uiManifest.capabilities)applyConfig(item.id,configFor(item.id));}

  function savePreset(id){const item=cap(id);if(!item)return;const items=readJson(STORAGE.presets,[]),now=new Date().toISOString();items.push({id:`builder_${id}_${Date.now()}`,capabilityId:id,name:`${item.label} · 빌더 저장`,config:configFor(id),source:'user',status:'draft',createdAt:now,updatedAt:now,notes:state.notes[id]||'',version:1});writeJson(STORAGE.presets,items.slice(-200));toast('현재 설정을 저장했습니다.');}
  async function saveNote(id,panel){
    const note=String(panel.querySelector('[data-builder-note]')?.value||'').trim();state.notes[id]=note;writeJson(STORAGE.notes,state.notes);const item=cap(id),now=new Date().toISOString();const memoPreset={id:`builder_note_${id}`,capabilityId:id,name:`${item?.label||id} · 수정 요청`,config:configFor(id),source:'user',status:'draft',createdAt:now,updatedAt:now,notes:note,version:1};const local=readJson(STORAGE.presets,[]);const index=local.findIndex(x=>x.id===memoPreset.id);if(index>=0)local[index]={...local[index],...memoPreset,createdAt:local[index].createdAt||now};else local.push(memoPreset);writeJson(STORAGE.presets,local.slice(-200));
    const token=getToken();if(!token){toast('브라우저에 메모를 저장했습니다. 서버 연결 후 시트에도 저장할 수 있습니다.');return;}
    try{const response=await fetch('/api/editor/ui-presets',{method:'POST',credentials:'same-origin',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({presets:[memoPreset]})});const data=await response.json().catch(()=>({}));if(!response.ok||data.ok===false)throw new Error(data.message||'메모 저장 실패');toast('메모를 UI_PRESETS 시트에 저장했습니다.');}catch(error){toast(error.message||'메모를 서버에 저장하지 못했습니다.');}
  }

  function renderLibraryFilters(){if(!libraryFilters)return;const categories=[...new Set(uiManifest.capabilities.map(item=>item.category))];libraryFilters.innerHTML=[`<button type="button" data-library-filter="all" aria-pressed="${state.libraryFilter==='all'}">전체</button>`,...categories.map(category=>`<button type="button" data-library-filter="${escapeHtml(category)}" aria-pressed="${state.libraryFilter===category}">${escapeHtml(CATEGORY_LABELS[category]||category)}</button>`)].join('');libraryFilters.querySelectorAll('[data-library-filter]').forEach(button=>button.addEventListener('click',()=>{state.libraryFilter=button.dataset.libraryFilter;renderLibraryFilters();filterLibraryFloor();}));}
  function buildLibraryFloor(){
    const doc=state.frameDoc;if(!doc)return;restorePageView(false);const snapshots=[];for(const item of uiManifest.capabilities){const source=primaryTarget(item.id);if(source)snapshots.push({item,clone:source.cloneNode(true)});}doc.querySelector('#platformBuilderLibraryFloor')?.remove();const floor=doc.createElement('main');floor.id='platformBuilderLibraryFloor';floor.setAttribute('aria-label','UI 라이브러리');
    for(const {item,clone} of snapshots){clone.querySelectorAll('.platform-builder-gear,.platform-builder-block-handle').forEach(node=>node.remove());clone.removeAttribute('id');clone.dataset.libraryCapability=item.id;clone.dataset.libraryCategory=item.category;clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));floor.appendChild(clone);}doc.body.appendChild(floor);doc.documentElement.dataset.builderLibrary='true';filterLibraryFloor();reapplyAll();
  }
  function filterLibraryFloor(){state.frameDoc?.querySelectorAll('#platformBuilderLibraryFloor>[data-library-capability]').forEach(node=>{node.hidden=state.libraryFilter!=='all'&&node.dataset.libraryCategory!==state.libraryFilter;});}
  function restorePageView(removeFloor=true){const doc=state.frameDoc;if(!doc)return;delete doc.documentElement.dataset.builderLibrary;if(removeFloor)doc.querySelector('#platformBuilderLibraryFloor')?.remove();markCapabilities();prepareBlocks();reapplyAll();}

  function renderBlockPalette(){if(!blockManifest||!blockList)return;const categories=['all',...new Set(blockManifest.blocks.map(item=>item.category))],labels={all:'전체',foundation:'기초',content:'콘텐츠',data:'데이터',media:'미디어',action:'행동',resource:'자료',monetization:'광고'};blockFilter.innerHTML=categories.map(category=>`<button type="button" data-block-category="${escapeHtml(category)}" aria-pressed="${state.blockCategory===category}">${escapeHtml(labels[category]||category)}</button>`).join('');blockFilter.querySelectorAll('[data-block-category]').forEach(button=>button.addEventListener('click',()=>{state.blockCategory=button.dataset.blockCategory;renderBlockPalette();}));const blocks=blockManifest.blocks.filter(item=>state.blockCategory==='all'||item.category===state.blockCategory);blockList.innerHTML=blocks.map(item=>`<div class="builder-block-item"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status==='approved'?'승인됨':'검토 중')} · ${escapeHtml((item.variants||[]).join(' / '))}</span></div><button type="button" data-add-block-type="${escapeHtml(item.type)}">추가</button></div>`).join('');blockList.querySelectorAll('[data-add-block-type]').forEach(button=>button.addEventListener('click',()=>addRegistryBlock(button.dataset.addBlockType)));}
  function addRegistryBlock(type){if(type==='advertisement'){addAdvertisement('inline-banner');closePalette();return;}const block=blockManifest?.blocks.find(item=>item.type===type),doc=state.frameDoc,app=doc?.querySelector('#app');if(!block||!app)return;const section=doc.createElement('section');section.className='platform-builder-block platform-builder-ad';section.dataset.builderBlockId=`sandbox_${type}_${Date.now()}`;section.dataset.builderBlockType=type;section.innerHTML=`<div><strong>${escapeHtml(block.label)}</strong><span>Block Lab 범용 블록 연결 전 조립 자리 · ${escapeHtml(block.status==='approved'?'승인됨':'검토 중')}</span></div>`;const anchor=state.selectedBlock?.isConnected?state.selectedBlock:null;if(anchor)anchor.parentNode.insertBefore(section,anchor.nextSibling);else app.appendChild(section);state.selectedBlock=section;prepareBlocks();section.scrollIntoView({behavior:'smooth',block:'center'});captureLayout();closePalette();}
  function openPalette(){renderBlockPalette();palette.classList.add('is-open');palette.setAttribute('aria-hidden','false');}
  function closePalette(){palette.classList.remove('is-open');palette.setAttribute('aria-hidden','true');}
  function toast(message){let node=document.querySelector('#builderToast');if(!node){node=document.createElement('div');node.id='builderToast';node.style.cssText='position:fixed;z-index:300;left:50%;bottom:22px;transform:translateX(-50%);padding:9px 12px;border:1px solid rgba(20,28,45,.12);border-radius:999px;background:rgba(32,34,38,.94);color:#fff;font:700 9px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 10px 28px rgba(20,28,45,.18);pointer-events:none';document.body.appendChild(node);}node.textContent=message;node.hidden=false;clearTimeout(node._timer);node._timer=setTimeout(()=>node.hidden=true,2600);}

  editToggle?.addEventListener('click',()=>{state.editMode=!state.editMode;editToggle.setAttribute('aria-pressed',String(state.editMode));editToggle.textContent=state.editMode?'편집 모드 켬':'편집 모드 끔';if(state.frameDoc){state.frameDoc.documentElement.dataset.builderEdit=String(state.editMode);state.frameDoc.querySelectorAll('.platform-builder-block').forEach(node=>node.draggable=state.editMode);}});
  pageSelect?.addEventListener('change',()=>{frameStatus.hidden=false;frameStatus.textContent='페이지를 다시 불러오는 중';frame.src=pageSelect.value;});
  resetButton?.addEventListener('click',()=>{frameStatus.hidden=false;frameStatus.textContent='원본을 다시 불러오는 중';frame.contentWindow?.location.reload();});
  saveLayoutButton?.addEventListener('click',()=>{const ids=captureLayout();toast(`현재 블록 순서 ${ids.length}개를 브라우저에 저장했습니다.`);});
  addAdButton?.addEventListener('click',()=>addAdvertisement('inline-banner'));paletteButton?.addEventListener('click',openPalette);palette?.querySelector('[data-close-block-palette]')?.addEventListener('click',closePalette);window.addEventListener('resize',renderMobileDock,{passive:true});

  setView(state.view);renderBlockPalette();
})();
