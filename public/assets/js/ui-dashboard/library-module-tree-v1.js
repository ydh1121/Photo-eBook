/* v2: scalable Registry-driven module tree integrated with the shared admin shell. */
(function(){
  if(window.__platformLibraryModuleTreeV2)return;
  window.__platformLibraryModuleTreeV2=true;

  const registry=window.PlatformModuleRegistry;
  const taxonomy=window.__PLATFORM_MODULE_LIBRARY_TAXONOMY_V1;
  if(!registry||!taxonomy?.groups)return;

  const STATE_KEY='platformLibrarySidebarV1';
  const DESKTOP=matchMedia('(min-width:821px)');
  const html=document.documentElement;
  const $=(selector,root=document)=>root.querySelector(selector);
  const icons={
    navigation:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M6 12h12M8 18h8"/></svg>',
    'horizontal-content':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="7" height="14" rx="2"/><rect x="14" y="5" width="7" height="14" rx="2"/><path d="m12 12 2-2m-2 2 2 2"/></svg>',
    accordion:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/><path d="m16 4 2 2-2 2M16 10l2 2-2 2M16 16l2 2-2 2"/></svg>',
    'bottom-popup':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 13h16M9 17h6"/></svg>',
    action:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="8"/></svg>',
    display:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    other:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></svg>'
  };

  function readState(){try{const value=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function saveState(value){try{localStorage.setItem(STATE_KEY,JSON.stringify(value));}catch{}}

  function mount(){
    const admin=$('.platform-admin-shell');
    const nav=admin?.querySelector('.platform-admin-shell__nav');
    const libraryLink=nav?.querySelector('a[href="/ui-dashboard/"]');
    const selector=$('.builder-kit-selector');
    const filters=$('#builderLibraryFilters');
    const tools=$('#builderLibraryTools');
    const workspace=$('.builder-kit-workspace');
    const workspaceHead=workspace?.querySelector('.builder-kit-head');
    const primaryControls=$('.builder-kit-controls--primary');
    const settings=$('#kitSettings');
    if(!admin||!nav||!libraryLink||!selector||!filters||!tools||!workspace||!workspaceHead||!primaryControls||!settings)return false;
    if(admin.querySelector('.platform-admin-shell__module-tree'))return true;

    html.dataset.libraryModuleTree='true';
    const saved=readState();
    const state={
      width:Math.max(236,Math.min(360,Number(saved.width)||272)),
      collapsed:Boolean(saved.collapsed),
      groups:saved.groups&&typeof saved.groups==='object'?{...saved.groups}:{}
    };
    const groupForId=new Map();
    taxonomy.groups.forEach(group=>(group.modules||[]).forEach(id=>groupForId.set(id,group.id)));

    /* Keep preview controls attached to the actual Library owner. Only move the
       existing DOM nodes into a single convenient workspace toolbar. */
    const previewToolbar=document.createElement('div');
    previewToolbar.className='builder-kit-preview-toolbar';
    previewToolbar.setAttribute('aria-label','미리보기와 모듈 설정');
    primaryControls.dataset.previewControls='true';
    previewToolbar.append(primaryControls,settings);
    workspaceHead.appendChild(previewToolbar);
    tools.dataset.previewControlsMoved='true';

    const tree=document.createElement('section');
    tree.className='platform-admin-shell__module-tree';
    tree.setAttribute('aria-label','UI 라이브러리 모듈');
    const head=document.createElement('div');
    head.className='platform-admin-shell__module-tree-head';
    head.innerHTML='<div><span class="platform-admin-shell__module-tree-kicker">UI LIBRARY</span><strong>모듈</strong><small>승인된 공통 모듈</small></div><button type="button" data-library-tree-collapse aria-label="좌측 메뉴 숨기기" title="좌측 메뉴 숨기기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>';
    tree.appendChild(head);
    const body=document.createElement('div');
    body.className='platform-admin-shell__module-tree-body';
    tree.appendChild(body);

    function createGroup(group){
      const details=document.createElement('details');
      details.className='platform-module-tree-group';
      details.dataset.moduleTreeGroup=group.id;
      details.open=state.groups[group.id]!==false;
      details.innerHTML=`<summary><span class="platform-module-tree-group__title"><i>${icons[group.id]||icons.other}</i><span>${String(group.label||group.id)}</span></span><b class="platform-module-tree-group__chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg></b></summary><div class="platform-module-tree-group__items"></div>`;
      details.addEventListener('toggle',()=>{state.groups[group.id]=details.open;persist();});
      return details;
    }
    taxonomy.groups.forEach(group=>body.appendChild(createGroup(group)));
    const other=createGroup({id:'other',label:'기타'});body.appendChild(other);

    function destination(id){const group=groupForId.get(id)||'other';return body.querySelector(`[data-module-tree-group="${CSS.escape(group)}"] .platform-module-tree-group__items`);}
    function moveButton(button){
      const id=button?.dataset?.kitUi;if(!id)return;
      const target=destination(id);if(!target)return;
      const existing=body.querySelector(`[data-kit-ui="${CSS.escape(id)}"]`);
      if(existing&&existing!==button)existing.remove();
      button.classList.add('platform-module-tree-item');
      button.removeAttribute('style');
      button.title=button.textContent.trim();
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
       selection. Move each newly created real Registry button into the tree;
       never clone module/catalog state. */
    const selectorObserver=new MutationObserver(()=>queueMicrotask(reconcileSelector));
    selectorObserver.observe(selector,{childList:true});

    const resize=document.createElement('div');
    resize.className='platform-admin-shell__resize-handle';
    resize.setAttribute('role','separator');
    resize.setAttribute('aria-orientation','vertical');
    resize.setAttribute('aria-label','좌측 메뉴 너비 조절');
    admin.appendChild(resize);

    const reopen=document.createElement('button');
    reopen.type='button';reopen.className='platform-admin-shell__reopen';reopen.dataset.libraryTreeReopen='true';reopen.setAttribute('aria-label','좌측 메뉴 열기');reopen.setAttribute('title','좌측 메뉴 열기');reopen.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>';document.body.appendChild(reopen);
    const mobileToggle=document.createElement('button');
    mobileToggle.type='button';mobileToggle.className='builder-library-tree-mobile-toggle';mobileToggle.innerHTML='<span aria-hidden="true">☰</span> 모듈';mobileToggle.setAttribute('aria-expanded','false');tools.prepend(mobileToggle);

    function persist(){saveState({width:state.width,collapsed:state.collapsed,groups:state.groups});}
    function apply(){
      const desktop=DESKTOP.matches;
      html.style.setProperty('--library-admin-sidebar-w',`${state.width}px`);
      if(desktop){
        html.dataset.adminSidebarCollapsed=String(state.collapsed);
        /* --admin-sidebar-w is only the page offset. The shell keeps its real
           width through --library-admin-sidebar-w so it can fully translate. */
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
      const next=Math.max(0,Math.min(390,drag.startWidth+(event.clientX-drag.startX)));
      if(next<96){state.collapsed=true;html.style.setProperty('--admin-sidebar-w','0px');}
      else{
        state.collapsed=false;state.width=Math.max(236,next);
        html.style.setProperty('--admin-sidebar-w',`${state.width}px`);
        html.style.setProperty('--library-admin-sidebar-w',`${state.width}px`);
      }
      event.preventDefault();
    });
    const finishDrag=event=>{if(!drag||event.pointerId!==drag.pointerId)return;try{resize.releasePointerCapture?.(event.pointerId);}catch{}drag=null;delete html.dataset.adminSidebarDragging;apply();persist();};
    resize.addEventListener('pointerup',finishDrag);resize.addEventListener('pointercancel',finishDrag);

    function syncActive(){
      body.querySelectorAll('.platform-module-tree-group').forEach(group=>{
        const active=Boolean(group.querySelector('[data-kit-ui][aria-pressed="true"]'));
        group.dataset.active=String(active);
        if(active&&!group.open)group.open=true;
      });
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
