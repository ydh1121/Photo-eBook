import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{throw new Error(message);};
const expect=(value,message)=>{if(!value)fail(message);};

const editorHtml=read('public/editor-lab/index.html');
expect(!editorHtml.includes('/assets/js/block-lab/'),'Page Editor must not load Block Lab JavaScript.');
expect(!editorHtml.includes('/assets/styles/block-lab/'),'Page Editor must not load Block Lab styles.');
expect(!/class=["'][^"']*\bblock-lab\b/.test(editorHtml),'Page Editor must not use the Block Lab root class.');
expect(editorHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'Page Editor must load the canonical module registry.');
expect(editorHtml.includes('/assets/js/blocks/block-renderers-platform-modules-v1.js'),'Page Editor must use the approved module block bridge.');
expect(editorHtml.includes('/data/block-registry/v1/editor-module-extension-v1.js'),'Page Editor must extend its block manifest from approved modules only.');

const editorJsDir=path.join(root,'public/assets/js/editor-lab');
for(const name of fs.readdirSync(editorJsDir)){
  if(!name.endsWith('.js')&&!name.endsWith('.mjs'))continue;
  const source=fs.readFileSync(path.join(editorJsDir,name),'utf8');
  expect(!source.includes('__BLOCK_LAB_DATA'),`Editor runtime ${name} still consumes Block Lab data.`);
  expect(!source.includes('bindBlockLabEnhancements'),`Editor runtime ${name} still invokes Block Lab interaction code.`);
}

const editorApp=read('public/assets/js/editor-lab/editor-app.js');
expect(editorApp.includes("modules.listFor('editor')"),'Page Editor library must be driven by approved platform modules.');
expect(!editorApp.includes('manifest.blocks.filter'),'Page Editor must not expose the raw research block manifest as its insertion library.');

const labHtml=read('public/block-lab/index.html');
expect(labHtml.includes('/assets/js/block-lab/lab-data.js'),'Block Lab must retain its own research data runtime.');
expect(labHtml.includes('/assets/js/block-lab/lab-app.js')||labHtml.includes('/assets/js/block-lab/lab-'),'Block Lab must remain a self-contained research surface.');

const dashboardHtml=read('public/ui-dashboard/index.html');
expect(dashboardHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'UI Library must load the canonical module registry.');
expect(dashboardHtml.includes('/data/ui-capabilities/v1/module-extension-v1.js'),'UI Library capabilities must follow the approved module registry.');

const libraryController=read('public/assets/js/ui-dashboard/builder-library-reference-v1.js');
expect(libraryController.includes("moduleRegistry.listFor('library')"),'UI Library catalog must come from approved modules.');
expect(libraryController.includes('/ui-dashboard/module-preview/'),'UI Library must render through the canonical module preview host.');
expect(!libraryController.includes('/ui-dashboard/reference-preview/'),'UI Library must not use the retired reference fixture.');

const modulePreview=read('public/ui-dashboard/module-preview/module-preview-v1.js');
expect(modulePreview.includes("consumer=params.get('embed')==='editor'?'editor':'library'"),'Shared preview host must serve both Library and Editor consumers.');
expect(modulePreview.includes('platform-editor-module-props'),'Shared preview host must accept editor module props.');

const moduleRegistry=read('public/assets/js/platform-modules/module-registry-v1.js');
expect(moduleRegistry.includes("VALID_STATUS=new Set(['approved','candidate','deprecated'])"),'Module registry must enforce promotion states.');
expect(moduleRegistry.includes("VALID_SOURCE=new Set(['public-extracted','block-lab-approved','platform-core'])"),'Module registry must record module provenance.');

const photoModules=read('public/assets/js/platform-modules/photo-core-modules-v1.js');
for(const id of ['top-chapter-navigation','horizontal-card-rail','filter-chip-rail','collection-bottom-sheet','device-handoff-accordion','floating-action']){
  expect(photoModules.includes(`id:'${id}'`),`Missing approved photo module: ${id}`);
}
expect((photoModules.match(/status:'approved'/g)||[]).length>=6,'Photo-extracted modules must be explicitly approved.');
expect(photoModules.includes("source:'public-extracted'"),'Photo modules must preserve public-page provenance.');

const publicHtml=read('public/index.html');
expect(publicHtml.includes('/assets/js/platform-modules/module-registry-v1.js'),'Public page must load the common module registry.');
expect(publicHtml.includes('/assets/js/platform-modules/public-module-adapters-v1.js'),'Public page must route migrated modules through the common registry.');

console.log('Platform module boundary check passed.');
