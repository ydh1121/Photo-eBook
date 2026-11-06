(function(){
  const registry=window.PlatformModuleRegistry;
  if(!registry)return;
  let pickerMount=null;
  function install(){
    const hero=document.querySelector('#app .hero');if(!hero)return false;
    const currentId=window.getContentPack?.()?.id||'photography';
    const props={items:window.PersonalEduSubjects||[],currentId};
    if(!hero.querySelector('[data-platform-module="subject-navigation"]')){
      const host=document.createElement('div');hero.prepend(host);
      registry.mount(host,'subject-navigation',{...props,instanceId:'subjectTop',view:'bar',placement:'hero'},{consumer:'public'});
    }
    if(!pickerMount){
      const host=document.createElement('div');host.id='subjectNavigationHost';document.body.appendChild(host);
      pickerMount=registry.mount(host,'subject-navigation',{...props,instanceId:'subject',view:'picker'},{consumer:'public'});
    }
    return true;
  }
  if(!install()){
    const app=document.getElementById('app');
    if(app){const observer=new MutationObserver(()=>{if(install())observer.disconnect();});observer.observe(app,{childList:true});}
  }
  document.addEventListener('content-pack-rendered',install);
})();
