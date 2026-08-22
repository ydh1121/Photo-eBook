(function(){
  if(window.__platformBuilderRuntimeAuditLoaderV1)return;
  window.__platformBuilderRuntimeAuditLoaderV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const SRC='/ui-dashboard/sandbox/runtime-audit-patch-v1.js?v=1';

  function inject(){
    const doc=frame.contentDocument;
    if(!doc?.head||doc.querySelector('script[data-runtime-audit-patch-v1]'))return;
    const script=doc.createElement('script');
    script.src=SRC;
    script.dataset.runtimeAuditPatchV1='true';
    doc.head.appendChild(script);
  }

  frame.addEventListener('load',()=>[0,80,260].forEach(delay=>setTimeout(inject,delay)));
  if(frame.contentDocument?.readyState==='complete')inject();
})();
