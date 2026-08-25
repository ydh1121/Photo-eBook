(function(){
  if(window.__platformLibraryControlPolishV1)return;
  window.__platformLibraryControlPolishV1=true;

  const LABELS={
    'system-sans':'시스템 산세리프',
    'apple-sans':'Apple 산세리프',
    'korean-sans':'한글 산세리프',
    'rounded-sans':'라운드 산세리프'
  };
  const FAMILY_LABELS={
    'ios-liquid':'iOS 리퀴드',
    'ios-flat':'iOS 플랫',
    'material-flat':'Material 3 Expressive'
  };
  const STYLE_KEY='platformModuleDefaultsV1';

  function readStyles(){
    try{
      const value=JSON.parse(localStorage.getItem(STYLE_KEY)||'{}');
      return value&&typeof value==='object'?value:{};
    }catch{return {};}
  }

  function relabel(root=document){
    root.querySelectorAll('select[data-style-control] option').forEach(option=>{
      const label=LABELS[option.value];
      if(label&&option.textContent!==label)option.textContent=label;
    });
  }

  function syncFilterApplicability(root=document){
    const family=root.querySelector('select[data-style-control="family"]');
    const blur=root.querySelector('input[data-style-control="blur"]');
    if(!family||!blur)return;
    const material=family.value==='material-flat';
    if(blur.disabled!==material)blur.disabled=material;
    const label=blur.closest('.builder-control');
    if(label){
      const unavailable=String(material);
      if(label.dataset.controlUnavailable!==unavailable)label.dataset.controlUnavailable=unavailable;
      const title=material?'Material 3 Expressive 스타일은 배경 블러 대신 tonal surface를 사용합니다.':'';
      if(label.title!==title)label.title=title;
    }
  }

  function syncSelectorFamilies(root=document){
    const styles=readStyles();
    const entries=[
      ['top-chapter-navigation','상단 메뉴','chipFamily','ios-liquid'],
      ['filter-chip-rail','범용 필터칩','family','ios-liquid']
    ];
    for(const [id,base,key,fallback] of entries){
      const button=root.querySelector(`[data-kit-ui="${id}"]`);
      if(!button)continue;
      const family=styles?.[id]?.[key]||fallback;
      const next=`${base} · ${FAMILY_LABELS[family]||family}`;
      if(button.textContent!==next)button.textContent=next;
      button.dataset.activeFamily=family;
    }
  }

  function sync(){
    syncSelectorFamilies(document);
    const inspector=document.querySelector('.builder-kit-inspector:not([hidden])');
    if(!inspector)return;
    relabel(inspector);
    syncFilterApplicability(inspector);
  }

  document.addEventListener('change',event=>{
    if(event.target?.matches?.('select[data-style-control="family"],select[data-style-control="chipFamily"]'))requestAnimationFrame(sync);
  },true);

  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  sync();
})();