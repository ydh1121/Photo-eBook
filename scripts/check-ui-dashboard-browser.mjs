import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const ARTIFACT_DIR=path.resolve('artifacts/ui-dashboard-browser');
fs.mkdirSync(ARTIFACT_DIR,{recursive:true});

function assert(value,message){if(!value)throw new Error(message);}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitUntil(check,message,{timeout=12000,interval=80}={}){
  const started=Date.now();
  let lastError=null;
  while(Date.now()-started<timeout){
    try{if(await check())return;}catch(error){lastError=error;}
    await sleep(interval);
  }
  if(lastError)throw lastError;
  throw new Error(message);
}
function chromePath(){
  return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(file=>fs.existsSync(file));
}
async function frameFor(page,preview=''){
  await page.waitForSelector('#builderFrame',{timeout:15000});
  await waitUntil(async()=>page.evaluate(previewId=>{
    const iframe=document.querySelector('#builderFrame');
    const doc=iframe?.contentDocument;
    if(!doc?.documentElement?.dataset?.builderSandbox)return false;
    if(previewId)return Boolean(doc.querySelector(`#sandboxPreviewRoot[data-preview-kind="${previewId}"]`));
    return Boolean(doc.querySelector('#app'));
  },preview),`sandbox frame did not become ready: ${preview||'page'}`,{timeout:20000});
  const handle=await page.$('#builderFrame');
  const frame=await handle.contentFrame();
  assert(frame,'builder iframe frame handle missing');
  return frame;
}
async function setRange(page,selector,value){
  const locator=page.locator(selector);
  await locator.waitFor({state:'attached'});
  await locator.evaluate((node,next)=>{
    node.value=String(next);
    node.dispatchEvent(new Event('input',{bubbles:true}));
    node.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
}
async function setColor(page,selector,value){
  const locator=page.locator(selector);
  await locator.waitFor({state:'attached'});
  await locator.evaluate((node,next)=>{
    node.value=next;
    node.dispatchEvent(new Event('input',{bubbles:true}));
    node.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
}
async function kitClick(page,attribute,value){
  const selector=`[${attribute}="${value}"]`;
  await page.locator(selector).click();
}
async function saveShot(page,name){
  await page.screenshot({path:path.join(ARTIFACT_DIR,`${name}.png`),fullPage:true});
}
async function openKitInspector(page){
  await page.locator('#kitSettings').click();
  await page.locator('.builder-kit-inspector:not([hidden])').waitFor({state:'visible'});
}

const executablePath=chromePath();
assert(executablePath,'Chrome/Chromium executable not found on runner');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}

async function libraryMatrix(context){
  const components=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const page=await context.newPage();
  await page.setViewportSize({width:1440,height:1000});

  for(const id of components){
    await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${id}`,{waitUntil:'domcontentloaded'});
    let frame=await frameFor(page,id);
    await page.locator('.builder-kit-workspace').waitFor({state:'visible'});
    assert(await frame.locator(`#sandboxPreviewRoot[data-preview-kind="${id}"]`).count()===1,`${id}: standalone preview root missing`);

    for(const theme of ['light','dark','system']){
      await kitClick(page,'data-kit-theme',theme);
      await waitUntil(()=>page.evaluate(value=>document.querySelector('.builder-kit-workspace')?.dataset.themeChoice===value,theme),`${id}: theme choice ${theme} not applied`);
      if(theme==='light'||theme==='dark'){
        await waitUntil(()=>frame.evaluate(value=>document.documentElement.dataset.theme===value,theme),`${id}: iframe theme ${theme} not applied`);
      }else{
        const effective=await frame.evaluate(()=>document.documentElement.dataset.theme);
        assert(['light','dark'].includes(effective),`${id}: system theme did not resolve`);
      }
      for(const viewport of ['desktop','mobile']){
        await kitClick(page,'data-kit-viewport',viewport);
        await waitUntil(()=>page.evaluate(value=>document.querySelector('.builder-kit-workspace')?.dataset.viewport===value,viewport),`${id}: viewport ${viewport} not applied`);
        const width=await page.locator('.builder-kit-frame-shell').evaluate(node=>node.getBoundingClientRect().width);
        if(viewport==='mobile')assert(width<=440,`${id}: mobile preview width is ${width}`);
        else assert(width>600,`${id}: desktop preview width is ${width}`);
      }
    }

    await kitClick(page,'data-kit-theme','light');
    await kitClick(page,'data-kit-viewport','desktop');
    await saveShot(page,`${id}-desktop-light`);report.screenshots.push(`${id}-desktop-light.png`);
    await kitClick(page,'data-kit-theme','dark');
    await kitClick(page,'data-kit-viewport','mobile');
    await saveShot(page,`${id}-mobile-dark`);report.screenshots.push(`${id}-mobile-dark.png`);
    pass(`${id} theme/viewport matrix`,'3 themes × 2 viewport modes');

    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.nav-shell').count()===1,'top nav: nav shell missing');
      assert(await frame.locator('.read-progress').evaluate(node=>getComputedStyle(node).display)==='none','top nav: legacy read-progress visible');
      assert(await frame.locator('[data-builder-capability="reading-progress"]').count()===0,'top nav: retired reading-progress capability still exposed');
      await kitClick(page,'data-kit-viewport','desktop');
      await kitClick(page,'data-kit-mode','material-flat');
      await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='material-flat'),'top nav: Material mode not applied');
      const overflowX=await frame.locator('.nav-scroll').evaluate(node=>getComputedStyle(node).overflowX);
      assert(['auto','scroll'].includes(overflowX),`top nav: native horizontal scrolling lost (${overflowX})`);
      await openKitInspector(page);
      await page.locator('[data-kit-control="progressMode"]').selectOption('line');
      await waitUntil(()=>frame.locator('.nav-chapter-progress').evaluate(node=>getComputedStyle(node).height==='2px'),'top nav: line progress height not applied');
      await page.locator('[data-kit-note]').fill('브라우저 QA 메모');
      await page.locator('[data-kit-save-note]').click();
      const note=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformBuilderNotesV1')||'{}')['top-chapter-navigation']);
      assert(note==='브라우저 QA 메모','top nav: UI kit note not saved locally');
      pass('top nav runtime','legacy progress retired, Material/native scroll and note storage work');
    }

    if(id==='horizontal-card-rail'){
      await kitClick(page,'data-kit-viewport','desktop');
      await openKitInspector(page);
      await setRange(page,'[data-kit-control="rightContentPadding"]',150);
      await waitUntil(()=>frame.locator('.scroll-row').evaluate(node=>getComputedStyle(node).paddingRight==='150px'),'rail: right padding override did not win production CSS');
      await page.locator('[data-kit-control="rightFade"]').uncheck();
      await waitUntil(()=>frame.locator('.desktop-rail-window').evaluate(node=>node.dataset.builderRightFade==='false'),'rail: right fade state not applied');
      const afterDisplay=await frame.locator('.desktop-rail-window').evaluate(node=>getComputedStyle(node,'::after').display);
      assert(afterDisplay==='none',`rail: right fade pseudo layer still visible (${afterDisplay})`);
      await page.locator('[data-kit-control="scrollbar"]').selectOption('auto');
      await waitUntil(()=>frame.locator('.scroll-row').evaluate(node=>['auto','scroll'].includes(getComputedStyle(node).overflowX)),'rail: auto scrollbar did not restore horizontal overflow');
      pass('horizontal rail controls','right padding, fade and scrollbar applied in browser');
    }

    if(id==='filter-chip-rail'){
      const chips=frame.locator('#collectionFilters .collection-filter');
      assert(await chips.count()>=4,`filter chips: expected >=4 actual ${await chips.count()}`);
      await kitClick(page,'data-kit-mode','material-flat');
      await chips.nth(1).click();
      await waitUntil(()=>chips.nth(1).evaluate(node=>node.classList.contains('is-active')),'filter chips: click state did not move');
      pass('filter chip source','actual bottom-sheet filter DOM and click state work');
    }

    if(id==='collection-bottom-sheet'){
      await kitClick(page,'data-kit-state','settings');
      await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'sheet: settings state not applied');
      await openKitInspector(page);
      await page.locator('[data-kit-control="themeSelector"]').uncheck();
      await page.locator('[data-kit-control="deviceHandoff"]').uncheck();
      await waitUntil(()=>frame.locator('.theme-setting-card').evaluate(node=>node.hidden),'sheet: theme selector did not hide');
      await waitUntil(()=>frame.locator('.collection-device-accordion').evaluate(node=>node.hidden),'sheet: device accordion did not hide');
      await page.locator('[data-kit-reset]').click();
      await waitUntil(()=>frame.locator('.theme-setting-card').evaluate(node=>!node.hidden),'sheet: reset did not restore theme selector');
      await waitUntil(()=>frame.locator('.collection-tab[data-library-tab="settings"]').evaluate(node=>node.classList.contains('is-active')),'sheet: reset lost selected standalone state');
      pass('bottom sheet controls','state and visibility reset stay synchronized');
    }

    if(id==='device-handoff-accordion'){
      const root=frame.locator('#sandboxPreviewRoot[data-preview-kind="device-handoff-accordion"]');
      assert(await root.locator('.collection-device-accordion').count()===1,'device: accordion missing');
      assert(await root.locator('.collection-sheet,.collection-tabs').count()===0,'device: unrelated collection UI leaked into standalone preview');
      await kitClick(page,'data-kit-state','expanded');
      await waitUntil(()=>root.locator('#collectionDeviceLink').evaluate(node=>node.getAttribute('aria-expanded')==='true'),'device: expanded state not applied');
      pass('device standalone','only accordion remains and expansion works');
    }

    if(id==='floating-action'){
      await kitClick(page,'data-kit-mode','flat');
      await openKitInspector(page);
      await setColor(page,'[data-kit-control="accentColor"]','#ff3355');
      await page.locator('[data-kit-control="response"]').selectOption('lively');
      await waitUntil(()=>frame.locator('.collection-fab').evaluate(node=>node.dataset.builderFamily==='flat'),'FAB: flat family not applied');
      await waitUntil(()=>frame.locator('.collection-fab').evaluate(node=>node.dataset.builderResponse==='lively'),'FAB: lively response not applied');
      const background=await frame.locator('.collection-fab').evaluate(node=>getComputedStyle(node).backgroundColor);
      assert(background!=='rgba(0, 0, 0, 0)',`FAB: accent paint is transparent (${background})`);
      pass('floating action controls','family, accent and response apply');
    }
  }
  await page.close();
}

async function pageBuilder(context){
  const page=await context.newPage();
  await page.setViewportSize({width:1920,height:1200});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  let frame=await frameFor(page);
  assert(!frame.url().includes('/photography/'),'builder loaded production photography route');
  await waitUntil(()=>frame.locator('.platform-builder-block-handle').count().then(count=>count>0),'page builder chrome did not mount',{timeout:16000});

  const nav=frame.locator('.nav-shell');
  assert(await nav.count()===1,'page builder nav missing');
  assert(!(await nav.evaluate(node=>node.classList.contains('platform-builder-block'))),'fixed nav is still a draggable block');
  assert((await nav.getAttribute('draggable'))!=='true','fixed nav is draggable');
  assert(await frame.locator('[data-builder-capability="reading-progress"]').count()===0,'page mode exposes retired reading-progress capability');

  const topGear=frame.locator('[data-builder-capability="top-chapter-navigation"] > .platform-builder-gear').first();
  await topGear.click({force:true});
  await page.locator('.builder-inspector[data-inspector-id="top-chapter-navigation"]').waitFor({state:'visible'});
  assert(await page.locator('.builder-inspector[data-inspector-id="reading-progress"]').count()===0,'retired reading-progress inspector opened');
  pass('page capability ownership','nav fixed and reading progress stays inside nav owner');

  await page.locator('#builderOpenBlockPalette').click();
  await page.locator('#builderBlockPalette.is-open').waitFor({state:'visible'});
  await page.locator('[data-add-block-type="advertisement"]').click();
  await frame.locator('[data-builder-block-type="advertisement"]').waitFor({state:'attached'});
  await page.locator('#builderSaveLayout').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformBuilderLayoutV1')||'null'));
  assert(saved?.ids?.some(id=>String(id).startsWith('ad_')),'inline advertisement not included in saved layout');
  pass('block add/save','advertisement joins draft block order');

  const resetMenu=page.locator('.builder-action-menu--end');
  if(!(await resetMenu.getAttribute('open')))await resetMenu.locator('summary').click();
  await Promise.all([
    page.waitForEvent('load'),
    page.locator('#builderResetPage').click()
  ]);
  frame=await frameFor(page);
  const resetState=await page.evaluate(()=>({
    layout:localStorage.getItem('platformBuilderLayoutV1'),
    v1:localStorage.getItem('platformBuilderCapabilityConfigsV1'),
    v2:localStorage.getItem('platformBuilderCapabilityConfigsV2'),
    ads:localStorage.getItem('platformBuilderSideAdsV1')
  }));
  assert(Object.values(resetState).every(value=>value===null),'dummy reset left canvas state behind');
  assert(await frame.locator('[data-builder-block-type="advertisement"]').count()===0,'dummy reset left inline advertisement in DOM');
  pass('dummy reset','layout, UI overrides and ad config cleared');

  const adMenu=page.locator('.builder-action-menu').filter({has:page.locator('#builderAdLeft')});
  await adMenu.locator('summary').click();
  await page.locator('#builderAdLeft').click();
  await page.locator('.builder-ad-inspector[data-ad-inspector="left"]').waitFor({state:'visible'});
  await page.locator('.builder-ad-inspector[data-ad-inspector="left"] [data-ad-enable]').click();
  await waitUntil(()=>frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adEnabled==='true'),'left ad enabled state not mirrored to sandbox');
  await frame.locator('#dummy-content .section .content').scrollIntoViewIfNeeded();
  await sleep(300);
  const zone=await frame.locator('[data-builder-ad-slot="left"]').evaluate(node=>node.dataset.adZoneActive);
  assert(zone==='true',`left ad not active in visible body zone (${zone})`);
  pass('side advertisement','enabled ad is constrained to visible content zone');
  await saveShot(page,'page-builder-desktop');report.screenshots.push('page-builder-desktop.png');

  await page.setViewportSize({width:390,height:844});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  frame=await frameFor(page);
  const mobileTarget=frame.locator('[data-builder-capability="top-chapter-navigation"]').first();
  await mobileTarget.click({force:true});
  await page.locator('.builder-inspector[data-inspector-id="top-chapter-navigation"].is-active').waitFor({state:'visible'});
  await waitUntil(()=>page.locator('#builderMobileDock').evaluate(node=>!node.hidden),'mobile inspector dock did not open');
  pass('mobile inspector','tap opens bottom inspector and dock without hover dependency');
  await saveShot(page,'page-builder-mobile');report.screenshots.push('page-builder-mobile.png');
  await page.close();
}

try{
  const context=await browser.newContext();
  await libraryMatrix(context);
  await pageBuilder(context);
  await context.close();
  report.status='pass';
}catch(error){
  report.status='fail';
  report.error=error?.stack||String(error);
  console.error(report.error);
  process.exitCode=1;
}finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(ARTIFACT_DIR,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
}
