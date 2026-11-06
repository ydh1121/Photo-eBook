#!/usr/bin/env node
/* Canonical case-card/dialog checks. --runtime adds actual browser interactions. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {pathToFileURL} from 'node:url';

const ROOT=path.resolve(import.meta.dirname,'..'),OUT=path.join(ROOT,'artifacts/reference-cases');
const report={startedAt:new Date().toISOString(),checks:[],screenshots:[],diagnostics:[],limitations:['Browser fixtures verify shared behavior and declared dependencies, not third-party page availability.','Portable fixtures load the canonical asset manifest; they are not a new ZIP export product.']};
const assert=(value,message)=>{if(!value)throw new Error(message);};
const pass=(name,detail)=>{report.checks.push({name,status:'pass',detail});console.log(`PASS ${name}`);};
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const moduleFiles=['module-registry-v1.js','portable-primitives-v1.js','portable-primitives-extension-v2.js','portable-primitives-composition-v3.js','content-detail-dialog-v1.js','reference-case-rail-v1.js'].map(name=>`public/assets/js/platform-modules/${name}`);
const context=vm.createContext({window:{},URL,localStorage:{getItem:()=>null}});
for(const file of moduleFiles)new vm.Script(read(file),{filename:file}).runInContext(context,{timeout:1500});
const registry=context.window.PlatformModuleRegistry;
const IDS=['reference-case-rail','content-detail-dialog'];

for(const id of IDS){
  const def=registry.get(id);assert(def?.status==='approved',`${id}: missing approved definition`);
  for(const consumer of ['public','library','editor','export']){
    assert(registry.canConsume(id,consumer),`${id}: missing ${consumer}`);
    assert(registry.dependencyClosure(id,consumer).includes(id),`${id}: no dependency closure`);
    const html=registry.render(id,registry.previewProps(id),{consumer});
    assert(html.includes(`data-platform-module="${id}"`),`${id}/${consumer}: missing canonical root`);
    assert(!html.includes('[object Object]')&&!html.includes('undefined'),`${id}/${consumer}: invalid text`);
  }
  assert(def.ownerFiles.every(file=>fs.existsSync(path.join(ROOT,file))),`${id}: missing canonical file`);
  assert(def.ownerFiles.every(file=>!file.includes('/ui-dashboard/')&&!file.includes('/block-lab/')),`${id}: preview-only owner`);
}
pass('registry-consumers-and-owner-files',IDS);
const closure=registry.dependencyClosure('reference-case-rail','export'),assets=registry.assetFiles('reference-case-rail','export');
assert(closure.includes('horizontal-rail')&&closure.includes('content-detail-dialog'),'Case rail lost a canonical dependency');
assert(new Set(assets).size===assets.length&&assets.every(file=>fs.existsSync(path.join(ROOT,file))),'Portable asset manifest invalid');
assert(!registry.canConsume('bottom-sheet','public'),'Unrelated bottom-sheet Public restriction was relaxed');
pass('declared-composition-and-portable-assets',{closure,assetCount:assets.length});

const malicious={id:'unsafe',kind:'analysis',title:'<script>window.bad=1</script>',summary:'<img src=x onerror=alert(1)>',image:'javascript:alert(1)',tags:['<unsafe>'],sections:[{title:'Only after opening',body:['DEFERRED_CASE_BODY']}],url:'javascript:alert(1)'};
const escaped=registry.render('reference-case-rail',{title:'<unsafe>',items:[malicious,malicious,{id:'blank'}]},{consumer:'public'});
assert((escaped.match(/data-reference-case-id=/g)||[]).length===1,'Duplicate/empty cases were rendered');
assert(escaped.includes('&lt;script&gt;')&&escaped.includes('&lt;img')&&!escaped.includes('<script>')&&!escaped.includes('javascript:'),'Case content was not escaped / image URL not filtered');
assert(!escaped.includes('DEFERRED_CASE_BODY'),'Closed case rail eagerly rendered all detailed bodies');
assert(!registry.render('content-detail-dialog',{launcher:false},{consumer:'export'}).includes('data-content-detail-launch'),'Composed dialog leaks its standalone launcher');
pass('escaped-summary-dedup-and-deferred-detail');

for(const entry of ['public/ui-dashboard/index.html','public/ui-dashboard/module-preview/index.html','public/editor-lab/index.html','public/assets/js/public-snapshot/runtime-v2.js']){
  const text=read(entry);for(const name of ['content-detail-dialog-v1','reference-case-rail-v1'])assert(text.includes(`${name}.js`),`${entry}: loader missing ${name}`);
}
assert(!read('public/index.html').includes('reference-case-rail-v1.js'),'Photography entry eagerly loads case rails');
pass('shared-entrypoints-and-photography-boundary');

const sampleItem={id:'shared-id',kind:'analysis',kicker:'검증용 예시',title:'같은 방을 다른 순서로 소개하기',creator:'예시 작성자',summary:'장면 선택과 자막을 비교하는 실습 예시입니다.',evidenceLabel:'검증용 자료',observedAt:'2026-11-06',tags:['촬영','편집'],url:'https://example.org/post',profileUrl:'https://example.org/profile',sections:[{title:'장면 고르기',body:['ONLY_FIRST_INSTANCE',...Array.from({length:30},(_,i)=>`${i+1}. 문 앞에서 방 전체를 촬영하고, 창문과 수납을 각각 가까이 담으세요. 화면에서 확인할 정보를 자막으로 적고, 읽을 시간을 남겨 둡니다.`)],bullets:['첫 장면에 공간의 특징을 담습니다.','끝부분에는 다음 행동을 안내합니다.'],links:[{label:'공식 도움말',url:'https://support.google.com/youtube/'},{label:'차단할 링크',url:'javascript:alert(1)'}]}],metrics:[{label:'예시 수치',value:'12',note:'실제 게시물 성과가 아닌 검증용 값'}],exercise:{title:'두 가지 도입부 만들기',steps:['문 앞과 창가에서 촬영하세요.','같은 뒷부분에 도입부만 바꿔 연결하세요.'],output:'도입부가 다른 영상 두 편'}};
const fixtureProps={instanceId:'fixture-a',title:'사례 카드 검증',description:'공통 모듈의 실제 동작을 확인합니다.',items:[sampleItem,...Array.from({length:4},(_,i)=>({id:`other-${i}`,kind:'profile',title:`참고 계정 ${i+1}`,summary:'분석 항목을 기록해 두는 예시입니다.',evidenceLabel:'검증용 예시',sections:[{title:'다른 카드',body:[`OTHER_CASE_${i}`]}]}))]};
const secondProps={...fixtureProps,instanceId:'fixture-b',title:'독립된 두 번째 사례',items:[{...sampleItem,title:'두 번째 인스턴스',sections:[{title:'다른 내용',body:['ONLY_SECOND_INSTANCE']}]}]};
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
function fixtureHtml(consumer='public'){
  const registryPath='/assets/js/platform-modules/module-registry-v1.js';
  const css=assets.filter(file=>file.endsWith('.css')).map(file=>`<link rel="stylesheet" href="${file.replace(/^public/,'')}">`).join('');
  const js=[registryPath,...assets.filter(file=>file.endsWith('.js')).map(file=>file.replace(/^public/,''))].map(file=>`<script src="${file}"></script>`).join('');
  return `<!doctype html><html lang="ko" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Case module verification</title>${css}<style>body{margin:0;background:#f4f6fa}main{max-width:1080px;padding:240px 24px 400px;margin:auto;box-sizing:border-box}#host-b{margin-top:160px}</style><body><main><div id="host-a"></div><div id="host-b"></div><div id="host-single"></div></main>${js}<script>const casesA=${json(fixtureProps)},casesB=${json(secondProps)};window.referenceQa={casesA,casesB};for(const [key,id,props] of [['a','host-a',casesA],['b','host-b',casesB]])referenceQa[key]=PlatformModuleRegistry.mount(document.getElementById(id),'reference-case-rail',props,{consumer:'${consumer}'});referenceQa.single=PlatformModuleRegistry.mount(document.getElementById('host-single'),'content-detail-dialog',PlatformModuleRegistry.previewProps('content-detail-dialog'),{consumer:'${consumer}'});</script></body></html>`;
}
function snapshotHtml(){
  const blocks=[{id:'case-public',type:'ui-module',variant:'reference-case-rail',content:fixtureProps},{id:'detail-public',type:'ui-module',variant:'content-detail-dialog',content:registry.previewProps('content-detail-dialog')}];
  return `<!doctype html><html lang="ko" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Published module verification</title><style>body{margin:0;background:#f4f6fa}main{max-width:1080px;padding:32px 24px;margin:auto}</style><body><main id="snapshot-host">${blocks.map(block=>`<div data-public-ui-module-host="${block.id}"></div>`).join('')}</main><script src="/assets/js/blocks/block-registry.js"></script><script src="/assets/js/public-snapshot/runtime-v2.js"></script><script>PublicSnapshotRuntimeV2.mountUiModules(document.getElementById('snapshot-host'),${json(blocks)}).then(()=>document.documentElement.dataset.snapshotReady='true');</script></body></html>`;
}
function startServer(){
  const publicRoot=path.join(ROOT,'public');
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://localhost');
    if(url.pathname==='/__reference-case-fixture/'){response.writeHead(200,{'content-type':'text/html; charset=utf-8'});response.end(fixtureHtml(url.searchParams.get('consumer')==='export'?'export':'public'));return;}
    if(url.pathname==='/__reference-snapshot/'){response.writeHead(200,{'content-type':'text/html; charset=utf-8'});response.end(snapshotHtml());return;}
    let requested;try{requested=decodeURIComponent(url.pathname);}catch{response.writeHead(400).end();return;}
    let file=path.resolve(publicRoot,`.${requested}`);
    if(!file.startsWith(`${publicRoot}${path.sep}`)&&file!==publicRoot){response.writeHead(403).end();return;}
    try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const body=fs.readFileSync(file);const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';response.writeHead(200,{'content-type':type});response.end(body);}catch{response.writeHead(404).end('Not found');}
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,base:`http://127.0.0.1:${server.address().port}`})));
}
async function runtime(){
  let playwright;try{playwright=await import('playwright');}catch(error){const fallback=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;if(!fallback)throw error;playwright=await import(pathToFileURL(path.join(fallback,'playwright/index.mjs')).href);}
  const {server,base}=await startServer();
  const executable=[process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(file=>file&&fs.existsSync(file));
  let browser;
  try{
    browser=await playwright.chromium.launch({headless:true,...(executable?{executablePath:executable}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:375,height:667},reducedMotion:'reduce'});page.setDefaultTimeout(15000);page.on('pageerror',error=>report.diagnostics.push(error.message));
    await page.goto(`${base}/__reference-case-fixture/`,{waitUntil:'load'});
    const rail=page.locator('#host-a [data-platform-module="reference-case-rail"]'),dialog=rail.locator('dialog'),first=rail.locator('[data-reference-case-id]').first();
    assert(await rail.getAttribute('data-reference-bound')==='true','Rail did not hydrate');
    assert(await rail.locator('.edu-detail-section').count()===0,'Hidden details rendered before first open');
    await first.scrollIntoViewIfNeeded();const originalY=await page.evaluate(()=>scrollY);await first.click();await dialog.waitFor({state:'visible'});
    assert(await dialog.evaluate(node=>node.matches(':modal')),'Dialog is not in the native modal top layer');
    assert((await dialog.textContent()).includes('ONLY_FIRST_INSTANCE')&&!(await dialog.textContent()).includes('OTHER_CASE_'),'Detail does not isolate the selected item');
    assert(await page.locator('#host-b dialog[open]').count()===0,'Other instance opened');
    assert(await page.locator('body').evaluate(node=>node.style.position==='fixed'),'Background scroll not locked');
    assert(await dialog.locator('a[href^="javascript:"]').count()===0,'Unsafe detail link rendered');
    assert(await dialog.locator('a[href]').evaluateAll(nodes=>nodes.every(node=>node.target==='_blank'&&node.rel.includes('noopener'))),'External links lack new-tab protection');
    const geometry=await dialog.evaluate(node=>{
      const rect=node.getBoundingClientRect(),close=node.querySelector('.edu-detail-dialog__close'),r=close.getBoundingClientRect(),s=close.querySelector('svg').getBoundingClientRect(),body=node.querySelector('.edu-detail-dialog__body');
      return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,topGap:r.top-rect.top,rightGap:rect.right-r.right,svgDelta:Math.max(Math.abs(r.left+r.width/2-s.left-s.width/2),Math.abs(r.top+r.height/2-s.top-s.height/2)),bodyHeight:body.clientHeight,bodyScroll:body.scrollHeight,viewportW:innerWidth,viewportH:innerHeight,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    assert(geometry.left>=0&&geometry.right<=geometry.viewportW&&geometry.top>=0&&geometry.bottom<=geometry.viewportH,'Mobile dialog exceeds viewport');
    assert(geometry.overflow<=1&&geometry.bodyScroll>geometry.bodyHeight&&geometry.bodyHeight>100,'Long mobile body is not independently readable');
    assert(Math.abs(geometry.topGap-geometry.rightGap)<=1&&geometry.svgDelta<=1,'Close button spacing/icon alignment differs');
    const pinned=await dialog.evaluate(node=>({head:node.querySelector('header').getBoundingClientRect().top,foot:node.querySelector('footer').getBoundingClientRect().bottom}));
    await dialog.locator('.edu-detail-dialog__body').evaluate(node=>{node.scrollTop=600;});
    const pinnedAfter=await dialog.evaluate(node=>({head:node.querySelector('header').getBoundingClientRect().top,foot:node.querySelector('footer').getBoundingClientRect().bottom}));
    assert(Math.abs(pinned.head-pinnedAfter.head)<1&&Math.abs(pinned.foot-pinnedAfter.foot)<1,'Reading scroll moved modal header/footer');
    fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,'mobile-dialog.png')});report.screenshots.push('mobile-dialog.png');
    pass('mobile-native-modal-selected-content-and-layout',geometry);

    const close=dialog.locator('.edu-detail-dialog__close'),last=dialog.locator('.edu-detail-done');
    await close.focus();await page.keyboard.press('Shift+Tab');assert(await last.evaluate(node=>node===document.activeElement),'Shift+Tab leaves modal');
    await page.keyboard.press('Tab');assert(await close.evaluate(node=>node===document.activeElement),'Tab does not wrap to close');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    assert(await first.evaluate(node=>node===document.activeElement),'Opener focus not restored');
    assert(Math.abs(await page.evaluate(()=>scrollY)-originalY)<=1,'Reading location changed after modal close');
    assert(await page.locator('body').evaluate(node=>node.style.position===''),'Scroll lock not restored');
    await first.click();await dialog.waitFor({state:'visible'});await page.mouse.click(2,2);await dialog.waitFor({state:'hidden'});
    pass('keyboard-loop-escape-backdrop-and-reading-position');

    const track=rail.locator('.platform-horizontal-rail__track');await track.scrollIntoViewIfNeeded();await track.evaluate(node=>{node.scrollLeft=0;});
    const box=await track.boundingBox();await page.mouse.move(box.x+box.width-28,box.y+70);await page.mouse.down();await page.mouse.move(box.x+30,box.y+70,{steps:12});await page.mouse.up();
    assert(await track.evaluate(node=>node.scrollLeft)>30,'Canonical rail did not drag');
    assert(!await dialog.isVisible(),'Dragging a card opened its detail');
    pass('canonical-drag-does-not-open-card');

    await page.evaluate(()=>{referenceQa.a.api.open('shared-id');referenceQa.b.api.open('shared-id');});
    assert(await page.locator('dialog[open]').count()===2,'Independent instances cannot open their own modal');
    await page.evaluate(()=>referenceQa.b.api.close());assert(await page.locator('body').evaluate(node=>node.style.position==='fixed'),'Closing nested dialog releases another modal scroll lock');
    await page.evaluate(()=>referenceQa.a.cleanup());assert(await page.locator('dialog[open]').count()===0,'Cleanup leaves open dialog');
    assert(await page.locator('body').evaluate(node=>node.style.position===''),'Cleanup leaves scroll lock');
    await track.evaluate(node=>{node.scrollLeft=0;});await first.click();assert(!await dialog.isVisible(),'Cleanup leaves card listeners active');
    await page.evaluate(()=>{referenceQa.a=PlatformModuleRegistry.get('reference-case-rail').hydrate(document.querySelector('#host-a [data-platform-module="reference-case-rail"]'),referenceQa.casesA,{consumer:'public'});});
    await first.click();await dialog.waitFor({state:'visible'});await dialog.locator('.edu-detail-done').click();await dialog.waitFor({state:'hidden'});
    pass('instance-isolation-scroll-lock-reference-count-and-cleanup');

    await page.setViewportSize({width:1440,height:1000});await page.goto(`${base}/__reference-case-fixture/?consumer=export`,{waitUntil:'load'});
    await page.locator('#host-a [data-reference-case-id]').first().click();await page.locator('#host-a dialog').waitFor({state:'visible'});
    assert(await page.locator('[data-platform-module="bottom-sheet"]').count()===0,'Export fixture imports unrelated sheet UI');
    await page.screenshot({path:path.join(OUT,'portable-dialog.png')});report.screenshots.push('portable-dialog.png');
    await page.keyboard.press('Escape');pass('portable-declared-dependency-runtime');

    await page.goto(`${base}/__reference-snapshot/`,{waitUntil:'load'});
    await page.waitForFunction(()=>document.documentElement.dataset.snapshotReady==='true');
    assert(await page.locator('[data-platform-public-module-ready="true"]').count()===2,'Published Snapshot did not mount both modules');
    assert(await page.locator('iframe').count()===0,'Published Snapshot uses an admin preview iframe');
    await page.locator('[data-reference-case-id]').first().click();await page.locator('[data-platform-module="reference-case-rail"] dialog').waitFor({state:'visible'});
    await page.locator('[data-platform-module="reference-case-rail"] .edu-detail-done').click();
    pass('published-snapshot-uses-canonical-owners-without-preview');

    await page.goto(`${base}/ui-dashboard/`,{waitUntil:'load'});
    for(const id of IDS){
      await page.locator(`[data-kit-ui="${id}"]`).click();
      await page.waitForFunction(moduleId=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformModule===moduleId,id);
      const frame=page.frameLocator('#builderFrame');
      const opener=id==='reference-case-rail'?frame.locator('[data-reference-case-id]').first():frame.locator('[data-content-detail-launch]');
      await opener.click();await frame.locator('dialog').waitFor({state:'visible'});await frame.locator('.edu-detail-done').click();await frame.locator('dialog').waitFor({state:'hidden'});
    }
    pass('library-loads-and-interacts-with-canonical-owners');

    await page.waitForFunction(()=>document.querySelector('.platform-admin-shell')?.dataset.persistentWorkspaceBound==='true');
    await page.locator('.platform-admin-shell__nav a[href="/editor-lab/"]').click();
    const workspace=page.locator('.platform-admin-workspace-host:not([hidden]) iframe');await workspace.waitFor({state:'visible'});
    const tool=await (await workspace.elementHandle()).contentFrame();assert(tool,'Editor workspace missing');
    for(const id of IDS){await tool.locator(`[data-add-module="${id}"]`).click();await tool.locator(`[data-platform-editor-module-frame="${id}"]`).waitFor();}
    const caseBlock=tool.locator('[data-editor-block]').filter({has:tool.locator('[data-platform-editor-module="reference-case-rail"]')}).first();
    await caseBlock.locator('[data-block-action="duplicate"]').click();
    await tool.waitForFunction(()=>document.querySelectorAll('[data-platform-editor-module-frame="reference-case-rail"]').length===2);
    await tool.locator('[data-editor-mode="preview"]').click();
    for(const id of IDS){
      const iframe=tool.locator(`[data-platform-editor-module-frame="${id}"]`).first();await iframe.scrollIntoViewIfNeeded();
      const frame=tool.frameLocator(`[data-platform-editor-module-frame="${id}"]`).first();
      const opener=id==='reference-case-rail'?frame.locator('[data-reference-case-id]').first():frame.locator('[data-content-detail-launch]');
      await opener.click();await frame.locator('dialog').waitFor({state:'visible'});await frame.locator('.edu-detail-done').click();await frame.locator('dialog').waitFor({state:'hidden'});
    }
    const utility=tool.locator('details.admin-utility-menu').filter({has:tool.locator('#editorExport')});
    if(await utility.count()&&!await utility.evaluate(node=>node.open))await utility.locator(':scope > summary').click();
    const [download]=await Promise.all([page.waitForEvent('download'),tool.locator('#editorExport').click()]);
    const exportFile=path.join(OUT,'editor-export.json');await download.saveAs(exportFile);const exported=JSON.parse(fs.readFileSync(exportFile,'utf8'));
    assert(exported.blocks.length===3&&exported.validation.every(item=>item.ok),'Editor export lost or rejected case modules');
    const instances=exported.blocks.filter(block=>block.variant==='reference-case-rail').map(block=>block.content.instanceId);
    assert(instances.length===2&&instances.every(Boolean)&&new Set(instances).size===2,'Duplicated case instances do not preserve distinct snapshot IDs');
    pass('editor-inserts-duplicates-previews-and-exports-canonical-owners');
    assert(report.diagnostics.length===0,`Browser errors: ${report.diagnostics.join('; ')}`);
    await page.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}

try{
  if(process.argv.includes('--runtime'))await runtime();
  report.finishedAt=new Date().toISOString();report.status='pass';
}catch(error){report.status='fail';report.error=error.stack||String(error);console.error(report.error);process.exitCode=1;}
if(process.argv.includes('--runtime')){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(`Reference-case checks: ${report.status}; ${report.checks.length} passed${process.argv.includes('--runtime')?' (browser requested)':' (static)'}.`);
