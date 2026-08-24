(function(){
  if(window.__platformEditorModuleFrameBridgeV2)return;
  window.__platformEditorModuleFrameBridgeV2=true;

  const STORAGE_KEY='platformEditorLabDraftV1';
  const MODULE_DEFAULTS_KEY='platformModuleDefaultsV1';
  const canvas=document.getElementById('editorCanvas');
  const root=document.querySelector('.editor-lab');
  const modules=window.PlatformModuleRegistry;
  if(!canvas||!root)return;

  function state(){try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return parsed&&Array.isArray(parsed.blocks)?parsed:null;}catch{return null;}}
  function moduleDefaults(){try{const value=JSON.parse(localStorage.getItem(MODULE_DEFAULTS_KEY)||'{}');return value&&typeof value==='object'?value:{};}catch{return {};}}
  function styleFor(moduleId,block){const baseline=modules?.get(moduleId)?.styleDefaults||{};return {...baseline,...(moduleDefaults()[moduleId]||{}),...(block?.styleOverrides||{})};}
  function payloadFor(frame){
    const blockId=frame.closest('[data-editor-block]')?.dataset.editorBlock||'';
    const moduleId=frame.dataset.platformEditorModuleFrame||'';
    const page=state();
    const block=page?.blocks?.find(item=>String(item.id)===String(blockId));
    if(!block||block.type!=='ui-module'||String(block.variant)!==moduleId)return null;
    return {moduleId,props:block.content&&typeof block.content==='object'?block.content:{},styleConfig:styleFor(moduleId,block)};
  }
  function sync(frame){
    if(!(frame instanceof HTMLIFrameElement))return;
    const payload=payloadFor(frame);if(!payload)return;
    try{frame.contentWindow?.postMessage({type:'platform-theme',theme:root.dataset.theme||'light'},location.origin);frame.contentWindow?.postMessage({type:'platform-editor-module-props',...payload},location.origin);}catch{}
  }
  function prepare(frame){if(!(frame instanceof HTMLIFrameElement)||frame.dataset.platformBridgeBound==='true')return;frame.dataset.platformBridgeBound='true';frame.addEventListener('load',()=>setTimeout(()=>sync(frame),20));setTimeout(()=>sync(frame),80);}
  function scan(){canvas.querySelectorAll('[data-platform-editor-module-frame]').forEach(prepare);}
  new MutationObserver(scan).observe(canvas,{childList:true,subtree:true});scan();
})();
