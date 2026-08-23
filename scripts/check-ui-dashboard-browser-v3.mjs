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
async function waitForFilterSpecimens(frame){await waitUntil(()=>frame.locator('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]').evaluate(node=>node.dataset.specimenReady==='true'),'filter chip specimen board not ready',12000);}

const executablePath=browserPath();assert(executablePath,'Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});

async function verifyMatrix(page,frame,id){
  if(id==='filter-chip-rail')await waitForFilterSpecimens(frame);
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
  let frame=await sandbox(page,'filter-chip-rail');await waitForFilterSpecimens(frame);await clickSwitch(page,'data-kit-viewport','desktop');
  const chips=frame.locator('#collectionFilters .collection-filter');assert(await chips.count()>=4,'real bottom-sheet filter row missing');
  assert(await frame.locator('.platform-kit-specimen').count()>=4,'live UI kit specimen set missing');
  assert(await frame.locator('[data-specimen="실제 원본"] #collectionFilters').count()===1,'real bottom-sheet filter row is not the primary specimen');
  assert(await frame.locator('.platform-kit-specimen--narrow').count()===1,'narrow-width filter specimen missing');
  const shellBox=await page.locator('.builder-kit-frame-shell').evaluate(node=>({w:node.getBoundingClientRect().width,h:node.getBoundingClientRect().height}));
  assert(shellBox.w<=1060&&shellBox.h>=500&&shellBox.h<=540,`filter kit specimen workbench unexpected: ${shellBox.w}x${shellBox.h}`);
  const floor=await frame.evaluate(()=>getComputedStyle(document.body).backgroundColor);assert(floor==='rgb(244, 245, 247)',`filter kit still renders a white iframe plate: ${floor}`);

  /* Material: exact former top-nav rail values; inactive chips are transparent. */
  await clickSwitch(page,'data-kit-mode','material-flat');
  await waitUntil(()=>page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}')['filter-chip-rail'];return c?.family==='material-flat'&&c?.accentColor==='#437ce7'&&c?.blur===0&&c?.gap===9&&c?.runway===5.5;}),'Material canonical preset not persisted');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='material-flat'),'Material family not applied');
  const materialFilter=await frame.locator('#collectionFilters').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,shadow:s.boxShadow,backdrop:s.backdropFilter};});
  assert(materialFilter.background==='rgb(241, 243, 246)',`Material rail background drifted: ${materialFilter.background}`);
  assert(materialFilter.shadow==='none',`Material rail shadow drifted: ${materialFilter.shadow}`);
  assert(materialFilter.backdrop==='none',`Material rail backdrop drifted: ${materialFilter.backdrop}`);
  const materialInactive=await chips.nth(1).evaluate(node=>getComputedStyle(node).backgroundColor);assert(materialInactive==='rgba(0, 0, 0, 0)',`Material inactive chip is not transparent: ${materialInactive}`);
  await chips.nth(1).click();await waitUntil(()=>chips.nth(1).evaluate(node=>node.classList.contains('is-active')),'Material filter interaction missing');
  await openInspector(page);await setInput(page,'[data-kit-control="accentColor"]','#d9405f');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'top-chapter-navigation');
  assert(await page.locator('#kitMode[hidden]').count()===1,'top nav still owns chip representation control');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='material-flat'),'Material family did not propagate to top nav');
  const materialNav=await frame.locator('.nav-scroll').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,shadow:s.boxShadow,backdrop:s.backdropFilter};});
  assert(materialNav.background==='rgb(241, 243, 246)',`former Material nav background lost: ${materialNav.background}`);
  assert(materialNav.shadow==='none'&&materialNav.backdrop==='none','former Material nav surface lost');
  const topAccent=await frame.locator('.nav-chip.is-active').evaluate(node=>getComputedStyle(node).backgroundColor);assert(topAccent!=='rgba(0, 0, 0, 0)','Material top nav active chip did not receive global accent');

  /* iOS Flat: former nav rgba surface + 12px blur + exact shadow. */
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'filter-chip-rail');await waitForFilterSpecimens(frame);
  await clickSwitch(page,'data-kit-mode','ios-flat');
  await waitUntil(()=>page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}')['filter-chip-rail'];return c?.family==='ios-flat'&&c?.accentColor==='#437ce7'&&c?.surfaceOpacity===88&&c?.blur===12&&c?.gap===9&&c?.runway===5.5;}),'iOS Flat canonical preset not persisted');
  const iosFlatSurface=await frame.locator('#collectionFilters').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,backdrop:s.backdropFilter,shadow:s.boxShadow};});
  assert(iosFlatSurface.background==='rgba(244, 247, 251, 0.88)',`iOS Flat background drifted: ${iosFlatSurface.background}`);
  assert(iosFlatSurface.backdrop.includes('blur(12px)'),`iOS Flat blur drifted: ${iosFlatSurface.backdrop}`);
  assert(iosFlatSurface.shadow!=='none',`iOS Flat shadow missing`);
  const iosFlatInactive=await frame.locator('#collectionFilters .collection-filter').nth(1).evaluate(node=>getComputedStyle(node).backgroundColor);assert(iosFlatInactive==='rgba(0, 0, 0, 0)',`iOS Flat inactive chip is not transparent: ${iosFlatInactive}`);

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'top-chapter-navigation');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='ios-flat'),'iOS Flat family did not propagate to top nav');
  const iosFlatNav=await frame.locator('.nav-scroll').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundColor,backdrop:s.backdropFilter};});
  assert(iosFlatNav.background==='rgba(244, 247, 251, 0.88)'&&iosFlatNav.backdrop.includes('blur(12px)'),'former iOS Flat nav surface lost');

  /* iOS Liquid: production nav-corrections surface + v37 moving selector. */
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'filter-chip-rail');await waitForFilterSpecimens(frame);
  await clickSwitch(page,'data-kit-mode','ios-liquid');
  await waitUntil(()=>page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('platformBuilderCapabilityConfigsV2')||'{}')['filter-chip-rail'];return c?.family==='ios-liquid'&&c?.accentColor==='#437ce7'&&c?.blur===22&&c?.surfaceOpacity===100&&c?.response==='standard'&&c?.gap===9&&c?.runway===5.5;}),'iOS Liquid canonical preset not persisted');
  await waitUntil(()=>frame.evaluate(()=>document.documentElement.dataset.platformChipFamily==='ios-liquid'),'iOS Liquid global mode missing');
  const liquidRail=await frame.locator('#collectionFilters').evaluate(node=>{const s=getComputedStyle(node);return {radius:s.borderRadius,backdrop:s.backdropFilter,shadow:s.boxShadow};});
  assert(liquidRail.radius==='999px',`iOS Liquid rail radius drifted: ${liquidRail.radius}`);
  assert(liquidRail.backdrop.includes('blur(22px)')&&liquidRail.backdrop.includes('saturate(1.38)'),`iOS Liquid glass drifted: ${liquidRail.backdrop}`);
  assert(liquidRail.shadow!=='none','iOS Liquid canonical shadow missing');
  const liquidInactive=await frame.locator('#collectionFilters .collection-filter').nth(1).evaluate(node=>getComputedStyle(node).backgroundColor);assert(liquidInactive==='rgba(0, 0, 0, 0)',`iOS Liquid inactive chip is not transparent: ${liquidInactive}`);
  await waitUntil(()=>frame.locator('#collectionFilters').evaluate(node=>node.dataset.platformLiquidReady==='true'),'filter liquid indicator did not mount');
  const indicator=frame.locator('#collectionFilters > .platform-filter-chip-indicator');assert(await indicator.count()===1,'filter liquid indicator missing');
  const before=await indicator.evaluate(node=>node.style.transform);const liquidChips=frame.locator('#collectionFilters .collection-filter');await liquidChips.nth(2).click();
  await waitUntil(()=>indicator.evaluate((node,old)=>node.style.transform!==old,before),'canonical liquid indicator did not move with active chip');
  assert(await frame.locator('.platform-kit-specimen .platform-filter-chip-indicator').count()>=3,'liquid runtime did not reach specimen clones');
  const filterSkin=await indicator.locator('.v37-liquid-skin').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundImage,shadow:s.boxShadow};});
  await shot(page,'global-filter-chip-ios-liquid-canonical');

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'top-chapter-navigation');
  await waitUntil(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.builderFamily==='ios-liquid'),'iOS Liquid did not propagate to top nav');
  const liquidNav=await frame.locator('.nav-scroll').evaluate(node=>getComputedStyle(node).backdropFilter);assert(liquidNav.includes('blur(22px)')&&liquidNav.includes('saturate(1.38)'),`former iOS Liquid nav glass lost: ${liquidNav}`);
  assert(await frame.locator('.nav-v33-indicator .v37-liquid-skin').count()===1,'top nav liquid skin missing');
  const navSkin=await frame.locator('.nav-v33-indicator .v37-liquid-skin').evaluate(node=>{const s=getComputedStyle(node);return {background:s.backgroundImage,shadow:s.boxShadow};});
  assert(navSkin.background===filterSkin.background,`filter/nav liquid gradient mismatch\nfilter=${filterSkin.background}\nnav=${navSkin.background}`);
  assert(navSkin.shadow===filterSkin.shadow,`filter/nav liquid shadow mismatch\nfilter=${filterSkin.shadow}\nnav=${navSkin.shadow}`);

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=collection-bottom-sheet`,{waitUntil:'domcontentloaded'});frame=await sandbox(page,'collection-bottom-sheet');
  await waitUntil(()=>frame.locator('#collectionFilters').evaluate(node=>node.dataset.builderFamily==='ios-liquid'),'canonical chip family did not propagate to bottom sheet');
  pass('global chip canonical parity','former top-nav Material / iOS Flat / iOS Liquid surfaces and selector now own all common chips');
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
  await globalChipPropagation(page);await shot(page,'global-chip-top-nav-ios-liquid-canonical');await page.close();
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
