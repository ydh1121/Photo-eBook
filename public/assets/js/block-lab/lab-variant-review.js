(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const meta=window.__PLATFORM_BLOCK_VARIANT_META;
  if(!manifest||!meta)return;

  const STORAGE_KEY='platformBlockVariantReviewV1';
  const LABELS={undecided:'미결정',approved:'승인',redesign:'재설계',merge:'통합',deprecated:'폐기'};
  const KIND_LABELS={structure:'구조',visual:'표현',behavior:'동작',responsive:'반응형'};
  const MATURITY_LABELS={implemented:'구현됨',partial:'부분 구현',placeholder:'미완성'};
  const valid=new Set(Object.keys(LABELS));

  function readState(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function writeState(value){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}catch{}}
  let state=readState();

  function review(type,variant){
    const item=state?.[type]?.[variant];
    return {
      decision:valid.has(item?.decision)?item.decision:'undecided',
      note:String(item?.note||''),
      updatedAt:item?.updatedAt||null
    };
  }

  function setReview(type,variant,patch){
    const next={...review(type,variant),...patch,updatedAt:new Date().toISOString()};
    state[type]={...(state[type]||{}),[variant]:next};
    writeState(state);
    refreshSpecimen(type);
    updateSummary();
  }

  function variantInfo(type,variant){
    const info=meta.blocks?.[type]?.[variant]||{};
    return {
      kind:meta.kinds.includes(info.kind)?info.kind:'visual',
      maturity:meta.maturity.includes(info.maturity)?info.maturity:'partial',
      summary:String(info.summary||'variant 차이를 검토하세요.')
    };
  }

  function optionMarkup(current){return Object.entries(LABELS).map(([value,label])=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`).join('');}

  function currentVariant(specimen){return specimen.querySelector('[data-variant-for]')?.value||'';}

  function panelMarkup(type,variants,current){
    const tabs=variants.map(variant=>{
      const item=review(type,variant);
      return `<button type="button" class="lab-variant-tab" data-variant-tab="${escapeHtml(variant)}" data-decision="${escapeHtml(item.decision)}" aria-pressed="${variant===current?'true':'false'}"><span>${escapeHtml(variant)}</span><i aria-hidden="true"></i></button>`;
    }).join('');
    return `<section class="lab-variant-review" data-variant-review-for="${escapeHtml(type)}">
      <div class="lab-variant-review__tabs">${tabs}</div>
      <div class="lab-variant-review__body" data-variant-review-body></div>
    </section>`;
  }

  function bodyMarkup(type,variant){
    const item=review(type,variant);
    const info=variantInfo(type,variant);
    return `<div class="lab-variant-review__meta">
      <span class="lab-variant-kind">${escapeHtml(KIND_LABELS[info.kind]||info.kind)}</span>
      <span class="lab-variant-maturity is-${escapeHtml(info.maturity)}">${escapeHtml(MATURITY_LABELS[info.maturity]||info.maturity)}</span>
      <strong>${escapeHtml(variant)}</strong>
      <p>${escapeHtml(info.summary)}</p>
    </div>
    <div class="lab-variant-review__controls">
      <label>variant 판정<select data-variant-decision="${escapeHtml(type)}::${escapeHtml(variant)}">${optionMarkup(item.decision)}</select></label>
      <label class="lab-variant-note-label">variant 메모<textarea rows="3" data-variant-note="${escapeHtml(type)}::${escapeHtml(variant)}" placeholder="이 디자인에서 고칠 점이나 유지할 점을 적어두세요.">${escapeHtml(item.note)}</textarea></label>
    </div>`;
  }

  function enhanceSpecimen(specimen){
    const type=specimen.dataset.blockType;
    const def=manifest.blocks.find(block=>block.type===type);
    if(!type||!def?.variants?.length)return;
    let panel=specimen.querySelector(`[data-variant-review-for="${CSS.escape(type)}"]`);
    if(!panel){
      const current=currentVariant(specimen)||def.variants[0];
      const host=document.createElement('div');
      host.innerHTML=panelMarkup(type,def.variants,current);
      panel=host.firstElementChild;
      const typeReview=specimen.querySelector('.lab-review-note');
      if(typeReview)typeReview.insertAdjacentElement('afterend',panel);
      else specimen.querySelector('.lab-specimen__head')?.insertAdjacentElement('afterend',panel);
    }
    renderCurrent(specimen);
    bindPanel(specimen);
  }

  function renderCurrent(specimen){
    const type=specimen.dataset.blockType;
    const def=manifest.blocks.find(block=>block.type===type);
    const variant=currentVariant(specimen)||def?.variants?.[0];
    const panel=specimen.querySelector('[data-variant-review-for]');
    if(!panel||!variant)return;
    panel.querySelectorAll('[data-variant-tab]').forEach(button=>{
      const active=button.dataset.variantTab===variant;
      button.setAttribute('aria-pressed',active?'true':'false');
      button.dataset.decision=review(type,button.dataset.variantTab).decision;
    });
    const body=panel.querySelector('[data-variant-review-body]');
    if(body)body.innerHTML=bodyMarkup(type,variant);
  }

  function bindPanel(specimen){
    if(specimen.dataset.variantReviewBound==='true')return;
    specimen.dataset.variantReviewBound='true';
    specimen.addEventListener('click',event=>{
      const button=event.target.closest('[data-variant-tab]');
      if(!button)return;
      const select=specimen.querySelector('[data-variant-for]');
      if(!select)return;
      select.value=button.dataset.variantTab;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      renderCurrent(specimen);
    });
    specimen.addEventListener('change',event=>{
      const select=event.target.closest('[data-variant-decision]');
      if(select){
        const [type,variant]=splitKey(select.dataset.variantDecision);
        setReview(type,variant,{decision:select.value});
        return;
      }
      if(event.target.matches('[data-variant-for]'))renderCurrent(specimen);
    });
    specimen.addEventListener('input',event=>{
      const textarea=event.target.closest('[data-variant-note]');
      if(!textarea)return;
      clearTimeout(textarea.__variantReviewTimer);
      textarea.__variantReviewTimer=setTimeout(()=>{
        const [type,variant]=splitKey(textarea.dataset.variantNote);
        setReview(type,variant,{note:textarea.value.trim()});
      },250);
    });
  }

  function refreshSpecimen(type){
    const specimen=document.querySelector(`.lab-specimen[data-block-type="${CSS.escape(type)}"]`);
    if(!specimen)return;
    renderCurrent(specimen);
  }

  function updateSummary(){
    const target=document.querySelector('#labVariantReviewSummary');
    if(!target)return;
    const counts={approved:0,redesign:0,merge:0,deprecated:0,undecided:0};
    let total=0;
    for(const block of manifest.blocks){
      for(const variant of block.variants||[]){counts[review(block.type,variant).decision]+=1;total+=1;}
    }
    target.textContent=`variant ${total}개 · 승인 ${counts.approved} · 재설계 ${counts.redesign} · 미결정 ${counts.undecided}`;
  }

  function installSummary(){
    if(document.querySelector('#labVariantReviewSummary'))return;
    const brand=document.querySelector('.lab-brand');
    if(!brand)return;
    const node=document.createElement('span');
    node.id='labVariantReviewSummary';
    node.className='lab-variant-review-summary';
    brand.appendChild(node);
  }

  function enhanceAll(){document.querySelectorAll('.lab-specimen').forEach(enhanceSpecimen);updateSummary();}

  function exportPayload(){
    const reviews=[];
    for(const block of manifest.blocks){
      for(const variant of block.variants||[]){
        const info=variantInfo(block.type,variant);
        reviews.push({type:block.type,variant,...review(block.type,variant),differenceType:info.kind,maturity:info.maturity});
      }
    }
    return reviews;
  }

  function replaceFromServer(items){
    const next=readState();
    for(const item of Array.isArray(items)?items:[]){
      const def=manifest.blocks.find(block=>block.type===item.type);
      if(!def?.variants?.includes(item.variant))continue;
      next[item.type]={...(next[item.type]||{}),[item.variant]:{
        decision:valid.has(item.decision)?item.decision:'undecided',
        note:String(item.note||''),
        updatedAt:item.updatedAt||null
      }};
    }
    state=next;writeState(state);
  }

  function splitKey(value){const index=String(value||'').indexOf('::');return index<0?['','']:[value.slice(0,index),value.slice(index+2)];}
  function escapeHtml(value=''){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}

  window.BlockLabVariantReview={enhanceAll,exportPayload,replaceFromServer,storageKey:STORAGE_KEY};
  installSummary();
  requestAnimationFrame(enhanceAll);
  document.addEventListener('blocklab:rendered',enhanceAll);
})();
