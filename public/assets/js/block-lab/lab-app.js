(function(){
  const registry=window.PlatformBlockRegistry;
  const source=Array.isArray(window.__BLOCK_LAB_DATA)?window.__BLOCK_LAB_DATA:[];
  if(!registry)return;

  const root=document.querySelector('.block-lab');
  const nav=document.querySelector('#labNav');
  const specimens=document.querySelector('#labSpecimens');
  const count=document.querySelector('#labCount');
  const categorySelect=document.querySelector('#labCategory');
  if(!root||!nav||!specimens)return;

  const blocks=source.map(block=>registry.normalize(block));
  const state={
    category:'all',
    theme:'light',
    preview:'fluid',
    variants:new Map(blocks.map(block=>[block.id,block.variant]))
  };

  function blockDefinition(block){
    return registry.get(block.type);
  }

  function categoryLabel(category){
    return ({foundation:'기본',content:'콘텐츠',data:'비교·데이터',media:'미디어',action:'실행',resource:'자료'})[category]||category;
  }

  function specimenMarkup(block,index){
    const def=blockDefinition(block);
    if(!def)return '';
    const variant=state.variants.get(block.id)||def.variants[0];
    const current={...block,variant};
    return `<article class="lab-specimen" id="specimen-${registry.escapeHtml(block.id)}" data-category="${registry.escapeHtml(def.category)}">
      <header class="lab-specimen__head">
        <div class="lab-specimen__index">${String(index+1).padStart(2,'0')}</div>
        <div class="lab-specimen__meta">
          <strong>${registry.escapeHtml(def.label)}</strong>
          <div><span>${registry.escapeHtml(block.type)}</span><span>${registry.escapeHtml(categoryLabel(def.category))}</span><span>${registry.escapeHtml(block.status)}</span><span>${registry.escapeHtml(block.editorialProfile||def.editorialProfile)}</span></div>
        </div>
        <div class="lab-specimen__tools">
          <label class="sr-only" for="variant-${registry.escapeHtml(block.id)}">Variant</label>
          <select class="lab-variant" id="variant-${registry.escapeHtml(block.id)}" data-variant-for="${registry.escapeHtml(block.id)}">${def.variants.map(value=>`<option value="${registry.escapeHtml(value)}" ${value===variant?'selected':''}>${registry.escapeHtml(value)}</option>`).join('')}</select>
        </div>
      </header>
      <div class="lab-specimen__stage"><div class="lab-specimen__canvas">${registry.render(current,{lab:true})}</div></div>
    </article>`;
  }

  function bindEnhancements(){
    if(typeof window.bindBlockLabEnhancements==='function')window.bindBlockLabEnhancements();
  }

  function render(){
    specimens.innerHTML=blocks.map(specimenMarkup).join('')||'<div class="lab-empty">등록된 블록이 없습니다.</div>';
    nav.innerHTML=blocks.map((block,index)=>{
      const def=blockDefinition(block);
      if(!def)return '';
      return `<a href="#specimen-${registry.escapeHtml(block.id)}" data-nav-category="${registry.escapeHtml(def.category)}"><b>${String(index+1).padStart(2,'0')}</b><span>${registry.escapeHtml(def.label)}</span></a>`;
    }).join('');
    applyFilter();
    bindSpecimenControls();
    bindCopyButtons();
    bindEnhancements();
  }

  function applyFilter(){
    let visible=0;
    document.querySelectorAll('.lab-specimen').forEach(node=>{
      const show=state.category==='all'||node.dataset.category===state.category;
      node.hidden=!show;
      if(show)visible+=1;
    });
    document.querySelectorAll('.lab-nav a').forEach(node=>{
      node.hidden=!(state.category==='all'||node.dataset.navCategory===state.category);
    });
    if(count)count.textContent=`${visible} / ${blocks.length} blocks`;
  }

  function bindSpecimenControls(){
    document.querySelectorAll('[data-variant-for]').forEach(select=>{
      select.addEventListener('change',()=>{
        const id=select.dataset.variantFor;
        const block=blocks.find(item=>item.id===id);
        if(!block)return;
        state.variants.set(id,select.value);
        const canvas=select.closest('.lab-specimen')?.querySelector('.lab-specimen__canvas');
        if(canvas)canvas.innerHTML=registry.render({...block,variant:select.value},{lab:true});
        bindCopyButtons();
        bindEnhancements();
      });
    });
  }

  function bindCopyButtons(){
    document.querySelectorAll('.pb-script-card .pb-copy-btn').forEach(button=>{
      if(button.dataset.bound==='true')return;
      button.dataset.bound='true';
      button.addEventListener('click',async()=>{
        const card=button.closest('.pb-script-card');
        const value=card?.dataset.copyText||'';
        if(!value)return;
        try{
          await navigator.clipboard.writeText(value);
          const old=button.textContent;
          button.textContent='복사됨';
          setTimeout(()=>button.textContent=old,900);
        }catch{
          button.textContent='복사 실패';
          setTimeout(()=>button.textContent='복사',900);
        }
      });
    });
  }

  function bindTopControls(){
    document.querySelectorAll('[data-theme-value]').forEach(button=>{
      button.addEventListener('click',()=>{
        state.theme=button.dataset.themeValue;
        root.dataset.theme=state.theme;
        document.querySelectorAll('[data-theme-value]').forEach(item=>item.setAttribute('aria-pressed',item===button?'true':'false'));
      });
    });

    document.querySelectorAll('[data-preview-value]').forEach(button=>{
      button.addEventListener('click',()=>{
        state.preview=button.dataset.previewValue;
        root.dataset.preview=state.preview;
        document.querySelectorAll('[data-preview-value]').forEach(item=>item.setAttribute('aria-pressed',item===button?'true':'false'));
      });
    });

    categorySelect?.addEventListener('change',()=>{
      state.category=categorySelect.value;
      applyFilter();
    });
  }

  bindTopControls();
  render();
})();
