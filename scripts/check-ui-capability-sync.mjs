import fs from 'node:fs';
import vm from 'node:vm';
import {UI_CAPABILITIES_V1} from '../functions/lib/ui-capabilities-v1.js';

const source=fs.readFileSync(new URL('../public/data/ui-capabilities/v1/manifest.js',import.meta.url),'utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'ui-capability-manifest.js'});
const browser=sandbox.window.__PLATFORM_UI_CAPABILITY_MANIFEST;
if(!browser?.capabilities)throw new Error('Browser UI capability manifest not found.');
const browserIds=browser.capabilities.map(item=>item.id).sort();
const serverIds=[...UI_CAPABILITIES_V1].sort();
if(JSON.stringify(browserIds)!==JSON.stringify(serverIds))throw new Error(`UI capability mismatch\nbrowser=${browserIds.join(',')}\nserver=${serverIds.join(',')}`);
console.log(`UI capability registry sync OK: ${browserIds.length} capabilities.`);
