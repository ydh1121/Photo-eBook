const SITE_DATA_CACHE_KEY='photoRoadmapSiteDataV2';
let siteDataRequest=null;

function readCachedSiteData(){
  try{
    const cached=JSON.parse(localStorage.getItem(SITE_DATA_CACHE_KEY)||'null');
    return cached?.data&&Array.isArray(cached.data.nav)?cached.data:null;
  }catch{return null;}
}

function writeCachedSiteData(data){
  try{
    localStorage.setItem(SITE_DATA_CACHE_KEY,JSON.stringify({savedAt:Date.now(),data}));
  }catch{}
}

async function fetchSiteDataOnce(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch('/api/site-data',{cache:'no-store',signal:controller.signal});
    const json=await response.json();
    if(!response.ok||!json?.ok)throw new Error(json?.message||'콘텐츠를 불러오지 못했습니다.');
    writeCachedSiteData(json.data);
    return json.data;
  }finally{
    clearTimeout(timer);
  }
}

async function apiGetSiteData(){
  if(siteDataRequest)return siteDataRequest;

  siteDataRequest=(async()=>{
    try{
      return await fetchSiteDataOnce();
    }catch(firstError){
      await new Promise(resolve=>setTimeout(resolve,550));
      try{
        return await fetchSiteDataOnce();
      }catch(secondError){
        const cached=readCachedSiteData();
        if(cached)return cached;
        throw secondError||firstError;
      }
    }
  })();

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
  if(!response.ok) throw new Error(json?.message||'요청을 처리하지 못했습니다.');
  return json;
}
