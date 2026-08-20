(function(){
  const manifest=window.__PLATFORM_UI_CAPABILITY_MANIFEST;
  const workspace=document.querySelector('#uiWorkspace');
  if(!manifest||!workspace)return;

  const MODE_KEY='platformUiDashboardPreviewModeV1';
  const WIDTH_KEY='platformUiDashboardParityWidthV1';
  const PHOTO_ROUTE='/photography/?ui-dashboard-parity=1';
  const PHOTO_IDS=new Set([
    'top-chapter-navigation','horizontal-card-rail','filter-chip-rail',
    'collection-bottom-sheet','device-handoff-accordion','reading-progress','floating-action'
  ]);
  let scheduled=false;
  let frameToken=0;

  function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function currentId(){return document.querySelector('[data-capability-id][aria-pressed="true"]')?.dataset.capabilityId||'';}
  function currentCapability(){return (manifest.capabilities||[]).find(item=>item.id===currentId())||null;}
  function modes(){return readJson(MODE_KEY,{});}
  function getMode(id){return modes()[id]||'production';}
  function setMode(id,value){const next=modes();next[id]=value;writeJson(MODE_KEY,next);}
  function getWidth(){const value=String(readJson(WIDTH_KEY,'current'));return ['current','390','1180'].includes(value)?value:'current';}
  function setWidth(value){writeJson(WIDTH_KEY,value);}
  function esc(value=''){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}

  function hasPhotographySource(capability){
    if(!capability||!PHOTO_IDS.has(capability.id))return false;
    if(capability.source==='photography-extracted')return true;
    return (capability.presets||[]).some(item=>item.source==='photography-extracted');
  }

  function switchMarkup(id,mode){
    return `<section class="ui-parity-switch" data-ui-parity-switch data-mode="${esc(mode)}" data-capability="${esc(id)}">
      <div class="ui-parity-switch__copy">
        <small>비교 기준</small>
        <strong>${mode==='production'?'사진 페이지 원본':'범용 실험'}</strong>
        <p>${mode==='production'?'실제 사진 페이지의 DOM, CSS, JavaScript를 그대로 불러옵니다. 원본과 다르면 버그입니다.':'공통 UI로 확장하기 위한 실험 화면입니다. 아래 설정을 바꾸면 즉시 반영됩니다.'}</p>
      </div>
      <div class="ui-parity-switch__actions" role="group" aria-label="미리보기 기준 선택">
        <button type="button" data-ui-parity-mode="production" aria-pressed="${mode==='production'?'true':'false'}">사진 페이지 원본</button>
        <button type="button" data-ui-parity-mode="experiment" aria-pressed="${mode==='experiment'?'true':'false'}">범용 실험</button>
        <a href="/photography/" target="_blank" rel="noopener">원본 페이지에서 보기</a>
      </div>
    </section>`;
  }

  function productionMarkup(id){
    const width=getWidth();
    return `<section class="ui-production-parity" data-ui-production-parity data-capability="${esc(id)}" data-frame-width="${esc(width)}">
      <header class="ui-production-parity__head">
        <div><small>실제 production</small><strong>사진 페이지 원본</strong><p>이 영역 안에서 스크롤, 클릭, 드래그, 팝업 열기 같은 동작을 직접 확인할 수 있습니다.</p></div>
        <div class="ui-production-parity__width" role="group" aria-label="원본 페이지 확인 폭">
          <button type="button" data-ui-parity-width="current" aria-pressed="${width==='current'?'true':'false'}">현재 폭</button>
          <button type="button" data-ui-parity-width="390" aria-pressed="${width==='390'?'true':'false'}">모바일 390</button>
          <button type="button" data-ui-parity-width="1180" aria-pressed="${width==='1180'?'true':'false'}">PC 1180</button>
        </div>
      </header>
      <div class="ui-production-parity__viewport" data-ui-parity-viewport>
        <iframe title="사진 페이지 원본 UI" data-ui-parity-frame src="${PHOTO_ROUTE}&capability=${encodeURIComponent(id)}"></iframe>
      </div>
      <div class="ui-production-parity__status" data-ui-parity-status role="status">사진 페이지 원본을 불러오는 중입니다.</div>
    </section>`;
  }

  function setStatus(host,text,kind='idle'){
    const node=host?.querySelector('[data-ui-parity-status]');
    if(!node)return;
    node.textContent=text;
    node.dataset.status=kind;
  }

  function click(node){try{node?.click();return Boolean(node);}catch{return false;}}
  function scrollToNode(node,win){
    if(!node)return false;
    try{node.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});return true;}catch{
      try{win.scrollTo(0,Math.max(0,node.getBoundingClientRect().top+win.scrollY-120));return true;}catch{return false;}
    }
  }

  function prepareCollection(doc,tab){
    const fab=doc.querySelector('#collectionFab');
    if(!fab)return false;
    if(doc.querySelector('#collectionSheet')?.hidden!==false)click(fab);
    if(tab){
      const button=doc.querySelector(`.collection-tab[data-library-tab="${tab}"]`);
      if(button)click(button);
    }
    return true;
  }

  function focusProductionFrame(frame,id,host,token,attempt=0){
    if(token!==frameToken||!frame?.isConnected)return;
    let doc,win;
    try{doc=frame.contentDocument;win=frame.contentWindow;}catch{setStatus(host,'원본 페이지에 접근하지 못했습니다. 새 창에서 확인해 주세요.','error');return;}
    if(!doc||!win){retry();return;}

    let ready=false;
    let message='사진 페이지 원본을 그대로 불러왔습니다.';
    try{
      switch(id){
        case 'top-chapter-navigation':{
          const node=doc.querySelector('.nav-shell');
          if(node){win.scrollTo({top:0,left:0,behavior:'auto'});ready=true;message='사진 페이지의 실제 상단 메뉴입니다. iframe 안을 스크롤하거나 메뉴칩을 눌러보세요.';}
          break;
        }
        case 'horizontal-card-rail':{
          const node=doc.querySelector('.desktop-rail-window')||doc.querySelector('.scroll-row')||doc.querySelector('.skills-infinite-row');
          ready=scrollToNode(node,win);
          if(ready)message='사진 페이지의 실제 가로 카드 rail입니다. 이 안에서 직접 밀거나 끌어보세요.';
          break;
        }
        case 'collection-bottom-sheet':{
          if(prepareCollection(doc,'all')){
            const sheet=doc.querySelector('#collectionSheet');
            ready=Boolean(sheet&&!sheet.hidden);
            if(ready)message='사진 페이지의 실제 내 모음 하단 팝업입니다. 탭과 검색, 닫기 동작을 직접 확인하세요.';
          }
          break;
        }
        case 'filter-chip-rail':{
          if(prepareCollection(doc,'video')){
            const filters=doc.querySelector('#collectionFilters');
            const sheet=doc.querySelector('#collectionSheet');
            ready=Boolean(sheet&&!sheet.hidden);
            if(filters&&!filters.hidden&&filters.children.length){
              message='사진 페이지의 실제 필터칩입니다. 칩을 직접 눌러보세요.';
            }else if(ready){
              message='실제 내 모음을 열었습니다. 현재 저장 항목에 분류값이 없으면 원본 필터칩은 표시되지 않습니다.';
            }
          }
          break;
        }
        case 'device-handoff-accordion':{
          if(prepareCollection(doc,'settings')){
            const link=doc.querySelector('#collectionDeviceLink');
            if(link){
              if(link.getAttribute('aria-expanded')!=='true')click(link);
              const accordion=doc.querySelector('.collection-device-accordion')||link;
              ready=Boolean(accordion);
              if(ready)message='사진 페이지의 실제 다른 기기 연결 아코디언입니다. 복사와 열기/닫기도 production 코드가 처리합니다.';
            }
          }
          break;
        }
        case 'reading-progress':{
          const max=Math.max(0,(doc.scrollingElement?.scrollHeight||doc.documentElement.scrollHeight)-win.innerHeight);
          if(max>0)win.scrollTo({top:Math.round(max*.28),left:0,behavior:'auto'});
          ready=Boolean(doc.querySelector('.nav-chapter-progress')||doc.querySelector('.read-progress'));
          if(ready)message='사진 페이지의 실제 진행 표시입니다. iframe 안에서 위아래로 스크롤해보세요.';
          break;
        }
        case 'floating-action':{
          const fab=doc.querySelector('#collectionFab');
          ready=Boolean(fab);
          if(ready){
            const max=Math.max(0,(doc.scrollingElement?.scrollHeight||doc.documentElement.scrollHeight)-win.innerHeight);
            win.scrollTo({top:Math.round(max*.22),left:0,behavior:'auto'});
            message='사진 페이지의 실제 플로팅 내 모음 버튼입니다. 직접 눌러 팝업을 열어보세요.';
          }
          break;
        }
        default:ready=true;
      }
    }catch{}

    if(ready){setStatus(host,message,'ok');return;}
    retry();

    function retry(){
      if(attempt>=12){setStatus(host,'원본 UI를 자동으로 찾지 못했습니다. iframe 안을 직접 스크롤하거나 원본 페이지에서 확인해 주세요.','warn');return;}
      setTimeout(()=>focusProductionFrame(frame,id,host,token,attempt+1),attempt<4?250:500);
    }
  }

  function replaceProduction(host,id){
    const parent=host?.parentElement;
    if(!parent)return;
    host.outerHTML=productionMarkup(id);
    const next=parent.querySelector(`[data-ui-production-parity][data-capability="${CSS.escape(id)}"]`);
    if(next)bindProduction(next,id);
  }

  function bindProduction(host,id){
    if(!host||host.dataset.bound==='true')return;
    host.dataset.bound='true';
    const frame=host.querySelector('[data-ui-parity-frame]');
    if(!frame)return;
    const token=++frameToken;
    frame.addEventListener('load',()=>{
      setStatus(host,'사진 페이지 원본을 불러왔습니다. 해당 UI를 찾는 중입니다.');
      setTimeout(()=>focusProductionFrame(frame,id,host,token,0),120);
    },{once:true});
    host.querySelectorAll('[data-ui-parity-width]').forEach(button=>button.addEventListener('click',()=>{
      setWidth(button.dataset.uiParityWidth||'current');
      replaceProduction(host,id);
    }));
  }

  function bindSwitch(card,capability){
    card.querySelectorAll('[data-ui-parity-mode]').forEach(button=>{
      if(button.dataset.bound==='true')return;
      button.dataset.bound='true';
      button.addEventListener('click',()=>{
        const next=button.dataset.uiParityMode==='experiment'?'experiment':'production';
        setMode(capability.id,next);
        schedule(true);
      });
    });
  }

  function applyMode(card,capability,mode){
    const stage=card.querySelector('.ui-preview-stage');
    const controls=card.querySelector('.ui-controls');
    let switcher=card.querySelector('[data-ui-parity-switch]');
    let production=card.querySelector('[data-ui-production-parity]');

    if(!switcher||switcher.dataset.mode!==mode||switcher.dataset.capability!==capability.id){
      if(switcher)switcher.outerHTML=switchMarkup(capability.id,mode);
      else card.querySelector('.ui-card__head')?.insertAdjacentHTML('afterend',switchMarkup(capability.id,mode));
      switcher=card.querySelector('[data-ui-parity-switch]');
    }
    bindSwitch(card,capability);

    if(mode==='production'){
      if(stage)stage.hidden=true;
      if(controls){controls.classList.add('is-reference-locked');controls.setAttribute('aria-disabled','true');}
      if(!production||production.dataset.capability!==capability.id){
        if(production)production.remove();
        const anchor=card.querySelector('.ui-preview-stage')||card.querySelector('.ui-controls');
        anchor?.insertAdjacentHTML('beforebegin',productionMarkup(capability.id));
        production=card.querySelector('[data-ui-production-parity]');
      }
      if(production){production.hidden=false;bindProduction(production,capability.id);}
    }else{
      if(stage)stage.hidden=false;
      if(controls){controls.classList.remove('is-reference-locked');controls.removeAttribute('aria-disabled');}
      if(production)production.hidden=true;
    }
  }

  function enhance(){
    scheduled=false;
    const capability=currentCapability();
    const card=workspace.querySelector('.ui-card');
    if(!capability||!card||!hasPhotographySource(capability))return;
    applyMode(card,capability,getMode(capability.id));
  }

  function schedule(force=false){
    if(force)scheduled=false;
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(enhance);
  }

  const observer=new MutationObserver(()=>schedule());
  observer.observe(workspace,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-capability-id]'))setTimeout(()=>schedule(true),0);},true);
  schedule(true);
})();
