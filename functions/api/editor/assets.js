let cachedToken=null;
const SHEET='MEDIA_ASSETS';
const HEADERS=['asset_id','drive_file_id','public_url','alt','source_type','source_url','license_note','status','updated_at'];

export async function onRequest(context){
  const {request,env}=context;
  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401);

  try{
    if(request.method==='GET')return json(await listAssets(env));
    if(request.method==='POST'){
      const body=await request.json().catch(()=>({}));
      return json(await saveAsset(env,body));
    }
    return json({ok:false,message:'Method not allowed'},405);
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

function sameOriginRequest(request){
  const origin=request.headers.get('Origin');
  if(!origin)return true;
  try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}

function adminAuthorized(request,env){
  const expected=String(env.ADMIN_EDITOR_TOKEN||'');
  if(!expected)return false;
  const header=String(request.headers.get('Authorization')||'');
  const supplied=header.startsWith('Bearer ')?header.slice(7):'';
  return constantTimeEqual(supplied,expected);
}

function constantTimeEqual(a,b){
  const aa=new TextEncoder().encode(String(a));
  const bb=new TextEncoder().encode(String(b));
  if(aa.length!==bb.length)return false;
  let diff=0;
  for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];
  return diff===0;
}

async function listAssets(env){
  const values=await readSheetValues(env);
  const rows=valuesToObjects(values)
    .filter(row=>row.asset_id&&String(row.status||'active')!=='archived')
    .map(row=>({
      assetId:String(row.asset_id),
      driveFileId:String(row.drive_file_id||''),
      publicUrl:String(row.public_url||''),
      alt:String(row.alt||''),
      sourceType:String(row.source_type||''),
      sourceUrl:String(row.source_url||''),
      licenseNote:String(row.license_note||''),
      status:String(row.status||'active'),
      updatedAt:String(row.updated_at||'')
    }))
    .filter(item=>item.publicUrl)
    .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return {ok:true,assets:rows};
}

async function saveAsset(env,body){
  const assetId=cleanId(body?.assetId||crypto.randomUUID(),160);
  const driveFileId=String(body?.driveFileId||'').trim().slice(0,300);
  const publicUrl=cleanPublicUrl(body?.publicUrl||'');
  const alt=String(body?.alt||'').trim().slice(0,1000);
  const sourceType=String(body?.sourceType||'manual').trim().slice(0,100);
  const sourceUrl=String(body?.sourceUrl||'').trim().slice(0,2000);
  const licenseNote=String(body?.licenseNote||'').trim().slice(0,2000);
  const status=['active','sample','archived'].includes(body?.status)?body.status:'active';
  const now=koreaTime();
  if(!publicUrl)throw new Error('public URL을 확인해 주세요.');

  const values=await readSheetValues(env);
  const headerMap=ensureHeaderMap(values[0]);
  let target=-1;
  for(let i=1;i<values.length;i++){
    if(String(values[i][headerMap.asset_id]||'')===assetId){target=i+1;break;}
  }
  const row=[[assetId,driveFileId,publicUrl,alt,sourceType,sourceUrl,licenseNote,status,now]];
  if(target>0)await updateRange(env,`${SHEET}!A${target}:I${target}`,row);
  else await appendRange(env,`${SHEET}!A:I`,row);
  return {ok:true,asset:{assetId,driveFileId,publicUrl,alt,sourceType,sourceUrl,licenseNote,status,updatedAt:now}};
}

function cleanPublicUrl(value){
  const url=String(value||'').trim();
  if(url.startsWith('/'))return url.slice(0,2000);
  try{
    const parsed=new URL(url);
    if(parsed.protocol!=='https:')return '';
    return parsed.toString().slice(0,2000);
  }catch{return '';}
}

function cleanId(value,max){return String(value||'').trim().replace(/[^a-zA-Z0-9_.:-]/g,'-').slice(0,max);}
function ensureHeaderMap(headers){
  const source=Array.isArray(headers)?headers.map(v=>String(v||'').trim()):[];
  const map={};
  for(const name of HEADERS){const index=source.indexOf(name);if(index<0)throw new Error(`${name} 헤더가 없습니다.`);map[name]=index;}
  return map;
}
function valuesToObjects(values){
  if(!values.length)return [];
  const headers=values[0].map(v=>String(v||'').trim());
  return values.slice(1).filter(row=>row.some(cell=>String(cell||'').trim()!=='')).map(row=>{const obj={};headers.forEach((header,i)=>{if(header)obj[header]=row[i]??'';});return obj;});
}

async function readSheetValues(env){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const range=encodeURIComponent(`${SHEET}!A:I`);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];
}
async function appendRange(env,range,values){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 추가 실패 (${response.status})`);return data;
}
async function updateRange(env,range,values){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;const response=await fetch(url,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 수정 실패 (${response.status})`);return data;
}

async function getAccessToken(env){
  const now=Math.floor(Date.now()/1000);if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;const account=parseServiceAccount(env);if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';const header=base64UrlJson({alg:'RS256',typ:'JWT'});const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:tokenUri,exp:now+3600,iat:now});const signingInput=`${header}.${claims}`;const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};return cachedToken.token;
}
function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function koreaTime(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace(' ','T');}
function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
