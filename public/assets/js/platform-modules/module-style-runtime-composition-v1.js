/* v1: composition-aware style runtime adapter.
   Keeps shared style controls pointed at canonical composed module slots instead of retired lookalike DOM. */
(function(){
  if(window.__platformModuleStyleRuntimeCompositionV1)return;
  window.__platformModuleStyleRuntimeCompositionV1=true;

  const runtime=window.PlatformModuleStyleRuntime;
  if(!runtime)return;
  const baseApply=runtime.apply.bind(runtime);
  const baseReset=runtime.reset.bind(runtime);
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);

  function screenModeSlot(root=document){
    return root?.querySelector?.('[data-collection-screen-mode-slot]')||null;
  }

  function syncCollectionComposition(root,value){
    if(!has(value,'themeSelector'))return;
    const slot=screenModeSlot(root);
    if(slot)slot.hidden=value.themeSelector===false;
  }

  function apply(id,root=document,config={}){
    const value=baseApply(id,root,config);
    if(id==='collection-bottom-sheet')syncCollectionComposition(root,value||config||{});
    return value;
  }

  function reset(id,root=document){
    const result=baseReset(id,root);
    if(id==='collection-bottom-sheet'){
      const slot=screenModeSlot(root);
      if(slot)slot.hidden=false;
    }
    return result;
  }

  window.PlatformModuleStyleRuntime={...runtime,apply,reset};
})();
