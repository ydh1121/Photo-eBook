(function(){
  const frame=document.querySelector('#builderFrame');
  const status=document.querySelector('#builderFrameStatus');
  const edit=document.querySelector('#builderEditToggle');

  function normalizeEditLabel(){
    if(!edit)return;
    edit.textContent=edit.getAttribute('aria-pressed')==='true'?'편집 중':'미리보기';
  }

  function normalizeFrameCopy(){
    const doc=frame?.contentDocument;if(!doc)return;
    doc.querySelectorAll('.platform-builder-ad span').forEach(node=>{
      if(/실제 페이지 흐름/.test(node.textContent||''))node.textContent='더미 페이지 흐름에서 위치와 크기를 검토합니다.';
    });
  }

  edit?.addEventListener('click',()=>queueMicrotask(normalizeEditLabel));
  frame?.addEventListener('load',()=>{
    if(status&&!status.hidden)status.textContent='더미 UI를 찾는 중';
    [80,500,1400].forEach(delay=>setTimeout(normalizeFrameCopy,delay));
  });
  normalizeEditLabel();
})();