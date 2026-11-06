#!/usr/bin/env node
/* Compile byte-verified Drive originals into immutable, paged reader editions. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const sourceDir=path.join(root,'content/ebooks/v1');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=file=>fs.readFileSync(path.join(root,file));
const json=file=>JSON.parse(read(file));
const write=(file,value)=>{const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,value);};
const encode=value=>JSON.stringify(value,null,2)+'\n';
const context={window:{},URL,TextEncoder,TextDecoder};vm.createContext(context);
vm.runInContext(read('public/assets/js/platform-modules/ebook-reader-model-v1.js').toString(),context);
const model=context.window.PersonalEduReaderModelV1;
const provenance=json('content/ebooks/v1/source-provenance.json');
const assetRows=json('content/ebooks/v1/assets.json');
const assets={},serverAssets={};
for(const asset of assetRows){
  assert(model.identifier(asset.assetId)&&!assets[asset.assetId],'Duplicate or invalid asset ID');
  assert(/^[a-f0-9]{64}$/.test(asset.sha256),'Invalid asset hash');
  assert(asset.sourcePath===`content/ebooks/v1/assets/${asset.assetId}.webp`,'Unexpected asset source');
  assert(asset.servedPath===`/api/ebook-assets/${asset.sha256}.webp`,'D1 is the image origin');
  const bytes=read(asset.sourcePath);
  assert(bytes.length===asset.bytes&&bytes.length>0&&bytes.length<=1500000&&digest(bytes)===asset.sha256,'Asset bytes differ from approved image');
  assert(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP','Not WebP');
  assert(Number.isInteger(asset.width)&&asset.width>0&&Number.isInteger(asset.height)&&asset.height>0,'Asset dimensions missing');
  assets[asset.assetId]={src:asset.servedPath,sha256:asset.sha256,bytes:asset.bytes,width:asset.width,height:asset.height};
  serverAssets[asset.sha256]={bytes:asset.bytes,width:asset.width,height:asset.height};
}
const catalog=[];
for(const name of fs.readdirSync(path.join(sourceDir,'sources')).filter(name=>name.endsWith('.json')).sort()){
  const raw=fs.readFileSync(path.join(sourceDir,'sources',name));const book=JSON.parse(raw);
  const proof=provenance.books.find(row=>row.bookId===book.bookId&&row.editionId===book.editionId);
  assert(proof?.sourceKind==='drive-json'&&proof.fullByteReadbackVerified===true&&proof.sourceSha256===digest(raw),'Source must be preserved and fully verified before build');
  assert(name===book.bookId+'.json'&&model.identifier(book.editionId),'Source identity mismatch');
  assert(book.status==='sample'||(book.status==='published'&&book.pages.length>=400),'Regular editions require at least 400 substantive pages');
  if(book.status==='sample')assert(book.pages.length===24,'WO02 samples have 24 authored body pages');
  const blockIds=new Set();const paragraphs=new Set();const pageRefs=[];
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
      }
      if(block.type==='sources')for(const item of block.items)assert(/^https:\/\//.test(item.url),'Sources must be direct HTTPS links');
    }
    const text=encode(page),ref={pageId:page.pageId,pageNumber:page.pageNumber,chapterId:page.chapterId,title:page.title,src:`${prefix}/pages/${page.pageId}.json`,contentHash:digest(text)};
    model.page(page,book,ref);pageRefs.push(ref);write('public'+ref.src,text);
  }
  const manifest={...book,pages:pageRefs,assets,sourceSha256:proof.sourceSha256,bodyPageCount:pageRefs.length,frontMatterExcluded:true};
  model.manifest(manifest);write(`public${prefix}/manifest.json`,encode(manifest));
  catalog.push({bookId:book.bookId,editionId:book.editionId,status:book.status,subjectId:book.subjectId,levelId:book.levelId,title:book.title,subtitle:book.subtitle,bodyPages:pageRefs.length,manifestUrl:`${prefix}/manifest.json`,readerUrl:`/reader/?book=${book.bookId}&edition=${book.editionId}`});
}
write('public/books/catalog.json',encode({schemaVersion:1,regularBooksCompleted:catalog.filter(b=>b.status==='published').length,samples:catalog.filter(b=>b.status==='sample').length,books:catalog}));
write('functions/lib/ebook-assets-manifest.js','/* Generated by scripts/build-ebooks.mjs from reviewed WebP originals. */\nexport const ebookAssets = '+JSON.stringify(serverAssets)+';\n');
console.log(JSON.stringify({books:catalog,uniqueAssets:assetRows.length,webpBytes:assetRows.reduce((n,a)=>n+a.bytes,0)},null,2));
