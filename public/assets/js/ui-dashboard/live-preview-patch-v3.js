(function(){
  const workspace=document.querySelector('#uiWorkspace');
  if(!workspace)return;
  let scheduled=false;

  function controlValue(id){
    const input=workspace.querySelector(`[data-ui-control="${CSS.escape(id)}"]`);
    if(!input)return null;
    if(input.type==='checkbox')return input.checked;
    return input.value;
  }

  function enhance(){
    scheduled=false;
    const nav=workspace.querySelector('.ui-demo-nav');
    if(!nav)return;
    const enabled=controlValue('enabled');
    const family=String(controlValue('chipFamily')||'ios-liquid');
    const mobileGap=Number(controlValue('mobileChipGap')||6);
    const desktopGap=Number(controlValue('desktopChipGap')||9);
    nav.dataset.family=family;
    nav.dataset.disabled=enabled===false?'true':'false';
    nav.style.setProperty('--demo-chip-gap-mobile',`${mobileGap}px`);
    nav.style.setProperty('--demo-chip-gap-desktop',`${desktopGap}px`);
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance);}
  new MutationObserver(schedule).observe(workspace,{childList:true,subtree:true});
  workspace.addEventListener('input',schedule,true);
  workspace.addEventListener('change',schedule,true);
  schedule();
})();
