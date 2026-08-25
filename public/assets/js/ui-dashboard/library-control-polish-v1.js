(function(){
  if(window.__platformLibraryControlPolishV1)return;
  window.__platformLibraryControlPolishV1=true;

  const LABELS={
    'system-sans':'시스템 산세리프',
    'apple-sans':'Apple 산세리프',
    'korean-sans':'한글 산세리프',
    'rounded-sans':'라운드 산세리프'
  };

  function relabel(root=document){
    root.querySelectorAll('select[data-style-control] option').forEach(option=>{
      const label=LABELS[option.value];
      if(label)option.textContent=label;
    });
  }

  function syncFilterApplicability(root=document){
    const family=root.querySelector('select[data-style-control="family"]');
    const blur=root.querySelector('input[data-style-control="blur"]');
    if(!family||!blur)return;
    const material=family.value==='material-flat';
    blur.disabled=material;
    const label=blur.closest('.builder-control');
    if(label){
      label.dataset.controlUnavailable=String(material);
      label.title=material?'Material 스타일은 배경 블러를 사용하지 않습니다.':'';
    }
  }

  function sync(){
    const inspector=document.querySelector('.builder-kit-inspector:not([hidden])');
    if(!inspector)return;
    relabel(inspector);
    syncFilterApplicability(inspector);
  }

  document.addEventListener('change',event=>{
    if(event.target?.matches?.('select[data-style-control="family"]'))requestAnimationFrame(sync);
  },true);

  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  sync();
})();
