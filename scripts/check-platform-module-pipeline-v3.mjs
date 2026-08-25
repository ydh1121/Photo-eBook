import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/platform-module-pipeline');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
async function wait(fn,message,timeout=30000){const started=Date.now();let last;while(Date.now()-started<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(100);}if(last)throw last;throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function css(locator,names){return locator.evaluate((node,props)=>{const style=getComputedStyle(node);return Object.fromEntries(props.map(name=>[name,style[name]]));},names);}
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function moduleFrame(page,id){
  await page.locator(`[data-kit-ui="${id}"]`).click();
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame');const doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));},id),`Library module missing: ${id}`);
  return page.frameLocator('#builderFrame');
}

async function openInspector(page){
  if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;
  await page.locator('#kitSettings').click();
  await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'inspector did not open');
}

async function setControl(page,id,value){
  await openInspector(page);
  const control=page.locator(`[data-style-control="${id}"]`);
  assert(await control.count()===1,`missing style control: ${id}`);
  const type=await control.getAttribute('type');
  if(type==='checkbox'){
    if(Boolean(value)!==await control.isChecked())await control.click();
  }else if(await control.evaluate(node=>node.tagName==='SELECT')){
    await control.selectOption(String(value));
  }else{
    await control.evaluate((node,next)=>{node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);
  }
  await sleep(220);
}

async function library(context){
  const page=await context.newPage();
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/ui-dashboard/`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length)),'Library init failed');

  let frame=await moduleFrame(page,'top-chapter-navigation');
  await openInspector(page);
  for(const id of ['fontFamily','fontSize','fontWeight','letterSpacing'])assert(await page.locator(`[data-style-control="${id}"]`).count()===1,`top-nav typography control missing: ${id}`);
  const navChip=frame.locator('.nav-chip').first();
  const beforeNav=await css(navChip,['fontSize','fontWeight','letterSpacing']);
  await setControl(page,'fontSize',18);
  await setControl(page,'fontWeight',740);
  await setControl(page,'letterSpacing',0.2);
  const afterNav=await css(navChip,['fontSize','fontWeight','letterSpacing']);
  assert(afterNav.fontSize!==beforeNav.fontSize&&afterNav.fontSize==='18px','top-nav font size is a no-op');
  assert(Number(afterNav.fontWeight)>=700,'top-nav font weight is a no-op');
  assert(afterNav.letterSpacing!==beforeNav.letterSpacing,'top-nav letter spacing is a no-op');
  await setControl(page,'progressEnabled',false);
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.moduleProgressEnabled==='false'),'top-nav progress toggle is a no-op');
  await setControl(page,'progressEnabled',true);
  await setControl(page,'progressMode','line');
  assert(await frame.locator('.nav-scroll').evaluate(node=>node.dataset.moduleProgressMode==='line'),'top-nav progress mode is a no-op');
  await page.locator('[data-style-reset]').click();
  await page.locator('[data-kit-close]').click();

  frame=await moduleFrame(page,'filter-chip-rail');
  await openInspector(page);
  const family=page.locator('[data-style-control="family"]');
  const options=await family.locator('option').evaluateAll(nodes=>nodes.map(node=>node.value));
  assert(JSON.stringify(options)===JSON.stringify(['ios-liquid','ios-flat','material-flat']),'filter family list mismatch');
  for(const id of ['fontFamily','fontSize','fontWeight','letterSpacing'])assert(await page.locator(`[data-style-control="${id}"]`).count()===1,`filter typography control missing: ${id}`);

  const module=frame.locator('.platform-filter-chip-module[data-platform-module="filter-chip-rail"]');
  const liquid=frame.locator('.platform-filter-chip-source--liquid');
  const iosFlat=frame.locator('.platform-filter-chip-source--ios-flat');
  const material=frame.locator('.platform-filter-chip-source--material-flat');
  assert(!(await liquid.isHidden())&&await iosFlat.isHidden()&&await material.isHidden(),'liquid default family mismatch');

  await family.selectOption('ios-flat');await sleep(260);
  assert(await liquid.isHidden()&&!(await iosFlat.isHidden())&&await material.isHidden(),'iOS Flat did not switch to real runtime source');
  const flatActive=iosFlat.locator('[data-platform-filter-id]').first();
  const flatStyle=await css(flatActive,['backgroundColor','color','borderRadius','boxShadow']);
  assert(flatStyle.borderRadius!=='0px'&&flatStyle.backgroundColor!=='rgba(0, 0, 0, 0)','iOS Flat design did not apply');

  await family.selectOption('material-flat');await sleep(260);
  assert(await liquid.isHidden()&&await iosFlat.isHidden()&&!(await material.isHidden()),'Material did not switch to real runtime source');
  const materialButtons=material.locator('[data-platform-filter-id]');
  const materialFirst=await css(materialButtons.first(),['backgroundColor','borderRadius','borderColor']);
  assert(materialFirst.borderRadius!=='0px'&&materialFirst.borderColor!=='rgba(0, 0, 0, 0)','Material design did not apply');
  await materialButtons.nth(1).click();await sleep(160);
  assert(await module.evaluate(node=>node.dataset.platformFilterValue==='filter-1'),'filter interaction did not update reusable module state');
  assert(await materialButtons.nth(1).getAttribute('aria-pressed')==='true','filter interaction did not update ARIA state');

  await setControl(page,'fontSize',17);
  await setControl(page,'fontWeight',760);
  const filterText=await css(materialButtons.nth(1),['fontSize','fontWeight']);
  assert(filterText.fontSize==='17px'&&Number(filterText.fontWeight)>=700,'filter typography settings are a no-op');
  await setControl(page,'accentColor','#8b5cf6');
  assert((await module.evaluate(node=>getComputedStyle(node).getPropertyValue('--platform-filter-accent').trim())).toLowerCase()==='#8b5cf6','filter accent setting is a no-op');

  await page.locator('[data-menu-add]').click();
  const menuInputs=page.locator('[data-menu-label]');
  await menuInputs.last().fill('기업 촬영');await menuInputs.last().press('Tab');
  await wait(()=>material.locator('[data-platform-filter-id]').count().then(count=>count===5),'filter menu addition did not reach canonical runtime');

  frame=await moduleFrame(page,'horizontal-card-rail');
  await openInspector(page);
  await setControl(page,'scrollbar','auto');
  const rail=frame.locator('.scroll-row[data-platform-module="horizontal-card-rail"]');
  assert(await rail.evaluate(node=>node.dataset.moduleScrollbar==='auto'),'card scrollbar setting is a no-op');
  await setControl(page,'leftFade',true);
  const mask=await rail.evaluate(node=>node.style.maskImage||node.style.webkitMaskImage);
  assert(mask.includes('transparent'),'card left fade setting is a no-op');
  await page.locator('[data-style-reset]').click();await page.locator('[data-kit-close]').click();

  frame=await moduleFrame(page,'collection-bottom-sheet');
  await openInspector(page);
  await page.locator('[data-inspector-state="settings"]').click();await sleep(250);
  await setControl(page,'themeSelector',false);
  await wait(()=>frame.locator('.theme-setting-card').count().then(async count=>count===0||await frame.locator('.theme-setting-card').isHidden()),'bottom-sheet themeSelector setting is a no-op');
  await setControl(page,'themeSelector',true);
  await page.locator('[data-style-reset]').click();await page.locator('[data-kit-close]').click();

  await shot(page,'library-setting-contract');
  await page.close();
  pass('UI Library settings','typography, filter families, card controls and sheet controls affect canonical nodes');
}

async function editor(context){
  const page=await context.newPage();
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('platformEditorLabDraftV1'));
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-add-module="filter-chip-rail"]').count().then(count=>count===1),'Editor filter module missing');
  await page.locator('[data-add-module="filter-chip-rail"]').click();
  await wait(()=>page.evaluate(()=>document.querySelector('[data-platform-editor-module-frame="filter-chip-rail"]')?.contentDocument?.querySelector('[data-platform-module="filter-chip-rail"]')!=null),'Editor canonical filter missing');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformEditorLabDraftV1')||'{}'));
  const block=draft?.blocks?.find(item=>item.type==='ui-module'&&item.variant==='filter-chip-rail');
  assert(block,'Editor did not persist filter as ui-module');
  assert(block.styleOverrides?.family==='material-flat','Editor did not snapshot Library filter family default');
  assert(Number(block.styleOverrides?.fontSize)===17,'Editor did not snapshot Library typography default');
  const frame=page.frameLocator('[data-platform-editor-module-frame="filter-chip-rail"]');
  await wait(()=>frame.locator('.platform-filter-chip-source--material-flat:not([hidden])').count().then(Boolean),'Editor did not render snapshotted Material family');
  const button=frame.locator('.platform-filter-chip-source--material-flat [data-platform-filter-id]').nth(1);
  await page.locator('[data-editor-mode="preview"]').click();
  await wait(()=>page.locator('.editor-lab').evaluate(node=>node.dataset.mode==='preview'),'Editor preview mode did not activate');
  await button.click();
  assert(await button.getAttribute('aria-pressed')==='true','Editor module interaction is not live');
  await shot(page,'editor-runtime-module-contract');
  await page.close();
  pass('Block Editor','new instance snapshots Library defaults and keeps live canonical interaction');
}

try{
  const context=await browser.newContext();
  await library(context);
  await editor(context);
  await context.close();
  report.status='pass';
}catch(error){
  report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;
}finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
}