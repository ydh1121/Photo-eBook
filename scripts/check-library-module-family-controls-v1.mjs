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
    const groups=[...document.querySelectorAll('[data-module-tree-group]')].filter(group=>!group.hidden).map(group=>({id:group.dataset.moduleTreeGroup,items:[...group.querySelectorAll('[data-kit-ui]')].map(node=>node.dataset.kitUi),hasIcon:Boolean(group.querySelector('summary svg'))}));
    return {ids,buttons,top,groups,duplicates:buttons.length-new Set(buttons).size,toolbar:{theme:Boolean(document.querySelector('.builder-kit-preview-toolbar #kitTheme')),viewport:Boolean(document.querySelector('.builder-kit-preview-toolbar #kitViewport')),settings:Boolean(document.querySelector('.builder-kit-preview-toolbar #kitSettings'))}};
  });
  assert(tree.ids.length===10,`Expected 10 approved Library modules, got ${tree.ids.length}`);
  assert(tree.buttons.length===tree.ids.length&&tree.ids.every(id=>tree.buttons.includes(id)),'Tree is not driven by all Registry Library entries');
  assert(tree.top.length===0,'Old top horizontal module catalog still owns module buttons');
  assert(tree.duplicates===0,'Module buttons were cloned instead of moved');
  assert(tree.groups.every(group=>group.hasIcon),'A Library hierarchy group is missing its icon');
  assert(tree.toolbar.theme&&tree.toolbar.viewport&&tree.toolbar.settings,'Preview controls are not grouped above canvas');
  pass('Registry-driven Library tree',`${tree.ids.length} real Registry buttons`);

  await wait(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='light'),'Default Library preview did not stay light');
  await page.locator('[data-admin-theme-value="dark"]').click();
  await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminThemeResolved==='dark'),'Admin dark theme did not apply');
  const lightIsolation=await page.evaluate(()=>({frameTheme:document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme,workspaceTheme:document.querySelector('.builder-kit-workspace')?.dataset.theme,canvasBg:getComputedStyle(document.querySelector('.builder-kit-canvas')).backgroundColor}));
  assert(lightIsolation.frameTheme==='light'&&lightIsolation.workspaceTheme==='light','Admin dark leaked into Library preview theme state');
  const rgb=(lightIsolation.canvasBg.match(/\d+(?:\.\d+)?/g)||[]).slice(0,3).map(Number);
  assert(rgb.length===3&&rgb.reduce((a,b)=>a+b,0)/3>180,`Library light canvas stayed dark: ${lightIsolation.canvasBg}`);
  await page.locator('[data-kit-theme="dark"]').click();await wait(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='dark'),'Preview dark control failed');
  await page.locator('[data-kit-theme="light"]').click();await wait(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='light'),'Preview light control failed');
  pass('Admin / preview theme isolation',`admin dark + target light canvas ${lightIsolation.canvasBg}`);

  const shell=page.locator('.platform-admin-shell');
  const sidebarBefore=await shell.evaluate(node=>node.getBoundingClientRect().width);
  await page.locator('[data-library-tree-collapse]').click();await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminSidebarCollapsed==='true'),'Sidebar did not collapse');await sleep(220);
  const collapsed=await shell.evaluate(node=>{const r=node.getBoundingClientRect();return {right:r.right,width:r.width};});
  assert(collapsed.width>230&&collapsed.right<=0,`Collapsed shell leaks/crushes: ${JSON.stringify(collapsed)}`);
  await page.locator('.platform-admin-shell__reopen').click();await wait(()=>page.locator('html').evaluate(node=>node.dataset.adminSidebarCollapsed==='false'),'Sidebar did not reopen');
  pass('Sidebar collapse/reopen',`${Math.round(sidebarBefore)}px shell fully leaves viewport`);

  let frame=await frameFor(page,'horizontal-rail');
  await openInspector(page);
  for(const id of ['desktopDrag','leftShadowGuard','leftPaintRunway','leftFade','rightFade','rightFadeWidth','rightContentPadding','scrollbar','dragThreshold','clickSuppressMs'])assert(await page.locator(`[data-style-control="${id}"]`).count()===1,`Horizontal rail setting missing: ${id}`);
  await setStyle(page,'rightContentPadding',148);await setStyle(page,'desktopDrag',false);
  const rail=await frame.locator('.platform-horizontal-rail__track').evaluate(node=>({desktop:node.dataset.moduleDesktopDrag,paddingRight:getComputedStyle(node).paddingRight,paddingBottom:getComputedStyle(node).paddingBottom}));
  assert(rail.desktop==='false'&&parseFloat(rail.paddingRight)>=147&&parseFloat(rail.paddingBottom)>=34,`Horizontal rail runtime settings failed: ${JSON.stringify(rail)}`);
  pass('Horizontal rail canonical controls',`${rail.paddingBottom} bottom shadow runway`);

  frame=await frameFor(page,'device-handoff-accordion');await sleep(300);
  assert(await frame.locator('.theme-setting-card,[data-theme-setting-card]').count()===0,'Screen mode context leaked into device accordion');

  frame=await frameFor(page,'screen-mode-selector');
  await wait(()=>frame.locator('.platform-screen-mode__options').evaluate(node=>{const style=getComputedStyle(node);return style.display==='grid'&&parseFloat(style.borderRadius)>=17;}),'Screen mode segmented style did not settle');
  const modeSkin=await frame.locator('.platform-screen-mode__options').evaluate(node=>({display:getComputedStyle(node).display,radius:getComputedStyle(node).borderRadius,bg:getComputedStyle(node).backgroundColor,buttons:node.querySelectorAll('[data-screen-mode-value]').length}));
  assert(modeSkin.display==='grid'&&modeSkin.buttons===3&&parseFloat(modeSkin.radius)>=17,`Screen mode segmented skin missing: ${JSON.stringify(modeSkin)}`);
  await frame.locator('[data-screen-mode-value="dark"]').click();
  await wait(()=>frame.locator('#platformModuleHost [data-platform-module="screen-mode-selector"]').evaluate(node=>node.dataset.screenMode==='dark'),'Screen mode dark selection failed');
  pass('Standalone screen-mode segmented owner',`${modeSkin.buttons} segments, radius ${modeSkin.radius}`);

  frame=await frameFor(page,'collection-bottom-sheet');await sleep(180);
  const photoPopup=await frame.evaluate(()=>{const panel=document.querySelector('.collection-sheet'),close=document.querySelector('.collection-close'),handle=document.querySelector('.collection-handle'),wrap=document.querySelector('.collection-handle-wrap');const pr=panel.getBoundingClientRect(),cr=close?.getBoundingClientRect(),hr=handle?.getBoundingClientRect(),wr=wrap?.getBoundingClientRect();return {radius:getComputedStyle(panel).borderTopLeftRadius,closeW:cr?.width,closeH:cr?.height,closeTop:cr?.top-pr.top,closeRight:pr.right-cr?.right,handleW:hr?.width,handleH:hr?.height,handleWrapH:wr?.height};});
  frame=await frameFor(page,'bottom-sheet');
  const genericPopup=await frame.evaluate(()=>{const panel=document.querySelector('.platform-bottom-sheet__panel'),close=document.querySelector('.platform-bottom-sheet__head>button'),handle=document.querySelector('.platform-bottom-sheet__handle'),wrap=document.querySelector('.platform-bottom-sheet__handle-wrap');const pr=panel.getBoundingClientRect(),cr=close?.getBoundingClientRect(),hr=handle?.getBoundingClientRect(),wr=wrap?.getBoundingClientRect();return {radius:getComputedStyle(panel).borderTopLeftRadius,closeW:cr?.width,closeH:cr?.height,closeTop:cr?.top-pr.top,closeRight:pr.right-cr?.right,handleW:hr?.width,handleH:hr?.height,handleWrapH:wr?.height};});
  report.popupGeometry={photoPopup,genericPopup};
  assert(genericPopup.radius===photoPopup.radius,'Bottom popup radius drift');
  for(const key of ['closeW','closeH','handleW','handleH','handleWrapH'])assert(Math.abs((genericPopup[key]||0)-(photoPopup[key]||0))<1,`Bottom popup ${key} drift: ${JSON.stringify(report.popupGeometry)}`);
  assert(Math.abs((genericPopup.closeTop||0)-(photoPopup.closeTop||0))<3,`Bottom popup close Y drift: ${JSON.stringify(report.popupGeometry)}`);
  assert(Math.abs((genericPopup.closeRight||0)-(photoPopup.closeRight||0))<3,`Bottom popup close X drift: ${JSON.stringify(report.popupGeometry)}`);
  await frame.locator('[data-bottom-sheet-drag-handle]').evaluate(node=>{const fire=(type,y,buttons)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:77,pointerType:'mouse',button:0,buttons,clientY:y,clientX:100}));fire('pointerdown',100,1);fire('pointermove',205,1);fire('pointerup',205,0);});
  await wait(()=>frame.locator('#platformModuleHost [data-platform-module="bottom-sheet"]').evaluate(node=>node.dataset.open==='false'),'Generic bottom sheet did not close by handle drag');
  pass('Bottom-sheet Photography parity',`close ${genericPopup.closeW}×${genericPopup.closeH}, top/right ${genericPopup.closeTop}/${genericPopup.closeRight}, handle ${genericPopup.handleW}×${genericPopup.handleH}, drag close`);

  const ownership=await page.evaluate(()=>window.PlatformModuleRegistry.listFor('library').map(def=>({id:def.id,owners:def.ownerFiles,render:typeof def.render})));
  assert(ownership.every(item=>item.render==='function'&&!item.owners.some(file=>file.includes('/block-lab/'))),'Approved module ownership violation');
  const photo=ownership.find(item=>item.id==='collection-bottom-sheet'),generic=ownership.find(item=>item.id==='bottom-sheet'),screen=ownership.find(item=>item.id==='screen-mode-selector');
  assert(photo?.owners.includes('public/assets/styles/platform-modules/bottom-popup-shared-v1.css')&&generic?.owners.includes('public/assets/styles/platform-modules/bottom-popup-shared-v1.css'),'Popup variants do not share canonical shell owner');
  assert(screen?.owners.includes('public/assets/styles/platform-modules/screen-mode-segmented-v1.css'),'Screen mode dedicated canonical style owner missing');
  pass('Canonical module ownership','shared popup owner + dedicated screen-mode owner; no Block Lab runtime import');

  await page.evaluate(()=>document.querySelector('.platform-admin-shell').dataset.qaIdentity='persistent');
  const navigate=async(id,expectedPath,selector)=>{
    await page.locator(`.platform-admin-shell__nav a[href="${expectedPath}"]`).click();
    await wait(()=>page.evaluate(pathname=>location.pathname===pathname,expectedPath),'Parent URL did not update without navigation');
    await wait(()=>page.locator('.platform-admin-workspace-host:not([hidden]) iframe').count().then(Boolean),'Persistent workspace iframe missing');
    const handle=await page.$('.platform-admin-workspace-host iframe');const child=await handle?.contentFrame();assert(child,`Missing embedded ${id} frame`);
    await wait(()=>child.locator(selector).count().then(Boolean),`Embedded ${id} tool did not render`,25000);
    assert(await page.locator('.platform-admin-shell').evaluate(node=>node.dataset.qaIdentity)==='persistent','Parent admin shell was replaced/reloaded');
    assert(await child.locator('.platform-admin-shell').count()===0,`Embedded ${id} mounted a duplicate admin shell`);
    return child;
  };
  await navigate('blocks','/block-lab/','.block-lab');
  await navigate('editor','/editor-lab/','.editor-lab');
  await navigate('qa','/qa/video-editor/','.qa-page');
  await page.locator('.platform-admin-shell__nav a[href="/ui-dashboard/"]').click();
  await wait(()=>page.evaluate(()=>location.pathname==='/ui-dashboard/'&&document.querySelector('.platform-admin-workspace-host')?.hidden===true),'Library did not restore native workspace');
  assert(await page.locator('.platform-admin-shell').evaluate(node=>node.dataset.qaIdentity)==='persistent','Admin shell reloaded while returning to Library');
  pass('Persistent admin tool routing','Library → Block Lab → Editor → QA → Library without parent document reload');

  const direct=await browser.newPage({viewport:{width:1500,height:1000}});
  await direct.goto(`${BASE}/block-lab/`,{waitUntil:'domcontentloaded'});
  await wait(()=>direct.locator('.platform-admin-shell__module-tree').count().then(Boolean),'Direct Block Lab entry did not normalize to the Library host',30000);
  await wait(()=>direct.locator('.platform-admin-workspace-host:not([hidden]) iframe').count().then(Boolean),'Direct Block Lab entry did not restore its embedded workspace',30000);
  const directHandle=await direct.$('.platform-admin-workspace-host iframe');const directChild=await directHandle?.contentFrame();assert(directChild,'Direct Block Lab workspace frame missing');
  await wait(()=>directChild.locator('.block-lab').count().then(Boolean),'Direct Block Lab workspace did not render',25000);
  assert(await directChild.locator('.platform-admin-shell').count()===0,'Direct Block Lab workspace mounted a duplicate admin shell');
  await direct.locator('.platform-admin-shell__nav a[href="/ui-dashboard/"]').click();
  await wait(()=>direct.evaluate(()=>location.pathname==='/ui-dashboard/'&&document.querySelector('.platform-admin-workspace-host')?.hidden===true),'Direct-entry session could not return to native Library');
  assert(await direct.locator('.platform-admin-shell__module-tree [data-kit-ui]').count()===tree.ids.length,'Library tree was lost after direct non-Library entry');
  pass('Direct-entry Library host normalization',`/block-lab/ restores ${tree.ids.length}-module Library tree without a parent reload loop`);
  await direct.close();

  report.status='pass';report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  await page.screenshot({path:path.join(OUT,'admin-persistent-library.png'),fullPage:true});
  console.log(`Library architecture/runtime QA OK: ${report.checks.length} checks.`);
  await page.close();
}catch(error){report.status='fail';report.error=String(error?.stack||error);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');console.error(error);process.exitCode=1;}
finally{await browser.close();}
