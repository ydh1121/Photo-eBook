import {isKnownBlockType} from './block-registry-v1.js';
import {isKnownBlockVariant} from './block-variants-v1.js';
import {getBlockVariantApproval} from './block-approval-v1.js';
import {normalizeBlockStyleV1} from './block-style-v1.js';
import {isKnownUiCapability} from './ui-capabilities-v1.js';

let cachedToken=null;

const SHEETS={
  pages:'PLATFORM_PAGES',
  blocks:'PAGE_BLOCKS',
  variantReviews:'BLOCK_VARIANT_REVIEWS',
  stylePresets:'BLOCK_STYLE_PRESETS',
  pageUi:'PAGE_UI_CONFIG',
  uiPresets:'UI_PRESETS',
  snapshots:'PUBLISH_SNAPSHOTS',
  publishedBlocks:'PUBLISHED_BLOCKS',
  publishedStyles:'PUBLISHED_BLOCK_STYLES',
  publishedUi:'PUBLISHED_UI_CONFIG'
};

export async function validatePageForPublish(env,pageId){
  const source=await loadSource(env,pageId);
  if(!source.page)return {ok:true,canPublish:false,errors:['페이지를 찾지 못했습니다.'],warnings:[],source:null};
  const errors=[];
  const warnings=[];
  const page=source.page;
  const enabledBlocks=source.blocks.filter(block=>block.enabled);

  if(!page.slug)errors.push('공개 URL slug를 입력하세요.');
  if(!enabledBlocks.length)errors.push('공개할 블록이 없습니다.');
  if(['drafting','needs_review'].includes(page.aiStatus))errors.push('AI 작업 결과의 사람 검토가 필요합니다.');
  if(page.aiStatus==='brief_ready')warnings.push('AI 작성 기준만 준비된 상태입니다. 현재 내용이 최종본인지 확인하세요.');

  const seo=page.seo||{};
  const indexPolicy=String(seo.indexPolicy||seo.index_policy||'index');
  if(indexPolicy==='index'){
    if(!String(seo.title||page.title||'').trim())errors.push('검색 제목을 확인하세요.');
    if(!String(seo.description||'').trim())errors.push('검색 설명을 입력하세요.');
  }

  const activeSlugConflict=source.snapshots.find(snapshot=>snapshot.state==='active'&&snapshot.slug===page.slug&&snapshot.pageId!==page.id);
  if(activeSlugConflict)errors.push('같은 공개 URL을 사용하는 다른 페이지가 있습니다.');

  for(const block of enabledBlocks){
    if(!isKnownBlockType(block.type)||!isKnownBlockVariant(block.type,block.variant)){
      errors.push(`등록되지 않은 블록 variant입니다: ${block.type}/${block.variant}`);
      continue;
    }
    const variantKey=`${block.type}::${block.variant}`;
    const variantApproval=source.variantApprovalByKey.get(variantKey)||getBlockVariantApproval(block.type,block.variant);
    if(variantApproval!=='approved'){
      errors.push(`승인되지 않은 블록 variant입니다: ${block.type}/${block.variant} (${variantApproval})`);
    }
    const factState=String(block.aiPolicy?.factState||'not_required');
    if(['needs_verification','stale'].includes(factState))errors.push(`최신 사실 확인이 필요한 블록입니다: ${block.type}`);
    if(factState==='verified'&&(!Array.isArray(block.evidence)||!block.evidence.length))errors.push(`검증 완료 상태인데 근거가 없는 블록입니다: ${block.type}`);

    if(block.stylePresetId){
      const preset=source.stylePresetById.get(block.stylePresetId);
      if(!preset)errors.push(`블록 스타일 preset을 찾지 못했습니다: ${block.stylePresetId}`);
      else{
        if(preset.blockType!==block.type||preset.variant!==block.variant)errors.push(`현재 variant와 스타일 preset이 맞지 않습니다: ${block.type}/${block.variant}`);
        if(preset.status!=='approved')errors.push(`승인되지 않은 블록 스타일 preset입니다: ${preset.name||preset.id}`);
      }
    }
  }

  for(const item of source.pageUi){
    if(!isKnownUiCapability(item.capabilityId)){warnings.push(`등록되지 않은 페이지 UI 설정을 무시합니다: ${item.capabilityId}`);continue;}
    if(!item.enabled)continue;
    if(!item.presetId){errors.push(`페이지 UI preset을 선택하세요: ${item.capabilityId}`);continue;}
    const preset=source.uiPresetById.get(item.presetId);
    if(!preset)errors.push(`페이지 UI preset을 찾지 못했습니다: ${item.presetId}`);
    else{
      if(preset.capabilityId!==item.capabilityId)errors.push(`페이지 UI 기능과 preset이 맞지 않습니다: ${item.capabilityId}`);
      if(preset.status!=='approved')errors.push(`승인되지 않은 페이지 UI preset입니다: ${preset.name||preset.id}`);
    }
  }

  return {ok:true,canPublish:errors.length===0,errors,warnings,source};
}

export async function publishPageSnapshot(env,pageId,actor='platform-owner'){
  const validation=await validatePageForPublish(env,pageId);
  if(!validation.canPublish)return {ok:false,canPublish:false,errors:validation.errors,warnings:validation.warnings};
  const source=validation.source;
  const page=source.page;
  const enabledBlocks=source.blocks.filter(block=>block.enabled).sort((a,b)=>a.sortOrder-b.sortOrder);
  const pageSnapshots=source.snapshots.filter(snapshot=>snapshot.pageId===page.id);
  const version=Math.max(0,...pageSnapshots.map(snapshot=>snapshot.version||0))+1;
  const snapshotId=crypto.randomUUID();
  const now=koreaTime();

  await appendRange(env,`${SHEETS.snapshots}!A:K`,[[snapshotId,page.id,version,page.slug,page.industryId,page.title,page.theme,JSON.stringify(page.seo||{}),page.updatedAt||now,now,'building']]);

  const publishedBlockRows=[];
  const publishedStyleRows=[];
  for(const block of enabledBlocks){
    publishedBlockRows.push([snapshotId,page.id,block.id,block.sortOrder,block.type,block.variant,JSON.stringify(block.content||{}),JSON.stringify(block.evidence||[]),block.revisionVersion||1,now]);
    const preset=block.stylePresetId?source.stylePresetById.get(block.stylePresetId):null;
    const resolvedStyle={...(preset?.style||{}),...normalizeBlockStyleV1(block.styleOverrides||{})};
    publishedStyleRows.push([snapshotId,page.id,block.id,block.stylePresetId||'',JSON.stringify(normalizeBlockStyleV1(resolvedStyle)),now]);
  }
  if(publishedBlockRows.length)await appendRange(env,`${SHEETS.publishedBlocks}!A:J`,publishedBlockRows);
  if(publishedStyleRows.length)await appendRange(env,`${SHEETS.publishedStyles}!A:F`,publishedStyleRows);

  const publishedUiRows=[];
  for(const item of source.pageUi){
    if(!isKnownUiCapability(item.capabilityId))continue;
    const preset=item.presetId?source.uiPresetById.get(item.presetId):null;
    const resolvedConfig={...(preset?.config||{}),...(item.overrides||{})};
    publishedUiRows.push([snapshotId,page.id,item.capabilityId,item.enabled?'TRUE':'FALSE',item.presetId||'',JSON.stringify(resolvedConfig),now]);
  }
  if(publishedUiRows.length)await appendRange(env,`${SHEETS.publishedUi}!A:G`,publishedUiRows);

  const snapshotRow=source.snapshotRows.find(row=>String(row.values[source.snapshotHeaders.snapshot_id]||'')===snapshotId);
  if(snapshotRow)throw new Error('새 snapshot row 상태가 예상과 다릅니다.');
  const latestSnapshotValues=await readSheetValues(env,SHEETS.snapshots);
  const latestHeaders=ensureHeaderMap(latestSnapshotValues[0],['snapshot_id','page_id','version','slug','industry_id','title','theme','seo_json','source_updated_at','published_at','state']);
  let newRowNumber=-1;
  const oldActiveRows=[];
  for(let i=1;i<latestSnapshotValues.length;i++){
    const row=latestSnapshotValues[i];
    if(String(row[latestHeaders.snapshot_id]||'')===snapshotId)newRowNumber=i+1;
    else if(String(row[latestHeaders.page_id]||'')===page.id&&String(row[latestHeaders.state]||'')==='active')oldActiveRows.push(i+1);
  }
  if(newRowNumber<0)throw new Error('새 snapshot row를 찾지 못했습니다.');

  await updateRange(env,`${SHEETS.snapshots}!K${newRowNumber}:K${newRowNumber}`,[['active']]);
  for(const rowNumber of oldActiveRows)await updateRange(env,`${SHEETS.snapshots}!K${rowNumber}:K${rowNumber}`,[['superseded']]);

  await markPagePublished(env,source,page,now);
  await markBlocksPublished(env,source,enabledBlocks,version,now);

  return {ok:true,canPublish:true,snapshotId,pageId:page.id,slug:page.slug,version,publishedAt:now,blockCount:enabledBlocks.length,uiCapabilityCount:publishedUiRows.length,actor,warnings:validation.warnings};
}

async function loadSource(env,pageId){
  const names=[SHEETS.pages,SHEETS.blocks,SHEETS.variantReviews,SHEETS.stylePresets,SHEETS.pageUi,SHEETS.uiPresets,SHEETS.snapshots];
  const values=await Promise.all(names.map(name=>readSheetValues(env,name)));
  const byName=Object.fromEntries(names.map((name,index)=>[name,values[index]]));

  const pageHeaders=ensureHeaderMap(byName[SHEETS.pages][0],['page_id','slug','industry_id','title','status','theme','seo_json','created_at','updated_at','published_at','brief_json','ai_status','ai_review_json']);
  const blockHeaders=ensureHeaderMap(byName[SHEETS.blocks][0],['page_id','block_id','sort_order','type','variant','enabled','content_json','evidence_json','ai_policy_json','revision_version','created_at','updated_at','published_version','style_preset_id','style_overrides_json']);
  const variantReviewHeaders=ensureHeaderMap(byName[SHEETS.variantReviews][0],['block_type','variant','decision','note','reviewer','updated_at','difference_type','maturity']);
  const styleHeaders=ensureHeaderMap(byName[SHEETS.stylePresets][0],['preset_id','block_type','variant','name','style_json','source','status','created_at','updated_at','notes','version','preview_meta_json']);
  const pageUiHeaders=ensureHeaderMap(byName[SHEETS.pageUi][0],['page_id','capability_id','enabled','preset_id','override_json','updated_at','updated_by','version']);
  const uiPresetHeaders=ensureHeaderMap(byName[SHEETS.uiPresets][0],['preset_id','capability_id','name','config_json','source','status','created_at','updated_at','notes','version']);
  const snapshotHeaders=ensureHeaderMap(byName[SHEETS.snapshots][0],['snapshot_id','page_id','version','slug','industry_id','title','theme','seo_json','source_updated_at','published_at','state']);

  let page=null;
  let pageRowNumber=-1;
  for(let i=1;i<byName[SHEETS.pages].length;i++){
    const row=byName[SHEETS.pages][i];
    if(String(row[pageHeaders.page_id]||'')===pageId){
      pageRowNumber=i+1;
      page={id:pageId,slug:String(row[pageHeaders.slug]||''),industryId:String(row[pageHeaders.industry_id]||'general'),title:String(row[pageHeaders.title]||''),status:String(row[pageHeaders.status]||'draft'),theme:String(row[pageHeaders.theme]||'light'),seo:parseJson(row[pageHeaders.seo_json],{}),aiStatus:String(row[pageHeaders.ai_status]||'not_requested'),updatedAt:String(row[pageHeaders.updated_at]||''),row:[...row]};
      break;
    }
  }

  const blocks=[];
  const blockRows=[];
  for(let i=1;i<byName[SHEETS.blocks].length;i++){
    const row=byName[SHEETS.blocks][i];
    if(String(row[blockHeaders.page_id]||'')!==pageId)continue;
    const block={id:String(row[blockHeaders.block_id]||''),sortOrder:Number(row[blockHeaders.sort_order]||0),type:String(row[blockHeaders.type]||''),variant:String(row[blockHeaders.variant]||'default'),enabled:String(row[blockHeaders.enabled]||'TRUE').toUpperCase()!=='FALSE',content:parseJson(row[blockHeaders.content_json],{}),evidence:parseJson(row[blockHeaders.evidence_json],[]),aiPolicy:parseJson(row[blockHeaders.ai_policy_json],{mode:'full'}),revisionVersion:Number(row[blockHeaders.revision_version]||1)||1,stylePresetId:String(row[blockHeaders.style_preset_id]||''),styleOverrides:normalizeBlockStyleV1(parseJson(row[blockHeaders.style_overrides_json],{})),rowNumber:i+1};
    blocks.push(block);blockRows.push({blockId:block.id,rowNumber:i+1});
  }

  const variantApprovalByKey=new Map();
  for(let i=1;i<byName[SHEETS.variantReviews].length;i++){
    const row=byName[SHEETS.variantReviews][i];
    const type=String(row[variantReviewHeaders.block_type]||'');
    const variant=String(row[variantReviewHeaders.variant]||'');
    if(!type||!variant||!isKnownBlockVariant(type,variant))continue;
    const decision=String(row[variantReviewHeaders.decision]||'undecided');
    variantApprovalByKey.set(`${type}::${variant}`,decision);
  }

  const stylePresetById=new Map();
  for(let i=1;i<byName[SHEETS.stylePresets].length;i++){
    const row=byName[SHEETS.stylePresets][i];const id=String(row[styleHeaders.preset_id]||'');if(!id)continue;
    stylePresetById.set(id,{id,blockType:String(row[styleHeaders.block_type]||''),variant:String(row[styleHeaders.variant]||''),name:String(row[styleHeaders.name]||''),style:normalizeBlockStyleV1(parseJson(row[styleHeaders.style_json],{})),source:String(row[styleHeaders.source]||''),status:String(row[styleHeaders.status]||'draft')});
  }

  const pageUi=[];
  for(let i=1;i<byName[SHEETS.pageUi].length;i++){
    const row=byName[SHEETS.pageUi][i];if(String(row[pageUiHeaders.page_id]||'')!==pageId)continue;
    pageUi.push({capabilityId:String(row[pageUiHeaders.capability_id]||''),enabled:String(row[pageUiHeaders.enabled]||'TRUE').toUpperCase()!=='FALSE',presetId:String(row[pageUiHeaders.preset_id]||''),overrides:parseJson(row[pageUiHeaders.override_json],{})});
  }

  const uiPresetById=new Map();
  for(let i=1;i<byName[SHEETS.uiPresets].length;i++){
    const row=byName[SHEETS.uiPresets][i];const id=String(row[uiPresetHeaders.preset_id]||'');if(!id)continue;
    uiPresetById.set(id,{id,capabilityId:String(row[uiPresetHeaders.capability_id]||''),name:String(row[uiPresetHeaders.name]||''),config:parseJson(row[uiPresetHeaders.config_json],{}),source:String(row[uiPresetHeaders.source]||''),status:String(row[uiPresetHeaders.status]||'draft')});
  }

  const snapshots=[];
  const snapshotRows=[];
  for(let i=1;i<byName[SHEETS.snapshots].length;i++){
    const row=byName[SHEETS.snapshots][i];
    const item={snapshotId:String(row[snapshotHeaders.snapshot_id]||''),pageId:String(row[snapshotHeaders.page_id]||''),version:Number(row[snapshotHeaders.version]||0),slug:String(row[snapshotHeaders.slug]||''),state:String(row[snapshotHeaders.state]||'')};
    snapshots.push(item);snapshotRows.push({values:row,rowNumber:i+1});
  }

  return {page,pageRowNumber,pageHeaders,blocks,blockRows,blockHeaders,variantApprovalByKey,stylePresetById,pageUi,uiPresetById,snapshots,snapshotRows,snapshotHeaders};
}

async function markPagePublished(env,source,page,now){
  if(source.pageRowNumber<0)return;
  const row=[...page.row];
  while(row.length<13)row.push('');
  row[source.pageHeaders.status]='published';
  row[source.pageHeaders.updated_at]=now;
  row[source.pageHeaders.published_at]=now;
  await updateRange(env,`${SHEETS.pages}!A${source.pageRowNumber}:M${source.pageRowNumber}`,[row.slice(0,13)]);
}

async function markBlocksPublished(env,source,blocks,version,now){
  const byId=new Map(source.blockRows.map(item=>[item.blockId,item.rowNumber]));
  for(const block of blocks){
    const rowNumber=byId.get(block.id);if(!rowNumber)continue;
    await updateRange(env,`${SHEETS.blocks}!M${rowNumber}:M${rowNumber}`,[[version]]);
    await updateRange(env,`${SHEETS.blocks}!L${rowNumber}:L${rowNumber}`,[[now]]);
  }
}

function parseJson(value,fallback){if(!value)return fallback;try{return JSON.parse(String(value));}catch{return fallback;}}
function ensureHeaderMap(row,required){const headers=(Array.isArray(row)?row:[]).map(value=>String(value||'').trim());const map={};required.forEach(name=>{const index=headers.indexOf(name);if(index<0)throw new Error(`${name} 헤더가 없습니다.`);map[name]=index;});return map;}

async function readSheetValues(env,sheetName){const token=await getAccessToken(env);const id=requireSheetId(env);const range=encodeURIComponent(`${sheetName}!A:ZZ`);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);return Array.isArray(data.values)?data.values:[];}
async function appendRange(env,range,values){const token=await getAccessToken(env);const id=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 추가 실패 (${response.status})`);return data;}
async function updateRange(env,range,values){const token=await getAccessToken(env);const id=requireSheetId(env);const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;const response=await fetch(url,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 수정 실패 (${response.status})`);return data;}

async function getAccessToken(env){const now=Math.floor(Date.now()/1000);if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;const account=parseServiceAccount(env);if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';const header=base64UrlJson({alg:'RS256',typ:'JWT'});const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:tokenUri,exp:now+3600,iat:now});const signingInput=`${header}.${claims}`;const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth-grant-type:jwt-bearer',assertion})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};return cachedToken.token;}
function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function koreaTime(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()).replace(' ','T')+'+09:00';}