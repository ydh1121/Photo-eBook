/* Preview-environment adapter only.
   Canonical module runtime may ask for a viewport mode, while Public remains auto/real-width.
   Admin-specific selectors stay here so shared module code remains portable. */
(function(){
  if(window.PlatformModuleViewportMode)return;
  window.PlatformModuleViewportMode=function(){
    if(window.parent!==window){
      try{
        const library=window.parent.document.querySelector('.builder-kit-workspace')?.dataset?.viewport;
        if(library==='desktop'||library==='mobile')return library;
        const editor=window.parent.document.querySelector('.editor-lab')?.dataset?.preview;
        if(editor==='mobile')return'mobile';
        if(editor==='desktop'||editor==='tablet')return'desktop';
      }catch{}
    }
    return window.innerWidth<1024?'mobile':'desktop';
  };
})();
