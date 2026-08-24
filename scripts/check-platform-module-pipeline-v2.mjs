import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/platform-module-pipeline');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
async function waitUntil(fn,message,timeout=30000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return true;}catch(error){last=error;}await sleep(100);}if(last)throw last;throw new Error(message);}
const browserPath=()=>['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
const pass=(name,detail='')=>{report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);};
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function css(locator,names){return locator.evaluate((node,props)=>{const style=getComputedStyle(node);return Object.fromEntries(props.map(name=>[name,style[name]]));},names);}

const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const EXPECTED=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];

async function seedPublic(page){
  await page.addInitScript(()=>{
    const now=new Date().toISOString();
    const videos=[
      {id:'qa-video-product',title:'제품 촬영 조명 세팅',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/product-brand.webp?v=b007',category:'제품 촬영',channel:'영상',savedAt:now},
      {id:'qa-video-portrait',title:'인물 촬영 현장 체크리스트',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/professional-profile.webp?v=b007',category:'인물 촬영',channel:'영상',savedAt:now},
      {id:'qa-video-food',title:'음식 촬영 납품 준비',url:'#',thumbnail:'/assets/images/generated/v1/portfolio/food-store.webp?v=b007',category:'음식 촬영',channel:'영상',savedAt:now}
    ];
    const article={id:'qa-article',title:'상업사진 견적 체크리스트',og_title:'상업사진 견적 체크리스트',url:'#',thumbnail_url:'/assets/images/generated/v1/portfolio/studio-process.webp?v=b007',platform:'읽을거리',summary:'견적과 납품 범위를 확인합니다.',savedAt:now};
    localStorage.setItem('photoRoadmapVideoFavoritesV1',JSON.stringify(videos.map(item=>item.id)));
    localStorage.setItem('photoRoadmapVideoFavoriteItemsV2',JSON.stringify(Object.fromEntries(videos.map(item=>[item.id,item]))));
    localStorage.setItem('photoRoadmapCuratedFavoritesV1',JSON.stringify([article.id]));
    localStorage.setItem('photoRoadmapCuratedFavoriteItemsV2',JSON.stringify({[article.id]:article}));
    localStorage.setItem('photoRoadmapQuestionsV2',JSON.stringify([{id:'qa-question',question:'견적서에는 무엇을 포함해야 하나요?',selected_text:'촬영 범위와 납품 범위를 먼저 정합니다.',created_at:now}]));
  });
}

async function publicReference(context){
  const page=await context.newPage();await seedPublic(page);await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('#collectionFab').count().then(n=>n===1),'public FAB missing');
  await page.locator('#collectionFab').click();
  await waitUntil(()=>page.locator('#collectionSheet.is-open').count().then(n=>n===1),'public sheet did not open');
  await waitUntil(()=>page.locator('.collection-select-toggle').count().then(n=>n===1),'public bulk owner missing');
  const liquid=await css(page.locator('.collection-tabs').first(),['borderRadius']);
  await page.locator('.collection-tab[data-library-tab="video"]').click();
  await waitUntil(()=>page.locator('#collectionFilters:not([hidden]) .collection-filter').count().then(n=>n>=4),'public flat filters missing');
  const flat=await css(page.locator('#collectionFilters .collection-filter').first(),['borderRadius']);
  await page.locator('.collection-tab[data-library-tab="question"]').click();
  await waitUntil(()=>page.locator('#v40QuestionControls:not([hidden])').count().then(n=>n===1),'public question workspace missing');
  assert(await page.locator('[data-v40-qmode="write"]').count()===1,'public question write mode missing');
  assert(await page.locator('[data-v40-qmode="saved"]').count()===1,'public saved question mode missing');
  await shot(page,'public-reference-interactions');
  await page.close();pass('Public reference','liquid, flat, bulk and question owners are present');
  return {liquid,flat};
}

async function waitLibraryModule(page,id){
  await page.locator(`[data-kit-ui="${id}"]`).click();
  await waitUntil(()=>page.evaluate(moduleId=>{
    const frame=document.querySelector('#builderFrame');const doc=frame?.contentDocument;
    return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));
  },id),`Library module did not mount: ${id}`,35000);
  return page.frameLocator('#builderFrame');
}

async function libraryParity(context,reference){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length)),'Library did not initialize');
  const ids=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('library').map(item=>item.id));
  assert(ids.length===EXPECTED.length&&EXPECTED.every(id=>ids.includes(id)),'Library approved module set mismatch');

  let frame=await waitLibraryModule(page,'filter-chip-rail');
  const liquid=frame.locator('.platform-filter-chip-source--liquid');const flat=frame.locator('.platform-filter-chip-source--flat');
  assert(!(await liquid.isHidden()),'iOS liquid must be default');assert(await flat.isHidden(),'iOS flat must start hidden');
  await waitUntil(()=>frame.locator('.collection-v33-indicator').count().then(n=>n===1),'Liquid indicator missing');
  const libraryLiquid=await css(liquid,['borderRadius']);assert(libraryLiquid.borderRadius===reference.liquid.borderRadius,'Liquid radius differs from public source');

  await page.locator('#kitSettings').click();
  const family=page.locator('[data-style-control="family"]');
  const options=await family.locator('option').evaluateAll(nodes=>nodes.map(node=>node.value));
  assert(JSON.stringify(options)===JSON.stringify(['ios-liquid','ios-flat']),`Unapproved filter families exposed: ${JSON.stringify(options)}`);
  assert(!options.includes('material-flat'),'Material must remain outside approved Library');
  await family.selectOption('ios-flat');await sleep(250);
  assert(await liquid.isHidden(),'Liquid source remained visible after iOS flat switch');assert(!(await flat.isHidden()),'Public flat source did not become visible');
  assert(await flat.locator('.collection-filter').count()>=4,'Public flat pills missing');
  const libraryFlat=await css(flat.locator('.collection-filter').first(),['borderRadius']);assert(libraryFlat.borderRadius===reference.flat.borderRadius,'Flat pill radius differs from public source');

  const opacity=page.locator('[data-style-control="surfaceOpacity"]');
  if(await opacity.count())await opacity.evaluate(node=>{node.value='63';node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(180);
  const pills=flat.locator('.collection-filter');await pills.nth(1).click();await sleep(100);
  const former=await css(pills.nth(0),['backgroundColor','backgroundImage']);const other=await css(pills.nth(2),['backgroundColor','backgroundImage']);
  assert(JSON.stringify(former)===JSON.stringify(other),'iOS flat inactive surface is not reapplied after selection moves');

  await page.locator('[data-menu-add]').click();const inputs=page.locator('[data-menu-label]');await inputs.last().fill('기업 촬영');await inputs.last().press('Tab');
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.querySelectorAll('.platform-filter-chip-source--flat .collection-filter').length===5),'Added filter menu did not reach preview');
  await page.locator('[data-kit-close]').click();

  frame=await waitLibraryModule(page,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('.collection-select-toggle').count().then(n=>n===1),'Bulk selection owner missing in Library sheet');
  await frame.locator('.collection-tab[data-library-tab="video"]').click();
  await waitUntil(()=>frame.locator('#collectionFilters:not([hidden]) .collection-filter').count().then(n=>n>=4),'Video filters missing in Library sheet');
  assert((await frame.locator('#collectionFilters .collection-filter').first().textContent()).trim()==='전체','Public flat filter labels missing');

  await frame.locator('.collection-tab[data-library-tab="all"]').click();await sleep(150);
  const select=frame.locator('.collection-select-toggle');assert(!(await select.isHidden()),'Select control hidden with saved items');await select.click();await sleep(120);
  assert(await frame.locator('#collectionBody').evaluate(node=>node.classList.contains('is-bulk-selecting')),'Bulk mode did not activate');
  assert(await frame.locator('.collection-selectbox').count()>=1,'Bulk checkboxes missing');assert(!(await frame.locator('.collection-bulkbar').isHidden()),'Bulk action bar missing');await select.click();

  await frame.locator('.collection-tab[data-library-tab="question"]').click();
  await waitUntil(()=>frame.locator('#v40QuestionControls:not([hidden])').count().then(n=>n===1),'Question workspace missing in Library sheet');
  assert(await frame.locator('#collectionFilters').isHidden(),'Question tab must hide video/article filters');
  await frame.locator('[data-v40-qmode="write"]').click();
  await waitUntil(()=>frame.locator('#collectionBody > #askWritePanel').count().then(n=>n===1),'Actual question write panel not mounted');
  assert(await frame.locator('#askInput').count()===1&&await frame.locator('#askSave').count()===1,'Question input/save owner missing');
  await frame.locator('[data-v40-qmode="saved"]').click();await waitUntil(()=>frame.locator('.collection-item--question').count().then(n=>n>=1),'Saved question list missing');
  const questionOpen=frame.locator('.v41-question-open,.collection-question-open').first();if(await questionOpen.count()){await questionOpen.click();await waitUntil(()=>frame.locator('#askInput').inputValue().then(value=>value.includes('견적서')),'Saved question did not load into public owner state');await frame.locator('#askSave').click();await waitUntil(()=>frame.locator('#askSave').textContent().then(text=>String(text).includes('저장')),'Saved question owner state did not permit save');}

  await page.locator('#kitSettings').click();const bulk=page.locator('[data-style-control="bulkSelection"]');assert(await bulk.count()===1,'Bulk style toggle missing');await bulk.uncheck();
  await frame.locator('body').evaluate(()=>window.dispatchEvent(new Event('pageshow')));await sleep(450);assert(await frame.locator('.collection-select-toggle').isHidden(),'bulkSelection=false was lost after enhancer refresh');
  await page.locator('[data-style-reset]').click();await page.locator('[data-kit-close]').click();

  frame=await waitLibraryModule(page,'horizontal-card-rail');const rail=frame.locator('[data-platform-module="horizontal-card-rail"]');
  const metric=await rail.evaluate(node=>({client:node.clientWidth,scroll:node.scrollWidth}));assert(metric.scroll>metric.client+20,'Card rail is not horizontally scrollable');await rail.evaluate(node=>node.scrollLeft=120);await sleep(80);assert(await rail.evaluate(node=>node.scrollLeft)>20,'Card rail did not scroll');

  frame=await waitLibraryModule(page,'top-chapter-navigation');const nav=frame.locator('.nav-shell');const before=await nav.evaluate(node=>node.getBoundingClientRect().top);
  await page.locator('#builderFrame').evaluate(frameNode=>frameNode.contentWindow.scrollTo(0,520));await sleep(140);const after=await nav.evaluate(node=>node.getBoundingClientRect().top);assert(Math.abs(after-before)<2,'Top navigation moves with preview scroll');

  await shot(page,'library-public-interaction-parity');await page.close();pass('UI Library','public filter variants and full collection interaction stack verified');
}

async function editorParity(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('[data-add-module="filter-chip-rail"]').count().then(n=>n===1),'Editor filter module missing');await page.locator('[data-add-module="filter-chip-rail"]').click();
  await waitUntil(()=>page.locator('[data-platform-editor-module-frame="filter-chip-rail"]').count().then(n=>n===1),'Editor filter frame missing');
  await waitUntil(()=>page.evaluate(()=>document.querySelector('[data-platform-editor-module-frame="filter-chip-rail"]')?.contentDocument?.querySelector('[data-platform-module="filter-chip-rail"]')!=null),'Editor canonical filter did not mount',35000);
  assert(await page.locator('[data-array-add]').count()>=1,'Editor filter instance has no menu add control');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformEditorLabDraftV1')||'{}'));assert(draft?.blocks?.[0]?.type==='ui-module'&&draft.blocks[0].variant==='filter-chip-rail','Editor did not persist canonical filter instance');
  await shot(page,'editor-canonical-filter');await page.close();pass('Block Editor','canonical filter remains per-page editable');
}

try{
  const context=await browser.newContext();const reference=await publicReference(context);await libraryParity(context,reference);await editorParity(context);await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
