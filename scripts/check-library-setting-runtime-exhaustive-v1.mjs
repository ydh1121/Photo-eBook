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

async function wait(fn,message,timeout=15000){
  const started=Date.now();let last;
  while(Date.now()-started<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}
  if(last)throw last;throw new Error(message);
}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
function controlPass(moduleId,id,detail=''){report.controls.push({moduleId,id,status:'pass',detail});console.log(`  ✓ ${moduleId}.${id}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}

const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function openLibrary(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibraryThemeV3','platformLibraryViewportV3'])localStorage.removeItem(key);
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="top-chapter-navigation"]').count().then(Boolean),'Library selector missing');
  assert(await page.locator('[data-kit-ui="reading-progress"]').count()===0,'retired reading-progress exposed as Library module');
  pass('reading-progress ownership','not exposed as standalone Library module');
}

async function moduleFrame(page,id){
  const selector=page.locator(`[data-kit-ui="${id}"]`);
  assert(await selector.count()===1,`Library selector missing: ${id}`);
  await selector.click();
  await wait(()=>page.evaluate(moduleId=>{
    const frame=document.querySelector('#builderFrame');
    const doc=frame?.contentDocument;
    return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));
  },id),`canonical module frame missing: ${id}`,20000);
  return page.frameLocator('#builderFrame');
}

async function openInspector(page){
  if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;
  await page.locator('#kitSettings').click();
  await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'inspector did not open');
}

async function setControl(page,moduleId,id,value){
  await openInspector(page);
  const control=page.locator(`[data-style-control="${id}"]`);
  assert(await control.count()===1,`${moduleId}.${id}: visible control missing`);
  assert(!(await control.isDisabled()),`${moduleId}.${id}: unexpectedly disabled`);
  const tag=await control.evaluate(node=>node.tagName);
  const type=await control.getAttribute('type');
  if(type==='checkbox'){
    if(Boolean(value)!==await control.isChecked())await control.click();
  }else if(tag==='SELECT'){
    await control.selectOption(String(value));
  }else{
    await control.evaluate((node,next)=>{
      node.value=String(next);
      node.dispatchEvent(new Event('input',{bubbles:true}));
      node.dispatchEvent(new Event('change',{bubbles:true}));
    },value);
  }
  await sleep(180);
}

async function assertLocked(page,moduleId,id){
  await openInspector(page);
  const control=page.locator(`[data-style-control="${id}"]`);
  assert(await control.count()===1,`${moduleId}.${id}: locked control missing`);
  assert(await control.isDisabled(),`${moduleId}.${id}: locked control is editable`);
  controlPass(moduleId,id,'locked/disabled');
}

async function resetStyle(page){
  await openInspector(page);
  await page.locator('[data-style-reset]').click();
  await sleep(180);
}

async function setViewport(page,value){
  const button=page.locator(`[data-kit-viewport="${value}"]`);
  if(await button.getAttribute('aria-pressed')!=='true')await button.click();
  await wait(()=>page.locator('.builder-kit-workspace').evaluate((node,v)=>node.dataset.viewport===v,value),`viewport did not become ${value}`);
  await sleep(120);
}

async function topNav(page){
  const id='top-chapter-navigation';
  const frame=await moduleFrame(page,id);
  await openInspector(page);
  const shell=frame.locator('.nav-shell');
  const rail=frame.locator('.nav-scroll');
  const chip=frame.locator('.nav-chip').first();

  assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('iOS 리퀴드'),'top-nav selector does not show default iOS Liquid family');

  await setControl(page,id,'enabled',false);assert(await shell.evaluate(node=>node.hidden),'enabled=false did not hide nav');controlPass(id,'enabled','.nav-shell.hidden');
  await setControl(page,id,'enabled',true);assert(!(await shell.evaluate(node=>node.hidden)),'enabled=true did not restore nav');

  await setControl(page,id,'stickyMode','static');assert(await shell.evaluate(node=>node.style.position)==='relative','stickyMode static did not apply');controlPass(id,'stickyMode','shell inline position');

  await setControl(page,id,'chipFamily','material-flat');
  await wait(()=>rail.evaluate(node=>node.dataset.moduleStyleFamily==='material-flat'),'top-nav material family did not reach canonical rail');
  assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('Material 3 Expressive'),'top-nav selector family label did not update');
  controlPass(id,'chipFamily','real rail family + selector label');
  await setControl(page,id,'chipFamily','ios-liquid');
  await wait(()=>rail.evaluate(node=>!node.dataset.moduleStyleFamily),'top-nav liquid family did not restore canonical owner');

  await setControl(page,id,'accentColor','#a855f7');assert((await rail.evaluate(node=>node.style.getPropertyValue('--module-accent').trim())).toLowerCase()==='#a855f7','top-nav accent no-op');controlPass(id,'accentColor','--module-accent');
  await setControl(page,id,'fontFamily','rounded-sans');assert((await chip.evaluate(node=>node.style.getPropertyValue('font-family'))).includes('ui-rounded'),'top-nav fontFamily no-op');controlPass(id,'fontFamily','actual .nav-chip inline font');
  await setControl(page,id,'fontSize',18);assert(await chip.evaluate(node=>getComputedStyle(node).fontSize)==='18px','top-nav fontSize no-op');controlPass(id,'fontSize','18px computed');
  await setControl(page,id,'fontWeight',750);assert(Number(await chip.evaluate(node=>getComputedStyle(node).fontWeight))>=700,'top-nav fontWeight no-op');controlPass(id,'fontWeight','computed weight');
  await setControl(page,id,'letterSpacing',0.24);assert((await chip.evaluate(node=>getComputedStyle(node).letterSpacing))!=='normal','top-nav letterSpacing no-op');controlPass(id,'letterSpacing','computed spacing');

  await setControl(page,id,'progressEnabled',false);assert(await rail.evaluate(node=>node.dataset.moduleProgressEnabled)==='false','progressEnabled no-op');controlPass(id,'progressEnabled','progress dataset');
  await setControl(page,id,'progressEnabled',true);
  await setControl(page,id,'progressMode','line');assert(await rail.evaluate(node=>node.dataset.moduleProgressMode)==='line','progressMode no-op');controlPass(id,'progressMode','line dataset');
  await setControl(page,id,'progressColor','#e11d48');assert((await rail.evaluate(node=>node.style.getPropertyValue('--module-progress-color').trim())).toLowerCase()==='#e11d48','progressColor no-op');controlPass(id,'progressColor','progress color var');
  await setControl(page,id,'progressOpacityStart',41);assert(await rail.evaluate(node=>node.style.getPropertyValue('--module-progress-start').trim())==='41%','progressOpacityStart no-op');controlPass(id,'progressOpacityStart','41% var');
  await setControl(page,id,'progressOpacityEnd',9);assert(await rail.evaluate(node=>node.style.getPropertyValue('--module-progress-end').trim())==='9%','progressOpacityEnd no-op');controlPass(id,'progressOpacityEnd','9% var');

  await setViewport(page,'desktop');await setControl(page,id,'desktopChipGap',17);assert(await rail.evaluate(node=>getComputedStyle(node).gap)==='17px','desktopChipGap no-op');controlPass(id,'desktopChipGap','17px computed gap');
  await setViewport(page,'mobile');await setControl(page,id,'mobileChipGap',13);assert(await rail.evaluate(node=>getComputedStyle(node).gap)==='13px','mobileChipGap no-op');controlPass(id,'mobileChipGap','13px computed gap');
  await setViewport(page,'desktop');
  await setControl(page,id,'railInset',12);assert(await rail.evaluate(node=>getComputedStyle(node).paddingTop)==='12px','railInset no-op');controlPass(id,'railInset','12px padding');

  const duration0=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));
  await setControl(page,id,'response','lively');const duration1=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));assert(duration1&&duration1!==duration0,'response no-op');controlPass(id,'response',duration1);
  const ease0=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-ease'));
  await setControl(page,id,'overshoot','none');const ease1=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-ease'));assert(ease1&&ease1!==ease0,'overshoot no-op');controlPass(id,'overshoot','easing changed');
  const duration2=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));
  await setControl(page,id,'durationScale',1.45);const duration3=await rail.evaluate(node=>node.style.getPropertyValue('--module-motion-duration'));assert(duration3&&duration3!==duration2,'durationScale no-op');controlPass(id,'durationScale',`${duration2} → ${duration3}`);
  await assertLocked(page,id,'safariSafety');
  await shot(page,'top-nav-exhaustive');
  await resetStyle(page);
}

async function filterRail(page){
  const id='filter-chip-rail';
  const frame=await moduleFrame(page,id);
  await openInspector(page);
  const module=frame.locator('[data-platform-module="filter-chip-rail"]');
  const liquid=frame.locator('.platform-filter-chip-source--liquid');
  const flat=frame.locator('.platform-filter-chip-source--ios-flat');
  const material=frame.locator('.platform-filter-chip-source--material-flat');

  assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('iOS 리퀴드'),'filter selector does not show default iOS Liquid family');
  assert(!(await liquid.isHidden())&&await flat.isHidden()&&await material.isHidden(),'filter default real source is not liquid');

  await setControl(page,id,'family','ios-flat');assert(await liquid.isHidden()&&!(await flat.isHidden())&&await material.isHidden(),'iOS Flat real source did not activate');assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('iOS 플랫'),'filter selector did not show iOS Flat');
  await setControl(page,id,'family','material-flat');assert(await liquid.isHidden()&&await flat.isHidden()&&!(await material.isHidden()),'Material real source did not activate');assert((await page.locator(`[data-kit-ui="${id}"]`).textContent()).includes('Material 3 Expressive'),'filter selector did not show Material');controlPass(id,'family','three real source rails + selector label');
  const materialButtons=material.locator('[data-platform-filter-id]');await materialButtons.nth(1).click();assert(await materialButtons.nth(1).getAttribute('aria-pressed')==='true','Material interaction owner not live');
  await setControl(page,id,'family','ios-liquid');

  await setControl(page,id,'accentColor','#7c3aed');assert((await module.evaluate(node=>getComputedStyle(node).getPropertyValue('--platform-filter-accent').trim())).toLowerCase()==='#7c3aed','filter accent no-op');controlPass(id,'accentColor','canonical CSS variable');
  const visibleButton=liquid.locator('[data-platform-filter-id]').first();
  await setControl(page,id,'fontFamily','rounded-sans');assert((await visibleButton.evaluate(node=>node.style.getPropertyValue('font-family'))).includes('ui-rounded'),'filter fontFamily no-op');controlPass(id,'fontFamily','actual button font');
  await setControl(page,id,'fontSize',17);assert(await visibleButton.evaluate(node=>getComputedStyle(node).fontSize)==='17px','filter fontSize no-op');controlPass(id,'fontSize','17px computed');
  await setControl(page,id,'fontWeight',760);assert(Number(await visibleButton.evaluate(node=>getComputedStyle(node).fontWeight))>=700,'filter fontWeight no-op');controlPass(id,'fontWeight','computed weight');
  await setControl(page,id,'letterSpacing',0.18);assert((await visibleButton.evaluate(node=>getComputedStyle(node).letterSpacing))!=='normal','filter letterSpacing no-op');controlPass(id,'letterSpacing','computed spacing');

  const bg0=await liquid.evaluate(node=>node.style.background);
  await setControl(page,id,'surfaceOpacity',72);const bg1=await liquid.evaluate(node=>node.style.background);assert(bg1&&bg1!==bg0,'filter surfaceOpacity no-op');controlPass(id,'surfaceOpacity','liquid surface background changed');
  await setControl(page,id,'blur',26);assert((await liquid.evaluate(node=>node.style.backdropFilter)).includes('26px'),'filter blur no-op on liquid');controlPass(id,'blur','26px liquid blur');
  const dur0=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-duration'));
  await setControl(page,id,'response','lively');const dur1=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-duration'));assert(dur1&&dur1!==dur0,'filter response no-op');controlPass(id,'response',dur1);
  const ease0=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-ease'));
  await setControl(page,id,'overshoot','high');const ease1=await module.evaluate(node=>node.style.getPropertyValue('--platform-filter-ease'));assert(ease1&&ease1!==ease0,'filter overshoot no-op');controlPass(id,'overshoot','easing changed');
  await setControl(page,id,'gap',15);assert(await liquid.evaluate(node=>getComputedStyle(node).gap)==='15px','filter gap no-op on default liquid source');controlPass(id,'gap','15px real liquid gap');
  await setControl(page,id,'runway',20);assert(await liquid.evaluate(node=>getComputedStyle(node).paddingLeft)==='20px','filter runway no-op on default liquid source');controlPass(id,'runway','20px real liquid padding');

  for(let i=0;i<13;i++){
    await openInspector(page);
    await page.locator('[data-menu-add]').click();
    await sleep(80);
  }
  await wait(()=>liquid.locator('[data-platform-filter-id]').count().then(count=>count>=17),'long filter menu did not reach canonical runtime',20000);
  const overflow=await liquid.evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,overflowX:getComputedStyle(node).overflowX,whiteSpace:getComputedStyle(node.querySelector('button')).whiteSpace,moduleWidth:node.closest('[data-platform-module]').getBoundingClientRect().width,sourceWidth:node.getBoundingClientRect().width,moduleOverflow:getComputedStyle(node.closest('[data-platform-module]')).overflowX}));
  assert(overflow.scrollWidth>overflow.clientWidth,`long filter did not become horizontal scroll: ${JSON.stringify(overflow)}`);
  assert(['auto','scroll'].includes(overflow.overflowX),`long filter overflow-x is ${overflow.overflowX}`);
  assert(overflow.whiteSpace==='nowrap','filter labels can wrap');
  assert(overflow.sourceWidth<=overflow.moduleWidth+1,'filter source width exceeds module width');
  assert(overflow.moduleOverflow==='hidden'||overflow.moduleOverflow==='clip',`module does not contain paint overflow: ${overflow.moduleOverflow}`);
  pass('filter long-menu overflow',`${overflow.clientWidth}px viewport / ${overflow.scrollWidth}px content`);

  await setControl(page,id,'family','material-flat');
  await openInspector(page);
  assert(await page.locator('[data-style-control="blur"]').isDisabled(),'Material blur control should be disabled');
  const first=material.locator('[data-platform-filter-id]').first();const second=material.locator('[data-platform-filter-id]').nth(1);await second.click();
  const shape=await Promise.all([first.evaluate(node=>getComputedStyle(node).borderRadius),second.evaluate(node=>getComputedStyle(node).borderRadius),second.evaluate(node=>getComputedStyle(node).backgroundColor)]);
  assert(shape[0]!==shape[1],'Material Expressive active shape does not contrast with inactive shape');
  assert(shape[2]!=='rgba(0, 0, 0, 0)','Material Expressive active tonal surface is transparent');
  pass('Material 3 Expressive runtime','tonal active surface + contrasting shape + real horizontal source');
  await shot(page,'filter-exhaustive-long-menu');
  await resetStyle(page);
}

async function cardRail(page){
  const id='horizontal-card-rail';const frame=await moduleFrame(page,id);await openInspector(page);const rail=frame.locator('[data-platform-module="horizontal-card-rail"]');
  await assertLocked(page,id,'nativeTouch');
  await setControl(page,id,'desktopDrag',false);assert(await rail.evaluate(node=>node.dataset.builderDesktopDrag)==='false','desktopDrag no-op');controlPass(id,'desktopDrag','rail-drag dataset');
  await setControl(page,id,'leftShadowGuard',false);assert(await rail.evaluate(node=>getComputedStyle(node).paddingLeft)==='0px','leftShadowGuard no-op');controlPass(id,'leftShadowGuard','0px left padding');
  await setControl(page,id,'leftShadowGuard',true);await setControl(page,id,'leftPaintRunway',31);assert(await rail.evaluate(node=>getComputedStyle(node).paddingLeft)==='31px','leftPaintRunway no-op');controlPass(id,'leftPaintRunway','31px left padding');
  await setControl(page,id,'leftFade',true);assert((await rail.evaluate(node=>node.style.maskImage||node.style.webkitMaskImage)).includes('transparent'),'leftFade no-op');controlPass(id,'leftFade','mask created');
  await setControl(page,id,'leftFade',false);await setControl(page,id,'rightFade',false);assert(!(await rail.evaluate(node=>node.style.maskImage||node.style.webkitMaskImage)),'rightFade=false left stale mask');controlPass(id,'rightFade','mask removed when both fades false');
  await assertLocked(page,id,'rightFadeMode');
  await setControl(page,id,'rightFade',true);await setControl(page,id,'rightFadeWidth',146);assert((await rail.evaluate(node=>node.style.maskImage||node.style.webkitMaskImage)).includes('146px'),'rightFadeWidth no-op');controlPass(id,'rightFadeWidth','146px mask stop');
  await setControl(page,id,'rightContentPadding',154);assert(await rail.evaluate(node=>getComputedStyle(node).paddingRight)==='154px','rightContentPadding no-op');controlPass(id,'rightContentPadding','154px padding');
  await setControl(page,id,'scrollbar','auto');assert(await rail.evaluate(node=>node.dataset.moduleScrollbar)==='auto','scrollbar no-op');controlPass(id,'scrollbar','auto dataset');
  await setControl(page,id,'dragThreshold',11);assert(await rail.evaluate(node=>node.dataset.builderDragThreshold)==='11','dragThreshold no-op');controlPass(id,'dragThreshold','consumed dataset');
  await setControl(page,id,'clickSuppressMs',410);assert(await rail.evaluate(node=>node.dataset.builderClickSuppressMs)==='410','clickSuppressMs no-op');controlPass(id,'clickSuppressMs','consumed dataset');
  await shot(page,'card-rail-exhaustive');await resetStyle(page);
}

async function bottomSheet(page){
  const id='collection-bottom-sheet';const frame=await moduleFrame(page,id);await openInspector(page);
  await page.locator('[data-inspector-state="settings"]').click();await sleep(220);
  const layer=frame.locator('[data-platform-module="collection-bottom-sheet"]');const sheet=frame.locator('#collectionSheet');const backdrop=frame.locator('#collectionBackdrop');
  await setControl(page,id,'enabled',false);assert(await sheet.evaluate(node=>node.hidden),'bottom-sheet enabled no-op');controlPass(id,'enabled','sheet hidden');await setControl(page,id,'enabled',true);
  await setControl(page,id,'backdrop',false);assert(await backdrop.evaluate(node=>node.hidden),'backdrop no-op');controlPass(id,'backdrop','backdrop hidden');await setControl(page,id,'backdrop',true);
  await setControl(page,id,'backdropBlur',21);assert((await backdrop.evaluate(node=>node.style.backdropFilter)).includes('21px'),'backdropBlur no-op');controlPass(id,'backdropBlur','21px backdrop blur');
  await setControl(page,id,'sheetBlur',33);assert((await sheet.evaluate(node=>node.style.backdropFilter)).includes('33px'),'sheetBlur no-op');controlPass(id,'sheetBlur','33px sheet blur');
  await setControl(page,id,'sheetSaturation',165);assert((await sheet.evaluate(node=>node.style.backdropFilter)).includes('165%'),'sheetSaturation no-op');controlPass(id,'sheetSaturation','165% saturation');
  await setControl(page,id,'maxWidth',900);assert((await sheet.evaluate(node=>node.style.width)).includes('900px'),'maxWidth no-op');controlPass(id,'maxWidth','900px inline width');
  await setControl(page,id,'maxHeightDvh',70);assert((await sheet.evaluate(node=>node.style.height)).includes('70dvh'),'maxHeightDvh no-op');controlPass(id,'maxHeightDvh','70dvh inline height');
  await setControl(page,id,'radiusTop',40);assert((await sheet.evaluate(node=>node.style.borderRadius)).includes('40px'),'radiusTop no-op');controlPass(id,'radiusTop','40px radius');
  const visibility=[['handle','.collection-handle-wrap'],['tabs','.collection-tabs'],['search','.collection-search'],['filters','.collection-filters'],['themeSelector','.theme-setting-card'],['deviceHandoff','#collectionDeviceLink']];
  for(const [key,selector] of visibility){await setControl(page,id,key,false);const node=frame.locator(selector).first();assert(await node.count()===1,`${key} target missing`);assert(await node.evaluate(el=>el.hidden),`${key} no-op`);controlPass(id,key,`${selector}.hidden`);await setControl(page,id,key,true);}
  await setControl(page,id,'bulkSelection',false);assert(await layer.evaluate(node=>node.dataset.moduleBulkSelection)==='false','bulkSelection no-op');controlPass(id,'bulkSelection','layer dataset + selection UI');
  await shot(page,'bottom-sheet-exhaustive');await resetStyle(page);
}

async function accordion(page){
  const id='device-handoff-accordion';const frame=await moduleFrame(page,id);await openInspector(page);const link=frame.locator('#collectionDeviceLink');const panel=frame.locator('.collection-device-panel-v2');
  await setControl(page,id,'enabled',false);assert(await link.evaluate(node=>node.hidden),'accordion enabled no-op');controlPass(id,'enabled','link hidden');await setControl(page,id,'enabled',true);
  await assertLocked(page,id,'heightMode');
  const dur0=await panel.evaluate(node=>node.style.transitionDuration);await setControl(page,id,'response','lively');const dur1=await panel.evaluate(node=>node.style.transitionDuration);assert(dur1&&dur1!==dur0,'accordion response no-op');controlPass(id,'response',`${dur0} → ${dur1}`);
  for(const [key,selector] of [['copyAction','[data-device-panel-copy]'],['connectAction','[data-device-panel-connect]'],['statusMessage','.collection-device-panel__status']]){await setControl(page,id,key,false);const nodes=frame.locator(selector);assert(await nodes.count()>0,`${key} target missing`);assert(await nodes.first().evaluate(node=>node.hidden),`${key} no-op`);controlPass(id,key,`${selector}.hidden`);await setControl(page,id,key,true);}
  await shot(page,'accordion-exhaustive');await resetStyle(page);
}

async function fab(page){
  const id='floating-action';const frame=await moduleFrame(page,id);await openInspector(page);const button=frame.locator('[data-platform-module="floating-action"],#collectionFab').first();
  await setControl(page,id,'family','flat');assert(await button.evaluate(node=>node.dataset.moduleStyleFamily)==='flat','FAB family no-op');controlPass(id,'family','flat dataset');
  const bg0=await button.evaluate(node=>node.style.background);await setControl(page,id,'accentColor','#db2777');const bg1=await button.evaluate(node=>node.style.background);assert(bg1&&bg1!==bg0,'FAB accentColor no-op');controlPass(id,'accentColor','background changed');
  const dur0=await button.evaluate(node=>node.style.transitionDuration);await setControl(page,id,'response','lively');const dur1=await button.evaluate(node=>node.style.transitionDuration);assert(dur1&&dur1!==dur0,'FAB response no-op');controlPass(id,'response',`${dur0} → ${dur1}`);
  const ease0=await button.evaluate(node=>node.style.transitionTimingFunction);await setControl(page,id,'overshoot','high');const ease1=await button.evaluate(node=>node.style.transitionTimingFunction);assert(ease1&&ease1!==ease0,'FAB overshoot no-op');controlPass(id,'overshoot','timing function changed');
  await shot(page,'fab-exhaustive');await resetStyle(page);
}

try{
  const context=await browser.newContext();const page=await context.newPage();await page.setViewportSize({width:1440,height:1000});await openLibrary(page);
  await topNav(page);await filterRail(page);await cardRail(page);await bottomSheet(page);await accordion(page);await fab(page);
  report.status='pass';pass('exhaustive visible setting contract',`${report.controls.length} individual control assertions passed`);await page.close();await context.close();
}catch(error){report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await browser.close();}
