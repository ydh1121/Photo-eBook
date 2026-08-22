(function(){
  if(window.__platformSandboxDynamicConfigGuardV1)return;
  window.__platformSandboxDynamicConfigGuardV1=true;

  const configs=new Map();
  let raf=0;
  const $=(selector)=>document.querySelector(selector);
  const $$=(selector)=>[...document.querySelectorAll(selector)];
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);

  function setHidden(selector,hidden){
    $$(selector).forEach(node=>{node.hidden=Boolean(hidden);});
  }

  function applyBottomSheet(config){
    if(!config)return;
    const sheet=$('#collectionSheet');
    const backdrop=$('#collectionBackdrop');
    if(has(config,'enabled')&&config.enabled===false){
      if(sheet)sheet.hidden=true;
      if(backdrop)backdrop.hidden=true;
    }
    if(has(config,'backdrop')&&backdrop)backdrop.hidden=config.backdrop===false;
    if(has(config,'tabs'))setHidden('.collection-tabs',config.tabs===false);
    if(has(config,'search'))setHidden('.collection-search',config.search===false);
    if(has(config,'filters'))setHidden('#collectionFilters',config.filters===false);
    if(has(config,'themeSelector'))setHidden('.theme-setting-card',config.themeSelector===false);
    if(has(config,'deviceHandoff')){
      setHidden('.collection-device-accordion',config.deviceHandoff===false);
      setHidden('#collectionDeviceLink',config.deviceHandoff===false);
    }
    if(has(config,'bulkSelection')&&config.bulkSelection===false){
      setHidden('.collection-select-toggle,.collection-bulkbar',true);
    }
  }

  function applyDevice(config){
    if(!config||!has(config,'enabled'))return;
    setHidden('.collection-device-accordion',config.enabled===false);
  }

  function restoreBottomSheet(){
    setHidden('.collection-tabs,.collection-search,#collectionFilters,.theme-setting-card,.collection-device-accordion,#collectionDeviceLink',false);
  }

  function restoreDevice(){
    setHidden('.collection-device-accordion',false);
  }

  function applyAll(){
    raf=0;
    applyBottomSheet(configs.get('collection-bottom-sheet'));
    applyDevice(configs.get('device-handoff-accordion'));
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(applyAll);}

  window.addEventListener('message',event=>{
    if(event.origin!==location.origin)return;
    const data=event.data||{};
    if(data.type==='platform-ui-config'&&data.capabilityId){
      configs.set(data.capabilityId,{...(data.config||{})});
      schedule();
      setTimeout(schedule,80);
      setTimeout(schedule,260);
      return;
    }
    if(data.type==='platform-ui-reset'&&data.capabilityId){
      configs.delete(data.capabilityId);
      if(data.capabilityId==='collection-bottom-sheet')restoreBottomSheet();
      if(data.capabilityId==='device-handoff-accordion')restoreDevice();
      schedule();
      return;
    }
    if(data.type==='platform-kit-state'){
      schedule();
      setTimeout(schedule,80);
      setTimeout(schedule,260);
    }
  });

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
