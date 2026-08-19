import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {BLOCK_REGISTRY_V1} from '../functions/lib/block-registry-v1.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const manifestPath=path.join(root,'public/data/block-registry/v1/manifest.js');
const source=await fs.readFile(manifestPath,'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:manifestPath});
const manifest=sandbox.window.__PLATFORM_BLOCK_REGISTRY_MANIFEST;

if(!manifest||!Array.isArray(manifest.blocks)){
  console.error('Block Registry manifest를 읽지 못했습니다.');
  process.exit(1);
}

const browser=new Map(manifest.blocks.map(item=>[String(item.type),String(item.status||'unknown')]));
const server=new Map(Object.entries(BLOCK_REGISTRY_V1));
const errors=[];

for(const [type,status] of browser){
  if(!server.has(type))errors.push(`server Registry에 없는 type: ${type}`);
  else if(server.get(type)!==status)errors.push(`status 불일치 ${type}: browser=${status}, server=${server.get(type)}`);
}
for(const type of server.keys())if(!browser.has(type))errors.push(`browser manifest에 없는 type: ${type}`);

if(errors.length){
  console.error(`Block Registry sync 실패 (${errors.length})`);
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Block Registry sync OK: ${browser.size} types / manifest v${manifest.version}`);
