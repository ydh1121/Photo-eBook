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
async function waitForFilterLive(frame){await waitUntil(()=>frame.locator('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]').evaluate(node=>node.dataset.liveReady==='true'),'single filter chip rail not ready',12000);}

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
  await clickSwitch(page,'data-kit-theme','light');await clickSwitch(page,'data-kit-viewport','desktop');await shot(page,`${id}-desktop-light`);
  pass(`${id} theme/viewport`,'White/Dark/System × PC/Mobile');
}

async function filterChipLiveEditor(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  let frame=await sandbox(page,'filter-chip-rail');await waitForFilterLive(frame);await clickSwitch(page,'data-kit-viewport','desktop');
  const root=frame.locator('#collectionFilters');
  assert(await root.count()===1,'real bottom-sheet filter row missing');
  assert(await frame.locator('.platform-kit-specimen').count()===0,'retired four-card specimen board still rendered');
  assert(await frame.locator('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"] > #collectionFilters').count()===1,'filter rail is not the single direct live preview');
  const shellBox=await page.locator('.builder-kit-frame-shell').evaluate(node=>({w:node.getBoundingClientRect().width,h:node.getBoundingClientRect().height}));
  assert(shellBox.w<=940&&shellBox.h>=280&&shellBox.h<=320,`single filter rail workbench unexpected: ${shellBox.w}x${shellBox.h}`);
  assert(await page.locator('.builder-kit-filter-items:not([hidden])').count()===1,'sample chip editor missing');
  assert((await page.locator('#kitSettings').textContent())?.includes('여백'),'filter settings entry is not spacing-first');

  const input=page.locator('.builder-kit-filter-items input');
  const beforeCount=await root.locator('.collection-filter').count();
  await input.fill('제품·브랜드 촬영');await input.press('Enter');
  await waitUntil(()=>root.locator('.collection-filter').count().then(n=>n===beforeCount+1),'sample chip add did not update live rail');
  assert(await root.locator('.collection-filter').last().textContent()==='제품·브랜드 촬영','added sample chip label drifted');

  await openInspector(page);
  for(const id of ['gap','railPaddingTop','railPaddingRight','railPaddingBottom','railPaddingLeft','chipPaddingY','chipPaddingX'])assert(await page.locator(`[data-kit-control="${id}"]`).count()===1,`missing live spacing control: ${id}`);
  assert(await page.locator('[data-kit-control="runway"]').count()===0,'retired combined runway control remains');
  await setInput(page,'[data-kit-control="gap"]',11);
  await setInput(page,'[data-kit-control="railPaddingTop"]',6);
  await setInput(page,'[data-kit-control="railPaddingRight"]',8);
  await setInput(page,'[data-kit-control="railPaddingBottom"]',7);
  await setInput(page,'[data-kit-control="railPaddingLeft"]',12);
  await setInput(page,'[data-kit-control="chipPaddingY"]',8);
  await setInput(page,'[data-kit-control="chipPaddingX"]',13);
  await waitUntil(()=>root.evaluate(node=>{const s=getComputedStyle(node);const chip=node.querySelector('.collection-filter');const c=chip?getComputedStyle(chip):null;return s.gap==='11px'&&s.paddingTop==='6px'&&s.paddingRight==='8px'&&s.paddingBottom==='7px'&&s.paddingLeft==='12px'&&c?.paddingTop==='8px'&&c?.paddingLeft==='13px';}),'four-side rail/chip spacing did not update live');
  await page.locator('[data-kit-close]').click();

  await clickSwitch(page,'data-kit-mode','material-flat');
  await waitUntil(()=>page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}')['filter-chip-rail'];return c?.family==='material-flat'&&c?.gap===11&&c?.railPaddingTop===6&&c?.railPaddingRight===8&&c?.railPaddingBottom===7&&c?.railPaddingLeft===12;}),'style switch overwrote tuned geometry');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='material-flat'),'Material family not applied');
  const material=await root.evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,shadow:s.boxShadow,backdrop:s.backdropFilter};});
  assert(material.background==='rgb(241, 243, 246)'&&material.shadow==='none'&&material.backdrop==='none','Material surface parity lost');

  for(const label of ['상업 제품 상세페이지 촬영','브랜드 캠페인 인물 프로필 촬영','음식 메뉴와 매장 공간 촬영','SNS 숏폼 콘텐츠 촬영','행사와 기업 인터뷰 촬영','추가 테스트 메뉴']){
    await input.fill(label);await input.press('Enter');
  }
  await waitUntil(()=>root.evaluate(node=>node.scrollWidth>node.clientWidth+120),'sample chips did not create a horizontal overflow case');
  const momentum=await frame.evaluate(async()=>{
    const root=document.querySelector('#collectionFilters');if(!root)return null;
    root.scrollLeft=0;
    const emit=(type,x)=>root.dispatchEvent(new PointerEvent(type,{pointerId:91,pointerType:'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:20,bubbles:true,cancelable:true}));
    emit('pointerdown',420);
    for(const x of [400,380,360,340,320]){await new Promise(resolve=>setTimeout(resolve,18));emit('pointermove',x);}
    emit('pointerup',320);
    const released=root.scrollLeft;
    await new Promise(resolve=>setTimeout(resolve,220));
    return {released,after:root.scrollLeft};
  });
  assert(momentum&&momentum.released>20&&momentum.after>momentum.released+1,`filter rail inertia missing: ${JSON.stringify(momentum)}`);

  await clickSwitch(page,'data-kit-mode','ios-liquid');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='ios-liquid'),'iOS Liquid family not applied');
  await waitUntil(()=>root.evaluate(node=>node.dataset.platformLiquidReady==='true'),'liquid selector did not mount');
  const indicator=root.locator(':scope > .platform-filter-chip-indicator');assert(await indicator.count()===1,'liquid selector missing');
  const liquidChips=root.locator('.collection-filter');const before=await indicator.evaluate(node=>node.style.transform);await liquidChips.nth(2).click();
  await waitUntil(()=>indicator.evaluate((node,old)=>node.style.transform!==old,before),'liquid selector did not move');
  const filterSkin=await indicator.locator('.v37-liquid-skin').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundImage,shadow:s.boxShadow};});
  await shot(page,'filter-chip-single-live-rail');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'top-chapter-navigation');
  assert(await page.locator('#kitMode[hidden]').count()===1,'top nav still owns chip representation control');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='ios-liquid'),'global chip style did not propagate to top nav');
  const navSkin=await frame.locator('.nav-v33-indicator .v37-liquid-skin').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundImage,shadow:s.boxShadow};});
  assert(navSkin.background===filterSkin.background&&navSkin.shadow===filterSkin.shadow,'filter/nav liquid skin parity lost');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=collection-bottom-sheet`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('#collectionFilters').evaluate(node=>node.dataset.builderFamily==='ios-liquid'),'global chip family did not propagate to bottom sheet');
  pass('filter chip live editor','single real rail, sample insertion, four-side spacing and mouse inertia');
}

async function library(context){
  const ids=['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
  const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/?view=library`,{waitUntil:'domcontentloaded'});await page.evaluate(()=>localStorage.clear());
  for(const id of ids){
    await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${id}`,{waitUntil:'domcontentloaded'});const frame=await sandbox(page,id);await verifyMatrix(page,frame,id);
    if(id==='top-chapter-navigation'){
      assert(await frame.locator('.nav-shell').count()===1,'nav missing');
      await openInspector(page);assert(await page.locator('[data-kit-control="chipFamily"]').count()===0,'legacy top-nav chipFamily control remains');await page.locator('[data-kit-control="progressMode"]').selectOption('line');await waitUntil(()=>frame.locator('.nav-chapter-progress').evaluate(node=>getComputedStyle(node).height==='2px'),'nav progress live control missing');
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
  await filterChipLiveEditor(page);await page.close();
}

async function builder(context){
  const page=await context.newPage();await page.setViewportSize({width:1920,height:1200});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});const frame=await sandbox(page);
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
