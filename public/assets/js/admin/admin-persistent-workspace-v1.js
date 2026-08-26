/* v4: persistent major-tool navigation with Library as the stable admin host.
   Tool runtimes stay isolated in same-origin workspaces; no module/editor runtime is cloned. */
(function(){
  if(window.__platformAdminPersistentWorkspaceV4)return;
  window.__platformAdminPersistentWorkspaceV4=true;

  const params=new URLSearchParams(location.search);
  const embedded=params.get('adminEmbed')==='1';
  const THEME_KEY='platformAdminThemeV1';
  const systemDark=matchMedia('(prefers-color-scheme: dark)');
  const routes={
    library:{path:'/ui-dashboard/',title:'UI 라이브러리'},
    blocks:{path:'/block-lab/',title:'블록 연구실'},
    editor:{path:'/editor-lab/',title:'블록 에디터'},
    qa:{path:'/qa/video-editor/',title:'QA'}
  };

  function idFromPath(pathname){
    if(pathname.startsWith('/ui-dashboard'))return'library';
    if(pathname.startsWith('/block-lab'))return'blocks';
    if(pathname.startsWith('/block-editor')||pathname.startsWith('/editor-lab'))return'editor';
    if(pathname.startsWith('/qa/')||pathname.startsWith('/staging/'))return'qa';
    return'';
  }

  const baseId=idFromPath(location.pathname);
  const requestedTool=routes[params.get('adminTool')]?params.get('adminTool'):'';

  if(!embedded&&baseId&&baseId!=='library'){
    const url=new URL('/ui-dashboard/',location.origin);
    url.searchParams.set('adminTool',baseId);
    location.replace(url.pathname+url.search+location.hash);
    return;
  }

  function appendStyle(href,attr){
    if(document.querySelector(`link[${attr}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.setAttribute(attr,'true');document.head.appendChild(link);
  }
  function appendDocumentStyle(doc,href,attr){
    if(!doc?.head||doc.querySelector(`link[${attr}]`))return;
    const link=doc.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(attr,'true');doc.head.appendChild(link);
  }
  appendStyle('/assets/styles/admin/admin-unified-v2.css?v=2','data-admin-unified-persistent-style');
  appendStyle('/assets/styles/admin/admin-runtime-fixes-v1.css?v=2','data-admin-runtime-fixes-style');

  function normalizeTheme(value){return ['light','dark','system'].includes(value)?value:'light';}
  function readTheme(){try{return normalizeTheme(localStorage.getItem(THEME_KEY)||'light');}catch{return'light';}}
  function resolvedTheme(value){return value==='system'?(systemDark.matches?'dark':'light'):value;}
  function applyEmbeddedTheme(root=document.documentElement){
    const theme=readTheme(),resolved=resolvedTheme(theme);
    root.dataset.adminTheme=theme;
    root.dataset.adminThemeResolved=resolved;
  }

  if(embedded){
    window.__platformAdminShellV1=true;
    document.documentElement.dataset.adminEmbedded='true';
    delete document.documentElement.dataset.adminShell;
    appendStyle('/assets/styles/admin/admin-unified-v2.css?v=2','data-admin-unified-persistent-style');
    appendStyle('/assets/styles/admin/admin-runtime-fixes-v1.css?v=2','data-admin-runtime-fixes-style');
    applyEmbeddedTheme();
    systemDark.addEventListener?.('change',()=>{if(readTheme()==='system')applyEmbeddedTheme();});
    return;
  }

  let host=null,frame=null;

  function sanitizeEmbeddedDocument(){
    const doc=frame?.contentDocument;if(!doc)return;
    try{
      doc.querySelectorAll('.platform-admin-shell,.platform-admin-shell__reopen,.platform-admin-shell__resize-handle').forEach(node=>node.remove());
      appendDocumentStyle(doc,'/assets/styles/admin/admin-unified-v2.css?v=2','data-admin-unified-persistent-style');
      appendDocumentStyle(doc,'/assets/styles/admin/admin-runtime-fixes-v1.css?v=2','data-admin-runtime-fixes-style-v2');
      const root=doc.documentElement;
      root.dataset.adminEmbedded='true';
      delete root.dataset.adminShell;
      root.style.removeProperty('--admin-sidebar-w');
      doc.body?.style.removeProperty('padding-left');
      doc.body?.style.removeProperty('padding-top');
      applyEmbeddedTheme(root);
    }catch{}
  }

  function ensureHost(){
    if(host&&frame)return {host,frame};
    host=document.createElement('section');
    host.className='platform-admin-workspace-host';
    host.hidden=true;
    host.setAttribute('aria-label','관리 작업 영역');
    frame=document.createElement('iframe');
    frame.title='관리 작업 영역';
    frame.setAttribute('loading','eager');
    host.appendChild(frame);
    document.body.appendChild(host);
    frame.addEventListener('load',()=>{
      sanitizeEmbeddedDocument();
      host?.removeAttribute('aria-busy');
      syncFrameTheme();
    });
    return {host,frame};
  }

  function syncFrameTheme(){
    if(!frame?.contentDocument)return;
    try{sanitizeEmbeddedDocument();applyEmbeddedTheme(frame.contentDocument.documentElement);}catch{}
  }

  function setCurrent(id){
    document.querySelectorAll('.platform-admin-shell__nav a').forEach(link=>{
      const linkId=idFromPath(new URL(link.href,location.href).pathname);
      if(linkId===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
  }

  function embeddedUrl(route){
    const url=new URL(route.path,location.origin);
    url.searchParams.set('adminEmbed','1');
    return url.pathname+url.search;
  }

  function showRoute(id,{push=true}={}){
    const route=routes[id];if(!route)return;
    const parts=ensureHost();
    setCurrent(id);
    if(id==='library'){
      parts.host.hidden=true;
      parts.host.removeAttribute('aria-busy');
      if(parts.frame.getAttribute('src')&&parts.frame.getAttribute('src')!=='about:blank')parts.frame.src='about:blank';
    }else{
      parts.host.hidden=false;
      parts.host.setAttribute('aria-busy','true');
      const next=embeddedUrl(route);
      const current=parts.frame.getAttribute('src')||'';
      if(current!==next)parts.frame.src=next;
    }
    if(push&&location.pathname!==route.path)history.pushState({adminWorkspace:id},'',route.path);
  }

  function bind(shell){
    if(!shell||shell.dataset.persistentWorkspaceBound==='true')return false;
    shell.dataset.persistentWorkspaceBound='true';
    const links=[...shell.querySelectorAll('.platform-admin-shell__brand a,.platform-admin-shell__nav a')];
    links.forEach(link=>link.addEventListener('click',event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin)return;
      const id=idFromPath(url.pathname);if(!id)return;
      event.preventDefault();
      showRoute(id,{push:true});
    }));
    shell.addEventListener('click',event=>{if(event.target.closest('[data-admin-theme-value]'))setTimeout(syncFrameTheme,0);});
    window.addEventListener('popstate',()=>showRoute(idFromPath(location.pathname)||'library',{push:false}));
    setCurrent(idFromPath(location.pathname)||'library');
    return true;
  }

  function mount(){
    if(!bind(document.querySelector('.platform-admin-shell')))return false;
    if(requestedTool&&requestedTool!=='library'){
      showRoute(requestedTool,{push:false});
      history.replaceState({adminWorkspace:requestedTool},'',routes[requestedTool].path);
    }else if(params.has('adminTool')){
      history.replaceState({adminWorkspace:'library'},'',routes.library.path);
    }
    return true;
  }
  if(!mount()){
    const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
})();
