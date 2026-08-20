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

  function installFramePolish(){
    const doc=frame?.contentDocument;if(!doc)return;
    let style=doc.querySelector('#platform-builder-admin-polish');
    if(!style){style=doc.createElement('style');style.id='platform-builder-admin-polish';doc.head.appendChild(style);}
    style.textContent=`
      html{scrollbar-gutter:stable}body{min-width:0!important}
      #platformBuilderLibraryFloor{width:min(100%,1320px)!important;gap:0!important;padding:30px clamp(18px,3vw,42px) 80px!important}
      #platformBuilderLibraryFloor>[data-library-capability]{width:100%!important;margin:0!important;padding:38px 0 48px!important;border-bottom:1px solid rgba(26,34,48,.07)!important}
      #platformBuilderLibraryFloor>[data-library-capability]:last-child{border-bottom:0!important}
      #platformBuilderLibraryFloor .scroll-row{max-width:100%!important}
      #platformBuilderLibraryFloor .desktop-rail-window{max-width:100%!important}
      #platformBuilderLibraryFloor .collection-sheet{margin-inline:auto!important}
      @media(max-width:760px){#platformBuilderLibraryFloor{padding:20px 12px 60px!important}#platformBuilderLibraryFloor>[data-library-capability]{padding:28px 0 38px!important}}
    `;
  }

  function observeFrame(){
    frameObserver?.disconnect();
    const doc=frame?.contentDocument;if(!doc)return;
    frameObserver=new MutationObserver(()=>{normalizeFrameCopy();installFramePolish();});
    frameObserver.observe(doc.documentElement,{subtree:true,childList:true,characterData:true});
    normalizeFrameCopy();installFramePolish();
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
    [80,500,1400].forEach(delay=>setTimeout(()=>{normalizeFrameCopy();installFramePolish();},delay));
  });
  normalizeEditLabel();
})();