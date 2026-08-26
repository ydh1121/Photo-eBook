import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=(process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT=path.resolve('artifacts/library-module-family-controls-v1');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function wait(fn,message,timeout=18000){const started=Date.now();while(Date.now()-started<timeout){try{if(await fn())return;}catch{}await sleep(80);}throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function computed(locator,property){return locator.evaluate((node,key)=>getComputedStyle(node)[key],property);}
async function openLibrary(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.evaluate(()=>{for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibraryThemeV3','platformLibraryViewportV3'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="screen-mode-selector"]').count().then(Boolean),'Extended Library selector missing',25000);
}
async function selectModule(page,id){
  const button=page.locator(`[data-kit-ui="${id}"]`);
  assert(await button.count()===1,`Missing Library module ${id}`);
  await button.click();
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));},id),`Module frame missing ${id}`,25000);
  return page.frameLocator('#builderFrame');
}
async function openInspector(page){if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'Inspector did not open');}
async function setControl(page,id,value){
  await openInspector(page);
  const control=page.locator(`[data-style-control="${id}"]`);
  assert(await control.count()===1,`Missing control ${id}`);
  const tag=await control.evaluate(node=>node.tagName);
  if(tag==='SELECT')await control.selectOption(String(value));
  else if((await control.getAttribute('type'))==='checkbox'){if(Boolean(value)!==await control.isChecked())await control.click();}
  else await control.evaluate((node,next)=>{node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);
  await sleep(180);
}

try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await openLibrary(page);

  const moduleState=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('library').map(item=>({id:item.id,label:item.label,consumers:item.consumers})));
  assert(moduleState.length===10,`Expected 10 approved Library modules, got ${moduleState.length}`);
  assert(moduleState.some(item=>item.id==='screen-mode-selector'&&item.label==='화면 모드'),'Standalone screen-mode module missing');
  assert(moduleState.some(item=>item.id==='device-handoff-accordion'&&item.label==='기기 연결 아코디언'),'Device accordion formal name missing');
  assert(moduleState.some(item=>item.id==='accordion'&&item.label==='기본 아코디언'),'Base accordion formal name missing');
  assert(moduleState.some(item=>item.id==='collection-bottom-sheet'&&item.label==='내 모음 하단 팝업'),'Collection popup formal name missing');
  assert(moduleState.some(item=>item.id==='bottom-sheet'&&item.label==='범용 하단 시트'),'Portable sheet formal name missing');

  const accordionGroup=page.locator('[data-module-family="accordion"]');
  const popupGroup=page.locator('[data-module-family="bottom-popup"]');
  assert(await accordionGroup.count()===1,'Accordion parent group missing');
  assert(await popupGroup.count()===1,'Bottom-popup parent group missing');
  assert((await accordionGroup.locator('[data-module-family-parent]').textContent())?.trim()==='아코디언','Accordion parent label mismatch');
  assert((await popupGroup.locator('[data-module-family-parent]').textContent())?.trim()==='하단 팝업','Bottom-popup parent label mismatch');
  const accordionChildren=await accordionGroup.locator('[data-kit-ui]').allTextContents();
  const popupChildren=await popupGroup.locator('[data-kit-ui]').allTextContents();
  assert(accordionChildren.join('|')==='기기 연결 아코디언|기본 아코디언',`Accordion children mismatch: ${accordionChildren.join('|')}`);
  assert(popupChildren.join('|')==='내 모음 하단 팝업|범용 하단 시트',`Popup children mismatch: ${popupChildren.join('|')}`);
  pass('Library family hierarchy','아코디언 + 하단 팝업 parent/child tabs');

  let frame=await selectModule(page,'device-handoff-accordion');
  await sleep(500);
  assert(await frame.locator('.theme-setting-card,[data-theme-setting-card]').count()===0,'Screen mode is still bundled into device accordion');
  const deviceText=await frame.locator('[data-platform-module="device-handoff-accordion"]').innerText();
  assert(!deviceText.includes('화면 모드'),'Device accordion still contains screen-mode copy');
  frame=await selectModule(page,'screen-mode-selector');
  assert(await frame.locator('[data-screen-mode-value]').count()===3,'Standalone screen-mode options missing');
  await frame.locator('[data-screen-mode-value="dark"]').click();
  await wait(()=>frame.locator('html').evaluate(node=>node.dataset.theme==='dark'),'Screen-mode dark action did not affect runtime theme');
  pass('screen mode separation','device accordion clean + standalone runtime selector');

  frame=await selectModule(page,'horizontal-rail');
  await openInspector(page);
  for(const id of ['desktopDrag','leftShadowGuard','leftPaintRunway','leftFade','rightFade','rightFadeWidth','rightContentPadding','scrollbar','dragThreshold','clickSuppressMs']){
    assert(await page.locator(`[data-style-control="${id}"]`).count()===1,`Horizontal rail control missing: ${id}`);
  }
  const track=frame.locator('.platform-horizontal-rail__track');
  await setControl(page,'rightContentPadding',150);
  assert(await computed(track,'paddingRight')==='150px',`Horizontal rail right padding did not apply: ${await computed(track,'paddingRight')}`);
  await setControl(page,'rightFade',false);
  assert((await computed(track,'maskImage'))==='none'&&(await computed(track,'webkitMaskImage'))==='none','Horizontal rail right fade did not disable');
  await setControl(page,'rightFade',true);
  await setControl(page,'rightFadeWidth',140);
  const mask=await computed(track,'maskImage');
  assert(mask!=='none'&&mask.includes('140px'),`Horizontal rail fade width not measurable: ${mask}`);

  await track.evaluate(node=>node.scrollLeft=0);
  await setControl(page,'desktopDrag',false);
  await track.evaluate(node=>{const fire=(type,x)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:91,pointerType:'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:20}));fire('pointerdown',280);fire('pointermove',80);fire('pointerup',80);});
  await sleep(80);
  const disabledDrag=await track.evaluate(node=>node.scrollLeft);
  assert(disabledDrag===0,`Horizontal rail moved while desktop drag disabled: ${disabledDrag}`);
  await setControl(page,'desktopDrag',true);
  await track.evaluate(node=>{const fire=(type,x)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:92,pointerType:'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:20}));fire('pointerdown',280);fire('pointermove',80);fire('pointerup',80);});
  await sleep(80);
  const enabledDrag=await track.evaluate(node=>node.scrollLeft);
  assert(enabledDrag>80,`Horizontal rail did not drag when enabled: ${enabledDrag}`);
  pass('horizontal rail controls',`fade/padding measurable + drag ${Math.round(enabledDrag)}px`);

  frame=await selectModule(page,'filter-chip-rail');
  const filterRoot=frame.locator('.platform-filter-chip-module');
  assert(await computed(filterRoot,'overflowX')==='visible',`Filter root still clips outer paint: ${await computed(filterRoot,'overflowX')}`);
  await openInspector(page);
  for(let i=0;i<12;i++){await page.locator('[data-menu-add]').click();await sleep(35);}
  const filterSource=frame.locator('.platform-filter-chip-source--liquid');
  await wait(()=>filterSource.locator('[data-platform-filter-id]').count().then(count=>count>=16),'Long filter menu did not propagate');
  const overflow=await filterSource.evaluate(node=>({client:node.clientWidth,scroll:node.scrollWidth,x:getComputedStyle(node).overflowX}));
  assert(overflow.scroll>overflow.client&&['auto','scroll'].includes(overflow.x),`Filter inner scroller regressed: ${JSON.stringify(overflow)}`);
  pass('filter outer paint','wrapper visible + inner rail remains horizontally scrollable');

  frame=await selectModule(page,'collection-bottom-sheet');
  await sleep(250);
  const photoGeometry=await frame.locator('#collectionSheet').evaluate(sheet=>{
    const close=sheet.querySelector('.collection-close');
    const handle=sheet.querySelector('.collection-handle');
    const cs=getComputedStyle(sheet),cc=getComputedStyle(close),ch=getComputedStyle(handle);
    return {radius:cs.borderTopLeftRadius,width:sheet.getBoundingClientRect().width,closeW:close.getBoundingClientRect().width,closeRadius:cc.borderRadius,handleW:handle.getBoundingClientRect().width,handleH:handle.getBoundingClientRect().height};
  });
  frame=await selectModule(page,'bottom-sheet');
  const portableGeometry=await frame.locator('.platform-bottom-sheet__panel').evaluate(panel=>{
    const close=panel.querySelector('.platform-bottom-sheet__head>button');
    const handle=panel.querySelector('.platform-bottom-sheet__handle');
    const cs=getComputedStyle(panel),cc=getComputedStyle(close);
    return {radius:cs.borderTopLeftRadius,width:panel.getBoundingClientRect().width,closeW:close.getBoundingClientRect().width,closeRadius:cc.borderRadius,handleW:handle.getBoundingClientRect().width,handleH:handle.getBoundingClientRect().height,bottom:Math.round(panel.getBoundingClientRect().bottom),viewport:innerHeight};
  });
  assert(portableGeometry.radius===photoGeometry.radius,`Bottom sheet top radius mismatch: ${portableGeometry.radius} vs ${photoGeometry.radius}`);
  assert(portableGeometry.closeW===photoGeometry.closeW,`Bottom sheet close size mismatch: ${portableGeometry.closeW} vs ${photoGeometry.closeW}`);
  assert(portableGeometry.closeRadius==='50%',`Bottom sheet close is not circular: ${portableGeometry.closeRadius}`);
  assert(portableGeometry.handleW===photoGeometry.handleW&&portableGeometry.handleH===photoGeometry.handleH,`Bottom sheet handle mismatch: ${portableGeometry.handleW}x${portableGeometry.handleH}`);
  assert(Math.abs(portableGeometry.bottom-portableGeometry.viewport)<=1,'Portable bottom sheet is not anchored to viewport bottom');
  pass('bottom popup visual contract','portable sheet matches Photography shell close/radius/handle placement');
  await shot(page,'module-family-controls');

  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded',timeout:45000});
  await wait(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry?.get?.('screen-mode-selector'))),'Editor did not load shared Registry extension',25000);
  const editorAudit=await page.evaluate(()=>({
    ids:window.PlatformModuleRegistry.listFor('editor').map(item=>item.id),
    labels:Object.fromEntries(window.PlatformModuleRegistry.listFor('editor').map(item=>[item.id,item.label])),
    variants:window.__PLATFORM_BLOCK_REGISTRY_MANIFEST?.blocks?.find(item=>item.type==='ui-module')?.variants||[]
  }));
  assert(editorAudit.ids.includes('screen-mode-selector')&&editorAudit.variants.includes('screen-mode-selector'),'Screen-mode module missing from Editor');
  assert(editorAudit.labels['device-handoff-accordion']==='기기 연결 아코디언'&&editorAudit.labels.accordion==='기본 아코디언','Editor accordion labels not shared');
  assert(editorAudit.labels['collection-bottom-sheet']==='내 모음 하단 팝업'&&editorAudit.labels['bottom-sheet']==='범용 하단 시트','Editor popup labels not shared');
  pass('Editor shared Registry','new module and formal family labels available in Editor');

  report.status='pass';report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(`Library module family QA OK: ${report.checks.length} checks.`);
  await page.close();
}catch(error){
  report.status='fail';report.error=String(error?.stack||error);report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;
}finally{await browser.close();}
