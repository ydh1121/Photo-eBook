import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const browserPath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!browserPath)throw new Error('Chrome not found');
const browser=await chromium.launch({headless:true,executablePath:browserPath,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('console',message=>console.log('[browser console]',message.type(),message.text()));
  page.on('pageerror',error=>console.log('[browser pageerror]',error.stack||error.message));
  page.on('requestfailed',request=>console.log('[request failed]',request.url(),request.failure()?.errorText||''));
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(3500);
  const state=await page.evaluate(()=>{
    const frame=document.querySelector('#builderFrame');
    const shell=document.querySelector('#builderCanvasShell');
    const stage=document.querySelector('.builder-stage');
    const workspace=document.querySelector('.builder-kit-workspace');
    const frameStyle=frame?getComputedStyle(frame):null;
    const shellStyle=shell?getComputedStyle(shell):null;
    return {
      readyState:document.readyState,
      href:location.href,
      builderView:document.querySelector('.builder-shell')?.dataset.builderView||null,
      markers:{
        entry:Boolean(window.__platformBuilderAuditEntryV1),
        chipManifestV3:Boolean(window.__platformGlobalChipManifestV3),
        runtimeLoader:Boolean(window.__platformBuilderRuntimeAuditLoaderV1),
        libraryKit:Boolean(window.__platformLibraryKitV2),
        globalChipKitV4:Boolean(window.__platformGlobalChipKitV4)
      },
      frame:{
        exists:Boolean(frame),
        connected:Boolean(frame?.isConnected),
        parent:frame?.parentElement?.className||null,
        rect:frame?frame.getBoundingClientRect().toJSON():null,
        display:frameStyle?.display||null,
        visibility:frameStyle?.visibility||null,
        opacity:frameStyle?.opacity||null,
        src:frame?.getAttribute('src')||null
      },
      shell:{parent:shell?.parentElement?.className||null,rect:shell?shell.getBoundingClientRect().toJSON():null,display:shellStyle?.display||null},
      stage:{className:stage?.className||null,display:stage?getComputedStyle(stage).display:null},
      workspace:{exists:Boolean(workspace),rect:workspace?workspace.getBoundingClientRect().toJSON():null,display:workspace?getComputedStyle(workspace).display:null},
      scripts:[...document.scripts].map(script=>script.src).filter(Boolean)
    };
  });
  console.log('[ui-library-debug]',JSON.stringify(state,null,2));
}finally{
  await browser.close();
}
