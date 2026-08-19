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
      content:block.content&&typeof block.content==='object'?block.content:{},
      evidence:Array.isArray(block.evidence)?block.evidence:[],
      aiPolicy:block.aiPolicy&&typeof block.aiPolicy==='object'?block.aiPolicy:{mode:'full'},
      revision:block.revision&&typeof block.revision==='object'?block.revision:{version:1}
    };
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

    list(){
      return [...definitions.values()];
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
