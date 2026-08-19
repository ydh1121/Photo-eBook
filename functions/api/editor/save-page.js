import {normalizeBlockStyleV1} from '../../lib/block-style-v1.js';

let cachedToken=null;

const SHEETS={
  pages:'PLATFORM_PAGES',
  blocks:'PAGE_BLOCKS',
  revisions:'BLOCK_REVISIONS'
};

const KNOWN_BLOCK_TYPES=new Set([
  'hero','chapter-hero','section-heading','rich-text','process','metric-grid','offer-rail','notice','comparison-cards','checklist','media-rail','case-study-rail','product-tool','roadmap','script-copy','tutorial','resources','faq','pros-cons','comparison-table','timeline','image-copy-split','gallery','quote-expert','calculator','cta','service-list'
]);
const AI_STATUSES=new Set(['not_requested','brief_ready','drafting','needs_review','approved']);

export async function onRequest(context){
  const {request,env}=context;
  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401);
  if(request.method!=='POST')return json({ok:false,message:'Method not allowed'},405);

  try{
    const body=await readJson(request);
    return json(await saveDraftPage(env,body));
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500);
  }
}

async function saveDraftPage(env,body){
  const page=body?.page&&typeof body.page==='object'?body.page:{};
  const blocks=Array.isArray(body?.blocks)?body.blocks:[];
  const pageId=cleanId(page.pageId||crypto.randomUUID(),160);
  const rawSlug=String(page.slug||'').trim();
  const slug=rawSlug?cleanSlug(rawSlug):'';
  const industryId=cleanId(page.industryId||'general',120);
  const title=String(page.title||'새 분야 가이드').trim().slice(0,300);
  const theme=['light','dark','system'].includes(page.theme)?page.theme:'light';
  const seo=plainObject(page.seo)?page.seo:{};
  const brief=plainObject(page.brief)?page.brief:{};
  const aiReview=plainObject(page.aiReview)?page.aiReview:{};
  const aiStatus=AI_STATUSES.has(page.aiStatus)?page.aiStatus:(Object.keys(brief).length?'brief_ready':'not_requested');
  const now=koreaTime();

  if(!title)throw new Error('페이지 제목을 확인해 주세요.');
  if(blocks.length>300)throw new Error('한 페이지의 블록 수가 너무 많습니다.');
  if(stableJson(brief).length>30000)throw new Error('페이지 brief가 너무 큽니다.');
  if(stableJson(aiReview).length>50000)throw new Error('AI 검토 결과가 너무 큽니다.');

  const normalizedBlocks=blocks.map((block,index)=>normalizeBlockForSave(block,index));
  const uniqueBlockIds=new Set(normalizedBlocks.map(block=>block.id));
  if(uniqueBlockIds.size!==normalizedBlocks.length)throw new Error('같은 block id가 중복돼 있습니다.');

  const [pageValues,blockValues]=await Promise.all([
    readSheetValues(env,SHEETS.pages),
    readSheetValues(env,SHEETS.blocks)
  ]);
  const pageHeaders=ensureHeaderMap(pageValues[0],['page_id','slug','industry_id','title','status','theme','seo_json','created_at','updated_at','published_at','brief_json','ai_status','ai_review_json']);
  const blockHeaders=ensureHeaderMap(blockValues[0],['page_id','block_id','sort_order','type','variant','enabled','content_json','evidence_json','ai_policy_json','revision_version','created_at','updated_at','published_version','style_preset_id','style_overrides_json']);

  let pageRow=-1;
  let createdAt=now;
  let publishedAt='';
  for(let i=1;i<pageValues.length;i++){
    if(String(pageValues[i][pageHeaders.page_id]||'')===pageId){
      pageRow=i+1;
      createdAt=String(pageValues[i][pageHeaders.created_at]||now);
      publishedAt=String(pageValues[i][pageHeaders.published_at]||'');
      break;
    }
  }

  const pageRecord=[[pageId,slug,industryId,title,'draft',theme,JSON.stringify(seo),createdAt,now,publishedAt,JSON.stringify(brief),aiStatus,JSON.stringify(aiReview)]];
  if(pageRow>0)await updateRange(env,`${SHEETS.pages}!A${pageRow}:M${pageRow}`,pageRecord);
  else await appendRange(env,`${SHEETS.pages}!A:M`,pageRecord);

  const existingById=new Map();
  for(let i=1;i<blockValues.length;i++){
    if(String(blockValues[i][blockHeaders.page_id]||'')!==pageId)continue;
    const blockId=String(blockValues[i][blockHeaders.block_id]||'');
    if(blockId)existingById.set(blockId,{row:blockValues[i],rowNumber:i+1});
  }

  const currentIds=new Set();
  const rowsToAppend=[];
  const revisionRows=[];
  let changedBlockCount=0;
  let unchangedBlockCount=0;

  for(const block of normalizedBlocks){
    currentIds.add(block.id);
    const existing=existingById.get(block.id);

    if(!existing){
      const version=1;
      const row=blockRow(pageId,block,version,now,now,'');
      rowsToAppend.push(row);
      revisionRows.push(revisionRow(pageId,block,version,now,'block created'));
      changedBlockCount+=1;
      continue;
    }

    const previousVersion=Math.max(1,Number(existing.row[blockHeaders.revision_version]||1));
    if(!hasBlockChanged(block,existing.row,blockHeaders)){
      unchangedBlockCount+=1;
      continue;
    }

    const version=previousVersion+1;
    const blockCreatedAt=String(existing.row[blockHeaders.created_at]||now);
    const publishedVersion=String(existing.row[blockHeaders.published_version]||'');
    const row=blockRow(pageId,block,version,blockCreatedAt,now,publishedVersion);
    await updateRange(env,`${SHEETS.blocks}!A${existing.rowNumber}:O${existing.rowNumber}`,[row]);
    revisionRows.push(revisionRow(pageId,block,version,now,'draft save'));
    changedBlockCount+=1;
  }

  if(rowsToAppend.length)await appendRange(env,`${SHEETS.blocks}!A:O`,rowsToAppend);

  const obsoleteEntries=[...existingById.entries()]
    .filter(([blockId])=>!currentIds.has(blockId))
    .map(([blockId,entry])=>({blockId,...entry}))
    .sort((a,b)=>b.rowNumber-a.rowNumber);

  for(const entry of obsoleteEntries){
    const snapshot=rowToBlockSnapshot(entry.row,blockHeaders);
    const deletionVersion=Math.max(1,Number(entry.row[blockHeaders.revision_version]||1))+1;
    revisionRows.push([
      crypto.randomUUID(),pageId,entry.blockId,deletionVersion,'admin','block removed',
      JSON.stringify({...snapshot,enabled:false,revision:{version:deletionVersion,updatedAt:now,updatedBy:'admin'}}),now
    ]);
    await clearRange(env,`${SHEETS.blocks}!A${entry.rowNumber}:O${entry.rowNumber}`);
    changedBlockCount+=1;
  }

  if(revisionRows.length)await appendRange(env,`${SHEETS.revisions}!A:H`,revisionRows);

  return {
    ok:true,
    pageId,
    slug,
    status:'draft',
    aiStatus,
    blockCount:normalizedBlocks.length,
    changedBlockCount,
    unchangedBlockCount,
    removedBlockCount:obsoleteEntries.length,
    updatedAt:now
  };
}

function hasBlockChanged(block,row,headers){
  const existing={
    sortOrder:Number(row[headers.sort_order]||0),
    type:String(row[headers.type]||''),
    variant:String(row[headers.variant]||'default'),
    enabled:String(row[headers.enabled]||'TRUE').toUpperCase()!=='FALSE',
    content:parseJsonCell(row[headers.content_json],{}),
    evidence:parseJsonCell(row[headers.evidence_json],[]),
    aiPolicy:parseJsonCell(row[headers.ai_policy_json],{mode:'full'}),
    stylePresetId:String(row[headers.style_preset_id]||''),
    styleOverrides:normalizeBlockStyleV1(parseJsonCell(row[headers.style_overrides_json],{}))
  };
  return existing.sortOrder!==block.sortOrder
    || existing.type!==block.type
    || existing.variant!==block.variant
    || existing.enabled!==block.enabled
    || stableJson(existing.content)!==stableJson(block.content)
    || stableJson(existing.evidence)!==stableJson(block.evidence)
    || stableJson(existing.aiPolicy)!==stableJson(block.aiPolicy)
    || existing.stylePresetId!==block.stylePresetId
    || stableJson(existing.styleOverrides)!==stableJson(block.styleOverrides);
}

function blockRow(pageId,block,version,createdAt,updatedAt,publishedVersion){
  return [
    pageId,block.id,block.sortOrder,block.type,block.variant,block.enabled?'TRUE':'FALSE',
    JSON.stringify(block.content),JSON.stringify(block.evidence),JSON.stringify(block.aiPolicy),
    version,createdAt,updatedAt,publishedVersion,block.stylePresetId,JSON.stringify(block.styleOverrides)
  ];
}

function revisionRow(pageId,block,version,now,reason){
  return [
    crypto.randomUUID(),pageId,block.id,version,'admin',reason,
    JSON.stringify({...block,revision:{version,updatedAt:now,updatedBy:'admin'}}),now
  ];
}

function rowToBlockSnapshot(row,headers){
  return {
    id:String(row[headers.block_id]||''),
    type:String(row[headers.type]||''),
    variant:String(row[headers.variant]||'default'),
    enabled:String(row[headers.enabled]||'TRUE').toUpperCase()!=='FALSE',
    content:parseJsonCell(row[headers.content_json],{}),
    evidence:parseJsonCell(row[headers.evidence_json],[]),
    aiPolicy:parseJsonCell(row[headers.ai_policy_json],{mode:'full'}),
    stylePresetId:String(row[headers.style_preset_id]||''),
    styleOverrides:normalizeBlockStyleV1(parseJsonCell(row[headers.style_overrides_json],{}))
  };
}

function normalizeBlockForSave(input,index){
  const block=plainObject(input)?input:{};
  const type=String(block.type||'').trim();
  if(!KNOWN_BLOCK_TYPES.has(type))throw new Error(`등록되지 않은 block type입니다: ${type}`);
  const id=cleanId(block.id||crypto.randomUUID(),180);
  const variant=String(block.variant||'default').trim().slice(0,80);
  const content=plainObject(block.content)?block.content:{};
  const evidence=Array.isArray(block.evidence)?block.evidence:[];
  const aiPolicy=plainObject(block.aiPolicy)?block.aiPolicy:{mode:'full'};
  const stylePresetId=cleanId(block.stylePresetId||'',180);
  const styleOverrides=normalizeBlockStyleV1(plainObject(block.styleOverrides)?block.styleOverrides:{});
  const jsonSize=stableJson({content,evidence,aiPolicy,styleOverrides}).length;
  if(jsonSize>40000)throw new Error(`블록 내용이 너무 큽니다: ${type}`);
  return {id,type,variant,enabled:block.enabled!==false,sortOrder:index+1,content,evidence,aiPolicy,stylePresetId,styleOverrides};
}

function stableJson(value){return JSON.stringify(stableValue(value));}
function stableValue(value){
  if(Array.isArray(value))return value.map(stableValue);
  if(value&&typeof value==='object'){
    const result={};
    for(const key of Object.keys(value).sort())result[key]=stableValue(value[key]);
    return result;
  }
  return value;
}
function plainObject(value){return Boolean(value&&typeof value==='object'&&!Array.isArray(value));}
function parseJsonCell(value,fallback){try{return value?JSON.parse(String(value)):fallback;}catch{return fallback;}}
function cleanId(value,max){return String(value||'').trim().replace(/[^a-zA-Z0-9_.:-]/g,'-').slice(0,max);}
function cleanSlug(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160);}

function ensureHeaderMap(headers,expected){
  const source=Array.isArray(headers)?headers.map(v=>String(v||'').trim()):[];
  const map={};
  expected.forEach(name=>{const index=source.indexOf(name);if(index<0)throw new Error(`${name} 헤더가 없습니다.`);map[name]=index;});
  return map;
}

function sameOriginRequest(request){const origin=request.headers.get('Origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}}
function adminAuthorized(request,env){const expected=String(env.ADMIN_EDITOR_TOKEN||'');if(!expected)return false;const header=String(request.headers.get('Authorization')||'');const supplied=header.startsWith('Bearer ')?header.slice(7):'';return constantTimeEqual(supplied,expected);}
function constantTimeEqual(a,b){const aa=new TextEncoder().encode(String(a));const bb=new TextEncoder().encode(String(b));if(aa.length!==bb.length)return false;let diff=0;for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;}
async function readJson(request){const length=Number(request.headers.get('content-length')||0);if(length>2_000_000)throw new Error('요청 크기가 너무 큽니다.');return request.json().catch(()=>{throw new Error('JSON 요청을 확인해 주세요.');});}

async function readSheetValues(env,sheetName){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const range=encodeURIComponent(`${sheetName}!A:ZZ`);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];
}
async function appendRange(env,range,values){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 추가 실패 (${response.status})`);return data;
}
async function updateRange(env,range,values){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;const response=await fetch(url,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 수정 실패 (${response.status})`);return data;
}
async function clearRange(env,range){
  const token=await getAccessToken(env);const sheetId=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:clear`;const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 삭제 실패 (${response.status})`);return data;
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
