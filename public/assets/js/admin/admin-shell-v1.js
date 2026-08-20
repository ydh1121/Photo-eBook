(function(){
  if(window.__platformAdminShellV1)return;
  window.__platformAdminShellV1=true;

  const path=location.pathname;
  const query=new URLSearchParams(location.search);
  const isLibrary=path.startsWith('/ui-dashboard')&&query.get('view')==='library';
  const items=[
    {id:'builder',label:'화면 구성',href:'/ui-dashboard/'},
    {id:'library',label:'UI 라이브러리',href:'/ui-dashboard/?view=library'},
    {id:'blocks',label:'블록 관리',href:'/block-lab/'},
    {id:'editor',label:'페이지 에디터',href:'/editor-lab/'},
    {id:'qa',label:'QA',href:'/qa/video-editor/'}
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

  function ensureCss(){
    appendStyle('/assets/styles/admin/admin-shell-v1.css?v=1','data-admin-shell-style');
    if(!path.startsWith('/ui-dashboard'))appendStyle('/assets/styles/admin/admin-surface-v1.css?v=1','data-admin-surface-style');
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
    details.innerHTML='<summary><span>페이지·발행 설정</span><small>SEO · AI · 발행</small></summary><div class="admin-editor-settings__body"></div>';
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
    if(id==='blocks'){
      document.title='플랫폼 관리 · 블록 관리';
      const title=document.querySelector('.lab-brand strong');if(title)title.textContent='블록 관리';
      const intro=document.querySelector('.lab-sidebar__intro h1');if(intro)intro.textContent='블록과 변형을 검토합니다';
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
    }
    bindUtilityMenus();
  }

  function mount(){
    ensureCss();
    if(document.querySelector('.platform-admin-shell'))return;
    const id=currentId();
    const shell=document.createElement('header');
    shell.className='platform-admin-shell';
    shell.dataset.compact=String(innerWidth<1100);
    shell.innerHTML=`<a class="platform-admin-shell__brand" href="/ui-dashboard/"><span class="platform-admin-shell__mark">UI</span><strong>플랫폼 관리</strong></a><nav class="platform-admin-shell__nav" aria-label="관리 화면">${items.map(item=>`<a href="${item.href}" ${item.id===id?'aria-current="page"':''}>${item.label}</a>`).join('')}</nav><div class="platform-admin-shell__end"><span class="platform-admin-shell__context">검토용 관리 화면</span><a href="/" target="_blank" rel="noopener">공개 페이지</a></div>`;
    document.body.prepend(shell);
    simplifyLocalUi(id);
    addEventListener('resize',()=>shell.dataset.compact=String(innerWidth<1100),{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();