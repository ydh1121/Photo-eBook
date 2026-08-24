(function(){
  if(window.__platformFilterChipLegacyGuardV1)return;
  window.__platformFilterChipLegacyGuardV1=true;
  function guard(root){
    if(!root||root.querySelector(':scope > .platform-filter-chip-indicator'))return;
    const legacy=document.createElement('span');
    legacy.className='platform-filter-chip-indicator';
    legacy.setAttribute('aria-hidden','true');
    legacy.style.setProperty('display','none','important');
    root.prepend(legacy);
  }
  function apply(){document.querySelectorAll('.collection-filters[data-platform-chip-stage="true"]').forEach(guard);}
  new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.documentElement,{childList:true,subtree:true});
  [0,80,240,600].forEach(delay=>setTimeout(apply,delay));
})();
