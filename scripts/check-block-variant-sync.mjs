import fs from 'node:fs';
import vm from 'node:vm';
import {BLOCK_VARIANTS_V1} from '../functions/lib/block-variants-v1.js';

const source=fs.readFileSync(new URL('../public/data/block-registry/v1/manifest.js',import.meta.url),'utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'manifest.js'});
const browser=sandbox.window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;
if(!browser?.blocks)throw new Error('Browser block manifest not found.');

const browserMap=Object.fromEntries(browser.blocks.map(block=>[block.type,[...(block.variants||[])].sort()]));
const serverMap=Object.fromEntries(Object.entries(BLOCK_VARIANTS_V1).map(([type,variants])=>[type,[...variants].sort()]));
const browserTypes=Object.keys(browserMap).sort();
const serverTypes=Object.keys(serverMap).sort();
if(JSON.stringify(browserTypes)!==JSON.stringify(serverTypes))throw new Error(`Block variant type mismatch\nbrowser=${browserTypes.join(',')}\nserver=${serverTypes.join(',')}`);
for(const type of browserTypes){
  if(JSON.stringify(browserMap[type])!==JSON.stringify(serverMap[type]))throw new Error(`Variant mismatch for ${type}: browser=${browserMap[type].join(',')} server=${serverMap[type].join(',')}`);
}
console.log(`Block variant registry sync OK: ${browserTypes.length} block types.`);
