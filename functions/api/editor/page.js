import {normalizeBlockStyleV1} from '../../lib/block-style-v1.js';
import {isKnownBlockType} from '../../lib/block-registry-v1.js';
import {isKnownBlockVariant} from '../../lib/block-variants-v1.js';

let cachedToken=null;

export async function onRequest(context){
  const {request,env}=context;
  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401);
  if(request.method!=='GET')return json({ok:false,message:'Method not allowed'},405);
  try{
    const id=String(new URL(request.url).searchParams.get('id')||'').trim();
    if(!id)return json({ok:false,message:'page id가 필요합니다.'},400);
    const page=await loadPage(env,id);
    if(!page)return json({ok:false,message:'페이지를 찾지 못했습니다.'},404);
    return json({ok:true,page});
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

async function loadPage(env,pageId){
  const [pageValues,blockValues]=await Promise.all([
    readSheetValues(env,'PLATFORM_PAGES'),
    readSheetValues(env,'PAGE_BLOCKS')
  ]);
  const pageHeaders=ensureHeaderMap(pageValues[0],['page_id','slug','industry_id','title','status','theme','seo_json','created_at','updated_at','published_at','brief_json','ai_status','ai_review_json']);
  const blockHeaders=ensureHeaderMap(blockValues[0],['page_id','block_id','sort_order','type','variant','enabled','content_json','evidence_json','ai_policy_json','revision_version','created_at','updated_at','published_version','style_preset_id','style_overrides_json']);

  let row=null;
  for(let i=1;i<pageValues.length;i++){
    if(String(pageValues[i][pageHeaders.page_id]||'')===pageId){row=pageValues[i];break;}
  }
  if(!row)return null;

  const blocks=[];
  for(let i=1;i<blockValues.length;i++){
    const source=blockValues[i];
    if(String(source[blockHeaders.page_id]||'')!==pageId)continue;
    const type=String(source[blockHeaders.type]||'');
    const variant=String(source[blockHeaders.variant]||'default');
    if(!isKnownBlockType(type)||!isKnownBlockVariant(type,variant))continue;
    blocks.push({
      id:String(source[blockHeaders.block_id]||''),
      type,
      variant,
      enabled:String(source[blockHeaders.enabled]||'TRUE').toUpperCase()!=='FALSE',
      content:parseJson(source[blockHeaders.content_json],{}),
      evidence:parseJson(source[blockHeaders.evidence_json],[]),
      aiPolicy:parseJson(source[blockHeaders.ai_policy_json],{mode:'full'}),
      stylePresetId:String(source[blockHeaders.style_preset_id]||''),
      styleOverrides:normalizeBlockStyleV1(parseJson(source[blockHeaders.style_overrides_json],{})),
      revision:{
        version:Number(source[blockHeaders.revision_version]||1)||1,
        updatedAt:String(source[blockHeaders.updated_at]||''),
        updatedBy:'server'
      },
      sortOrder:Number(source[blockHeaders.sort_order]||0)
    });
  }
  blocks.sort((a,b)=>a.sortOrder-b.sortOrder);
  blocks.forEach(block=>delete block.sortOrder);

  return {
    pageId:String(row[pageHeaders.page_id]||''),
    slug:String(row[pageHeaders.slug]||''),
    industryId:String(row[pageHeaders.industry_id]||'general'),
    title:String(row[pageHeaders.title]||''),
    status:String(row[pageHeaders.status]||'draft'),
    theme:String(row[pageHeaders.theme]||'light'),
    seo:parseJson(row[pageHeaders.seo_json],{}),
    brief:parseJson(row[pageHeaders.brief_json],{}),
    aiStatus:String(row[pageHeaders.ai_status]||'not_requested'),
    aiReview:parseJson(row[pageHeaders.ai_review_json],{}),
    createdAt:String(row[pageHeaders.created_at]||''),
    updatedAt:String(row[pageHeaders.updated_at]||''),
    publishedAt:String(row[pageHeaders.published_at]||''),
    blocks
  };
}

function parseJson(value,fallback){if(!value)return fallback;try{return JSON.parse(String(value));}catch{return fallback;}}
function ensureHeaderMap(row,required){const headers=(Array.isArray(row)?row:[]).map(value=>String(value||'').trim());const map={};required.forEach(name=>{const index=headers.indexOf(name);if(index<0)throw new Error(`${name} 헤더가 없습니다.`);map[name]=index;});return map;}
function sameOriginRequest(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}}
function adminAuthorized(request,env){const expected=String(env.ADMIN_EDITOR_TOKEN||'');if(!expected)return false;const header=String(request.headers.get('Authorization')||'');const supplied=header.startsWith('Bearer ')?header.slice(7):'';return constantTimeEqual(supplied,expected);}
function constantTimeEqual(a,b){const aa=new TextEncoder().encode(String(a));const bb=new TextEncoder().encode(String(b));if(aa.length!==bb.length)return false;let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;}
async function readSheetValues(env,sheetName){const token=await getAccessToken(env);const sheetId=requireSheetId(env);const range=encodeURIComponent(`${sheetName}!A:ZZ`);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];}
async function getAccessToken(env){const now=Math.floor(Date.now()/1000);if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;const account=parseServiceAccount(env);if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';const header=base64UrlJson({alg:'RS256',typ:'JWT'});const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:tokenUri,exp:now+3600,iat:now});const signingInput=`${header}.${claims}`;const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};return cachedToken.token;}
function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
