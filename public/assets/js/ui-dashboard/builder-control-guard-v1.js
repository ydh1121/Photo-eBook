(function(){
  if(window.__platformBuilderControlGuardV1)return;
  window.__platformBuilderControlGuardV1=true;

  const UNSUPPORTED={
    'top-chapter-navigation':new Set(['response','overshoot','durationScale']),
    'filter-chip-rail':new Set(['overshoot']),
    'floating-action':new Set(['overshoot'])
  };

  function libraryId(){return new URL(location.href).searchParams.get('ui')||'top-chapter-navigation';}
  function clean(){
    document.querySelectorAll('[data-builder-control],[data-kit-control]').forEach(input=>{
      const panel=input.closest('.builder-inspector,.builder-kit-inspector');
      const id=panel?.dataset.inspectorId||libraryId();
      const key=input.dataset.builderControl||input.dataset.kitControl;
      if(!UNSUPPORTED[id]?.has(key))return;
      input.closest('.builder-control')?.remove();
    });
    document.querySelectorAll('.builder-control-group').forEach(group=>{
      const grid=group.querySelector('.builder-control-grid');
      if(grid&&!grid.querySelector('.builder-control'))group.remove();
    });
  }

  const observer=new MutationObserver(()=>queueMicrotask(clean));
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>queueMicrotask(clean),true);
  clean();
})();
