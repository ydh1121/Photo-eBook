(function(){
  if(window.__platformModulePreviewResponsiveContextV1)return;
  window.__platformModulePreviewResponsiveContextV1=true;

  const runtime=window.PlatformModuleStyleRuntime;
  if(!runtime||typeof runtime.apply!=='function'||runtime.__previewResponsiveContextWrapped)return;

  const originalApply=runtime.apply.bind(runtime);

  function previewMode(){
    if(window.parent===window)return'';
    try{
      const parentDocument=window.parent.document;
      const library=parentDocument.querySelector('.builder-kit-workspace')?.dataset?.viewport;
      if(library==='desktop'||library==='mobile')return library;
      const editor=parentDocument.querySelector('.editor-lab')?.dataset?.preview;
      if(editor==='desktop'||editor==='tablet'||editor==='mobile')return editor;
    }catch{}
    return'';
  }

  runtime.apply=function(id,root,config){
    let next=config;
    if(id==='top-chapter-navigation'&&config&&typeof config==='object'){
      /* The Library PC canvas can be narrower than the public 1024px breakpoint
         because admin sidebars consume viewport width. PC is an explicit
         simulation choice, so map the desktop gap into the compact branch when
         the preview host itself happens to be narrower. Public pages never use
         this adapter and continue to resolve by their real window width. */
      if(previewMode()==='desktop')next={...config,mobileChipGap:config.desktopChipGap};
    }
    return originalApply(id,root,next);
  };
  runtime.__previewResponsiveContextWrapped=true;
})();