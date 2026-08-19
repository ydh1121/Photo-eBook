import {publishPageSnapshot} from '../../lib/publish-v2.js';

export async function onRequest(context){
  const {request,env}=context;
  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401);
  if(request.method!=='POST')return json({ok:false,message:'Method not allowed'},405);
  try{
    const body=await readJson(request);
    const pageId=String(body?.pageId||body?.id||'').trim();
    if(!pageId)return json({ok:false,message:'page id가 필요합니다.'},400);
    const actor=String(body?.actor||'platform-owner').trim().slice(0,120)||'platform-owner';
    const result=await publishPageSnapshot(env,pageId,actor);
    return json(result,result.ok?200:409);
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

function sameOriginRequest(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}}
function adminAuthorized(request,env){const expected=String(env.ADMIN_EDITOR_TOKEN||'');if(!expected)return false;const header=String(request.headers.get('Authorization')||'');const supplied=header.startsWith('Bearer ')?header.slice(7):'';return constantTimeEqual(supplied,expected);}
function constantTimeEqual(a,b){const aa=new TextEncoder().encode(String(a));const bb=new TextEncoder().encode(String(b));if(aa.length!==bb.length)return false;let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;}
async function readJson(request){const length=Number(request.headers.get('content-length')||0);if(length>200000)throw new Error('요청 크기가 너무 큽니다.');return request.json().catch(()=>({}));}
function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
