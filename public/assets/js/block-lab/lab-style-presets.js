(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const styleManifest=window.__PLATFORM_BLOCK_STYLE_MANIFEST;
  if(!manifest||!styleManifest)return;

  const STORAGE_KEY='platformBlockStylePresetsV1';
  const ACTIVE_KEY='platformBlockStyleActiveV1';

  function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
  function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function readObject(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  function writeObject(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  let presets=readArray(STORAGE_KEY);
  let active=readObject(ACTIVE_KEY);

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function e(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function key(type,variant){return `${type}::${variant}`;}
  function currentVariant(specimen){return specimen.querySelector('[data-variant-for]')?.value||'';}
  function controlsFor(type){
    const allowed=new Set(styleManifest.applicability?.[type]||[]);
    return (styleManifest.controls||[]).filter(control=>allowed.has(control.id));
  }
  function defaults(type){const output={};for(const control of controlsFor(type))output[control.id]=control.default;return output;}
  function normalizedStyle(type,input){
    const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    const output=defaults(type);
    for(const control of controlsFor(type)){
      if(control.type==='enum'&&(control.options||[]).includes(source[control.id]))output[control.id]=source[control.id];
    }
    return output;
  }
  function activeStyle(type,variant){
    const current=active[key(type,variant)];
    return normalizedStyle(type,current?.style||current||{});
  }
  function saveActive(type,variant,style,presetId=''){
    active[key(type,variant)]={style:normalizedStyle(type,style),presetId:String(presetId||''),updatedAt:new Date().toISOString()};
    writeObject(ACTIVE_KEY,active);
  }
  function presetsFor(type,variant){return presets.filter(item=>item.blockType===type&&item.variant===variant);}

  function controlMarkup(control,value){
    return `<label class="lab-style-control"><span>${e(control.label)}</span><select data-style-control="${e(control.id)}">${(control.options||[]).map(option=>`<option value="${e(option)}" ${option===value?'selected':''}>${e(option)}</option>`).join('')}</select></label>`;
  }

  function panelMarkup(type,variant){
    const style=activeStyle(type,variant);
    const saved=presetsFor(type,variant);
    return `<section class="lab-style-editor" data-style-editor-for="${e(type)}">
      <div class="lab-style-editor__head"><div><small>STYLE PRESET</small><strong>${e(type)} / ${e(variant)}</strong></div><select data-style-preset-select><option value="">기본 공식</option>${saved.map(item=>`<option value="${e(item.id)}" ${active[key(type,variant)]?.presetId===item.id?'selected':''}>${e(item.name)}</option>`).join('')}</select></div>
      <div class="lab-style-editor__controls">${controlsFor(type).map(control=>controlMarkup(control,style[control.id])).join('')}</div>
      <div class="lab-style-editor__save"><input type="text" data-style-preset-name placeholder="이 디자인 설정 이름"><button type="button" data-style-preset-save>현재 스타일 저장</button><span class="lab-style-editor__status" role="status"></span></div>
    </section>`;
  }

  function applyToCanvas(specimen,type,variant,style){
    const canvas=specimen.querySelector('.lab-specimen__canvas');
    if(!canvas)return;
    const normalized=normalizedStyle(type,style);
    const map={density:'styleDensity',surface:'styleSurface',radius:'styleRadius',border:'styleBorder',shadow:'styleShadow',accentMode:'styleAccentMode',mediaRatio:'styleMediaRatio',edgeTreatment:'styleEdgeTreatment'};
    Object.entries(map).forEach(([field,datasetKey])=>{const value=normalized[field];if(value!==undefined)canvas.dataset[datasetKey]=String(value);else delete canvas.dataset[datasetKey];});
  }

  function renderEditor(specimen){
    const type=specimen.dataset.blockType;
    const variant=currentVariant(specimen);
    if(!type||!variant)return;
    let existing=specimen.querySelector('[data-style-editor-for]');
    const host=document.createElement('div');host.innerHTML=panelMarkup(type,variant);const next=host.firstElementChild;
    if(existing)existing.replaceWith(next);else{
      const variantPanel=specimen.querySelector('.lab-variant-review');
      if(variantPanel)variantPanel.insertAdjacentElement('afterend',next);else specimen.querySelector('.lab-specimen__head')?.insertAdjacentElement('afterend',next);
    }
    applyToCanvas(specimen,type,variant,activeStyle(type,variant));
    bindEditor(specimen,next,type,variant);
  }

  function bindEditor(specimen,panel,type,variant){
    panel.querySelectorAll('[data-style-control]').forEach(select=>select.addEventListener('change',()=>{
      const style=activeStyle(type,variant);style[select.dataset.styleControl]=select.value;saveActive(type,variant,style,'');applyToCanvas(specimen,type,variant,style);
      const presetSelect=panel.querySelector('[data-style-preset-select]');if(presetSelect)presetSelect.value='';
    }));
    panel.querySelector('[data-style-preset-select]')?.addEventListener('change',event=>{
      const id=event.target.value;const preset=presets.find(item=>item.id===id&&item.blockType===type&&item.variant===variant);
      const style=preset?normalizedStyle(type,preset.style):defaults(type);saveActive(type,variant,style,preset?.id||'');renderEditor(specimen);
    });
    panel.querySelector('[data-style-preset-save]')?.addEventListener('click',()=>{
      const input=panel.querySelector('[data-style-preset-name]');const status=panel.querySelector('.lab-style-editor__status');const name=String(input?.value||'').trim();
      if(!name){if(status)status.textContent='이름을 입력하세요.';input?.focus();return;}
      const style=activeStyle(type,variant);const item={id:`style_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,blockType:type,variant,name,style:clone(style),source:'user',status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),notes:'',version:1,previewMeta:{difference:'style-preset'}};
      presets.push(item);writeArray(STORAGE_KEY,presets);saveActive(type,variant,style,item.id);if(input)input.value='';renderEditor(specimen);updateSummary();
    });
  }

  function enhanceSpecimen(specimen){
    if(specimen.dataset.stylePresetBound!=='true'){
      specimen.dataset.stylePresetBound='true';
      specimen.addEventListener('change',event=>{if(event.target.matches('[data-variant-for]'))requestAnimationFrame(()=>renderEditor(specimen));});
    }
    renderEditor(specimen);
  }
  function enhanceAll(){document.querySelectorAll('.lab-specimen').forEach(enhanceSpecimen);updateSummary();}
  function updateSummary(){
    let node=document.querySelector('#labStylePresetSummary');
    if(!node){const brand=document.querySelector('.lab-brand');if(!brand)return;node=document.createElement('span');node.id='labStylePresetSummary';node.className='lab-style-preset-summary';brand.appendChild(node);}
    node.textContent=`저장된 Block 스타일 ${presets.length}개`;
  }
  function exportPayload(){return presets.map(item=>clone(item));}
  function replaceFromServer(items){
    const byId=new Map(presets.map(item=>[item.id,item]));
    for(const item of Array.isArray(items)?items:[]){if(item?.id&&manifest.blocks.some(block=>block.type===item.blockType&&block.variants?.includes(item.variant)))byId.set(item.id,item);}
    presets=[...byId.values()];writeArray(STORAGE_KEY,presets);enhanceAll();
  }

  window.BlockLabStylePresets={enhanceAll,exportPayload,replaceFromServer,storageKey:STORAGE_KEY};
  requestAnimationFrame(enhanceAll);
})();
