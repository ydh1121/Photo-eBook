import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/ui-dashboard-browser');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};

function assert(value,message){if(!value)throw new Error(message);}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitUntil(fn,message,timeout=12000){
  const start=Date.now();let last;
  while(Date.now()-start<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}
  if(last)throw last;throw new Error(message);
}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function sandbox(page,preview=''){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(()=>page.evaluate(previewId=>{
    const doc=document.querySelector('#builderFrame')?.contentDocument;
    if(!doc?.documentElement?.dataset?.builderSandbox)return false;
    return previewId?Boolean(doc.querySelector(`#sandboxPreviewRoot[data-preview-kind="${previewId}"]`)):Boolean(doc.querySelector('#app'));
  },preview),`sandbox not ready: ${preview||'page'}`,20000);
  const handle=await page.$('#builderFrame');const frame=await handle.contentFrame();assert(frame,'iframe missing');return frame;
}
async function clickSwitch(page,key,value){await page.locator(`[${key}="${value}"]`).click();}
async function setInput(page,selector,value){
  const node=page.locator(selector);await node.waitFor({state:'attached'});
  await node.evaluate((el,next)=>{el.value=String(next);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);
}
async function inspector(page){await page.locator('#kitSettings').click();await page.locator('.builder-kit-inspector:not([hidden])').waitFor({state:'visible'});}
async function legacyProgressSafe(frame){
  const count=await frame.locator('.read-progress').count();
  if(!count)return true;
  return frame.locator('.read-progress').evaluate(node=>getComputedStyle(node).display==='none');
}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function verifyMatrix(page,frame,id){
  for(const theme of ['light','dark','system']){
    await clickSwitch(page,'data-kit-theme',theme);
    await waitUntil(()=>page.evaluate(v=>document.querySelector('.builder-kit-workspace')?.dataset.themeChoice===v,theme),`${id}: theme ${theme}`);
    if(theme!=='system')await waitUntil(()=>frame.evaluate(v=>document.documentElement.dataset.theme===v,theme),`${id}: frame theme ${theme}`);
    else assert(['light','dark'].includes(await frame.evaluate(()=>document.documentElement.dataset.theme)),`${id}: system theme unresolved`);
    for(const viewport of ['desktop','mobile']){
      await clickSwitch(page,'data-kit-viewport',viewport);
      await waitUntil(()=>page.evaluate(v=>document.querySelector('.builder-kit-workspace')?.dataset.viewport===v,viewport),`${id}: viewport ${viewport}`);
      const width=await page.locator('.builder-kit-frame-shell').evaluate(node=>node.getBoundingClientRect().width);
      assert(viewport==='mobile'?width<=440:width>600,`${id}: unexpected ${viewport} width ${width}`);
    }
  }
  await clickSwitch(page,'data-kit-theme','light');await clickSwitch(page,'data-kit-viewport','desktop');await shot(page,`${id}-desktop-light`);
  await clickSwitch(page,'data-kit-theme','dark');await clickSwitch(page,'data-kit-viewport','mobile');await shot(page,`${id}-mobile-dark`);
  pass(`${id} theme/viewport`,'White/Dark/System × PC/Mobile');
}

async function library(context){
  const ids=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  for(const id of ids){
    await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${id}`,{waitUntil:'domcontentloaded'});
    const frame=await sandbox(page,id);await page.locator('.builder-kit-workspace').waitFor({state:'visible'});
    assert(await frame.locator(`#sandboxPreviewRoot[data-preview-kind="${id}"]`).count()===1,`${id}: preview root missing`);
    await verifyMatrix(page,frame,id);

    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.nav-shell').count()===1,'nav shell missing');
      assert(await legacyProgressSafe(frame),'legacy read-progress visible');
      assert(await frame.locator('[data-builder-capability="reading-progress"]').count()===0,'retired reading-progress capability exposed');
      await clickSwitch(page,'data-kit-viewport','desktop');await clickSwitch(page,'data-kit-mode','material-flat');
      await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='material-flat'),'nav material mode missing');
      const overflow=await frame.locator('.nav-scroll').evaluate(node=>getComputedStyle(node).overflowX);assert(['auto','scroll'].includes(overflow),`nav native scroll lost: ${overflow}`);
      await inspector(page);await page.locator('[data-kit-control="progressMode"]').selectOption('line');
      await waitUntil(()=>frame.locator('.nav-chapter-progress').evaluate(node=>getComputedStyle(node).height==='2px'),'nav line progress override missing');
      await page.locator('[data-kit-note]').fill('브라우저 QA 메모');await page.locator('[data-kit-save-note]').click();
      const note=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformBuilderNotesV1')||'{}')['top-chapter-navigation']);assert(note==='브라우저 QA 메모','UI kit note not saved');
      pass('top nav runtime','standalone progress ownership, native scroll, live control, note');
    }
    if(id==='horizontal-card-rail'){
      await clickSwitch(page,'data-kit-viewport','desktop');await inspector(page);
      await setInput(page,'[data-kit-control="rightContentPadding"]',150);
      await waitUntil(()=>frame.locator('.scroll-row').evaluate(node=>getComputedStyle(node).paddingRight==='150px'),'rail padding override missing');
      await page.locator('[data-kit-control="rightFade"]').uncheck();
      await waitUntil(()=>frame.locator('.desktop-rail-window').evaluate(node=>node.dataset.builderRightFade==='false'),'rail fade state missing');
      assert(await frame.locator('.desktop-rail-window').evaluate(node=>getComputedStyle(node,'::after').display)==='none','rail pseudo fade still visible');
      await page.locator('[data-kit-control="scrollbar"]').selectOption('auto');
      await waitUntil(()=>frame.locator('.scroll-row').evaluate(node=>['auto','scroll'].includes(getComputedStyle(node).overflowX)),'rail scrollbar auto missing');
      pass('horizontal rail controls','padding/fade/scrollbar');
    }
    if(id==='filter-chip-rail'){
      const chips=frame.locator('#collectionFilters .collection-filter');const count=await chips.count();assert(count>=4,`filter count ${count}`);
      await clickSwitch(page,'data-kit-mode','material-flat');await chips.nth(1).click();
      await waitUntil(()=>chips.nth(1).evaluate(node=>node.classList.contains('is-active')),'filter active state did not move');
      pass('filter chip source','real bottom-sheet filters and interaction');
    }
    if(id==='collection-bottom-sheet'){
      await clickSwitch(page,'data-kit-state','settings');
      await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'sheet settings state missing');
      await inspector(page);await page.locator('[data-kit-control="themeSelector"]').uncheck();await page.locator('[data-kit-control="deviceHandoff"]').uncheck();
      await waitUntil(()=>frame.locator('.theme-setting-card').evaluate(node=>node.hidden),'theme selector did not hide');
      await waitUntil(()=>frame.locator('.collection-device-accordion').evaluate(node=>node.hidden),'device handoff did not hide');
      await page.locator('[data-kit-reset]').click();
      await waitUntil(()=>frame.locator('.theme-setting-card').evaluate(node=>!node.hidden),'sheet reset did not restore');
      await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'sheet reset lost standalone state');
      pass('bottom sheet controls','state/visibility/reset sync');
    }
    if(id==='device-handoff-accordion'){
      const root=frame.locator('#sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]');
      assert(await root.locator('.collection-device-accordion').count()===1,'device accordion missing');assert(await root.locator('.collection-sheet,.collection-tabs').count()===0,'unrelated sheet UI leaked');
      await clickSwitch(page,'data-kit-state','expanded');await waitUntil(()=>root.locator('#collectionDeviceLink').evaluate(node=>node.getAttribute('aria-expanded')==='true'),'device expand missing');
      pass('device standalone','accordion only + expand');
    }
    if(id==='floating-action'){
      await clickSwitch(page,'data-kit-mode','flat');await inspector(page);await setInput(page,'[data-kit-control="accentColor"]','#ff3355');await page.locator('[data-kit-control="response"]').selectOption('lively');
      await waitUntil(()=>frame.locator('.collection-fab').evaluate(node=>node.dataset.builderFamily==='flat'),'FAB flat missing');await waitUntil(()=>frame.locator('.collection-fab').evaluate(node=>node.dataset.builderResponse==='lively'),'FAB response missing');
      assert(await frame.locator('.collection-fab').evaluate(node=>getComputedStyle(node).backgroundColor)!=='rgba(0, 0, 0, 0)','FAB accent transparent');pass('floating action controls','family/accent/response');
    }
  }
  await page.close();
}

async function builder(context){
  const page=await context.newPage();await page.setViewportSize({width:1920,height:1200});await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});let frame=await sandbox(page);
  assert(!frame.url().includes('/photography/'),'production photography loaded as builder canvas');await waitUntil(()=>frame.locator('.platform-builder-block-handle').count().then(n=>n>0),'builder chrome missing',16000);
  const nav=frame.locator('.nav-shell');assert(await nav.count()===1,'builder nav missing');assert(!(await nav.evaluate(node=>node.classList.contains('platform-builder-block'))),'nav draggable');assert((await nav.getAttribute('draggable'))!=='true','nav draggable attr');assert(await frame.locator('[data-builder-capability="reading-progress"]').count()===0,'retired reading progress owner exposed');
  await frame.locator('[data-builder-capability="top-chapter-navigation"] > .platform-builder-gear').first().click({force:true});await page.locator('.builder-inspector[data-inspector-id="top-chapter-navigation"]').waitFor({state:'visible'});assert(await page.locator('.builder-inspector[data-inspector-id="reading-progress"]').count()===0,'retired progress inspector opened');pass('page capability ownership','fixed nav + integrated progress');

  await page.locator('#builderOpenBlockPalette').click();await page.locator('#builderBlockPalette.is-open').waitFor({state:'visible'});await page.locator('[data-add-block-type="advertisement"]').click();await frame.locator('[data-builder-block-type="advertisement"]').waitFor({state:'attached'});await page.locator('#builderSaveLayout').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformBuilderLayoutV1')||'null'));assert(saved?.ids?.some(id=>String(id).startsWith('ad_')),'ad missing from draft layout');pass('block add/save','inline ad stored in draft');

  const resetMenu=page.locator('.builder-action-menu--end');if(!(await resetMenu.getAttribute('open')))await resetMenu.locator('summary').click();await Promise.all([page.waitForEvent('load'),page.locator('#builderResetPage').click()]);frame=await sandbox(page);
  const state=await page.evaluate(()=>['platformBuilderLayoutV1','platformBuilderCapabilityConfigsV1','platformBuilderCapabilityConfigsV2','platformBuilderSideAdsV1'].map(key=>localStorage.getItem(key)));assert(state.every(value=>value===null),'reset left canvas state');assert(await frame.locator('[data-builder-block-type="advertisement"]').count()===0,'reset left ad DOM');pass('dummy reset','canvas draft cleared');

  const adMenu=page.locator('.builder-action-menu').filter({has:page.locator('#builderAdLeft')});await adMenu.locator('summary').click();await page.locator('#builderAdLeft').click();await page.locator('.builder-ad-inspector[data-ad-inspector="left"]').waitFor({state:'visible'});await page.locator('.builder-ad-inspector[data-ad-inspector="left"] [data-ad-enable]').click();await waitUntil(()=>frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adEnabled==='true'),'left ad enabled state missing');
  assert(await frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adZoneActive)!=='true','left ad should stay hidden over hero anchor');
  await frame.locator('#dummy-content .section .content').evaluate(node=>{
    const top=node.getBoundingClientRect().top+window.scrollY;
    window.scrollTo({top:Math.max(0,top+140),behavior:'instant'});
  });
  await waitUntil(()=>frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adZoneActive==='true'),'left ad did not activate inside visible body zone',5000);pass('side ad','hidden on hero, active in visible content zone');await shot(page,'page-builder-desktop');

  await page.setViewportSize({width:390,height:844});await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});frame=await sandbox(page);await frame.locator('[data-builder-capability="top-chapter-navigation"]').first().click({force:true});await page.locator('.builder-inspector[data-inspector-id="top-chapter-navigation"].is-active').waitFor({state:'visible'});await waitUntil(()=>page.locator('#builderMobileDock').evaluate(node=>!node.hidden),'mobile inspector dock missing');pass('mobile inspector','tap opens inspector + dock');await shot(page,'page-builder-mobile');await page.close();
}

try{
  const context=await browser.newContext();await library(context);await builder(context);await context.close();report.status='pass';
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
