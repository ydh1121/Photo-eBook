(function(){
  const root=document.querySelector('.block-lab');
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  if(!root||!manifest)return;

  const STORAGE_KEY='platformBlockReviewV1';
  const LABELS={undecided:'미결정',approved:'승인',redesign:'재설계',merge:'통합',deprecated:'폐기'};
  const valid=new Set(manifest.decisions||Object.keys(LABELS));

  function readState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return parsed&&typeof parsed==='object'?parsed:{};
    }catch{return {};}
  }

  let state=readState();

  function normalizedReview(type){
    const current=state[type]&&typeof state[type]==='object'?state[type]:{};
    return {
      decision:valid.has(current.decision)?current.decision:'undecided',
      note:String(current.note||''),
      updatedAt:current.updatedAt||null
    };
  }

  function write(type,patch){
    state[type]={...normalizedReview(type),...patch,updatedAt:new Date().toISOString()};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    syncSpecimen(type);
    updateSummary();
    applyReviewFilter();
  }

  function decisionOptions(current){
    return Object.entries(LABELS).map(([value,label])=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`).join('');
  }

  function enhanceSpecimens(){
    document.querySelectorAll('.lab-specimen').forEach(specimen=>{
      const type=specimen.dataset.blockType;
      if(!type||specimen.dataset.reviewReady==='true')return;
      specimen.dataset.reviewReady='true';
      const review=normalizedReview(type);
      specimen.dataset.reviewDecision=review.decision;
      const tools=specimen.querySelector('.lab-specimen__tools');
      if(!tools)return;
      const wrap=document.createElement('div');
      wrap.className='lab-review-controls';
      wrap.innerHTML=`
        <label class="sr-only" for="review-${type}">검토 상태</label>
        <select class="lab-review-select" id="review-${type}" data-review-type="${type}">${decisionOptions(review.decision)}</select>
        <button type="button" class="lab-review-note-toggle" data-review-note-toggle="${type}" aria-expanded="${review.note?'true':'false'}">메모</button>`;
      tools.appendChild(wrap);

      const panel=document.createElement('div');
      panel.className='lab-review-note';
      panel.hidden=!review.note;
      panel.innerHTML=`<label for="note-${type}">검토 메모</label><textarea id="note-${type}" data-review-note="${type}" rows="3" placeholder="수정할 점이나 통합 대상을 적어두세요."></textarea>`;
      panel.querySelector('textarea').value=review.note;
      specimen.querySelector('.lab-specimen__head')?.insertAdjacentElement('afterend',panel);
    });

    document.querySelectorAll('[data-review-type]').forEach(select=>{
      if(select.dataset.bound==='true')return;
      select.dataset.bound='true';
      select.addEventListener('change',()=>write(select.dataset.reviewType,{decision:select.value}));
    });

    document.querySelectorAll('[data-review-note-toggle]').forEach(button=>{
      if(button.dataset.bound==='true')return;
      button.dataset.bound='true';
      button.addEventListener('click',()=>{
        const type=button.dataset.reviewNoteToggle;
        const specimen=button.closest('.lab-specimen');
        const panel=specimen?.querySelector('.lab-review-note');
        if(!panel)return;
        panel.hidden=!panel.hidden;
        button.setAttribute('aria-expanded',panel.hidden?'false':'true');
        if(!panel.hidden)panel.querySelector('textarea')?.focus();
      });
    });

    document.querySelectorAll('[data-review-note]').forEach(textarea=>{
      if(textarea.dataset.bound==='true')return;
      textarea.dataset.bound='true';
      let timer=null;
      textarea.addEventListener('input',()=>{
        clearTimeout(timer);
        timer=setTimeout(()=>write(textarea.dataset.reviewNote,{note:textarea.value.trim()}),250);
      });
    });
  }

  function syncSpecimen(type){
    const review=normalizedReview(type);
    const specimen=document.querySelector(`.lab-specimen[data-block-type="${CSS.escape(type)}"]`);
    if(!specimen)return;
    specimen.dataset.reviewDecision=review.decision;
    const select=specimen.querySelector('[data-review-type]');
    if(select&&select.value!==review.decision)select.value=review.decision;
  }

  function summary(){
    const counts={undecided:0,approved:0,redesign:0,merge:0,deprecated:0};
    for(const item of manifest.blocks){
      counts[normalizedReview(item.type).decision]+=1;
    }
    return counts;
  }

  function updateSummary(){
    const node=document.querySelector('#labReviewSummary');
    if(!node)return;
    const counts=summary();
    node.textContent=`승인 ${counts.approved} · 재설계 ${counts.redesign} · 통합 ${counts.merge} · 폐기 ${counts.deprecated} · 미결정 ${counts.undecided}`;
  }

  function applyReviewFilter(){
    const filter=document.querySelector('#labReviewFilter')?.value||'all';
    document.querySelectorAll('.lab-specimen').forEach(specimen=>{
      const categoryVisible=specimen.dataset.categoryVisible!=='false';
      const reviewVisible=filter==='all'||specimen.dataset.reviewDecision===filter;
      specimen.hidden=!(categoryVisible&&reviewVisible);
    });
    document.querySelectorAll('.lab-nav a').forEach(link=>{
      const type=link.dataset.blockType;
      const categoryVisible=link.dataset.categoryVisible!=='false';
      const reviewVisible=filter==='all'||normalizedReview(type).decision===filter;
      link.hidden=!(categoryVisible&&reviewVisible);
    });
  }

  function exportReview(){
    const payload={
      schema:'platform-block-review/v1',
      exportedAt:new Date().toISOString(),
      manifestVersion:manifest.version,
      reviews:manifest.blocks.map(item=>({type:item.type,...normalizedReview(item.type)}))
    };
    const json=JSON.stringify(payload,null,2);
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`platform-block-review-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    navigator.clipboard?.writeText(json).catch(()=>{});
    const button=document.querySelector('#labReviewExport');
    if(button){
      const old=button.textContent;
      button.textContent='내보냄';
      setTimeout(()=>button.textContent=old,900);
    }
  }

  function installTopControls(){
    const controls=document.querySelector('.lab-controls');
    if(!controls||document.querySelector('#labReviewFilter'))return;
    const filter=document.createElement('select');
    filter.id='labReviewFilter';
    filter.className='lab-filter lab-review-filter';
    filter.setAttribute('aria-label','검토 상태 필터');
    filter.innerHTML='<option value="all">검토 전체</option>'+Object.entries(LABELS).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    filter.addEventListener('change',applyReviewFilter);

    const exportButton=document.createElement('button');
    exportButton.type='button';
    exportButton.id='labReviewExport';
    exportButton.className='lab-review-export';
    exportButton.textContent='검토 내보내기';
    exportButton.addEventListener('click',exportReview);

    controls.prepend(exportButton);
    controls.prepend(filter);

    const brand=document.querySelector('.lab-brand');
    if(brand){
      const summaryNode=document.createElement('span');
      summaryNode.id='labReviewSummary';
      summaryNode.className='lab-review-summary';
      brand.appendChild(summaryNode);
    }
  }

  function showRegistryHealth(){
    const health=window.PlatformBlockRegistryHealth;
    const brand=document.querySelector('.lab-brand');
    if(!health||!brand)return;
    const node=document.createElement('span');
    node.className=`lab-registry-health ${health.ok?'is-ok':'is-error'}`;
    node.textContent=health.ok?`Registry ${health.runtimeCount}/${health.manifestCount} 정상`:`Registry 오류 ${health.errors.length}`;
    node.title=[...health.errors,...health.warnings].join('\n');
    brand.appendChild(node);
  }

  window.BlockLabReview={enhanceSpecimens,applyReviewFilter};
  installTopControls();
  enhanceSpecimens();
  updateSummary();
  showRegistryHealth();
})();
