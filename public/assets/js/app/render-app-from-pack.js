(function(){
  const renderApp=window.renderApp;
  if(typeof renderApp!=='function')return;

  window.renderApp=function renderAppFromContentPack(data){
    const pack=window.getContentPack?.();
    if(pack?.id){
      window.__CONTENT_PACK_ID=pack.id;
      document.documentElement.dataset.contentPack=pack.id;
    }
    return renderApp(data);
  };
})();
