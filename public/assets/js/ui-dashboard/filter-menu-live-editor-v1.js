(function(){
  if(window.__platformFilterMenuLiveEditorV1)return;
  window.__platformFilterMenuLiveEditorV1=true;

  const KEY='platformModuleContentDefaultsV1';
  function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(value){try{localStorage.setItem(KEY,JSON.stringify(value));}catch{}}
  function labels(){return [...document.querySelectorAll('.builder-kit-inspector:not([hidden]) [data-menu-label]')].map((input,index)=>String(input.value||'').trim()||`메뉴 ${index+1}`);}
  function sync(){
    const items=labels();if(!items.length)return;
    const all=read();all['filter-chip-rail']={...(all['filter-chip-rail']||{}),items,activeId:'all'};write(all);
    const frame=document.querySelector('#builderFrame');
    try{frame?.contentWindow?.postMessage({type:'platform-module-props',moduleId:'filter-chip-rail',props:{items,activeId:'all'}},location.origin);}catch{}
  }
  document.addEventListener('input',event=>{if(event.target?.matches?.('.builder-kit-inspector [data-menu-label]'))sync();});
})();
