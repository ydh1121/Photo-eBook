#!/usr/bin/env node
/* Local/CI static-file preview. Cloudflare HTTP/cache behaviour needs live QA. */
import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readPublicInventory,assessStaticPublication} from './static-publication-budget.mjs';

const REPO=path.resolve(import.meta.dirname,'../..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.pdf':'application/pdf','.mp4':'video/mp4'};
const isWithin=(base,file)=>file===base||file.startsWith(base+path.sep);
const validPort=value=>Number.isInteger(value)&&value>=0&&value<=65535;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

function sendText(request,response,status,message,headers={}){
  if(response.destroyed)return;
  response.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Ebook-Preview':'local-static',...headers});
  response.end(request.method==='HEAD'?null:message);
}
function requestPath(request){
  const raw=String(request.url||'/');if(!raw.startsWith('/'))return null;
  let decoded;try{decoded=decodeURIComponent(raw.split('?')[0]);}catch{return null;}
  if(!decoded.startsWith('/')||/[\\\u0000-\u001f\u007f]/.test(decoded)||decoded.split('/').some(part=>part==='..'||part==='.'))return null;
  return decoded;
}
function headerRules(text){
  const rules=[];let rule;
  for(const line of text.split(/\r?\n/)){
    if(!line.trim()||line.trim().startsWith('#'))continue;
    if(line.startsWith('/')){
      const escaped=line.trim().split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
      rule={matches:new RegExp('^'+escaped+'$'),headers:{}};rules.push(rule);
    }else if(rule){const match=line.match(/^\s+([^:]+):\s*(.*)$/);if(match)rule.headers[match[1].trim()]=match[2];}
  }
  return rules;
}
function matchesEtag(value,etag){
  return String(value||'').split(',').some(item=>item.trim()==='*'||item.trim().replace(/^W\//,'')===etag);
}

/** Serves public/ only. No database, account proof, credentials or remote requests. */
export async function startEbookPreviewServer({port=Number(process.env.PORT||4173),host='127.0.0.1',repoRoot=REPO}={}){
  if(!validPort(port))throw new Error('PORT must be an integer between 0 and 65535.');
  if(typeof host!=='string'||!host||/[\s/\\]/.test(host))throw new Error('Preview host is invalid.');
  repoRoot=await realpath(repoRoot);const publicRoot=await realpath(path.join(repoRoot,'public'));
  if(!isWithin(repoRoot,publicRoot))throw new Error('The public directory must stay within the repository.');
  const budget=assessStaticPublication(readPublicInventory(publicRoot));
  if(!budget.ok)throw new Error('Static publication budget failed: '+JSON.stringify(budget.failures));
  const rules=headerRules(await readFile(path.join(publicRoot,'_headers'),'utf8').catch(error=>{if(error.code==='ENOENT')return '';throw error;}));
  const summary=Object.freeze({mode:'local-static',providerVerification:false,staticFiles:budget.fileCount,staticBytes:budget.totalBytes,
    webpFiles:budget.ebook.webpFiles,webpBytes:budget.ebook.webpBytes,budgetWarnings:budget.warnings});
  let origin='http://127.0.0.1',closing=null;
  const server=createServer(async(request,response)=>{
    const pathname=requestPath(request);request.resume();
    if(pathname===null){sendText(request,response,400,'Invalid request path.');return;}
    if(!['GET','HEAD'].includes(request.method)){sendText(request,response,405,'Method not allowed.',{Allow:'GET, HEAD'});return;}
    try{
      if(pathname==='/__ebook-preview__/health'){
        const body=JSON.stringify({ok:true,...summary});response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Ebook-Preview':'local-static','X-Content-Type-Options':'nosniff'});response.end(request.method==='HEAD'?null:body);return;
      }
      const candidate=path.resolve(publicRoot,`.${pathname}`);
      if(!isWithin(publicRoot,candidate)){sendText(request,response,403,'Forbidden.');return;}
      let file=await realpath(candidate);
      if(!isWithin(publicRoot,file)){sendText(request,response,403,'Forbidden.');return;}
      let metadata=await stat(file);
      if(metadata.isDirectory()){
        if(!pathname.endsWith('/')){const url=new URL(request.url,origin);response.writeHead(308,{Location:url.pathname+'/'+url.search,'Cache-Control':'no-store','X-Ebook-Preview':'local-static'});response.end();return;}
        file=await realpath(path.join(file,'index.html'));if(!isWithin(publicRoot,file)){sendText(request,response,403,'Forbidden.');return;}metadata=await stat(file);
      }
      if(!metadata.isFile()){sendText(request,response,404,'Not found.');return;}
      const bytes=await readFile(file),etag='"'+digest(bytes)+'"';
      const headers={'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'};
      for(const rule of rules)if(rule.matches.test(pathname))Object.assign(headers,rule.headers);
      // This is a local HTTP implementation, not evidence of Pages' ETag format.
      headers.ETag=etag;headers['X-Ebook-Preview']='local-static';
      if(matchesEtag(request.headers['if-none-match'],etag)){response.writeHead(304,headers);response.end();return;}
      response.writeHead(200,{...headers,'Content-Length':bytes.length});response.end(request.method==='HEAD'?null:bytes);
    }catch(error){
      if(response.headersSent){response.destroy();return;}
      sendText(request,response,['ENOENT','ENOTDIR'].includes(error?.code)?404:500,['ENOENT','ENOTDIR'].includes(error?.code)?'Not found.':'Preview request failed.');
    }
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.removeListener('error',reject);resolve();});});
  const boundPort=server.address().port,urlHost=['0.0.0.0','::'].includes(host)?'127.0.0.1':host.includes(':')?`[${host}]`:host;
  origin=`http://${urlHost}:${boundPort}`;
  async function close(){
    if(closing)return closing;
    closing=new Promise(resolve=>{const deadline=setTimeout(()=>server.closeAllConnections(),5000);deadline.unref();server.close(()=>{clearTimeout(deadline);resolve();});server.closeIdleConnections();});return closing;
  }
  return {server,url:origin,baseUrl:origin,port:boundPort,host,summary,close};
}

export const startPreviewServer=startEbookPreviewServer;
function cliArguments(argv){
  const options={};
  for(let index=0;index<argv.length;index++){
    const [flag,inline]=argv[index].split('=',2);
    if(flag==='--help'||flag==='-h')return {help:true};
    if(!['--port','--host'].includes(flag))throw new Error(`Unknown option: ${flag}`);
    const value=inline??argv[++index];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${flag}.`);
    if(flag==='--port')options.port=Number(value);else options.host=value;
  }
  return options;
}
async function main(){
  const options=cliArguments(process.argv.slice(2));
  if(options.help){console.log('Usage: node scripts/ebook/preview-server.mjs [--port 4173] [--host 127.0.0.1]\nPORT sets the default port. Port 0 selects an available port.\nLocal public/ preview only. Live Cloudflare HTTP/cache behaviour is verified separately.');return;}
  const preview=await startEbookPreviewServer(options);
  console.log(`Ebook static preview ready: ${preview.url}`);
  console.log(`${preview.summary.staticFiles} public files, ${preview.summary.webpFiles} canonical WebP files. No database or account attestation.`);
  console.log(`Reader: ${preview.url}/reader/?book=sns-entry&edition=sample-20261106-v1`);
  let stopping=false;
  const stop=async()=>{if(stopping)return;stopping=true;await preview.close();process.exit(0);};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))main().catch(error=>{console.error(`Ebook preview could not start: ${error.message}`);process.exitCode=1;});
