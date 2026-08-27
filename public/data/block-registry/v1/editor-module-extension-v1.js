(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const modules=window.PlatformModuleRegistry;
  if(!manifest||!Array.isArray(manifest.blocks)||!modules)return;

  /* Editor's block manifest is assembled synchronously during parser startup.
     Load the same shared Registry extensions used by Library before collecting
     ui-module variants. This wiring file does not own component markup/skin. */
  function loadSharedOnce(flag,url,label){
    if(window[flag])return;
    try{
      const request=new XMLHttpRequest();
      request.open('GET',url,false);
      request.send(null);
      if(request.status===0||(request.status>=200&&request.status<300)){
        (0,eval)(`${request.responseText}\n//# sourceURL=${url.split('?')[0]}`);
      }
    }catch(error){console.warn(`${label} load failed.`,error);}
  }

  loadSharedOnce('__platformPortablePrimitivesExtensionV4','/assets/js/platform-modules/portable-primitives-extension-v2.js?v=4','Portable Registry extension');
  loadSharedOnce('__platformPortablePrimitivesCompositionV6','/assets/js/platform-modules/portable-primitives-composition-v3.js?v=6','Portable canonical composition');
  loadSharedOnce('__platformFilterChipEdgeRepairV1','/assets/js/platform-modules/filter-chip-rail-edge-repair-v1.js?v=1','Filter edge Registry repair');

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
