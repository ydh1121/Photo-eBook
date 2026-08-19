(function(){
  const registry=window.PlatformBlockRegistry;
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  if(!registry||!manifest)return;

  const errors=[];
  const warnings=[];
  const registered=new Map(registry.list().map(item=>[item.type,item]));
  const declared=new Map(manifest.blocks.map(item=>[item.type,item]));

  for(const item of manifest.blocks){
    const runtime=registered.get(item.type);
    if(!runtime){
      errors.push(`manifest에 있지만 renderer가 없음: ${item.type}`);
      continue;
    }
    const expected=[...item.variants].sort().join('|');
    const actual=[...(runtime.variants||[])].sort().join('|');
    if(expected!==actual)errors.push(`variant 불일치: ${item.type}`);
    if(item.category!==runtime.category)warnings.push(`category 불일치: ${item.type}`);
    if(item.editorialProfile!==runtime.editorialProfile)warnings.push(`editorialProfile 불일치: ${item.type}`);
  }

  for(const runtime of registry.list()){
    if(!declared.has(runtime.type))warnings.push(`renderer는 있지만 manifest에 없음: ${runtime.type}`);
  }

  window.PlatformBlockRegistryHealth={
    ok:errors.length===0,
    errors,
    warnings,
    manifestCount:manifest.blocks.length,
    runtimeCount:registry.list().length
  };
})();
