import {normalizeBlockStyleV1} from '../../lib/block-style-v1.js';
import {isKnownUiCapability,sanitizeUiConfigV1} from '../../lib/ui-capabilities-v1.js';

let cachedToken=null;

export async function onRequest(context){
  const {request,env}=context;
  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401);
  if(request.method!=='GET')return json({ok:false,message:'Method not allowed'},405);

  try{
    const url=new URL(request.url);
    const pageId=String(url.searchParams.get('pageId')||'').trim();
    const snapshotId=String(url.searchParams.get('snapshotId')||'').trim();
    if(!pageId)return json({ok:false,message:'pageId가 필요합니다.'},400);

    const [snapshotValues,blockValues,styleValues,uiValues]=await Promise.all([
      readSheetValues(env,'PUBLISH_SNAPSHOTS','A:L'),
      readSheetValues(env,'PUBLISHED_BLOCKS','A:M'),
      readSheetValues(env,'PUBLISHED_BLOCK_STYLES','A:F'),
      readSheetValues(env,'PUBLISHED_UI_CONFIG','A:G')
    ]);
    const snapshots=valuesToObjects(snapshotValues)
      .filter(row=>String(row.page_id||'')===pageId)
      .map(row=>({
        snapshotId:String(row.snapshot_id||''),
        pageId:String(row.page_id||''),
        version:Number(row.version||0),
        slug:String(row.slug||''),
        industryId:String(row.industry_id||''),
        title:String(row.title||''),
        theme:String(row.theme||'light'),
        seo:parseJson(row.seo_json,{}),
        sourceUpdatedAt:String(row.source_updated_at||''),
        publishedAt:String(row.published_at||''),
        state:String(row.state||'')
      }))
      .filter(item=>item.snapshotId)
      .sort((a,b)=>b.version-a.version||String(b.publishedAt).localeCompare(String(a.publishedAt)));

    if(!snapshotId)return json({ok:true,snapshots});

    const snapshot=snapshots.find(item=>item.snapshotId===snapshotId);
    if(!snapshot)return json({ok:false,message:'snapshot을 찾지 못했습니다.'},404);

    const styleByBlock=new Map(
      valuesToObjects(styleValues)
        .filter(row=>String(row.snapshot_id||'')===snapshotId&&String(row.page_id||'')===pageId&&String(row.block_id||''))
        .map(row=>[String(row.block_id),{
          stylePresetId:String(row.style_preset_id||''),
          resolvedStyle:normalizeBlockStyleV1(parseJson(row.style_json,{})),
          publishedAt:String(row.published_at||snapshot.publishedAt||'')
        }])
    );

    const orderedRows=valuesToObjects(blockValues)
      .filter(row=>String(row.snapshot_id||'')===snapshotId&&String(row.page_id||'')===pageId)
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));

    const blocks=orderedRows.map(row=>{
      const styleSnapshot=styleByBlock.get(String(row.block_id||''));
      return {
        id:String(row.block_id||''),
        type:String(row.type||''),
        variant:String(row.variant||'default'),
        enabled:true,
        content:parseJson(row.content_json,{}),
        evidence:parseJson(row.evidence_json,[]),
        stylePresetId:styleSnapshot?.stylePresetId||String(row.style_preset_id||''),
        styleOverrides:styleSnapshot?{}:normalizeBlockStyleV1(parseJson(row.style_overrides_json,{})),
        resolvedStyle:styleSnapshot?.resolvedStyle||normalizeBlockStyleV1(parseJson(row.resolved_style_json,{})),
        revision:{version:Number(row.revision_version||1),publishedAt:String(styleSnapshot?.publishedAt||row.published_at||snapshot.publishedAt||'')}
      };
    }).filter(block=>block.id&&block.type);

    let uiCapabilities=valuesToObjects(uiValues)
      .filter(row=>String(row.snapshot_id||'')===snapshotId&&String(row.page_id||'')===pageId&&isKnownUiCapability(row.capability_id))
      .map(row=>({
        capabilityId:String(row.capability_id||''),
        enabled:String(row.enabled||'TRUE').toUpperCase()!=='FALSE',
        presetId:String(row.preset_id||''),
        config:sanitizeUiConfigV1(parseJson(row.config_json,{})),
        publishedAt:String(row.published_at||snapshot.publishedAt||'')
      }));

    if(!uiCapabilities.length){
      const sourceRow=valuesToObjects(snapshotValues).find(row=>String(row.snapshot_id||'')===snapshotId);
      const legacy=parseJson(sourceRow?.resolved_ui_json,{});
      if(Array.isArray(legacy?.items))uiCapabilities=legacy.items.filter(item=>isKnownUiCapability(item?.capabilityId)).map(item=>({
        capabilityId:String(item.capabilityId||''),
        enabled:item.enabled===true,
        presetId:String(item.presetId||''),
        config:sanitizeUiConfigV1(item.config||{}),
        publishedAt:String(snapshot.publishedAt||'')
      }));
    }

    return json({ok:true,snapshot:{...snapshot,uiCapabilities,blocks}});
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

function parseJson(value,fallback){try{return value?JSON.parse(String(value)):fallback;}catch{return fallback;}}
function valuesToObjects(values){if(!values.length)return [];const headers=values[0].map(v=>String(v||'').trim());return values.slice(1).filter(row=>row.some(cell=>String(cell||'').trim()!=='')).map(row=>{const obj={};headers.forEach((header,i)=>{if(header)obj[header]=row[i]??'';});return obj;});}
function sameOriginRequest(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}}
function adminAuthorized(request,env){const expected=String(env.ADMIN_EDITOR_TOKEN||'');if(!expected)return false;const header=String(request.headers.get('Authorization')||'');const supplied=header.startsWith('Bearer ')?header.slice(7):'';return constantTimeEqual(supplied,expected);}
function constantTimeEqual(a,b){const aa=new TextEncoder().encode(String(a));const bb=new TextEncoder().encode(String(b));if(aa.length!==bb.length)return false;let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;}
async function readSheetValues(env,sheetName,rangePart){const token=await getAccessToken(env);const sheetId=requireSheetId(env);const range=encodeURIComponent(`${sheetName}!${rangePart}`);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];}
async function getAccessToken(env){const now=Math.floor(Date.now()/1000);if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;const account=parseServiceAccount(env);if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';const header=base64UrlJson({alg:'RS256',typ:'JWT'});const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:tokenUri,exp:now+3600,iat:now});const signingInput=`${header}.${claims}`;const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};return cachedToken.token;}
function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
