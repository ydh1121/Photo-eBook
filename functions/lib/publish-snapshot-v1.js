import {blockStatus,isKnownBlockType,isApprovedBlockType} from './block-registry-v1.js';
import {isKnownBlockVariant} from './block-variants-v1.js';
import {findBlockStylePresetV1,normalizeBlockStyleV1,resolveBlockStyleV1} from './block-style-v1.js';
import {isKnownUiCapability,resolveUiCapabilityConfigV1,sanitizeUiConfigV1} from './ui-capabilities-v1.js';

let cachedToken=null;

const SHEETS=Object.freeze({
  pages:'PLATFORM_PAGES',
  blocks:'PAGE_BLOCKS',
  blockStyles:'BLOCK_STYLE_PRESETS',
  pageUi:'PAGE_UI_CONFIG',
  uiPresets:'UI_PRESETS',
  snapshots:'PUBLISH_SNAPSHOTS',
  publishedBlocks:'PUBLISHED_BLOCKS'
});

export async function checkPublishSnapshotV1(env,pageId){
  const id=String(pageId||'').trim();
  if(!id)return {ok:false,canPublish:false,message:'page id가 필요합니다.',errors:['page id가 없습니다.'],warnings:[]};
  const bundle=await loadDraftBundle(env,id);
  if(!bundle.page)return {ok:false,canPublish:false,message:'페이지를 찾지 못했습니다.',errors:['서버 초안을 찾지 못했습니다.'],warnings:[]};
  const validation=validateBundle(bundle);
  return {ok:true,pageId:id,...validation};
}

export async function publishSnapshotV1(env,pageId){
  const id=String(pageId||'').trim();
  if(!id)return {ok:false,canPublish:false,message:'page id가 필요합니다.',errors:['page id가 없습니다.'],warnings:[]};

  const bundle=await loadDraftBundle(env,id);
  if(!bundle.page)return {ok:false,canPublish:false,message:'페이지를 찾지 못했습니다.',errors:['서버 초안을 찾지 못했습니다.'],warnings:[]};

  const validation=validateBundle(bundle);
  if(!validation.canPublish)return {ok:false,pageId:id,...validation,message:'발행 조건을 충족하지 못했습니다.'};

  const [snapshotValues,pageValues,blockValues]=await Promise.all([
    readSheetValues(env,`${SHEETS.snapshots}!A:L`),
    readSheetValues(env,`${SHEETS.pages}!A:M`),
    readSheetValues(env,`${SHEETS.blocks}!A:O`)
  ]);
  const snapshotHeaders=ensureHeaderMap(snapshotValues[0],['snapshot_id','page_id','version','slug','industry_id','title','theme','seo_json','source_updated_at','published_at','state','resolved_ui_json'],SHEETS.snapshots);
  const pageHeaders=ensureHeaderMap(pageValues[0],['page_id','slug','industry_id','title','status','theme','seo_json','created_at','updated_at','published_at','brief_json','ai_status','ai_review_json'],SHEETS.pages);
  const blockHeaders=ensureHeaderMap(blockValues[0],['page_id','block_id','sort_order','type','variant','enabled','content_json','evidence_json','ai_policy_json','revision_version','created_at','updated_at','published_version','style_preset_id','style_overrides_json'],SHEETS.blocks);

  let version=1;
  const previousActiveRows=[];
  for(let i=1;i<snapshotValues.length;i++){
    if(String(snapshotValues[i][snapshotHeaders.page_id]||'')!==id)continue;
    version=Math.max(version,Number(snapshotValues[i][snapshotHeaders.version]||0)+1);
    if(String(snapshotValues[i][snapshotHeaders.state]||'')==='active')previousActiveRows.push(i+1);
  }

  const snapshotId=crypto.randomUUID();
  const now=koreaTime();
  const enabledBlocks=bundle.blocks.filter(block=>block.enabled!==false);
  const publishedRows=enabledBlocks.map((block,index)=>{
    const resolvedStyle=resolveBlockStyleV1(block,bundle.blockStylePresets);
    return [
      snapshotId,id,block.id,index+1,block.type,block.variant,
      JSON.stringify(block.content||{}),JSON.stringify(block.evidence||[]),
      Number(block?.revision?.version||1),now,
      block.stylePresetId||'',JSON.stringify(normalizeBlockStyleV1(block.styleOverrides||{})),JSON.stringify(resolvedStyle)
    ];
  });
  if(publishedRows.length)await appendRange(env,`${SHEETS.publishedBlocks}!A:M`,publishedRows);

  const resolvedUi=resolvePageUi(bundle);
  const snapshotRow=[[
    snapshotId,id,version,bundle.page.slug,bundle.page.industryId,bundle.page.title,bundle.page.theme,
    JSON.stringify(bundle.page.seo||{}),bundle.page.updatedAt||'',now,'active',JSON.stringify(resolvedUi)
  ]];
  await appendRange(env,`${SHEETS.snapshots}!A:L`,snapshotRow);

  for(const rowNumber of previousActiveRows)await updateRange(env,`${SHEETS.snapshots}!K${rowNumber}:K${rowNumber}`,[['superseded']]);

  let pageRow=-1;
  for(let i=1;i<pageValues.length;i++)if(String(pageValues[i][pageHeaders.page_id]||'')===id){pageRow=i+1;break;}
  if(pageRow>0){
    const existing=pageValues[pageRow-1];
    const row=[[
      id,bundle.page.slug,bundle.page.industryId,bundle.page.title,'published',bundle.page.theme,
      JSON.stringify(bundle.page.seo||{}),String(existing[pageHeaders.created_at]||now),String(existing[pageHeaders.updated_at]||now),now,
      JSON.stringify(bundle.page.brief||{}),bundle.page.aiStatus||'not_requested',JSON.stringify(bundle.page.aiReview||{})
    ]];
    await updateRange(env,`${SHEETS.pages}!A${pageRow}:M${pageRow}`,row);
  }

  for(let i=1;i<blockValues.length;i++){
    if(String(blockValues[i][blockHeaders.page_id]||'')!==id)continue;
    const revisionVersion=String(blockValues[i][blockHeaders.revision_version]||'');
    await updateRange(env,`${SHEETS.blocks}!M${i+1}:M${i+1}`,[[revisionVersion]]);
  }

  return {
    ok:true,
    canPublish:true,
    pageId:id,
    snapshotId,
    version,
    publishedAt:now,
    resolvedBlockStyleCount:publishedRows.filter(row=>String(row[12]||'')!=='{}').length,
    resolvedUiCount:resolvedUi.items.length,
    warnings:validation.warnings
  };
}

function validateBundle(bundle){
  const page=bundle.page;
  const errors=[];
  const warnings=[];
  const seo=plainObject(page.seo)?page.seo:{};
  const blocks=bundle.blocks.filter(block=>block.enabled!==false);

  if(!page.pageId)errors.push('page id가 없습니다.');
  if(!String(page.slug||'').trim())errors.push('URL slug가 없습니다.');
  if(!String(page.title||'').trim())errors.push('페이지 제목이 없습니다.');
  if(!String(seo.title||'').trim())errors.push('SEO 제목이 없습니다.');
  if(!String(seo.description||'').trim())errors.push('SEO 설명이 없습니다.');
  if(!blocks.length)errors.push('공개할 블록이 없습니다.');

  if(page.aiStatus==='drafting')errors.push('AI 작성이 진행 중인 페이지입니다.');
  if(page.aiStatus==='needs_review')errors.push('AI 적용 결과에 대한 사용자 검토가 필요합니다.');
  if(page.aiStatus==='brief_ready')warnings.push('AI 작성 기준이 준비됐지만 AI 작업은 완료되지 않았습니다.');

  const ids=new Set();
  const duplicateIds=new Set();
  const nonApproved=[];
  for(const block of blocks){
    if(ids.has(block.id))duplicateIds.add(block.id);else ids.add(block.id);
    if(!isKnownBlockType(block.type)||!isKnownBlockVariant(block.type,block.variant)){
      errors.push(`등록되지 않은 block variant입니다: ${block.type} / ${block.variant}`);
      continue;
    }
    if(!isApprovedBlockType(block.type))nonApproved.push(`${block.type}(${blockStatus(block.type)})`);

    const factState=String(block?.aiPolicy?.factState||'');
    if(factState==='stale')errors.push(`${block.type} (${block.id}): 사실 정보가 재확인 상태입니다.`);
    else if(factState==='needs_verification')warnings.push(`${block.type} (${block.id}): 사실 확인이 필요합니다.`);

    if(block.stylePresetId){
      const preset=findBlockStylePresetV1(block,bundle.blockStylePresets);
      if(!preset)errors.push(`${block.type} (${block.id}): 현재 variant에 맞는 블록 스타일 preset을 찾지 못했습니다.`);
      else if(String(preset.status||'draft')!=='approved')warnings.push(`${block.type} (${block.id}): 블록 스타일 preset이 아직 ${String(preset.status||'draft')} 상태입니다.`);
    }
  }
  if(duplicateIds.size)errors.push(`중복 block id: ${[...duplicateIds].join(', ')}`);
  if(nonApproved.length)errors.push(`승인되지 않은 block type이 있습니다: ${[...new Set(nonApproved)].join(', ')}`);

  const review=plainObject(page.aiReview)?page.aiReview:{};
  const issues=Array.isArray(review.issues)?review.issues:[];
  const blockers=issues.filter(item=>String(item?.severity||'')==='blocker');
  if(blockers.length)errors.push(`AI/편집 검토의 차단 항목 ${blockers.length}개를 해결해야 합니다.`);

  for(const item of bundle.pageUiItems.filter(item=>item.enabled)){
    const resolved=resolveUiCapabilityConfigV1(item,bundle.uiPresets);
    if(item.presetId&&!resolved.presetFound)errors.push(`${item.capabilityId}: 연결된 UI preset을 찾지 못했습니다.`);
    else if(resolved.presetId&&resolved.presetStatus&&resolved.presetStatus!=='approved')warnings.push(`${item.capabilityId}: UI preset이 아직 ${resolved.presetStatus} 상태입니다.`);
  }

  if(!String(seo.ogImage||'').trim())warnings.push('대표 이미지가 없습니다.');
  if(!String(seo.authorName||'').trim())warnings.push('작성/검토자 정보가 없습니다.');
  if(!String(seo.reviewedAt||'').trim())warnings.push('내용 확인일이 없습니다.');

  return {canPublish:errors.length===0,errors,warnings,checkedAt:koreaTime()};
}

function resolvePageUi(bundle){
  const items=bundle.pageUiItems
    .filter(item=>isKnownUiCapability(item.capabilityId))
    .map(item=>{
      const resolved=resolveUiCapabilityConfigV1(item,bundle.uiPresets);
      return {
        capabilityId:resolved.capabilityId,
        enabled:resolved.enabled,
        presetId:resolved.presetId,
        presetSource:resolved.presetSource,
        presetStatus:resolved.presetStatus,
        config:sanitizeUiConfigV1(resolved.config),
        assignmentVersion:Number(item.version||1)||1
      };
    });
  return {schema:'page-ui-resolved/v1',items};
}

async function loadDraftBundle(env,pageId){
  const [pageValues,blockValues,styleValues,pageUiValues,uiPresetValues]=await Promise.all([
    readSheetValues(env,`${SHEETS.pages}!A:M`),
    readSheetValues(env,`${SHEETS.blocks}!A:O`),
    readSheetValues(env,`${SHEETS.blockStyles}!A:L`),
    readSheetValues(env,`${SHEETS.pageUi}!A:H`),
    readSheetValues(env,`${SHEETS.uiPresets}!A:J`)
  ]);

  const pages=valuesToObjects(pageValues);
  const source=pages.find(row=>String(row.page_id||'')===pageId);
  if(!source)return {page:null,blocks:[],blockStylePresets:[],pageUiItems:[],uiPresets:[]};

  const blocks=valuesToObjects(blockValues)
    .filter(row=>String(row.page_id||'')===pageId&&String(row.block_id||''))
    .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))
    .map(row=>({
      id:String(row.block_id||''),
      type:String(row.type||''),
      variant:String(row.variant||'default'),
      enabled:String(row.enabled||'TRUE').toUpperCase()!=='FALSE',
      content:parseJson(row.content_json,{}),
      evidence:parseJson(row.evidence_json,[]),
      aiPolicy:parseJson(row.ai_policy_json,{mode:'full'}),
      stylePresetId:String(row.style_preset_id||''),
      styleOverrides:normalizeBlockStyleV1(parseJson(row.style_overrides_json,{})),
      revision:{version:Number(row.revision_version||1)||1,updatedAt:String(row.updated_at||'')}
    }));

  const blockStylePresets=valuesToObjects(styleValues).filter(row=>row.preset_id).map(row=>({
    id:String(row.preset_id||''),
    blockType:String(row.block_type||''),
    variant:String(row.variant||''),
    style:normalizeBlockStyleV1(parseJson(row.style_json,{})),
    source:String(row.source||'user'),
    status:String(row.status||'draft'),
    version:Number(row.version||1)||1
  }));

  const pageUiItems=valuesToObjects(pageUiValues)
    .filter(row=>String(row.page_id||'')===pageId&&isKnownUiCapability(row.capability_id))
    .map(row=>({
      capabilityId:String(row.capability_id||''),
      enabled:String(row.enabled||'TRUE').toUpperCase()!=='FALSE',
      presetId:String(row.preset_id||''),
      overrides:sanitizeUiConfigV1(parseJson(row.override_json,{})),
      version:Number(row.version||1)||1
    }));

  const uiPresets=valuesToObjects(uiPresetValues).filter(row=>row.preset_id&&isKnownUiCapability(row.capability_id)).map(row=>({
    id:String(row.preset_id||''),
    capabilityId:String(row.capability_id||''),
    config:sanitizeUiConfigV1(parseJson(row.config_json,{})),
    source:String(row.source||'user'),
    status:String(row.status||'draft'),
    version:Number(row.version||1)||1
  }));

  const page={
    pageId:String(source.page_id||''),
    slug:String(source.slug||''),
    industryId:String(source.industry_id||'general'),
    title:String(source.title||''),
    status:String(source.status||'draft'),
    theme:String(source.theme||'light'),
    seo:parseJson(source.seo_json,{}),
    brief:parseJson(source.brief_json,{}),
    aiStatus:String(source.ai_status||'not_requested'),
    aiReview:parseJson(source.ai_review_json,{}),
    createdAt:String(source.created_at||''),
    updatedAt:String(source.updated_at||''),
    publishedAt:String(source.published_at||'')
  };

  return {page,blocks,blockStylePresets,pageUiItems,uiPresets};
}

function parseJson(value,fallback){if(!value)return fallback;try{return JSON.parse(String(value));}catch{return fallback;}}
function plainObject(value){return Boolean(value&&typeof value==='object'&&!Array.isArray(value));}
function valuesToObjects(values){
  if(!values.length)return [];
  const headers=values[0].map(value=>String(value||'').trim());
  return values.slice(1).filter(row=>row.some(cell=>String(cell||'').trim()!=='')).map(row=>{
    const item={};headers.forEach((header,index)=>{if(header)item[header]=row[index]??'';});return item;
  });
}
function ensureHeaderMap(row,required,sheetName){
  const headers=(Array.isArray(row)?row:[]).map(value=>String(value||'').trim());
  const map={};
  required.forEach(name=>{const index=headers.indexOf(name);if(index<0)throw new Error(`${sheetName} 헤더가 없습니다: ${name}`);map[name]=index;});
  return map;
}

async function readSheetValues(env,range){
  const token=await getAccessToken(env);const id=requireSheetId(env);
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 읽기 실패 (${response.status})`);
  return Array.isArray(data.values)?data.values:[];
}
async function appendRange(env,range,values){
  const token=await getAccessToken(env);const id=requireSheetId(env);
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 추가 실패 (${response.status})`);return data;
}
async function updateRange(env,range,values){
  const token=await getAccessToken(env);const id=requireSheetId(env);
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response=await fetch(url,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||`Google Sheets 수정 실패 (${response.status})`);return data;
}

async function getAccessToken(env){
  const now=Math.floor(Date.now()/1000);if(cachedToken?.token&&cachedToken.expiresAt-60>now)return cachedToken.token;
  const account=parseServiceAccount(env);if(!account?.client_email||!account?.private_key)throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON Secret을 확인해 주세요.');
  const tokenUri=account.token_uri||'https://oauth2.googleapis.com/token';
  const header=base64UrlJson({alg:'RS256',typ:'JWT'});
  const claims=base64UrlJson({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:tokenUri,exp:now+3600,iat:now});
  const signingInput=`${header}.${claims}`;
  const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(account.private_key),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign({name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(signingInput));
  const assertion=`${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;
  const response=await fetch(tokenUri,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||`Google 인증 실패 (${response.status})`);
  cachedToken={token:data.access_token,expiresAt:now+Number(data.expires_in||3600)};return cachedToken.token;
}
function parseServiceAccount(env){const raw=env.GOOGLE_SERVICE_ACCOUNT_JSON||env.GOOGLE_SERVICE_ACCOUNT_JS||'';if(!raw)return null;try{return typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 값이 올바른 JSON 형식이 아닙니다.');}}
function requireSheetId(env){const id=String(env.GOOGLE_SHEET_ID||'').trim();if(!id)throw new Error('GOOGLE_SHEET_ID 환경변수가 없습니다.');return id;}
function base64UrlJson(value){return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)));}
function base64UrlBytes(bytes){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
function pemToArrayBuffer(pem){const body=String(pem).replace(/-----BEGIN PRIVATE KEY-----/g,'').replace(/-----END PRIVATE KEY-----/g,'').replace(/\\n/g,'\n').replace(/\s+/g,'');const binary=atob(body);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
function koreaTime(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date()).replace(' ','T')+'+09:00';}
