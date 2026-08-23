(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderPageAuditV1)return;
  window.__platformBuilderPageAuditV1=true;

  const frame=document.querySelector('#builderFrame');
  const toolbar=document.querySelector('.builder-toolbar');
  const edit=document.querySelector('#builderEditToggle');
  if(!frame||!toolbar)return;
  const THEME_KEY='platformBuilderPreviewThemeV1';
  let theme='light';
  try{theme=localStorage.getItem(THEME_KEY)||'light';}catch{}
  if(!['light','dark','system'].includes(theme))theme='light';

  function postTheme(){try{frame.contentWindow?.postMessage({type:'platform-theme',theme},location.origin);}catch{}}
  function renderTheme(){
    let wrap=toolbar.querySelector('.builder-audit-theme');
    if(!wrap){wrap=document.createElement('div');wrap.className='builder-preview-switch builder-audit-theme';const right=toolbar.querySelector('.builder-toolbar__group--right');toolbar.insertBefore(wrap,right||null);}
    wrap.innerHTML='<span>화면 모드</span>'+[['light','화이트'],['dark','다크'],['system','시스템']].map(([id,label])=>`<button type="button" data-audit-theme="${id}" aria-pressed="${theme===id}">${label}</button>`).join('');
    wrap.querySelectorAll('[data-audit-theme]').forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.auditTheme;try{localStorage.setItem(THEME_KEY,theme);}catch{}renderTheme();postTheme();}));
  }

  function normalizeScrollOwners(doc,app){
    [doc.documentElement,doc.body].filter(Boolean).forEach(node=>{
      node.style.setProperty('overflow-x','clip','important');
      node.style.setProperty('overflow-y','visible','important');
    });
    if(app){
      app.hidden=false;
      app.style.removeProperty('display');
      app.style.setProperty('overflow','visible','important');
      app.style.setProperty('transform','none','important');
    }
  }

  function installStickyAudit(doc,win,shell){
    if(!shell||win.__platformStickyAuditBound)return;
    win.__platformStickyAuditBound=true;
    const update=()=>{
      const style=win.getComputedStyle(shell);
      doc.documentElement.dataset.builderStickyComputed=style.position;
      if((win.scrollY||0)>shell.offsetTop+4){
        const top=shell.getBoundingClientRect().top;
        doc.documentElement.dataset.builderStickyState=Math.abs(top)<=2?'stuck':'drift';
        doc.documentElement.dataset.builderStickyTop=top.toFixed(2);
      }else{
        doc.documentElement.dataset.builderStickyState='before';
        delete doc.documentElement.dataset.builderStickyTop;
      }
    };
    win.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
    win.addEventListener('resize',()=>requestAnimationFrame(update),{passive:true});
    requestAnimationFrame(update);
  }

  function repairFrame(){
    const doc=frame.contentDocument,win=frame.contentWindow;if(!doc||!win)return;
    postTheme();
    const app=doc.querySelector('#app');
    normalizeScrollOwners(doc,app);

    const runtime=doc.querySelector('#platform-builder-runtime-style');
    if(runtime){
      let css=runtime.textContent||'';
      css=css.replace(/\[data-builder-capability\]\{position:relative!important\}/g,'.platform-builder-anchor{position:relative!important}');
      css=css.replace(/html\[data-builder-edit="true"\] \[data-builder-capability\]\{outline:[^}]+\}/g,'');
      css=css.replace(/html\[data-builder-edit="true"\] \[data-builder-capability\]:hover\{outline-color:[^}]+\}/g,'');
      runtime.textContent=css;
    }
    doc.querySelectorAll('[data-builder-capability]').forEach(node=>{
      node.classList.remove('platform-builder-anchor');
      const position=win.getComputedStyle(node).position;
      if(position==='static'&&!node.matches('.nav-shell,.collection-sheet,.collection-backdrop,.collection-fab'))node.classList.add('platform-builder-anchor');
    });

    const shell=doc.querySelector('.nav-shell');
    if(shell){
      shell.classList.remove('platform-builder-block','is-builder-drop-target','is-builder-dragging');
      shell.draggable=false;shell.removeAttribute('draggable');
      shell.querySelector(':scope > .platform-builder-block-handle')?.remove();
      if(!doc.documentElement.classList.contains('ios-webkit-chrome')){
        shell.style.setProperty('position','sticky','important');
        shell.style.setProperty('top','0','important');
        shell.style.setProperty('z-index','100','important');
        shell.style.setProperty('transform','none','important');
      }
      installStickyAudit(doc,win,shell);
    }
    const placeholder=doc.querySelector('.nav-placeholder');
    if(placeholder){placeholder.classList.remove('platform-builder-block','is-builder-drop-target','is-builder-dragging');placeholder.draggable=false;placeholder.removeAttribute('draggable');placeholder.querySelector(':scope > .platform-builder-block-handle')?.remove();}
    const legacy=doc.querySelector('.read-progress');if(legacy){legacy.hidden=true;legacy.style.setProperty('display','none','important');legacy.removeAttribute('data-builder-capability');legacy.querySelector(':scope > .platform-builder-gear')?.remove();}
  }

  function bindActionMenus(){
    function close(except){document.querySelectorAll('.builder-action-menu[open]').forEach(menu=>{if(menu!==except)menu.open=false;});}
    document.querySelectorAll('.builder-action-menu').forEach(menu=>{
      if(menu.dataset.auditBound==='true')return;menu.dataset.auditBound='true';
      menu.querySelector(':scope > summary')?.addEventListener('click',()=>queueMicrotask(()=>{if(menu.open)close(menu);}));
      menu.addEventListener('click',event=>{if(event.target.closest('.builder-action-menu__panel button'))queueMicrotask(()=>{menu.open=false;});});
    });
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.builder-action-menu'))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  }

  frame.addEventListener('load',()=>[0,80,280,780,1800,3600].forEach(delay=>setTimeout(repairFrame,delay)));
  edit?.addEventListener('click',()=>setTimeout(repairFrame,0));
  renderTheme();bindActionMenus();
  if(frame.contentDocument?.readyState==='complete')repairFrame();
})();
