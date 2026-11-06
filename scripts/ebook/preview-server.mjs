#!/usr/bin/env node
/* Local/CI preview only. No Cloudflare credentials, binding or remote writes. */
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openLocalD1} from './sqlite-d1-adapter.mjs';
import {publishEbookAssets} from '../../functions/lib/ebook-asset-publisher.js';
import {createEbookAssetHandler} from '../../functions/lib/ebook-asset-service.js';
import {EBOOK_LIMITS,calculateAssetPublicationBudget} from '../../functions/lib/ebook-asset-budget.js';

const REPO=path.resolve(import.meta.dirname,'../..');
const DEFAULT_ASSETS='content/ebooks/v1/assets.json';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.pdf':'application/pdf','.mp4':'video/mp4'};
const isWithin=(base,file)=>file===base||file.startsWith(base+path.sep);
const validPort=value=>Number.isInteger(value)&&value>=0&&value<=65535;
const databaseBytes=db=>Number(db.sqlite.prepare('PRAGMA page_count').get().page_count)*Number(db.sqlite.prepare('PRAGMA page_size').get().page_size);

// This synthetic proof exists only inside a local SQLite process. It is not an
// account attestation and is never exported to publication files or remote env.
function localOnlyProof(bytes,now=Date.now()){
  return {plan:'free',planVerified:true,accountUsageComplete:true,observedAt:new Date(now).toISOString(),accountStorageBytes:bytes,accountRequestsToday:0,accountRowsReadToday:0,accountRowsWrittenToday:0,localSimulation:true};
}
function relativeSource(value){
  if(typeof value!=='string'||!value||path.isAbsolute(value)||/[\\\u0000-\u001f]/.test(value)||value.split('/').some(part=>part==='..'||part==='.')||!value.endsWith('.webp'))throw new Error('Asset sourcePath must be a repository-relative WebP path.');
  return value;
}
async function readAssets(assetFile,repoRoot){
  const file=path.resolve(repoRoot,assetFile),resolved=await realpath(file);
  if(!isWithin(repoRoot,resolved))throw new Error('Asset manifest must stay within the repository.');
  const source=JSON.parse(await readFile(resolved,'utf8')),records=Array.isArray(source)?source:source?.assets;
  if(!Array.isArray(records)||!records.length)throw new Error('Asset manifest must contain a nonempty assets array.');
  const ids=new Set(),hashes=new Map(),prepared=[];
  for(const record of records){
    if(!record||typeof record!=='object'||typeof record.assetId!=='string'||!record.assetId||ids.has(record.assetId))throw new Error('Asset IDs must be present and unique.');
    ids.add(record.assetId);relativeSource(record.sourcePath);
    if(record.servedPath!==`/api/ebook-assets/${record.sha256}.webp`)throw new Error(`Unexpected servedPath for asset ${record.assetId}.`);
    const prior=hashes.get(record.sha256);
    if(prior&&(prior.bytes!==record.bytes||prior.width!==record.width||prior.height!==record.height))throw new Error('Duplicate asset hashes have inconsistent metadata.');
    hashes.set(record.sha256,record);prepared.push({...record,mimeType:'image/webp'});
  }
  const budget=calculateAssetPublicationBudget({assets:prepared,existingBytes:0,accountBytes:0});
  if(!budget.ok)throw new Error(`Local asset manifest exceeds the publication contract: ${JSON.stringify(budget.failures)}`);
  for(const record of prepared){
    const sourcePath=path.resolve(repoRoot,record.sourcePath),resolvedSource=await realpath(sourcePath);
    if(!isWithin(repoRoot,resolvedSource))throw new Error(`Asset source leaves the repository: ${record.assetId}.`);
    const metadata=await stat(resolvedSource);
    if(!metadata.isFile()||metadata.size!==record.bytes)throw new Error(`Asset file length differs from its manifest: ${record.assetId}.`);
    record.body=new Uint8Array(await readFile(resolvedSource));
  }
  return prepared;
}
function sendText(response,status,message,headers={}){
  if(response.destroyed)return;
  response.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Ebook-Preview':'local-sqlite',...headers});response.end(message);
}
function requestPath(request){
  const raw=String(request.url||'/');
  if(!raw.startsWith('/'))return null;
  let decoded;try{decoded=decodeURIComponent(raw.split('?')[0]);}catch{return null;}
  if(!decoded.startsWith('/')||/[\\\u0000-\u001f\u007f]/.test(decoded)||decoded.split('/').some(part=>part==='..'||part==='.'))return null;
  return decoded;
}
async function sendWebResponse(response,reply,headOnly){
  if(response.destroyed)return;
  const headers=Object.fromEntries(reply.headers);headers['x-ebook-preview']='local-sqlite';
  const body=headOnly||[204,304].includes(reply.status)?null:Buffer.from(await reply.arrayBuffer());
  if(response.destroyed)return;response.writeHead(reply.status,headers);response.end(body);
}

/** Starts an actual local SQLite-backed preview and returns an idempotent close(). */
export async function startEbookPreviewServer({port=Number(process.env.PORT||4173),host='127.0.0.1',assetFile=DEFAULT_ASSETS,repoRoot=REPO}={}){
  if(!validPort(port))throw new Error('PORT must be an integer between 0 and 65535.');
  if(typeof host!=='string'||!host||/[\s/\\]/.test(host))throw new Error('Preview host is invalid.');
  repoRoot=await realpath(repoRoot);const publicRoot=await realpath(path.join(repoRoot,'public'));
  if(!isWithin(repoRoot,publicRoot))throw new Error('The public directory must stay within the repository.');
  const records=await readAssets(assetFile,repoRoot),db=openLocalD1();
  let server,closed=false,closing=null;
  try{
    db.sqlite.exec(await readFile(path.join(REPO,'migrations/ebook-assets/0001-assets.sql'),'utf8'));
    const initialBytes=databaseBytes(db),published=await publishEbookAssets(db,records,{attestation:localOnlyProof(initialBytes),existingDatabaseBytes:initialBytes});
    const allocatedBytes=databaseBytes(db);
    if(allocatedBytes>EBOOK_LIMITS.maxDatabaseBytes)throw new Error('Actual local SQLite allocation exceeds the publication budget.');
    const assets=Object.fromEntries(records.map(({sha256,bytes,width,height})=>[sha256,{bytes,width,height}]));
    const handler=createEbookAssetHandler({assets,cache:{async match(){return undefined;},async put(){}}});
    const summary=Object.freeze({mode:'local-sqlite',remoteD1:false,seededAssets:Object.keys(assets).length,manifestRecords:records.length,seededBytes:published.totalBytes,databaseBytes:allocatedBytes,fullByteReadbackMatches:published.fullByteReadbackMatches});
    let origin='http://127.0.0.1';
    server=createServer(async(request,response)=>{
      const pathname=requestPath(request);
      if(pathname===null){request.resume();sendText(response,400,'Invalid request path.');return;}
      try{
        if(pathname.startsWith('/api/ebook-assets/')){
          const headers=new Headers();for(const [key,value] of Object.entries(request.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);
          const incoming=new Request(new URL(request.url,origin),{method:request.method,headers});request.resume();
          const reply=await handler({request:incoming,env:{EBOOK_ASSETS_ENABLED:'true',EBOOK_ASSETS_DB:db,EBOOK_BUDGET_ATTESTATION:localOnlyProof(allocatedBytes)}});
          await sendWebResponse(response,reply,request.method==='HEAD');return;
        }
        if(!['GET','HEAD'].includes(request.method)){request.resume();sendText(response,405,'Method not allowed.',{Allow:'GET, HEAD'});return;}
        if(pathname==='/__ebook-preview__/health'){
          const body=JSON.stringify({ok:true,...summary});response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Ebook-Preview':'local-sqlite','X-Content-Type-Options':'nosniff'});response.end(request.method==='HEAD'?null:body);return;
        }
        const candidate=path.resolve(publicRoot,`.${pathname}`);
        if(!isWithin(publicRoot,candidate)){sendText(response,403,'Forbidden.');return;}
        let file=await realpath(candidate);
        if(!isWithin(publicRoot,file)){sendText(response,403,'Forbidden.');return;}
        let metadata=await stat(file);
        if(metadata.isDirectory()){
          if(!pathname.endsWith('/')){const url=new URL(request.url,origin);response.writeHead(308,{Location:url.pathname+'/'+url.search,'Cache-Control':'no-store','X-Ebook-Preview':'local-sqlite'});response.end();return;}
          file=await realpath(path.join(file,'index.html'));if(!isWithin(publicRoot,file)){sendText(response,403,'Forbidden.');return;}metadata=await stat(file);
        }
        if(!metadata.isFile()){sendText(response,404,'Not found.');return;}
        response.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':metadata.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Ebook-Preview':'local-sqlite'});
        if(request.method==='HEAD'){response.end();return;}
        const stream=createReadStream(file);stream.on('error',()=>response.destroy());response.on('close',()=>stream.destroy());stream.pipe(response);
      }catch(error){
        if(response.headersSent){response.destroy();return;}
        sendText(response,['ENOENT','ENOTDIR'].includes(error?.code)?404:500,['ENOENT','ENOTDIR'].includes(error?.code)?'Not found.':'Preview request failed.');
      }
    });
    server.requestTimeout=15000;server.headersTimeout=10000;
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.removeListener('error',reject);resolve();});});
    const address=server.address(),boundPort=address.port,urlHost=['0.0.0.0','::'].includes(host)?'127.0.0.1':host.includes(':')?`[${host}]`:host;
    origin=`http://${urlHost}:${boundPort}`;
    async function close(){
      if(closing)return closing;if(closed)return;
      closing=new Promise(resolve=>{const deadline=setTimeout(()=>server.closeAllConnections(),5000);deadline.unref();server.close(()=>{clearTimeout(deadline);db.close();closed=true;resolve();});server.closeIdleConnections();});return closing;
    }
    return {server,db,url:origin,baseUrl:origin,port:boundPort,host,summary,close};
  }catch(error){server?.close();db.close();throw error;}
}

// Short import name for integration/CI callers; both names use one owner.
export const startPreviewServer=startEbookPreviewServer;

function cliArguments(argv){
  const options={};
  for(let index=0;index<argv.length;index++){
    const [flag,inline]=argv[index].split('=',2);
    if(flag==='--help'||flag==='-h')return {help:true};
    if(!['--port','--host','--assets'].includes(flag))throw new Error(`Unknown option: ${flag}`);
    const value=inline??argv[++index];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${flag}.`);
    if(flag==='--port')options.port=Number(value);else if(flag==='--host')options.host=value;else options.assetFile=value;
  }
  return options;
}
async function main(){
  const options=cliArguments(process.argv.slice(2));
  if(options.help){console.log('Usage: node scripts/ebook/preview-server.mjs [--port 4173] [--host 127.0.0.1] [--assets content/ebooks/v1/assets.json]\nPORT sets the default port. Port 0 selects an available port.\nLocal SQLite preview only; no remote D1 activation or account-plan verification.');return;}
  const preview=await startEbookPreviewServer(options);
  console.log(`Ebook preview ready: ${preview.url}`);
  console.log(`Local SQLite only: ${preview.summary.seededAssets} assets, ${preview.summary.seededBytes} WebP bytes, full byte readback verified. Synthetic budget proof is not account verification.`);
  console.log(`Reader: ${preview.url}/reader/?book=sns-entry&edition=sample-20261106-v1`);
  let stopping=false;
  const stop=async()=>{if(stopping)return;stopping=true;await preview.close();process.exit(0);};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))main().catch(error=>{console.error(`Ebook preview could not start: ${error.message}`);process.exitCode=1;});
