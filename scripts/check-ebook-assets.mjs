#!/usr/bin/env node
/* Static publication QA. Local HTTP checks are not Cloudflare deployment proof. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {request as httpRequest} from 'node:http';
import {createHash} from 'node:crypto';
import {EBOOK_ASSET_PREFIX,EBOOK_STATIC_LIMITS,readPublicInventory,mergePublicInventory,assessStaticPublication,regularVolumeProjection} from './ebook/static-publication-budget.mjs';
import {startEbookPreviewServer} from './ebook/preview-server.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/ebook-qa');
const read=file=>fs.readFileSync(path.join(root,file));
const json=file=>JSON.parse(read(file));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const encode=value=>JSON.stringify(value,null,2)+'\n';
const results=[];
const report={scope:'Approved WebP originals, static publication bytes, Free file limits and local HTTP only; live Pages headers/routing are a separate deployment check.',results};
async function test(name,fn){await fn();results.push({name,pass:true});console.log('PASS '+name);}
const metadata=count=>Array.from({length:count},(_,i)=>({path:`fixture/${i}.txt`,bytes:1}));
const single=(file,bytes)=>assessStaticPublication([{path:file,bytes}]);
const assets=json('content/ebooks/v1/assets.json'),catalog=json('public/books/catalog.json');
const glob=pattern=>new RegExp('^'+pattern.split('*').map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let server,fixtureServer,fixture;
try{
  await test('approved-source-and-canonical-static-copy-bytes',()=>{
    const ids=new Set(),hashes=new Map();
    for(const asset of assets){
      assert(!ids.has(asset.assetId));ids.add(asset.assetId);
      assert.equal(asset.sourcePath,`content/ebooks/v1/assets/${asset.assetId}.webp`);
      assert.equal(asset.servedPath,`${EBOOK_ASSET_PREFIX}${asset.sha256}.webp`);
      const original=read(asset.sourcePath),published=read('public'+asset.servedPath);
      assert(original.equals(published));assert.equal(hash(original),asset.sha256);assert.equal(original.length,asset.bytes);
      assert.equal(original.subarray(0,4).toString(),'RIFF');assert.equal(original.subarray(8,12).toString(),'WEBP');
      assert(Number.isInteger(asset.width)&&asset.width>0&&Number.isInteger(asset.height)&&asset.height>0);
      if(hashes.has(asset.sha256))assert.deepEqual(hashes.get(asset.sha256),[asset.bytes,asset.width,asset.height]);
      hashes.set(asset.sha256,[asset.bytes,asset.width,asset.height]);
    }
    report.currentOriginals={records:assets.length,uniqueWebps:hashes.size,bytes:[...hashes.values()].reduce((n,v)=>n+v[0],0)};
  });
  await test('retained-static-assets-have-hash-names-and-exact-webp-bytes',()=>{
    const directory='public'+EBOOK_ASSET_PREFIX;
    for(const name of fs.readdirSync(path.join(root,directory))){
      assert(/^[a-f0-9]{64}\.webp$/.test(name),'Only delivery WebP files belong in the public asset directory');
      const bytes=read(directory+name);assert.equal(hash(bytes),name.slice(0,-5));
      assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
    }
  });
  await test('source-manuscripts-and-page-hashes-remain-exact',()=>{
    const provenance=json('content/ebooks/v1/source-provenance.json');
    for(const book of catalog.books){
      const raw=read(`content/ebooks/v1/sources/${book.bookId}.json`),source=JSON.parse(raw),manifest=json('public'+book.manifestUrl);
      const proof=provenance.books.find(v=>v.bookId===book.bookId&&v.editionId===book.editionId);
      assert.equal(hash(raw),proof.sourceSha256);assert.equal(manifest.sourceSha256,proof.sourceSha256);
      for(const ref of manifest.pages){
        const bytes=read('public'+ref.src),sourcePage=source.pages.find(p=>p.pageId===ref.pageId);
        assert.equal(bytes.toString('utf8'),encode(sourcePage));assert.equal(hash(bytes),ref.contentHash);
      }
    }
  });
  await test('manifests-include-only-used-static-assets',()=>{
    for(const book of catalog.books){
      const source=json(`content/ebooks/v1/sources/${book.bookId}.json`),manifest=json('public'+book.manifestUrl);
      const used=new Set(source.cover?[source.cover.assetId]:[]);
      for(const page of source.pages)for(const block of page.blocks)if(block.type==='image')used.add(block.assetId);
      assert.deepEqual(Object.keys(manifest.assets).sort(),[...used].sort());
      for(const item of Object.values(manifest.assets)){assert.equal(item.src,`${EBOOK_ASSET_PREFIX}${item.sha256}.webp`);const bytes=read('public'+item.src);assert.equal(hash(bytes),item.sha256);assert.equal(bytes.length,item.bytes);}
    }
  });
  await test('reader-catalog-uses-approved-book-metadata',()=>{
    const html=read('public/reader/index.html').toString(),start='<!-- ebook-catalog:start -->',end='<!-- ebook-catalog:end -->';
    assert.equal(html.split(start).length,2);assert.equal(html.split(end).length,2);
    const section=html.slice(html.indexOf(start)+start.length,html.indexOf(end));
    for(const book of catalog.books){assert(section.includes(`href="${escape(book.readerUrl)}"`));assert(section.includes(escape(book.title)));assert(section.includes(escape(book.subtitle)));assert(section.includes(`본문 ${book.bodyPages}쪽`));}
    assert.equal((section.match(/<li>/g)||[]).length,catalog.books.length);
  });
  await test('ebook-routes-bypass-functions',()=>{
    const routes=json('public/_routes.json');assert.equal(routes.version,1);
    for(const pathname of ['/reader','/reader/','/books/catalog.json',...assets.map(a=>a.servedPath),...catalog.books.map(b=>b.manifestUrl)])assert(routes.exclude.some(pattern=>glob(pattern).test(pathname)),`Static path invokes a Function: ${pathname}`);
    assert(fs.existsSync(path.join(root,'public/404.html')),'Pages must have a real missing-asset fallback');
  });
  await test('unshipped-ebook-database-paths-are-retired',()=>{
    for(const file of ['functions/api/ebook-assets/[asset].js','functions/lib/ebook-asset-budget.js','functions/lib/ebook-asset-publisher.js','functions/lib/ebook-asset-service.js','functions/lib/ebook-assets-manifest.js','migrations/ebook-assets/0001-assets.sql','scripts/ebook/sqlite-d1-adapter.mjs'])assert(!fs.existsSync(path.join(root,file)),file+' is still active');
    for(const file of ['scripts/ebook/preview-server.mjs','scripts/build-ebooks.mjs'])assert(!/EBOOK_BUDGET_ATTESTATION|EBOOK_ASSETS_DB|node:sqlite|\/api\/ebook-assets\//.test(read(file).toString()));
  });
  await test('actual-public-tree-fits-free-and-reader-budgets',()=>{
    const inventory=readPublicInventory(path.join(root,'public')),budget=assessStaticPublication(inventory);assert(budget.ok,JSON.stringify(budget.failures));
    assert(!inventory.some(v=>v.path==='publication-budget.json'||v.path.startsWith('artifacts/')));
    report.publicationBudget=budget;report.regularVolumeProjection=regularVolumeProjection(budget);
  });
  await test('exact-free-file-count-is-accepted-with-warning',()=>{const b=assessStaticPublication(metadata(20000));assert(b.ok);assert.equal(b.remainingFiles,0);assert(b.warnings.some(v=>v.code==='pages_file_count_near_limit'));});
  await test('free-file-count-overflow-is-blocked',()=>{const b=assessStaticPublication(metadata(20001));assert(!b.ok);assert(b.failures.some(v=>v.code==='pages_file_count'));});
  await test('file-count-warning-starts-at-ninety-percent',()=>{assert.equal(assessStaticPublication(metadata(17999)).warnings.length,0);assert.equal(assessStaticPublication(metadata(18000)).warnings.length,1);});
  await test('exact-pages-single-file-limit-is-accepted',()=>assert(single('downloads/large.pdf',25*1024*1024).ok));
  await test('pages-single-file-overflow-is-blocked',()=>assert(!single('downloads/large.pdf',25*1024*1024+1).ok));
  await test('single-file-early-warning-is-not-an-invented-total-cap',()=>{const b=assessStaticPublication([{path:'a.pdf',bytes:EBOOK_STATIC_LIMITS.warnFileBytes},{path:'b.pdf',bytes:EBOOK_STATIC_LIMITS.warnFileBytes}]);assert(b.ok);assert.equal(b.warnings.length,2);assert(b.totalBytes>EBOOK_STATIC_LIMITS.maxFileBytes);});
  await test('reader-manifest-bound-is-enforced',()=>{assert(single('books/b/e/manifest.json',262144).ok);assert(!single('books/b/e/manifest.json',262145).ok);});
  await test('reader-page-bound-is-enforced',()=>{assert(single('books/b/e/pages/p.json',524288).ok);assert(!single('books/b/e/pages/p.json',524289).ok);});
  await test('project-webp-delivery-bound-is-enforced',()=>{const name=EBOOK_ASSET_PREFIX.slice(1)+'a'.repeat(64)+'.webp';assert(single(name,1500000).ok);assert(!single(name,1500001).ok);});
  await test('unexpected-master-or-unhashed-delivery-file-is-blocked',()=>assert(!single(EBOOK_ASSET_PREFIX.slice(1)+'original.png',100).ok));
  await test('retained-editions-and-assets-are-counted-while-replacements-are-not-doubled',()=>{const merged=mergePublicInventory([{path:'books/old.json',bytes:10},{path:'books/new.json',bytes:20}],[{path:'books/new.json',bytes:30},{path:'assets/extra.webp',bytes:40}]);const b=assessStaticPublication(merged);assert.equal(b.fileCount,3);assert.equal(b.totalBytes,80);});
  await test('unsafe-path-size-and-duplicate-publication-records-are-rejected',()=>{
    assert.throws(()=>single('../private.txt',1));assert.throws(()=>single('/outside.txt',1));assert.throws(()=>single('a.txt',NaN));assert.throws(()=>single('a.txt',-1));
    assert.throws(()=>mergePublicInventory([],[{path:'a',bytes:1},{path:'a',bytes:1}]));
  });
  fixture=fs.mkdtempSync(path.join(os.tmpdir(),'ebook-static-check-'));fs.mkdirSync(path.join(fixture,'public'));
  fs.writeFileSync(path.join(fixture,'private.txt'),'private fixture');fs.writeFileSync(path.join(fixture,'public/index.html'),'static fixture');
  await test('inventory-rejects-symlinks',()=>{const link=path.join(fixture,'public/leak.txt');fs.symlinkSync(path.join(fixture,'private.txt'),link);assert.throws(()=>readPublicInventory(path.join(fixture,'public')),/symlink/);fs.unlinkSync(link);});
  await test('future-volume-scenarios-remain-explicit-estimates',()=>{const forecast=regularVolumeProjection({fileCount:522});assert.equal(forecast.kind,'estimate_only');assert(forecast.scenarios.some(v=>v.editionSets===1&&v.additionalUniqueImages===7560&&v.estimatedFiles===15660));assert(forecast.scenarios.some(v=>v.editionSets===2&&v.additionalUniqueImages===7560&&!v.withinFileLimit));});

  server=await startEbookPreviewServer({port:0});
  await test('local-static-preview-has-no-database-or-account-proof',async()=>{const health=await fetch(server.url+'/__ebook-preview__/health').then(r=>r.json());assert.equal(health.mode,'local-static');assert.equal(health.providerVerification,false);assert.equal(health.webpFiles,report.publicationBudget.ebook.webpFiles);assert(!('db' in server));assert(!/attestation|account|token/i.test(JSON.stringify(health)));});
  await test('all-original-webps-serve-exact-static-http-bytes',async()=>{for(const asset of assets){const r=await fetch(server.url+asset.servedPath);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');assert.equal(r.headers.get('x-ebook-preview'),'local-static');assert.match(r.headers.get('cache-control'),/immutable/);assert.equal(hash(Buffer.from(await r.arrayBuffer())),asset.sha256);}});
  await test('local-head-has-metadata-and-no-body',async()=>{for(const asset of assets){const r=await fetch(server.url+asset.servedPath,{method:'HEAD'});assert.equal(r.status,200);assert.equal(Number(r.headers.get('content-length')),asset.bytes);assert.equal((await r.arrayBuffer()).byteLength,0);}});
  await test('local-conditional-get-uses-existing-static-bytes',async()=>{const url=server.url+assets[0].servedPath,first=await fetch(url);await first.arrayBuffer();const r=await fetch(url,{headers:{'If-None-Match':first.headers.get('etag')}});assert.equal(r.status,304);assert.equal((await r.arrayBuffer()).byteLength,0);});
  await test('missing-static-image-stays-404-for-get-head-and-conditional',async()=>{const url=server.url+EBOOK_ASSET_PREFIX+'0'.repeat(64)+'.webp';for(const options of [{},{method:'HEAD'},{headers:{'If-None-Match':'*'}}])assert.equal((await fetch(url,options)).status,404);});
  await test('retired-api-and-private-source-tree-are-not-static-file-origins',async()=>{assert.equal((await fetch(server.url+'/api/ebook-assets/'+assets[0].sha256+'.webp')).status,404);assert.equal((await fetch(server.url+'/'+assets[0].sourcePath)).status,404);});
  await test('catalog-and-manifest-local-cache-policy-revalidates',async()=>{for(const url of ['/books/catalog.json',catalog.books[0].manifestUrl]){const r=await fetch(server.url+url);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/(?:no-cache|must-revalidate)/);assert(!/immutable/.test(r.headers.get('cache-control')));await r.arrayBuffer();}});
  await test('preview-rejects-writes',async()=>assert.equal((await fetch(server.url+assets[0].servedPath,{method:'POST',body:'not a file'})).status,405));
  fixtureServer=await startEbookPreviewServer({port:0,repoRoot:fixture});
  await test('runtime-realpath-does-not-follow-a-late-external-symlink',async()=>{fs.symlinkSync(path.join(fixture,'private.txt'),path.join(fixture,'public/leak.txt'));assert.equal((await fetch(fixtureServer.url+'/leak.txt')).status,403);});
  await test('encoded-traversal-is-rejected-before-file-resolution',async()=>{
    const status=await new Promise((resolve,reject)=>{const req=httpRequest(fixtureServer.url,{path:'/%2e%2e/private.txt'},r=>{r.resume();resolve(r.statusCode);});req.on('error',reject);req.end();});assert.equal(status,400);
  });
  await test('local-preview-close-is-idempotent',async()=>{await fixtureServer.close();await fixtureServer.close();fixtureServer=null;});
  report.status='pass';
}catch(error){report.status='fail';report.error=error.stack||String(error);process.exitCode=1;console.error(error);}
finally{
  await fixtureServer?.close();await server?.close();if(fixture)fs.rmSync(fixture,{recursive:true,force:true});
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'assets.json'),encode(report));
  if(report.publicationBudget)fs.writeFileSync(path.join(out,'publication-budget.json'),encode({...report.publicationBudget,regularVolumeProjection:report.regularVolumeProjection}));
  console.log(JSON.stringify({status:report.status,checks:results.length,publicFiles:report.publicationBudget?.fileCount,report:'artifacts/ebook-qa/assets.json'}));
}
