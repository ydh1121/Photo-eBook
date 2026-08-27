import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/canonical-admin-parity');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function wait(fn,message,timeout=20000){
  const started=Date.now();let last;
  while(Date.now()-started<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}
  if(last)throw last;throw new Error(message);
}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
function rgbDark(value){const match=String(value||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return Boolean(match)&&Math.max(...match.slice(1,4).map(Number))<90;}

async function openLibrary(page,module='screen-mode-selector'){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=${encodeURIComponent(module)}`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('.platform-admin-shell').count().then(Boolean),'admin shell missing');
  await wait(()=>page.locator(`[data-kit-ui="${module}"]`).count().then(Boolean),`module selector missing: ${module}`);
  if(await page.locator(`[data-kit-ui="${module}"]`).getAttribute('aria-pressed')!=='true')await page.locator(`[data-kit-ui="${module}"]`).click();
  await wait(()=>page.evaluate(id=>{const frame=document.querySelector('#builderFrame');const doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===id&&doc.querySelector(`[data-platform-module="${id}"]`));},module),`module frame missing: ${module}`);
}
async function selectModule(page,module){
  const button=page.locator(`[data-kit-ui="${module}"]`);assert(await button.count()===1,`module selector missing: ${module}`);
  if(await button.getAttribute('aria-pressed')!=='true')await button.click();
  await wait(()=>page.evaluate(id=>{const frame=document.querySelector('#builderFrame');const doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===id&&doc.querySelector(`[data-platform-module="${id}"]`));},module),`module frame missing: ${module}`);
  return page.frameLocator('#builderFrame');
}
async function liquidSignature(locator){
  return locator.evaluate(node=>{const style=getComputedStyle(node);return {backgroundImage:style.backgroundImage,borderRadius:style.borderRadius,boxShadow:style.boxShadow,transitionDuration:style.transitionDuration,transitionTimingFunction:style.transitionTimingFunction,transform:node.style.transform};});
}
async function relativeGeometry(frame,panelSelector,buttonSelector){
  return frame.locator(buttonSelector).evaluate((button,panelSelector)=>{const panel=button.closest(panelSelector)||button.ownerDocument.querySelector(panelSelector);const b=button.getBoundingClientRect(),p=panel.getBoundingClientRect();return {width:b.width,height:b.height,top:b.top-p.top,right:p.right-b.right};},panelSelector);
}
async function darkSurface(frame,selector,label){
  const locator=frame.locator(selector).first();assert(await locator.count()===1,`${label} missing`);
  const value=await locator.evaluate(node=>getComputedStyle(node).backgroundColor);
  assert(rgbDark(value),`${label} not dark: ${value}`);
  return value;
}

async function screenModeParity(page){
  await openLibrary(page,'screen-mode-selector');
  const frame=page.frameLocator('#builderFrame');
  const standalone=frame.locator('[data-platform-module="screen-mode-selector"]');
  const filter=standalone.locator('[data-platform-module="filter-chip-rail"]');
  const light=filter.locator('[data-platform-filter-id="light"]');
  const dark=filter.locator('[data-platform-filter-id="dark"]');
  const indicator=filter.locator('.collection-v33-indicator');
  await wait(()=>light.getAttribute('aria-pressed').then(value=>value==='true'),'standalone screen-mode filter active state missing');
  await wait(()=>indicator.count().then(Boolean),'standalone screen-mode liquid indicator missing');
  const provenance=await frame.locator('html').evaluate(()=>window.PlatformModuleRegistry?.provenance?.('screen-mode-selector'));
  assert(provenance?.consumers?.includes('public'),'screen-mode-selector is not approved for public consumer');
  assert(provenance?.dependencies?.some(item=>item.id==='filter-chip-rail'&&item.kind==='composition'&&item.required===true),'screen-mode-selector does not declare filter-chip-rail composition dependency');
  assert(await filter.count()===1,'screen mode did not render the canonical filter-chip dependency exactly once');
  const standaloneSignature=await liquidSignature(indicator);
  assert(/linear-gradient/i.test(standaloneSignature.backgroundImage),'standalone screen mode is not using the canonical liquid indicator skin');
  const before=standaloneSignature.transform;
  await dark.click();
  await wait(()=>standalone.evaluate(node=>node.dataset.screenMode==='dark'),'standalone screen mode dark selection failed');
  await wait(()=>indicator.evaluate((node,old)=>node.style.transform!==old,before),'screen-mode liquid indicator did not move');
  const moved=await liquidSignature(indicator);
  assert(moved.transitionDuration!=='0s','screen-mode liquid indicator has zero-duration motion');
  assert(moved.transitionTimingFunction.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'),'screen-mode did not inherit canonical Breeze overshoot');
  pass('screen mode dependency ownership',`screen-mode-selector → filter-chip-rail; ${provenance.consumers.join('/')}`);

  await selectModule(page,'collection-bottom-sheet');
  const collectionFrame=page.frameLocator('#builderFrame');
  await collectionFrame.locator('[data-library-tab="settings"]').click();
  const popupModule=collectionFrame.locator('[data-collection-screen-mode-slot] [data-platform-module="screen-mode-selector"]');
  await wait(()=>popupModule.count().then(Boolean),'canonical screen mode missing from collection settings',12000);
  const popupFilter=popupModule.locator('[data-platform-module="filter-chip-rail"]');
  const popupLight=popupFilter.locator('[data-platform-filter-id="light"]');
  const popupIndicator=popupFilter.locator('.collection-v33-indicator');
  await wait(()=>popupLight.getAttribute('aria-pressed').then(value=>value==='true'),'popup screen-mode filter active state missing');
  await wait(()=>popupIndicator.count().then(Boolean),'popup screen-mode liquid indicator missing');
  assert(await collectionFrame.locator('.collection-settings .theme-setting-card,.collection-settings [data-theme-setting-card]').count()===0,'legacy screen-mode lookalike remains inside popup settings');
  assert(await popupFilter.count()===1,'popup screen mode did not compose the canonical filter-chip dependency exactly once');
  const popupSignature=await liquidSignature(popupIndicator);
  for(const key of ['backgroundImage','borderRadius','boxShadow'])assert(popupSignature[key]===standaloneSignature[key],`screen mode popup/standalone liquid-owner mismatch: ${key}`);
  pass('screen mode popup/standalone parity','same screen module + same nested filter module + same liquid indicator owner');
  await shot(page,'screen-mode-popup-parity');
}

async function bottomSheetCloseParity(page){
  const collectionFrame=await selectModule(page,'collection-bottom-sheet');
  const collection=await relativeGeometry(collectionFrame,'.collection-sheet','#collectionClose');
  const genericFrame=await selectModule(page,'bottom-sheet');
  const generic=await relativeGeometry(genericFrame,'.platform-bottom-sheet__panel','.platform-bottom-sheet__head>button[data-bottom-sheet-close]');
  const close=(a,b,tolerance=1.05)=>Math.abs(a-b)<=tolerance;
  for(const key of ['width','height','top','right'])assert(close(generic[key],collection[key]),`generic close ${key} mismatch: ${generic[key]} vs ${collection[key]}`);
  assert(close(generic.width,42)&&close(generic.height,44),'generic close is not 42x44');
  pass('bottom sheet close parity',`generic ${generic.width.toFixed(1)}×${generic.height.toFixed(1)}, top ${generic.top.toFixed(1)}, right ${generic.right.toFixed(1)}`);
  await shot(page,'bottom-sheet-close-parity');
}

async function libraryActiveScope(page){
  await selectModule(page,'bottom-sheet');
  const selected=page.locator('[data-kit-ui="bottom-sheet"]');
  assert(await selected.getAttribute('aria-pressed')==='true','Library selection not retained before tool switch');
  const editorLink=page.locator('.platform-admin-shell__nav a[href="/editor-lab/"]');
  await editorLink.click();
  await wait(()=>page.locator('.platform-admin-workspace-host:not([hidden]) iframe').count().then(Boolean),'persistent editor workspace missing');
  assert(await selected.getAttribute('aria-pressed')==='true','Library state was destroyed instead of retained');
  const hiddenVisual=await selected.evaluate(node=>{const style=getComputedStyle(node);return {background:style.backgroundColor,shadow:style.boxShadow,color:style.color};});
  assert(hiddenVisual.background==='rgba(0, 0, 0, 0)'||hiddenVisual.background==='transparent',`Library selected visual still painted: ${hiddenVisual.background}`);
  assert(hiddenVisual.shadow==='none','Library selected shadow still painted outside Library');
  assert(await editorLink.getAttribute('aria-current')==='page','Editor major tool is not current');
  pass('Library active state scope','selection retained internally but visual active is hidden outside Library');
}

async function embeddedDarkAudit(page){
  const dark=page.locator('[data-admin-theme-value="dark"]');
  await dark.click();
  await wait(()=>page.locator('html').getAttribute('data-admin-theme-resolved').then(value=>value==='dark'),'parent admin dark theme failed');

  const routes=[
    {href:'/editor-lab/',name:'Editor',checks:[['.editor-library','editor library'],['.editor-workspace-head','editor workspace head'],['.editor-inspector','editor inspector'],['.editor-stage','editor stage'],['.editor-search','editor search']]},
    {href:'/block-lab/',name:'Block Lab',checks:[['.lab-sidebar','Block Lab sidebar'],['.lab-intro','Block Lab intro'],['.lab-specimen__head','Block Lab specimen head'],['.lab-specimen__stage','Block Lab stage surround']]},
    {href:'/qa/video-editor/',name:'QA',checks:[['.qa-toolbar','QA toolbar'],['.qa-stage','QA stage'],['.qa-footer','QA footer']]}
  ];
  for(const route of routes){
    await page.locator(`.platform-admin-shell__nav a[href="${route.href}"]`).click();
    const host=page.locator('.platform-admin-workspace-host:not([hidden])');
    await wait(()=>host.count().then(Boolean),`${route.name} workspace host missing`);
    const iframe=host.locator('iframe');
    await wait(()=>iframe.evaluate(frame=>frame.contentDocument?.documentElement?.dataset.adminThemeResolved==='dark'),`${route.name} embedded dark theme missing`,22000);
    const frame=iframe.contentFrame();
    const values=[];
    for(const [selector,label] of route.checks)values.push(await darkSurface(frame,selector,label));
    pass(`${route.name} embedded dark surfaces`,values.join(' / '));
    await shot(page,`${route.name.toLowerCase().replace(/\s+/g,'-')}-dark`);
  }
}

try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  await screenModeParity(page);
  await bottomSheetCloseParity(page);
  await libraryActiveScope(page);
  await embeddedDarkAudit(page);
  report.status='pass';
  console.log(`Canonical/admin parity OK: ${report.checks.length} focused checks passed.`);
  await context.close();
}catch(error){
  report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;
}finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
