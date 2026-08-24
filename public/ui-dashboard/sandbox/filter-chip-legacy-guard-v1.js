(function(){
  if(window.__platformFilterChipLegacyGuardV1)return;
  window.__platformFilterChipLegacyGuardV1=true;
  function installStyle(){
    if(document.querySelector('#platform-filter-float-skin-parity'))return;
    const style=document.createElement('style');
    style.id='platform-filter-float-skin-parity';
    style.textContent=`
      html .platform-filter-chip-float>.v37-liquid-skin{
        background:
          linear-gradient(180deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,0) 34%),
          linear-gradient(180deg,var(--platform-chip-liquid-top,rgba(102,157,248,.94)) 0%,var(--platform-chip-liquid-mid,rgba(67,124,231,.92)) 52%,var(--platform-chip-liquid-bottom,rgba(44,91,202,.94)) 100%)!important;
        box-shadow:0 5px 14px var(--platform-chip-liquid-shadow,rgba(35,82,176,.22)),inset 0 1px 0 rgba(255,255,255,.30),inset 0 -1px 0 rgba(18,58,146,.13)!important
      }
    `;
    document.head.appendChild(style);
  }
  function guard(root){
    if(!root||root.querySelector(':scope > .platform-filter-chip-indicator'))return;
    const legacy=document.createElement('span');
    legacy.className='platform-filter-chip-indicator';
    legacy.setAttribute('aria-hidden','true');
    legacy.style.setProperty('display','none','important');
    root.prepend(legacy);
  }
  function cleanupStages(){
    document.querySelectorAll('.platform-filter-chip-stage').forEach(stage=>{
      if(!stage.querySelector(':scope > .collection-filters'))stage.remove();
    });
  }
  function apply(){installStyle();cleanupStages();document.querySelectorAll('.collection-filters[data-platform-chip-stage="true"]').forEach(guard);}
  new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.documentElement,{childList:true,subtree:true});
  [0,80,240,600].forEach(delay=>setTimeout(apply,delay));
})();
