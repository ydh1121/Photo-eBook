#!/usr/bin/env node
/* Review/offline adapter. The production reader retains its D1 asset origin. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'public/staging/ebook-reader-preview');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,value)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,value);};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const js=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const context={window:{},URL,TextEncoder,TextDecoder};vm.createContext(context);
for(const file of ['module-registry-v1.js','ebook-reader-model-v1.js','ebook-reader-v1.js'])vm.runInContext(read('public/assets/js/platform-modules/'+file),context);
const owners=context.window.PlatformModuleRegistry.assetFiles('ebook-reader','export');
const dependencies=['public/assets/js/platform-modules/module-registry-v1.js',...owners,'public/assets/js/platform-modules/module-style-runtime-v1.js'];
for(const file of dependencies)write(path.join(out,'owners',path.basename(file)),fs.readFileSync(path.join(root,file)));
const assetRows=JSON.parse(read('content/ebooks/v1/assets.json'));
for(const asset of assetRows)write(path.join(out,'assets',asset.sha256+'.webp'),fs.readFileSync(path.join(root,asset.sourcePath)));
const catalog=JSON.parse(read('public/books/catalog.json'));
const style='<style>*{box-sizing:border-box}body{margin:0;padding:10px;background:#efeee8;color:#26372f;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif}.review-head{max-width:980px;margin:0 auto 10px;display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:12px;line-height:1.6}.review-head a{color:#315a46;min-height:32px;display:inline-flex;align-items:center}.review-head p{margin:0}.ebook-reader{height:calc(100dvh - 66px)}.catalog{max-width:800px;margin:40px auto;padding:32px;background:#fffefb;border:1px solid #d9ded5;border-radius:18px}.catalog p{line-height:1.9;word-break:keep-all}.catalog ul{padding:0;list-style:none;display:grid;gap:14px}.catalog a{display:block;padding:20px;color:#315a46;border:1px solid #d9ded5;border-radius:10px;text-decoration:none;font-weight:700}.catalog small{display:block;margin-top:7px;font-weight:400;line-height:1.8}.catalog h1{line-height:1.5;letter-spacing:-.035em}a:focus-visible{outline:3px solid #217e69;outline-offset:3px}@media(max-width:600px){.review-head{font-size:10px;padding-inline:4px}.catalog{padding:22px;margin:20px auto}.catalog h1{font-size:25px}}</style>';
const head=title=>`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} · 검토용 샘플</title><link rel="stylesheet" href="owners/ebook-reader-v1.css">${style}</head>`;
const scriptTags=dependencies.filter(p=>p.endsWith('.js')).map(p=>`<script src="owners/${path.basename(p)}"></script>`).join('');
const hashes=[];
for(const book of catalog.books){
  const manifest=JSON.parse(read('public'+book.manifestUrl)),pages={};
  for(const descriptor of manifest.pages)pages[descriptor.pageId]=read('public'+descriptor.src);
  // Explicit review adapter: copied publication images make this bundle
  // inspectable while remote D1 activation remains a separate verified gate.
  for(const [id,asset] of Object.entries(manifest.assets))manifest.assets[id]={...asset,src:'assets/'+asset.sha256+'.webp'};
  const publication={manifest,pages};
  const html=head(book.title)+`<body><header class="review-head"><a href="index.html">샘플 교재 목록</a><p>본문 24쪽 · 검토용 샘플판</p></header><main id="host"></main>${scriptTags}<script>const publication=${js(publication)};const pageId=decodeURIComponent(location.hash.slice(1));window.reviewReader=PlatformModuleRegistry.mount(document.getElementById('host'),'ebook-reader',{publication,baseUrl:document.baseURI,pageId},{consumer:'export',onReaderNavigate(value){history.replaceState(history.state,'','#'+encodeURIComponent(value.pageId));}});PlatformModuleStyleRuntime?.apply?.('ebook-reader',document.getElementById('host'),{});</script><noscript>교재를 읽으려면 JavaScript를 켜 주세요.</noscript></body></html>\n`;
  write(path.join(out,book.bookId+'.html'),html);hashes.push({file:book.bookId+'.html',sha256:createHash('sha256').update(html).digest('hex')});
}
write(path.join(out,'index.html'),head('입문 교재 3종')+`<body><main class="catalog"><p>Personal Edu · 공통 뷰어 검토본</p><h1>게시글에서 영상까지,<br>작은 실습 하나를 끝내 보세요.</h1><p>같은 가상 모임을 SNS 게시글, 30초 영상, AI 안내문으로 이어 만드는 샘플입니다. 각 분야의 한 장을 본문 24쪽으로 구성했습니다.</p><ul>${catalog.books.map(book=>`<li><a href="${escape(book.bookId)}.html">${escape(book.title)}<small>${escape(book.subtitle)}</small></a></li>`).join('')}</ul><p>문장을 선택해 질문으로 저장하고, 다음에 읽던 곳에서 이어 볼 수 있습니다. 저장한 질문은 이 브라우저에 남으며 ‘글자·파일’에서 파일로 보관할 수 있습니다.</p><p>정규 400쪽 교재는 제작 중입니다. 이 샘플은 정규 교재의 완성 권수에 포함하지 않습니다.</p></main></body></html>\n`);
write(path.join(out,'README.txt'),'Personal Edu · WO02 검토용 샘플\n\nindex.html을 최신 Chrome/Edge/Safari에서 열면 세 교재를 읽을 수 있습니다.\n본문과 이미지가 이 폴더에 포함된 검토용/오프라인 묶음입니다. 운영용 D1 연결을 검증한 자료는 아닙니다.\n질문과 읽던 위치는 브라우저에 저장합니다. 브라우저가 파일 주소의 저장소를 허용하지 않으면 질문 내보내기로 보관하세요.\n개별 원고는 24쪽 샘플이며 정규 400쪽 교재의 완성 권수에 포함하지 않습니다.\n앱 설명은 공식 문서 기반이고 실제 Android 기기에서 실행한 검증은 포함하지 않았습니다.\n');
write(path.join(out,'review-provenance.json'),JSON.stringify({schemaVersion:1,kind:'explicit-portable-review-adapter',remoteD1Verified:false,ownerFiles:dependencies,publications:hashes},null,2)+'\n');
console.log(JSON.stringify({reviewDirectory:path.relative(root,out),books:hashes.length,assets:assetRows.length,productionImageOrigin:'D1; activation gated'},null,2));
