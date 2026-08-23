import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitUntil(fn,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){try{if(await fn())return;}catch{}await sleep(80);}throw new Error('debug wait timeout');}
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!executablePath)throw new Error('Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
try{
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#builderFrame');
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.querySelector('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]')?.dataset.specimenReady==='true'));
  await page.locator('[data-kit-mode="material-flat"]').click();
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformChipFamily==='material-flat'));
  const handle=await page.$('#builderFrame');
  const frame=await handle.contentFrame();
  const diagnostic=await frame.locator('#collectionFilters .collection-filter').nth(1).evaluate(node=>{
    const rows=[];
    function visit(rules,source){
      if(!rules)return;
      for(let i=0;i<rules.length;i++){
        const rule=rules[i];
        if(rule.cssRules){visit(rule.cssRules,source);continue;}
        if(!rule.selectorText||!rule.style)continue;
        let matches=false;try{matches=node.matches(rule.selectorText);}catch{}
        if(!matches)continue;
        const bg=rule.style.getPropertyValue('background');
        const bgc=rule.style.getPropertyValue('background-color');
        const bgi=rule.style.getPropertyValue('background-image');
        if(!bg&&!bgc&&!bgi)continue;
        rows.push({source,selector:rule.selectorText,background:bg,backgroundPriority:rule.style.getPropertyPriority('background'),backgroundColor:bgc,backgroundColorPriority:rule.style.getPropertyPriority('background-color'),backgroundImage:bgi,backgroundImagePriority:rule.style.getPropertyPriority('background-image')});
      }
    }
    for(const sheet of [...document.styleSheets]){
      let rules;try{rules=sheet.cssRules;}catch{continue;}
      visit(rules,sheet.href||sheet.ownerNode?.id||sheet.ownerNode?.getAttribute?.('data-debug-name')||'inline-style');
    }
    const computed=getComputedStyle(node);
    return {
      className:node.className,
      inlineStyle:node.getAttribute('style')||'',
      inlineBackground:node.style.getPropertyValue('background'),
      inlineBackgroundPriority:node.style.getPropertyPriority('background'),
      computedBackground:computed.background,
      computedBackgroundColor:computed.backgroundColor,
      htmlFamily:document.documentElement.dataset.platformChipFamily||'',
      parentId:node.parentElement?.id||'',
      parentClass:node.parentElement?.className||'',
      parentBuilderFamily:node.parentElement?.dataset.builderFamily||'',
      globalStylePresent:Boolean(document.querySelector('#platform-global-chip-style-v3')),
      globalStyleHasTransparentRule:(document.querySelector('#platform-global-chip-style-v3')?.textContent||'').includes('background:transparent!important'),
      matchingBackgroundRules:rows
    };
  });
  console.log('CHIP_CASCADE_DIAGNOSTIC='+JSON.stringify(diagnostic,null,2));
}finally{
  await browser.close();
}
