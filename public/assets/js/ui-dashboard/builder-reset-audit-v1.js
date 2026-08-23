(function(){
  if(new URLSearchParams(location.search).get('view')==='library')return;
  if(window.__platformBuilderResetAuditV1)return;
  window.__platformBuilderResetAuditV1=true;

  const reset=document.querySelector('#builderResetPage');
  if(!reset)return;
  const KEYS=[
    'platformBuilderLayoutV1',
    'platformBuilderCapabilityConfigsV1',
    'platformBuilderCapabilityConfigsV2',
    'platformBuilderSideAdsV1'
  ];

  reset.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    for(const key of KEYS){try{localStorage.removeItem(key);}catch{}}
    document.querySelectorAll('[data-close-inspector],[data-close-ad-inspector]').forEach(button=>{
      try{button.click();}catch{}
    });
    const status=document.querySelector('#builderFrameStatus');
    if(status){status.hidden=false;status.textContent='더미 화면을 초기화하는 중';}
    setTimeout(()=>location.reload(),20);
  },true);
})();
