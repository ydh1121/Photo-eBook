#!/usr/bin/env node
/* Verify authored samples against real local SQLite delivery, then Chromium. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {startEbookPreviewServer} from './ebook/preview-server.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/ebook-samples');fs.mkdirSync(out,{recursive:true});
const json=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const catalog=json('public/books/catalog.json'),assets=json('content/ebooks/v1/assets.json');
const report={scope:'Authored samples in local SQLite-backed preview; no remote D1 or physical Android assertion',checks:[],pages:[],screenshots:[],errors:[]};
const pass=(name,detail)=>{report.checks.push({name,status:'pass',detail});console.log('PASS '+name);};
let server,browser;
try{
  server=await startEbookPreviewServer({port:0});
  for(const asset of assets){const response=await fetch(server.url+asset.servedPath);assert.equal(response.status,200);const bytes=new Uint8Array(await response.arrayBuffer());assert.equal(bytes.length,asset.bytes);assert.equal(hash(bytes),asset.sha256);assert.equal(response.headers.get('X-Ebook-Preview'),'local-sqlite');}
  pass('all-original-webp-bytes-through-sqlite-http',{images:assets.length,bytes:assets.reduce((n,a)=>n+a.bytes,0)});
  assert.equal(catalog.regularBooksCompleted,0);assert.equal(catalog.samples,3);
  for(const book of catalog.books){
    const manifest=await fetch(server.url+book.manifestUrl).then(r=>r.json());assert.equal(manifest.pages.length,24);assert.equal(manifest.frontMatterExcluded,true);
    for(const ref of manifest.pages){const raw=await fetch(server.url+ref.src).then(r=>r.text());assert.equal(hash(raw),ref.contentHash);assert.equal(JSON.parse(raw).pageNumber,ref.pageNumber);}
  }
  pass('three-sample-editions-72-exact-pages-no-regular-count');
  if(process.argv.includes('--runtime')){
    let playwright;try{playwright=await import('playwright');}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;playwright=await import(pathToFileURL(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright/index.mjs')).href);}
    browser=await playwright.chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));
    for(const book of catalog.books){
      const manifest=json('public'+book.manifestUrl);
      await page.goto(server.url+book.readerUrl);await page.locator('[data-reader-ready="true"]').waitFor();
      for(const ref of manifest.pages){
        await page.evaluate(async id=>{await window.PersonalEduReaderEntryV1.instance.api.navigate(id);},ref.pageId);
        await page.locator('[data-reader-ready="true"]').waitFor();
        for(const img of await page.locator('[data-reader-page] img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
        const state=await page.evaluate(()=>({state:PersonalEduReaderEntryV1.instance.api.getState(),viewport:innerWidth,width:document.documentElement.scrollWidth,bodyWidth:document.querySelector('[data-reader-page]').scrollWidth,bodyClient:document.querySelector('[data-reader-page]').clientWidth,readingHeight:document.querySelector('[data-reader-reading]').clientHeight,images:[...document.querySelectorAll('[data-reader-page] img')].map(img=>({ok:img.complete&&img.naturalWidth>0,url:img.src})),external:[...document.querySelectorAll('[data-reader-page] a[href^="https:"]')].map(a=>({target:a.target,rel:a.rel})),folio:document.querySelector('.ebook-reader__folio').textContent}));
        assert.equal(state.state.pageId,ref.pageId);assert(state.width<=state.viewport+1&&state.bodyWidth<=state.bodyClient+1,'Page overflows mobile width');assert(state.readingHeight>=240,'Tools crowd out reading');assert(state.images.every(img=>img.ok&&img.url.includes('/api/ebook-assets/')),'Sample image delivery failed');assert(state.external.every(a=>a.target==='_blank'&&a.rel.includes('noopener')),'Sources must open a separate safe tab');assert(state.folio.includes(String(ref.pageNumber)),'Authored page footer missing');
        await page.locator('[data-reader-reading]').evaluate(el=>el.scrollTop=0);
        const file=`${book.bookId}-${String(ref.pageNumber).padStart(2,'0')}-mobile.png`;await page.screenshot({path:path.join(out,file)});
        report.pages.push({bookId:book.bookId,pageId:ref.pageId,pageNumber:ref.pageNumber,images:state.images.length,readingHeight:state.readingHeight,overflow:false});report.screenshots.push(file);
      }
      await page.locator('[data-reader-action="toc"]').click();assert.equal(await page.locator('[data-reader-go]').count(),24);await page.locator('.ebook-reader__cover img').evaluate(img=>img.decode());await page.keyboard.press('Escape');
      await page.locator('[data-reader-reading]').evaluate(el=>el.scrollTop=el.scrollHeight*.5);await page.evaluate(()=>PersonalEduReaderEntryV1.instance.api.savePosition());await page.reload();await page.locator('[data-reader-ready="true"]').waitFor();assert.equal((await page.evaluate(()=>PersonalEduReaderEntryV1.instance.api.getState())).pageId,manifest.pages.at(-1).pageId);assert(await page.locator('[data-reader-reading]').evaluate(el=>el.scrollTop>0));
      pass(book.bookId+'-24-mobile-pages-cover-contents-resume',{bodyPages:24});
    }
    await page.setViewportSize({width:1280,height:900});await page.goto(server.url+catalog.books.find(b=>b.bookId==='video-entry').readerUrl);await page.locator('[data-reader-ready="true"]').waitFor();await page.screenshot({path:path.join(out,'reader-desktop.png')});report.screenshots.push('reader-desktop.png');
    for(const book of catalog.books){await page.goto(server.url+`/staging/ebook-reader-preview/${book.bookId}.html`);await page.locator('[data-reader-ready="true"]').waitFor();assert.equal(await page.locator('[data-reader-page]').count(),1);await page.locator('[data-reader-page] img').first().evaluate(img=>img.decode());}
    pass('portable-review-uses-same-owner-and-local-original-images',{editions:3});
    assert.deepEqual(report.errors,[]);pass('no-uncaught-reader-page-errors');
  }
  report.status='pass';
}catch(error){report.status='fail';report.error=error.stack||String(error);process.exitCode=1;console.error(error);}
finally{await browser?.close();await server?.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
