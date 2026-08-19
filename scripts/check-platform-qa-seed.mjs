import fs from 'node:fs';
import vm from 'node:vm';
import {BLOCK_REGISTRY_V1} from '../functions/lib/block-registry-v1.js';

const seedPath=new URL('../docs/workstreams/platform-library-v1/qa/video-editor-draft-v1.json',import.meta.url);
const publicDraftPath=new URL('../public/data/qa/video-editor-draft-v1.js',import.meta.url);
const evidencePath=new URL('../public/data/qa/video-editor-evidence-v1.js',import.meta.url);
const manifestPath=new URL('../public/data/block-registry/v1/manifest.js',import.meta.url);
const seed=JSON.parse(fs.readFileSync(seedPath,'utf8'));
const manifestSource=fs.readFileSync(manifestPath,'utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(manifestSource,sandbox,{filename:'manifest.js'});
const manifest=sandbox.window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;

const errors=[];
const warnings=[];
const fail=(message)=>errors.push(message);
const warn=(message)=>warnings.push(message);

if(seed?.schema!=='platform-editor-page/v1')fail('Unexpected QA seed schema.');
if(!seed?.page?.pageId)fail('pageId is required.');
if(!seed?.page?.slug)fail('slug is required.');
if(seed?.page?.status!=='draft')fail('QA seed must remain draft.');
if(seed?.page?.seo?.indexPolicy!=='noindex')fail('QA seed must remain noindex.');
if(seed?.page?.aiStatus!=='needs_review')fail('QA seed must require human review.');
if(!Array.isArray(seed?.blocks)||!seed.blocks.length)fail('QA seed must contain blocks.');
if(!manifest?.blocks?.length)fail('Browser Registry manifest did not load.');

const manifestByType=new Map((manifest?.blocks||[]).map(item=>[item.type,item]));
const allowedModes=new Set(['full','wording_only','fact_check_only','locked']);
const allowedFactStates=new Set(['not_required','needs_verification','verified','stale']);

function validateBlocks(blocks,labelPrefix){
  const ids=new Set();
  let candidateCount=0;
  for(const [index,block] of (blocks||[]).entries()){
    const label=`${labelPrefix} block ${index+1} (${block?.id||'missing-id'})`;
    if(!block?.id){fail(`${label}: id is required.`);continue;}
    if(ids.has(block.id))fail(`${label}: duplicate id.`);
    ids.add(block.id);

    const browser=manifestByType.get(block.type);
    if(!browser)fail(`${label}: unknown browser Registry type ${block.type}.`);
    if(!Object.prototype.hasOwnProperty.call(BLOCK_REGISTRY_V1,block.type))fail(`${label}: unknown server Registry type ${block.type}.`);
    if(browser&&!browser.variants.includes(block.variant))fail(`${label}: invalid variant ${block.variant}.`);
    if(browser&&browser.status!==BLOCK_REGISTRY_V1[block.type])fail(`${label}: browser/server status mismatch.`);
    if(BLOCK_REGISTRY_V1[block.type]==='candidate')candidateCount+=1;

    const mode=block?.aiPolicy?.mode||'full';
    const factState=block?.aiPolicy?.factState||'not_required';
    if(!allowedModes.has(mode))fail(`${label}: invalid aiPolicy.mode ${mode}.`);
    if(!allowedFactStates.has(factState))fail(`${label}: invalid factState ${factState}.`);
    if(factState==='verified'){
      if(!Array.isArray(block.evidence)||!block.evidence.length)fail(`${label}: verified fact state requires evidence.`);
      for(const [evidenceIndex,evidence] of (block.evidence||[]).entries()){
        if(!String(evidence?.publisher||'').trim())fail(`${label}: evidence ${evidenceIndex+1} requires publisher.`);
        if(!String(evidence?.url||'').trim())fail(`${label}: evidence ${evidenceIndex+1} requires url.`);
        if(!String(evidence?.checkedAt||'').match(/^\d{4}-\d{2}-\d{2}$/))fail(`${label}: evidence ${evidenceIndex+1} requires checkedAt YYYY-MM-DD.`);
      }
    }
  }
  return {ids,candidateCount};
}

const seedValidation=validateBlocks(seed.blocks,'seed');
if(seedValidation.candidateCount===0)warn('QA seed currently contains no candidate blocks; update the expected publish-gate assertion when Registry approval begins.');
else if(seedValidation.candidateCount!==seed.blocks.length)warn(`QA seed mixes approved and candidate blocks (${seedValidation.candidateCount}/${seed.blocks.length} candidate).`);

const browserSandbox={window:{}};
vm.createContext(browserSandbox);
vm.runInContext(fs.readFileSync(publicDraftPath,'utf8'),browserSandbox,{filename:'video-editor-draft-v1.js'});
vm.runInContext(fs.readFileSync(evidencePath,'utf8'),browserSandbox,{filename:'video-editor-evidence-v1.js'});
const effective=browserSandbox.window.__VIDEO_EDITOR_QA_DRAFT;
if(!effective?.page||!Array.isArray(effective?.blocks))fail('Effective browser QA draft did not load.');
else{
  if(effective.page.pageId!==seed.page.pageId)fail('Browser QA pageId differs from canonical seed.');
  if(effective.blocks.length!==seed.blocks.length)fail(`Browser QA block count differs from canonical seed (${effective.blocks.length}/${seed.blocks.length}).`);
  const effectiveValidation=validateBlocks(effective.blocks,'effective');
  const seedIds=[...seedValidation.ids].sort();
  const effectiveIds=[...effectiveValidation.ids].sort();
  if(JSON.stringify(seedIds)!==JSON.stringify(effectiveIds))fail('Browser QA block ids differ from canonical seed.');

  const expectedVerified=new Set(['ve_market_compare','ve_process','ve_tools','ve_offer','ve_faq','ve_resources']);
  for(const id of expectedVerified){
    const block=effective.blocks.find(item=>item.id===id);
    if(!block)fail(`Expected verified QA block is missing: ${id}.`);
    else if(block.aiPolicy?.factState!=='verified')fail(`Expected verified QA block is not verified: ${id}.`);
  }
  const hero=effective.blocks.find(item=>item.id==='ve_hero');
  if(hero?.aiPolicy?.factState!=='not_required')fail('ve_hero should not require external fact verification.');
}

const publishGateExpected=seedValidation.candidateCount>0||seed.page.aiStatus==='needs_review';
if(!publishGateExpected)fail('QA seed should currently fail production publish validation.');

if(errors.length){
  console.error('Platform QA seed check failed:');
  for(const error of errors)console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Platform QA seed OK: ${seed.blocks.length} blocks, ${seedValidation.candidateCount} candidate, evidence overlay validated, publish gate expected.`);
for(const item of warnings)console.warn(`Warning: ${item}`);
