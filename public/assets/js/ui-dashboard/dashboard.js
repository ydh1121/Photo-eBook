(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  if(!manifest)return;

  const STORAGE_KEY='platformUiCapabilityPresetsV1';
  const root=document.querySelector('.ui-dashboard');
  const list=document.querySelector('#uiCapabilityList');
  const workspace=document.querySelector('#uiWorkspace');
  const presetList=document.querySelector('#uiPresetList');
  const presetName=document.querySelector('#uiPresetName');
  const savePresetButton=document.querySelector('#uiPresetSave');
  const exportButton=document.querySelector('#uiPresetExport');
  if(!root||!list||!workspace||!presetList)return;

  const state={
    currentId:manifest.capabilities[0]?.id||'',
    configs:new Map(),
    saved:readSaved()
  };

  for(const capability of manifest.capabilities){state.configs.set(capability.id,defaultsFor(capability));}

  function readSaved(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function writeSaved(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.saved));}catch{}}
  function current(){return manifest.capabilities.find(item=>item.id===state.currentId)||manifest.capabilities[0];}
  function defaultsFor(capability){const config={};for(const control of capability.controls||[])config[control.id]=control.default;return config;}
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}

  function renderList(){
    list.innerHTML=manifest.capabilities.map(item=>`<button type="button" class="ui-capability-item" data-capability-id="${escapeHtml(item.id)}" aria-pressed="${item.id===state.currentId?'true':'false'}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.category)} · ${escapeHtml(item.source)}</span></button>`).join('');
    list.querySelectorAll('[data-capability-id]').forEach(button=>button.addEventListener('click',()=>{state.currentId=button.dataset.capabilityId;render();}));
  }

  function controlMarkup(control,value){
    const disabled=control.locked?'disabled':'';
    if(control.type==='boolean')return `<label class="ui-control ui-control--boolean"><span>${escapeHtml(control.label)}</span><span class="ui-switch"><input type="checkbox" data-ui-control="${escapeHtml(control.id)}" ${value?'checked':''} ${disabled}><i></i></span></label>`;
    if(control.type==='enum')return `<label class="ui-control"><span>${escapeHtml(control.label)}</span><select data-ui-control="${escapeHtml(control.id)}" ${disabled}>${(control.options||[]).map(option=>`<option value="${escapeHtml(option)}" ${option===value?'selected':''}>${escapeHtml(option)}</option>`).join('')}</select></label>`;
    if(control.type==='color')return `<label class="ui-control"><span>${escapeHtml(control.label)}</span><input type="color" data-ui-control="${escapeHtml(control.id)}" value="${escapeHtml(value||'#315fc9')}" ${disabled}></label>`;
    if(control.type==='range'||control.type==='number')return `<label class="ui-control"><span>${escapeHtml(control.label)} <small data-ui-value-for="${escapeHtml(control.id)}">${escapeHtml(value)}</small></span><input type="${control.type==='range'?'range':'number'}" data-ui-control="${escapeHtml(control.id)}" value="${escapeHtml(value)}" min="${escapeHtml(control.min??0)}" max="${escapeHtml(control.max??100)}" step="${escapeHtml(control.step??1)}" ${disabled}></label>`;
    return `<label class="ui-control"><span>${escapeHtml(control.label)}</span><input type="text" data-ui-control="${escapeHtml(control.id)}" value="${escapeHtml(value||'')}" ${disabled}></label>`;
  }

  function previewMarkup(capability,config){
    switch(capability.id){
      case 'top-chapter-navigation':
        return `<div class="ui-demo-nav" style="--demo-accent:${escapeHtml(config.accentColor)};--demo-thickness:${Number(config.progressThickness||2)}px"><div class="ui-demo-nav__rail"><span class="ui-demo-chip is-active">시작</span><span class="ui-demo-chip">시장</span><span class="ui-demo-chip">교육</span><span class="ui-demo-chip">실무</span><span class="ui-demo-chip">수익</span></div>${config.progressEnabled?'<div class="ui-demo-progress"></div>':''}</div>`;
      case 'horizontal-card-rail':
        return `<div class="ui-demo-rail" data-fade="${escapeHtml(config.fadeEdges)}" style="--demo-left:${Number(config.runwayLeft||0)}px;--demo-right:${Number(config.runwayRight||0)}px;--demo-fade-width:${Number(config.fadeWidth||0)}px"><article><b>카드 01</b><p>시작점과 그림자가 잘리지 않는지 확인합니다.</p></article><article><b>카드 02</b><p>가로 스크롤과 fade를 함께 검토합니다.</p></article><article><b>카드 03</b><p>끝 여백이 막히지 않아야 합니다.</p></article></div>`;
      case 'filter-chip-rail':{
        const opacity=Math.max(0,Math.min(100,Number(config.surfaceOpacity||78)))/100;
        return `<div class="ui-demo-filter" data-family="${escapeHtml(config.family)}" style="--demo-accent:${escapeHtml(config.accentColor)};--demo-gap:${Number(config.gap||8)}px;--demo-blur:${Number(config.blur||0)}px;--demo-opacity:${opacity}"><div class="ui-demo-filter__rail"><button class="is-active">전체</button><button>영상</button><button>읽을거리</button><button>질문</button></div></div>`;
      }
      case 'collection-bottom-sheet':
        return `<div style="position:relative;min-height:270px;background:linear-gradient(#f4f5f7,#eceef2);border-radius:15px;overflow:hidden"><div class="ui-demo-sheet">${config.handle?'<div class="ui-demo-sheet__handle"></div>':''}${config.tabs?'<div class="ui-demo-sheet__tabs"><span>전체</span><span>영상</span><span>질문</span><span>설정</span></div>':''}<div class="ui-demo-sheet__tools">${config.search?'<i></i>':''}${config.filters?'<i></i>':''}</div></div></div>`;
      case 'device-handoff-accordion':
        return `<div class="ui-demo-accordion"><button type="button" data-demo-accordion>다른 기기 연결</button><div class="ui-demo-accordion__panel" data-demo-accordion-panel>이 기기의 연결 코드를 복사하거나 다른 기기에서 가져온 코드를 입력하는 영역입니다.</div></div>`;
      case 'reading-progress':{
        const opacity=Math.max(0,Math.min(100,Number(config.opacity||100)))/100;
        return `<div class="ui-demo-reading"><div class="ui-demo-reading__track" style="height:${Number(config.thickness||2)}px"><div class="ui-demo-reading__fill" style="--demo-accent:${escapeHtml(config.color)};--demo-opacity:${opacity}"></div></div></div>`;
      }
      case 'floating-action':
        return `<div style="position:relative;min-height:250px;background:#f5f6f8;border-radius:15px"><button class="ui-demo-fab" style="--demo-accent:${escapeHtml(config.accentColor)}">+</button></div>`;
      default:return '<div class="ui-empty">미리보기를 준비 중입니다.</div>';
    }
  }

  function renderWorkspace(){
    const capability=current();
    if(!capability)return;
    const config=state.configs.get(capability.id)||defaultsFor(capability);
    workspace.innerHTML=`<section class="ui-card"><header class="ui-card__head"><div><small>${escapeHtml(capability.category)}</small><h2>${escapeHtml(capability.label)}</h2><p>${escapeHtml(capability.source)} · ${escapeHtml(capability.status)}</p></div><div class="ui-owner-list">${(capability.owners||[]).map(owner=>escapeHtml(owner)).join('<br>')}</div></header><div class="ui-preview-stage"><div class="ui-preview">${previewMarkup(capability,config)}</div></div><div class="ui-controls">${(capability.controls||[]).map(control=>controlMarkup(control,config[control.id])).join('')}</div></section>`;
    workspace.querySelectorAll('[data-ui-control]').forEach(input=>{
      const eventName=input.type==='range'||input.type==='color'?'input':'change';
      input.addEventListener(eventName,()=>{
        const control=(capability.controls||[]).find(item=>item.id===input.dataset.uiControl);
        if(!control)return;
        let value=input.type==='checkbox'?input.checked:input.value;
        if(control.type==='range'||control.type==='number')value=Number(value);
        config[control.id]=value;
        const valueNode=workspace.querySelector(`[data-ui-value-for="${CSS.escape(control.id)}"]`);
        if(valueNode)valueNode.textContent=String(value);
        const preview=workspace.querySelector('.ui-preview');
        if(preview)preview.innerHTML=previewMarkup(capability,config);
        bindPreviewInteractions();
      });
    });
    bindPreviewInteractions();
  }

  function allPresetsFor(capability){
    const builtIn=(capability.presets||[]).map(item=>({...item,source:'system'}));
    const local=state.saved.filter(item=>item.capabilityId===capability.id).map(item=>({...item,source:item.source||'user'}));
    return [...builtIn,...local];
  }

  function renderPresets(){
    const capability=current();
    const presets=allPresetsFor(capability);
    presetList.innerHTML=presets.length?presets.map(item=>`<article class="ui-preset"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.source||'user')}</span><button type="button" data-preset-id="${escapeHtml(item.id)}">불러오기</button></article>`).join(''):'<div class="ui-empty">저장된 preset이 없습니다.</div>';
    presetList.querySelectorAll('[data-preset-id]').forEach(button=>button.addEventListener('click',()=>{
      const preset=presets.find(item=>item.id===button.dataset.presetId);
      if(!preset)return;
      state.configs.set(capability.id,{...defaultsFor(capability),...clone(preset.config||{})});
      renderWorkspace();
    }));
  }

  function savePreset(){
    const capability=current();
    const name=String(presetName?.value||'').trim();
    if(!capability||!name){presetName?.focus();return;}
    const item={id:`preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,capabilityId:capability.id,name,config:clone(state.configs.get(capability.id)||{}),source:'user',status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),version:1};
    state.saved.push(item);writeSaved();if(presetName)presetName.value='';renderPresets();
  }

  function exportPresets(){
    const payload={schema:'platform-ui-presets/v1',exportedAt:new Date().toISOString(),presets:state.saved};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='platform-ui-presets.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }

  function bindPreviewInteractions(){
    workspace.querySelectorAll('[data-demo-accordion]').forEach(button=>{
      if(button.dataset.bound==='true')return;button.dataset.bound='true';button.addEventListener('click',()=>{const panel=button.parentElement?.querySelector('[data-demo-accordion-panel]');if(panel)panel.hidden=!panel.hidden;});
    });
  }

  function render(){renderList();renderWorkspace();renderPresets();}
  savePresetButton?.addEventListener('click',savePreset);exportButton?.addEventListener('click',exportPresets);
  render();
})();
