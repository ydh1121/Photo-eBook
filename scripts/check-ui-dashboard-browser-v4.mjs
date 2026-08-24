import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/ui-dashboard-browser');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
async function waitUntil(fn,message,timeout=14000){const start=Date.now();let last;while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function sandbox(page,preview=''){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(kind=>{const doc=document.querySelector('#builderFrame')?.contentDocument;if(!doc?.documentElement?.dataset?.builderSandbox)return false;return kind?Boolean(doc.querySelector(`#sandboxPreviewRoot[data-preview-kind="${kind}"]`)):Boolean(doc.querySelector('#app'));},preview),`sandbox not ready: ${preview||'page'}`,20000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'iframe missing');return frame;
}
async function clickSwitch(page,key,value){await page.locator(`[${key}="${value}"]`).click();}
async function setInput(page,selector,value){const node=page.locator(selector);await node.waitFor({state:'attached'});await node.evaluate((el,next)=>{el.value=String(next);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);}
async function openInspector(page){await page.locator('#kitSettings').click();await page.locator('.builder-kit-inspector:not([hidden])').waitFor({state:'visible'});}
async function waitForFilterLive(frame){await waitUntil(()=>frame.locator('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]').evaluate(node=>node.dataset.liveReady==='true'),'filter chip live runtime not ready');}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function verifyMatrix(page,frame,id){
  if(id==='filter-chip-rail')await waitForFilterLive(frame);
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
  await clickSwitch(page,'data-kit-theme','light');await clickSwitch(page,'data-kit-viewport','desktop');
  await shot(page,`${id}-desktop-light-v4`);pass(`${id} theme/viewport`,'White/Dark/System × PC/Mobile');
}

async function filterChipEditor(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  let frame=await sandbox(page,'filter-chip-rail');await waitForFilterLive(frame);await clickSwitch(page,'data-kit-viewport','desktop');
  const root=frame.locator('#collectionFilters');
  assert(await root.count()===1,'real collection filter rail missing');
  assert(await frame.locator('.platform-kit-specimen').count()===0,'retired specimen board returned');
  assert(await root.evaluate(node=>node.dataset.platformScrollOwner==='photo-native'),'filter rail is not using photo-page native scroll owner');
  assert(await root.locator(':scope > .platform-filter-chip-indicator').evaluate(node=>getComputedStyle(node).display==='none'),'old in-rail liquid indicator is still visible');
  assert(await root.evaluate(node=>node.parentElement?.classList.contains('platform-filter-chip-stage')),'filter rail has no overlay stage');

  const tools=page.locator('.builder-kit-filter-items:not([hidden])');assert(await tools.count()===1,'filter item tools missing');
  const input=tools.locator('input');const familySelect=tools.locator('[data-filter-item-family]');assert(await familySelect.count()===1,'per-chip family selector missing');
  const before=await root.locator('.collection-filter').count();
  await input.fill('제품·브랜드 촬영');await input.press('Enter');
  await waitUntil(()=>root.locator('.collection-filter').count().then(n=>n===before+1),'sample chip insertion failed');
  const added=root.locator('.collection-filter').last();assert(await added.textContent()==='제품·브랜드 촬영','inserted chip text drifted');
  await added.click();
  await waitUntil(()=>familySelect.inputValue().then(v=>v==='inherit'),'new chip did not inherit global style');
  await familySelect.selectOption('ios-liquid');
  await waitUntil(()=>added.evaluate(node=>node.dataset.platformChipOverride==='ios-liquid'),'per-chip iOS Liquid override did not reach preview');

  await clickSwitch(page,'data-kit-mode','material-flat');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='material-flat'),'global Material family not applied');
  await waitUntil(()=>added.evaluate(node=>node.dataset.platformEffectiveFamily==='ios-liquid'),'individual chip override was overwritten by global family');
  const floater=frame.locator('.platform-filter-chip-stage > .platform-filter-chip-float');
  await waitUntil(()=>floater.evaluate(node=>node.dataset.family==='ios-liquid'&&getComputedStyle(node).display!=='none'),'liquid chip is not floating above the rail');
  const oldTransform=await floater.evaluate(node=>node.style.transform);
  const inheritChip=root.locator('.collection-filter').first();await inheritChip.click();
  await waitUntil(()=>floater.evaluate(node=>getComputedStyle(node).display==='none'),'Material inherited chip should not use liquid floater');

  await familySelect.selectOption('ios-liquid');
  await waitUntil(()=>inheritChip.evaluate(node=>node.dataset.platformChipOverride==='ios-liquid'),'selected chip individual family did not persist');
  await waitUntil(()=>floater.evaluate((node,old)=>getComputedStyle(node).display!=='none'&&node.style.transform!==old,oldTransform),'floating selector did not move with canonical spring layer');

  await openInspector(page);
  for(const id of ['gap','railPaddingTop','railPaddingRight','railPaddingBottom','railPaddingLeft','chipPaddingY','chipPaddingX'])assert(await page.locator(`[data-kit-control="${id}"]`).count()===1,`missing spacing control: ${id}`);
  await setInput(page,'[data-kit-control="gap"]',11);await setInput(page,'[data-kit-control="railPaddingTop"]',6);await setInput(page,'[data-kit-control="railPaddingRight"]',8);await setInput(page,'[data-kit-control="railPaddingBottom"]',7);await setInput(page,'[data-kit-control="railPaddingLeft"]',12);await setInput(page,'[data-kit-control="chipPaddingY"]',8);await setInput(page,'[data-kit-control="chipPaddingX"]',13);
  await waitUntil(()=>root.evaluate(node=>{const s=getComputedStyle(node),chip=node.querySelector('.collection-filter'),c=chip?getComputedStyle(chip):null;return s.gap==='11px'&&s.paddingTop==='6px'&&s.paddingRight==='8px'&&s.paddingBottom==='7px'&&s.paddingLeft==='12px'&&c?.paddingTop==='8px'&&c?.paddingLeft==='13px';}),'live rail/chip spacing failed');
  await page.locator('[data-kit-close]').click();

  await clickSwitch(page,'data-kit-mode','ios-liquid');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='ios-liquid'),'global iOS Liquid family not applied');
  const inherited=root.locator('.collection-filter').nth(1);await inherited.click();
  await waitUntil(()=>floater.evaluate(node=>node.dataset.family==='ios-liquid'&&getComputedStyle(node).display!=='none'),'inherited iOS Liquid selector missing');
  const filterSkin=await floater.locator('.v37-liquid-skin').evaluate(node=>({background:getComputedStyle(node).backgroundImage,shadow:getComputedStyle(node).boxShadow}));
  await shot(page,'filter-chip-floating-stage-v4');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'top-chapter-navigation');
  assert(await page.locator('#kitMode[hidden]').count()===1,'top nav still owns common chip family control');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='ios-liquid'),'global chip family did not propagate to top nav');
  const navSkin=await frame.locator('.nav-v33-indicator .v37-liquid-skin').evaluate(node=>({background:getComputedStyle(node).backgroundImage,shadow:getComputedStyle(node).boxShadow}));
  assert(navSkin.background===filterSkin.background&&navSkin.shadow===filterSkin.shadow,'filter/top-nav liquid skin parity lost');
  pass('filter chip editor','native rail + floating selector + per-chip inheritance override');
}

async function library(context){
  const ids=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?view=library`,{waitUntil:'domcontentloaded'});await page.evaluate(()=>localStorage.clear());
  for(const id of ids){
    await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${id}`,{waitUntil:'domcontentloaded'});const frame=await sandbox(page,id);await verifyMatrix(page,frame,id);
    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.nav-shell').count()===1,'nav missing');await openInspector(page);assert(await page.locator('[data-kit-control="chipFamily"]').count()===0,'legacy nav chip family control remains');await page.locator('[data-kit-control="progressMode"]').selectOption('line');await waitUntil(()=>frame.locator('.nav-chapter-progress').evaluate(node=>getComputedStyle(node).height==='2px'),'nav progress control failed');
    }
    if(id==='horizontal-card-rail'){
      await openInspector(page);await setInput(page,'[data-kit-control="rightContentPadding"]',150);await waitUntil(()=>frame.locator('.scroll-row').evaluate(node=>getComputedStyle(node).paddingRight==='150px'),'rail right padding failed');
    }
    if(id==='collection-bottom-sheet'){
      assert(await page.locator('[data-kit-state="all"][aria-pressed="true"]').count()===1,'bottom sheet did not enter in canonical 전체 state');
      await clickSwitch(page,'data-kit-state','settings');await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'bottom sheet settings tab failed');
    }
    if(id==='device-handoff-accordion'){
      const root=frame.locator('#sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]');assert(await root.locator('.collection-device-accordion').count()===1,'device accordion missing');assert(await root.locator('.collection-sheet,.collection-tabs').count()===0,'unrelated collection UI leaked into device preview');
    }
  }
  await filterChipEditor(page);await page.close();
}

async function builder(context){
  const page=await context.newPage();await page.setViewportSize({width:1920,height:1200});await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});const frame=await sandbox(page);
  await waitUntil(()=>frame.locator('.platform-builder-block-handle').count().then(n=>n>0),'builder chrome missing',16000);
  await frame.locator('[data-builder-capability="top-chapter-navigation"] > .platform-builder-gear').first().click({force:true});
  const topInspector=page.locator('.builder-inspector[data-inspector-id="top-chapter-navigation"]');await topInspector.waitFor({state:'visible'});assert(await topInspector.locator('[data-builder-control="chipFamily"],[data-builder-control="accentColor"]').count()===0,'page nav still owns common chip paint');await topInspector.locator('[data-close-inspector]').click();
  await frame.locator('[data-builder-capability="filter-chip-rail"] > .platform-builder-gear').first().click({force:true}).catch(()=>{});
  const filterInspector=page.locator('.builder-inspector[data-inspector-id="filter-chip-rail"]');
  if(await filterInspector.count()){
    await filterInspector.waitFor({state:'visible'});await filterInspector.locator('[data-builder-control="family"]').selectOption('material-flat');await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='material-flat'),'page global filter-chip family did not affect nav');
  }
  pass('page chip ownership','global component preset owns shared chip family');await page.close();
}

try{const context=await browser.newContext();await library(context);await builder(context);await context.close();report.status='pass';}
catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
