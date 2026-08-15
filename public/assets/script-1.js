async function apiGetSiteData(){
  const response=await fetch('/api/site-data',{cache:'no-store'});
  const json=await response.json();
  if(!response.ok || !json?.ok) throw new Error(json?.message||'데이터를 불러오지 못했습니다.');
  return json.data;
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
