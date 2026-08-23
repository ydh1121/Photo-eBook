(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformGlobalChipKitV2)return;
  window.__platformGlobalChipKitV2=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';
  const MIGRATION='platformGlobalChipPresetMigrationV2';
  const PRESETS=Object.freeze({
    'material-flat':Object.freeze({family:'material-flat',accentColor:'#315fc9',surfaceOpacity:100,blur:0,response:'calm',gap:8,runway:14}),
    'ios-flat':Object.freeze({family:'ios-flat',accentColor:'#202226',surfaceOpacity:100,blur:0,response:'calm',gap:7,runway:0}),
    'ios-liquid':Object.freeze({family:'ios-liquid',accentColor:'#437ce7',surfaceOpacity:78,blur:18,response:'standard',gap:8,runway:14})
  });

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
  }
  function activeId(){return document.querySelector('[data-kit-ui][aria-pressed="true"]')?.dataset.kitUi||'';}

  function migrateBrokenFamilyOnlyState(){
    try{
      if(localStorage.getItem(MIGRATION)==='done')return;
      const all=readAll();
      const config=all['filter-chip-rail'];
      const looksLikeOldBase=config&&config.family&&config.family!=='ios-flat'
        && String(config.accentColor||'#202226').toLowerCase()==='#202226'
        && Number(config.surfaceOpacity??100)===100
        && Number(config.blur??0)===0
        && String(config.response||'calm')==='calm'
        && Number(config.gap??7)===7
        && Number(config.runway??0)===0;
      if(looksLikeOldBase&&PRESETS[config.family]){
        all['filter-chip-rail']={...PRESETS[config.family]};
        writeAll(all);
      }
      localStorage.setItem(MIGRATION,'done');
    }catch{}
  }

  function applyPreset(value){
    const all=readAll();
    if(value==='original')delete all['filter-chip-rail'];
    else if(PRESETS[value])all['filter-chip-rail']={...PRESETS[value]};
    else return;
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

  function annotate(){
    const active=activeId();
    const hint=document.querySelector('#kitHint');
    const workspace=document.querySelector('.builder-kit-workspace');
    if(workspace){
      if(workspace.dataset.activeUi!==active)workspace.dataset.activeUi=active;
      if(active==='filter-chip-rail'&&workspace.style.getPropertyValue('--kit-preview-height')!=='520px')workspace.style.setProperty('--kit-preview-height','520px');
    }
    if(!hint)return;
    const next=active==='top-chapter-navigation'
      ?'메뉴 고정·진행·배치만 관리합니다. 칩 디자인은 범용 필터칩에서 플랫폼 공통으로 관리합니다.'
      :active==='filter-chip-rail'
        ?'하단 팝업 실제 원본과 선택·긴 라벨·좁은 폭 상태를 같은 공통 런타임으로 비교합니다. 표현 변경은 상단 메뉴 등 공통 칩에도 함께 적용됩니다.'
        :'공개 페이지와 같은 UI 런타임을 사용합니다.';
    if(hint.textContent!==next)hint.textContent=next;
  }

  migrateBrokenFamilyOnlyState();

  frame.addEventListener('load',()=>[60,220,620].forEach(delay=>setTimeout(sync,delay)));
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type==='platform-preview-ready'||event.data?.type==='platform-specimen-ready')setTimeout(()=>{sync();updateModeButtons();},40);
  });

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const modeButton=target.closest('[data-kit-mode]');
    if(modeButton&&activeId()==='filter-chip-rail'){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
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