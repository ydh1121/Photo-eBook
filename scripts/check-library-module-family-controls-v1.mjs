import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=(process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT=path.resolve('artifacts/library-module-family-controls-v1');
fs.mkdirSync(OUT,{recursive:true});
const report={startedAt:new Date().toISOString(),base:BASE,checks:[]};
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
const assert=(value,message)=>{if(!value)throw new Error(message);};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pass=(name,detail='')=>{report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);};
assert(executable,'Chrome/Chromium missing');
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});

async function wait(fn,message,timeout=20000){const started=Date.now();let error;while(Date.now()-started<timeout){try{if(await fn())return;}catch(e){error=e;}await sleep(80);}if(error)throw error;throw new Error(message);}
async function frameFor(page,id){
  const button=page.locator(`[data-kit-ui="${id}"]`);assert(await button.count()===1,`Missing tree module: ${id}`);await button.click();
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`[data-platform-module="${moduleId}"]`));},id),`Preview did not mount ${id}`);
  const handle=await page.$('#builderFrame');const frame=await handle?.contentFrame();assert(frame,`Missing preview frame: ${id}`);return frame;
}
async function openInspector(page){if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'Inspector did not open');}
async function setStyle(page,id,value){await openInspector(page);const control=page.locator(`[data-style-control="${id}"]`);assert(await control.count()===1,`Missing style control ${id}`);const tag=await control.evaluate(node=>node.tagName);if(tag==='SELECT')await control.selectOption(String(value));else if((await control.getAttribute('type'))==='checkbox'){if(await control.isChecked()!==Boolean(value))await control.click();}else await control.evaluate((node,next)=>{node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);await sleep(120);}

try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  await page.goto(`${BASE}/ui-dashboard/?view=library`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibrarySidebarV1'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('.platform-admin-shell__module-tree').count().then(Boolean),'Library module tree missing');
  await page.waitForFunction(()=>Boolean(window.PlatformModuleRegistry));

  const tree=await page.evaluate(()=>{
    const ids=window.PlatformModuleRegistry.listFor('library').map(item=>item.id);
    const buttons=[...document.querySelectorAll('.platform-admin-shell__module-tree [data-kit-ui]')].map(node=>node.dataset.kitUi);
    const top=[...document.querySelectorAll('#builderLibraryFilters [data-kit-ui]')].map(node=>node.dataset.kitUi);
    const groups=[...document.querySelectorAll('[data-module-tree-group]')].map(group=>({id:group.dataset.moduleTreeGroup,items:[...group.querySelectorAll('[data-kit-ui]')].map(node=>node.dataset.kitUi)}));
    return {ids,buttons,top,groups,duplicates:buttons.length-new Set(buttons).size};
  });
  assert(tree.ids.length===10,`Expected 10 approved Library modules, got ${tree.ids.length}`);
  assert(tree.buttons.length===tree.ids.length&&tree.ids.every(id=>tree.buttons.includes(id)),'Tree is not driven by all Registry Library entries');
  assert(tree.top.length===0,'Old top horizontal module catalog still owns module buttons');
  assert(tree.duplicates===0,'Module buttons were cloned instead of moved');
  const expectedGroups={navigation:['top-chapter-navigation','filter-chip-rail'],'horizontal-content':['horizontal-card-rail','horizontal-rail'],accordion:['device-handoff-accordion','accordion'],'bottom-popup':['collection-bottom-sheet','bottom-sheet'],action:['floating-action'],display:['screen-mode-selector']};
  for(const [id,items] of Object.entries(expectedGroups)){
    const group=tree.groups.find(item=>item.id===id);assert(group,`Missing tree group ${id}`);assert(group.items.join('|')===items.join('|'),`Tree group ${id} mismatch: ${group.items.join('|')}`);
  }
  pass('Registry-driven Library tree',`${tree.ids.length} real Registry buttons moved into 6 hierarchy groups`);

  const sidebarBefore=await page.locator('.platform-admin-shell').evaluate(node=>node.getBoundingClientRect().width);
  await page.locator('[data-library-tree-collapse]').click();
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminSidebarCollapsed==='true'),'Sidebar did not collapse by button');
  assert(await page.locator('.platform-admin-shell__reopen').isVisible(),'Sidebar reopen affordance missing');
  await page.locator('.platform-admin-shell__reopen').click();
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminSidebarCollapsed==='false'),'Sidebar did not reopen');
  const resize=page.locator('.platform-admin-shell__resize-handle');
  await resize.evaluate(node=>{
    const fire=(type,x)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:91,pointerType:'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:180}));
    fire('pointerdown',260);fire('pointermove',320);fire('pointerup',320);
  });
  await sleep(100);
  const sidebarAfter=await page.locator('.platform-admin-shell').evaluate(node=>node.getBoundingClientRect().width);
  assert(sidebarAfter>sidebarBefore+20,`Sidebar drag resize did not change width: ${sidebarBefore} -> ${sidebarAfter}`);
  pass('Collapsible/resizable sidebar',`button collapse/reopen + drag ${Math.round(sidebarBefore)}→${Math.round(sidebarAfter)}px`);

  let frame=await frameFor(page,'horizontal-rail');
  await openInspector(page);
  for(const id of ['desktopDrag','leftShadowGuard','leftPaintRunway','leftFade','rightFade','rightFadeWidth','rightContentPadding','scrollbar','dragThreshold','clickSuppressMs'])assert(await page.locator(`[data-style-control="${id}"]`).count()===1,`Horizontal rail setting missing: ${id}`);
  await setStyle(page,'rightFade',false);await setStyle(page,'leftFade',true);await setStyle(page,'desktopDrag',false);await setStyle(page,'rightContentPadding',148);
  const railRuntime=await frame.locator('.platform-horizontal-rail__track').evaluate(node=>({desktop:node.dataset.moduleDesktopDrag,paddingRight:getComputedStyle(node).paddingRight,paddingBottom:getComputedStyle(node).paddingBottom,mask:getComputedStyle(node).maskImage,overflow:getComputedStyle(node).overflowX}));
  assert(railRuntime.desktop==='false','Horizontal rail desktop drag toggle is a no-op');
  assert(parseFloat(railRuntime.paddingRight)>=147,'Horizontal rail right padding setting is a no-op');
  assert(parseFloat(railRuntime.paddingBottom)>=34,`Horizontal rail shadow paint runway is too small: ${railRuntime.paddingBottom}`);
  assert(railRuntime.mask!=='none','Horizontal rail left fade did not apply');
  pass('Horizontal rail canonical controls',`fade/drag/padding live + ${railRuntime.paddingBottom} bottom shadow runway`);

  frame=await frameFor(page,'device-handoff-accordion');await sleep(600);
  assert(await frame.locator('.theme-setting-card,[data-theme-setting-card]').count()===0,'Screen mode page context still leaks into device accordion preview');
  const deviceText=await frame.locator('[data-platform-module="device-handoff-accordion"]').innerText();assert(!deviceText.includes('화면 모드'),'Device accordion still owns screen mode');

  frame=await frameFor(page,'screen-mode-selector');
  assert(await frame.locator('.platform-screen-mode-composed [data-platform-module="filter-chip-rail"]').count()===1,'Screen mode is not composed from canonical filter-chip module');
  assert(await frame.locator('.platform-screen-mode__options').count()===0,'Retired duplicate screen-mode segmented skin is still rendered');
  await frame.locator('[data-platform-filter-id="dark"]').first().click();
  await wait(()=>frame.locator('html').evaluate(node=>node.dataset.theme==='dark'),'Composed screen mode did not change runtime theme');
  pass('Screen mode canonical composition','actual filter-chip-rail module drives light/dark/system');

  frame=await frameFor(page,'collection-bottom-sheet');await sleep(250);
  const photoPopup=await frame.evaluate(()=>{const panel=document.querySelector('.collection-sheet'),close=document.querySelector('.collection-close'),handle=document.querySelector('.collection-handle');const p=getComputedStyle(panel),c=close?.getBoundingClientRect(),h=handle?.getBoundingClientRect();return {radius:p.borderTopLeftRadius,width:panel?.getBoundingClientRect().width,closeW:c?.width,closeH:c?.height,handleW:h?.width,handleH:h?.height};});
  frame=await frameFor(page,'bottom-sheet');
  const genericPopup=await frame.evaluate(()=>{const panel=document.querySelector('.platform-bottom-sheet__panel'),close=document.querySelector('.platform-bottom-sheet__head>button'),handle=document.querySelector('.platform-bottom-sheet__handle');const p=getComputedStyle(panel),c=close?.getBoundingClientRect(),h=handle?.getBoundingClientRect();return {radius:p.borderTopLeftRadius,width:panel?.getBoundingClientRect().width,closeW:c?.width,closeH:c?.height,handleW:h?.width,handleH:h?.height};});
  assert(genericPopup.radius===photoPopup.radius,`Bottom popup radius drift: ${photoPopup.radius} vs ${genericPopup.radius}`);
  assert(Math.abs((genericPopup.closeW||0)-(photoPopup.closeW||0))<1&&Math.abs((genericPopup.closeH||0)-(photoPopup.closeH||0))<1,'Bottom popup close button geometry drift');
  assert(Math.abs((genericPopup.handleW||0)-(photoPopup.handleW||0))<1&&Math.abs((genericPopup.handleH||0)-(photoPopup.handleH||0))<1,'Bottom popup handle geometry drift');
  const primary=frame.locator('[data-bottom-sheet-action="primary"]');if(await primary.count()){await primary.click();await wait(()=>frame.locator('[data-platform-module="bottom-sheet"]').evaluate(node=>node.dataset.open==='false'),'Primary no-action button did not close generic bottom popup');}
  pass('Shared bottom-popup shell',`radius ${genericPopup.radius}, close ${genericPopup.closeW}×${genericPopup.closeH}, handle ${genericPopup.handleW}×${genericPopup.handleH}`);

  const ownership=await page.evaluate(()=>{
    const defs=window.PlatformModuleRegistry.listFor('library');
    return defs.map(def=>({id:def.id,consumers:def.consumers,owners:def.ownerFiles,render:typeof def.render,hydrate:typeof def.hydrate}));
  });
  assert(ownership.every(item=>item.render==='function'),'Approved Library module without Registry render owner');
  assert(ownership.every(item=>!item.owners.some(file=>file.includes('/block-lab/'))),'Approved Library module imports Block Lab runtime directly');
  const photo=ownership.find(item=>item.id==='collection-bottom-sheet'),generic=ownership.find(item=>item.id==='bottom-sheet'),screen=ownership.find(item=>item.id==='screen-mode-selector'),filter=ownership.find(item=>item.id==='filter-chip-rail');
  assert(photo?.owners.includes('public/assets/styles/platform-modules/bottom-popup-shared-v1.css')&&generic?.owners.includes('public/assets/styles/platform-modules/bottom-popup-shared-v1.css'),'Bottom popup variants do not share the extracted shell owner');
  assert(filter?.owners.every(owner=>screen?.owners.includes(owner)),'Screen mode does not declare canonical filter-chip owner dependencies');
  pass('Canonical ownership','no Block Lab runtime imports; shared popup/filter owners declared');

  const libraryIds=tree.ids;
  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry)),'Editor Registry missing');
  await wait(()=>page.locator('[data-add-module]').count().then(count=>count>=libraryIds.length),'Editor module catalog did not include all Library modules');
  const editorIds=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('editor').map(item=>item.id));
  assert(libraryIds.every(id=>editorIds.includes(id)),`Library/Editor Registry drift: editor=${editorIds.join(',')}`);
  pass('Library → Editor Registry parity',`${libraryIds.length} approved module IDs available to Editor`);

  report.status='pass';report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  await page.screenshot({path:path.join(OUT,'library-tree.png'),fullPage:true});
  console.log(`Library architecture/tree QA OK: ${report.checks.length} checks.`);
  await page.close();
}catch(error){
  report.status='fail';report.error=String(error?.stack||error);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.error(error);process.exitCode=1;
}finally{await browser.close();}
