/* v1: persistent major-tool navigation for the shared admin shell.
   Tool runtimes stay isolated in same-origin workspaces; no module/editor runtime is cloned. */
(function(){
  if(window.__platformAdminPersistentWorkspaceV1)return;
  window.__platformAdminPersistentWorkspaceV1=true;

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

  function appendStyle(href,attr){
    if(document.querySelector(`link[${attr}]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.setAttribute(attr,'true');document.head.appendChild(link);
  }
  appendStyle('/assets/styles/admin/admin-unified-v2.css?v=2','data-admin-unified-persistent-style');
  appendStyle('/assets/styles/admin/admin-runtime-fixes-v1.css?v=1','data-admin-runtime-fixes-style');

  function normalizeTheme(value){return ['light','dark','system'].includes(value)?value:'light';}
  function readTheme(){try{return normalizeTheme(localStorage.getItem(THEME_KEY)||'light');}catch{return'light';}}
  function resolvedTheme(value){return value==='system'?(systemDark.matches?'dark':'light'):value;}
  function applyEmbeddedTheme(){
    const theme=readTheme(),resolved=resolvedTheme(theme);
    document.documentElement.dataset.adminTheme=theme;
    document.documentElement.dataset.adminThemeResolved=resolved;
  }

  if(embedded){
    /* Stop admin-shell-v1.js from mounting a second shell inside the workspace. */
    window.__platformAdminShellV1=true;
    document.documentElement.dataset.adminEmbedded='true';
    applyEmbeddedTheme();
    systemDark.addEventListener?.('change',()=>{if(readTheme()==='system')applyEmbeddedTheme();});
    return;
  }

  function idFromPath(pathname){
    if(pathname.startsWith('/ui-dashboard'))return'library';
    if(pathname.startsWith('/block-lab'))return'blocks';
    if(pathname.startsWith('/block-editor')||pathname.startsWith('/editor-lab'))return'editor';
    if(pathname.startsWith('/qa/')||pathname.startsWith('/staging/'))return'qa';
    return'';
  }
  const baseId=idFromPath(location.pathname);
  let host=null,frame=null;

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
      host?.removeAttribute('aria-busy');
      syncFrameTheme();
    });
    return {host,frame};
  }

  function syncFrameTheme(){
    if(!frame?.contentDocument)return;
    try{
      const theme=readTheme(),resolved=resolvedTheme(theme);
      const root=frame.contentDocument.documentElement;
      root.dataset.adminTheme=theme;
      root.dataset.adminThemeResolved=resolved;
    }catch{}
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
    if(id===baseId){
      parts.host.hidden=true;
      parts.host.removeAttribute('aria-busy');
      if(parts.frame.src&&parts.frame.src!=='about:blank')parts.frame.src='about:blank';
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
      let id=idFromPath(url.pathname);
      if(!id)return;
      event.preventDefault();
      showRoute(id,{push:true});
    }));
    shell.addEventListener('click',event=>{
      if(!event.target.closest('[data-admin-theme-value]'))return;
      queueMicrotask(syncFrameTheme);
    });
    window.addEventListener('popstate',()=>{
      const id=idFromPath(location.pathname)||baseId;
      showRoute(id,{push:false});
    });
    setCurrent(idFromPath(location.pathname)||baseId);
    return true;
  }

  function mount(){
    const shell=document.querySelector('.platform-admin-shell');
    if(bind(shell))return true;
    return false;
  }
  if(!mount()){
    const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
})();
