(function(){
  const packs=window.__CONTENT_PACKS=window.__CONTENT_PACKS||{};

  function normalizePath(value){
    const raw=String(value||'/').split('?')[0].split('#')[0]||'/';
    if(raw==='/'||!raw)return '/';
    return raw.endsWith('/')?raw:`${raw}/`;
  }

  window.registerContentPack=function registerContentPack(pack){
    if(!pack||!pack.id)return null;
    packs[String(pack.id)]=pack;
    return pack;
  };

  window.getContentPack=function getContentPack(){
    const forced=String(document.documentElement.dataset.contentPack||window.__CONTENT_PACK_ID||'').trim();
    if(forced&&packs[forced])return packs[forced];

    const path=normalizePath(location.pathname);
    const matched=Object.values(packs).find(pack=>(pack.routes||[]).some(route=>normalizePath(route)===path));
    if(matched)return matched;

    return packs.photography||Object.values(packs)[0]||null;
  };

  window.contentPackId=function contentPackId(){
    return window.getContentPack?.()?.id||'default';
  };

  window.contentPackStorageKey=function contentPackStorageKey(base){
    return `${String(base||'site')}:${window.contentPackId()}`;
  };

  window.applyContentPackBootMessage=function applyContentPackBootMessage(){
    const node=document.getElementById('bootMessage');
    const text=window.getContentPack?.()?.bootMessage||'';
    if(node&&text)node.textContent=text;
  };
})();
