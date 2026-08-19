(function(){
  const root=document.querySelector('.qa-page');
  const canvas=document.querySelector('#qaCanvas');
  const registry=window.PlatformBlockRegistry;
  const fixture=window.__VIDEO_EDITOR_QA_DRAFT;
  if(!root||!canvas||!registry||!fixture){
    if(canvas)canvas.innerHTML='<div class="qa-error">QA 데이터를 불러오지 못했습니다.</div>';
    return;
  }

  const blocks=Array.isArray(fixture.blocks)?fixture.blocks:[];
  const errors=[];
  const html=[];

  for(const block of blocks){
    const definition=registry.get(block.type);
    if(!definition){errors.push(`등록되지 않은 블록: ${block.type}`);continue;}
    try{html.push(registry.render(block,{qa:true}));}
    catch(error){errors.push(`${block.type}: ${error?.message||'렌더링 오류'}`);}
  }

  canvas.innerHTML=errors.length
    ?`<div class="qa-error">${errors.map(message=>`<div>${registry.escapeHtml(message)}</div>`).join('')}</div>`
    :`<main class="qa-flow">${html.join('')}</main>`;

  document.querySelectorAll('[data-qa-preview]').forEach(button=>{
    button.addEventListener('click',()=>{
      root.dataset.preview=button.dataset.qaPreview;
      document.querySelectorAll('[data-qa-preview]').forEach(item=>item.setAttribute('aria-pressed',item===button?'true':'false'));
    });
  });

  document.querySelectorAll('[data-qa-theme]').forEach(button=>{
    button.addEventListener('click',()=>{
      root.dataset.theme=button.dataset.qaTheme;
      document.querySelectorAll('[data-qa-theme]').forEach(item=>item.setAttribute('aria-pressed',item===button?'true':'false'));
    });
  });

  document.querySelectorAll('.pb-script-card .pb-copy-btn').forEach(button=>{
    button.addEventListener('click',async()=>{
      const card=button.closest('.pb-script-card');
      const value=card?.dataset.copyText||'';
      if(!value)return;
      try{
        await navigator.clipboard.writeText(value);
        const previous=button.textContent;
        button.textContent='복사됨';
        setTimeout(()=>button.textContent=previous,900);
      }catch{
        button.textContent='복사 실패';
        setTimeout(()=>button.textContent='복사',900);
      }
    });
  });
})();
