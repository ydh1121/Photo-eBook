(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderLateFrameBootstrapV1)return;
  window.__platformBuilderLateFrameBootstrapV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;

  function bootstrapIfMissed(){
    let doc=null;
    try{doc=frame.contentDocument;}catch{return;}
    if(!doc?.documentElement||doc.readyState!=='complete')return;
    if(doc.documentElement.dataset.platformBuilder==='true')return;
    frame.dispatchEvent(new Event('load'));
  }

  queueMicrotask(bootstrapIfMissed);
  setTimeout(bootstrapIfMissed,40);
  setTimeout(bootstrapIfMissed,180);
})();
