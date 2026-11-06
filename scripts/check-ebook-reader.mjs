#!/usr/bin/env node
/* Reader data/storage checks; --runtime exercises its canonical browser pipeline. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {createHash,webcrypto} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const ROOT=path.resolve(import.meta.dirname,'..'),OUT=path.join(ROOT,'artifacts/ebook-reader');
const report={startedAt:new Date().toISOString(),checks:[],diagnostics:[],screenshots:[],limitations:['Browser fixtures exercise reader behavior and module portability. They do not claim a physical Android device was tested.','The portable fixture embeds the publication bytes; creating a complete offline textbook archive is a separate publication-build operation.']};
const assert=(value,message)=>{if(!value)throw new Error(message);};
const rejects=(call,message)=>{let rejected=false;try{call();}catch{rejected=true;}assert(rejected,message);};
const pass=(name,detail)=>{report.checks.push({name,status:'pass',detail});console.log(`PASS ${name}`);};
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const digest=value=>createHash('sha256').update(value).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const moduleFiles=['module-registry-v1.js','ebook-reader-model-v1.js','ebook-reader-v1.js'].map(name=>`public/assets/js/platform-modules/${name}`);
const sandbox=vm.createContext({window:{crypto:webcrypto},URL,TextEncoder,TextDecoder,Uint8Array,localStorage:{getItem:()=>null}});
for(const file of moduleFiles)new vm.Script(read(file),{filename:file}).runInContext(sandbox);
const registry=sandbox.window.PlatformModuleRegistry,model=sandbox.window.PersonalEduReaderModelV1;
const preview=registry.previewProps('ebook-reader'),definition=registry.get('ebook-reader');
const assets=registry.assetFiles('ebook-reader','export');
for(const consumer of ['library','editor','public','export'])assert(registry.canConsume('ebook-reader',consumer),`Reader unavailable to ${consumer}`);
assert(assets.includes('public/assets/js/platform-modules/ebook-reader-model-v1.js')&&assets.includes('public/assets/styles/components/ebook-reader-v1.css'),'Portable dependencies missing');
assert(assets.indexOf('public/assets/js/platform-modules/ebook-reader-model-v1.js')<assets.indexOf('public/assets/js/platform-modules/ebook-reader-v1.js'),'Model must load before renderer');
assert(definition.controls.length===0,'Reader must not advertise unsupported Library style controls');
assert(digest(JSON.stringify(Object.values(preview.publication.pages)[0]))===preview.publication.manifest.pages[0].contentHash,'Preview example bytes/hash disagree');
model.manifest(preview.publication.manifest);
pass('canonical-consumers-assets-and-real-inline-publication');

function publication(editionId='sample-v1'){
  const manifest={schemaVersion:1,bookId:'sns-entry',editionId,status:'sample',subjectId:'sns',levelId:'entry',title:'읽기 검증용 샘플',subtitle:'문장 선택과 읽던 위치를 확인합니다.',editionLabel:editionId==='sample-v1'?'첫 번째 검토 판본':'두 번째 검토 판본',chapters:[{chapterId:'sns-entry-start',title:'게시물의 목적 정하기'}],pages:[]},pages={};
  for(let index=1;index<=6;index++){
    const pageId=`sns-entry-sample-${index}`,page={schemaVersion:1,bookId:manifest.bookId,editionId,pageId,pageNumber:index,chapterId:'sns-entry-start',title:`검증용 본문 ${index}쪽`,blocks:[
      {blockId:`intro-${index}`,type:'paragraph',text:`한글과 📚 이모지를 함께 선택해 보세요. ${editionId}의 ${index}쪽에서 저장한 질문은 책과 편집판을 기억합니다.`},
      ...Array.from({length:18},(_,number)=>({blockId:`paragraph-${index}-${number}`,type:'paragraph',text:`${number+1}번째 문단입니다. 독자에게 전달할 내용을 한 가지 고르고, 게시물에 넣을 문장을 적어 보세요. 문장을 고친 이유를 기록하면 다음 게시물에서 무엇을 바꿀지 결정할 수 있습니다.`})),
      {blockId:`table-${index}`,type:'table',caption:'다시 읽을 때 확인할 내용',columns:['항목','기록'],rows:[['목적','알릴 내용\n기대하는 행동'],['문장','짧게 쓴 문장\n고친 이유']]},
      {blockId:`steps-${index}`,type:'steps',items:[{title:'목적 쓰기',text:'누구에게 무엇을 알릴지 적으세요.',output:'한 줄 목적'}]},
      {blockId:`template-${index}`,type:'template',title:'요청 초안',text:'대상: 처음 방문한 독자\n목적: 운영 시간 안내\n형식: 세 문장'},
      {blockId:`image-${index}`,type:'image',src:'/__reader-diagram.svg',alt:'단계 세 개를 나란히 보여 주는 검증용 도해',width:1200,height:700,caption:'선택한 도해를 크게 보기'},
      {blockId:`exercise-${index}`,type:'exercise',title:'직접 적어 보기',steps:['알릴 내용을 고르세요.','문장을 적으세요.'],checks:['대상이 드러나나요?'],solution:'대상과 필요한 정보를 함께 적으면 안내 내용을 고르기 쉽습니다.'},
      {blockId:`sources-${index}`,type:'sources',items:[{title:'공식 도움말',url:'https://support.google.com/youtube/'},{title:'안전하지 않은 주소',url:'javascript:alert(1)'}]}
    ]};
    const bytes=JSON.stringify(page,null,2)+'\n';pages[pageId]=bytes;manifest.pages.push({pageId,pageNumber:index,chapterId:page.chapterId,title:page.title,src:`${pageId}.json`,contentHash:digest(bytes)});
  }
  return {manifest,pages};
}
const fixture=publication(),otherEdition=publication('sample-v2');
model.manifest(fixture.manifest);model.page(JSON.parse(fixture.pages[fixture.manifest.pages[0].pageId]),fixture.manifest,fixture.manifest.pages[0]);
const duplicate=clone(fixture.manifest);duplicate.pages[1].pageId=duplicate.pages[0].pageId;rejects(()=>model.manifest(duplicate),'Duplicate permanent IDs accepted');
const wrongEdition=JSON.parse(Object.values(fixture.pages)[0]);wrongEdition.editionId='wrong';rejects(()=>model.page(wrongEdition,fixture.manifest,fixture.manifest.pages[0]),'Wrong edition payload accepted');
assert(await model.sha256(new TextEncoder().encode(Object.values(fixture.pages)[0]),webcrypto)===fixture.manifest.pages[0].contentHash,'UTF-8 integrity verification mismatch');
assert(!model.safeUrl('javascript:alert(1)')&&!model.safeUrl('data:text/html,x'),'Executable URL accepted');
pass('permanent-id-edition-schema-and-utf8-integrity');

const original='앞 문장 📚 질문할 부분 뒤 문장',chars=Array.from(original),start=chars.indexOf('📚'),end=start+9;
const anchor={blockId:'intro',partId:'text',quote:model.quoteAt(original,start,end),position:{start,end}};
assert(anchor.quote.exact.startsWith('📚')&&model.resolveAnchor(original,anchor).start===start,'Unicode selection range split emoji');
const shifted={...anchor,position:{start:0,end:9}};assert(model.resolveAnchor(original,shifted).start===start,'Quote/context did not recover shifted offset');
assert(model.resolveAnchor('문장 문장',{quote:{exact:'문장',prefix:'',suffix:''},position:{start:100,end:102}})===null,'Ambiguous quote anchored to arbitrary occurrence');
assert(model.resolveAnchor('편집 후 다른 문장',anchor)===null,'Changed quote silently reanchored');
pass('unicode-quote-context-and-ambiguous-anchor-refusal');

function memoryStorage(){const map=new Map();return {map,get length(){return map.size;},key:index=>[...map.keys()][index]??null,getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};}
const storage=memoryStorage(),store=model.createStore(storage),otherTab=model.createStore(storage);
const note={schemaVersion:1,id:'note-one',bookId:'sns-entry',editionId:'sample-v1',pageId:'sns-entry-sample-1',pageNumberAtSave:1,contentHash:fixture.manifest.pages[0].contentHash,quote:anchor.quote.exact,anchors:[anchor],note:'궁금한 점',createdAt:'2026-11-06T00:00:00.000Z',updatedAt:'2026-11-06T00:00:00.000Z'};
assert(store.saveQuestion(note).ok,'Could not save valid question');assert(otherTab.saveQuestion({...note,id:'note-two'}).ok,'Second tab question failed');
for(let index=0;index<110;index++)assert(store.saveQuestion({...note,id:`note-extra-${index}`}).ok,'Question lost above legacy limit');
assert(store.listQuestions().values.length===112,'Question store silently capped or overwrote independent writes');
storage.setItem('photoRoadmapQuestionsV2','["legacy"]');
const location={schemaVersion:1,bookId:'sns-entry',editionId:'sample-v1',pageId:'sns-entry-sample-2',blockId:'paragraph-2-8',blockProgress:0.4,contentHash:fixture.manifest.pages[1].contentHash};
assert(store.savePosition(location).ok&&store.loadPosition('sns-entry','sample-v2').value===null,'Edition position leaked');
assert(store.savePosition({...location,bookId:'video-entry'}).ok&&store.loadPosition('sns-entry','sample-v1').value.blockProgress===0.4,'Book position overwritten');
assert(storage.getItem('photoRoadmapQuestionsV2')==='["legacy"]','Legacy storage modified');
const exported=store.exportQuestions(),importStore=model.createStore(memoryStorage());
assert(importStore.importQuestions(exported.data).added===112&&importStore.importQuestions(exported.data).skipped===112,'Import duplicates overwrite existing questions');
const invalid=clone(exported.data);invalid.questions[0].anchors[0].position.end=-1;assert(!importStore.importQuestions(invalid).ok&&importStore.listQuestions().values.length===112,'Invalid import changed records');
const inconsistent=clone(exported.data);inconsistent.questions[0].quote='화면에 보이는 다른 원문';assert(!importStore.importQuestions(inconsistent).ok,'Imported display quote and anchor quote disagree');
const corruptKey=model.PREFIX+'position:sns-entry:sample-v1';storage.setItem(corruptKey,'{unreadable');assert(!store.savePosition(location).ok&&storage.getItem(corruptKey)==='{unreadable','Corrupt prior record destroyed');
const quota=model.createStore({...memoryStorage(),setItem(){throw new Error('QuotaExceededError');}});assert(!quota.saveQuestion(note).ok,'Quota failure reported successful');
assert(!model.createStore(null).saveQuestion(note).ok,'Unavailable storage reported successful');
pass('durable-book-edition-storage-import-and-failure-preservation',{questions:112});

const css=assets.filter(file=>file.endsWith('.css')).map(file=>`<link rel="stylesheet" href="${file.replace(/^public/,'')}">`).join('');
const js=['public/assets/js/platform-modules/module-registry-v1.js',...assets.filter(file=>file.endsWith('.js'))].map(file=>`<script src="${file.replace(/^public/,'')}"></script>`).join('');
function fixtureHtml(url){
  const newer=url.searchParams.get('edition')==='sample-v2',data=newer?otherEdition:fixture,inline=url.pathname==='/__reader-inline/',broken=url.searchParams.has('broken');
  const props=inline?{publication:data}:{manifestUrl:`/${broken?'__reader-broken':newer?'__reader-v2':'__reader-publication'}/manifest.json`};
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reader verification</title>${css}<style>body{margin:0;padding:10px;background:#efeee8}</style><body><main id="host"></main>${js}<script>window.readerQa={};readerQa.mount=PlatformModuleRegistry.mount(document.getElementById('host'),'ebook-reader',${json(props)},{consumer:'${inline?'export':'public'}',readerEditionUrl(value){return '/__reader-fixture/?edition='+value.editionId;}});readerQa.ready=readerQa.mount.api.ready;</script></body></html>`;
}
function snapshotHtml(){
  const blocks=[{id:'reader-public',type:'ui-module',variant:'ebook-reader',content:{publication:fixture}}];
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Published reader</title><body><main id="snapshot-host"><div data-public-ui-module-host="reader-public"></div></main><script src="/assets/js/blocks/block-registry.js"></script><script src="/assets/js/public-snapshot/runtime-v2.js"></script><script>PublicSnapshotRuntimeV2.mountUiModules(document.getElementById('snapshot-host'),${json(blocks)}).then(()=>document.documentElement.dataset.snapshotReady='true');</script></body></html>`;
}
function startServer(){
  const publicRoot=path.join(ROOT,'public'),requests=[];
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://localhost');requests.push(url.pathname);
    const send=(value,type='text/html; charset=utf-8')=>{response.writeHead(200,{'content-type':type});response.end(value);};
    if(['/__reader-fixture/','/__reader-inline/'].includes(url.pathname)){send(fixtureHtml(url));return;}
    if(url.pathname==='/__reader-snapshot/'){send(snapshotHtml());return;}
    if(url.pathname==='/__reader-diagram.svg'){send('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"><rect width="1200" height="700" fill="#eef5ed"/><rect x="80" y="200" width="260" height="300" fill="#285947"/><rect x="470" y="200" width="260" height="300" fill="#548869"/><rect x="860" y="200" width="260" height="300" fill="#9cbda4"/></svg>','image/svg+xml');return;}
    if(/^\/__reader-(publication|v2|broken)\//.test(url.pathname)){
      const data=url.pathname.startsWith('/__reader-v2/')?otherEdition:fixture,filename=url.pathname.split('/').at(-1);
      if(filename==='manifest.json'){send(JSON.stringify(data.manifest),'application/json');return;}
      const bytes=data.pages[filename.replace(/\.json$/,'')];if(bytes){send(bytes+(url.pathname.startsWith('/__reader-broken/')?' ':''),'application/json');return;}
    }
    let requested;try{requested=decodeURIComponent(url.pathname);}catch{response.writeHead(400).end();return;}
    let file=path.resolve(publicRoot,`.${requested}`);if(!file.startsWith(publicRoot+path.sep)&&file!==publicRoot){response.writeHead(403).end();return;}
    try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const body=fs.readFileSync(file),type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';send(body,type);}catch{response.writeHead(404).end('Not found');}
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,requests,base:`http://127.0.0.1:${server.address().port}`})));
}
async function runtime(){
  let playwright;try{playwright=await import('playwright');}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;playwright=await import(pathToFileURL(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright/index.mjs')).href);}
  const {server,base,requests}=await startServer(),executable=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(file=>file&&fs.existsSync(file));
  let browser;
  try{
    browser=await playwright.chromium.launch({headless:true,...(executable?{executablePath:executable}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});page.setDefaultTimeout(15000);page.on('pageerror',error=>report.diagnostics.push(error.message));
    const ready=()=>page.locator('[data-reader-ready="true"]').waitFor();
    await page.goto(`${base}/__reader-fixture/`);await ready();
    assert(requests.filter(url=>/\/sns-entry-sample-\d\.json$/.test(url)).length===1,'Opening one page downloaded the whole publication');
    assert(await page.locator('[data-reader-page]').count()===1,'Reader mounts more than the current authored page');
    assert(await page.locator('[data-reader-page]').evaluate(node=>node.tagName==='ARTICLE'&&node.closest('[data-reader-reading]')!==null),'Authored-page marker is shared with a state-only host');
    assert((await page.locator('[data-reader-badge]').textContent()).includes('샘플 · 본문 6쪽'),'Sample/page count missing');
    assert(await page.locator('a[href^="javascript:"]').count()===0,'Unsafe source link rendered');
    assert(await page.locator('.ebook-reader__sources a').evaluateAll(nodes=>nodes.every(node=>node.target==='_blank'&&node.rel.includes('noopener'))),'Sources do not open safely in a new tab');
    pass('browser-one-page-load-selectable-html-and-sample-label');

    await page.evaluate(()=>{const start=document.querySelector('[data-reader-text-block="intro-1"]'),end=document.querySelector('[data-reader-text-block="paragraph-1-0"]'),range=document.createRange();range.setStart(start.firstChild,4);range.setEnd(end.firstChild,12);getSelection().removeAllRanges();getSelection().addRange(range);});
    await page.locator('[data-reader-action="selection"]:not([disabled])').waitFor();
    assert(await page.locator('dialog[open]').count()===0,'Selection automatically opens a dialog');
    const selected=await page.evaluate(()=>getSelection().toString());assert(selected.includes('📚'),'Native Unicode selection damaged');
    await page.locator('[data-reader-action="selection"]').click();await page.locator('dialog').waitFor({state:'visible'});
    assert((await page.locator('.ebook-reader__note-location').textContent()).includes(fixture.manifest.editionLabel)&&!(await page.locator('.ebook-reader__note-location').textContent()).includes(fixture.manifest.editionId),'Question dialog exposes an edition ID instead of its reader-facing label');
    await page.locator('[data-reader-memo]').fill('어떤 문장을 고칠까요?');await page.locator('[data-reader-note-form] button[type="submit"]').click();
    const saved=await page.evaluate(()=>readerQa.mount.api.exportQuestions().data.questions);assert(saved.length===1&&saved[0].anchors.length===2&&saved[0].quote.includes('📚'),'Cross-block quote not persisted exactly');assert(saved[0].editionId===fixture.manifest.editionId&&saved[0].editionLabel===fixture.manifest.editionLabel,'Readable edition label replaced or lost the stable edition metadata');
    const noteId=saved[0].id;await page.reload();await ready();
    await page.locator('[data-reader-action="questions"]').click();assert((await page.locator('.ebook-reader__questions').textContent()).includes('어떤 문장을 고칠까요?'),'Question did not survive reload');
    await page.locator(`[data-reader-note-edit="${noteId}"]`).click();await page.locator('[data-reader-memo]').fill('수정한 질문 메모');await page.locator('[data-reader-note-form] button[type="submit"]').click();
    await page.locator('[data-reader-action="questions"]').click();await page.locator(`[data-reader-note-open="${noteId}"]`).click();await page.locator('dialog').waitFor({state:'hidden'});
    assert((await page.evaluate(()=>getSelection().toString())).includes('📚'),'Saved question did not restore native selection');
    pass('browser-selection-quote-save-reload-edit-and-exact-return');

    await page.evaluate(()=>getSelection().removeAllRanges());await page.locator('[data-reader-action="next"]').click();await page.locator('[data-reader-page="sns-entry-sample-2"]').waitFor();
    await page.waitForFunction(()=>!readerQa.mount.api.getState().loading);
    await page.locator('[data-reader-reading]').evaluate(node=>{const block=node.querySelector('[data-reader-block="paragraph-2-8"]');node.scrollTop+=block.getBoundingClientRect().top-node.getBoundingClientRect().top+20;});
    await page.evaluate(()=>readerQa.mount.api.savePosition());const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('personalEduReaderV1.position:sns-entry:sample-v1')));
    await page.reload();await ready();assert(await page.locator('[data-reader-page="sns-entry-sample-2"]').count()===1,'Startup overwrote last page with first page');
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('personalEduReaderV1.position:sns-entry:sample-v1')));assert(after.blockId===before.blockId&&Math.abs(after.blockProgress-before.blockProgress)<0.06,'Paragraph position not restored');
    const textSize=await page.locator('[data-reader-text-block="paragraph-2-8"]').evaluate(node=>parseFloat(getComputedStyle(node).fontSize));
    await page.locator('[data-reader-action="tools"]').click();await page.locator('[data-reader-action="font-larger"]').click();await page.waitForFunction(()=>!readerQa.mount.api.getState().restoring);await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'hidden'});
    assert(await page.locator('[data-reader-text-block="paragraph-2-8"]').evaluate(node=>parseFloat(getComputedStyle(node).fontSize))>textSize,'Font control did not affect actual body');
    assert(await page.locator('[data-reader-action="tools"]').evaluate(node=>node===document.activeElement),'Dialog did not restore opener focus');
    await page.waitForFunction(()=>!document.querySelector('[data-reader-reading]').getAttribute('aria-busy')||document.querySelector('[data-reader-reading]').getAttribute('aria-busy')==='false');
    await page.evaluate(()=>readerQa.mount.api.savePosition());const resized=await page.evaluate(()=>JSON.parse(localStorage.getItem('personalEduReaderV1.position:sns-entry:sample-v1')));assert(resized.blockId===before.blockId,'Font change moved the stored paragraph');
    pass('browser-last-location-font-control-and-modal-focus');

    await page.locator('[data-reader-action="tools"]').click();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-reader-action="export"]').click()]);fs.mkdirSync(OUT,{recursive:true});const exportPath=path.join(OUT,'reader-questions.json');await download.saveAs(exportPath);const data=JSON.parse(fs.readFileSync(exportPath,'utf8'));assert(data.questions[0].note==='수정한 질문 메모','Export lost edited metadata');
    await page.keyboard.press('Escape');await page.locator('[data-reader-action="questions"]').click();await page.locator(`[data-reader-note-delete="${noteId}"]`).click();await page.locator(`[data-reader-note-confirm="${noteId}"]`).click();assert(await page.locator('.ebook-reader__questions>li').count()===0,'Delete did not remove selected question');await page.keyboard.press('Escape');
    await page.locator('[data-reader-action="tools"]').click();await page.locator('[data-reader-import]').setInputFiles(exportPath);await page.waitForFunction(()=>document.querySelector('[data-reader-question-count]').textContent==='1');await page.keyboard.press('Escape');
    pass('browser-download-delete-import-round-trip');

    await page.goto(`${base}/__reader-fixture/?edition=sample-v2`);await ready();assert(await page.locator('[data-reader-page="sns-entry-sample-1"]').count()===1,'New edition inherited a position from another edition');
    await page.locator('[data-reader-action="questions"]').click();await page.locator(`[data-reader-note-open="${noteId}"]`).click();assert((await page.locator('dialog').textContent()).includes('현재 판본에서는 원문 위치로 이동할 수 없습니다.'),'Old-edition quote silently migrated');assert((await page.locator('.ebook-reader__note-location').textContent()).includes(fixture.manifest.editionLabel)&&!(await page.locator('.ebook-reader__note-location').textContent()).includes(fixture.manifest.editionId),'Old-edition dialog lost the saved reader-facing label');
    assert(await page.locator('[data-reader-page="sns-entry-sample-1"]').count()===1,'Old question navigated the new edition');
    assert(await page.evaluate(()=>Boolean(localStorage.getItem('personalEduReaderV1.position:sns-entry:sample-v1'))),'New edition deleted previous position');
    await page.keyboard.press('Escape');pass('browser-edition-change-preserves-questions-and-old-position');

    const oldPosition=await page.evaluate(()=>localStorage.getItem('personalEduReaderV1.position:sns-entry:sample-v1'));
    await page.goto(`${base}/__reader-fixture/?broken=1`);await page.locator('[data-reader-notice][data-kind="error"]').waitFor();
    assert(await page.locator('[data-reader-page]').count()===0,'Hash-mismatched body rendered');assert(await page.evaluate(()=>localStorage.getItem('personalEduReaderV1.position:sns-entry:sample-v1'))===oldPosition,'Failed integrity check overwrote reading position');
    pass('browser-byte-integrity-failure-preserves-location');

    await page.goto(`${base}/__reader-inline/`);await ready();await page.setViewportSize({width:320,height:640});
    const bounds=await page.evaluate(()=>({document:document.documentElement.scrollWidth-document.documentElement.clientWidth,reading:document.querySelector('[data-reader-reading]').clientHeight,pages:document.querySelectorAll('[data-reader-page]').length}));assert(bounds.document<=1&&bounds.reading>130&&bounds.pages===1,'Small-screen reader overflows or hides its body');
    await page.locator('[data-reader-action="toc"]').click();await page.locator('dialog').waitFor({state:'visible'});assert(await page.locator('dialog').evaluate(node=>node.matches(':modal')),'TOC is not an accessible native modal');
    const close=page.locator('[data-reader-action="close-dialog"]');await close.focus();await page.keyboard.press('Shift+Tab');assert(await page.locator('[data-reader-go]').last().evaluate(node=>node===document.activeElement),'Modal keyboard focus escaped');await page.keyboard.press('Tab');assert(await close.evaluate(node=>node===document.activeElement),'Modal forward focus did not wrap');
    await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'hidden'});await page.locator('[data-reader-reading]').focus();await page.keyboard.press('ArrowRight');await page.locator('[data-reader-page="sns-entry-sample-3"]').waitFor();
    await page.screenshot({path:path.join(OUT,'reader-mobile.png')});report.screenshots.push('reader-mobile.png');pass('browser-portable-inline-mobile-keyboard-and-focus');
    await page.waitForFunction(()=>!readerQa.mount.api.getState().loading);
    await page.evaluate(()=>{const node=document.querySelector('[data-reader-text-block="intro-3"]'),range=document.createRange();range.selectNodeContents(node);getSelection().removeAllRanges();getSelection().addRange(range);readerQa.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('personalEduReaderV1.question:'))throw new DOMException('Storage full','QuotaExceededError');return readerQa.originalSet.call(this,key,value);};});
    await page.locator('[data-reader-action="selection"]:not([disabled])').waitFor();await page.locator('[data-reader-action="selection"]').click();await page.locator('[data-reader-memo]').fill('저장 실패 때도 이 메모가 남아 있어야 합니다.');await page.locator('[data-reader-note-form] button[type="submit"]').click();assert(await page.locator('dialog').isVisible()&&(await page.locator('[data-reader-form-status]').textContent()).includes('저장하지 못했습니다'),'Quota failure falsely closed the note form');assert(await page.locator('[data-reader-memo]').inputValue()==='저장 실패 때도 이 메모가 남아 있어야 합니다.','Quota failure lost the draft');assert((await page.evaluate(()=>readerQa.mount.api.exportQuestions().data.questions)).length===1,'Quota failure corrupted existing questions');await page.evaluate(()=>{Storage.prototype.setItem=readerQa.originalSet;});await page.keyboard.press('Escape');
    pass('browser-storage-failure-keeps-draft-and-prior-records');
    await page.evaluate(()=>{const node=document.querySelector('[data-reader-text-block="intro-3"]'),range=document.createRange();range.selectNodeContents(node);getSelection().removeAllRanges();getSelection().addRange(range);document.querySelector('[data-platform-module="ebook-reader"]').addEventListener('ebook-reader:question-saved',()=>readerQa.mount.api.openQuestions(),{once:true});});
    await page.locator('[data-reader-action="selection"]:not([disabled])').waitFor();await page.locator('[data-reader-action="selection"]').click();await page.locator('[data-reader-memo]').fill('저장 이벤트 직후 목록 열기');await page.locator('[data-reader-note-form] button[type="submit"]').click();await page.locator('.ebook-reader__questions').waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert(await page.locator('dialog').isVisible()&&await page.evaluate(()=>document.documentElement.style.overflow==='hidden'),'An old dialog close event unlocked the new modal');await page.locator('[data-reader-note-edit]').first().click();await page.locator('[data-reader-memo]').fill('재진입 뒤에도 편집 가능');await page.locator('[data-reader-note-form] button[type="submit"]').click();await page.locator('dialog').waitFor({state:'hidden'});pass('browser-dialog-close-reopen-event-lifecycle');



    await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:base});await page.locator('[data-reader-copy="template-3"]').click();assert(await page.evaluate(()=>navigator.clipboard.readText())==='대상: 처음 방문한 독자\n목적: 운영 시간 안내\n형식: 세 문장','Template copy changed the source text');
    await page.locator('[data-reader-image="image-3"]').click();await page.locator('dialog').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('.ebook-reader__image-view img')?.naturalWidth===1200);assert(await page.locator('.ebook-reader__image-view').evaluate(node=>node.scrollWidth>node.clientWidth),'Diagram enlargement compressed small text');assert(await page.locator('.ebook-reader__image-original').getAttribute('target')==='_blank','Original image cannot be opened in a new tab');await page.screenshot({path:path.join(OUT,'reader-diagram-mobile.png')});report.screenshots.push('reader-diagram-mobile.png');await page.keyboard.press('Escape');assert(await page.locator('[data-reader-image="image-3"]').evaluate(node=>node===document.activeElement),'Image dialog lost opener focus');pass('browser-template-copy-and-original-diagram-enlargement');

    await page.setViewportSize({width:1280,height:960});await page.goto(`${base}/__reader-snapshot/`);await ready();assert(await page.locator('[data-platform-public-module-ready="true"]').count()===1&&await page.locator('iframe').count()===0,'Published Snapshot uses a preview or missed canonical reader');await page.locator('[data-reader-action="toc"]').click();await page.locator('dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');pass('browser-published-snapshot-canonical-reader');
    await page.goto(`${base}/ui-dashboard/`);await page.locator('[data-kit-ui="ebook-reader"]').click();const frame=page.frameLocator('#builderFrame');await frame.locator('[data-reader-ready="true"]').waitFor();await frame.locator('[data-reader-action="toc"]').click();await frame.locator('dialog').waitFor({state:'visible'});await frame.locator('[data-reader-action="close-dialog"]').click();pass('browser-library-canonical-reader');
    await page.waitForFunction(()=>document.querySelector('.platform-admin-shell')?.dataset.persistentWorkspaceBound==='true');await page.locator('.platform-admin-shell__nav a[href="/editor-lab/"]').click();const workspace=page.locator('.platform-admin-workspace-host:not([hidden]) iframe');await workspace.waitFor({state:'visible'});const editor=await(await workspace.elementHandle()).contentFrame();assert(editor,'Editor workspace unavailable');
    await editor.locator('[data-add-module="ebook-reader"]').click();await editor.locator('[data-platform-editor-module-frame="ebook-reader"]').waitFor();await editor.locator('[data-editor-mode="preview"]').click();const editorFrame=editor.frameLocator('[data-platform-editor-module-frame="ebook-reader"]').first();await editorFrame.locator('[data-reader-ready="true"]').waitFor();await editorFrame.locator('[data-reader-action="questions"]').click();await editorFrame.locator('dialog').waitFor({state:'visible'});await editorFrame.locator('[data-reader-action="close-dialog"]').click();
    const utility=editor.locator('details.admin-utility-menu').filter({has:editor.locator('#editorExport')});if(await utility.count()&&!await utility.evaluate(node=>node.open))await utility.locator(':scope > summary').click();const [editorDownload]=await Promise.all([page.waitForEvent('download'),editor.locator('#editorExport').click()]);const editorPath=path.join(OUT,'editor-reader-export.json');await editorDownload.saveAs(editorPath);const exported=JSON.parse(fs.readFileSync(editorPath,'utf8'));assert(exported.validation.every(item=>item.ok)&&exported.blocks.some(block=>block.variant==='ebook-reader'&&block.content.publication?.manifest),'Editor lost the publication snapshot');pass('browser-editor-inserts-previews-and-exports-reader');
    assert(!report.diagnostics.length,`Browser errors: ${report.diagnostics.join('; ')}`);
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
try{if(process.argv.includes('--runtime'))await runtime();report.status='pass';}catch(error){report.status='fail';report.error=error.stack||String(error);console.error(report.error);process.exitCode=1;}
report.finishedAt=new Date().toISOString();
if(process.argv.includes('--runtime')){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(`Ebook reader checks: ${report.status}; ${report.checks.length} passed${process.argv.includes('--runtime')?' (browser requested)':' (model/static)'}.`);
