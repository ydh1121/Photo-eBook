import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.UI_DASHBOARD_BASE_URL||'http://127.0.0.1:4173';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitUntil(fn,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){try{if(await fn())return;}catch{}await sleep(80);}throw new Error('debug wait timeout');}
const executablePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!executablePath)throw new Error('Chrome not found');
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});

function diagnosticScript(node){
  const rows=[];
  function visit(rules,source){
    if(!rules)return;
    for(let i=0;i<rules.length;i++){
      const rule=rules[i];
      if(rule.type===CSSRule.STYLE_RULE&&rule.selectorText&&rule.style){
        let matches=false;try{matches=node.matches(rule.selectorText);}catch{}
        if(!matches)continue;
        const bg=rule.style.getPropertyValue('background');
        const bgc=rule.style.getPropertyValue('background-color');
        const bgi=rule.style.getPropertyValue('background-image');
        if(!bg&&!bgc&&!bgi)continue;
        rows.push({source,selector:rule.selectorText,background:bg,backgroundPriority:rule.style.getPropertyPriority('background'),backgroundColor:bgc,backgroundColorPriority:rule.style.getPropertyPriority('background-color'),backgroundImage:bgi,backgroundImagePriority:rule.style.getPropertyPriority('background-image')});
        continue;
      }
      if(rule.cssRules)visit(rule.cssRules,source);
    }
  }
  for(const sheet of [...document.styleSheets]){
    let rules;try{rules=sheet.cssRules;}catch{continue;}
    visit(rules,sheet.href||sheet.ownerNode?.id||'inline-style');
  }
  const computed=getComputedStyle(node);
  return {
    className:node.className,
    inlineStyle:node.getAttribute('style')||'',
    computedBackground:computed.background,
    computedBackgroundColor:computed.backgroundColor,
    htmlFamily:document.documentElement.dataset.platformChipFamily||'',
    builderFamily:node.dataset.builderFamily||node.parentElement?.dataset.builderFamily||'',
    globalStylePresent:Boolean(document.querySelector('#platform-global-chip-style-v3')),
    matchingBackgroundRules:rows
  };
}

try{
  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=filter-chip-rail`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#builderFrame');
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.querySelector('#sandboxPreviewRoot[data-preview-kind="filter-chip-rail"]')?.dataset.specimenReady==='true'));
  await page.locator('[data-kit-mode="material-flat"]').click();
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.documentElement?.dataset.platformChipFamily==='material-flat'));
  let handle=await page.$('#builderFrame');
  let frame=await handle.contentFrame();
  console.log('FILTER_CHIP_CASCADE='+JSON.stringify(await frame.locator('#collectionFilters .collection-filter').nth(1).evaluate(diagnosticScript),null,2));

  await page.goto(`${BASE}/ui-dashboard/?view=library&ui=top-chapter-navigation`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#builderFrame');
  await waitUntil(()=>page.evaluate(()=>document.querySelector('#builderFrame')?.contentDocument?.querySelector('.nav-scroll')?.dataset.builderFamily==='material-flat'));
  handle=await page.$('#builderFrame');
  frame=await handle.contentFrame();
  console.log('TOP_NAV_CASCADE='+JSON.stringify(await frame.locator('.nav-scroll').evaluate(diagnosticScript),null,2));
}finally{
  await browser.close();
}
