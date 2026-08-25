import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/library-setting-runtime-exhaustive');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],controls:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function wait(fn,message,timeout=15000){const started=Date.now();let last;while(Date.now()-started<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
function controlPass(moduleId,id,detail=''){report.controls.push({moduleId,id,status:'pass',detail});console.log(`  ✓ ${moduleId}.${id}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function computed(locator,property){return locator.evaluate((node,key)=>getComputedStyle(node)[key],property);}

async function openLibrary(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibraryThemeV3','platformLibraryViewportV3'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="top-chapter-navigation"]').count().then(Boolean),'Library selector missing');
  assert(await page.locator('[data-kit-ui="reading-progress"]').count()===0,'retired reading-progress exposed as Library module');
  pass('reading-progress ownership','not exposed as standalone Library module');
}

async function moduleFrame(page,id){
  const selector=page.locator(`[data-kit-ui="${id}"]`);assert(await selector.count()===1,`Library selector missing: ${id}`);await selector.click();
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`main [data-platform-module="${moduleId}"]`));},id),`canonical module frame missing: ${id}`,20000);
  return page.frameLocator('#builderFrame');
}
async function openInspector(page){if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'inspector did not open');}
async function setControl(page,moduleId,id,value){
  await openInspector(page);const control=page.locator(`[data-style-control="${id}"]`);assert(await control.count()===1,`${moduleId}.${id}: visible control missing`);assert(!(await control.isDisabled()),`${moduleId}.${id}: unexpectedly disabled`);
  const tag=await control.evaluate(node=>node.tagName),type=await control.getAttribute('type');
  if(type==='checkbox'){if(Boolean(value)!==await control.isChecked())await control.click();}
  else if(tag==='SELECT')await control.selectOption(String(value));
  else await control.evaluate((node,next)=>{node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);
  await sleep(180);
}
async function assertLocked(page,moduleId,id){await openInspector(page);const control=page.locator(`[data-style-control="${id}"]`);assert(await control.count()===1,`${moduleId}.${id}: locked control missing`);assert(await control.isDisabled(),`${moduleId}.${id}: locked control is editable`);controlPass(moduleId,id,'locked/disabled');}
async function resetStyle(page){await openInspector(page);await page.locator('[data-style-reset]').click();await sleep(180);}
async function setViewport(page,value){const button=page.locator(`[data-kit-viewport="${value}"]`);if(await button.getAttribute('aria-pressed')!=='true')await button.click();await wait(()=>page.locator('.builder-kit-workspace').evaluate((node,v)=>node.dataset.viewport===v,value),`viewport did not become ${value}`);await sleep(150);}

async function topNav(page){
  const id='top-chapter-navigation',frame=await moduleFrame(page,id);await openInspector(page);const shell=frame.locator('.nav-shell'),rail=frame.locator('.nav-scroll'),chip=frame.locator('.nav-chip').first();
  assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('iOS 리퀴드'),'top-nav selector default family label missing');
  await setControl(page,id,'enabled',false);assert(await shell.evaluate(node=>node.hidden),'enabled=false did not hide nav');controlPass(id,'enabled','shell.hidden');await setControl(page,id,'enabled',true);
  await setControl(page,id,'stickyMode','static');assert(await computed(shell,'position')==='relative','stickyMode is visually overridden');controlPass(id,'stickyMode','computed position');
  await setControl(page,id,'chipFamily','material-flat');await wait(()=>rail.evaluate(node=>node.dataset.moduleStyleFamily==='material-flat'),'material family missing');assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('Material 3 Expressive'),'top-nav family label missing');controlPass(id,'chipFamily','real family + selector label');await setControl(page,id,'chipFamily','ios-liquid');
  await setControl(page,id,'accentColor','#a855f7');assert((await rail.evaluate(node=>node.style.getPropertyValue('--v36-blue-mid').trim())).toLowerCase()==='#a855f7','accentColor is not consumed by canonical liquid vars');controlPass(id,'accentColor','canonical liquid color vars');
  await setControl(page,id,'fontFamily','rounded-sans');assert((await chip.evaluate(node=>node.style.getPropertyValue('font-family'))).includes('ui-rounded'),'fontFamily no-op');controlPass(id,'fontFamily','actual chip font');
  await setControl(page,id,'fontSize',18);assert(await computed(chip,'fontSize')==='18px','fontSize no-op');controlPass(id,'fontSize','18px computed');
  await setControl(page,id,'fontWeight',750);assert(Number(await computed(chip,'fontWeight'))>=700,'fontWeight no-op');controlPass(id,'fontWeight','computed weight');
  await setControl(page,id,'letterSpacing',0.24);assert(await computed(chip,'letterSpacing')!=='normal','letterSpacing no-op');controlPass(id,'letterSpacing','computed spacing');
  await setControl(page,id,'progressEnabled',false);assert(await rail.evaluate(node=>node.dataset.moduleProgressEnabled)==='false','progressEnabled no-op');controlPass(id,'progressEnabled','dataset');await setControl(page,id,'progressEnabled',true);
  await setControl(page,id,'progressMode','line');assert(await rail.evaluate(node=>node.dataset.moduleProgressMode)==='line','progressMode no-op');controlPass(id,'progressMode','dataset');
  await setControl(page,id,'progressColor','#e11d48');assert((await rail.evaluate(node=>node.style.getPropertyValue('--module-progress-color').trim())).toLowerCase()==='#e11d48','progressColor no-op');controlPass(id,'progressColor','CSS var');
  await setControl(page,id,'progressOpacityStart',41);assert(await rail.evaluate(node=>node.style.getPropertyValue('--module-progress-start').trim())==='41%','progressOpacityStart no-op');controlPass(id,'progressOpacityStart','41%');
  await setControl(page,id,'progressOpacityEnd',9);assert(await rail.evaluate(node=>node.style.getPropertyValue('--module-progress-end').trim())==='9%','progressOpacityEnd no-op');controlPass(id,'progressOpacityEnd','9%');
  await setViewport(page,'desktop');await setControl(page,id,'desktopChipGap',17);assert(await computed(rail,'gap')==='17px','desktopChipGap no-op');controlPass(id,'desktopChipGap','17px computed');
  await setViewport(page,'mobile');await setControl(page,id,'mobileChipGap',13);assert(await computed(rail,'gap')==='13px','mobileChipGap no-op');controlPass(id,'mobileChipGap','13px computed');await setViewport(page,'desktop');
  await setControl(page,id,'railInset',12);assert(await computed(rail,'paddingTop')==='12px','railInset no-op');controlPass(id,'railInset','12px computed');
  const d0=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));await setControl(page,id,'response','lively');const d1=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));assert(d1&&d1!==d0,'response no-op');controlPass(id,'response',d1);
  const e0=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-ease'));await setControl(page,id,'overshoot','none');const e1=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-ease'));assert(e1&&e1!==e0,'overshoot no-op');controlPass(id,'overshoot','easing changed');
  const d2=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));await setControl(page,id,'durationScale',1.45);const d3=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));assert(d3&&d3!==d2,'durationScale no-op');controlPass(id,'durationScale',`${d2} → ${d3}`);
  await assertLocked(page,id,'safariSafety');await shot(page,'top-nav-exhaustive');await resetStyle(page);
}

async function filterRail(page){
  const id='filter-chip-rail',frame=await moduleFrame(page,id);await openInspector(page);const module=frame.locator('.platform-filter-chip-module[data-platform-module="filter-chip-rail"]'),liquid=frame.locator('.platform-filter-chip-source--liquid'),flat=frame.locator('.platform-filter-chip-source--ios-flat'),material=frame.locator('.platform-filter-chip-source--material-flat');
  assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('iOS 리퀴드'),'filter default family label missing');
  await setControl(page,id,'family','ios-flat');assert(await liquid.isHidden()&&!(await flat.isHidden()),'iOS Flat source not active');await setControl(page,id,'family','material-flat');assert(await flat.isHidden()&&!(await material.isHidden()),'Material source not active');assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('Material 3 Expressive'),'Material label missing');controlPass(id,'family','three actual source rails');
  const materialButtons=material.locator('[data-platform-filter-id]');await materialButtons.nth(1).click();assert(await materialButtons.nth(1).getAttribute('aria-pressed')==='true','Material interaction owner not live');await setControl(page,id,'family','ios-liquid');
  await setControl(page,id,'accentColor','#7c3aed');assert((await module.evaluate(node=>getComputedStyle(node).getPropertyValue('--platform-filter-accent').trim())).toLowerCase()==='#7c3aed','filter accent no-op');controlPass(id,'accentColor','canonical CSS var');
  const button=liquid.locator('[data-platform-filter-id]').first();await setControl(page,id,'fontFamily','rounded-sans');assert((await button.evaluate(node=>node.style.getPropertyValue('font-family'))).includes('ui-rounded'),'filter fontFamily no-op');controlPass(id,'fontFamily','button font');
  await setControl(page,id,'fontSize',17);assert(await computed(button,'fontSize')==='17px','filter fontSize no-op');controlPass(id,'fontSize','17px computed');await setControl(page,id,'fontWeight',760);assert(Number(await computed(button,'fontWeight'))>=700,'filter fontWeight no-op');controlPass(id,'fontWeight','computed');await setControl(page,id,'letterSpacing',0.18);assert(await computed(button,'letterSpacing')!=='normal','filter letterSpacing no-op');controlPass(id,'letterSpacing','computed');
  const bg0=await computed(liquid,'backgroundImage');await setControl(page,id,'surfaceOpacity',72);const bg1=await computed(liquid,'backgroundImage');assert(bg1&&bg1!==bg0,'filter surfaceOpacity visually overridden');controlPass(id,'surfaceOpacity','computed background changed');
  await setControl(page,id,'blur',26);assert((await computed(liquid,'backdropFilter')).includes('26px'),'filter blur visually overridden');controlPass(id,'blur','26px computed blur');
  const d0=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-duration'));await setControl(page,id,'response','lively');const d1=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-duration'));assert(d1&&d1!==d0,'filter response no-op');controlPass(id,'response',d1);
  const e0=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-ease'));await setControl(page,id,'overshoot','high');const e1=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-ease'));assert(e1&&e1!==e0,'filter overshoot no-op');controlPass(id,'overshoot','easing changed');
  await setControl(page,id,'gap',15);assert(await computed(liquid,'gap')==='15px','filter gap no-op');controlPass(id,'gap','15px computed');await setControl(page,id,'runway',20);assert(await computed(liquid,'paddingLeft')==='20px','filter runway no-op');controlPass(id,'runway','20px computed');
  for(let i=0;i<13;i++){await openInspector(page);await page.locator('[data-menu-add]').click();await sleep(80);}await wait(()=>liquid.locator('[data-platform-filter-id]').count().then(count=>count>=17),'long filter menu not propagated',20000);
  const overflow=await liquid.evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,overflowX:getComputedStyle(node).overflowX,whiteSpace:getComputedStyle(node.querySelector('button')).whiteSpace,moduleWidth:node.closest('.platform-filter-chip-module').getBoundingClientRect().width,sourceWidth:node.getBoundingClientRect().width,moduleOverflow:getComputedStyle(node.closest('.platform-filter-chip-module')).overflowX}));
  assert(overflow.scrollWidth>overflow.clientWidth,`long filter is not scrollable: ${JSON.stringify(overflow)}`);assert(['auto','scroll'].includes(overflow.overflowX),'filter overflow-x not scrollable');assert(overflow.whiteSpace==='nowrap','filter labels wrap');assert(overflow.sourceWidth<=overflow.moduleWidth+1,'filter source escapes module');assert(['hidden','clip'].includes(overflow.moduleOverflow),'module paint overflow not contained');pass('filter long-menu overflow',`${overflow.clientWidth}px / ${overflow.scrollWidth}px`);
  await setControl(page,id,'family','material-flat');await openInspector(page);assert(await page.locator('[data-style-control="blur"]').isDisabled(),'Material blur must be disabled');const first=material.locator('[data-platform-filter-id]').first(),second=material.locator('[data-platform-filter-id]').nth(1);await second.click();assert(await computed(first,'borderRadius')!==await computed(second,'borderRadius'),'Material active shape lacks contrast');assert(await computed(second,'backgroundColor')!=='rgba(0, 0, 0, 0)','Material active tonal surface transparent');pass('Material 3 Expressive runtime','tonal active surface + shape contrast');
  await shot(page,'filter-exhaustive-long-menu');await resetStyle(page);
}

async function cardRail(page){
  const id='horizontal-card-rail',frame=await moduleFrame(page,id);await openInspector(page);const rail=frame.locator('.scroll-row[data-platform-module="horizontal-card-rail"]');
  await assertLocked(page,id,'nativeTouch');await setControl(page,id,'desktopDrag',false);assert(await rail.evaluate(node=>node.dataset.builderDesktopDrag)==='false','desktopDrag no-op');controlPass(id,'desktopDrag','dataset');
  await setControl(page,id,'leftShadowGuard',false);assert(await computed(rail,'paddingLeft')==='0px','leftShadowGuard no-op');controlPass(id,'leftShadowGuard','0px computed');await setControl(page,id,'leftShadowGuard',true);await setControl(page,id,'leftPaintRunway',31);assert(await computed(rail,'paddingLeft')==='31px','leftPaintRunway no-op');controlPass(id,'leftPaintRunway','31px computed');
  await setControl(page,id,'leftFade',true);assert((await computed(rail,'maskImage')).includes('transparent'),'leftFade no-op');controlPass(id,'leftFade','computed mask');await setControl(page,id,'leftFade',false);await setControl(page,id,'rightFade',false);assert(await computed(rail,'maskImage')==='none','rightFade=false leaves active mask');controlPass(id,'rightFade','computed mask none');
  await assertLocked(page,id,'rightFadeMode');await setControl(page,id,'rightFade',true);await setControl(page,id,'rightFadeWidth',146);assert((await computed(rail,'maskImage')).includes('146px'),'rightFadeWidth no-op');controlPass(id,'rightFadeWidth','146px computed mask');
  await setControl(page,id,'rightContentPadding',154);assert(await computed(rail,'paddingRight')==='154px','rightContentPadding no-op');controlPass(id,'rightContentPadding','154px computed');await setControl(page,id,'scrollbar','auto');assert(await rail.evaluate(node=>node.dataset.moduleScrollbar)==='auto','scrollbar no-op');assert(['auto','scroll'].includes(await computed(rail,'overflowX')),'scrollbar auto does not expose native horizontal overflow');controlPass(id,'scrollbar','dataset + native overflow');
  await setControl(page,id,'dragThreshold',11);assert(await rail.evaluate(node=>node.dataset.builderDragThreshold)==='11','dragThreshold no-op');controlPass(id,'dragThreshold','dataset');await setControl(page,id,'clickSuppressMs',410);assert(await rail.evaluate(node=>node.dataset.builderClickSuppressMs)==='410','clickSuppressMs no-op');controlPass(id,'clickSuppressMs','dataset');await shot(page,'card-rail-exhaustive');await resetStyle(page);
}

async function bottomSheet(page){
  const id='collection-bottom-sheet',frame=await moduleFrame(page,id);await openInspector(page);await page.locator('[data-inspector-state="settings"]').click();await sleep(220);const layer=frame.locator('.platform-module-host [data-platform-module="collection-bottom-sheet"]'),sheet=frame.locator('#collectionSheet'),backdrop=frame.locator('#collectionBackdrop');
  await setControl(page,id,'enabled',false);assert(await sheet.evaluate(node=>node.hidden),'enabled no-op');controlPass(id,'enabled','sheet.hidden');await setControl(page,id,'enabled',true);await setControl(page,id,'backdrop',false);assert(await backdrop.evaluate(node=>node.hidden),'backdrop no-op');controlPass(id,'backdrop','hidden');await setControl(page,id,'backdrop',true);
  await setControl(page,id,'backdropBlur',21);assert((await computed(backdrop,'backdropFilter')).includes('21px'),'backdropBlur visually overridden');controlPass(id,'backdropBlur','21px computed');await setControl(page,id,'sheetBlur',33);assert((await computed(sheet,'backdropFilter')).includes('33px'),'sheetBlur visually overridden');controlPass(id,'sheetBlur','33px computed');await setControl(page,id,'sheetSaturation',165);assert((await computed(sheet,'backdropFilter')).includes('165%'),'sheetSaturation visually overridden');controlPass(id,'sheetSaturation','165% computed');
  await setControl(page,id,'maxWidth',900);assert((await computed(sheet,'width')).replace('px','')!=='760','maxWidth no-op');controlPass(id,'maxWidth','computed width changed');await setControl(page,id,'maxHeightDvh',70);assert((await sheet.evaluate(node=>node.style.height)).includes('70dvh'),'maxHeightDvh no-op');controlPass(id,'maxHeightDvh','70dvh');await setControl(page,id,'radiusTop',40);assert((await computed(sheet,'borderTopLeftRadius'))==='40px','radiusTop visually overridden');controlPass(id,'radiusTop','40px computed');
  for(const [key,selector] of [['handle','.collection-handle-wrap'],['tabs','.collection-tabs'],['search','.collection-search'],['filters','.collection-filters'],['themeSelector','.theme-setting-card'],['deviceHandoff','#collectionDeviceLink']]){await setControl(page,id,key,false);const node=frame.locator(selector).first();assert(await node.count()===1,`${key} target missing`);assert(await node.evaluate(el=>el.hidden),`${key} no-op`);controlPass(id,key,'hidden');await setControl(page,id,key,true);}
  await setControl(page,id,'bulkSelection',false);assert(await layer.evaluate(node=>node.dataset.moduleBulkSelection)==='false','bulkSelection no-op');controlPass(id,'bulkSelection','dataset');await shot(page,'bottom-sheet-exhaustive');await resetStyle(page);
}

async function accordion(page){
  const id='device-handoff-accordion',frame=await moduleFrame(page,id);await openInspector(page);const link=frame.locator('#collectionDeviceLink'),panel=frame.locator('.collection-device-panel-v2');await setControl(page,id,'enabled',false);assert(await link.evaluate(node=>node.hidden),'enabled no-op');controlPass(id,'enabled','hidden');await setControl(page,id,'enabled',true);await assertLocked(page,id,'heightMode');const d0=await computed(panel,'transitionDuration');await setControl(page,id,'response','lively');const d1=await computed(panel,'transitionDuration');assert(d1&&d1!==d0,'response visually overridden');controlPass(id,'response',`${d0} → ${d1}`);
  for(const [key,selector] of [['copyAction','[data-device-panel-copy]'],['connectAction','[data-device-panel-connect]'],['statusMessage','.collection-device-panel__status']]){await setControl(page,id,key,false);const nodes=frame.locator(selector);assert(await nodes.count()>0,`${key} target missing`);assert(await nodes.first().evaluate(node=>node.hidden),`${key} no-op`);controlPass(id,key,'hidden');await setControl(page,id,key,true);}await shot(page,'accordion-exhaustive');await resetStyle(page);
}

async function fab(page){
  const id='floating-action',frame=await moduleFrame(page,id);await openInspector(page);const button=frame.locator('.collection-fab[data-platform-module="floating-action"],#collectionFab').first();await setControl(page,id,'family','flat');assert(await button.evaluate(node=>node.dataset.moduleStyleFamily)==='flat','family no-op');controlPass(id,'family','dataset');const b0=await computed(button,'backgroundImage');await setControl(page,id,'accentColor','#db2777');const b1=await computed(button,'backgroundImage');assert(b1!==b0||await computed(button,'backgroundColor')!=='rgba(0, 0, 0, 0)','accentColor visually overridden');controlPass(id,'accentColor','computed background');const d0=await computed(button,'transitionDuration');await setControl(page,id,'response','lively');const d1=await computed(button,'transitionDuration');assert(d1&&d1!==d0,'response visually overridden');controlPass(id,'response',`${d0} → ${d1}`);const e0=await computed(button,'transitionTimingFunction');await setControl(page,id,'overshoot','high');const e1=await computed(button,'transitionTimingFunction');assert(e1&&e1!==e0,'overshoot visually overridden');controlPass(id,'overshoot','computed timing');await shot(page,'fab-exhaustive');await resetStyle(page);
}

try{
  const context=await browser.newContext(),page=await context.newPage();await page.setViewportSize({width:1440,height:1000});await openLibrary(page);await topNav(page);await filterRail(page);await cardRail(page);await bottomSheet(page);await accordion(page);await fab(page);report.status='pass';pass('exhaustive visible setting contract',`${report.controls.length} individual control assertions passed`);await page.close();await context.close();
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
