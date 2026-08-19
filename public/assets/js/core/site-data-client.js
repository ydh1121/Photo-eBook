let siteDataRequest=null;

function activeContentPack(){
  return typeof window.getContentPack==='function'?window.getContentPack():null;
}

function siteDataCacheKey(){
  return activeContentPack()?.data?.cacheKey||'siteDataCacheV1';
}

function siteDataEndpoint(){
  return activeContentPack()?.data?.apiEndpoint||'/api/site-data';
}

function isUsableSiteData(data){
  return Boolean(data&&Array.isArray(data.nav)&&data.nav.length);
}

function readCachedSiteData(){
  try{
    const cached=JSON.parse(localStorage.getItem(siteDataCacheKey())||'null');
    return isUsableSiteData(cached?.data)?cached.data:null;
  }catch{return null;}
}

function readBundledSiteData(){
  try{
    const parts=window.__SITE_DATA_FALLBACK_PARTS;
    if(!Array.isArray(parts)||!parts.length)return null;
    const parsed=JSON.parse(parts.join(''));
    return isUsableSiteData(parsed?.data)?parsed.data:null;
  }catch(error){
    console.error('Bundled site data parse failed',error);
    return null;
  }
}

function writeCachedSiteData(data){
  if(!isUsableSiteData(data))return;
  try{
    localStorage.setItem(siteDataCacheKey(),JSON.stringify({savedAt:Date.now(),data}));
  }catch{}
}

async function fetchSiteDataOnce(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6500);
  try{
    const response=await fetch(siteDataEndpoint(),{cache:'no-store',signal:controller.signal});
    const json=await response.json();
    if(!response.ok||!json?.ok||!isUsableSiteData(json.data))throw new Error(json?.message||'콘텐츠를 불러오지 못했습니다.');
    writeCachedSiteData(json.data);
    return json.data;
  }finally{
    clearTimeout(timer);
  }
}

function delay(ms,value){
  return new Promise(resolve=>setTimeout(()=>resolve(value),ms));
}

async function apiGetSiteData(){
  if(siteDataRequest)return siteDataRequest;

  const fallback=readCachedSiteData()||readBundledSiteData();
  const live=fetchSiteDataOnce();
  live.catch(()=>{});

  siteDataRequest=fallback
    ? Promise.race([live.catch(()=>fallback),delay(650,fallback)])
    : live;

  try{
    return await siteDataRequest;
  }catch(error){
    siteDataRequest=null;
    throw error;
  }
}

async function apiRpc(action,payload={}){
  const response=await fetch('/api/rpc',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action,...payload})
  });
  const json=await response.json();
  if(!response.ok)throw new Error(json?.message||'요청을 처리하지 못했습니다.');
  return json;
}
