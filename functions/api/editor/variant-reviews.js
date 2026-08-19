import {isKnownBlockVariant} from '../../lib/block-variants-v1.js';

let cachedToken=null;
const SHEET='BLOCK_VARIANT_REVIEWS';
const DECISIONS=new Set(['undecided','approved','redesign','merge','deprecated']);
const KINDS=new Set(['structure','visual','behavior','responsive']);
const MATURITY=new Set(['implemented','partial','placeholder']);

export async function onRequest(context){
  const {request,env}=context;
  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401);
  try{
    if(request.method==='GET')return json(await listReviews(env));
    if(request.method==='POST')return json(await saveReviews(env,await readJson(request)));
    return json({ok:false,message:'Method not allowed'},405);
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

async function listReviews(env){
  const values=await readSheetValues(env,`${SHEET}!A:H`);
  const rows=valuesToObjects(values);
  const reviews=rows.filter(row=>row.block_type&&row.variant).map(row=>({
    type:String(row.block_type||''),
    variant:String(row.variant||''),
    decision:String(row.decision||'undecided'),
    note:String(row.note||''),
    reviewer:String(row.reviewer||''),
    updatedAt:String(row.updated_at||''),
    differenceType:String(row.difference_type||''),
    maturity:String(row.maturity||'')
  }));
  return {ok:true,reviews,count:reviews.length};
}

async function saveReviews(env,body){
  const reviews=Array.isArray(body?.reviews)?body.reviews:[];
  if(reviews.length>200)throw new Error('variant 검토 항목 수를 확인해 주세요.');
  const reviewer=String(body?.reviewer||'admin').trim().slice(0,120)||'admin';
  const now=koreaTime();
  const values=await readSheetValues(env,`${SHEET}!A:H`);
  const headers=ensureHeaderMap(values[0],['block_type','variant','decision','note','reviewer','updated_at','difference_type','maturity']);
  const rowByKey=new Map();
  for(let i=1;i<values.length;i++){
    const type=String(values[i][headers.block_type]||'');
    const variant=String(values[i][headers.variant]||'');
    if(type&&variant)rowByKey.set(`${type}::${variant}`,i+1);
  }

  let saved=0;
  for(const item of reviews){
    const type=String(item?.type||'').trim();
    const variant=String(item?.variant||'').trim();
    if(!isKnownBlockVariant(type,variant))continue;
    const decision=DECISIONS.has(item?.decision)?item.decision:'undecided';
    const note=String(item?.note||'').trim().slice(0,5000);
    const differenceType=KINDS.has(item?.differenceType)?item.differenceType:'';
    const maturity=MATURITY.has(item?.maturity)?item.maturity:'';
    const row=[[type,variant,decision,note,reviewer,now,differenceType,maturity]];
    const key=`${type}::${variant}`;
    const target=rowByKey.get(key);
    if(target)await updateRange(env,`${SHEET}!A${target}:H${target}`,row);
    else{
      await appendRange(env,`${SHEET}!A:H`,row);
      rowByKey.set(key,values.length+saved+1);
    }
    saved+=1;
  }
  return {ok:true,count:saved,updatedAt:now};
}

async function readJson(request){
  const length=Number(request.headers.get('content-length')||0);
  if(length>1_000_000)throw new Error('요청 크기가 너무 큽니다.');
  return request.json().catch(()=>{throw new Error('JSON 요청을 확인해 주세요.');});
}

function valuesToObjects(values){
  if(!values.length)return [];
  const headers=values[0].map(value=>String(value||'').trim());
  return values.slice(1).filter(row=>row.some(cell=>String(cell||'').trim()!=='')).map(row=>{
    const item={};headers.forEach((header,index)=>{if(header)item[header]=row[index]??'';});return item;
  });
}

function ensureHeaderMap(row,required){
  const headers=(Array.isArray(row)?row:[]).map(value=>String(value||'').trim());
  const map={};required.forEach(name=>{const index=headers.indexOf(name);if(index<0)throw new Error(`${SHEET} 헤더가 없습니다: ${name}`);map[name]=index;});return map;
}

function sameOriginRequest(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}}
function adminAuthorized(request,env){const expected=String(env.ADMIN_EDITOR_TOKEN||'');if(!expected)return false;const header=String(request.headers.get('Authorization')||'');const supplied=header.startsWith('Bearer ')?header.slice(7):'';return constantTimeEqual(supplied,expected);}
function constantTimeEqual(a,b){const aa=new TextEncoder().encode(String(a));const bb=new TextEncoder().encode(String(b));if(aa.length!==bb.length)return false;let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;}

async function readSheetValues(env,range){const token=await getAccessToken(env);const id=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];}
async function updateRange(env,range,values){return writeRange(env,range,values,'PUT');}
async function appendRange(env,range,values){const token=await getAccessToken(env);const id=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 추가 실패 (${response.status})`);return data;}
async function writeRange(env,range,values,method){const token=await getAccessToken(env);const id=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 저장 실패 (${response.status})`);return data;}

async function getAccessToken(env){const now=Math.floor(Date.now()/1000);if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;const account=parseServiceAccount(env);if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';const header=base64UrlJson({alg:'RS256',typ:'JWT'});const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:tokenUri,exp:now+3600,iat:now});const signingInput=`${header}.${claims}`;const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};return cachedToken.token;}
function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function koreaTime(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()).replace(' ','T')+'+09:00';}
function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
