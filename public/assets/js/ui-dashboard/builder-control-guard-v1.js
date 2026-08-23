(function(){
  if(window.__platformBuilderControlGuardV1)return;
  window.__platformBuilderControlGuardV1=true;

  const UNSUPPORTED={
    'top-chapter-navigation':new Set(['chipFamily','accentColor','response','overshoot','durationScale']),
    'filter-chip-rail':new Set(['overshoot']),
    'floating-action':new Set(['overshoot'])
  };
  const STORES=['platformBuilderCapabilityConfigsV2','platformBuilderCapabilityConfigsV1'];

  function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function sanitizeStores(){
    for(const store of STORES){
      const all=read(store);let changed=false;
      for(const [id,keys] of Object.entries(UNSUPPORTED)){
        const config=all[id];if(!config||typeof config!=='object')continue;
        for(const key of keys){if(Object.prototype.hasOwnProperty.call(config,key)){delete config[key];changed=true;}}
        if(!Object.keys(config).length)delete all[id];
      }
      if(changed)write(store,all);
    }
  }

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

  sanitizeStores();
  const observer=new MutationObserver(()=>queueMicrotask(clean));
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>queueMicrotask(clean),true);
  clean();
})();
