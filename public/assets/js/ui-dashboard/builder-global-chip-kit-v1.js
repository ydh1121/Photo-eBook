(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformGlobalChipKitV5)return;
  window.__platformGlobalChipKitV5=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';
  const ITEMS_STORE='platformBuilderFilterPreviewItemsV3';
  const OLD_ITEMS_STORE='platformBuilderFilterPreviewItemsV2';
  const SELECTED_STORE='platformBuilderFilterPreviewSelectedV1';
  const STYLE_KEYS=['family','accentColor','surfaceOpacity','blur','response','overshoot'];
  const GEOMETRY_DEFAULTS=Object.freeze({gap:9,railPaddingTop:5.5,railPaddingRight:5.5,railPaddingBottom:5.5,railPaddingLeft:5.5});
  const PRESETS=Object.freeze({
    'material-flat':Object.freeze({family:'material-flat',accentColor:'#437ce7',surfaceOpacity:100,blur:0,response:'standard'}),
    'ios-flat':Object.freeze({family:'ios-flat',accentColor:'#437ce7',surfaceOpacity:88,blur:12,response:'standard'}),
    'ios-liquid':Object.freeze({family:'ios-liquid',accentColor:'#437ce7',surfaceOpacity:100,blur:22,response:'standard'})
  });
  const DEFAULT_ITEMS=Object.freeze([
    Object.freeze({id:'all',label:'전체',family:'inherit'}),
    Object.freeze({id:'product',label:'제품 촬영',family:'inherit'}),
    Object.freeze({id:'portrait',label:'인물 촬영',family:'inherit'}),
    Object.freeze({id:'food',label:'음식 촬영',family:'inherit'})
  ]);

  function uid(){return `chip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function normalizeItem(item,index){
    if(item&&typeof item==='object'){
      const label=String(item.label||'').trim();if(!label)return null;
      return {id:String(item.id||`chip-${index}`),label,family:['inherit','material-flat','ios-flat','ios-liquid'].includes(item.family)?item.family:'inherit'};
    }
    const label=String(item||'').trim();
    return label?{id:`legacy-${index}-${label.slice(0,8)}`,label,family:'inherit'}:null;
  }
  function normalizeItems(value){return (Array.isArray(value)?value:[]).map(normalizeItem).filter(Boolean).slice(0,16);}
  function defaults(){return DEFAULT_ITEMS.map(item=>({...item}));}

  function readAll(){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}');return all&&typeof all==='object'&&!Array.isArray(all)?all:{};}catch{return {};}}
  function writeAll(all){try{localStorage.setItem(STORE,JSON.stringify(all));}catch{}}
  function read(){return readAll()['filter-chip-rail']||null;}
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function activeId(){return document.querySelector('[data-kit-ui][aria-pressed="true"]')?.dataset.kitUi||'';}
  function readSelected(){try{return localStorage.getItem(SELECTED_STORE)||'';}catch{return '';}}
  function writeSelected(id){try{localStorage.setItem(SELECTED_STORE,id||'');}catch{}}

  function readItems(){
    try{
      const current=normalizeItems(JSON.parse(localStorage.getItem(ITEMS_STORE)||'null'));
      if(current.length)return current;
      const legacy=normalizeItems(JSON.parse(localStorage.getItem(OLD_ITEMS_STORE)||'null'));
      if(legacy.length){writeItems(legacy);return legacy;}
    }catch{}
    const items=defaults();writeItems(items);return items;
  }
  function writeItems(items){try{localStorage.setItem(ITEMS_STORE,JSON.stringify(normalizeItems(items)));}catch{}}
  function selectedItem(items=readItems()){
    const selected=readSelected();
    return items.find(item=>item.id===selected)||items[0]||null;
  }
  function ensureSelected(items=readItems()){
    const item=selectedItem(items);if(item&&readSelected()!==item.id)writeSelected(item.id);return item;
  }
  function syncItems(){if(activeId()==='filter-chip-rail')post({type:'platform-filter-chip-preview-items',items:readItems()});}
  function sync(){
    post({type:'platform-ui-reset',capabilityId:'filter-chip-rail'});
    const config=read();if(config&&Object.keys(config).length)post({type:'platform-ui-config',capabilityId:'filter-chip-rail',config});
    syncItems();
  }

  function applyPreset(value){
    const all=readAll();const next={...(all['filter-chip-rail']||{})};STYLE_KEYS.forEach(key=>delete next[key]);
    if(value!=='original'){
      const preset=PRESETS[value];if(!preset)return;Object.assign(next,preset);
      for(const [key,defaultValue] of Object.entries(GEOMETRY_DEFAULTS))if(!Object.prototype.hasOwnProperty.call(next,key))next[key]=defaultValue;
    }
    if(Object.keys(next).length)all['filter-chip-rail']=next;else delete all['filter-chip-rail'];writeAll(all);sync();updateModeButtons();
  }

  function updateModeButtons(){
    if(activeId()!=='filter-chip-rail')return;
    const current=read()?.family||'original';
    document.querySelectorAll('[data-kit-mode]').forEach(button=>{const next=String(button.dataset.kitMode===current);if(button.getAttribute('aria-pressed')!==next)button.setAttribute('aria-pressed',next);});
  }

  function updateItemEditor(){
    const tools=document.querySelector('.builder-kit-filter-items');if(!tools)return;
    const items=readItems();const selected=ensureSelected(items);
    const select=tools.querySelector('[data-filter-item-family]');
    const status=tools.querySelector('[data-filter-item-selected]');
    if(select&&selected&&select.value!==selected.family)select.value=selected.family;
    if(status){const text=selected?`선택: ${selected.label}`:'칩을 선택하세요';if(status.textContent!==text)status.textContent=text;}
  }

  function ensureItemTools(){
    const controls=document.querySelector('.builder-kit-controls');if(!controls)return null;
    let tools=controls.querySelector('.builder-kit-filter-items');if(tools)return tools;
    tools=document.createElement('div');tools.className='builder-kit-switch builder-kit-filter-items';tools.hidden=true;
    tools.innerHTML='<span>샘플 칩</span><input type="text" maxlength="24" placeholder="칩 이름" aria-label="추가할 샘플 칩 이름"><button type="button" data-filter-item-add>추가</button><button type="button" data-filter-item-remove>마지막 삭제</button><button type="button" data-filter-item-reset>기본</button><i data-filter-item-selected>칩을 선택하세요</i><select data-filter-item-family aria-label="선택한 칩의 개별 스타일"><option value="inherit">공통값 사용</option><option value="material-flat">Material</option><option value="ios-flat">iOS 플랫</option><option value="ios-liquid">iOS 리퀴드</option></select>';
    controls.appendChild(tools);
    const input=tools.querySelector('input');
    const add=()=>{
      const label=String(input?.value||'').trim();if(!label)return;
      const items=readItems();if(items.length>=16)return;
      const item={id:uid(),label,family:'inherit'};items.push(item);writeItems(items);writeSelected(item.id);input.value='';syncItems();updateItemEditor();
    };
    tools.querySelector('[data-filter-item-add]')?.addEventListener('click',add);
    tools.querySelector('[data-filter-item-remove]')?.addEventListener('click',()=>{
      const items=readItems();if(items.length<=1)return;const removed=items.pop();writeItems(items);if(readSelected()===removed?.id)writeSelected(items.at(-1)?.id||items[0]?.id||'');syncItems();updateItemEditor();
    });
    tools.querySelector('[data-filter-item-reset]')?.addEventListener('click',()=>{const items=defaults();writeItems(items);writeSelected(items[0].id);syncItems();updateItemEditor();});
    tools.querySelector('[data-filter-item-family]')?.addEventListener('change',event=>{
      const items=readItems();const selected=ensureSelected(items);if(!selected)return;
      const family=String(event.target.value||'inherit');const next=items.map(item=>item.id===selected.id?{...item,family}:item);writeItems(next);syncItems();updateItemEditor();
    });
    input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();add();}});
    updateItemEditor();return tools;
  }

  function annotate(){
    const active=activeId();const hint=document.querySelector('#kitHint');const workspace=document.querySelector('.builder-kit-workspace');const settings=document.querySelector('#kitSettings');const itemTools=ensureItemTools();
    if(workspace){if(workspace.dataset.activeUi!==active)workspace.dataset.activeUi=active;if(active==='filter-chip-rail'&&workspace.style.getPropertyValue('--kit-preview-height')!=='300px')workspace.style.setProperty('--kit-preview-height','300px');}
    if(itemTools){const hidden=active!=='filter-chip-rail';if(itemTools.hidden!==hidden)itemTools.hidden=hidden;}
    if(settings){const nextLabel=active==='filter-chip-rail'?'여백·간격':'세부 설정';if(settings.textContent!==nextLabel)settings.textContent=nextLabel;}
    if(!hint)return;
    const next=active==='top-chapter-navigation'
      ?'메뉴 고정과 읽기 진행을 조정합니다. 칩 공통 디자인은 범용 필터칩에서 관리합니다.'
      :active==='filter-chip-rail'
        ?'공통 스타일을 정하고, 칩을 선택하면 해당 칩만 개별 스타일로 바꿀 수 있습니다.'
        :'공개 페이지와 같은 UI 런타임을 사용합니다.';
    if(hint.textContent!==next)hint.textContent=next;
    if(active==='filter-chip-rail'){syncItems();updateItemEditor();}
  }

  frame.addEventListener('load',()=>[60,220,620].forEach(delay=>setTimeout(()=>{sync();annotate();},delay)));
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type==='platform-filter-chip-selection'){
      const id=String(event.data.id||'');if(id){writeSelected(id);updateItemEditor();}
      return;
    }
    if(['platform-preview-ready','platform-filter-chip-live-ready'].includes(event.data?.type))setTimeout(()=>{sync();updateModeButtons();annotate();},40);
  });

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;if(!target)return;
    const modeButton=target.closest('[data-kit-mode]');
    if(modeButton&&activeId()==='filter-chip-rail'){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();applyPreset(modeButton.dataset.kitMode||'original');[30,120,320].forEach(delay=>setTimeout(()=>{sync();annotate();updateModeButtons();},delay));return;
    }
    if(target.closest('[data-kit-ui],[data-kit-theme],[data-kit-viewport],[data-kit-reset]'))[40,160,420].forEach(delay=>setTimeout(()=>{sync();annotate();updateModeButtons();},delay));
  },true);

  const observer=new MutationObserver(()=>queueMicrotask(()=>{annotate();updateModeButtons();}));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  [40,120,320,720].forEach(delay=>setTimeout(()=>{ensureSelected();sync();annotate();updateModeButtons();},delay));
})();
