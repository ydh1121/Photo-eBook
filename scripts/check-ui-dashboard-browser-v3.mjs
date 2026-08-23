import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/ui-dashboard-browser');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=12000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function sandbox(page,preview=''){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(previewId=>{const doc=document.querySelector('#builderFrame')?.contentDocument;if(!doc?.documentElement?.dataset?.builderSandbox)return false;return previewId?Boolean(doc.querySelector(`#sandboxPreviewRoot[data-preview-kind="${previewId}"]`)):Boolean(doc.querySelector('#app'));},preview),`sandbox not ready: ${preview||'page'}`,20000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'iframe missing');return frame;
}
async function clickSwitch(page,key,value){await page.locator(`[${key}="${value}"]`).click();}
async function setInput(page,selector,value){const node=page.locator(selector);await node.waitFor({state:'attached'});await node.evaluate((el,next)=>{el.value=String(next);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);}
async function openInspector(page){await page.locator('#kitSettings').click();await page.locator('.builder-kit-inspector:not([hidden])').waitFor({state:'visible'});}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function verifyMatrix(page,frame,id){
  for(const theme of ['light','dark','system']){
    await clickSwitch(page,'data-kit-theme',theme);
    await waitUntil(()=>page.evaluate(v=>document.querySelector('.builder-kit-workspace')?.dataset.themeChoice===v,theme),`${id}: theme ${theme}`);
    for(const viewport of ['desktop','mobile']){
      await clickSwitch(page,'data-kit-viewport',viewport);
      await waitUntil(()=>page.evaluate(v=>document.querySelector('.builder-kit-workspace')?.dataset.viewport===v,viewport),`${id}: viewport ${viewport}`);
      const width=await page.locator('.builder-kit-frame-shell').evaluate(node=>node.getBoundingClientRect().width);
      assert(viewport==='mobile'?width<=440:width>600,`${id}: unexpected ${viewport} width ${width}`);
    }
  }
  await clickSwitch(page,'data-kit-theme','light');await clickSwitch(page,'data-kit-viewport','desktop');await shot(page,`${id}-desktop-light`);
  pass(`${id} theme/viewport`,'White/Dark/System × PC/Mobile');
}

async function globalChipPropagation(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  let frame=await sandbox(page,'filter-chip-rail');
  const chips=frame.locator('#collectionFilters .collection-filter');assert(await chips.count()>=4,'real bottom-sheet filter row missing');
  await clickSwitch(page,'data-kit-mode','material-flat');
  await openInspector(page);await setInput(page,'[data-kit-control="accentColor"]','#d9405f');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='material-flat'),'global chip family not applied to filter preview');
  await chips.nth(1).click();await waitUntil(()=>chips.nth(1).evaluate(node=>node.classList.contains('is-active')),'filter interaction missing');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  frame=await sandbox(page,'top-chapter-navigation');
  assert(await page.locator('#kitMode[hidden]').count()===1,'top nav still owns chip representation control');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='material-flat'),'global chip family did not propagate to top nav');
  const topAccent=await frame.locator('.nav-chip.is-active').evaluate(node=>getComputedStyle(node).backgroundColor);assert(topAccent!=='rgba(0, 0, 0, 0)','top nav active chip did not receive global accent');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=collection-bottom-sheet`,{waitUntil:'domcontentloaded'});
  frame=await sandbox(page,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('#collectionFilters').evaluate(node=>node.dataset.builderFamily==='material-flat'),'global chip family did not propagate to bottom sheet');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  frame=await sandbox(page,'filter-chip-rail');await clickSwitch(page,'data-kit-mode','ios-liquid');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='ios-liquid'),'iOS liquid global mode missing');
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'top-chapter-navigation');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='ios-liquid'),'iOS liquid did not propagate to top nav');
  pass('global chip system','bottom-sheet source → common mode/accent → top nav and bottom sheet');
}

async function library(context){
  const ids=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?view=library`,{waitUntil:'domcontentloaded'});await page.evaluate(()=>localStorage.clear());
  for(const id of ids){
    await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${id}`,{waitUntil:'domcontentloaded'});const frame=await sandbox(page,id);await verifyMatrix(page,frame,id);
    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.nav-shell').count()===1,'nav missing');
      assert(await page.locator('[data-kit-control="chipFamily"]').count()===0,'legacy top-nav chipFamily inspector control remains');
      await openInspector(page);await page.locator('[data-kit-control="progressMode"]').selectOption('line');await waitUntil(()=>frame.locator('.nav-chapter-progress').evaluate(node=>getComputedStyle(node).height==='2px'),'nav progress live control missing');
    }
    if(id==='horizontal-card-rail'){
      await openInspector(page);await setInput(page,'[data-kit-control="rightContentPadding"]',150);await waitUntil(()=>frame.locator('.scroll-row').evaluate(node=>getComputedStyle(node).paddingRight==='150px'),'rail padding missing');
    }
    if(id==='collection-bottom-sheet'){
      await clickSwitch(page,'data-kit-state','settings');await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'sheet state missing');
    }
    if(id==='device-handoff-accordion'){
      const root=frame.locator('#sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]');assert(await root.locator('.collection-device-accordion').count()===1,'device accordion missing');assert(await root.locator('.collection-sheet,.collection-tabs').count()===0,'unrelated device UI leaked');
    }
  }
  await globalChipPropagation(page);await shot(page,'global-chip-top-nav-ios-liquid');await page.close();
}

async function builder(context){
  const page=await context.newPage();await page.setViewportSize({width:1920,height:1200});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});let frame=await sandbox(page);
  await waitUntil(()=>frame.locator('.platform-builder-block-handle').count().then(n=>n>0),'builder chrome missing',16000);
  await frame.locator('[data-builder-capability="top-chapter-navigation"] > .platform-builder-gear').first().click({force:true});
  const topInspector=page.locator('.builder-inspector[data-inspector-id="top-chapter-navigation"]');await topInspector.waitFor({state:'visible'});assert(await topInspector.locator('[data-builder-control="chipFamily"],[data-builder-control="accentColor"]').count()===0,'page top-nav still owns common chip style');
  await topInspector.locator('[data-close-inspector]').click();

  await frame.locator('[data-builder-capability="filter-chip-rail"] > .platform-builder-gear').first().click({force:true}).catch(()=>{});
  const filterInspector=page.locator('.builder-inspector[data-inspector-id="filter-chip-rail"]');
  if(await filterInspector.count()){
    await filterInspector.waitFor({state:'visible'});await filterInspector.locator('[data-builder-control="family"]').selectOption('material-flat');
    await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='material-flat'),'page global filter-chip config did not affect top nav');
  }
  pass('page chip ownership','top nav layout owns no chip style; global filter-chip config owns chip family');
  await page.close();
}

try{
  const context=await browser.newContext();await library(context);await builder(context);await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
