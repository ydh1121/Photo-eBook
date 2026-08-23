(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformGlobalChipKitV4)return;
  window.__platformGlobalChipKitV4=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';
  const ITEMS_STORE='platformBuilderFilterPreviewItemsV2';
  const STYLE_KEYS=['family','accentColor','surfaceOpacity','blur','response','overshoot'];
  const GEOMETRY_DEFAULTS=Object.freeze({gap:9,railPaddingTop:5.5,railPaddingRight:5.5,railPaddingBottom:5.5,railPaddingLeft:5.5});
  const PRESETS=Object.freeze({
    'material-flat':Object.freeze({family:'material-flat',accentColor:'#437ce7',surfaceOpacity:100,blur:0,response:'standard'}),
    'ios-flat':Object.freeze({family:'ios-flat',accentColor:'#437ce7',surfaceOpacity:88,blur:12,response:'standard'}),
    'ios-liquid':Object.freeze({family:'ios-liquid',accentColor:'#437ce7',surfaceOpacity:100,blur:22,response:'standard'})
  });
  const DEFAULT_ITEMS=Object.freeze(['전체','제품 촬영','인물 촬영','음식 촬영']);

  function readAll(){
    try{
      const all=JSON.parse(localStorage.getItem(STORE)||'{}');
      return all&&typeof all==='object'&&!Array.isArray(all)?all:{};
    }catch{return {};}
  }
  function writeAll(all){try{localStorage.setItem(STORE,JSON.stringify(all));}catch{}}
  function read(){return readAll()['filter-chip-rail']||null;}
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function sync(){
    post({type:'platform-ui-reset',capabilityId:'filter-chip-rail'});
    const config=read();
    if(config&&Object.keys(config).length)post({type:'platform-ui-config',capabilityId:'filter-chip-rail',config});
    syncItems();
  }
  function activeId(){return document.querySelector('[data-kit-ui][aria-pressed="true"]')?.dataset.kitUi||'';}

  function applyPreset(value){
    const all=readAll();
    const next={...(all['filter-chip-rail']||{})};
    STYLE_KEYS.forEach(key=>delete next[key]);
    if(value!=='original'){
      const preset=PRESETS[value];if(!preset)return;
      Object.assign(next,preset);
      for(const [key,defaultValue] of Object.entries(GEOMETRY_DEFAULTS)){
        if(!Object.prototype.hasOwnProperty.call(next,key))next[key]=defaultValue;
      }
    }
    if(Object.keys(next).length)all['filter-chip-rail']=next;else delete all['filter-chip-rail'];
    writeAll(all);
    sync();
    updateModeButtons();
  }

  function updateModeButtons(){
    if(activeId()!=='filter-chip-rail')return;
    const current=read()?.family||'original';
    document.querySelectorAll('[data-kit-mode]').forEach(button=>{
      const next=String(button.dataset.kitMode===current);
      if(button.getAttribute('aria-pressed')!==next)button.setAttribute('aria-pressed',next);
    });
  }

  function readItems(){
    try{
      const value=JSON.parse(localStorage.getItem(ITEMS_STORE)||'null');
      if(Array.isArray(value)){
        const cleaned=value.map(item=>String(item||'').trim()).filter(Boolean).slice(0,16);
        if(cleaned.length)return cleaned;
      }
    }catch{}
    return [...DEFAULT_ITEMS];
  }
  function writeItems(items){try{localStorage.setItem(ITEMS_STORE,JSON.stringify(items));}catch{}}
  function syncItems(){
    if(activeId()!=='filter-chip-rail')return;
    post({type:'platform-filter-chip-preview-items',labels:readItems()});
  }

  function ensureItemTools(){
    const controls=document.querySelector('.builder-kit-controls');
    if(!controls)return null;
    let tools=controls.querySelector('.builder-kit-filter-items');
    if(tools)return tools;
    tools=document.createElement('div');
    tools.className='builder-kit-switch builder-kit-filter-items';
    tools.hidden=true;
    tools.innerHTML='<span>샘플 칩</span><input type="text" maxlength="24" placeholder="칩 이름" aria-label="추가할 샘플 칩 이름"><button type="button" data-filter-item-add>추가</button><button type="button" data-filter-item-remove>마지막 삭제</button><button type="button" data-filter-item-reset>기본</button>';
    controls.appendChild(tools);
    const input=tools.querySelector('input');
    const add=()=>{
      const label=String(input?.value||'').trim();if(!label)return;
      const items=readItems();if(items.length>=16)return;
      items.push(label);writeItems(items);input.value='';syncItems();
    };
    tools.querySelector('[data-filter-item-add]')?.addEventListener('click',add);
    tools.querySelector('[data-filter-item-remove]')?.addEventListener('click',()=>{
      const items=readItems();if(items.length<=1)return;items.pop();writeItems(items);syncItems();
    });
    tools.querySelector('[data-filter-item-reset]')?.addEventListener('click',()=>{writeItems([...DEFAULT_ITEMS]);syncItems();});
    input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();add();}});
    return tools;
  }

  function annotate(){
    const active=activeId();
    const hint=document.querySelector('#kitHint');
    const workspace=document.querySelector('.builder-kit-workspace');
    const settings=document.querySelector('#kitSettings');
    const itemTools=ensureItemTools();
    if(workspace){
      if(workspace.dataset.activeUi!==active)workspace.dataset.activeUi=active;
      if(active==='filter-chip-rail'&&workspace.style.getPropertyValue('--kit-preview-height')!=='300px')workspace.style.setProperty('--kit-preview-height','300px');
    }
    if(itemTools){
      const hidden=active!=='filter-chip-rail';
      if(itemTools.hidden!==hidden)itemTools.hidden=hidden;
    }
    if(settings){
      const nextLabel=active==='filter-chip-rail'?'여백·간격':'세부 설정';
      if(settings.textContent!==nextLabel)settings.textContent=nextLabel;
    }
    if(!hint)return;
    const next=active==='top-chapter-navigation'
      ?'메뉴 고정과 읽기 진행을 조정합니다. 칩 스타일은 범용 필터칩에서 공통으로 관리합니다.'
      :active==='filter-chip-rail'
        ?'한 레일에서 칩을 추가해 보고, 스타일과 여백을 바로 조정할 수 있습니다.'
        :'공개 페이지와 같은 UI 런타임을 사용합니다.';
    if(hint.textContent!==next)hint.textContent=next;
    if(active==='filter-chip-rail')syncItems();
  }

  frame.addEventListener('load',()=>[60,220,620].forEach(delay=>setTimeout(()=>{sync();annotate();},delay)));
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    if(['platform-preview-ready','platform-filter-chip-live-ready'].includes(event.data?.type))setTimeout(()=>{sync();updateModeButtons();annotate();},40);
  });

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const modeButton=target.closest('[data-kit-mode]');
    if(modeButton&&activeId()==='filter-chip-rail'){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      applyPreset(modeButton.dataset.kitMode||'original');
      [30,120,320].forEach(delay=>setTimeout(()=>{sync();annotate();updateModeButtons();},delay));
      return;
    }
    if(target.closest('[data-kit-ui],[data-kit-theme],[data-kit-viewport],[data-kit-reset]')){
      [40,160,420].forEach(delay=>setTimeout(()=>{sync();annotate();updateModeButtons();},delay));
    }
  },true);

  const observer=new MutationObserver(()=>queueMicrotask(()=>{annotate();updateModeButtons();}));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  [40,120,320,720].forEach(delay=>setTimeout(()=>{sync();annotate();updateModeButtons();},delay));
})();
