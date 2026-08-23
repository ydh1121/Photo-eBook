(function(){
  if(window.__platformBuilderRuntimeAuditLoaderV1)return;
  window.__platformBuilderRuntimeAuditLoaderV1=true;

  const frame=document.querySelector('#builderFrame');
  if(!frame)return;
  const PATCHES=[
    {src:'/ui-dashboard/sandbox/global-chip-runtime-v1.js?v=3',marker:'globalChipRuntimeV3'},
    {src:'/ui-dashboard/sandbox/filter-chip-specimens-v1.js?v=1',marker:'filterChipSpecimensV1'},
    {src:'/ui-dashboard/sandbox/runtime-audit-patch-v1.js?v=1',marker:'runtimeAuditPatchV1'},
    {src:'/ui-dashboard/sandbox/runtime-dynamic-config-guard-v1.js?v=1',marker:'runtimeDynamicConfigGuardV1'}
  ];

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

  function injectPatch(doc,patch){
    const selector=`script[data-${patch.marker.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}]`;
    if(doc.querySelector(selector))return;
    const script=doc.createElement('script');
    script.src=patch.src;
    script.dataset[patch.marker]='true';
    doc.head.appendChild(script);
  }

  function inject(){
    const doc=frame.contentDocument;
    if(!doc?.head)return;
    PATCHES.forEach(patch=>injectPatch(doc,patch));
    setTimeout(()=>ensureNativeScrollGuard(doc),40);
  }

  frame.addEventListener('load',()=>[0,80,260].forEach(delay=>setTimeout(inject,delay)));
  if(frame.contentDocument?.readyState==='complete')inject();
})();
