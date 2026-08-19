(function(){
  const manifest=window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
  const library=document.querySelector('#editorLibraryList');
  const search=document.querySelector('#editorLibrarySearch');
  if(!manifest||!library||!search)return;

  const blocks=Array.isArray(manifest.blocks)?manifest.blocks:[];
  const statusByType=new Map(blocks.map(item=>[item.type,item.status||'candidate']));
  const host=document.createElement('div');
  host.className='editor-library-status';
  host.innerHTML=`<label><span>블록 상태</span><select id="editorLibraryStatusFilter"><option value="all">전체</option><option value="approved">승인만</option><option value="candidate">후보만</option></select></label><small id="editorLibraryStatusSummary"></small>`;
  search.insertAdjacentElement('beforebegin',host);

  const select=host.querySelector('#editorLibraryStatusFilter');
  const summary=host.querySelector('#editorLibraryStatusSummary');
  const count=document.querySelector('#editorLibraryCount');
  const requested=new URLSearchParams(location.search).get('blockStatus');
  if(['all','approved','candidate'].includes(requested))select.value=requested;

  function counts(){
    const result={approved:0,candidate:0,other:0};
    for(const item of blocks){
      if(item.status==='approved')result.approved+=1;
      else if(item.status==='candidate')result.candidate+=1;
      else result.other+=1;
    }
    return result;
  }

  function apply(){
    const mode=select.value;
    let visible=0;
    library.querySelectorAll('[data-add-block]').forEach(button=>{
      const status=statusByType.get(button.dataset.addBlock)||'candidate';
      const show=mode==='all'||status===mode;
      button.hidden=!show;
      if(show)visible+=1;
    });
    if(count)count.textContent=String(visible);
    const total=counts();
    summary.textContent=`승인 ${total.approved} · 후보 ${total.candidate}${total.other?` · 기타 ${total.other}`:''}`;
    library.dataset.statusFilter=mode;
  }

  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;apply();});
  });
  observer.observe(library,{childList:true});

  select.addEventListener('change',apply);
  search.addEventListener('input',()=>queueMicrotask(apply));
  apply();
})();
