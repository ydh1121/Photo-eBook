/* Build-time static publication limits. No account credentials or runtime gate. */
import fs from 'node:fs';
import path from 'node:path';

export const EBOOK_ASSET_PREFIX='/assets/ebooks/v1/';
export const EBOOK_STATIC_LIMITS=Object.freeze({
  maxFiles:20000,
  warnFiles:18000,
  maxFileBytes:25*1024*1024,
  warnFileBytes:Math.floor(25*1024*1024*.9),
  maxManifestBytes:256*1024,
  maxPageBytes:512*1024,
  // Project image-delivery budget; not a Pages or database BLOB restriction.
  maxWebpBytes:1500000
});

function filePath(value){
  if(typeof value!=='string'||!value||value.startsWith('/')||/[\\\u0000-\u001f\u007f]/.test(value)||value.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Publication paths must stay relative to public/.');
  return value;
}
function entry(value){
  const relativePath=filePath(value?.path);
  if(!Number.isSafeInteger(value.bytes)||value.bytes<0)throw new Error(`Invalid byte count: ${relativePath}`);
  return {path:relativePath,bytes:value.bytes};
}

/** Includes control files conservatively; rejects symlinks rather than following them. */
export function readPublicInventory(publicRoot){
  if(fs.lstatSync(publicRoot).isSymbolicLink())throw new Error('Public publication root must not be a symlink.');
  const files=[];
  function visit(directory){
    for(const name of fs.readdirSync(directory).sort()){
      const absolute=path.join(directory,name),metadata=fs.lstatSync(absolute);
      if(metadata.isSymbolicLink())throw new Error('Public publication contains a symlink: '+path.relative(publicRoot,absolute));
      if(metadata.isDirectory())visit(absolute);
      else if(metadata.isFile())files.push(entry({path:path.relative(publicRoot,absolute).split(path.sep).join('/'),bytes:metadata.size}));
      else throw new Error('Public publication contains a non-regular file: '+path.relative(publicRoot,absolute));
    }
  }
  visit(publicRoot);return files;
}

/** Count a replaced path once; retained old editions/assets still consume budget. */
export function mergePublicInventory(current,updates){
  const files=new Map();
  for(const values of [current,updates]){
    const seen=new Set();
    for(const value of values){const item=entry(value);if(seen.has(item.path))throw new Error('Duplicate publication path: '+item.path);seen.add(item.path);files.set(item.path,item);}
  }
  return [...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
}

export function assessStaticPublication(values){
  const files=mergePublicInventory([],values),limits=EBOOK_STATIC_LIMITS,failures=[],warnings=[];
  const summary={bodyPages:0,bodyBytes:0,manifests:0,manifestBytes:0,webpFiles:0,webpBytes:0};
  let totalBytes=0,largestFile=null;
  for(const file of files){
    totalBytes+=file.bytes;if(!largestFile||file.bytes>largestFile.bytes)largestFile=file;
    if(file.bytes>limits.maxFileBytes)failures.push({code:'pages_file_size',...file,limit:limits.maxFileBytes});
    else if(file.bytes>=limits.warnFileBytes)warnings.push({code:'pages_file_size_near_limit',...file,limit:limits.maxFileBytes});
    let cap;
    if(/^books\/[^/]+\/[^/]+\/manifest\.json$/.test(file.path)){summary.manifests++;summary.manifestBytes+=file.bytes;cap=limits.maxManifestBytes;}
    if(/^books\/[^/]+\/[^/]+\/pages\/[^/]+\.json$/.test(file.path)){summary.bodyPages++;summary.bodyBytes+=file.bytes;cap=limits.maxPageBytes;}
    if(file.path.startsWith(EBOOK_ASSET_PREFIX.slice(1))){
      if(!/^[a-f0-9]{64}\.webp$/.test(file.path.slice(EBOOK_ASSET_PREFIX.length-1)))failures.push({code:'unexpected_ebook_delivery_file',path:file.path});
      summary.webpFiles++;summary.webpBytes+=file.bytes;cap=limits.maxWebpBytes;
    }
    if(cap&&file.bytes>cap)failures.push({code:'project_publication_size',...file,limit:cap});
  }
  if(files.length>limits.maxFiles)failures.push({code:'pages_file_count',actual:files.length,limit:limits.maxFiles});
  else if(files.length>=limits.warnFiles)warnings.push({code:'pages_file_count_near_limit',actual:files.length,limit:limits.maxFiles});
  return {schemaVersion:1,scope:'Actual public/ regular files, including control metadata conservatively; no assumed total-byte service cap.',ok:failures.length===0,
    limits,fileCount:files.length,remainingFiles:limits.maxFiles-files.length,totalBytes,largestFile,ebook:summary,warnings,failures,
    officialReferences:['https://developers.cloudflare.com/pages/platform/limits/','https://developers.cloudflare.com/pages/functions/pricing/']};
}

/** Planning scenarios only. These do not reserve capacity or describe finished books. */
export function regularVolumeProjection(measured){
  const bodyPages=18*420,newManifests=18;
  return {kind:'estimate_only',basis:'Add 18 regular 420-body-page volumes beyond the measured tree; retain existing samples/review files. Images are additional unique hashes, shared between retained edition sets.',
    measuredBaseFiles:measured.fileCount,newBodyPages:bodyPages,newManifests,
    scenarios:[1365,2520,7560,15120].flatMap(uniqueImages=>[1,2].map(editionSets=>{
      const files=measured.fileCount+editionSets*(bodyPages+newManifests)+uniqueImages;
      return {editionSets,additionalUniqueImages:uniqueImages,estimatedFiles:files,remainingFiles:EBOOK_STATIC_LIMITS.maxFiles-files,withinFileLimit:files<=EBOOK_STATIC_LIMITS.maxFiles};
    }))};
}
