(function(){
  const params=new URLSearchParams(location.search);
  if(params.get('view')!=='library'||window.__platformGlobalChipKitV1)return;
  window.__platformGlobalChipKitV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const STORE='platformBuilderCapabilityConfigsV2';

  function read(){
    try{
      const all=JSON.parse(localStorage.getItem(STORE)||'{}');
      return all&&typeof all==='object'&&!Array.isArray(all)?all['filter-chip-rail']||null:null;
    }catch{return null;}
  }
  function post(message){try{frame.contentWindow?.postMessage(message,location.origin);}catch{}}
  function sync(){
    post({type:'platform-ui-reset',capabilityId:'filter-chip-rail'});
    const config=read();
    if(config&&Object.keys(config).length)post({type:'platform-ui-config',capabilityId:'filter-chip-rail',config});
  }
  function annotate(){
    const active=document.querySelector('[data-kit-ui][aria-pressed="true"]')?.dataset.kitUi;
    const hint=document.querySelector('#kitHint');
    if(!hint)return;
    const next=active==='top-chapter-navigation'
      ?'메뉴 고정·진행·배치만 관리합니다. 칩 디자인은 범용 필터칩에서 플랫폼 공통으로 관리합니다.'
      :active==='filter-chip-rail'
        ?'하단 팝업의 실제 필터칩을 기준으로 하며, 변경값은 상단 메뉴를 포함한 플랫폼 공통 칩에 적용됩니다.'
        :'공개 페이지와 같은 UI 런타임을 사용합니다.';
    if(hint.textContent!==next)hint.textContent=next;
  }

  frame.addEventListener('load',()=>[60,220,620].forEach(delay=>setTimeout(sync,delay)));
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type==='platform-preview-ready')setTimeout(sync,40);
  });
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    if(target.closest('[data-kit-ui],[data-kit-theme],[data-kit-viewport],[data-kit-mode],[data-kit-reset]')){
      [40,160,420].forEach(delay=>setTimeout(()=>{sync();annotate();},delay));
    }
  },true);

  const observer=new MutationObserver(()=>queueMicrotask(annotate));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  [80,260,720].forEach(delay=>setTimeout(()=>{sync();annotate();},delay));
})();
