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
  await wait(()=>page.evaluate(moduleId=>{const frame=document.querySelector('#builderFrame'),doc=frame?.contentDocument;return Boolean(doc?.documentElement?.dataset.platformModule===moduleId&&doc.querySelector(`#platformModuleHost [data-platform-module="${CSS.escape(moduleId)}"]`));},id),`Preview did not mount ${id}`);
  const handle=await page.$('#builderFrame');const frame=await handle?.contentFrame();assert(frame,`Missing preview frame: ${id}`);return frame;
}
async function openInspector(page){if(await page.locator('.builder-kit-inspector:not([hidden])').count())return;await page.locator('#kitSettings').click();await wait(()=>page.locator('.builder-kit-inspector:not([hidden])').count().then(Boolean),'Inspector did not open');}
async function setStyle(page,id,value){await openInspector(page);const control=page.locator(`[data-style-control="${id}"]`);assert(await control.count()===1,`Missing style control ${id}`);const tag=await control.evaluate(node=>node.tagName);if(tag==='SELECT')await control.selectOption(String(value));else if((await control.getAttribute('type'))==='checkbox'){if(await control.isChecked()!==Boolean(value))await control.click();}else await control.evaluate((node,next)=>{node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},value);await sleep(120);}

try{
  const page=await browser.newPage({viewport:{width:1500,height:1000}});
  await page.goto(`${BASE}/ui-dashboard/?view=library`,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{for(const key of ['platformModuleDefaultsV1','platformModuleContentDefaultsV1','platformLibraryStateV3','platformLibrarySidebarV1','platformLibrarySidebarV2','platformAdminThemeV1','platformAdminSidebarWidthV1','platformLibraryThemeV3','platformLibraryViewportV3'])localStorage.removeItem(key);});
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('.platform-admin-shell__module-tree').count().then(Boolean),'Library module tree missing');
  await wait(()=>page.locator('.builder-kit-preview-toolbar').count().then(Boolean),'Library preview toolbar missing');
  await page.waitForFunction(()=>Boolean(window.PlatformModuleRegistry));

  const tree=await page.evaluate(()=>{
    const ids=window.PlatformModuleRegistry.listFor('library').map(item=>item.id);
    const buttons=[...document.querySelectorAll('.platform-admin-shell__module-tree [data-kit-ui]')].map(node=>node.dataset.kitUi);
    const top=[...document.querySelectorAll('#builderLibraryFilters [data-kit-ui]')].map(node=>node.dataset.kitUi);
    const groups=[...document.querySelectorAll('[data-module-tree-group]')].filter(group=>!group.hidden).map(group=>({id:group.dataset.moduleTreeGroup,items:[...group.querySelectorAll('[data-kit-ui]')].map(node=>node.dataset.kitUi),hasIcon:Boolean(group.querySelector('summary svg')),open:group.open}));
    const toolbar={theme:Boolean(document.querySelector('.builder-kit-preview-toolbar #kitTheme')),viewport:Boolean(document.querySelector('.builder-kit-preview-toolbar #kitViewport')),settings:Boolean(document.querySelector('.builder-kit-preview-toolbar #kitSettings'))};
    return {ids,buttons,top,groups,toolbar,duplicates:buttons.length-new Set(buttons).size};
  });
  assert(tree.ids.length===10,`Expected 10 approved Library modules, got ${tree.ids.length}`);
  assert(tree.buttons.length===tree.ids.length&&tree.ids.every(id=>tree.buttons.includes(id)),'Tree is not driven by all Registry Library entries');
  assert(tree.top.length===0,'Old top horizontal module catalog still owns module buttons');
  assert(tree.duplicates===0,'Module buttons were cloned instead of moved');
  assert(tree.groups.every(group=>group.hasIcon),'A Library hierarchy group is missing its icon');
  assert(tree.toolbar.theme&&tree.toolbar.viewport&&tree.toolbar.settings,'Preview theme/viewport/style controls are not grouped above the canvas');
  const expectedGroups={navigation:['top-chapter-navigation','filter-chip-rail'],'horizontal-content':['horizontal-card-rail','horizontal-rail'],accordion:['device-handoff-accordion','accordion'],'bottom-popup':['collection-bottom-sheet','bottom-sheet'],action:['floating-action'],display:['screen-mode-selector']};
  for(const [id,items] of Object.entries(expectedGroups)){
    const group=tree.groups.find(item=>item.id===id);assert(group,`Missing tree group ${id}`);assert(group.items.join('|')===items.join('|'),`Tree group ${id} mismatch: ${group.items.join('|')}`);
  }
  pass('Registry-driven Library tree',`${tree.ids.length} real Registry buttons in 6 icon hierarchy groups; preview controls grouped above canvas`);

  await wait(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='light'),'Default Library preview did not stay light');
  const previewThemeBefore=await page.evaluate(()=>localStorage.getItem('platformLibraryThemeV3'));
  await page.locator('[data-admin-theme-value="dark"]').click();
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminThemeResolved==='dark'),'Admin dark theme did not apply');
  const adminIsolation=await page.evaluate(()=>({admin:document.documentElement.dataset.adminTheme,previewStored:localStorage.getItem('platformLibraryThemeV3'),frameTheme:document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme}));
  assert(adminIsolation.admin==='dark','Admin theme choice did not persist');
  assert(adminIsolation.previewStored===previewThemeBefore,'Admin theme mutated Library preview theme storage');
  assert(adminIsolation.frameTheme==='light','Admin dark theme leaked into Library preview iframe');
  await page.locator('[data-kit-theme="dark"]').click();
  await wait(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='dark'),'Preview dark control did not change iframe');
  assert(await page.locator('html').evaluate(node=>node.dataset.adminThemeResolved)==='dark','Preview theme mutated admin theme');
  await page.locator('[data-kit-theme="light"]').click();
  await wait(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='light'),'Preview did not return to light');
  pass('Admin / preview theme isolation','admin dark is independent from Library target light/dark controls');

  const shell=page.locator('.platform-admin-shell');
  const sidebarBefore=await shell.evaluate(node=>node.getBoundingClientRect().width);
  await page.locator('[data-library-tree-collapse]').click();
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminSidebarCollapsed==='true'),'Sidebar did not collapse by button');
  await sleep(260);
  const collapsedRect=await shell.evaluate(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};});
  assert(collapsedRect.width>230,`Collapsed shell width was crushed: ${collapsedRect.width}`);
  assert(collapsedRect.right<=0,`Collapsed shell still leaks into viewport: ${JSON.stringify(collapsedRect)}`);
  assert(await page.locator('.platform-admin-shell__reopen').isVisible(),'Sidebar reopen affordance missing');
  await page.locator('.platform-admin-shell__reopen').click();
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminSidebarCollapsed==='false'),'Sidebar did not reopen');
  await sleep(220);
  const reopenedLeft=await shell.evaluate(node=>node.getBoundingClientRect().left);
  assert(Math.abs(reopenedLeft)<2,`Sidebar did not return to viewport edge: ${reopenedLeft}`);
  const resize=page.locator('.platform-admin-shell__resize-handle');
  await resize.evaluate((node,start)=>{
    const fire=(type,x,buttons)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:91,pointerType:'mouse',button:0,buttons,clientX:x,clientY:180}));
    fire('pointerdown',start,1);fire('pointermove',start+60,1);fire('pointerup',start+60,0);
  },Math.round(sidebarBefore));
  await sleep(140);
  const sidebarAfter=await shell.evaluate(node=>node.getBoundingClientRect().width);
  assert(sidebarAfter>sidebarBefore+20,`Sidebar drag resize did not change width: ${sidebarBefore} -> ${sidebarAfter}`);
  const sharedWidth=Number(await page.evaluate(()=>localStorage.getItem('platformAdminSidebarWidthV1')));
  assert(Math.abs(sharedWidth-sidebarAfter)<3,`Shared admin width was not persisted: ${sharedWidth} vs ${sidebarAfter}`);
  pass('Collapsible/resizable sidebar',`full offscreen collapse + reopen + drag ${Math.round(sidebarBefore)}→${Math.round(sidebarAfter)}px`);

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
  const deviceText=await frame.locator('#platformModuleHost [data-platform-module="device-handoff-accordion"]').innerText();assert(!deviceText.includes('화면 모드'),'Device accordion still owns screen mode');

  frame=await frameFor(page,'screen-mode-selector');
  await wait(()=>page.locator('#builderFrameStatus').isHidden(),'Screen-mode preview did not reach ready state');
  await sleep(250);
  assert(await frame.locator('.platform-screen-mode-composed [data-platform-module="filter-chip-rail"]').count()===1,'Screen mode is not composed from canonical filter-chip module');
  assert(await frame.locator('.platform-screen-mode__options').count()===0,'Retired duplicate screen-mode segmented skin is still rendered');
  await frame.locator('[data-platform-filter-id="dark"]').first().click();
  await wait(()=>frame.locator('#platformModuleHost [data-platform-module="screen-mode-selector"]').evaluate(node=>node.dataset.screenMode==='dark'),'Composed screen mode did not consume filter selection');
  await wait(()=>frame.locator('html').evaluate(node=>node.dataset.theme==='dark'),'Composed screen mode did not change runtime theme');
  pass('Screen mode canonical composition','actual filter-chip-rail module drives light/dark/system');

  frame=await frameFor(page,'collection-bottom-sheet');await sleep(250);
  const photoPopup=await frame.evaluate(()=>{const panel=document.querySelector('.collection-sheet'),close=document.querySelector('.collection-close'),handle=document.querySelector('.collection-handle');const p=getComputedStyle(panel),c=close?.getBoundingClientRect(),h=handle?.getBoundingClientRect();return {radius:p.borderTopLeftRadius,width:panel?.getBoundingClientRect().width,closeW:c?.width,closeH:c?.height,handleW:h?.width,handleH:h?.height,closeDisplay:close?getComputedStyle(close).display:null};});
  frame=await frameFor(page,'bottom-sheet');
  const genericPopup=await frame.evaluate(()=>{const panel=document.querySelector('.platform-bottom-sheet__panel'),close=document.querySelector('.platform-bottom-sheet__head>button'),handle=document.querySelector('.platform-bottom-sheet__handle');const p=getComputedStyle(panel),c=close?.getBoundingClientRect(),h=handle?.getBoundingClientRect();return {radius:p.borderTopLeftRadius,width:panel?.getBoundingClientRect().width,closeW:c?.width,closeH:c?.height,handleW:h?.width,handleH:h?.height,closeDisplay:close?getComputedStyle(close).display:null};});
  report.popupGeometry={photoPopup,genericPopup};
  assert(genericPopup.radius===photoPopup.radius,`Bottom popup radius drift: ${photoPopup.radius} vs ${genericPopup.radius}`);
  assert(Math.abs((genericPopup.closeW||0)-(photoPopup.closeW||0))<1&&Math.abs((genericPopup.closeH||0)-(photoPopup.closeH||0))<1,`Bottom popup close button geometry drift: ${JSON.stringify({photoPopup,genericPopup})}`);
  assert(Math.abs((genericPopup.handleW||0)-(photoPopup.handleW||0))<1&&Math.abs((genericPopup.handleH||0)-(photoPopup.handleH||0))<1,`Bottom popup handle geometry drift: ${JSON.stringify({photoPopup,genericPopup})}`);
  const primary=frame.locator('[data-bottom-sheet-action="primary"]');if(await primary.count()){await primary.click();await wait(()=>frame.locator('#platformModuleHost [data-platform-module="bottom-sheet"]').evaluate(node=>node.dataset.open==='false'),'Primary no-action button did not close generic bottom popup');}
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

  /* Cross-route shell continuity: admin dark and sidebar width persist, while
     each target preview/canvas keeps its own light theme state. */
  await page.goto(`${BASE}/block-lab/`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.locator('.platform-admin-shell').count().then(Boolean),'Block Lab admin shell missing');
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminThemeResolved==='dark'),'Admin theme did not persist to Block Lab');
  const blockState=await page.evaluate(()=>({width:document.querySelector('.platform-admin-shell')?.getBoundingClientRect().width,active:document.querySelector('.platform-admin-shell__nav a[aria-current="page"]')?.getAttribute('href'),preview:document.querySelector('.block-lab')?.dataset.theme,themeButtons:document.querySelectorAll('[data-admin-theme-value]').length}));
  assert(Math.abs((blockState.width||0)-sharedWidth)<3,`Block Lab admin shell width drifted: ${blockState.width} vs ${sharedWidth}`);
  assert(blockState.active==='/block-lab/','Block Lab active admin nav missing');
  assert(blockState.preview==='light','Admin dark theme changed Block Lab preview theme');
  assert(blockState.themeButtons===3,'Block Lab admin theme controls missing');

  await page.goto(`${BASE}/editor-lab/`,{waitUntil:'domcontentloaded'});
  await wait(()=>page.evaluate(()=>Boolean(window.PlatformModuleRegistry)),'Editor Registry missing');
  await wait(()=>page.locator('[data-add-module]').count().then(count=>count>=libraryIds.length),'Editor module catalog did not include all Library modules');
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminThemeResolved==='dark'),'Admin theme did not persist to Editor');
  const editorIds=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('editor').map(item=>item.id));
  assert(libraryIds.every(id=>editorIds.includes(id)),`Library/Editor Registry drift: editor=${editorIds.join(',')}`);
  const editorState=await page.evaluate(()=>({width:document.querySelector('.platform-admin-shell')?.getBoundingClientRect().width,active:document.querySelector('.platform-admin-shell__nav a[aria-current="page"]')?.getAttribute('href'),preview:document.querySelector('.editor-lab')?.dataset.theme,themeButtons:document.querySelectorAll('[data-admin-theme-value]').length}));
  assert(Math.abs((editorState.width||0)-sharedWidth)<3,`Editor admin shell width drifted: ${editorState.width} vs ${sharedWidth}`);
  assert(editorState.active==='/block-editor/','Editor active admin nav missing');
  assert(editorState.preview==='light','Admin dark theme changed Editor preview theme');
  assert(editorState.themeButtons===3,'Editor admin theme controls missing');
  pass('Library → Editor Registry parity',`${libraryIds.length} approved module IDs available to Editor`);
  pass('Cross-route admin shell continuity',`admin dark + ${Math.round(sharedWidth)}px shell persist across Library → Block Lab → Editor while target themes stay light`);

  report.status='pass';report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  await page.screenshot({path:path.join(OUT,'admin-shell-editor-dark.png'),fullPage:true});
  console.log(`Library architecture/tree QA OK: ${report.checks.length} checks.`);
  await page.close();
}catch(error){
  report.status='fail';report.error=String(error?.stack||error);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.error(error);process.exitCode=1;
}finally{await browser.close();}
