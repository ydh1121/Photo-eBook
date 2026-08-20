(function(){
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const fab=$('#collectionFab');
  const openInline=$('#sandboxOpenCollection');
  const backdrop=$('#collectionBackdrop');
  const sheet=$('#collectionSheet');
  const close=$('#collectionClose');
  const tabs=$$('.collection-tab');
  const filters=$$('.collection-filter');
  const tools=$('#sandboxCollectionTools');
  const list=$('#sandboxCollectionList');
  const settings=$('#sandboxSettings');
  const accordion=$('#sandboxDeviceAccordion');
  const deviceLink=$('#collectionDeviceLink');
  let lockedY=0;
  let closeTimer=0;

  function lockScroll(){
    lockedY=window.scrollY||0;
    document.documentElement.classList.add('collection-open');
    document.body.classList.add('collection-open');
    document.body.style.top=`-${lockedY}px`;
  }

  function unlockScroll(){
    document.documentElement.classList.remove('collection-open');
    document.body.classList.remove('collection-open');
    document.body.style.top='';
    window.scrollTo(0,lockedY);
  }

  function openCollection(){
    if(!sheet||!backdrop)return;
    clearTimeout(closeTimer);
    lockScroll();
    backdrop.hidden=false;
    sheet.hidden=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('is-open')));
  }

  function closeCollection(){
    if(!sheet||!backdrop)return;
    sheet.classList.remove('is-open');
    backdrop.hidden=true;
    clearTimeout(closeTimer);
    closeTimer=setTimeout(()=>{sheet.hidden=true;unlockScroll();},210);
  }

  fab?.addEventListener('click',openCollection);
  openInline?.addEventListener('click',openCollection);
  close?.addEventListener('click',closeCollection);
  backdrop?.addEventListener('click',closeCollection);

  tabs.forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.sandboxTab||'all';
    tabs.forEach(item=>item.classList.toggle('is-active',item===button));
    const isSettings=value==='settings';
    if(tools)tools.hidden=isSettings;
    if(list)list.hidden=isSettings;
    if(settings)settings.hidden=!isSettings;
  }));

  filters.forEach(button=>button.addEventListener('click',()=>{
    filters.forEach(item=>item.classList.toggle('is-active',item===button));
  }));

  deviceLink?.addEventListener('click',()=>{
    const expanded=!accordion?.classList.contains('is-device-expanded');
    accordion?.classList.toggle('is-device-expanded',expanded);
    deviceLink.setAttribute('aria-expanded',String(expanded));
    const panel=accordion?.querySelector('.collection-device-panel-v2');
    if(panel)panel.hidden=!expanded;
  });

  $$('.collection-item__remove').forEach(button=>button.addEventListener('click',()=>{
    const item=button.closest('.collection-item');
    if(!item)return;
    item.style.opacity='.35';
    setTimeout(()=>{item.style.opacity='';},420);
  }));

  if(typeof window.setupNavigation==='function')window.setupNavigation();
  document.documentElement.dataset.builderSandbox='true';
})();
