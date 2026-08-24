import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/platform-module-pipeline');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=20000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function style(scope,selector,names){return scope.locator(selector).first().evaluate((node,props)=>{const s=getComputedStyle(node);return Object.fromEntries(props.map(name=>[name,s[name]]));},names);}

const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function seedCollection(page){
  await page.addInitScript(()=>{
    const now=new Date().toISOString();
    const videos=[
      {id:'qa-video-product',title:'제품 촬영 조명 세팅',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',category:'제품 촬영',channel:'영상',savedAt:now},
      {id:'qa-video-portrait',title:'인물 촬영 현장 체크리스트',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',category:'인물 촬영',channel:'영상',savedAt:now},
      {id:'qa-video-food',title:'음식 촬영 납품 준비',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',category:'음식 촬영',channel:'영상',savedAt:now}
    ];
    const articles=[{id:'qa-article',title:'상업사진 견적 체크리스트',og_title:'상업사진 견적 체크리스트',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/studio-process.webp?v=b007',platform:'읽을거리',summary:'견적과 납품 범위를 확인합니다.',savedAt:now}];
    localStorage.setItem('photoRoadmapVideoFavoritesV1',JSON.stringify(videos.map(x=>x.id)));
    localStorage.setItem('photoRoadmapVideoFavoriteItemsV2',JSON.stringify(Object.fromEntries(videos.map(x=>[x.id,x]))));
    localStorage.setItem('photoRoadmapCuratedFavoritesV1',JSON.stringify(articles.map(x=>x.id)));
    localStorage.setItem('photoRoadmapCuratedFavoriteItemsV2',JSON.stringify(Object.fromEntries(articles.map(x=>[x.id,x]))));
    localStorage.setItem('photoRoadmapQuestionsV2',JSON.stringify([{id:'qa-question',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'촬영 범위와 납품 범위를 먼저 정합니다.',created_at:now}]));
  });
}

async function libraryFrame(page,id){
  await waitUntil(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModulePreview==='true'&&doc.documentElement.dataset.platformModule===moduleId&&frame.contentWindow?.PlatformModuleStyleRuntime);},id),`library frame not ready: ${id}`,25000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,`missing frame: ${id}`);return frame;
}
async function choose(page,id){await page.locator(`[data-kit-ui="${id}"]`).click();return libraryFrame(page,id);}

async function verifyPublicReference(context){
  const page=await context.newPage();await seedCollection(page);await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('#collectionFab').count().then(n=>n===1),'public collection FAB missing',25000);
  await page.locator('#collectionFab').click();
  await waitUntil(()=>page.locator('#collectionSheet.is-open').count().then(n=>n===1),'public collection sheet did not open');
  await waitUntil(()=>page.locator('.collection-select-toggle').count().then(n=>n===1),'public bulk selection owner missing');
  const liquidStyle=await style(page,'.collection-tabs',['borderRadius','backgroundImage','backdropFilter']);
  await page.locator('.collection-tab[data-library-tab="video"]').click();
  await waitUntil(()=>page.locator('#collectionFilters:not([hidden]) .collection-filter').count().then(n=>n>=4),'public iOS flat filter source missing');
  const flatStyle=await style(page,'#collectionFilters .collection-filter',['borderRadius','backgroundColor','color']);
  await page.locator('.collection-tab[data-library-tab="question"]').click();
  await waitUntil(()=>page.locator('#v40QuestionControls:not([hidden])').count().then(n=>n===1),'public question workspace controls missing');
  assert(await page.locator('[data-v40-qmode="write"]').count()===1,'public question write mode missing');
  assert(await page.locator('[data-v40-qmode="saved"]').count()===1,'public saved-question mode missing');
  await shot(page,'public-reference-interactions');
  await page.close();
  pass('Public reference','liquid tabs, flat filters, bulk selection and question workspace present');
  return {liquidStyle,flatStyle};
}

async function verifyLibrary(context,publicRef){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  const browserErrors=[];page.on('pageerror',error=>browserErrors.push(`pageerror:${error.message}`));page.on('console',message=>{if(message.type()==='error')browserErrors.push(`console:${message.text()}`);});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length)),'Library did not initialize',25000);
  const ids=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('library').map(x=>x.id));
  assert(ids.length===expected.length&&expected.every(id=>ids.includes(id)),'Library module set mismatch');

  let frame=await choose(page,'filter-chip-rail');
  try{
    await waitUntil(()=>frame.evaluate(()=>document.querySelectorAll('[data-platform-module="filter-chip-rail"]').length===1),'canonical filter module missing',8000);
  }catch(error){
    const diag=await frame.evaluate(()=>({
      module:document.documentElement.dataset.platformModule||'',consumer:document.documentElement.dataset.platformModuleConsumer||'',mountError:document.documentElement.dataset.platformMountError||'',styleError:document.documentElement.dataset.platformStyleError||'',registry:window.PlatformModuleRegistry?.listFor?.('library')?.map(item=>item.id)||[],host:document.querySelector('#platformModuleHost')?.innerHTML||'',root:document.querySelector('#platformModulePreviewRoot')?.innerHTML||'',body:(document.body?.innerText||'').slice(0,1200)
    }));
    console.error('FILTER_PREVIEW_DIAGNOSTIC',JSON.stringify({diag,browserErrors},null,2));
    throw error;
  }
  const liquid=frame.locator('.platform-filter-chip-source--liquid');
  const flat=frame.locator('.platform-filter-chip-source--flat');
  assert(!(await liquid.isHidden()),'iOS liquid source should be the default');
  assert(await flat.isHidden(),'iOS flat source should be hidden until selected');
  await waitUntil(()=>frame.locator('.platform-filter-chip-source--liquid .collection-v33-indicator').count().then(n=>n===1),'Library liquid indicator missing');
  const liquidStyle=await style(frame,'.platform-filter-chip-source--liquid',['borderRadius','backgroundImage','backdropFilter']);
  assert(liquidStyle.borderRadius===publicRef.liquidStyle.borderRadius,'Library iOS liquid border radius differs from public source');

  await page.locator('#kitSettings').click();
  const family=page.locator('[data-style-control="family"]');
  const options=await family.locator('option').evaluateAll(nodes=>nodes.map(node=>node.value));
  assert(JSON.stringify(options)===JSON.stringify(['ios-liquid','ios-flat']),`Library exposes unapproved filter families: ${JSON.stringify(options)}`);
  assert(!options.includes('material-flat'),'Material filter must not be visible before Block Lab approval');
  await family.selectOption('ios-flat');await sleep(180);
  assert(await liquid.isHidden(),'liquid source remained visible after switching to iOS flat');
  assert(!(await flat.isHidden()),'actual iOS flat source did not become visible');
  assert(await flat.locator('.collection-filter').count()>=4,'iOS flat source does not use public collection-filter pills');
  const flatStyle=await style(frame,'.platform-filter-chip-source--flat .collection-filter',['borderRadius']);
  assert(flatStyle.borderRadius===publicRef.flatStyle.borderRadius,'Library iOS flat pill radius differs from public source');

  assert(await page.locator('[data-menu-add]').count()===1,'filter menu add control missing');
  await page.locator('[data-menu-add]').click();
  const inputs=page.locator('[data-menu-label]');await inputs.last().fill('기업 촬영');await inputs.last().press('Tab');
  await waitUntil(()=>frame.locator('.platform-filter-chip-source--flat .collection-filter').count().then(n=>n===5),'new filter menu did not reach canonical preview');
  await page.locator('[data-kit-close]').click();

  frame=await choose(page,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('.collection-select-toggle').count().then(n=>n===1),'Library bottom sheet did not load public bulk-selection owner',15000);
  await frame.locator('.collection-tab[data-library-tab="video"]').click();
  await waitUntil(()=>frame.locator('#collectionFilters:not([hidden]) .collection-filter').count().then(n=>n>=4),'Library video filters missing');
  assert((await frame.locator('#collectionFilters .collection-filter').first().textContent()).trim()==='전체','Library flat filters do not use public labels');

  await frame.locator('.collection-tab[data-library-tab="all"]').click();await sleep(120);
  const selectToggle=frame.locator('.collection-select-toggle');assert(!(await selectToggle.isHidden()),'selection toggle hidden despite saved items');
  await selectToggle.click();await sleep(80);
  assert(await frame.locator('#collectionBody').evaluate(node=>node.classList.contains('is-bulk-selecting')),'selection mode did not activate');
  assert(await frame.locator('.collection-selectbox').count()>=1,'selection checkboxes were not added');
  assert(!(await frame.locator('.collection-bulkbar').isHidden()),'bulk action bar did not appear');
  await selectToggle.click();

  await frame.locator('.collection-tab[data-library-tab="question"]').click();
  await waitUntil(()=>frame.locator('#v40QuestionControls:not([hidden])').count().then(n=>n===1),'Library question workspace controls missing',10000);
  assert(await frame.locator('[data-v40-qmode="write"]').count()===1,'Library question 작성 control missing');
  assert(await frame.locator('[data-v40-qmode="saved"]').count()===1,'Library 질문 목록 control missing');
  assert(await frame.locator('#collectionFilters').isHidden(),'Question tab should hide video/article filters like public');
  await frame.locator('[data-v40-qmode="write"]').click();
  await waitUntil(()=>frame.locator('#collectionBody > #askWritePanel').count().then(n=>n===1),'actual public question write panel was not mounted in Library',10000);
  assert(await frame.locator('#askInput').count()===1&&await frame.locator('#askSave').count()===1,'question input/save owner missing');
  await frame.locator('[data-v40-qmode="saved"]').click();
  await waitUntil(()=>frame.locator('.collection-item--question').count().then(n=>n>=1),'saved question list did not return');

  await page.locator('#kitSettings').click();
  const bulkControl=page.locator('[data-style-control="bulkSelection"]');assert(await bulkControl.count()===1,'bulk selection style toggle missing');
  await bulkControl.uncheck();await sleep(280);
  assert(await frame.locator('.collection-select-toggle').isHidden(),'bulkSelection=false did not hide actual selection UI after enhancer refresh');
  await page.locator('[data-style-reset]').click();await page.locator('[data-kit-close]').click();

  frame=await choose(page,'horizontal-card-rail');
  const rail=frame.locator('[data-platform-module="horizontal-card-rail"]');
  const metrics=await rail.evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth}));assert(metrics.scrollWidth>metrics.clientWidth+20,'card rail is no longer horizontally scrollable');
  await rail.evaluate(node=>{node.scrollLeft=120;});await sleep(60);assert(await rail.evaluate(node=>node.scrollLeft)>20,'card rail scrollLeft did not move');

  frame=await choose(page,'top-chapter-navigation');
  const before=await frame.locator('.nav-shell').evaluate(node=>node.getBoundingClientRect().top);await frame.evaluate(()=>window.scrollTo(0,520));await sleep(120);const after=await frame.locator('.nav-shell').evaluate(node=>node.getBoundingClientRect().top);assert(Math.abs(after-before)<2,'Library top navigation still moves with vertical scroll');

  await shot(page,'library-public-interaction-parity');
  await page.close();
  pass('UI Library','real liquid/flat filter sources and full collection interaction stack verified');
}

async function verifyEditor(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('[data-add-module="filter-chip-rail"]').count().then(n=>n===1),'Editor filter module missing',25000);
  await page.locator('[data-add-module="filter-chip-rail"]').click();
  await waitUntil(()=>page.locator('[data-platform-editor-module-frame="filter-chip-rail"]').count().then(n=>n===1),'Editor filter iframe missing');
  const handle=await page.$('[data-platform-editor-module-frame="filter-chip-rail"]');const frame=await handle.contentFrame();assert(frame,'Editor filter iframe unavailable');
  await waitUntil(()=>frame.evaluate(()=>document.querySelectorAll('[data-platform-module="filter-chip-rail"]').length===1),'Editor canonical filter module did not mount');
  assert(await page.locator('[data-array-add]').count()>=1,'Editor filter instance has no per-page menu add control');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformEditorLabDraftV1')||'{}'));
  assert(draft?.blocks?.[0]?.type==='ui-module'&&draft.blocks[0].variant==='filter-chip-rail','Editor did not persist canonical filter module instance');
  await shot(page,'editor-canonical-filter');
  await page.close();
  pass('Block Editor','canonical filter module remains editable per page');
}

try{
  const context=await browser.newContext();
  const publicRef=await verifyPublicReference(context);
  await verifyLibrary(context,publicRef);
  await verifyEditor(context);
  await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
