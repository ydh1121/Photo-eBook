import {renderErrorPage,renderPublicPage,renderStaticSnapshot} from '../functions/[slug].js';

const payload={
  snapshot:{
    snapshotId:'test-snapshot',
    pageId:'test-page',
    version:3,
    slug:'video-editor',
    industryId:'video-editor',
    title:'영상편집 테스트',
    theme:'light',
    seo:{
      title:'영상 "편집" <테스트>',
      description:'검색 설명 & 안전성 테스트',
      schemaType:'Article',
      siteName:'먹고살기',
      indexPolicy:'noindex'
    },
    sourceUpdatedAt:'2026-08-20T06:00:00+09:00',
    publishedAt:'2026-08-20T06:10:00+09:00'
  },
  blocks:[
    {
      id:'hero',type:'hero',variant:'minimal',enabled:true,
      content:{eyebrow:'시작',title:'영상편집으로 시작하기',description:'JS 없이도 이 문장이 보여야 합니다.',facts:[{label:'상태',value:'준비',note:'근거 없는 수치는 쓰지 않습니다.'}]}
    },
    {
      id:'compare',type:'comparison-cards',variant:'generic',enabled:true,
      content:{
        title:'비교',
        columns:[{key:'output',label:'주요 결과물'},{key:'priceExample',label:'현재 판매 예시'}],
        items:[{title:'숏폼',description:'개별 예시',values:{output:'세로 영상',priceExample:'5천원 예시'}}]
      }
    },
    {
      id:'faq',type:'faq',variant:'accordion',enabled:true,
      content:{title:'FAQ',items:[{question:'질문 <하나>',answer:'답변 & 확인'}]}
    },
    {
      id:'resources',type:'resources',variant:'official-list',enabled:true,
      content:{title:'자료',items:[{publisher:'공식기관',title:'안전 </script><script>alert(1)</script>',url:'https://example.com/source',supports:'공식 자료'}]}
    }
  ],
  uiCapabilities:[]
};

const canonical='https://example.com/video-editor/';
const html=renderPublicPage(payload,canonical);
const staticHtml=renderStaticSnapshot(payload);
const errorHtml=renderErrorPage('페이지를 찾지 못했습니다.','주소를 다시 확인해 주세요.');

const assertions=[
  [html.includes('<link rel="canonical" href="https://example.com/video-editor/">'),'canonical link missing'],
  [html.includes('<meta name="robots" content="noindex,nofollow,noarchive">'),'noindex meta missing'],
  [html.includes('<title>영상 &quot;편집&quot; &lt;테스트&gt;</title>'),'title escaping failed'],
  [html.includes('data-static-snapshot="true"'),'server-rendered fallback missing'],
  [html.includes('JS 없이도 이 문장이 보여야 합니다.'),'fallback body text missing'],
  [html.includes('<dt>주요 결과물</dt>'),'comparison column label missing'],
  [html.includes('<dt>현재 판매 예시</dt>'),'comparison price label missing'],
  [!html.includes('<dt>output</dt>'),'internal comparison key leaked'],
  [!html.includes('</script><script>alert(1)</script>'),'script boundary escaping failed'],
  [html.includes('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e'),'embedded JSON escaping missing'],
  [!html.includes('<div class="public-snapshot-status">'),'debug status chrome leaked into canonical page'],
  [staticHtml.includes('<details><summary>질문 &lt;하나&gt;</summary>'),'FAQ semantic fallback missing'],
  [staticHtml.includes('href="https://example.com/source"'),'resource link missing'],
  [errorHtml.includes('noindex,nofollow,noarchive'),'404 noindex missing'],
  [errorHtml.includes('페이지를 찾지 못했습니다.'),'404 copy missing']
];

const failed=assertions.filter(([ok])=>!ok).map(([,message])=>message);
if(failed.length){
  console.error('Canonical Snapshot V2 smoke test failed:');
  failed.forEach(message=>console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Canonical Snapshot V2 smoke OK: ${payload.blocks.length} blocks, semantic fallback and escaping validated.`);
