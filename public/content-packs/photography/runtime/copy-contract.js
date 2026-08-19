/* Photo-eBook Korean copy presentation contract v1.
   Source copy lives in the Google Sheet. This small client layer only guarantees
   approved semantic line breaks, hard-coded section copy that predates the sheet,
   and collection labels/card hierarchy that are presentation concerns. */
(function(){
  if(window.__photoCopyContractV1Installed)return;
  window.__photoCopyContractV1Installed=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const QUESTION_KEY='photoRoadmapQuestionsV2';

  const chapterCopy={
    intro:['사진으로 먹고살기','국비 교육부터 장비, 포트폴리오, 첫 영업까지. 12개월 동안 무엇을 언제 준비할지 순서대로 정리했습니다.'],
    market:['잘 팔리는 분야를 고르세요','내 주변에서 반복 주문이 생기고, 단가를 올리기 쉬운 세 분야를 추려보는 것이 중요합니다.'],
    education:['실무 중심으로 배우는 방법','국비지원 과정, 현장 보조, 멘토링을 비교하고 실제 매출까지 걸리는 시간을 계산해보세요.'],
    skills:['촬영만큼 중요한 납품 실무','셀렉, 보정, 누끼, 파일 정리까지. 실제 납품 속도를 높이는 작업 순서를 익혀보세요.'],
    portfolio:['포트폴리오는 결과까지 보여주세요','자체 기획 촬영이라면 목적과 사용처를 분명히 적고, 촬영 과정과 최종 결과물을 한 묶음으로 정리해보세요.'],
    gear:['필요한 장비부터 준비하세요','처음 살 장비와 매출이 생긴 뒤 추가할 장비를 구분하면 초기 비용을 크게 줄일 수 있습니다.'],
    plan:['50 → 150 → 300만 원','월 순수익 목표에 맞춰 매출, 객단가, 재구매 고객 수를 단계별로 계산해보세요.'],
    scripts:['첫 제안부터 재계약까지','DM, 견적, 후속 연락, 가격 인상처럼 실제 영업에서 자주 쓰는 문구를 상황별로 준비했습니다.'],
    iphone:['아이폰으로 촬영 감각 익히기','같은 장면을 여러 번 찍어보면서 초점, 노출, 거리, 빛이 결과를 어떻게 바꾸는지 직접 비교해보세요.'],
    sources:['신청·구매 전 확인할 정보','지원제도와 제품 가격, 카메라 기능은 수시로 바뀔 수 있습니다. 실제 신청이나 구매 전 최신 정보를 확인하세요.']
  };

  const sectionCopy={
    intro:{
      h:'배우는 동안 포트폴리오와 영업 준비를 같이 시작하세요.',
      p:'촬영 기본기를 익히는 시기에 포트폴리오용 자체 기획 촬영과 첫 상품, 영업 준비를 함께 진행하면 첫 매출까지 걸리는 시간을 줄일 수 있습니다.'
    },
    market:{
      h:'상업 촬영은 세 분야를 기준으로 비교해보세요.',
      p:'단가뿐 아니라 재구매 가능성과 납품 범위를 같이 살펴보세요. 한 번의 촬영을 여러 사용처로 확장할 수 있는 분야가 초반에는 유리합니다.'
    },
    education:{h:'실제 매출 발생까지 걸리는 시간을 계산해보세요.'},
    skills:{
      html:'상업사진은<br>‘잘 찍기’와 ‘빨리 납품하기’를<br>같이 연습해야 합니다.',
      p:'촬영 결과만큼 셀렉, 보정, 파일 정리와 납품 속도도 중요합니다. 작업 예시를 보면서 실제 납품 흐름까지 함께 익혀보세요.'
    },
    portfolio:{h:'포트폴리오용 촬영은 목적과 사용처까지 보여주세요.'},
    gear:{
      h:'처음 살 것과 나중에 살 것을 명확히 구분하는 게 좋습니다.',
      p:'바디와 표준줌, 기본 조명처럼 여러 촬영에서 자주 쓰는 장비를 중심으로 시작하세요. 단렌즈와 상위 바디는 실제 주문이 생긴 뒤 추가해도 늦지 않습니다.'
    },
    plan:{h:'수익 목표는 카드로 비교하고, 아래 계산으로 내 상황에 맞춰보세요.'},
    scripts:{
      h:'첫 유료 고객은 직접 찾아보세요.',
      p:'주변 업체를 정리하고, 지금 필요한 촬영 범위와 사용처를 짧게 제안해보세요. 첫 거래가 끝나면 후기와 다음 촬영 시점까지 기록해두는 것이 좋습니다.'
    },
    iphone:{
      h:'아이폰으로 촬영 감각부터 익혀보세요.',
      p:'같은 장면을 여러 번 찍어보면서 초점, 노출, 거리, 빛이 결과를 어떻게 바꾸는지 직접 비교해보세요.'
    },
    sources:{
      h:'신청하거나 구매하기 전에 최신 정보를 확인하세요.',
      p:'지원제도, 교육과정, 제품 가격, 카메라 기능처럼 바뀔 수 있는 정보는 공식 페이지와 판매처를 기준으로 확인하는 것이 좋습니다.'
    }
  };

  function setText(node,value){
    const next=String(value??'');
    if(node&&node.textContent!==next)node.textContent=next;
  }
  function setHtml(node,value){
    const next=String(value??'');
    if(node&&node.innerHTML!==next)node.innerHTML=next;
  }

  function readQuestions(){
    try{
      const value=JSON.parse(localStorage.getItem(QUESTION_KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch{return [];}
  }

  function patchStaticCopy(){
    setHtml($('.hero__body h1'),'사진으로 먹고살기,<br>첫 12개월');
    setHtml($('.hero__body>p'),'국비로 배우고, 필요한 최소 장비를 구매하고, 재구매 고객을 만들어보세요.<br>월 순수익 300만 원까지 도전해보는 왕초보를 위한 기초 전략.');

    Object.entries(chapterCopy).forEach(([id,[title,desc]])=>{
      const hero=$(`.chapter[data-chapter="${id}"] .chapter-hero__copy`);
      setText(hero?.querySelector('h2'),title);
      setText(hero?.querySelector('p'),desc);
    });

    Object.entries(sectionCopy).forEach(([id,copy])=>{
      const heading=$(`.chapter[data-chapter="${id}"] .section-heading`);
      if(!heading)return;
      const h=heading.querySelector('h2');
      const p=heading.querySelector('p');
      if(copy.html)setHtml(h,copy.html);
      else if(copy.h)setText(h,copy.h);
      if(copy.p)setText(p,copy.p);
    });
  }

  function patchEditLabel(){
    const toggle=$('.collection-select-toggle');
    if(!toggle)return;
    if(!toggle.classList.contains('is-active'))setText(toggle,'편집');
    const aria=toggle.classList.contains('is-active')?'편집 완료':'저장 항목 편집';
    if(toggle.getAttribute('aria-label')!==aria)toggle.setAttribute('aria-label',aria);
  }

  function patchQuestionCards(){
    const map=new Map(readQuestions().map(item=>[String(item?.id||''),item]));
    $$('.collection-item[data-library-type="question"]').forEach(card=>{
      const item=map.get(String(card.dataset.libraryId||''));
      if(!item)return;
      const main=$('.collection-item__main',card);
      const type=$('.collection-item__type',main||card);
      const strong=$('strong',main||card);
      const detail=$('p',main||card);
      const selected=String(item.selected_text||'').trim();
      const question=String(item.question||'').trim();
      setText(type,selected?'선택한 내용':'질문');
      setText(strong,selected||question||'저장한 질문');
      setText(detail,selected&&question?`질문 · ${question}`:'');
    });
  }

  let collectionObserver=null;
  let raf=0;
  function patchCollection(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      patchEditLabel();
      patchQuestionCards();
    });
  }

  function bindCollection(){
    const sheet=$('#collectionSheet');
    if(!sheet){setTimeout(bindCollection,120);return;}
    patchCollection();
    if(collectionObserver)return;
    collectionObserver=new MutationObserver(patchCollection);
    collectionObserver.observe(sheet,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-pressed']});
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#collectionFab,.collection-tab,.collection-select-toggle,[data-v40-qmode],#askSave'))setTimeout(patchCollection,0);
    },true);
  }

  function init(){
    let tries=0;
    const waitForApp=()=>{
      if($('.hero'))patchStaticCopy();
      else if(tries++<50)setTimeout(waitForApp,80);
    };
    waitForApp();
    bindCollection();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('pageshow',()=>setTimeout(()=>{patchStaticCopy();patchCollection();},100),{passive:true});
})();
