/* Preview geometry adapter only.
   Shared module code still owns the visual result. This adapter only reconciles
   an explicit Library/Editor viewport simulation with the iframe's physical width. */
(function(){
  const runtime=window.PlatformModuleStyleRuntime;
  if(!runtime||typeof runtime.apply!=='function'||runtime.__previewResponsiveStyleAdapterV1)return;

  const originalApply=runtime.apply.bind(runtime);
  runtime.apply=function(id,root,config){
    let next=config;
    if(id==='top-chapter-navigation'&&config&&typeof config==='object'){
      const mode=window.PlatformModuleViewportMode?.();
      if(mode==='desktop'&&window.innerWidth<1024){
        next={...config,mobileChipGap:config.desktopChipGap};
      }else if(mode==='mobile'&&window.innerWidth>=1024){
        next={...config,desktopChipGap:config.mobileChipGap};
      }
    }
    return originalApply(id,root,next);
  };
  runtime.__previewResponsiveStyleAdapterV1=true;
})();
