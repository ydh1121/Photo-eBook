import {cleanPublicSlugV2,loadActiveSnapshotV2} from '../../lib/public-snapshot-v2.js';

export async function onRequest(context){
  const {request,env}=context;
  if(request.method!=='GET')return json({ok:false,message:'Method not allowed'},405);
  try{
    const slug=cleanPublicSlugV2(new URL(request.url).searchParams.get('slug')||'');
    if(!slug)return json({ok:false,message:'slug가 필요합니다.'},400);
    const payload=await loadActiveSnapshotV2(env,slug);
    if(!payload)return json({ok:false,message:'공개된 페이지를 찾지 못했습니다.'},404);
    return json({ok:true,...payload},200,120);
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200,maxAge=0){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':maxAge?`public, max-age=${maxAge}`:'no-store','X-Content-Type-Options':'nosniff'}});}
