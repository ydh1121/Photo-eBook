#!/usr/bin/env node
/* Compile byte-verified Drive originals into immutable, paged reader editions. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {EBOOK_ASSET_PREFIX,EBOOK_STATIC_LIMITS,readPublicInventory,mergePublicInventory,assessStaticPublication,regularVolumeProjection} from './ebook/static-publication-budget.mjs';

const root=path.resolve(import.meta.dirname,'..');
const sourceDir=path.join(root,'content/ebooks/v1');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=file=>fs.readFileSync(path.join(root,file));
const json=file=>JSON.parse(read(file));
const outputs=new Map();
const stage=(file,value)=>{assert(file.startsWith('public/'),'Only public outputs may be staged');const bytes=Buffer.isBuffer(value)?value:Buffer.from(value,'utf8');assert(!outputs.has(file)||outputs.get(file).equals(bytes),'Conflicting publication bytes');outputs.set(file,bytes);};
const write=(file,value)=>{const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,value);};
const encode=value=>JSON.stringify(value,null,2)+'\n';
const context={window:{},URL,TextEncoder,TextDecoder};vm.createContext(context);
vm.runInContext(read('public/assets/js/platform-modules/ebook-reader-model-v1.js').toString(),context);
const model=context.window.PersonalEduReaderModelV1;
const provenance=json('content/ebooks/v1/source-provenance.json');
const assetRows=json('content/ebooks/v1/assets.json');
const assets={};
for(const asset of assetRows){
  assert(model.identifier(asset.assetId)&&!assets[asset.assetId],'Duplicate or invalid asset ID');
  assert(/^[a-f0-9]{64}$/.test(asset.sha256),'Invalid asset hash');
  assert(asset.sourcePath===`content/ebooks/v1/assets/${asset.assetId}.webp`,'Unexpected asset source');
  assert(asset.servedPath===`${EBOOK_ASSET_PREFIX}${asset.sha256}.webp`,'Images use the canonical static hash path');
  const bytes=read(asset.sourcePath);
  assert(bytes.length===asset.bytes&&bytes.length>0&&bytes.length<=EBOOK_STATIC_LIMITS.maxWebpBytes&&digest(bytes)===asset.sha256,'Asset bytes differ from approved image or its delivery budget');
  assert(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP','Not WebP');
  assert(Number.isInteger(asset.width)&&asset.width>0&&Number.isInteger(asset.height)&&asset.height>0,'Asset dimensions missing');
  assets[asset.assetId]={src:asset.servedPath,sha256:asset.sha256,bytes:asset.bytes,width:asset.width,height:asset.height};
  stage('public'+asset.servedPath,bytes);
}
const catalog=[];
for(const name of fs.readdirSync(path.join(sourceDir,'sources')).filter(name=>name.endsWith('.json')).sort()){
  const raw=fs.readFileSync(path.join(sourceDir,'sources',name));const book=JSON.parse(raw);
  const proof=provenance.books.find(row=>row.bookId===book.bookId&&row.editionId===book.editionId);
  assert(proof?.sourceKind==='drive-json'&&proof.fullByteReadbackVerified===true&&proof.sourceSha256===digest(raw),'Source must be preserved and fully verified before build');
  assert(name===book.bookId+'.json'&&model.identifier(book.editionId),'Source identity mismatch');
  assert(book.status==='sample'||(book.status==='published'&&book.pages.length>=400),'Regular editions require at least 400 substantive pages');
  if(book.status==='sample')assert(book.pages.length===24,'WO02 samples have 24 authored body pages');
  const blockIds=new Set();const paragraphs=new Set();const pageRefs=[],assetIds=new Set();
  if(book.cover){const asset=assets[book.cover.assetId];assert(asset&&!book.cover.src&&book.cover.width===asset.width&&book.cover.height===asset.height,'Cover uses an approved asset and actual dimensions');assetIds.add(book.cover.assetId);}
  const prefix=`/books/${book.bookId}/${book.editionId}`;
  for(const [index,page] of book.pages.entries()){
    assert(page.pageNumber===index+1,'Body page numbers must be consecutive');
    assert(page.blocks.some(b=>b.type==='paragraph'&&b.text.trim().length>=80),'A substantive page needs authored explanation');
    for(const block of page.blocks){
      assert(!blockIds.has(block.blockId),'Block IDs must be unique within an edition');blockIds.add(block.blockId);
      if(block.type==='paragraph'){assert(!paragraphs.has(block.text),'Repeated explanatory paragraph');paragraphs.add(block.text);}
      if(block.type==='image'){
        const asset=assets[block.assetId];assert(asset,'Unknown original visual');
        assert(!block.src&&block.width===asset.width&&block.height===asset.height,'Visuals use stable asset IDs and actual dimensions');
        assetIds.add(block.assetId);
      }
      if(block.type==='sources')for(const item of block.items)assert(/^https:\/\//.test(item.url),'Sources must be direct HTTPS links');
    }
    const text=encode(page),ref={pageId:page.pageId,pageNumber:page.pageNumber,chapterId:page.chapterId,title:page.title,src:`${prefix}/pages/${page.pageId}.json`,contentHash:digest(text)};
    model.page(page,book,ref);pageRefs.push(ref);stage('public'+ref.src,text);
  }
  const bookAssets=Object.fromEntries([...assetIds].sort().map(id=>[id,assets[id]]));
  const manifest={...book,pages:pageRefs,assets:bookAssets,sourceSha256:proof.sourceSha256,bodyPageCount:pageRefs.length,frontMatterExcluded:true};
  model.manifest(manifest);stage(`public${prefix}/manifest.json`,encode(manifest));
  catalog.push({bookId:book.bookId,editionId:book.editionId,status:book.status,subjectId:book.subjectId,levelId:book.levelId,title:book.title,subtitle:book.subtitle,bodyPages:pageRefs.length,manifestUrl:`${prefix}/manifest.json`,readerUrl:`/reader/?book=${book.bookId}&edition=${book.editionId}`});
}
const catalogData={schemaVersion:1,regularBooksCompleted:catalog.filter(b=>b.status==='published').length,samples:catalog.filter(b=>b.status==='sample').length,books:catalog};
stage('public/books/catalog.json',encode(catalogData));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const entryFile='public/reader/index.html',frame=read(entryFile).toString('utf8'),begin='<!-- ebook-catalog:start -->',end='<!-- ebook-catalog:end -->';
assert(frame.split(begin).length===2&&frame.split(end).length===2,'Reader catalog markers must exist exactly once');
const start=frame.indexOf(begin)+begin.length,finish=frame.indexOf(end);assert(finish>start,'Reader catalog marker order');
const catalogHtml=`<section class="reader-catalog"><p>SNS · 영상 · AI 입문</p><h1>${catalog.every(book=>book.status==='sample')?'샘플 교재 읽기':'교재 읽기'}</h1><p>한 쪽씩 읽으며 실습해 보세요. 궁금한 문장은 질문으로 저장하고, 다음에 읽던 곳에서 이어 볼 수 있습니다.</p><p>표지와 목차를 제외한 본문 쪽수입니다. 샘플은 정규 교재의 완성 권수에 포함하지 않습니다.</p><ul>${catalog.map(book=>`<li><a href="${escape(book.readerUrl)}">${escape(book.title)}<small>${escape(book.subtitle)}</small><small>${book.status==='sample'?'샘플':'공개 교재'} · 본문 ${book.bodyPages}쪽</small></a></li>`).join('')}</ul></section>`;
stage(entryFile,frame.slice(0,start)+'\n    '+catalogHtml+'\n    '+frame.slice(finish));
const inventory=readPublicInventory(path.join(root,'public'));
const proposed=assessStaticPublication(mergePublicInventory(inventory,[...outputs].map(([file,bytes])=>({path:file.slice('public/'.length),bytes:bytes.length}))));
const reportFile='artifacts/ebook-qa/publication-budget.json';
if(!proposed.ok){write(reportFile,encode(proposed));throw new Error('Static publication exceeds its file/byte budget: '+JSON.stringify(proposed.failures));}
for(const [file,bytes] of outputs)write(file,bytes);
const measured=assessStaticPublication(readPublicInventory(path.join(root,'public')));
write(reportFile,encode({...measured,regularVolumeProjection:regularVolumeProjection(measured)}));
assert(measured.ok,'Actual generated publication exceeds its budget');
console.log(JSON.stringify({books:catalog,uniqueAssets:new Set(assetRows.map(a=>a.sha256)).size,webpBytes:assetRows.reduce((n,a)=>n+a.bytes,0),publicFiles:measured.fileCount,publicBytes:measured.totalBytes,budgetWarnings:measured.warnings,budgetReport:reportFile},null,2));
