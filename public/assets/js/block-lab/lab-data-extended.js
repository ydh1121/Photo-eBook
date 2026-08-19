(function(){
  const img=path=>`/assets/images/generated/v1/${path}`;
  const blocks=Array.isArray(window.__BLOCK_LAB_DATA)?window.__BLOCK_LAB_DATA:[];

  blocks.push(
    {
      id:'lab_faq',type:'faq',variant:'open-first',status:'candidate',editorialProfile:'faq',referenceProfiles:['design-emilkowalski-skills'],
      content:{title:'자주 묻는 질문',description:'실제 사용자가 반복해서 묻는 질문을 본문과 중복되지 않게 정리합니다.',items:[
        {question:'처음부터 장비를 많이 사야 하나요?',answer:'아니요. 첫 상품에 실제로 필요한 도구부터 정하고, 매출이나 작업 범위가 넓어질 때 추가하는 편이 안전합니다.'},
        {question:'교육 과정은 무엇을 기준으로 비교해야 하나요?',answer:'수업 시간보다 실제 실습량, 최근 작업 사례, 결과물 피드백, 견적과 납품 교육 여부를 같이 확인하세요.'},
        {question:'가격은 얼마나 자주 다시 확인해야 하나요?',answer:'시장 가격과 제품 가격처럼 자주 바뀌는 정보는 발행 전 확인일을 남기고 정기적으로 다시 검토하는 편이 좋습니다.'}
      ]}
    },
    {
      id:'lab_pros_cons',type:'pros-cons',variant:'split',status:'candidate',editorialProfile:'pros-cons',
      content:{title:'선택지의 장점과 부담을 같이 봅니다',description:'형식적인 단점 한 줄이 아니라 실제 운영에서 감수해야 할 조건까지 같은 수준으로 씁니다.',pros:[
        {title:'초기 비용이 비교적 낮음',description:'작은 서비스 단위부터 판매할 수 있습니다.'},
        {title:'검증 속도가 빠름',description:'고객 반응을 보고 상품 설명과 범위를 바로 조정할 수 있습니다.'}
      ],cons:[
        {title:'영업을 직접 해야 함',description:'초기에는 고객을 찾고 제안하는 시간이 꾸준히 필요합니다.'},
        {title:'수입 변동이 큼',description:'반복 고객이 생기기 전에는 월별 차이가 클 수 있습니다.'}
      ]}
    },
    {
      id:'lab_comparison_table',type:'comparison-table',variant:'default',status:'candidate',editorialProfile:'comparison',
      content:{title:'정보가 많으면 카드보다 표가 낫습니다',description:'같은 비교 기준이 4개 이상이거나 선택지가 많을 때 사용하는 표형 블록입니다.',ariaLabel:'진입 방식 비교표',columns:[
        {key:'type',label:'방식'},{key:'cost',label:'초기 비용'},{key:'speed',label:'시작 속도'},{key:'repeat',label:'반복 수요'},{key:'risk',label:'주요 부담'}
      ],rows:[
        {type:'프리랜서',cost:'낮음',speed:'빠름',repeat:'고객별 차이',risk:'직접 영업'},
        {type:'출장 서비스',cost:'중간',speed:'보통',repeat:'지역 중심',risk:'이동 시간'},
        {type:'소규모 매장',cost:'높음',speed:'느림',repeat:'생활권 중심',risk:'고정비'}
      ],note:'표 안의 값은 UI 샘플입니다. 실제 산업 데이터가 아닙니다.'}
    },
    {
      id:'lab_timeline',type:'timeline',variant:'vertical',status:'candidate',editorialProfile:'timeline',
      content:{title:'시간순으로 봐야 하는 내용',description:'일정, 절차, 경력, 제도 변경처럼 시점 자체가 중요한 정보를 보여줍니다.',items:[
        {time:'준비 주간',title:'시장과 고객을 정리',description:'누가 어떤 결과에 돈을 내는지 사례를 모읍니다.'},
        {time:'1개월차',title:'첫 상품과 사례 준비',description:'가격과 결과물이 분명한 작은 상품을 만듭니다.',tags:['초안','검증 전']},
        {time:'2~3개월차',title:'첫 판매와 피드백',description:'실제 문의와 작업에서 반복되는 질문을 기록합니다.'},
        {time:'이후',title:'재구매 기준 정리',description:'반복되는 요청을 상품과 운영 기준으로 반영합니다.'}
      ]}
    },
    {
      id:'lab_image_copy',type:'image-copy-split',variant:'image-left',status:'candidate',editorialProfile:'rich-text',referenceProfiles:['component-voltagent-apple-design-md'],
      content:{eyebrow:'한 장면을 자세히',title:'이미지에는 설명할 이유가 있어야 합니다',description:'이미지가 단순한 분위기 장식이 아니라 실제 작업, 결과물, 공간, 도구를 이해하는 데 필요한 경우 사용합니다.',image:img('portfolio/studio-process.webp?v=b007'),imageAlt:'촬영 작업을 준비하는 스튜디오 장면',points:['사용자가 이미지에서 봐야 할 부분을 설명','본문과 같은 말을 반복하지 않음','모바일에서는 이미지와 설명의 순서를 유지']}
    },
    {
      id:'lab_gallery',type:'gallery',variant:'grid',status:'candidate',editorialProfile:'media-rail',
      content:{title:'여러 결과물을 한 번에 비교합니다',description:'중복 이미지를 늘리기보다 서로 다른 정보 역할이 있는 결과만 배치합니다.',items:[
        {image:img('portfolio/product-brand.webp?v=b007'),imageAlt:'제품 브랜드 촬영 예시',caption:'제품과 사용 맥락'},
        {image:img('portfolio/professional-profile.webp?v=b007'),imageAlt:'전문직 프로필 촬영 예시',caption:'인물과 업무 환경'},
        {image:img('portfolio/food-store.webp?v=b007'),imageAlt:'음식 매장 촬영 예시',caption:'메뉴와 공간'},
        {image:img('portfolio/studio-process.webp?v=b007'),imageAlt:'스튜디오 작업 과정',caption:'준비와 작업 과정'}
      ]}
    },
    {
      id:'lab_quote',type:'quote-expert',variant:'quote',status:'candidate',editorialProfile:'quote-expert',
      content:{quote:'초보자용 설명은 쉬운 단어만 쓰는 것이 아니라, 무엇을 먼저 판단해야 하는지 순서를 보여주는 데서 시작합니다.',name:'에디토리얼 예시',role:'Block Lab 샘플 발언',source:'실제 전문가 인용이 아닌 UI 샘플'}
    },
    {
      id:'lab_calculator',type:'calculator',variant:'multiply',status:'candidate',editorialProfile:'calculator',
      content:{title:'간단한 수익 시뮬레이션',description:'입력값과 단위를 분명하게 보여주고 결과는 확정 수익이 아니라 계산 예시로 표시합니다.',inputs:[
        {id:'price',label:'평균 작업 단가',value:150000,step:10000,unit:'원',note:'UI 샘플 기본값'},
        {id:'jobs',label:'주당 작업 수',value:3,step:1,unit:'건',note:'예시 입력'},
        {id:'weeks',label:'월 환산 주수',value:4,step:.1,unit:'주',note:'단순 계산용'}
      ],outputLabel:'월 매출 계산 예시',outputPrefix:'₩',outputSuffix:'',outputNote:'비용과 세금 등을 반영하지 않은 단순 곱셈 결과입니다.'}
    },
    {
      id:'lab_cta',type:'cta',variant:'band',status:'candidate',editorialProfile:'cta',referenceProfiles:['component-voltagent-apple-design-md'],
      content:{title:'다음 행동은 한 가지를 먼저 보여줍니다',description:'동일한 우선순위의 버튼을 여러 개 놓지 않고, 보조 행동은 시각적으로 한 단계 낮춥니다.',primaryLabel:'비교 기준 확인',primaryUrl:'#',secondaryLabel:'출처 보기',secondaryUrl:'#'}
    },
    {
      id:'lab_service_list',type:'service-list',variant:'rows',status:'candidate',editorialProfile:'comparison',
      content:{title:'업체와 서비스를 목록으로 비교합니다',description:'교육기관, 도구, 플랫폼, 협력업체처럼 이미지보다 조건과 설명이 중요한 목록에 사용합니다.',items:[
        {category:'교육',title:'실무 교육 과정 A',description:'실습 비중과 결과물 피드백을 확인하는 예시 항목입니다.',tags:['실습','피드백'],meta:'비용 확인 필요',note:'기준일 필요',actionLabel:'상세 확인',actionUrl:'#'},
        {category:'플랫폼',title:'외주 플랫폼 B',description:'수수료와 고객 유입 방식을 비교하는 예시 항목입니다.',tags:['수수료','고객 유입'],meta:'정책 확인 필요',note:'공식 출처 우선',actionLabel:'정책 확인',actionUrl:'#'},
        {category:'도구',title:'업무 도구 C',description:'구독료와 실제 사용 목적을 함께 보는 예시 항목입니다.',tags:['구독','업무'],meta:'가격 확인 필요',note:'공식 가격 기준',actionLabel:'제품 보기',actionUrl:'#'}
      ]}
    }
  );
})();
