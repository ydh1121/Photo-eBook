(function(){
  const frame=document.querySelector('#builderFrame');
  const status=document.querySelector('#builderFrameStatus');
  const edit=document.querySelector('#builderEditToggle');
  let frameObserver=null;

  function normalizeEditLabel(){
    if(!edit)return;
    edit.textContent=edit.getAttribute('aria-pressed')==='true'?'편집 중':'미리보기';
  }

  function normalizeFrameCopy(){
    const doc=frame?.contentDocument;if(!doc)return;
    doc.querySelectorAll('.platform-builder-ad span').forEach(node=>{
      if(/실제 페이지 흐름/.test(node.textContent||''))node.textContent='더미 페이지 흐름에서 위치와 크기를 검토합니다.';
    });
  }

  function observeFrame(){
    frameObserver?.disconnect();
    const doc=frame?.contentDocument;if(!doc)return;
    frameObserver=new MutationObserver(normalizeFrameCopy);
    frameObserver.observe(doc.documentElement,{subtree:true,childList:true,characterData:true});
    normalizeFrameCopy();
  }

  function closeActionMenus(except=null){
    document.querySelectorAll('.builder-action-menu[open]').forEach(menu=>{if(menu!==except)menu.open=false;});
  }

  document.querySelectorAll('.builder-action-menu').forEach(menu=>{
    const summary=menu.querySelector(':scope > summary');
    summary?.addEventListener('click',()=>queueMicrotask(()=>{if(menu.open)closeActionMenus(menu);}));
    menu.addEventListener('click',event=>{if(event.target.closest('.builder-action-menu__panel button'))queueMicrotask(()=>{menu.open=false;});});
  });

  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeActionMenus();});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.builder-action-menu'))closeActionMenus();});
  edit?.addEventListener('click',()=>queueMicrotask(normalizeEditLabel));
  frame?.addEventListener('load',()=>{
    if(status&&!status.hidden)status.textContent='더미 UI를 찾는 중';
    observeFrame();
    [80,500,1400].forEach(delay=>setTimeout(normalizeFrameCopy,delay));
  });
  normalizeEditLabel();
})();