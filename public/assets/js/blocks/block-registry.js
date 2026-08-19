(function(){
  if(window.PlatformBlockRegistry)return;

  const definitions=new Map();

  function escapeHtml(value=''){
    return String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[char]));
  }

  function attrs(values={}){
    return Object.entries(values)
      .filter(([,value])=>value!==undefined&&value!==null&&value!==false)
      .map(([key,value])=>`${key}="${escapeHtml(value===true?'':value)}"`)
      .join(' ');
  }

  function normalizeBlock(block={}){
    return {
      id:String(block.id||`block_${Math.random().toString(36).slice(2,10)}`),
      type:String(block.type||''),
      variant:String(block.variant||'default'),
      status:String(block.status||'candidate'),
      enabled:block.enabled!==false,
      editorialProfile:String(block.editorialProfile||''),
      referenceProfiles:Array.isArray(block.referenceProfiles)?block.referenceProfiles:[],
      layout:block.layout&&typeof block.layout==='object'?block.layout:{},
      stylePresetId:String(block.stylePresetId||''),
      styleOverrides:block.styleOverrides&&typeof block.styleOverrides==='object'&&!Array.isArray(block.styleOverrides)?block.styleOverrides:{},
      content:block.content&&typeof block.content==='object'?block.content:{},
      evidence:Array.isArray(block.evidence)?block.evidence:[],
      aiPolicy:block.aiPolicy&&typeof block.aiPolicy==='object'?block.aiPolicy:{mode:'full'},
      revision:block.revision&&typeof block.revision==='object'?block.revision:{version:1}
    };
  }

  function manifestEntry(type){
    const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
    if(!manifest||!Array.isArray(manifest.blocks))return null;
    return manifest.blocks.find(item=>item.type===String(type||''))||null;
  }

  function validateUsage(input,{production=false}={}){
    const block=normalizeBlock(input);
    const errors=[];
    const warnings=[];
    const definition=definitions.get(block.type);
    const manifest=manifestEntry(block.type);

    if(!definition)errors.push(`Unknown block type: ${block.type}`);
    if(!manifest)errors.push(`Block type is missing from manifest: ${block.type}`);

    const variants=manifest?.variants||definition?.variants||[];
    if(block.variant&&!variants.includes(block.variant))errors.push(`Unsupported variant for ${block.type}: ${block.variant}`);

    if(production&&manifest?.status!=='approved'){
      errors.push(`Block type is not approved for production: ${block.type}`);
    }

    if(!block.id)warnings.push('Block id is empty.');
    if(block.enabled&&Object.keys(block.content||{}).length===0)warnings.push(`Block content is empty: ${block.type}`);

    return {ok:errors.length===0,errors,warnings,block,manifest,definition};
  }

  const registry={
    register(definition){
      if(!definition?.type||typeof definition.render!=='function'){
        throw new Error('Block definition requires type and render().');
      }
      const type=String(definition.type);
      definitions.set(type,Object.freeze({
        label:type,
        category:'content',
        status:'candidate',
        editorialProfile:'rich-text',
        referenceProfiles:[],
        variants:['default'],
        ...definition,
        type
      }));
      return definitions.get(type);
    },

    get(type){
      return definitions.get(String(type||''))||null;
    },

    getManifestEntry(type){
      return manifestEntry(type);
    },

    list(){
      return [...definitions.values()];
    },

    listApproved(){
      const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
      if(!manifest?.blocks)return [];
      return manifest.blocks.filter(item=>item.status==='approved');
    },

    validateUsage,

    canUseInProduction(type,variant){
      const input={id:'validation',type,variant:variant||manifestEntry(type)?.variants?.[0]||'default',content:{validation:true}};
      return validateUsage(input,{production:true}).ok;
    },

    render(input,context={}){
      const block=normalizeBlock(input);
      if(!block.enabled)return '';
      const definition=definitions.get(block.type);
      if(!definition){
        return `<section class="pb-block pb-block--unknown"><strong>등록되지 않은 블록</strong><code>${escapeHtml(block.type)}</code></section>`;
      }
      const variant=definition.variants.includes(block.variant)?block.variant:definition.variants[0];
      const normalized={
        ...block,
        variant,
        editorialProfile:block.editorialProfile||definition.editorialProfile,
        referenceProfiles:block.referenceProfiles.length?block.referenceProfiles:definition.referenceProfiles
      };
      return definition.render(normalized,{...context,escapeHtml,attrs,definition});
    },

    normalize:normalizeBlock,
    escapeHtml,
    attrs
  };

  window.PlatformBlockRegistry=registry;
})();