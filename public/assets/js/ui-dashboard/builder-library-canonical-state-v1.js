(function(){
  if(new URLSearchParams(location.search).get('view')!=='library')return;
  if(window.__platformLibraryCanonicalStateV1)return;
  window.__platformLibraryCanonicalStateV1=true;

  const KEY='platformBuilderKitStateV2';
  function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function write(value){try{localStorage.setItem(KEY,JSON.stringify(value));}catch{}}
  function resetBottomSheet(){const all=read();all['collection-bottom-sheet']='all';write(all);}
  function resetDevice(){const all=read();all['device-handoff-accordion']='collapsed';write(all);}
  function canonicalFor(id){if(id==='collection-bottom-sheet')resetBottomSheet();else if(id==='device-handoff-accordion')resetDevice();}

  canonicalFor(new URL(location.href).searchParams.get('ui'));
  document.addEventListener('pointerdown',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-kit-ui]'):null;
    if(button)canonicalFor(button.dataset.kitUi||'');
  },true);
})();
