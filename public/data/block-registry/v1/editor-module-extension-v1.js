(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const modules=window.PlatformModuleRegistry;
  if(!manifest||!Array.isArray(manifest.blocks)||!modules)return;
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
