const SHEETS={
  pages:'PLATFORM_PAGES',
  blocks:'PAGE_BLOCKS',
  revisions:'BLOCK_REVISIONS',
  reviews:'BLOCK_REVIEWS'
};

const KNOWN_BLOCK_TYPES=new Set([
  'hero','chapter-hero','section-heading','rich-text','process','metric-grid','offer-rail','notice','comparison-cards','checklist','media-rail','case-study-rail','product-tool','roadmap','script-copy','tutorial','resources','faq','pros-cons','comparison-table','timeline','image-copy-split','gallery','quote-expert','calculator','cta','service-list'
]);

let cachedToken=null;

export async function onRequest(context){
  const {request,env,params}=context;
  const path=Array.isArray(params.path)?params.path.join('/'):String(params.path||'');

  if(!sameOriginRequest(request))return json({ok:false,message:'허용되지 않은 요청입니다.'},403);
  if(!adminAuthorized(request,env))return json({ok:false,message:'관리자 인증이 필요합니다.'},401,{'Cache-Control':'no-store'});

  try{
    if(request.method==='GET'&&path==='health'){
      const account=parseServiceAccount(env);
      return json({
        ok:Boolean(env.ADMIN_EDITOR_TOKEN&&env.GOOGLE_SHEET_ID&&account?.client_email&&account?.private_key),
        editorTokenConfigured:Boolean(env.ADMIN_EDITOR_TOKEN),
        sheetConfigured:Boolean(env.GOOGLE_SHEET_ID),
        serviceAccountConfigured:Boolean(account?.client_email&&account?.private_key)
      },200,{'Cache-Control':'no-store'});
    }

    if(request.method==='GET'&&path==='pages')return json(await listPages(env),200,{'Cache-Control':'no-store'});

    if(request.method==='GET'&&path==='page'){
      const id=String(new URL(request.url).searchParams.get('id')||'').trim();
      if(!id)return json({ok:false,message:'page id가 필요합니다.'},400);
      return json(await getPage(env,id),200,{'Cache-Control':'no-store'});
    }

    if(request.method==='POST'&&path==='page'){
      const body=await readJson(request);
      return json(await saveDraftPage(env,body),200,{'Cache-Control':'no-store'});
    }

    if(request.method==='POST'&&path==='reviews'){
      const body=await readJson(request);
      return json(await saveBlockReviews(env,body),200,{'Cache-Control':'no-store'});
    }

    return json({ok:false,message:'Not found'},404,{'Cache-Control':'no-store'});
  }catch(error){
    console.error(error);
    return json({ok:false,message:safeErrorMessage(error)},500,{'Cache-Control':'no-store'});
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

async function readJson(request){
  const length=Number(request.headers.get('content-length')||0);
  if(length>2_000_000)throw new Error('요청 크기가 너무 큽니다.');
  return request.json().catch(()=>{throw new Error('JSON 요청을 확인해 주세요.');});
}

async function listPages(env){
  const rows=await readSheetObjects(env,SHEETS.pages,true);
  const pages=rows.filter(row=>row.page_id).map(row=>({
    pageId:String(row.page_id),slug:String(row.slug||''),industryId:String(row.industry_id||''),title:String(row.title||''),status:String(row.status||'draft'),theme:String(row.theme||'light'),updatedAt:String(row.updated_at||''),publishedAt:String(row.published_at||'')
  }));
  return {ok:true,pages};
}

async function getPage(env,pageId){
  const [pageRows,blockRows]=await Promise.all([readSheetObjects(env,SHEETS.pages,true),readSheetObjects(env,SHEETS.blocks,true)]);
  const row=pageRows.find(item=>String(item.page_id||'')===pageId);
  if(!row)return {ok:false,message:'페이지를 찾지 못했습니다.',page:null};
  const blocks=blockRows
    .filter(item=>String(item.page_id||'')===pageId&&String(item.block_id||''))
    .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))
    .map(rowToBlock);
  return {ok:true,page:{
    pageId:String(row.page_id),slug:String(row.slug||''),industryId:String(row.industry_id||''),title:String(row.title||''),status:String(row.status||'draft'),theme:String(row.theme||'light'),seo:parseJsonCell(row.seo_json,{}),createdAt:String(row.created_at||''),updatedAt:String(row.updated_at||''),publishedAt:String(row.published_at||''),blocks
  }};
}

async function saveDraftPage(env,body){
  const page=body?.page&&typeof body.page==='object'?body.page:{};
  const blocks=Array.isArray(body?.blocks)?body.blocks:[];
  const pageId=cleanId(page.pageId||crypto.randomUUID(),160);
  const slug=cleanSlug(page.slug||pageId);
  const industryId=cleanId(page.industryId||'general',120);
  const title=String(page.title||'새 분야 가이드').trim().slice(0,300);
  const theme=['light','dark','system'].includes(page.theme)?page.theme:'light';
  const seo=page.seo&&typeof page.seo==='object'?page.seo:{};
  const now=koreaTime();

  if(!title)throw new Error('페이지 제목을 확인해 주세요.');
  if(blocks.length>300)throw new Error('한 페이지의 블록 수가 너무 많습니다.');

  const normalizedBlocks=blocks.map((block,index)=>normalizeBlockForSave(block,index));
  const uniqueBlockIds=new Set(normalizedBlocks.map(block=>block.id));
  if(uniqueBlockIds.size!==normalizedBlocks.length)throw new Error('같은 block id가 중복돼 있습니다.');

  const [pageValues,blockValues]=await Promise.all([readSheetValues(env,SHEETS.pages),readSheetValues(env,SHEETS.blocks)]);
  const pageHeaders=ensureHeaderMap(pageValues[0],['page_id','slug','industry_id','title','status','theme','seo_json','created_at','updated_at','published_at']);
  const blockHeaders=ensureHeaderMap(blockValues[0],['page_id','block_id','sort_order','type','variant','enabled','content_json','evidence_json','ai_policy_json','revision_version','created_at','updated_at','published_version']);

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

  const pageRecord=[[pageId,slug,industryId,title,'draft',theme,JSON.stringify(seo),createdAt,now,publishedAt]];
  if(pageRow>0)await updateRange(env,`${SHEETS.pages}!A${pageRow}:J${pageRow}`,pageRecord);
  else await appendRange(env,`${SHEETS.pages}!A:J`,pageRecord);

  const existingById=new Map();
  for(let i=1;i<blockValues.length;i++){
    if(String(blockValues[i][blockHeaders.page_id]||'')!==pageId)continue;
    const blockId=String(blockValues[i][blockHeaders.block_id]||'');
    if(blockId)existingById.set(blockId,{row:blockValues[i],rowNumber:i+1});
  }

  const currentIds=new Set();
  const rowsToAppend=[];
  const revisionRows=[];

  for(const block of normalizedBlocks){
    currentIds.add(block.id);
    const existing=existingById.get(block.id);
    const previousVersion=existing?Number(existing.row[blockHeaders.revision_version]||0):0;
    const version=Math.max(1,previousVersion+1);
    const blockCreatedAt=existing?String(existing.row[blockHeaders.created_at]||now):now;
    const publishedVersion=existing?String(existing.row[blockHeaders.published_version]||''):'';
    const row=[pageId,block.id,block.sortOrder,block.type,block.variant,block.enabled?'TRUE':'FALSE',JSON.stringify(block.content),JSON.stringify(block.evidence),JSON.stringify(block.aiPolicy),version,blockCreatedAt,now,publishedVersion];

    if(existing)await updateRange(env,`${SHEETS.blocks}!A${existing.rowNumber}:M${existing.rowNumber}`,[row]);
    else rowsToAppend.push(row);

    revisionRows.push([crypto.randomUUID(),pageId,block.id,version,'admin','draft save',JSON.stringify({...block,revision:{version,updatedAt:now}}),now]);
  }

  if(rowsToAppend.length)await appendRange(env,`${SHEETS.blocks}!A:M`,rowsToAppend);

  const obsoleteRows=[...existingById.entries()]
    .filter(([blockId])=>!currentIds.has(blockId))
    .map(([,entry])=>entry.rowNumber)
    .sort((a,b)=>b-a);

  for(const rowNumber of obsoleteRows)await clearRange(env,`${SHEETS.blocks}!A${rowNumber}:M${rowNumber}`);
  if(revisionRows.length)await appendRange(env,`${SHEETS.revisions}!A:H`,revisionRows);

  return {ok:true,pageId,slug,status:'draft',blockCount:normalizedBlocks.length,updatedAt:now};
}

function normalizeBlockForSave(input,index){
  const block=input&&typeof input==='object'?input:{};
  const type=String(block.type||'').trim();
  if(!KNOWN_BLOCK_TYPES.has(type))throw new Error(`등록되지 않은 block type입니다: ${type}`);
  const id=cleanId(block.id||crypto.randomUUID(),180);
  const variant=String(block.variant||'default').trim().slice(0,80);
  const content=block.content&&typeof block.content==='object'&&!Array.isArray(block.content)?block.content:{};
  const evidence=Array.isArray(block.evidence)?block.evidence:[];
  const aiPolicy=block.aiPolicy&&typeof block.aiPolicy==='object'&&!Array.isArray(block.aiPolicy)?block.aiPolicy:{mode:'full'};
  const jsonSize=JSON.stringify({content,evidence,aiPolicy}).length;
  if(jsonSize>40000)throw new Error(`블록 내용이 너무 큽니다: ${type}`);
  return {id,type,variant,enabled:block.enabled!==false,sortOrder:index+1,content,evidence,aiPolicy};
}

async function saveBlockReviews(env,body){
  const reviews=Array.isArray(body?.reviews)?body.reviews:[];
  if(reviews.length>100)throw new Error('검토 항목 수를 확인해 주세요.');
  const allowed=new Set(['undecided','approved','redesign','merge','deprecated']);
  const reviewer=String(body?.reviewer||'admin').trim().slice(0,120)||'admin';
  const now=koreaTime();
  const values=await readSheetValues(env,SHEETS.reviews);
  const headers=ensureHeaderMap(values[0],['block_type','decision','note','reviewer','updated_at']);
  const rowByType=new Map();
  for(let i=1;i<values.length;i++){
    const type=String(values[i][headers.block_type]||'');
    if(type)rowByType.set(type,i+1);
  }
  for(const item of reviews){
    const type=String(item?.type||'').trim();
    if(!KNOWN_BLOCK_TYPES.has(type))continue;
    const decision=allowed.has(item?.decision)?item.decision:'undecided';
    const note=String(item?.note||'').trim().slice(0,5000);
    const row=[[type,decision,note,reviewer,now]];
    const target=rowByType.get(type);
    if(target)await updateRange(env,`${SHEETS.reviews}!A${target}:E${target}`,row);
    else await appendRange(env,`${SHEETS.reviews}!A:E`,row);
  }
  return {ok:true,count:reviews.length,updatedAt:now};
}

function rowToBlock(row){
  return {
    id:String(row.block_id||''),type:String(row.type||''),variant:String(row.variant||'default'),enabled:String(row.enabled||'TRUE').toUpperCase()!=='FALSE',content:parseJsonCell(row.content_json,{}),evidence:parseJsonCell(row.evidence_json,[]),aiPolicy:parseJsonCell(row.ai_policy_json,{mode:'full'}),revision:{version:Number(row.revision_version||1),updatedAt:String(row.updated_at||'')}
  };
}

function parseJsonCell(value,fallback){try{return value?JSON.parse(String(value)):fallback;}catch{return fallback;}}
function cleanId(value,max){return String(value||'').trim().replace(/[^a-zA-Z0-9_.:-]/g,'-').slice(0,max);}
function cleanSlug(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9가-힣-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160)||'page';}

function ensureHeaderMap(headers,expected){
  const source=Array.isArray(headers)?headers.map(v=>String(v||'').trim()):[];
  const map={};
  expected.forEach(name=>{const index=source.indexOf(name);if(index<0)throw new Error(`${name} 헤더가 없습니다.`);map[name]=index;});
  return map;
}

function valuesToObjects(values){
  if(!values.length)return [];
  const headers=values[0].map(v=>String(v||'').trim());
  return values.slice(1).filter(row=>row.some(cell=>String(cell||'').trim()!=='')).map(row=>{const obj={};headers.forEach((header,i)=>{if(header)obj[header]=row[i]??'';});return obj;});
}

async function readSheetObjects(env,sheetName,allowMissing=false){
  try{return valuesToObjects(await readSheetValues(env,sheetName));}
  catch(error){if(allowMissing)return [];throw error;}
}

async function readSheetValues(env,sheetName,allowMissing=false){
  try{
    const token=await getAccessToken(env);const sheetId=requireSheetId(env);const range=encodeURIComponent(`${sheetName}!A:ZZ`);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];
  }catch(error){if(allowMissing)return [];throw error;}
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
function safeErrorMessage(error){const message=String(error?.message||error||'요청 처리 중 오류가 발생했습니다.');return message.replace(/-----BEGIN[\s\S]+/g,'[redacted]').slice(0,500);}
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff',...headers}});}
