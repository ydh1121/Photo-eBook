let cachedToken=null;

const SHEETS=Object.freeze({
  snapshots:'PUBLISH_SNAPSHOTS',
  blocks:'PUBLISHED_BLOCKS',
  styles:'PUBLISHED_BLOCK_STYLES',
  ui:'PUBLISHED_UI_CONFIG'
});

export function cleanPublicSlugV2(value){
  return String(value||'').trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160);
}

export async function listIndexableSnapshotRoutesV2(env){
  const values=await readSheetValues(env,SHEETS.snapshots);
  const headers=ensureHeaderMap(values[0],['snapshot_id','page_id','version','slug','industry_id','title','theme','seo_json','source_updated_at','published_at','state']);
  const bySlug=new Map();

  for(let i=1;i<values.length;i++){
    const row=values[i];
    if(String(row[headers.state]||'')!=='active')continue;
    const slug=cleanPublicSlugV2(row[headers.slug]);
    if(!slug)continue;
    const seo=parseJson(row[headers.seo_json],{});
    if(String(seo.indexPolicy||seo.index_policy||'index')==='noindex')continue;
    const candidate={
      slug,
      version:Number(row[headers.version]||0),
      publishedAt:String(row[headers.published_at]||''),
      sourceUpdatedAt:String(row[headers.source_updated_at]||'')
    };
    const previous=bySlug.get(slug);
    if(!previous||candidate.version>previous.version||String(candidate.publishedAt).localeCompare(String(previous.publishedAt))>0)bySlug.set(slug,candidate);
  }

  return [...bySlug.values()].sort((a,b)=>a.slug.localeCompare(b.slug,'ko'));
}

export async function loadActiveSnapshotV2(env,inputSlug){
  const slug=cleanPublicSlugV2(inputSlug);
  if(!slug)return null;

  const [snapshotValues,blockValues,styleValues,uiValues]=await Promise.all([
    readSheetValues(env,SHEETS.snapshots),
    readSheetValues(env,SHEETS.blocks),
    readSheetValues(env,SHEETS.styles),
    readSheetValues(env,SHEETS.ui)
  ]);

  const snapshotHeaders=ensureHeaderMap(snapshotValues[0],['snapshot_id','page_id','version','slug','industry_id','title','theme','seo_json','source_updated_at','published_at','state']);
  const blockHeaders=ensureHeaderMap(blockValues[0],['snapshot_id','page_id','block_id','sort_order','type','variant','content_json','evidence_json','revision_version','published_at']);
  const styleHeaders=ensureHeaderMap(styleValues[0],['snapshot_id','page_id','block_id','style_preset_id','style_json','published_at']);
  const uiHeaders=ensureHeaderMap(uiValues[0],['snapshot_id','page_id','capability_id','enabled','preset_id','config_json','published_at']);

  const active=[];
  for(let i=1;i<snapshotValues.length;i++){
    const row=snapshotValues[i];
    if(String(row[snapshotHeaders.slug]||'')!==slug||String(row[snapshotHeaders.state]||'')!=='active')continue;
    active.push({
      snapshotId:String(row[snapshotHeaders.snapshot_id]||''),
      pageId:String(row[snapshotHeaders.page_id]||''),
      version:Number(row[snapshotHeaders.version]||0),
      slug:String(row[snapshotHeaders.slug]||''),
      industryId:String(row[snapshotHeaders.industry_id]||''),
      title:String(row[snapshotHeaders.title]||''),
      theme:String(row[snapshotHeaders.theme]||'light'),
      seo:parseJson(row[snapshotHeaders.seo_json],{}),
      sourceUpdatedAt:String(row[snapshotHeaders.source_updated_at]||''),
      publishedAt:String(row[snapshotHeaders.published_at]||'')
    });
  }
  if(!active.length)return null;
  active.sort((a,b)=>b.version-a.version||String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const snapshot=active[0];

  const styleByBlock=new Map();
  for(let i=1;i<styleValues.length;i++){
    const row=styleValues[i];
    if(String(row[styleHeaders.snapshot_id]||'')!==snapshot.snapshotId)continue;
    if(String(row[styleHeaders.page_id]||'')!==snapshot.pageId)continue;
    const blockId=String(row[styleHeaders.block_id]||'');
    if(!blockId)continue;
    styleByBlock.set(blockId,{
      stylePresetId:String(row[styleHeaders.style_preset_id]||''),
      resolvedStyle:parseJson(row[styleHeaders.style_json],{})
    });
  }

  const blocks=[];
  for(let i=1;i<blockValues.length;i++){
    const row=blockValues[i];
    if(String(row[blockHeaders.snapshot_id]||'')!==snapshot.snapshotId)continue;
    if(String(row[blockHeaders.page_id]||'')!==snapshot.pageId)continue;
    const blockId=String(row[blockHeaders.block_id]||'');
    if(!blockId)continue;
    const style=styleByBlock.get(blockId)||{stylePresetId:'',resolvedStyle:{}};
    blocks.push({
      id:blockId,
      type:String(row[blockHeaders.type]||''),
      variant:String(row[blockHeaders.variant]||'default'),
      enabled:true,
      content:parseJson(row[blockHeaders.content_json],{}),
      evidence:parseJson(row[blockHeaders.evidence_json],[]),
      revision:{version:Number(row[blockHeaders.revision_version]||1)||1},
      stylePresetId:style.stylePresetId,
      resolvedStyle:style.resolvedStyle,
      sortOrder:Number(row[blockHeaders.sort_order]||0)
    });
  }
  blocks.sort((a,b)=>a.sortOrder-b.sortOrder);
  blocks.forEach(block=>delete block.sortOrder);

  const uiCapabilities=[];
  for(let i=1;i<uiValues.length;i++){
    const row=uiValues[i];
    if(String(row[uiHeaders.snapshot_id]||'')!==snapshot.snapshotId)continue;
    if(String(row[uiHeaders.page_id]||'')!==snapshot.pageId)continue;
    const capabilityId=String(row[uiHeaders.capability_id]||'');
    if(!capabilityId)continue;
    uiCapabilities.push({
      capabilityId,
      enabled:String(row[uiHeaders.enabled]||'TRUE').toUpperCase()!=='FALSE',
      presetId:String(row[uiHeaders.preset_id]||''),
      config:parseJson(row[uiHeaders.config_json],{})
    });
  }

  return {snapshot,blocks,uiCapabilities};
}

function parseJson(value,fallback){
  if(!value)return fallback;
  try{return JSON.parse(String(value));}catch{return fallback;}
}

function ensureHeaderMap(row,required){
  const headers=(Array.isArray(row)?row:[]).map(value=>String(value||'').trim());
  const map={};
  required.forEach(name=>{
    const index=headers.indexOf(name);
    if(index<0)throw new Error(`${name} 헤더가 없습니다.`);
    map[name]=index;
  });
  return map;
}

async function readSheetValues(env,sheetName){
  const token=await getAccessToken(env);
  const id=requireSheetId(env);
  const range=encodeURIComponent(`${sheetName}!A:ZZ`);
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
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

function parseServiceAccount(env){
  const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';
  if(!raw)return null;
  try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}
}

function requireSheetId(env){
  const id=String(env.GOOGLE_SHEET_ID||'').trim();
  if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');
  return id;
}

function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
