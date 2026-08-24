import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{throw new Error(message);};
const expect=(value,message)=>{if(!value)fail(message);};

const expected=['top-chapter-navigation','filter-chip-rail','horizontal-card-rail','collection-bottom-sheet','device-handoff-accordion','floating-action'];

const moduleRegistry=read('public/assets/js/platform-modules/module-registry-v1.js');
expect(moduleRegistry.includes("VALID_STATUS=new Set(['approved','candidate','deprecated'])"),'Module registry must enforce promotion states.');
expect(moduleRegistry.includes("VALID_SOURCE=new Set(['public-extracted','block-lab-approved','platform-core'])"),'Module registry must preserve provenance.');
expect(moduleRegistry.includes("definition.status!=='approved'"),'Non-approved modules must be blocked from normal consumers.');

const photoModules=read('public/assets/js/platform-modules/photo-core-modules-v1.js');
for(const id of expected)expect(photoModules.includes(`id:'${id}'`),`Missing canonical photo module: ${id}`);
expect((photoModules.match(/status:'approved'/g)||[]).length>=expected.length,'Photo-extracted modules must be explicitly approved.');
expect(photoModules.includes("source:'public-extracted'"),'Photo modules must record public-page provenance.');
expect(photoModules.includes("consumers:['public','library','editor']"),'Canonical modules must declare the three consumer stages.');

const dashboardHtml=read('public/ui-dashboard/index.html');
expect(dashboardHtml.includes('data-builder-view="library"'),'/ui-dashboard/ must be the UI Library.');
expect(!dashboardHtml.includes('builderOpenBlockPalette'),'Legacy screen composer controls must not remain on the UI Library route.');
expect(!dashboardHtml.includes('/ui-dashboard/sandbox/'),'UI Library must not boot from the old sandbox.');
expect(dashboardHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'UI Library must load the canonical module registry.');
expect(dashboardHtml.includes('/data/ui-capabilities/v1/module-extension-v1.js'),'UI Library controls must extend from approved modules.');

const libraryController=read('public/assets/js/ui-dashboard/builder-library-reference-v1.js');
expect(libraryController.includes("registry.listFor('library')"),'UI Library catalog must come from approved modules.');
expect(libraryController.includes('/ui-dashboard/module-preview/'),'UI Library must render through the shared module preview host.');
expect(!libraryController.includes('/ui-dashboard/reference-preview/'),'UI Library must not use the retired reference fixture.');
expect(!libraryController.includes("params.get('view')!=='library'"),'UI Library must not require the legacy view query.');

const modulePreview=read('public/ui-dashboard/module-preview/module-preview-v1.js');
expect(modulePreview.includes("const consumer=params.get('embed')==='editor'?'editor':'library'"),'Shared preview host must serve Library and Editor.');
expect(modulePreview.includes('platform-editor-module-props'),'Shared preview host must accept Editor props.');
expect(modulePreview.includes("moduleId==='device-handoff-accordion'"),'Shared preview must provide device handoff context without importing Block Lab.');

const editorHtml=read('public/editor-lab/index.html');
expect(!editorHtml.includes('/assets/js/block-lab/'),'Block Editor must not load Block Lab JavaScript.');
expect(!editorHtml.includes('/assets/styles/block-lab/'),'Block Editor must not load Block Lab styles.');
expect(!/class=["'][^"']*\bblock-lab\b/.test(editorHtml),'Block Editor must not use the Block Lab root class.');
expect(editorHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'Block Editor must load the canonical module registry.');
expect(editorHtml.includes('/assets/js/blocks/block-renderers-platform-modules-v1.js'),'Block Editor must use the approved module bridge.');
expect(editorHtml.includes('/data/block-registry/v1/editor-module-extension-v1.js'),'Block Editor manifest must extend from approved modules only.');

const editorJsDir=path.join(root,'public/assets/js/editor-lab');
for(const name of fs.readdirSync(editorJsDir)){
  if(!name.endsWith('.js')&&!name.endsWith('.mjs'))continue;
  const source=fs.readFileSync(path.join(editorJsDir,name),'utf8');
  expect(!source.includes('__BLOCK_LAB_DATA'),`Editor runtime ${name} still consumes Block Lab data.`);
  expect(!source.includes('bindBlockLabEnhancements'),`Editor runtime ${name} still invokes Block Lab interaction code.`);
}
const editorApp=read('public/assets/js/editor-lab/editor-app.js');
expect(editorApp.includes("modules.listFor('editor')"),'Block Editor insertion library must be registry-driven.');
expect(editorApp.includes("type:'ui-module'"),'Block Editor must persist module instances, not research block records.');
expect(!editorApp.includes('manifest.blocks.filter'),'Block Editor must not expose the raw research manifest.');

const labHtml=read('public/block-lab/index.html');
expect(labHtml.includes('RESEARCH ONLY'),'Block Lab must visibly identify itself as research-only.');
expect(labHtml.includes('/assets/js/block-lab/lab-data.js'),'Block Lab must retain its own research runtime.');
expect(!labHtml.includes('/assets/js/editor-lab/'),'Block Lab must not load Editor runtime.');
expect(!labHtml.includes('/ui-dashboard/module-preview/'),'Block Lab must not directly consume approved-module preview runtime.');

const adminShell=read('public/assets/js/admin/admin-shell-v1.js');
expect(!adminShell.includes("id:'builder'"),'Legacy screen composer must not remain a first-class admin role.');
expect(adminShell.includes("label:'UI 라이브러리'"),'Admin shell must expose UI Library.');
expect(adminShell.includes("label:'블록 연구실'"),'Admin shell must expose Block Lab.');
expect(adminShell.includes("label:'블록 에디터'"),'Admin shell must expose Block Editor.');
expect(adminShell.includes("href:'/block-editor/'"),'Block Editor must have a canonical route.');

const redirects=read('public/_redirects');
expect(redirects.includes('/block-editor /editor-lab/index.html 200'),'Canonical /block-editor route is missing.');
const routes=JSON.parse(read('public/_routes.json'));
expect(routes.exclude?.includes('/block-editor'),'Cloudflare Functions must exclude /block-editor.');
expect(routes.exclude?.includes('/block-editor/*'),'Cloudflare Functions must exclude /block-editor/*.');

const publicHtml=read('public/index.html');
expect(publicHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'Public page must load the common module registry.');
expect(publicHtml.includes('/assets/js/platform-modules/public-module-adapters-v1.js'),'Public page must route migrated modules through the common registry.');

console.log('Platform module boundary check passed.');
