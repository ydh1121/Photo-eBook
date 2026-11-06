#!/usr/bin/env node
/* Verify published static bytes against this checkout; no database or browser fixture. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const base=(process.env.EBOOK_LIVE_URL||'https://photo-ebook.pages.dev').replace(/\/$/,'');
assert(/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.pages\.dev$/i.test(base),'Use the verified Pages origin');
const output=path.join(root,'artifacts/ebook-live');fs.mkdirSync(output,{recursive:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const report={startedAt:new Date().toISOString(),base,sourceSha:process.env.GITHUB_SHA||null,status:'running',checks:[],assets:[],books:[],deploymentAttempts:[],limitations:['HTTP delivery and committed routing are verified separately; this report does not infer account-wide usage from response headers.','Physical Android/Safari execution and automatic cross-device synchronization are outside this check.']};
const local=route=>fs.readFileSync(path.join(root,'public',route));
async function request(route,options={}){
  assert(route.startsWith('/')&&!route.startsWith('//')&&!route.includes('..'),'Unsafe publication route');
  return fetch(base+route,{redirect:'manual',signal:AbortSignal.timeout(20000),...options,headers:{'Cache-Control':'no-cache',...options.headers}});
}
async function exact(route,options={}){
  const response=await request(route,options);assert.equal(response.status,200,`${route}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer()),expected=local(route);
  assert.equal(hash(bytes),hash(expected),`${route}: does not match the verified checkout`);
  return {bytes,response,sha256:hash(bytes)};
}
async function check(name,run){
  try{const detail=await run();report.checks.push({name,status:'pass',detail});console.log(`PASS ${name}`);}
  catch(error){report.checks.push({name,status:'fail',error:error.message});console.error(`FAIL ${name}: ${error.message}`);}
}
const catalog=JSON.parse(local('/books/catalog.json'));
const assets=JSON.parse(fs.readFileSync(path.join(root,'content/ebooks/v1/assets.json'),'utf8'));
await check('exact-publication-revision-is-live',async()=>{
  const routes=['/books/catalog.json',catalog.books[0].manifestUrl,'/assets/js/platform-modules/learning-guide-v1.js'];
  const deadline=Date.now()+360000;let lastError='publication not yet observed';
  for(let attempt=1;attempt<=90&&Date.now()<deadline;attempt++){
    try{
      const values=await Promise.all(routes.map(route=>exact(route,{signal:AbortSignal.timeout(Math.max(1,Math.min(20000,deadline-Date.now())))})));
      report.deploymentAttempts.push({attempt,at:new Date().toISOString(),matched:true});
      return {attempt,routes:routes.map((route,i)=>({route,sha256:values[i].sha256}))};
    }catch(error){
      lastError=error.message;report.deploymentAttempts.push({attempt,at:new Date().toISOString(),matched:false,error:lastError});
      console.log(`Waiting for textbook revision (${attempt}): ${lastError}`);
      if(attempt<90&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,Math.min(4000,deadline-Date.now())));
    }
  }
  throw new Error(`Exact textbook revision did not appear within the deployment window: ${lastError}`);
});
await check('static-routes-remain-excluded',async()=>{
  const routes=JSON.parse(local('/_routes.json'));
  for(const route of ['/assets/*','/books/*','/reader','/reader/*'])assert(routes.exclude.includes(route),`Function exclusion missing: ${route}`);
  const retired=path.join(root,'functions/api/ebook-assets');
  assert(!fs.existsSync(retired)||fs.readdirSync(retired).length===0,'Retired image API returned');
  return {basis:'committed _routes.json and static image URL contract'};
});
await check('catalog-exact-publication-and-revalidation',async()=>{
  const {response,sha256}=await exact('/books/catalog.json');
  assert.match(response.headers.get('cache-control')||'',/no-cache/,'Catalog must revalidate');
  assert.equal(catalog.regularBooksCompleted,0,'WO02 must not claim a regular book');
  return {sha256,books:catalog.books.length,regularBooksCompleted:0};
});
for(const asset of assets.assets||assets){
  await check(`image-${asset.assetId}`,async()=>{
    const route=asset.servedPath;assert.equal(route,`/assets/ebooks/v1/${asset.sha256}.webp`);
    const {bytes,response,sha256}=await exact(route);
    assert.equal(sha256,asset.sha256);assert.equal(bytes.length,asset.bytes);
    assert.match(response.headers.get('content-type')||'',/^image\/webp/i);
    assert.match(response.headers.get('cache-control')||'',/max-age=31536000/);
    assert.match(response.headers.get('cache-control')||'',/immutable/);
    const head=await request(route,{method:'HEAD'});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
    if(head.headers.has('content-length'))assert.equal(Number(head.headers.get('content-length')),bytes.length);
    const etag=response.headers.get('etag');assert(etag,'Pages ETag missing');
    const conditional=await request(route,{headers:{'If-None-Match':etag}});assert.equal(conditional.status,304);
    const item={assetId:asset.assetId,route,bytes:bytes.length,sha256,headStatus:head.status,conditionalStatus:conditional.status,cacheControl:response.headers.get('cache-control')};
    report.assets.push(item);return item;
  });
}
for(const book of catalog.books){
  await check(`book-${book.bookId}`,async()=>{
    const {bytes,response,sha256}=await exact(book.manifestUrl),manifest=JSON.parse(bytes);
    assert.match(response.headers.get('cache-control')||'',/no-cache/);
    const pages=[];
    for(const descriptor of manifest.pages){
      const page=await exact(descriptor.src);assert.equal(page.sha256,descriptor.contentHash);
      pages.push({pageId:descriptor.pageId,sha256:page.sha256,bytes:page.bytes.length});
    }
    const item={bookId:book.bookId,editionId:book.editionId,status:book.status,bodyPages:book.bodyPages,manifestSha256:sha256,pages};
    report.books.push(item);return {bookId:item.bookId,bodyPages:item.bodyPages,payloadsVerified:pages.length};
  });
  await check(`subject-entry-${book.subjectId}`,async()=>{
    const route=`/content-packs/${book.subjectId}/data/course.js`;
    const {bytes,sha256}=await exact(route);
    assert(bytes.toString('utf8').includes(book.readerUrl),'Subject metadata lost its reader URL');
    const entry=await request(book.readerUrl);assert.equal(entry.status,200,'Reader route unavailable');
    assert((await entry.text()).includes('/assets/js/reader/reader-entry-v1.js'),'Reader did not load its canonical route frame');
    return {route,sha256,readerUrl:book.readerUrl};
  });
}
await check('unknown-static-image-is-not-an-html-success',async()=>{
  const response=await request(`/assets/ebooks/v1/${'0'.repeat(64)}.webp`);
  assert.equal(response.status,404);return {status:response.status};
});
report.status=report.checks.every(check=>check.status==='pass')?'pass':'fail';
report.finishedAt=new Date().toISOString();
report.summary={checks:report.checks.length,passed:report.checks.filter(check=>check.status==='pass').length,images:report.assets.length,bodyPages:report.books.reduce((sum,book)=>sum+book.pages.length,0)};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
if(report.status!=='pass')process.exitCode=1;
