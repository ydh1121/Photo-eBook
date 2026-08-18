/* Collection modal interaction shield v1.
   Prevents taps/clicks behind the open collection sheet from reaching page links
   and makes outside-tap dismissal identical on desktop and mobile. */
(function(){
  if(window.__photoCollectionModalShieldV1Installed)return;
  window.__photoCollectionModalShieldV1Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  let suppressUntil=0;
  let closeQueued=false;

  function sheetIsOpen(){
    const sheet=$('#collectionSheet');
    return Boolean(sheet&&!sheet.hidden&&sheet.classList.contains('is-open'));
  }

  function isInsideSheet(target){
    const sheet=$('#collectionSheet');
    return Boolean(sheet&&target instanceof Node&&sheet.contains(target));
  }

  function queueClose(){
    if(closeQueued)return;
    closeQueued=true;
    suppressUntil=performance.now()+420;
    const close=$('#collectionClose');
    if(close)close.click();
    setTimeout(()=>{closeQueued=false;},230);
  }

  function blockOutside(event){
    if(!sheetIsOpen()||isInsideSheet(event.target))return;
    if(event.cancelable)event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    queueClose();
  }

  /* Capture before the page link/card handlers. This also protects iOS Safari
     if a composited backdrop momentarily fails hit-testing during its blur. */
  document.addEventListener('pointerdown',blockOutside,true);
  document.addEventListener('touchstart',blockOutside,{capture:true,passive:false});
  document.addEventListener('mousedown',blockOutside,true);

  document.addEventListener('click',event=>{
    if(sheetIsOpen()&&!isInsideSheet(event.target)){
      if(event.cancelable)event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      queueClose();
      return;
    }
    /* Suppress the synthetic/delayed click that iOS can emit on the element
       revealed underneath immediately after the sheet starts closing. */
    if(performance.now()<suppressUntil&&!isInsideSheet(event.target)){
      if(event.cancelable)event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  },true);
})();
