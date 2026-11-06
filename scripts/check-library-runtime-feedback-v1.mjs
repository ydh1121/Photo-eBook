import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const OUT=path.resolve('artifacts/library-runtime-feedback-v1');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[],screenshots:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(value,message)=>{if(!value)throw new Error(message);};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function wait(fn,message,timeout=16000){const started=Date.now();let last;while(Date.now()-started<timeout){try{if(await fn())return;}catch(error){last=error;}await sleep(80);}if(last)throw last;throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
async function shot(page,name){await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});report.screenshots.push(`${name}.png`);}
async function computed(locator,property){return locator.evaluate((node,key)=>getComputedStyle(node)[key],property);}

async function openLibrary(page){
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibraryThemeV3','platformLibraryViewportV3'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('[data-kit-ui="top-chapter-navigation"]').count().then(Boolean),'Library selector missing');
}
async function selectModule(page,id){
  const button=page.locator(`[data-kit-ui="${id}"]`);assert(await button.count()===1,`Missing Library module: ${id}`);await button.click();
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));},id),`Module frame missing: ${id}`,20000);
  return page.frameLocator('#builderFrame');
}
async function openInspector(page){if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'Inspector did not open');}
async function setControl(page,id,value){await openInspector(page);const control=page.locator(`[data-style-control="${id}"]`);assert(await control.count()===1,`Missing control: ${id}`);const tag=await control.evaluate(node=>node.tagName);if(tag==='SELECT')await control.selectOption(String(value));else if((await control.getAttribute('type'))==='checkbox'){if(Boolean(value)!==await control.isChecked())await control.click();}else await control.evaluate((node,next)=>{node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);await sleep(160);}
async function setViewport(page,value){const button=page.locator(`[data-kit-viewport="${value}"]`);if(await button.getAttribute('aria-pressed')!=='true')await button.click();await wait(()=>page.locator('.builder-kit-workspace').evaluate((node,v)=>node.dataset.viewport===v,value),`Viewport did not become ${value}`);await sleep(120);}

async function auditApprovedPublicRails(){
  // Spec 23 scopes the approved horizontal-rail use to learning composition.
  // A fresh context keeps the Library edits above out of the public-page audit.
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  try{
    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
    await wait(()=>page.locator('#app').isVisible(),'Photography app did not become visible');
    const photo=await page.evaluate(()=>({
      chapters:document.querySelectorAll('#app .chapter').length,
      primitiveScripts:document.querySelectorAll('script[src*="/portable-primitives-v1.js"]').length,
      primitiveRoots:document.querySelectorAll('[data-platform-module="horizontal-rail"],[data-platform-module="accordion"],[data-platform-module="bottom-sheet"]').length
    }));
    assert(photo.chapters===10,`Photography chapter baseline changed: ${photo.chapters}`);
    assert(photo.primitiveScripts===0,'Portable primitive base was linked into Photography');
    assert(photo.primitiveRoots===0,'Portable primitive content was mounted into Photography');
    pass('Photography portable isolation','10 chapters; no primitive base script or primitive content roots');

    for(const subject of ['video','ai','community','real-estate','auction']){
      await page.goto(`${BASE}/${subject}/`,{waitUntil:'domcontentloaded'});
      await wait(()=>page.locator('#app').isVisible(),`${subject}: learning app did not become visible`);
      await wait(()=>page.locator('#app .edu-chapter[data-learning-bound="true"] .platform-horizontal-rail__track[data-platform-rail-bound-v2="true"]').count().then(Boolean),`${subject}: canonical horizontal rail did not hydrate`);
      const mounted=await page.evaluate(()=>{
        const modules=window.PlatformModuleRegistry;
        const rails=[...document.querySelectorAll('#app [data-platform-module="horizontal-rail"]')];
        return {
          chapters:document.querySelectorAll('#app .edu-chapter').length,
          railCount:rails.length,
          allowed:modules?.canConsume('horizontal-rail','public')===true,
          forbiddenConsumers:['accordion','bottom-sheet'].filter(id=>modules?.canConsume(id,'public')),
          forbiddenRoots:document.querySelectorAll('[data-platform-module="accordion"],[data-platform-module="bottom-sheet"]').length,
          approvedPlacement:rails.every(rail=>Boolean(rail.closest('[data-platform-module="learning-guide-section"],[data-platform-module="learning-resource-rail"]'))),
          bound:rails.every(rail=>rail.querySelector('.platform-horizontal-rail__track')?.dataset.platformRailBoundV2==='true'),
          canonicalOwner:modules?.get('horizontal-rail')?.ownerFiles.includes('public/assets/js/platform-modules/portable-primitives-v1.js')===true
        };
      });
      assert(mounted.chapters===9,`${subject}: expected nine learning chapters, got ${mounted.chapters}`);
      assert(mounted.allowed&&mounted.canonicalOwner,`${subject}: approved rail lost its public canonical owner`);
      assert(mounted.railCount>0&&mounted.approvedPlacement&&mounted.bound,`${subject}: rail is missing, outside approved learning composition, or not hydrated`);
      assert(mounted.forbiddenConsumers.length===0&&mounted.forbiddenRoots===0,`${subject}: unapproved accordion/bottom-sheet public exposure`);
      pass(`approved Public rail ${subject}`,`${mounted.railCount} hydrated canonical rails inside approved learning parents`);
    }
  }finally{await context.close();}
}

try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await openLibrary(page);

  const shadow=await computed(page.locator('.builder-kit-frame-shell'),'boxShadow');
  assert(shadow==='none','Library preview frame still paints a ghost rectangle');
  pass('preview frame decoration','no artificial iframe shadow');

  let frame=await selectModule(page,'top-chapter-navigation');
  await wait(()=>frame.locator('.nav-chip.is-active').count().then(Boolean),'Active top-nav chip missing');
  const chip=frame.locator('.nav-chip.is-active').first();
  const indicator=frame.locator('.nav-v33-indicator').first();
  const liquidStyle={background:await computed(chip,'backgroundColor'),radius:await computed(chip,'borderRadius'),shadow:await computed(chip,'boxShadow')};
  await setControl(page,'chipFamily','ios-flat');
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.moduleStyleFamily==='ios-flat'),'iOS Flat family not applied');
  const iosStyle={background:await computed(chip,'backgroundColor'),radius:await computed(chip,'borderRadius'),shadow:await computed(chip,'boxShadow')};
  assert(JSON.stringify(iosStyle)!==JSON.stringify(liquidStyle),`iOS Flat is visually identical to liquid: ${JSON.stringify(iosStyle)}`);
  assert(await computed(indicator,'display')==='none','iOS Flat still shows liquid indicator');
  await setControl(page,'chipFamily','material-flat');
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>node.dataset.moduleStyleFamily==='material-flat'),'Material family not applied');
  const materialStyle={background:await computed(chip,'backgroundColor'),radius:await computed(chip,'borderRadius'),shadow:await computed(chip,'boxShadow')};
  assert(JSON.stringify(materialStyle)!==JSON.stringify(iosStyle),`Material is visually identical to iOS Flat: ${JSON.stringify(materialStyle)}`);
  assert(await computed(frame.locator('.nav-chip').nth(1),'borderRadius')!=='999px','Material inactive chip kept iOS pill geometry');
  await setControl(page,'chipFamily','ios-liquid');
  await wait(()=>frame.locator('.nav-scroll').evaluate(node=>!node.hasAttribute('data-module-style-family')),'Liquid family did not return to canonical owner');
  pass('top-nav chip families',`liquid → iOS Flat → Material have measurable skin differences`);
  await shot(page,'top-nav-families');

  frame=await selectModule(page,'filter-chip-rail');
  await openInspector(page);
  for(let i=0;i<14;i++){await page.locator('[data-menu-add]').click();await sleep(60);}
  const source=frame.locator('.platform-filter-chip-source--liquid');
  await wait(()=>source.locator('[data-platform-filter-id]').count().then(count=>count>=18),'Long filter menu did not propagate',20000);
  await setViewport(page,'desktop');
  const before=await source.evaluate(node=>({left:node.scrollLeft,client:node.clientWidth,scroll:node.scrollWidth,overflow:getComputedStyle(node).overflowX,drag:node.dataset.platformFilterDragBound}));
  assert(before.scroll>before.client,'Desktop filter rail does not overflow');
  assert(before.drag==='true','Desktop filter drag owner is not bound');
  await source.evaluate(node=>{
    node.scrollLeft=0;
    const fire=(type,x)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:77,pointerType:'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:20}));
    fire('pointerdown',280);fire('pointermove',90);fire('pointerup',90);
  });
  await sleep(80);
  const dragged=await source.evaluate(node=>node.scrollLeft);
  assert(dragged>80,`PC mouse drag did not move filter rail: ${dragged}`);
  await setViewport(page,'mobile');
  const mobile=await source.evaluate(node=>({touch:getComputedStyle(node).touchAction,overflow:getComputedStyle(node).overflowX,client:node.clientWidth,scroll:node.scrollWidth}));
  assert(mobile.touch==='pan-x','Mobile filter rail does not expose native pan-x');
  assert(['auto','scroll'].includes(mobile.overflow),'Mobile filter rail overflow-x is not scrollable');
  assert(mobile.scroll>mobile.client,'Mobile filter rail has no horizontal overflow');
  pass('filter horizontal interaction',`PC mouse drag ${Math.round(dragged)}px + mobile native pan-x`);
  await shot(page,'filter-horizontal-scroll');
  await setViewport(page,'desktop');

  frame=await selectModule(page,'horizontal-rail');
  await openInspector(page);
  await wait(()=>page.locator('[data-primitive-editor="horizontal-rail"]').count().then(Boolean),'Horizontal rail editor v2 missing');
  for(const selector of ['[data-rail-tags="1"]','[data-rail-meta="1"]','[data-rail-action-label="1"]','[data-rail-action-url="1"]'])assert(await page.locator(selector).count()===1,`Missing rail field ${selector}`);
  await page.locator('[data-rail-tags="1"]').fill('신규, 중요');
  await page.locator('[data-rail-meta="1"]').fill('테스트 메타');
  await page.locator('[data-rail-action-label="1"]').fill('자세히 보기');
  await page.locator('[data-rail-action-url="1"]').fill('/details');
  await wait(()=>frame.locator('.platform-horizontal-rail__card').nth(1).locator('.platform-horizontal-rail__tags span').count().then(count=>count===2),'Rail badges did not update live');
  await page.locator('[data-rail-up="1"]').click();
  await wait(()=>frame.locator('.platform-horizontal-rail__card').first().locator('h4').textContent().then(text=>text?.trim()==='두 번째 카드'),'Rail reorder did not propagate');
  const moved=await frame.locator('.platform-horizontal-rail__card').first().evaluate(node=>({tags:[...node.querySelectorAll('.platform-horizontal-rail__tags span')].map(item=>item.textContent.trim()),meta:node.querySelector('.platform-horizontal-rail__meta')?.textContent?.trim()||'',action:node.querySelector('[data-horizontal-rail-action]')?.textContent?.trim()||'',href:node.querySelector('[data-horizontal-rail-action]')?.getAttribute('href')||''}));
  assert(JSON.stringify(moved.tags)===JSON.stringify(['신규','중요']),`Rail badges disappeared after reorder: ${JSON.stringify(moved.tags)}`);
  assert(moved.meta==='테스트 메타','Rail meta disappeared after reorder');
  assert(moved.action==='자세히 보기'&&moved.href==='/details','Rail action disappeared after reorder');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('platformModuleContentDefaultsV1')||'{}')['horizontal-rail']);
  assert(saved?.items?.[0]?.tags?.join('|')==='신규|중요','Saved rail tags were not preserved');
  assert(saved?.items?.[0]?.meta==='테스트 메타','Saved rail meta was not preserved');
  assert(saved?.items?.[0]?.actionLabel==='자세히 보기'&&saved?.items?.[0]?.actionUrl==='/details','Saved rail action was not preserved');
  pass('horizontal rail content completeness','badges/meta/action survive live editing and reorder');

  frame=await selectModule(page,'accordion');
  await openInspector(page);
  assert(await page.locator('[data-accordion-open-first]').count()===1,'Accordion open-first control missing');
  assert(await page.locator('[data-accordion-open-ids]').count()===1,'Accordion openIds control missing');
  assert(await page.locator('[data-accordion-meta="0"]').count()===1,'Accordion item meta control missing');
  pass('accordion functional controls','open-first/openIds/item meta exposed');

  frame=await selectModule(page,'bottom-sheet');
  await openInspector(page);
  for(const selector of ['[data-sheet-open]','[data-sheet-show-launcher]','[data-sheet-launcher-label]','[data-sheet-dismiss-backdrop]','[data-sheet-action-type="secondary"]','[data-sheet-action-type="primary"]'])assert(await page.locator(selector).count()===1,`Bottom sheet field missing: ${selector}`);
  pass('bottom-sheet functional controls','initial state/launcher/backdrop/primary+secondary actions exposed');

  const registryAudit=await page.evaluate(()=>{
    const modules=window.PlatformModuleRegistry;
    const pick=id=>{const def=modules.get(id);return {id,status:def?.status,source:def?.source,consumers:def?.consumers||[],dependencies:def?.dependencies||[],ownerFiles:def?.ownerFiles||[],render:typeof def?.render,hydrate:typeof def?.hydrate};};
    return {photo:pick('top-chapter-navigation'),filter:pick('filter-chip-rail'),rail:pick('horizontal-rail'),accordion:pick('accordion'),sheet:pick('bottom-sheet'),learning:pick('learning-guide-section'),resources:pick('learning-resource-rail')};
  });
  assert(registryAudit.photo.consumers.includes('public')&&registryAudit.photo.consumers.includes('library')&&registryAudit.photo.consumers.includes('editor'),'Photography canonical module consumer contract broken');
  assert(registryAudit.filter.ownerFiles.includes('public/assets/js/platform-modules/photo-core-modules-v1.js'),'Filter canonical definition owner missing from provenance');
  for(const key of ['rail','accordion','sheet']){
    assert(registryAudit[key].render==='function',`${key} has no canonical render owner`);
    assert(registryAudit[key].consumers.includes('library')&&registryAudit[key].consumers.includes('editor'),`${key} Library/Editor shared consumer contract broken`);
    assert(!registryAudit[key].ownerFiles.some(file=>file.includes('/block-lab/')),`${key} imports Block Lab runtime directly`);
  }
  assert(registryAudit.rail.status==='approved'&&registryAudit.rail.consumers.includes('public')&&registryAudit.rail.consumers.includes('export'),'Approved learning horizontal rail is unavailable to Public/export');
  assert(registryAudit.rail.hydrate==='function'&&registryAudit.rail.ownerFiles.includes('public/assets/js/platform-modules/portable-primitives-v1.js'),'Approved rail lost its canonical runtime owner');
  for(const key of ['learning','resources']){
    const parent=registryAudit[key];
    assert(parent.status==='approved'&&parent.consumers.includes('public'),`${parent.id} is not an approved Public parent`);
    assert(parent.dependencies.some(item=>item.id==='horizontal-rail'&&item.kind==='composition'&&item.required===true),`${parent.id} lost its required canonical horizontal-rail dependency`);
  }
  assert(!registryAudit.accordion.consumers.includes('public')&&!registryAudit.sheet.consumers.includes('public'),'Unapproved accordion/bottom-sheet primitives were connected to Public');
  pass('canonical ownership audit','approved learning horizontal-rail composition; accordion/bottom-sheet Public boundary remains closed');
  await auditApprovedPublicRails();

  report.status='pass';
  report.completedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(`Library runtime feedback QA OK: ${report.checks.length} checks.`);
  await page.close();
}catch(error){
  report.status='fail';report.error=String(error?.stack||error);report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;
}finally{await browser.close();}
