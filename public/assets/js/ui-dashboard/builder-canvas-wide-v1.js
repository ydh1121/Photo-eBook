(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderCanvasWideV1)return;
  window.__platformBuilderCanvasWideV1=true;

  const toolbar=document.querySelector('.builder-toolbar');
  if(!toolbar)return;
  const KEY='platformBuilderCanvasWideV1';
  let wide=false;
  try{wide=sessionStorage.getItem(KEY)==='true';}catch{}

  function apply(){
    document.documentElement.dataset.adminCanvasWide=String(wide);
    let button=document.querySelector('#builderCanvasWideToggle');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.id='builderCanvasWideToggle';
      button.className='builder-toggle builder-canvas-wide-toggle';
      const right=toolbar.querySelector('.builder-toolbar__group--right');
      toolbar.insertBefore(button,right||null);
      button.addEventListener('click',()=>{wide=!wide;try{sessionStorage.setItem(KEY,String(wide));}catch{}apply();});
    }
    button.setAttribute('aria-pressed',String(wide));
    button.textContent=wide?'메뉴 보이기':'캔버스 넓게';
    button.setAttribute('title',wide?'좌측 관리 메뉴를 다시 표시합니다.':'좌측 관리 메뉴를 접어 광고와 전체 폭을 확인합니다.');
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
    setTimeout(()=>window.dispatchEvent(new Event('resize')),220);
  }

  window.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!wide)return;
    if(document.querySelector('.builder-inspector:not([hidden]),.builder-block-palette[aria-hidden="false"]'))return;
    wide=false;try{sessionStorage.setItem(KEY,'false');}catch{}apply();
  });

  apply();
})();
