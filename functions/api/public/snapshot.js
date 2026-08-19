import {normalizeBlockStyleV1} from '../../lib/block-style-v1.js';
import {isKnownUiCapability,sanitizeUiConfigV1} from '../../lib/ui-capabilities-v1.js';

let cachedToken=null;

export async function onRequest(context){
  const {request,env}=context;
  if(request.method!=='GET')return json({ok:false,message:'Method not allowed'},405,{'Cache-Control':'no-store'});

  try{
    const url=new URL(request.url);
    const slug=cleanSlug(url.searchParams.get('slug')||'');
    if(!slug)return json({ok:false,message:'slug가 필요합니다.'},400,{'Cache-Control':'no-store'});

    const [snapshotValues,blockValues,styleValues,uiValues]=await Promise.all([
      readSheetValues(env,'PUBLISH_SNAPSHOTS','A:L'),
      readSheetValues(env,'PUBLISHED_BLOCKS','A:M'),
      readSheetValues(env,'PUBLISHED_BLOCK_STYLES','A:F'),
      readSheetValues(env,'PUBLISHED_UI_CONFIG','A:G')
    ]);
    const snapshots=valuesToObjects(snapshotValues)
      .filter(row=>String(row.slug||'')===slug&&String(row.state||'')==='active')
      .sort((a,b)=>Number(b.version||0)-Number(a.version||0)||String(b.published_at||'').localeCompare(String(a.published_at||'')));

    const row=snapshots[0];
    if(!row)return json({ok:false,message:'공개된 페이지를 찾지 못했습니다.'},404,{'Cache-Control':'public, max-age=30, stale-while-revalidate=120'});

    const snapshotId=String(row.snapshot_id||'');
    const stylesByBlock=new Map(
      valuesToObjects(styleValues)
        .filter(item=>String(item.snapshot_id||'')===snapshotId&&String(item.block_id||''))
        .map(item=>[String(item.block_id),{
          stylePresetId:String(item.style_preset_id||''),
          resolvedStyle:normalizeBlockStyleV1(parseJsonCell(item.style_json,{})),
          publishedAt:String(item.published_at||row.published_at||'')
        }])
    );

    const blocks=valuesToObjects(blockValues)
      .filter(item=>String(item.snapshot_id||'')===snapshotId&&String(item.block_id||''))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))
      .map(item=>{
        const styleSnapshot=stylesByBlock.get(String(item.block_id||''));
        const legacyResolved=normalizeBlockStyleV1(parseJsonCell(item.resolved_style_json,{}));
        const legacyOverrides=normalizeBlockStyleV1(parseJsonCell(item.style_overrides_json,{}));
        return {
          id:String(item.block_id||''),
          type:String(item.type||''),
          variant:String(item.variant||'default'),
          enabled:true,
          content:parseJsonCell(item.content_json,{}),
          evidence:parseJsonCell(item.evidence_json,[]),
          stylePresetId:styleSnapshot?.stylePresetId||String(item.style_preset_id||''),
          styleOverrides:styleSnapshot?{}:legacyOverrides,
          resolvedStyle:styleSnapshot?.resolvedStyle||legacyResolved,
          revision:{version:Number(item.revision_version||1),updatedAt:String(styleSnapshot?.publishedAt||item.published_at||row.published_at||'')}
        };
      });

    let uiCapabilities=valuesToObjects(uiValues)
      .filter(item=>String(item.snapshot_id||'')===snapshotId&&isKnownUiCapability(item.capability_id))
      .map(item=>({
        capabilityId:String(item.capability_id||''),
        enabled:String(item.enabled||'TRUE').toUpperCase()!=='FALSE',
        presetId:String(item.preset_id||''),
        config:sanitizeUiConfigV1(parseJsonCell(item.config_json,{})),
        publishedAt:String(item.published_at||row.published_at||'')
      }));

    if(!uiCapabilities.length){
      const legacy=parseJsonCell(row.resolved_ui_json,{});
      if(Array.isArray(legacy?.items)){
        uiCapabilities=legacy.items.filter(item=>isKnownUiCapability(item?.capabilityId)).map(item=>({
          capabilityId:String(item.capabilityId||''),
          enabled:item.enabled===true,
          presetId:String(item.presetId||''),
          config:sanitizeUiConfigV1(item.config||{}),
          publishedAt:String(row.published_at||'')
        }));
      }
    }

    const snapshot={
      snapshotId,
      pageId:String(row.page_id||''),
      version:Number(row.version||0),
      slug:String(row.slug||''),
      industryId:String(row.industry_id||'general'),
      title:String(row.title||''),
      theme:['light','dark'].includes(String(row.theme||''))?String(row.theme):'light',
      seo:parseJsonCell(row.seo_json,{}),
      sourceUpdatedAt:String(row.source_updated_at||''),
      publishedAt:String(row.published_at||''),
      uiCapabilities,
      blocks
    };

    return json({ok:true,snapshot},200,{
      'Cache-Control':'public, max-age=60, stale-while-revalidate=300',
      'Vary':'Accept-Encoding'
    });
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500,{'Cache-Control':'no-store'});
  }
}

function cleanSlug(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160);}
function parseJsonCell(value,fallback){if(value&&typeof value==='object')return value;try{const parsed=JSON.parse(String(value||''));return parsed??fallback;}catch{return fallback;}}
function valuesToObjects(values){if(!values.length)return [];const headers=values[0].map(v=>String(v||'').trim());return values.slice(1).filter(row=>row.some(cell=>String(cell||'').trim()!=='')).map(row=>{const obj={};headers.forEach((header,i)=>{if(header)obj[header]=row[i]??'';});return obj;});}

async function readSheetValues(env,sheetName,rangePart){
  const token=await getAccessToken(env);
  const sheetId=requireSheetId(env);
  const range=encodeURIComponent(`${sheetName}!${rangePart}`);
  const endpoint=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const response=await fetch(endpoint,{headers:{Authorization:`Bearer ${token}`}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);
  return Array.isArray(data.values)?data.values:[];
}

async function getAccessToken(env){
  const now=Math.floor(Date.now()/1000);
  if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;
  const account=parseServiceAccount(env);
  if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');
  const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';
  const header=base64UrlJson({alg:'RS256',typ:'JWT'});
  const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:tokenUri,exp:now+3600,iat:now});
  const signingInput=`${header}.${claims}`;
  const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));
  const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;
  const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);
  cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};
  return cachedToken.token;
}

function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function safeErrorMessage(error){return String(error?.message||error||'요청 처리 중 오류가 발생했습니다.').replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200,extraHeaders={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff',...extraHeaders}});}
