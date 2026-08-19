import fs from 'node:fs';
import vm from 'node:vm';
import {UI_CAPABILITIES_V1,UI_BUILTIN_PRESETS_V1,sanitizeUiConfigV1} from '../functions/lib/ui-capabilities-v1.js';

const source=fs.readFileSync(new URL('../public/data/ui-capabilities/v1/manifest.js',import.meta.url),'utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'ui-capability-manifest.js'});
const browser=sandbox.window.__PLATFORM_UI_CAPABILITY_MANIFEST;
if(!browser?.capabilities)throw new Error('Browser UI capability manifest not found.');

const browserIds=browser.capabilities.map(item=>item.id).sort();
const serverIds=[...UI_CAPABILITIES_V1].sort();
if(JSON.stringify(browserIds)!==JSON.stringify(serverIds))throw new Error(`UI capability mismatch\nbrowser=${browserIds.join(',')}\nserver=${serverIds.join(',')}`);

const browserPresets=new Map();
for(const capability of browser.capabilities){
  for(const preset of capability.presets||[]){
    if(!preset?.id)continue;
    browserPresets.set(preset.id,{
      capabilityId:capability.id,
      source:String(preset.source||''),
      status:String(preset.status||''),
      config:sanitizeUiConfigV1(preset.config||{})
    });
  }
}

const serverPresetIds=Object.keys(UI_BUILTIN_PRESETS_V1).sort();
const browserPresetIds=[...browserPresets.keys()].sort();
if(JSON.stringify(browserPresetIds)!==JSON.stringify(serverPresetIds)){
  throw new Error(`UI built-in preset mismatch\nbrowser=${browserPresetIds.join(',')}\nserver=${serverPresetIds.join(',')}`);
}

for(const id of serverPresetIds){
  const browserPreset=browserPresets.get(id);
  const serverPreset=UI_BUILTIN_PRESETS_V1[id];
  const expected={capabilityId:serverPreset.capabilityId,source:String(serverPreset.source||''),status:String(serverPreset.status||''),config:sanitizeUiConfigV1(serverPreset.config||{})};
  if(JSON.stringify(browserPreset)!==JSON.stringify(expected))throw new Error(`UI built-in preset config mismatch: ${id}`);
}

console.log(`UI capability registry sync OK: ${browserIds.length} capabilities / ${serverPresetIds.length} built-in presets.`);
