/* v4: desktop rail polish + safe cross-device handoff inside the collection sheet. */
(function(){
  if(window.__photoDesktopRailPolishV1Installed)return;
  window.__photoDesktopRailPolishV1Installed=true;

  const desktop=window.matchMedia('(min-width:1024px)');
  const RAIL_SELECTOR='.scroll-row,#curatedLinksRow,#skillsInfiniteRow';

  function bindRail(rail){
    if(!rail||rail.dataset.desktopRailPolishV1==='true')return;
    rail.dataset.desktopRailPolishV1='true';

    rail.addEventListener('dragstart',event=>{
      if(!desktop.matches)return;
      event.preventDefault();
    },true);

    rail.addEventListener('pointerdown',event=>{
      if(!desktop.matches||event.pointerType!=='mouse'||event.button!==0)return;
      if(event.target.closest?.('input,textarea,select,option,[contenteditable="true"]'))return;
      rail.classList.add('is-desktop-pointerdown');
    },true);

    const clearPointerState=()=>rail.classList.remove('is-desktop-pointerdown');
    rail.addEventListener('pointerup',clearPointerState,true);
    rail.addEventListener('pointercancel',clearPointerState,true);
    rail.addEventListener('lostpointercapture',clearPointerState,true);
    rail.addEventListener('mouseleave',()=>{
      if(!rail.classList.contains('is-desktop-dragging'))clearPointerState();
    },true);
  }

  function repairNavIndicator(){
    if(!desktop.matches)return;
    const nav=document.querySelector('.nav-scroll');
    const active=nav?.querySelector('.nav-chip.is-active');
    const indicator=nav?.querySelector('.nav-v33-indicator');
    if(!nav||!active||!indicator)return;

    let skin=indicator.querySelector(':scope > .v37-liquid-skin');
    if(!skin){
      skin=document.createElement('span');
      skin.className='v37-liquid-skin';
      skin.setAttribute('aria-hidden','true');
      indicator.appendChild(skin);
    }

    const w=active.offsetWidth;
    const h=active.offsetHeight;
    if(!w||!h)return;
    indicator.style.width=w+'px';
    indicator.style.height=h+'px';
    indicator.style.transform=`translate3d(${active.offsetLeft}px,${active.offsetTop}px,0)`;
    indicator.dataset.x=String(active.offsetLeft);
    indicator.dataset.y=String(active.offsetTop);
    indicator.dataset.w=String(w);
    indicator.dataset.h=String(h);
    indicator.dataset.ready='true';
    nav.classList.add('v41-skin-ready','v33-liquid-ready');
  }

  function refresh(){
    if(desktop.matches){
      document.querySelectorAll(RAIL_SELECTOR).forEach(bindRail);
      repairNavIndicator();
    }
  }

  function collectionSheetIsOpen(sheet){
    if(!sheet||sheet.hidden)return false;
    const style=getComputedStyle(sheet);
    return style.display!=='none'&&style.visibility!=='hidden';
  }

  function deviceParking(){
    let parking=document.getElementById('deviceSyncParking');
    if(!parking){
      parking=document.createElement('div');
      parking.id='deviceSyncParking';
      parking.hidden=true;
      document.body.appendChild(parking);
    }
    return parking;
  }

  function parkDeviceCard(){
    const card=document.querySelector('.collection-settings .login-card.v32-inline-sync');
    if(card)deviceParking().appendChild(card);
  }

  function releaseLegacyAskLock(){
    const askSheet=document.getElementById('askSheet');
    const askBackdrop=document.getElementById('askBackdrop');
    if(askSheet)askSheet.hidden=true;
    if(askBackdrop){
      askBackdrop.hidden=true;
      askBackdrop.style.pointerEvents='none';
    }
    document.documentElement.classList.remove('ask-modal-locked');
    document.body.classList.remove('ask-modal-locked','is-modal-open');
  }

  function mountDeviceSettingsInline(){
    const settings=document.querySelector('#collectionBody .collection-settings');
    if(!settings)return false;

    releaseLegacyAskLock();

    const trigger=settings.querySelector('#collectionDeviceLink');
    if(trigger)trigger.hidden=true;

    const card=document.querySelector('#deviceSyncParking .login-card') ||
      document.querySelector('#askHistoryPanel .login-card') ||
      document.querySelector('.login-card');
    if(!card)return false;

    card.classList.add('v32-inline-sync');
    const title=card.querySelector('h4');
    const copy=card.querySelector('#copySyncKey');
    const change=card.querySelector('#changeSyncKey');
    const text=card.querySelector('p');
    if(title)title.textContent='기기 간 질문 이어보기';
    if(copy)copy.textContent='연결 코드 복사';
    if(change)change.textContent='연결 코드 입력';
    if(text)text.textContent='다른 기기에서도 저장한 질문을 이어서 보려면 연결 코드를 사용하세요.';

    settings.appendChild(card);
    const state=card.querySelector('#syncState');
    if(state&&/Google Sheet와 동기화 중|동기화 중/.test(state.textContent||'')){
      state.textContent='질문 기록을 확인하고 있습니다.';
    }
    return true;
  }

  /* The legacy settings row used to close the collection sheet, open the old
     question modal and then open its settings panel. Two modal locks could be
     left active, making the page inert on both desktop and mobile. Keep the
     handoff UI inside the already-open collection sheet instead. */
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;

    const deviceLink=target.closest('#collectionDeviceLink');
    if(deviceLink){
      event.preventDefault();
      event.stopImmediatePropagation();
      mountDeviceSettingsInline();
      return;
    }

    /* Before collection rerenders destroy the inline card, park the original
       node so its existing sync event handlers/state stay alive. */
    if(target.closest('.collection-tab,#collectionClose,#collectionBackdrop')){
      parkDeviceCard();
    }
  },true);

  document.addEventListener('click',event=>{
    if(!desktop.matches)return;

    if(event.target.closest?.('.nav-chip')){
      setTimeout(repairNavIndicator,430);
    }

    const sheet=document.getElementById('collectionSheet');
    if(!collectionSheetIsOpen(sheet))return;
    const target=event.target;
    if(!(target instanceof Element))return;
    if(target.closest('#collectionSheet,#collectionFab'))return;

    const backdrop=document.getElementById('collectionBackdrop');
    if(backdrop){
      backdrop.click();
      return;
    }
    const close=sheet.querySelector('[data-collection-close],.collection-close,[aria-label="닫기"]');
    close?.click();
  },true);

  function init(){
    refresh();
    /* Recover sessions left in the broken dual-modal state after reload. */
    const collection=document.getElementById('collectionSheet');
    const ask=document.getElementById('askSheet');
    if(collectionSheetIsOpen(collection)&&ask&&!ask.hidden)releaseLegacyAskLock();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  [80,220,520,1200,2200].forEach(delay=>setTimeout(refresh,delay));
  window.addEventListener('pageshow',()=>setTimeout(init,120),{passive:true});
  window.addEventListener('resize',()=>setTimeout(repairNavIndicator,80),{passive:true});
  desktop.addEventListener?.('change',()=>setTimeout(refresh,0));
})();
