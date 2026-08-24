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
async function box(scope,selector){return scope.locator(selector).first().evaluate(node=>{const r=node.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,top:r.top};});}

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

  let frame=await choose(page,'filter-chip-rail');
  const filter=frame.locator('[data-platform-module="filter-chip-rail"]');
  const filterCount=await filter.count();
  if(filterCount!==1){
    const diag=await frame.evaluate(()=>({
      body:(document.body?.innerText||'').slice(0,800),
      host:(document.querySelector('#platformModuleHost')?.innerHTML||'').slice(0,1200),
      styleError:document.documentElement.dataset.platformStyleError||'',
      modules:window.PlatformModuleRegistry?.listFor('library')?.map(item=>({id:item.id,version:item.version,render:String(item.render).slice(0,100)}))||[]
    }));
    throw new Error(`generic filter rail count=${filterCount}; ${JSON.stringify(diag)}`);
  }
  assert(await filter.evaluate(node=>node.classList.contains('collection-tabs')),'generic filter rail is not extracted from the public liquid segmented rail');
  await waitUntil(()=>frame.locator('.collection-v33-indicator').count().then(n=>n===1),'generic filter liquid indicator missing',5000);
  const filterStyle=await style(frame,'[data-platform-module="filter-chip-rail"]',['borderRadius','backgroundImage','backdropFilter']);
  assert(filterStyle.borderRadius===publicRef.tabsStyle.borderRadius,'generic filter border radius differs from public collection tabs');
  assert(filterStyle.backgroundImage===publicRef.tabsStyle.backgroundImage,'generic filter surface differs from public collection tabs');
  const indicatorBefore=await frame.locator('.collection-v33-indicator').evaluate(node=>node.getBoundingClientRect().left);
  await frame.locator('.collection-tab').nth(2).click();await sleep(360);
  const indicatorAfter=await frame.locator('.collection-v33-indicator').evaluate(node=>node.getBoundingClientRect().left);
  assert(indicatorAfter>indicatorBefore+5,'generic filter active liquid chip did not move');

  await page.locator('#kitSettings').click();
  await waitUntil(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(n=>n===1),'style inspector did not open');
  assert(await page.locator('[data-style-control="family"]').count()===1,'filter style family control was not restored');
  await page.locator('[data-style-control="family"]').selectOption('material-flat');await sleep(120);
  assert(await frame.locator('[data-platform-module="filter-chip-rail"]').getAttribute('data-module-style-family')==='material-flat','style change did not reach the actual module');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleDefaultsV1')||'{}')['filter-chip-rail']);
  assert(saved?.family==='material-flat','Library style change was not saved as the standard module value');
  await page.locator('[data-style-reset]').click();await sleep(120);
  assert(await frame.locator('[data-platform-module="filter-chip-rail"]').getAttribute('data-module-style-family')===null,'reset did not return generic filter to public liquid baseline');
  assert(await frame.locator('.collection-v33-indicator').count()===1,'public liquid indicator did not return after reset');
  await page.locator('[data-kit-close]').click();

  frame=await choose(page,'collection-bottom-sheet');
  assert(await page.locator('#kitStatebar').count()===0,'bottom sheet state controls are visible above canvas');
  await page.locator('#kitSettings').click();
  assert(await page.locator('[data-inspector-state]').count()===5,'bottom sheet state controls are not inside inspector');
  await page.locator('[data-inspector-state="question"]').click();await sleep(120);
  assert(await frame.locator('.collection-tab[data-library-tab="question"]').evaluate(node=>node.classList.contains('is-active')),'bottom sheet state control did not drive actual tab');
  await page.locator('[data-kit-close]').click();

  frame=await choose(page,'device-handoff-accordion');
  assert(await page.locator('#kitStatebar').count()===0,'device state controls are visible above canvas');
  await page.locator('#kitSettings').click();
  assert(await page.locator('[data-inspector-state]').count()===2,'device state controls are not inside inspector');
  await page.locator('[data-inspector-state="expanded"]').click();
  await waitUntil(()=>frame.locator('#collectionDeviceLink').getAttribute('aria-expanded').then(v=>v==='true'),'device did not expand from inspector');
  await page.locator('[data-kit-close]').click();

  for(const id of expected){
    frame=await choose(page,id);
    await page.locator('#kitSettings').click();
    assert(await page.locator('[data-style-control]').count()>0,`${id}: style controls missing`);
    await page.locator('[data-kit-close]').click();
  }

  await shot(page,'library-restored-controls');
  pass('UI Library','generic liquid filter matches public owner; state controls hidden in inspector; styles restored');
  await page.close();
}

async function verifyEditorInheritance(context){
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  await libraryFrame(page,'filter-chip-rail');
  await page.locator('#kitSettings').click();
  await page.locator('[data-style-control="family"]').selectOption('material-flat');await sleep(80);
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));await page.reload({waitUntil:'domcontentloaded'});
  await waitUntil(()=>page.locator('[data-add-module="filter-chip-rail"]').count().then(n=>n===1),'Editor approved module list missing',25000);
  await page.locator('[data-add-module="filter-chip-rail"]').click();
  await waitUntil(()=>page.locator('[data-platform-editor-module-frame="filter-chip-rail"]').count().then(n=>n===1),'Editor module iframe missing');
  const handle=await page.$('[data-platform-editor-module-frame="filter-chip-rail"]');const frame=await handle.contentFrame();assert(frame,'Editor iframe unavailable');
  await waitUntil(()=>frame.locator('[data-platform-module="filter-chip-rail"]').getAttribute('data-module-style-family').then(v=>v==='material-flat'),'Editor did not inherit Library standard style',20000);
  await page.evaluate(()=>{const all=JSON.parse(localStorage.getItem('platformModuleDefaultsV1')||'{}');delete all['filter-chip-rail'];localStorage.setItem('platformModuleDefaultsV1',JSON.stringify(all));});
  pass('Block Editor inheritance','new module instances inherit UI Library standard values');
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
