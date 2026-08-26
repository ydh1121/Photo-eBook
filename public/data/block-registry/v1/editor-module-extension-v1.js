(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const modules=window.PlatformModuleRegistry;
  if(!manifest||!Array.isArray(manifest.blocks)||!modules)return;

  /* Editor's block manifest is assembled synchronously during parser startup.
     Load the same shared Registry extension used by Library before collecting
     ui-module variants, rather than duplicating portable module definitions. */
  if(!window.__platformPortablePrimitivesExtensionV2){
    try{
      const request=new XMLHttpRequest();
      request.open('GET','/assets/js/platform-modules/portable-primitives-extension-v2.js?v=1',false);
      request.send(null);
      if(request.status===0||(request.status>=200&&request.status<300)){
        (0,eval)(`${request.responseText}\n//# sourceURL=portable-primitives-extension-v2.js`);
      }
    }catch(error){console.warn('Portable Registry extension load failed.',error);}
  }
  if(!window.__platformFilterChipEdgeRepairV1){
    try{
      const request=new XMLHttpRequest();
      request.open('GET','/assets/js/platform-modules/filter-chip-rail-edge-repair-v1.js?v=1',false);
      request.send(null);
      if(request.status===0||(request.status>=200&&request.status<300)){
        (0,eval)(`${request.responseText}\n//# sourceURL=filter-chip-rail-edge-repair-v1.js`);
      }
    }catch(error){console.warn('Filter edge Registry repair load failed.',error);}
  }

  if(manifest.blocks.some(item=>item.type==='ui-module'))return;
  const variants=modules.listFor('editor').map(item=>item.id);
  if(!variants.length)return;
  manifest.blocks.unshift({
    type:'ui-module',
    label:'UI 모듈',
    category:'platform',
    variants,
    editorialProfile:'ui-module',
    status:'approved'
  });
})();
