(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformGlobalChipKitV3)return;
  window.__platformGlobalChipKitV3=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';
  const MIGRATION='platformGlobalChipCanonicalNavMigrationV3';
  const PRESETS=Object.freeze({
    'material-flat':Object.freeze({family:'material-flat',accentColor:'#437ce7',surfaceOpacity:100,blur:0,response:'standard',gap:9,runway:5.5}),
    'ios-flat':Object.freeze({family:'ios-flat',accentColor:'#437ce7',surfaceOpacity:88,blur:12,response:'standard',gap:9,runway:5.5}),
    'ios-liquid':Object.freeze({family:'ios-liquid',accentColor:'#437ce7',surfaceOpacity:100,blur:22,response:'standard',gap:9,runway:5.5})
  });
  const RETIRED_PRESETS=[
    {family:'material-flat',accentColor:'#315fc9',surfaceOpacity:100,blur:0,response:'calm',gap:8,runway:14},
    {family:'ios-flat',accentColor:'#202226',surfaceOpacity:100,blur:0,response:'calm',gap:7,runway:0},
    {family:'ios-liquid',accentColor:'#437ce7',surfaceOpacity:78,blur:18,response:'standard',gap:8,runway:14}
  ];

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
  function samePreset(a,b){
    if(!a||!b)return false;
    return Object.keys(b).every(key=>String(a[key])===String(b[key]))&&Object.keys(a).every(key=>Object.prototype.hasOwnProperty.call(b,key));
  }

  function migrateRetiredPreset(){
    try{
      if(localStorage.getItem(MIGRATION)==='done')return;
      const all=readAll();
      const config=all['filter-chip-rail'];
      const retired=RETIRED_PRESETS.find(item=>samePreset(config,item));
      if(retired&&PRESETS[retired.family]){
        all['filter-chip-rail']={...PRESETS[retired.family]};
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
      ?'메뉴 고정·진행·배치만 관리합니다. 칩 스타일은 범용 필터칩에서 이전 상단 메뉴의 canonical 표현을 공통으로 사용합니다.'
      :active==='filter-chip-rail'
        ?'원본은 하단 팝업 필터칩입니다. Material · iOS 플랫 · iOS 리퀴드는 이전 상단 메뉴에 구현됐던 표면과 선택 동작을 그대로 공통 적용합니다.'
        :'공개 페이지와 같은 UI 런타임을 사용합니다.';
    if(hint.textContent!==next)hint.textContent=next;
  }

  migrateRetiredPreset();

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
