(function(){
  const fallbackRenderApp=window.renderApp;

  window.renderApp=function renderAppFromContentPack(data){
    const pack=window.getContentPack?.();
    if(!pack?.sections?.length||typeof window.hero!=='function'||typeof window.nav!=='function'){
      return typeof fallbackRenderApp==='function'?fallbackRenderApp(data):undefined;
    }

    window.__SITE_DATA=data;
    window.__CONTENT_PACK_ID=pack.id;
    document.documentElement.dataset.contentPack=pack.id;

    const navMap=new Map((data.nav||[]).map(item=>[item.id,item]));
    const sections=pack.sections
      .filter(section=>navMap.has(section.id))
      .map((section,index)=>{
        const renderer=window[section.renderer];
        return typeof renderer==='function'?renderer(data,navMap.get(section.id),index):'';
      })
      .join('');

    const app=document.getElementById('app');
    if(!app)return;
    app.innerHTML=window.hero(data)+window.nav(data)+sections;
    app.hidden=false;

    const boot=document.getElementById('boot');
    if(boot)boot.remove();

    if(typeof window.setupNavigation==='function')window.setupNavigation();
    if(typeof window.setupCopyButtons==='function')window.setupCopyButtons();
    if(typeof window.setupQuestionDrawer==='function')window.setupQuestionDrawer();
  };
})();
