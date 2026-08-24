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
async function box(scope,selector){return scope.locator(selector).first().evaluate(node=>{const r=node.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,top:r.top,bottom:r.bottom,right:r.right};});}

const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function libraryFrame(page,id){
  await waitUntil(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModulePreview==='true'&&doc.documentElement.dataset.platformModule===moduleId&&frame.contentWindow?.PlatformModuleStyleRuntime);},id),`library frame not ready: ${id}`,25000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,`missing frame: ${id}`);return frame;
}
async function choose(page,id){await page.locator(`[data-kit-ui="${id}"]`).click();return libraryFrame(page,id);}

async function verifyPublicReference(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('.nav-shell[data-platform-module="top-chapter-navigation"]').count().then(n=>n===1),'public canonical nav missing',25000);
  assert(await page.locator('.market-card').count()===3,'public market reference no longer has the three production cards');
  await waitUntil(()=>page.locator('#collectionFab').count().then(n=>n===1),'public collection FAB missing',20000);
  await page.locator('#collectionFab').click();
  await waitUntil(()=>page.locator('#collectionSheet.is-open').count().then(n=>n===1),'public collection sheet did not open');
  const tabsStyle=await style(page,'.collection-tabs',['borderRadius','backgroundImage','backdropFilter']);
  const tabsBox=await box(page,'.collection-tabs');
  assert(await page.locator('.collection-v33-indicator').count()===1,'public liquid collection tab indicator missing');
  await shot(page,'public-reference');
  pass('Public reference','production nav/cards/collection liquid tabs available');
  await page.close();
  return {tabsStyle,tabsBox};
}

async function verifyLibrary(context,publicRef){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length)),'Library did not initialize',25000);
  const rootState=await page.evaluate(()=>({ids:window.PlatformModuleRegistry.listFor('library').map(x=>x.id),statebar:Boolean(document.querySelector('#kitStatebar')),settings:document.querySelector('#kitSettings')?.textContent||'',sandbox:[...document.scripts].some(s=>(s.src||'').includes('/ui-dashboard/sandbox/'))}));
  assert(rootState.ids.length===expected.length&&expected.every(id=>rootState.ids.includes(id)),'Library module set mismatch');
  assert(!rootState.statebar,'state controls leaked above the preview canvas');
  assert(rootState.settings.includes('스타일'),'Library style/settings control is missing');
  assert(!rootState.sandbox,'Library still imports sandbox runtime');
  assert((await page.locator('[data-kit-ui="device-handoff-accordion"]').textContent()).trim()==='아코디언 탭','device module is still mislabeled instead of 아코디언 탭');

  let frame=await choose(page,'filter-chip-rail');
  const filterSelector='#platformModuleHost > [data-platform-module="filter-chip-rail"]';
  const filter=frame.locator(filterSelector);
  const filterCount=await filter.count();
  if(filterCount!==1){
    const diag=await frame.evaluate(()=>({body:(document.body?.innerText||'').slice(0,800),host:(document.querySelector('#platformModuleHost')?.innerHTML||'').slice(0,1200),styleError:document.documentElement.dataset.platformStyleError||''}));
    throw new Error(`canonical filter rail count=${filterCount}; ${JSON.stringify(diag)}`);
  }
  assert(await filter.evaluate(node=>node.classList.contains('collection-tabs')),'generic filter rail is not extracted from the public liquid segmented rail');
  await waitUntil(()=>frame.locator('#platformModuleHost .collection-v33-indicator').count().then(n=>n===1),'generic filter liquid indicator missing',5000);
  const filterStyle=await style(frame,filterSelector,['borderRadius','backgroundImage','backdropFilter']);
  assert(filterStyle.borderRadius===publicRef.tabsStyle.borderRadius,'generic filter border radius differs from public collection tabs');
  assert(filterStyle.backgroundImage===publicRef.tabsStyle.backgroundImage,'generic filter surface differs from public collection tabs');
  const baselineInline=await filter.evaluate(node=>({lgA:node.style.getPropertyValue('--lg-blue-a'),v36Top:node.style.getPropertyValue('--v36-blue-top')}));
  assert(!baselineInline.lgA&&!baselineInline.v36Top,'public liquid baseline was flattened by inline accent variables');
  const indicatorBefore=await frame.locator('#platformModuleHost .collection-v33-indicator').evaluate(node=>node.getBoundingClientRect().left);
  await frame.locator('#platformModuleHost .collection-tab').nth(2).click();await sleep(360);
  const indicatorAfter=await frame.locator('#platformModuleHost .collection-v33-indicator').evaluate(node=>node.getBoundingClientRect().left);
  assert(indicatorAfter>indicatorBefore+5,'generic filter active liquid chip did not move');

  await page.locator('#kitSettings').click();
  await waitUntil(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(n=>n===1),'style inspector did not open');
  assert(await page.locator('[data-style-control="family"]').count()===1,'filter style family control was not restored');
  assert(await page.locator('[data-menu-add]').count()===1,'filter menu add control is missing from UI Library');
  await page.locator('[data-menu-add]').click();
  const menuInputs=page.locator('[data-menu-label]');
  const addedIndex=await menuInputs.count()-1;
  await menuInputs.nth(addedIndex).fill('기업 촬영');
  await menuInputs.nth(addedIndex).press('Tab');
  await waitUntil(()=>frame.locator('#platformModuleHost .collection-tab').count().then(n=>n===5),'added Library filter menu did not reach canonical preview');
  assert((await frame.locator('#platformModuleHost .collection-tab').last().textContent()).trim()==='기업 촬영','added Library filter label mismatch');
  const savedContent=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}')['filter-chip-rail']);
  assert(Array.isArray(savedContent?.items)&&savedContent.items.includes('기업 촬영'),'Library filter menu defaults were not persisted');

  await page.locator('[data-style-control="family"]').selectOption('material-flat');await sleep(120);
  assert(await frame.locator(filterSelector).getAttribute('data-module-style-family')==='material-flat','style change did not reach the actual module');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleDefaultsV1')||'{}')['filter-chip-rail']);
  assert(saved?.family==='material-flat','Library style change was not saved as the standard module value');
  await page.locator('[data-style-reset]').click();await sleep(120);
  assert(await frame.locator(filterSelector).getAttribute('data-module-style-family')===null,'reset did not return generic filter to public liquid baseline');
  assert(await frame.locator('#platformModuleHost .collection-v33-indicator').count()===1,'public liquid indicator did not return after reset');
  await page.locator('[data-kit-close]').click();

  frame=await choose(page,'horizontal-card-rail');
  const cardShell=await box(page,'#builderCanvasShell');
  assert(cardShell.height>=680,'card preview stage is still too short');
  const cardMetrics=await frame.locator('[data-platform-module="horizontal-card-rail"]').evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
  assert(cardMetrics.scrollWidth>cardMetrics.clientWidth+20,'card preview no longer exposes horizontal scrolling');
  await frame.locator('[data-platform-module="horizontal-card-rail"]').evaluate(node=>{node.scrollLeft=120;});await sleep(80);
  assert(await frame.locator('[data-platform-module="horizontal-card-rail"]').evaluate(node=>node.scrollLeft)>20,'card preview horizontal scroll does not work');
  const lastCard=await box(frame,'.market-card:last-child');
  assert(lastCard.bottom<650,'card content is vertically clipped inside its module stage');

  frame=await choose(page,'top-chapter-navigation');
  const navShell=await box(page,'#builderCanvasShell');assert(navShell.height>=410,'top nav preview stage is too short for behavior testing');
  const navScrollability=await frame.evaluate(()=>({innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollbarWidth:getComputedStyle(document.documentElement).scrollbarWidth}));
  assert(navScrollability.scrollHeight>navScrollability.innerHeight+500,'top nav preview has no vertical scroll runway');
  await frame.evaluate(()=>window.scrollTo(0,520));await sleep(120);
  assert(await frame.evaluate(()=>window.scrollY)>100,'top nav preview wheel/vertical scrolling does not operate');
  assert(navScrollability.scrollbarWidth==='none','top nav preview scrollbar should be hidden');

  frame=await choose(page,'collection-bottom-sheet');
  const sheetShell=await box(page,'#builderCanvasShell');assert(sheetShell.height>=880,'bottom sheet preview stage is still clipped');
  assert(await page.locator('#kitStatebar').count()===0,'bottom sheet state controls are visible above canvas');
  const sheetBox=await box(frame,'#collectionSheet');
  assert(sheetBox.bottom<=905,'bottom sheet extends outside the module preview stage');
  await page.locator('#kitSettings').click();
  assert(await page.locator('[data-inspector-state]').count()===5,'bottom sheet state controls are not inside inspector');
  await page.locator('[data-inspector-state="question"]').click();await sleep(120);
  assert(await frame.locator('.collection-tab[data-library-tab="question"]').evaluate(node=>node.classList.contains('is-active')),'bottom sheet state control did not drive actual tab');
  const enabled=page.locator('[data-style-control="enabled"]');await enabled.uncheck();await sleep(100);
  const disabledState=await frame.evaluate(()=>({flag:document.querySelector('[data-platform-module="collection-bottom-sheet"]')?.dataset.moduleDisabled||'',fab:getComputedStyle(document.querySelector('#collectionFab')).display,sheet:getComputedStyle(document.querySelector('#collectionSheet')).display}));
  assert(disabledState.flag==='true'&&disabledState.fab==='none'&&disabledState.sheet==='none','disabled bottom sheet can still expose its trigger or sheet');
  await frame.locator('#collectionFab').evaluate(node=>node.click());await sleep(80);
  assert(await frame.locator('#collectionSheet').evaluate(node=>getComputedStyle(node).display)==='none','disabled bottom sheet reopened through its FAB handler');
  await page.locator('[data-style-reset]').click();await sleep(80);
  await page.locator('[data-kit-close]').click();

  frame=await choose(page,'device-handoff-accordion');
  const accordionShell=await box(page,'#builderCanvasShell');assert(accordionShell.height>=700,'accordion preview stage is too short');
  assert(await page.locator('#kitStatebar').count()===0,'accordion state controls are visible above canvas');
  await page.locator('#kitSettings').click();
  assert(await page.locator('[data-inspector-state]').count()===2,'accordion state controls are not inside inspector');
  await page.locator('[data-inspector-state="expanded"]').click();
  await waitUntil(()=>frame.locator('#collectionDeviceLink').getAttribute('aria-expanded').then(v=>v==='true'),'accordion did not expand from inspector');
  await page.locator('[data-kit-close]').click();

  for(const id of expected){frame=await choose(page,id);await page.locator('#kitSettings').click();assert(await page.locator('[data-style-control]').count()>0,`${id}: style controls missing`);await page.locator('[data-kit-close]').click();}

  await shot(page,'library-module-extensibility');
  pass('UI Library','filter menus editable; module stages match interaction; accordion naming and stable styles verified');
  await page.close();
}

async function verifyEditorInheritance(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  await libraryFrame(page,'filter-chip-rail');
  await page.locator('#kitSettings').click();
  await page.locator('[data-style-control="family"]').selectOption('material-flat');await sleep(80);
  if(!await page.locator('[data-menu-label]').evaluateAll(nodes=>nodes.some(node=>node.value==='기업 촬영'))){await page.locator('[data-menu-add]').click();const inputs=page.locator('[data-menu-label]');await inputs.last().fill('기업 촬영');await inputs.last().press('Tab');}

  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('[data-add-module="filter-chip-rail"]').count().then(n=>n===1),'Editor approved module list missing',25000);
  await page.locator('[data-add-module="filter-chip-rail"]').click();
  await waitUntil(()=>page.locator('[data-platform-editor-module-frame="filter-chip-rail"]').count().then(n=>n===1),'Editor module iframe missing');
  const handle=await page.$('[data-platform-editor-module-frame="filter-chip-rail"]');const frame=await handle.contentFrame();assert(frame,'Editor iframe unavailable');
  await waitUntil(()=>frame.locator('#platformModuleHost > [data-platform-module="filter-chip-rail"]').getAttribute('data-module-style-family').then(v=>v==='material-flat'),'Editor did not snapshot Library standard style',20000);
  assert(await frame.locator('#platformModuleHost .collection-tab').filter({hasText:'기업 촬영'}).count()===1,'Editor did not snapshot Library filter menus');
  assert(await page.locator('[data-array-add]').count()>=1,'Editor filter instance has no menu/array add control');
  const storedBlock=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformEditorLabDraftV1')||'{}').blocks?.[0]);
  assert(storedBlock?.styleOverrides?.family==='material-flat','new Editor block did not persist Library style snapshot');
  assert(Array.isArray(storedBlock?.content?.items)&&storedBlock.content.items.includes('기업 촬영'),'new Editor block did not persist Library menu snapshot');

  await page.evaluate(()=>{const styles=JSON.parse(localStorage.getItem('platformModuleDefaultsV1')||'{}');styles['filter-chip-rail']={family:'ios-flat'};localStorage.setItem('platformModuleDefaultsV1',JSON.stringify(styles));const contents=JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}');contents['filter-chip-rail']={items:['전체','새 기본값'],activeId:'all'};localStorage.setItem('platformModuleContentDefaultsV1',JSON.stringify(contents));});
  await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('[data-platform-editor-module-frame="filter-chip-rail"]').count().then(n=>n===1),'Editor module missing after reload');
  const handle2=await page.$('[data-platform-editor-module-frame="filter-chip-rail"]');const frame2=await handle2.contentFrame();assert(frame2,'Editor iframe unavailable after reload');
  await waitUntil(()=>frame2.locator('#platformModuleHost > [data-platform-module="filter-chip-rail"]').getAttribute('data-module-style-family').then(v=>v==='material-flat'),'existing Editor block was retroactively restyled by Library defaults',20000);
  assert(await frame2.locator('#platformModuleHost .collection-tab').filter({hasText:'기업 촬영'}).count()===1,'existing Editor block menu was retroactively replaced by Library defaults');
  await page.evaluate(()=>{localStorage.removeItem('platformModuleDefaultsV1');localStorage.removeItem('platformModuleContentDefaultsV1');});
  pass('Block Editor defaults','new modules snapshot Library menu/style defaults and existing blocks remain stable');
  await page.close();
}

async function verifyBoundaries(context){
  const page=await context.newPage();
  await page.goto(`${BASE}/block-lab/`,{waitUntil:'domcontentloaded'});assert(await page.locator('text=RESEARCH ONLY').count()>=1,'Block Lab research-only marker missing');
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  const deps=await page.evaluate(()=>({scripts:[...document.scripts].map(s=>s.src||''),styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.href||'')}));
  assert(!deps.scripts.some(src=>src.includes('/assets/js/block-lab/')),'Editor loads Block Lab JS');
  assert(!deps.styles.some(src=>src.includes('/assets/styles/block-lab/')),'Editor loads Block Lab CSS');
  pass('Product boundaries','Block Lab remains research-only and Editor remains approved-module consumer');
  await page.close();
}

try{
  const context=await browser.newContext();
  const publicRef=await verifyPublicReference(context);
  await verifyLibrary(context,publicRef);
  await verifyEditorInheritance(context);
  await verifyBoundaries(context);
  await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
