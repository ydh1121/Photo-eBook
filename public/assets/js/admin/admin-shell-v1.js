(function(){
  if(window.__platformAdminShellV1)return;
  window.__platformAdminShellV1=true;

  const path=location.pathname;
  const embedded=new URLSearchParams(location.search).get('adminEmbed')==='1';
  const ADMIN_THEME_KEY='platformAdminThemeV1';
  const ADMIN_SIDEBAR_WIDTH_KEY='platformAdminSidebarWidthV1';
  const systemDark=matchMedia('(prefers-color-scheme: dark)');
  const icons={
    library:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
    blocks:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h6v6H5zM13 4h6v6h-6zM5 12h6v8H5zM13 12h6v8h-6z"/></svg>',
    editor:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10l4 4v12H5zM15 4v5h4M8 13h8M8 16h6"/></svg>',
    qa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 9l2 2 4-4M8 15h8"/></svg>',
    sun:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
    moon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.2A8.5 8.5 0 1 1 8.8 4 7 7 0 0 0 20 15.2z"/></svg>',
    system:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
  };
  const items=[
    {id:'library',label:'UI 라이브러리',hint:'승인된 공통 모듈',href:'/ui-dashboard/'},
    {id:'blocks',label:'블록 연구실',hint:'신규 블록 연구',href:'/block-lab/'},
    {id:'editor',label:'블록 에디터',hint:'페이지 조립·저장',href:'/editor-lab/'},
    {id:'qa',label:'QA',hint:'발행 전 확인',href:'/qa/video-editor/'}
  ];

  function currentId(){
    if(path.startsWith('/ui-dashboard'))return'library';
    if(path.startsWith('/block-lab'))return'blocks';
    if(path.startsWith('/block-editor')||path.startsWith('/editor-lab'))return'editor';
    if(path.startsWith('/qa/')||path.startsWith('/staging/'))return'qa';
    return'';
  }

  function appendStyle(href,attribute){
    if(document.querySelector(`link[${attribute}]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(attribute,'true');document.head.appendChild(link);
  }
  function appendScript(src,attribute){
    if(document.querySelector(`script[${attribute}]`))return;
    const script=document.createElement('script');script.src=src;script.defer=true;script.setAttribute(attribute,'true');document.head.appendChild(script);
  }

  function ensureCss(id){
    appendStyle('/assets/styles/admin/admin-shell-v1.css?v=2','data-admin-shell-style');
    if(id!=='library')appendStyle('/assets/styles/admin/admin-surface-v1.css?v=2','data-admin-surface-style');
    if(id==='blocks'||id==='editor')appendStyle('/assets/styles/admin/admin-preview-theme-v1.css?v=1','data-admin-preview-theme-style');
    appendStyle('/assets/styles/admin/admin-unified-v2.css?v=2','data-admin-unified-style');
    appendStyle('/assets/styles/admin/admin-runtime-fixes-v1.css?v=2','data-admin-runtime-fixes-style');
  }

  function readAdminSidebarWidth(){
    try{return Math.max(236,Math.min(390,Number(localStorage.getItem(ADMIN_SIDEBAR_WIDTH_KEY))||256));}catch{return 256;}
  }
  function applyAdminSidebarWidth(){
    const width=readAdminSidebarWidth();
    document.documentElement.style.setProperty('--admin-sidebar-w',`${width}px`);
    document.documentElement.style.setProperty('--library-admin-sidebar-w',`${width}px`);
    return width;
  }

  function normalizeAdminTheme(value){return ['light','dark','system'].includes(value)?value:'light';}
  function readAdminTheme(){try{return normalizeAdminTheme(localStorage.getItem(ADMIN_THEME_KEY)||'light');}catch{return'light';}}
  function resolvedAdminTheme(value){return value==='system'?(systemDark.matches?'dark':'light'):value;}
  function paintAdminTheme(value=readAdminTheme()){
    const theme=normalizeAdminTheme(value),resolved=resolvedAdminTheme(theme);
    document.documentElement.dataset.adminTheme=theme;
    document.documentElement.dataset.adminThemeResolved=resolved;
    document.querySelectorAll('[data-admin-theme-value]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.adminThemeValue===theme)));
    return theme;
  }
  function setAdminTheme(value){
    const theme=normalizeAdminTheme(value);
    try{localStorage.setItem(ADMIN_THEME_KEY,theme);}catch{}
    paintAdminTheme(theme);
  }
  function bindAdminTheme(shell){
    shell.querySelectorAll('[data-admin-theme-value]').forEach(button=>button.addEventListener('click',()=>setAdminTheme(button.dataset.adminThemeValue)));
    paintAdminTheme();
  }
  systemDark.addEventListener?.('change',()=>{if(readAdminTheme()==='system')paintAdminTheme('system');});

  function simplifyEditorLibrary(){
    const library=document.querySelector('.editor-library');
    if(!library||library.querySelector('.admin-editor-settings'))return;
    const head=library.querySelector('.editor-pane-head');
    const search=document.querySelector('#editorLibrarySearch');
    const list=document.querySelector('#editorLibraryList');
    const settings=[library.querySelector('.editor-page-meta'),library.querySelector('.editor-seo'),library.querySelector('.editor-ai-brief'),library.querySelector('.editor-publish')].filter(Boolean);
    const details=document.createElement('details');
    details.className='admin-editor-settings';
    details.innerHTML='<summary><span>페이지 설정</span><small>SEO · AI · 발행</small></summary><div class="admin-editor-settings__body"></div>';
    const body=details.querySelector('.admin-editor-settings__body');
    settings.forEach(node=>body.appendChild(node));
    if(head)head.insertAdjacentElement('afterend',details);else library.prepend(details);
    if(search)details.insertAdjacentElement('afterend',search);
    if(list&&search)search.insertAdjacentElement('afterend',list);
  }

  function bindUtilityMenus(){
    const menus=[...document.querySelectorAll('.admin-utility-menu')];
    const closeOthers=except=>menus.forEach(menu=>{if(menu!==except)menu.open=false;});
    menus.forEach(menu=>{
      menu.querySelector(':scope > summary')?.addEventListener('click',()=>queueMicrotask(()=>{if(menu.open)closeOthers(menu);}));
      menu.addEventListener('click',event=>{if(event.target.closest('.admin-utility-menu__panel button,.admin-utility-menu__panel label'))queueMicrotask(()=>{menu.open=false;});});
    });
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.admin-utility-menu'))closeOthers(null);});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeOthers(null);});
  }

  function simplifyLocalUi(id){
    if(id==='library')document.title='플랫폼 관리 · UI 라이브러리';
    if(id==='blocks'){
      document.title='플랫폼 관리 · 블록 연구실';
      const title=document.querySelector('.lab-brand strong');if(title)title.textContent='블록 연구실';
      const count=document.querySelector('#labCount');if(count)count.setAttribute('aria-label','연구 중인 블록 수');
    }
    if(id==='editor'){
      document.title='플랫폼 관리 · 블록 에디터';
      const title=document.querySelector('.editor-brand strong');if(title)title.textContent='블록 에디터';
      const actions=document.querySelector('.editor-top-actions');
      if(actions&&!actions.querySelector('.admin-utility-menu')){
        const details=document.createElement('details');details.className='admin-utility-menu';
        details.innerHTML='<summary>더보기</summary><div class="admin-utility-menu__panel"></div>';
        const panel=details.querySelector('.admin-utility-menu__panel');
        ['#editorUndo','#editorRedo','#editorExport','.editor-import'].forEach(selector=>{const node=actions.querySelector(selector);if(node)panel.appendChild(node);});
        actions.appendChild(details);
      }
      simplifyEditorLibrary();
    }
    if(id==='qa'){
      document.title='플랫폼 관리 · QA';
      const title=document.querySelector('.qa-toolbar__label strong');if(title)title.textContent='QA 미리보기';
      const hint=document.querySelector('.qa-toolbar__label span');if(hint)hint.textContent='실제 발행 전 화면 확인';
    }
    bindUtilityMenus();
  }

  function mount(){
    const id=currentId();
    ensureCss(id);

    if(embedded){
      document.documentElement.dataset.adminEmbedded='true';
      document.documentElement.dataset.adminSection=id||'unknown';
      paintAdminTheme();
      simplifyLocalUi(id);
      if(id==='blocks'||id==='editor')appendScript('/assets/js/admin/admin-surface-v1.js?v=1','data-admin-surface-script');
      return;
    }

    if(document.querySelector('.platform-admin-shell'))return;
    document.documentElement.dataset.adminShell='true';
    document.documentElement.dataset.adminSection=id||'unknown';
    applyAdminSidebarWidth();
    const shell=document.createElement('aside');
    shell.className='platform-admin-shell';
    shell.innerHTML=`<div class="platform-admin-shell__brand"><a href="/ui-dashboard/"><span class="platform-admin-shell__mark">P</span><span><strong>플랫폼 관리</strong><small>모듈·페이지 도구</small></span></a></div><nav class="platform-admin-shell__nav" aria-label="관리 화면">${items.map(item=>`<a href="${item.href}" title="${item.label}" ${item.id===id?'aria-current="page"':''}><span class="platform-admin-shell__icon">${icons[item.id]}</span><span class="platform-admin-shell__copy"><strong>${item.label}</strong><small>${item.hint}</small></span></a>`).join('')}</nav><div class="platform-admin-shell__end"><div class="platform-admin-theme"><span>관리 화면</span><div role="group" aria-label="관리 화면 테마"><button type="button" data-admin-theme-value="light" aria-label="관리 화면 밝게" title="밝게">${icons.sun}</button><button type="button" data-admin-theme-value="dark" aria-label="관리 화면 어둡게" title="어둡게">${icons.moon}</button><button type="button" data-admin-theme-value="system" aria-label="관리 화면 시스템 설정" title="시스템">${icons.system}</button></div></div><a href="/" target="_blank" rel="noopener"><span>공개 페이지</span><b aria-hidden="true">↗</b></a><small>관리 화면은 검색 노출 제외</small></div>`;
    document.body.prepend(shell);
    bindAdminTheme(shell);
    simplifyLocalUi(id);
    if(id==='blocks'||id==='editor')appendScript('/assets/js/admin/admin-surface-v1.js?v=1','data-admin-surface-script');
    appendScript('/assets/js/admin/admin-persistent-workspace-v1.js?v=4','data-admin-persistent-workspace-script');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();