import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const BASE=(process.env.UI_DASHBOARD_LIVE_URL||'https://photo-ebook.pages.dev').replace(/\/$/,'');
const ENTRY_MARKER='builder-library-reference-v1.js';
const REGISTRY_MARKER='PlatformModuleRegistry';
const ATTEMPTS=Math.max(1,Number(process.env.LIVE_DEPLOY_ATTEMPTS||90));
const INTERVAL=Math.max(500,Number(process.env.LIVE_DEPLOY_INTERVAL_MS||4000));
const OUT=path.resolve('artifacts/platform-live-deploy');
fs.mkdirSync(OUT,{recursive:true});

const expectedPhoto=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];
const expectedPortable=['horizontal-rail','accordion','bottom-sheet'];
const expectedSharedDisplay=['screen-mode-selector'];
const expectedNonPublic=[...expectedPortable];
const expectedLibrary=[...expectedPhoto,...expectedPortable,...expectedSharedDisplay];
const report={startedAt:new Date().toISOString(),base:BASE,entryMarker:ENTRY_MARKER,registryMarker:REGISTRY_MARKER,attempts:[],checks:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function assert(value,message){if(!value)throw new Error(message);}
function pass(name,detail=''){report.checks.push({name,status:'pass',detail});console.log(`✓ ${name}${detail?` — ${detail}`:''}`);}
function browserPath(){return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);}
function cacheBust(url){const join=url.includes('?')?'&':'?';return `${url}${join}deploy_check=${Date.now()}_${Math.random().toString(36).slice(2)}`;}

async function fetchText(url){
  const response=await fetch(cacheBust(url),{cache:'no-store',redirect:'follow',headers:{'cache-control':'no-cache','pragma':'no-cache','user-agent':'Photo-eBook-live-deploy-check/2.7'}});
  if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function waitForCanonicalLibrary(){
  let lastError='';
  for(let attempt=1;attempt<=ATTEMPTS;attempt++){
    const at=new Date().toISOString();
    try{
      const html=await fetchText(`${BASE}/ui-dashboard/`);
      const matched=html.includes(ENTRY_MARKER)&&html.includes('/assets/js/platform-modules/module-registry-v1.js');
      report.attempts.push({attempt,at,status:'http-ok',matched,bytes:html.length});
      console.log(`[deploy ${attempt}/${ATTEMPTS}] HTTP OK; canonical-library=${matched}`);
      if(matched)return html;
      lastError=`latest HTML did not contain ${ENTRY_MARKER} + module registry`;
    }catch(error){
      lastError=error?.message||String(error);
      report.attempts.push({attempt,at,status:'error',error:lastError});
      console.log(`[deploy ${attempt}/${ATTEMPTS}] ${lastError}`);
    }
    if(attempt<ATTEMPTS)await sleep(INTERVAL);
  }
  throw new Error(`Cloudflare Pages did not expose the canonical UI Library: ${lastError}`);
}

async function waitLibraryFrame(page,id){
  await page.waitForSelector('#builderFrame',{timeout:30000});
  await page.waitForFunction(moduleId=>{
    const frame=document.querySelector('#builderFrame');
    const doc=frame?.contentDocument;
    return Boolean(doc?.documentElement?.dataset.platformModulePreview==='true'&&doc.documentElement.dataset.platformModule===moduleId&&doc.documentElement.dataset.platformModuleConsumer==='library'&&frame.contentWindow?.PlatformModuleRegistry);
  },id,{timeout:30000});
  const handle=await page.$('#builderFrame');const frame=await handle?.contentFrame();assert(frame,`module iframe missing: ${id}`);return frame;
}

async function selectLibraryModule(page,id){
  const button=page.locator(`[data-kit-ui="${id}"]`);
  await button.waitFor({state:'visible',timeout:15000});
  if(await button.getAttribute('aria-pressed')!=='true')await button.click();
  return waitLibraryFrame(page,id);
}

async function waitFrameCount(frame,selector,min,message,timeout=15000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    if(await frame.locator(selector).count()>=min)return;
    await sleep(80);
  }
  const state=await frame.evaluate(()=>({module:document.documentElement.dataset.platformModule||'',html:document.getElementById('platformModulePreviewRoot')?.innerHTML?.slice(0,1200)||''})).catch(()=>({}));
  throw new Error(`${message}; state=${JSON.stringify(state)}`);
}

async function waitAdminWorkspace(page,targetPath,readySelector){
  await page.waitForSelector('.platform-admin-shell',{timeout:20000});
  await page.waitForFunction(pathname=>{
    const host=document.querySelector('.platform-admin-workspace-host');
    const iframe=host?.querySelector('iframe');
    const src=iframe?.getAttribute('src')||'';
    const doc=iframe?.contentDocument;
    return Boolean(host&&!host.hidden&&iframe&&src.includes(pathname)&&src.includes('adminEmbed=1')&&doc?.documentElement?.dataset.adminEmbedded==='true');
  },targetPath,{timeout:30000});
  const handle=await page.$('.platform-admin-workspace-host iframe');
  const frame=await handle?.contentFrame();
  assert(frame,`persistent admin workspace missing: ${targetPath}`);
  if(readySelector)await frame.waitForSelector(readySelector,{timeout:30000});
  return frame;
}

async function verifyLiveAssets(){
  const registry=await fetchText(`${BASE}/assets/js/platform-modules/module-registry-v1.js`);
  assert(registry.includes(REGISTRY_MARKER),`live module registry is stale; missing ${REGISTRY_MARKER}`);
  for(const marker of ['normalizeDependencies','renderDependency','hydrateDependency','resolveDependency'])assert(registry.includes(marker),`live Registry dependency API is stale: ${marker}`);

  const photoModules=await fetchText(`${BASE}/assets/js/platform-modules/photo-core-modules-v1.js`);
  expectedPhoto.forEach(id=>assert(photoModules.includes(`id:'${id}'`),`live canonical photo module asset is missing ${id}`));
  assert(photoModules.includes("source:'public-extracted'"),'live photo module provenance is missing');

  const portableModules=await fetchText(`${BASE}/assets/js/platform-modules/portable-primitives-v1.js`);
  expectedPortable.forEach(id=>assert(portableModules.includes(`id:'${id}'`),`live portable primitive asset is missing ${id}`));
  assert(portableModules.includes("const consumers=['library','editor']"),'live portable consumer boundary is stale');

  const extension=await fetchText(`${BASE}/assets/js/platform-modules/portable-primitives-extension-v2.js`);
  assert(!extension.includes('function renderScreenMode')&&!extension.includes('function hydrateScreenMode'),'duplicate screen-mode implementation remains in portable extension');
  assert(extension.includes("label:'기기 연결 아코디언'")&&extension.includes("label:'범용 하단 시트'"),'live family label extension is stale');

  const composition=await fetchText(`${BASE}/assets/js/platform-modules/portable-primitives-composition-v3.js`);
  for(const marker of [
    "const SCREEN_ID='screen-mode-selector'",
    "const FILTER_ID='filter-chip-rail'",
    "dependencies:[{id:FILTER_ID,kind:'composition',required:true}]",
    'registry.renderDependency(SCREEN_ID,FILTER_ID',
    'registry.hydrateDependency(SCREEN_ID',
    'PhotoLiquidController?.attachFilterRail'
  ])assert(composition.includes(marker),`live screen-mode composition contract is stale: ${marker}`);

  const liquid=await fetchText(`${BASE}/assets/js/ui/liquid-controller.js`);
  assert(liquid.includes("const BREEZE='cubic-bezier(0.34, 1.56, 0.64, 1)'"),'live canonical Breeze motion changed');
  assert(liquid.includes('attachFilterRail'),'live filter-chip liquid motion API is missing');

  const screenCss=await fetchText(`${BASE}/assets/styles/platform-modules/screen-mode-segmented-v1.css`);
  assert(!screenCss.includes('.platform-screen-mode__options button'),'screen-mode CSS paints a duplicate chip implementation');

  pass('live canonical assets',`${expectedPhoto.length} Photography/Public + ${expectedSharedDisplay.length} dependency-composed display + ${expectedNonPublic.length} Library/Editor-only modules`);
}

async function verifyLiveBrowser(){
  const executablePath=browserPath();assert(executablePath,'Chrome/Chromium not found on runner');
  const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();

    await page.goto(cacheBust(`${BASE}/ui-dashboard/`),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForFunction(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-kit-ui]').length),{timeout:30000});
    const library=await page.evaluate(()=>({
      view:document.querySelector('.builder-shell')?.dataset.builderView,
      ids:window.PlatformModuleRegistry.listFor('library').map(item=>item.id),
      entries:window.PlatformModuleRegistry.listFor('library').map(item=>({id:item.id,status:item.status,source:item.source,consumers:item.consumers,label:item.label,dependencies:item.dependencies||[]})),
      buttons:[...document.querySelectorAll('[data-kit-ui]')].map(node=>node.dataset.kitUi),
      legacyComposer:Boolean(document.querySelector('#builderOpenBlockPalette,.builder-toolbar')),
      overflow:document.documentElement.scrollWidth-innerWidth
    }));
    assert(library.view==='library','live /ui-dashboard/ is not the canonical UI Library');
    assert(!library.legacyComposer,'legacy screen composer controls are still live');
    assert(library.ids.length===expectedLibrary.length&&expectedLibrary.every(id=>library.ids.includes(id)),`live approved Library module set mismatch: ${library.ids.join(', ')}`);
    assert(library.buttons.length===library.ids.length&&library.ids.every(id=>library.buttons.includes(id)),'live Library selector is not Registry-driven');
    assert(new Set(library.buttons).size===library.buttons.length,'live Library selector contains duplicate module buttons');
    assert(library.entries.every(item=>item.status==='approved'),'non-approved module leaked into live Library');
    assert(expectedNonPublic.every(id=>library.entries.some(item=>item.id===id&&item.consumers.includes('library')&&item.consumers.includes('editor')&&!item.consumers.includes('public'))),'Library/Editor-only consumer boundary regressed');
    assert(expectedSharedDisplay.every(id=>library.entries.some(item=>item.id===id&&item.consumers.includes('public')&&item.consumers.includes('library')&&item.consumers.includes('editor'))),'shared display consumer boundary regressed');
    const screenEntry=library.entries.find(item=>item.id==='screen-mode-selector');
    assert(screenEntry?.dependencies?.some(item=>item.id==='filter-chip-rail'&&item.kind==='composition'&&item.required===true),'live screen-mode dependency graph is missing filter-chip-rail');
    assert(library.overflow<=2,`live Library outer overflow ${library.overflow}px`);
    pass('live UI Library',`registry-driven root route with ${library.ids.length} approved modules`);

    for(const id of ['top-chapter-navigation','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','horizontal-rail','accordion','bottom-sheet','screen-mode-selector']){
      const frame=await selectLibraryModule(page,id);
      const src=await page.locator('#builderFrame').getAttribute('src');
      assert(src?.includes('/ui-dashboard/module-preview/'),`${id}: live Library is not using the shared preview host`);
      assert(!src?.includes('/sandbox/')&&!src?.includes('/reference-preview/'),`${id}: retired preview path is still live`);
      if(id==='top-chapter-navigation'){
        await waitFrameCount(frame,'.nav-shell[data-platform-module="top-chapter-navigation"] .nav-chip',8,'live canonical nav missing');
      }
      if(id==='filter-chip-rail'){
        const chipsSelector='.platform-filter-chip-module .platform-filter-chip-source:not([hidden]) [data-platform-filter-id]';
        await waitFrameCount(frame,chipsSelector,4,'live canonical filter chips missing');
        const chips=frame.locator(chipsSelector);
        const labels=await chips.allTextContents();assert(labels.every(label=>label&&!label.includes('[object Object]')),'live filter normalization regressed');
      }
      if(id==='collection-bottom-sheet'){
        const sheet=frame.locator('#collectionSheet');
        await page.waitForTimeout(100);
        assert(await sheet.evaluate(node=>!node.hidden&&node.classList.contains('is-open')),'live canonical bottom sheet is not open');
      }
      if(id==='device-handoff-accordion'){
        await page.waitForTimeout(220);
        await waitFrameCount(frame,'.collection-device-accordion #collectionDeviceLink',1,'live canonical device accordion missing');
      }
      if(id==='horizontal-rail')await waitFrameCount(frame,'.platform-horizontal-rail__card',3,'live portable horizontal rail missing');
      if(id==='accordion')await waitFrameCount(frame,'.platform-accordion__item',2,'live portable accordion missing');
      if(id==='bottom-sheet')await waitFrameCount(frame,'.platform-bottom-sheet[data-platform-module="bottom-sheet"]',1,'live portable bottom sheet missing');
      if(id==='screen-mode-selector'){
        await waitFrameCount(frame,'.platform-screen-mode [data-platform-module="filter-chip-rail"]',1,'live screen mode did not compose canonical filter-chip module');
        await waitFrameCount(frame,'.platform-screen-mode [data-screen-mode-value]',3,'live standalone screen mode compatibility controls missing');
        await waitFrameCount(frame,'.platform-screen-mode .collection-v33-indicator',1,'live screen mode liquid indicator missing');
        const state=await frame.evaluate(()=>{
          const screen=document.querySelector('[data-platform-module="screen-mode-selector"]');
          const filter=screen?.querySelector('[data-platform-module="filter-chip-rail"]');
          const indicator=filter?.querySelector('.collection-v33-indicator');
          const provenance=window.PlatformModuleRegistry?.provenance?.('screen-mode-selector');
          return {nested:filter?.dataset.platformModule,controller:Boolean(filter?.querySelector('.platform-filter-chip-source--liquid')?.__photoLiquidController),dependency:provenance?.dependencies?.find(item=>item.id==='filter-chip-rail')||null,transform:indicator?.style.transform||''};
        });
        assert(state.nested==='filter-chip-rail'&&state.controller,'live screen mode is not hydrated by the canonical filter/liquid owner');
        assert(state.dependency?.kind==='composition'&&state.dependency?.required===true,'live screen mode dependency provenance is wrong');
        const before=state.transform;
        await frame.locator('[data-screen-mode-value="dark"]').click();
        await frame.waitForFunction(old=>document.querySelector('[data-platform-module="screen-mode-selector"]')?.dataset.screenMode==='dark'&&document.querySelector('.platform-screen-mode .collection-v33-indicator')?.style.transform!==old,before,{timeout:10000});
        const motion=await frame.locator('.platform-screen-mode .collection-v33-indicator').evaluate(node=>({duration:getComputedStyle(node).transitionDuration,easing:getComputedStyle(node).transitionTimingFunction}));
        assert(motion.duration!=='0s'&&motion.easing.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'),'live screen-mode filter lost canonical Breeze motion');
      }
    }

    await selectLibraryModule(page,'top-chapter-navigation');
    await page.locator('[data-kit-theme="dark"]').click();
    await page.waitForFunction(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.theme==='dark',{timeout:15000});
    await page.locator('[data-kit-viewport="mobile"]').click();
    const mobileWidth=await page.locator('#builderFrame').evaluate(node=>node.getBoundingClientRect().width);assert(mobileWidth<=400,`live mobile preview width ${mobileWidth}`);
    await page.screenshot({path:path.join(OUT,'live-ui-library.png'),fullPage:true});
    pass('live Library theme/viewport','dark + mobile shared preview');

    await page.goto(cacheBust(`${BASE}/block-lab/`),{waitUntil:'domcontentloaded',timeout:45000});
    const blockFrame=await waitAdminWorkspace(page,'/block-lab/','.block-lab');
    assert((await page.title()).includes('블록 연구실'),'live Block Lab role label is stale');
    assert(await blockFrame.locator('text=RESEARCH ONLY').count()>=1,'live Block Lab research boundary missing');
    assert(await page.locator('.platform-admin-shell__nav a[aria-current="page"][href="/block-lab/"]').count()===1,'live Block Lab admin nav state is stale');
    pass('live Block Lab boundary','persistent workspace + research-only');

    await page.goto(cacheBust(`${BASE}/editor-lab/`),{waitUntil:'domcontentloaded',timeout:45000});
    const editorFrame=await waitAdminWorkspace(page,'/editor-lab/','.editor-lab');
    await editorFrame.waitForFunction(()=>Boolean(window.PlatformModuleRegistry&&document.querySelectorAll('[data-add-module]').length),{timeout:25000});
    const editor=await editorFrame.evaluate(()=>({
      scripts:[...document.scripts].map(node=>node.getAttribute('src')||''),
      styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(node=>node.getAttribute('href')||''),
      ids:window.PlatformModuleRegistry.listFor('editor').map(item=>item.id),
      screenDependency:window.PlatformModuleRegistry.provenance?.('screen-mode-selector')?.dependencies||[]
    }));
    assert((await page.title()).includes('블록 에디터'),'live Block Editor role label is stale');
    assert(await page.locator('.platform-admin-shell__nav a[aria-current="page"][href="/editor-lab/"]').count()===1,'live Block Editor admin nav state is stale');
    assert(!editor.scripts.some(src=>src.includes('/assets/js/block-lab/')),'live Block Editor loads Block Lab JS');
    assert(!editor.styles.some(src=>src.includes('/assets/styles/block-lab/')),'live Block Editor loads Block Lab CSS');
    assert(expectedLibrary.every(id=>editor.ids.includes(id)),`live Block Editor approved module set mismatch: ${editor.ids.join(', ')}`);
    assert(editor.screenDependency.some(item=>item.id==='filter-chip-rail'&&item.kind==='composition'),'live Editor did not load dependency-aware screen-mode definition');
    pass('live Block Editor boundary',`persistent workspace + ${expectedLibrary.length} approved modules only`);

    await page.goto(cacheBust(`${BASE}/`),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForFunction(()=>Boolean(window.PlatformModuleRegistry),{timeout:20000});
    await page.waitForSelector('.nav-shell[data-platform-module="top-chapter-navigation"]',{timeout:30000});
    const publicState=await page.evaluate(()=>({
      modules:window.PlatformModuleRegistry.listFor('public').map(item=>({id:item.id,status:item.status})),
      nav:document.querySelectorAll('.nav-shell[data-platform-module="top-chapter-navigation"] .nav-chip').length
    }));
    assert(expectedPhoto.every(id=>publicState.modules.some(item=>item.id===id&&item.status==='approved')),'live public consumer cannot resolve approved Photography common modules');
    assert(expectedNonPublic.every(id=>!publicState.modules.some(item=>item.id===id)),'Library/Editor-only module leaked into Photography Public consumer');
    assert(publicState.nav>=8,'live public top navigation is not using canonical module');
    await page.screenshot({path:path.join(OUT,'live-public-canonical-nav.png'),fullPage:false});
    pass('live public migration','Photography canonical modules remain public; shared display remains public-capable by dependency contract; portable Library/Editor-only boundary remains closed');

    await context.close();
  }finally{await browser.close();}
}

try{
  await waitForCanonicalLibrary();
  pass('live dashboard entry',ENTRY_MARKER);
  await verifyLiveAssets();
  await verifyLiveBrowser();
  report.status='pass';
}catch(error){
  report.status='fail';report.error=error?.stack||String(error);console.error(report.error);process.exitCode=1;
}finally{
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
}
