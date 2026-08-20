(function(){
  if(window.__platformBuilderAuditEntryV1)return;
  window.__platformBuilderAuditEntryV1=true;
  const library=new URLSearchParams(location.search).get('view')==='library';
  const sources=library
    ?['/assets/js/ui-dashboard/builder-library-audit-v1.js?v=1']
    :[
      '/assets/js/ui-dashboard/builder-v1.js?v=1',
      '/assets/js/ui-dashboard/builder-production-parity-v1.js?v=2',
      '/assets/js/ui-dashboard/builder-ux-patch-v3.js?v=3',
      '/assets/js/ui-dashboard/builder-boundaries-v1.js?v=1',
      '/assets/js/ui-dashboard/builder-page-audit-v1.js?v=2',
      '/assets/js/ui-dashboard/builder-sandbox-ads-v1.js?v=4'
    ];
  let index=0;
  function loadNext(){
    if(index>=sources.length)return;
    const script=document.createElement('script');
    script.src=sources[index++];
    script.async=false;
    script.onload=loadNext;
    script.onerror=loadNext;
    document.head.appendChild(script);
  }
  loadNext();
})();
