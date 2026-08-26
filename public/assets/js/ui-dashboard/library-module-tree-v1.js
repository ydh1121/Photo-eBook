/* v1: scalable Registry-driven module tree integrated with the admin sidebar. */
(function(){
  if(window.__platformLibraryModuleTreeV1)return;
  window.__platformLibraryModuleTreeV1=true;

  const registry=window.PlatformModuleRegistry;
  const taxonomy=window.__PLATFORM_MODULE_LIBRARY_TAXONOMY_V1;
  if(!registry||!taxonomy?.groups)return;

  const STATE_KEY='platformLibrarySidebarV1';
  const DESKTOP=matchMedia('(min-width:821px)');
  const html=document.documentElement;
  const $=(selector,root=document)=>root.querySelector(selector);

  function readState(){try{const value=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function saveState(value){try{localStorage.setItem(STATE_KEY,JSON.stringify(value));}catch{}}

  function mount(){
    const admin=$('.platform-admin-shell');
    const nav=admin?.querySelector('.platform-admin-shell__nav');
    const libraryLink=nav?.querySelector('a[href="/ui-dashboard/"]');
    const selector=$('.builder-kit-selector');
    const filters=$('#builderLibraryFilters');
    const tools=$('#builderLibraryTools');
    if(!admin||!nav||!libraryLink||!selector||!filters||!tools)return false;
    if(admin.querySelector('.platform-admin-shell__module-tree'))return true;

    html.dataset.libraryModuleTree='true';
    const state={width:Math.max(224,Math.min(360,Number(readState().width)||264)),collapsed:Boolean(readState().collapsed)};
    const groupForId=new Map();
    taxonomy.groups.forEach(group=>(group.modules||[]).forEach(id=>groupForId.set(id,group.id)));

    const tree=document.createElement('div');
    tree.className='platform-admin-shell__module-tree';
    tree.setAttribute('aria-label','UI 라이브러리 모듈 트리');
    const head=document.createElement('div');
    head.className='platform-admin-shell__module-tree-head';
    head.innerHTML='<span><strong>모듈</strong><small>승인된 공통 모듈</small></span><button type="button" data-library-tree-collapse aria-label="좌측 메뉴 숨기기">‹</button>';
    tree.appendChild(head);
    const body=document.createElement('div');
    body.className='platform-admin-shell__module-tree-body';
    tree.appendChild(body);

    taxonomy.groups.forEach(group=>{
      const details=document.createElement('details');
      details.className='platform-module-tree-group';
      details.dataset.moduleTreeGroup=group.id;
      details.open=true;
      details.innerHTML=`<summary><span>${String(group.label||group.id)}</span><b aria-hidden="true">⌄</b></summary><div class="platform-module-tree-group__items"></div>`;
      body.appendChild(details);
    });
    const other=document.createElement('details');
    other.className='platform-module-tree-group';other.dataset.moduleTreeGroup='other';other.open=true;
    other.innerHTML='<summary><span>기타</span><b aria-hidden="true">⌄</b></summary><div class="platform-module-tree-group__items"></div>';
    body.appendChild(other);

    function destination(id){const group=groupForId.get(id)||'other';return body.querySelector(`[data-module-tree-group="${CSS.escape(group)}"] .platform-module-tree-group__items`);}
    function moveButton(button){
      const id=button?.dataset?.kitUi;if(!id)return;
      const target=destination(id);if(!target)return;
      const existing=body.querySelector(`[data-kit-ui="${CSS.escape(id)}"]`);
      if(existing&&existing!==button)existing.remove();
      button.classList.add('platform-module-tree-item');
      button.removeAttribute('style');
      target.appendChild(button);
    }
    function reconcileSelector(){
      [...selector.querySelectorAll('[data-kit-ui]')].forEach(moveButton);
      body.querySelector('[data-module-tree-group="other"]')?.toggleAttribute('hidden',!body.querySelector('[data-module-tree-group="other"] [data-kit-ui]'));
      syncActive();
    }

    libraryLink.insertAdjacentElement('afterend',tree);
    reconcileSelector();
    filters.hidden=true;
    filters.dataset.moduleCatalogMoved='true';

    /* The canonical Library owner re-renders its selector on every module
       selection. Observe that source rail and move each newly created real
       Registry button into the tree, replacing the previous node rather than
       cloning component/catalog state. */
    const selectorObserver=new MutationObserver(()=>queueMicrotask(reconcileSelector));
    selectorObserver.observe(selector,{childList:true});

    const resize=document.createElement('div');
    resize.className='platform-admin-shell__resize-handle';
    resize.setAttribute('role','separator');
    resize.setAttribute('aria-orientation','vertical');
    resize.setAttribute('aria-label','좌측 메뉴 너비 조절');
    admin.appendChild(resize);

    const reopen=document.createElement('button');
    reopen.type='button';reopen.className='platform-admin-shell__reopen';reopen.dataset.libraryTreeReopen='true';reopen.setAttribute('aria-label','좌측 메뉴 열기');reopen.textContent='›';document.body.appendChild(reopen);
    const mobileToggle=document.createElement('button');
    mobileToggle.type='button';mobileToggle.className='builder-library-tree-mobile-toggle';mobileToggle.textContent='모듈';mobileToggle.setAttribute('aria-expanded','false');tools.prepend(mobileToggle);

    function persist(){saveState({width:state.width,collapsed:state.collapsed});}
    function apply(){
      const desktop=DESKTOP.matches;
      html.style.setProperty('--library-admin-sidebar-w',`${state.width}px`);
      if(desktop){
        html.dataset.adminSidebarCollapsed=String(state.collapsed);
        html.style.setProperty('--admin-sidebar-w',state.collapsed?'0px':`${state.width}px`);
        delete html.dataset.libraryTreeDrawer;mobileToggle.setAttribute('aria-expanded','false');
      }else{delete html.dataset.adminSidebarCollapsed;html.style.removeProperty('--admin-sidebar-w');}
    }
    function collapse(next=true){state.collapsed=Boolean(next);apply();persist();}
    head.querySelector('[data-library-tree-collapse]')?.addEventListener('click',()=>collapse(true));
    reopen.addEventListener('click',()=>collapse(false));
    mobileToggle.addEventListener('click',()=>{const open=html.dataset.libraryTreeDrawer==='open';html.dataset.libraryTreeDrawer=open?'closed':'open';mobileToggle.setAttribute('aria-expanded',String(!open));});

    let drag=null;
    resize.addEventListener('pointerdown',event=>{
      if(!DESKTOP.matches||event.button!==0)return;
      drag={pointerId:event.pointerId,startX:event.clientX,startWidth:state.collapsed?0:state.width};
      resize.setPointerCapture?.(event.pointerId);html.dataset.adminSidebarDragging='true';event.preventDefault();
    });
    resize.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      const next=Math.max(0,Math.min(380,drag.startWidth+(event.clientX-drag.startX)));
      if(next<84){state.collapsed=true;html.style.setProperty('--admin-sidebar-w','0px');}
      else{state.collapsed=false;state.width=Math.max(224,next);html.style.setProperty('--admin-sidebar-w',`${state.width}px`);html.style.setProperty('--library-admin-sidebar-w',`${state.width}px`);}
      event.preventDefault();
    });
    const finishDrag=event=>{if(!drag||event.pointerId!==drag.pointerId)return;try{resize.releasePointerCapture?.(event.pointerId);}catch{}drag=null;delete html.dataset.adminSidebarDragging;apply();persist();};
    resize.addEventListener('pointerup',finishDrag);resize.addEventListener('pointercancel',finishDrag);

    function syncActive(){
      body.querySelectorAll('.platform-module-tree-group').forEach(group=>{const active=Boolean(group.querySelector('[data-kit-ui][aria-pressed="true"]'));group.dataset.active=String(active);if(active)group.open=true;});
    }
    const activeObserver=new MutationObserver(syncActive);
    activeObserver.observe(body,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
    body.addEventListener('click',event=>{if(event.target.closest('[data-kit-ui]')&&!DESKTOP.matches){html.dataset.libraryTreeDrawer='closed';mobileToggle.setAttribute('aria-expanded','false');}});
    DESKTOP.addEventListener?.('change',apply);
    syncActive();apply();
    return true;
  }

  if(!mount()){
    const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
})();
