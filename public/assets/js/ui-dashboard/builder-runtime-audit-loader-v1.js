(function(){
  if(window.__platformBuilderRuntimeAuditLoaderV1)return;
  window.__platformBuilderRuntimeAuditLoaderV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const SRC='/ui-dashboard/sandbox/runtime-audit-patch-v1.js?v=1';

  function ensureNativeScrollGuard(doc){
    if(!doc?.head||doc.querySelector('#platform-sandbox-native-scroll-guard'))return;
    const style=doc.createElement('style');
    style.id='platform-sandbox-native-scroll-guard';
    style.textContent=`@media(min-width:1024px){
      .nav-scroll[data-builder-family="material-flat"],
      .nav-scroll[data-builder-family="ios-flat"]{
        overflow-x:auto!important;overflow-y:hidden!important;
        -webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important
      }
    }`;
    doc.head.appendChild(style);
  }

  function inject(){
    const doc=frame.contentDocument;
    if(!doc?.head)return;
    const existing=doc.querySelector('script[data-runtime-audit-patch-v1]');
    if(existing){
      existing.addEventListener('load',()=>ensureNativeScrollGuard(doc),{once:true});
      setTimeout(()=>ensureNativeScrollGuard(doc),40);
      return;
    }
    const script=doc.createElement('script');
    script.src=SRC;
    script.dataset.runtimeAuditPatchV1='true';
    script.addEventListener('load',()=>ensureNativeScrollGuard(doc),{once:true});
    doc.head.appendChild(script);
  }

  frame.addEventListener('load',()=>[0,80,260].forEach(delay=>setTimeout(inject,delay)));
  if(frame.contentDocument?.readyState==='complete')inject();
})();
