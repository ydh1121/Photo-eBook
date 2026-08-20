(function(){
  const frame=document.querySelector('#builderFrame');
  const status=document.querySelector('#builderFrameStatus');
  const edit=document.querySelector('#builderEditToggle');
  if(!frame)return;

  const STORAGE='platformBuilderCapabilityConfigsV2';
  function readOverrides(){try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function clear(node,...names){names.forEach(name=>node?.style?.removeProperty(name));}

  function normalizeEditLabel(){
    if(!edit)return;
    edit.textContent=edit.getAttribute('aria-pressed')==='true'?'편집 중':'미리보기';
  }
  function normalizeFrameCopy(doc){
    doc?.querySelectorAll('.platform-builder-ad span').forEach(node=>{
      if(/실제 페이지 흐름/.test(node.textContent||''))node.textContent='더미 페이지 흐름에서 위치와 크기를 검토합니다.';
    });
  }
  function repairRuntimeRule(doc){
    const runtime=doc?.querySelector('#platform-builder-runtime-style');
    if(!runtime)return;
    let text=runtime.textContent||'';
    text=text.replace(/\[data-builder-capability\]\{position:relative!important\}/g,'.platform-builder-anchor{position:relative!important}');
    if(runtime.textContent!==text)runtime.textContent=text;
  }
  function repairCapabilityAnchors(doc){
    doc?.querySelectorAll('[data-builder-capability]').forEach(node=>{
      node.classList.remove('platform-builder-anchor');
      const position=frame.contentWindow?.getComputedStyle(node)?.position||'static';
      if(position==='static'&&!node.matches('.nav-shell,.collection-fab,.collection-sheet,.collection-backdrop'))node.classList.add('platform-builder-anchor');
    });
  }
  function repairNav(doc){
    const shell=doc?.querySelector('.nav-shell');
    const placeholder=doc?.querySelector('.nav-placeholder');
    const nav=doc?.querySelector('.nav-scroll');
    if(!shell||!nav)return;

    [shell,placeholder].filter(Boolean).forEach(node=>{
      node.classList.remove('platform-builder-block','is-builder-drop-target','is-builder-dragging');
      node.removeAttribute('draggable');
      node.querySelector(':scope > .platform-builder-block-handle')?.remove();
    });

    const overrides=readOverrides()['top-chapter-navigation']||{};
    const ios=doc.documentElement.classList.contains('ios-webkit-chrome');
    if(!Object.prototype.hasOwnProperty.call(overrides,'stickyMode')&&!ios){
      shell.style.setProperty('position','sticky','important');
      shell.style.setProperty('top','0','important');
      shell.style.removeProperty('transform');
    }

    if(!Object.keys(overrides).length){
      delete nav.dataset.builderFamily;
      clear(nav,'gap','padding-left','padding-right','padding-top','padding-bottom','--builder-nav-accent','--builder-motion-duration');
      clear(doc.querySelector('.nav-v33-indicator',nav),'transition-duration');
      const progress=doc.querySelector('.nav-chapter-progress',nav);
      if(progress){progress.hidden=false;clear(progress,'background','opacity','height','top','bottom','border-radius','display','visibility');}
    }

    const legacy=doc.querySelector('.read-progress');
    if(legacy){legacy.hidden=true;legacy.removeAttribute('data-builder-capability');legacy.querySelector(':scope > .platform-builder-gear')?.remove();clear(legacy,'height','background','opacity','display','visibility');}
    const chapterProgress=doc.querySelector('.nav-chapter-progress');
    chapterProgress?.querySelector(':scope > .platform-builder-gear')?.remove();
  }
  function repairFilters(doc){
    const overrides=readOverrides()['filter-chip-rail']||{};
    if(Object.keys(overrides).length)return;
    doc?.querySelectorAll('.collection-filters').forEach(root=>{
      delete root.dataset.builderFamily;
      clear(root,'gap','padding-left','padding-right','padding-inline','--builder-filter-accent','--builder-filter-opacity','--builder-filter-blur');
      root.querySelectorAll('.collection-filter').forEach(chip=>clear(chip,'background','color','border-color','border-radius','box-shadow','backdrop-filter','-webkit-backdrop-filter','transition-duration'));
    });
  }
  function repairFrame(){
    const doc=frame.contentDocument;if(!doc?.head)return;
    repairRuntimeRule(doc);
    repairCapabilityAnchors(doc);
    repairNav(doc);
    repairFilters(doc);
    normalizeFrameCopy(doc);
    const app=doc.querySelector('#app');if(app){app.hidden=false;app.style.removeProperty('display');}
    if(status)status.hidden=true;
  }

  function closeActionMenus(except=null){document.querySelectorAll('.builder-action-menu[open]').forEach(menu=>{if(menu!==except)menu.open=false;});}
  document.querySelectorAll('.builder-action-menu').forEach(menu=>{
    const summary=menu.querySelector(':scope > summary');
    summary?.addEventListener('click',()=>queueMicrotask(()=>{if(menu.open)closeActionMenus(menu);}));
    menu.addEventListener('click',event=>{if(event.target.closest('.builder-action-menu__panel button'))queueMicrotask(()=>{menu.open=false;});});
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeActionMenus();});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.builder-action-menu'))closeActionMenus();});
  edit?.addEventListener('click',()=>queueMicrotask(normalizeEditLabel));

  frame.addEventListener('load',()=>{
    if(status&&!status.hidden)status.textContent='더미 UI를 준비하는 중';
    [0,100,520,940,2100,3900].forEach(delay=>setTimeout(repairFrame,delay));
  });
  window.addEventListener('storage',event=>{if(event.key===STORAGE)setTimeout(repairFrame,0);});
  normalizeEditLabel();
})();
