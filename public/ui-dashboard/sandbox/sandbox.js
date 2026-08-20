(function(){
  const $=(selector,root=document)=>root.querySelector(selector);
  const preview=new URLSearchParams(location.search).get('preview')||'';
  document.documentElement.dataset.builderSandbox='true';
  if(preview)document.documentElement.dataset.sandboxPreview=preview;

  function waitFor(selector,callback,attempt=0){
    const node=$(selector);if(node){callback(node);return;}
    if(attempt<50)setTimeout(()=>waitFor(selector,callback,attempt+1),80);
  }

  function clickTab(value){
    const tab=$(`.collection-tab[data-library-tab="${value}"]`);tab?.click();
  }
  function openCollection(tab='all',after){
    waitFor('#collectionFab',fab=>{
      fab.click();
      setTimeout(()=>{clickTab(tab);setTimeout(()=>after?.(),90);},80);
    });
  }

  function previewPortal(){
    let portal=$('#sandboxPreviewPortal');
    if(!portal){portal=document.createElement('main');portal.id='sandboxPreviewPortal';document.body.appendChild(portal);}
    return portal;
  }
  function cloneInto(selector){
    const source=$(selector);if(!source)return;
    const portal=previewPortal();portal.replaceChildren(source.cloneNode(true));
    portal.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  }

  function installPreviewMode(){
    if(!preview)return;
    const css=document.createElement('style');
    css.id='sandbox-preview-style';
    css.textContent=`
      html[data-sandbox-preview] body{min-height:100vh;background:#fff!important;overflow:auto!important}
      html[data-sandbox-preview] .sandbox-side-ad{display:none!important}
      html[data-sandbox-preview="top-chapter-navigation"] #app>*:not(.nav-shell),
      html[data-sandbox-preview="reading-progress"] #app>*:not(.nav-shell){display:none!important}
      html[data-sandbox-preview="top-chapter-navigation"] #app,
      html[data-sandbox-preview="reading-progress"] #app{min-height:150px!important;padding-top:28px!important;background:#fff!important}
      html[data-sandbox-preview="top-chapter-navigation"] .nav-shell,
      html[data-sandbox-preview="reading-progress"] .nav-shell{position:relative!important;top:auto!important;margin:0!important}
      html[data-sandbox-preview="horizontal-card-rail"] #app>*:not(#dummy-rail){display:none!important}
      html[data-sandbox-preview="horizontal-card-rail"] #dummy-rail>.chapter-hero,
      html[data-sandbox-preview="horizontal-card-rail"] #dummy-rail .section-heading{display:none!important}
      html[data-sandbox-preview="horizontal-card-rail"] #dummy-rail .section{padding:50px 0 70px!important;background:#fff!important}
      html[data-sandbox-preview="horizontal-card-rail"] #dummy-rail{padding-top:0!important;background:#fff!important}
      html[data-sandbox-preview="filter-chip-rail"] #app,
      html[data-sandbox-preview="filter-chip-rail"] #collectionLayer,
      html[data-sandbox-preview="floating-action"] #app{display:none!important}
      #sandboxPreviewPortal{width:100%;min-height:100vh;display:flex;align-items:center;padding:36px clamp(16px,4vw,52px);background:#fff}
      #sandboxPreviewPortal>.collection-filters{width:100%;overflow-x:auto}
      html[data-sandbox-preview="collection-bottom-sheet"] #app,
      html[data-sandbox-preview="device-handoff-accordion"] #app{visibility:hidden!important}
      html[data-sandbox-preview="collection-bottom-sheet"] body,
      html[data-sandbox-preview="device-handoff-accordion"] body{background:#f2f4f7!important}
      html[data-sandbox-preview="floating-action"] body{min-height:240px!important;background:#fff!important}
      html[data-sandbox-preview="floating-action"] #collectionLayer{position:static!important}
      html[data-sandbox-preview="floating-action"] #collectionFab{position:absolute!important;right:48px!important;bottom:42px!important}
    `;
    document.head.appendChild(css);

    if(preview==='filter-chip-rail'){
      openCollection('video',()=>{cloneInto('#collectionFilters');$('#collectionClose')?.click();});
    }else if(preview==='collection-bottom-sheet'){
      openCollection('all');
    }else if(preview==='device-handoff-accordion'){
      openCollection('settings',()=>setTimeout(()=>$('#collectionDeviceLink')?.click(),100));
    }
  }

  function bindInlineOpen(){
    const button=$('#sandboxOpenCollection');if(!button||button.dataset.bound==='true')return;
    button.dataset.bound='true';button.addEventListener('click',()=>$('#collectionFab')?.click());
  }

  function init(){
    bindInlineOpen();installPreviewMode();
    if(typeof window.setupNavigation==='function')window.setupNavigation();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,40),{once:true});
  else setTimeout(init,40);
})();
