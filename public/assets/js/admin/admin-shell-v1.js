(function(){
  if(window.__platformAdminShellV1)return;
  window.__platformAdminShellV1=true;

  const path=location.pathname;
  const query=new URLSearchParams(location.search);
  const isLibrary=path.startsWith('/ui-dashboard')&&query.get('view')==='library';
  const icons={
    builder:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h7v5H4zM13 5.5h7v13h-7zM4 12.5h7v6H4z"/></svg>',
    library:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
    blocks:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h6v6H5zM13 4h6v6h-6zM5 12h6v8H5zM13 12h6v8h-6z"/></svg>',
    editor:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h10l4 4v12H5zM15 4v5h4M8 13h8M8 16h6"/></svg>',
    qa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 9l2 2 4-4M8 15h8"/></svg>'
  };
  const items=[
    {id:'builder',label:'화면 구성',hint:'더미 화면 배치',href:'/ui-dashboard/'},
    {id:'library',label:'UI 라이브러리',hint:'공통 UI 검토',href:'/ui-dashboard/?view=library'},
    {id:'blocks',label:'블록 관리',hint:'블록·변형 검토',href:'/block-lab/'},
    {id:'editor',label:'페이지 에디터',hint:'콘텐츠 페이지 제작',href:'/editor-lab/'},
    {id:'qa',label:'QA',hint:'최종 화면 확인',href:'/qa/video-editor/'}
  ];

  function currentId(){
    if(path.startsWith('/ui-dashboard'))return isLibrary?'library':'builder';
    if(path.startsWith('/block-lab'))return'blocks';
    if(path.startsWith('/editor-lab'))return'editor';
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
    if(!path.startsWith('/ui-dashboard'))appendStyle('/assets/styles/admin/admin-surface-v1.css?v=2','data-admin-surface-style');
    if(id==='blocks'||id==='editor')appendStyle('/assets/styles/admin/admin-preview-theme-v1.css?v=1','data-admin-preview-theme-style');
  }

  function simplifyEditorLibrary(){
    const library=document.querySelector('.editor-library');
    if(!library||library.querySelector('.admin-editor-settings'))return;
    const head=library.querySelector('.editor-pane-head');
    const search=library.querySelector('#editorLibrarySearch');
    const list=library.querySelector('#editorLibraryList');
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
    if(id==='builder')document.title='플랫폼 관리 · 화면 구성';
    if(id==='library')document.title='플랫폼 관리 · UI 라이브러리';
    if(id==='blocks'){
      document.title='플랫폼 관리 · 블록 관리';
      const title=document.querySelector('.lab-brand strong');if(title)title.textContent='블록 관리';
      const count=document.querySelector('#labCount');if(count)count.setAttribute('aria-label','표시 중인 블록 수');
    }
    if(id==='editor'){
      document.title='플랫폼 관리 · 페이지 에디터';
      const title=document.querySelector('.editor-brand strong');if(title)title.textContent='페이지 에디터';
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
    if(document.querySelector('.platform-admin-shell'))return;
    const id=currentId();
    ensureCss(id);
    document.documentElement.dataset.adminShell='true';
    const shell=document.createElement('aside');
    shell.className='platform-admin-shell';
    shell.innerHTML=`<div class="platform-admin-shell__brand"><a href="/ui-dashboard/"><span class="platform-admin-shell__mark">P</span><span><strong>플랫폼 관리</strong><small>디자인·콘텐츠 도구</small></span></a></div><nav class="platform-admin-shell__nav" aria-label="관리 화면">${items.map(item=>`<a href="${item.href}" title="${item.label}" ${item.id===id?'aria-current="page"':''}><span class="platform-admin-shell__icon">${icons[item.id]}</span><span class="platform-admin-shell__copy"><strong>${item.label}</strong><small>${item.hint}</small></span></a>`).join('')}</nav><div class="platform-admin-shell__end"><a href="/" target="_blank" rel="noopener"><span>공개 페이지</span><b aria-hidden="true">↗</b></a><small>관리 화면은 검색 노출 제외</small></div>`;
    document.body.prepend(shell);
    simplifyLocalUi(id);
    if(id==='blocks'||id==='editor')appendScript('/assets/js/admin/admin-surface-v1.js?v=1','data-admin-surface-script');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();