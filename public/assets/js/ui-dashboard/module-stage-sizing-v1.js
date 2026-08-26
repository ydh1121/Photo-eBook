(function(){
  if(window.__platformModuleStageSizingV1)return;
  window.__platformModuleStageSizingV1=true;

  const SPEC={
    'top-chapter-navigation':{desktop:460,mobile:430},
    'horizontal-card-rail':{desktop:720,mobile:680},
    'filter-chip-rail':{desktop:300,mobile:280},
    'collection-bottom-sheet':{desktop:940,mobile:860},
    'device-handoff-accordion':{desktop:740,mobile:740},
    'floating-action':{desktop:430,mobile:430},
    'horizontal-rail':{desktop:650,mobile:610},
    'accordion':{desktop:680,mobile:640},
    'bottom-sheet':{desktop:820,mobile:780}
  };

  function apply(){
    const workspace=document.querySelector('.builder-kit-workspace');
    const shell=document.querySelector('#builderCanvasShell.builder-kit-frame-shell');
    const frame=document.querySelector('#builderFrame');
    if(!workspace||!shell||!frame)return false;
    const id=workspace.dataset.activeUi||'top-chapter-navigation';
    const viewport=workspace.dataset.viewport==='mobile'?'mobile':'desktop';
    const px=SPEC[id]?.[viewport]||560;
    shell.style.setProperty('--kit-preview-height',`${px}px`);
    shell.style.setProperty('height',`${px}px`,'important');
    shell.style.setProperty('min-height',`${px}px`,'important');
    frame.style.setProperty('height','100%','important');
    frame.style.setProperty('min-height','0','important');
    return true;
  }

  function install(){
    const workspace=document.querySelector('.builder-kit-workspace');
    if(!workspace){setTimeout(install,40);return;}
    apply();
    new MutationObserver(apply).observe(workspace,{attributes:true,attributeFilter:['data-active-ui','data-viewport']});
    window.addEventListener('resize',apply,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
