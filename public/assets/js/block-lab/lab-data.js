(function(){
  const img=path=>`/assets/images/generated/v1/${path}`;

  window.__BLOCK_LAB_DATA=[
    {
      id:'lab_hero',type:'hero',variant:'image-metrics',status:'candidate',editorialProfile:'hero',
      content:{
        eyebrow:'먹고살기 가이드 / UI 샘플',
        title:'처음 시작하는 일을 실제 수익까지 연결하는 방법',
        description:'산업 분야가 달라져도 시장, 준비, 실행, 수익 구조를 같은 디자인 언어로 읽을 수 있는 첫 화면을 검토합니다.',
        image:img('hero/hero-main.webp?v=b009'),imageAlt:'작업을 준비하는 공간',
        facts:[
          {label:'대상',value:'완전 초보',note:'경험이 없어도 이해할 수 있게'},
          {label:'준비',value:'작게 시작',note:'필요한 비용부터 확인'},
          {label:'실행',value:'첫 고객',note:'판매 가능한 단위로 설계'},
          {label:'다음 단계',value:'반복 수요',note:'한 번보다 재구매 구조 확인'}
        ]
      }
    },
    {
      id:'lab_chapter_hero',type:'chapter-hero',variant:'image',status:'candidate',editorialProfile:'section-heading',
      content:{index:'01 / 시장',eyebrow:'시장 선택',title:'누가 돈을 내는지부터 확인하세요',description:'좋아 보이는 분야보다 실제 고객과 반복 수요가 있는지 같은 기준으로 비교합니다.',image:img('chapter/market.webp?v=b009'),imageAlt:'시장과 고객을 조사하는 장면'}
    },
    {
      id:'lab_section_heading',type:'section-heading',variant:'default',status:'candidate',editorialProfile:'section-heading',
      content:{eyebrow:'비교 기준',title:'가격, 시간, 반복 수요를 같은 화면에서 비교합니다',description:'카드마다 다른 정보를 넣기보다 선택에 필요한 기준을 먼저 맞추면 판단이 빨라집니다.'}
    },
    {
      id:'lab_rich_text',type:'rich-text',variant:'lead',status:'candidate',editorialProfile:'rich-text',
      content:{title:'본문 설명',paragraphs:['처음 시작할 때는 모든 기술을 갖춘 뒤 고객을 찾을 필요가 없습니다. 지금 판매할 수 있는 작은 단위를 정하고 필요한 기술을 그 순서에 맞춰 배우는 편이 현실적입니다.','정보가 길어지면 문단을 계속 늘리기보다 비교, 체크리스트, 과정 블록으로 바꿀 수 있는지 확인합니다.']}
    },
    {
      id:'lab_process',type:'process',variant:'sequence',status:'candidate',editorialProfile:'process',
      content:{title:'첫 매출까지의 순서',description:'단계마다 한 가지 행동을 두고 앞 단계의 결과가 다음 단계로 이어지게 구성합니다.',items:[
        {title:'주변 시장을 확인한다',description:'누가 어떤 문제에 돈을 쓰는지 사례를 모읍니다.'},
        {title:'작은 상품을 만든다',description:'가격과 결과물이 분명한 첫 제안을 정합니다.'},
        {title:'첫 고객에게 제안한다',description:'반응을 기록하고 설명이 부족한 부분을 고칩니다.'},
        {title:'반복되는 요청을 묶는다',description:'자주 나오는 요구를 다음 상품과 운영 기준에 반영합니다.'}
      ],note:'순서가 없는 정보라면 이 블록 대신 checklist나 rich-text를 사용합니다.'}
    },
    {
      id:'lab_metrics',type:'metric-grid',variant:'default',status:'candidate',editorialProfile:'metrics',
      content:{title:'수치는 기준과 함께 보여줍니다',description:'아래 숫자는 UI 검토용 예시이며 실제 산업 데이터가 아닙니다.',items:[
        {label:'초기 준비 예시',value:'120만 원',note:'장비와 교육비를 합친 샘플 값',source:'샘플 데이터'},
        {label:'주당 확보 시간',value:'12시간',note:'학습과 영업 시간을 포함한 예시',source:'샘플 데이터'},
        {label:'첫 상품 예시',value:'15만 원',note:'비교 UI를 보기 위한 임의 값',source:'샘플 데이터'},
        {label:'목표 반복 고객',value:'4곳',note:'레이아웃 검토용 예시',source:'샘플 데이터'}
      ]}
    },
    {
      id:'lab_offers',type:'offer-rail',variant:'cards',status:'candidate',editorialProfile:'comparison',
      content:{title:'상품 구성 비교',description:'가격만 키우지 않고 무엇이 포함되는지 같은 순서로 읽히게 합니다.',items:[
        {label:'가볍게 시작',title:'기본형',price:'9만 원',description:'핵심 결과물 1종과 기본 수정 1회를 포함하는 UI 예시입니다.',tags:['결과물 1종','수정 1회']},
        {label:'가장 많이 비교',title:'표준형',price:'18만 원',description:'결과물 범위와 작업 시간을 조금 넓힌 샘플입니다.',tags:['결과물 3종','수정 2회']},
        {label:'범위가 큰 작업',title:'확장형',price:'32만 원',description:'추가 산출물과 후속 작업을 포함하는 구성 예시입니다.',tags:['추가 산출물','후속 지원']}
      ]}
    },
    {
      id:'lab_notice',type:'notice',variant:'warning',status:'candidate',editorialProfile:'warning',
      content:{label:'확인 필요',title:'가격 정보에는 기준 시점을 같이 적습니다',description:'시장 가격과 지원제도는 바뀔 수 있습니다. 오래된 숫자를 현재 기준처럼 보여주지 않습니다.',action:'발행 전 최신 출처와 확인일을 다시 검토하세요.'}
    },
    {
      id:'lab_comparison',type:'comparison-cards',variant:'generic',status:'candidate',editorialProfile:'comparison',
      content:{title:'진입 방식 비교',description:'서로 다른 선택지를 같은 기준으로 정렬한 카드입니다. 아래 내용은 UI 샘플입니다.',columns:[
        {key:'cost',label:'초기 비용'},{key:'speed',label:'시작 속도'},{key:'repeat',label:'반복 수요'}
      ],items:[
        {label:'선택지 A',title:'프리랜서형',description:'개인 기술을 서비스로 판매하는 구조',values:{cost:'낮음',speed:'빠름',repeat:'고객에 따라 다름'},tags:['1인 운영','포트폴리오']},
        {label:'선택지 B',title:'출장 서비스형',description:'고객 위치에서 서비스를 제공하는 구조',values:{cost:'중간',speed:'보통',repeat:'지역 고객 중심'},tags:['이동','지역 수요']},
        {label:'선택지 C',title:'소규모 매장형',description:'공간과 고정비가 필요한 구조',values:{cost:'높음',speed:'느림',repeat:'생활권 수요'},tags:['공간','고정비']}
      ]}
    },
    {
      id:'lab_checklist',type:'checklist',variant:'numbered',status:'candidate',editorialProfile:'checklist',
      content:{title:'시작 전 확인',description:'한 항목에 한 가지 확인사항만 둡니다.',items:['실제로 돈을 내는 고객이 누구인지 설명할 수 있는가','첫 상품의 결과물과 가격이 정해져 있는가','한 달 고정비를 계산했는가','고객에게 보여줄 최소 사례가 준비돼 있는가','정보의 기준일과 출처를 확인했는가','첫 고객에게 연락할 방법을 정했는가']}
    },
    {
      id:'lab_media_rail',type:'media-rail',variant:'skill',status:'candidate',editorialProfile:'media-rail',
      content:{title:'작업 예시와 설명',description:'이미지에서 보이는 것과 카드 설명의 역할이 겹치지 않게 구성합니다.',items:[
        {kicker:'작업 01',title:'결과물 정리',description:'최종 결과물을 일정한 기준으로 골라 전달하는 작업 예시',image:img('skills/raw-culling.webp?v=b009'),tags:['선별','납품'],meta:'관련 자료 3개'},
        {kicker:'작업 02',title:'후반 작업',description:'수정 전후의 차이를 확인하고 필요한 부분만 보정하는 과정',image:img('skills/portrait-retouch.webp?v=b007'),tags:['보정','검수'],meta:'관련 자료 5개'},
        {kicker:'작업 03',title:'현장 연결',description:'작업 중 결과를 바로 확인하고 다음 판단으로 이어가는 흐름',image:img('skills/tether-shooting.webp?v=b009'),tags:['현장','확인'],meta:'관련 자료 2개'}
      ]}
    },
    {
      id:'lab_case_study',type:'case-study-rail',variant:'project',status:'candidate',editorialProfile:'case-study',
      content:{title:'사례 카드',description:'실제 고객 작업과 자체 기획 사례를 구분해서 보여줄 수 있는 구조입니다.',items:[
        {kind:'자체 기획 사례',title:'작은 브랜드 결과물 구성',description:'사용처를 먼저 정하고 필요한 결과물을 역으로 설계한 샘플입니다.',image:img('portfolio/product-brand.webp?v=b007'),deliverables:['대표 이미지','상세 이미지','SNS용 세로 이미지']},
        {kind:'실제 사례 표시 예시',title:'전문직 프로필 패키지',description:'실제 작업이라면 고객 공개 동의와 조건을 함께 관리해야 합니다.',image:img('portfolio/professional-profile.webp?v=b007'),deliverables:['프로필 이미지','웹사이트용 크롭','보정본']}
      ]}
    },
    {
      id:'lab_product_tool',type:'product-tool',variant:'rail',status:'candidate',editorialProfile:'product-tool',
      content:{title:'도구와 비용',description:'사진 장비뿐 아니라 소프트웨어, 재료, 서비스에도 사용할 수 있는 공통 형태를 검토합니다.',items:[
        {kind:'장비 예시',title:'카메라 본체',price:'가격 확인 필요',description:'기능, 추천 이유, 구매 시점을 분리해 보여주는 샘플입니다.',image:img('gear/sony-a7-iii.webp?v=b010'),tags:['중고 비교','필요 시 구매'],source:'제조사/판매처 확인'},
        {kind:'도구 예시',title:'표준 줌 렌즈',price:'가격 확인 필요',description:'실제 제품 사양은 공식 출처를 기준으로 표시합니다.',image:img('gear/tamron-28-75-g2.webp?v=b010'),tags:['사양 확인','가격 기준일'],source:'제조사 확인'}
      ]}
    },
    {
      id:'lab_roadmap',type:'roadmap',variant:'phases',status:'candidate',editorialProfile:'roadmap',
      content:{title:'실행 로드맵',description:'기간은 보장값이 아니라 계획을 읽기 위한 구간으로 사용합니다.',items:[
        {period:'1단계',title:'시장 확인',outcome:'판매 단위 1개',action:'고객과 결과물의 범위를 정합니다.'},
        {period:'2단계',title:'사례 준비',outcome:'보여줄 사례 3개',action:'실제 사용처를 가정해 결과물을 준비합니다.'},
        {period:'3단계',title:'첫 판매',outcome:'첫 유료 고객',action:'작게 제안하고 반응을 기록합니다.'},
        {period:'4단계',title:'반복 구조',outcome:'재구매 기준 정리',action:'반복 요청을 상품과 운영 방식에 반영합니다.'}
      ]}
    },
    {
      id:'lab_script_copy',type:'script-copy',variant:'messages',status:'candidate',editorialProfile:'script-copy',
      content:{title:'바로 수정해서 쓰는 문구',description:'복사할 내용과 사용 상황을 분리합니다.',items:[
        {channel:'이메일',title:'첫 문의 답변',when:'가격을 처음 묻는 고객에게',message:'안녕하세요. 요청하신 작업 범위를 확인했습니다. 필요한 결과물과 일정이 정해지면 정확한 견적을 안내드릴 수 있습니다. 아래 세 가지만 알려주세요: 결과물 종류, 필요한 날짜, 사용 목적.'},
        {channel:'메신저',title:'일정 확인',when:'작업 확정 전',message:'가능한 일정을 확인하고 있습니다. 작업일과 최종 전달일을 각각 알려주시면 준비 시간을 포함해 가능한 일정을 말씀드리겠습니다.'}
      ]}
    },
    {
      id:'lab_tutorial',type:'tutorial',variant:'detail',status:'candidate',editorialProfile:'process',
      content:{eyebrow:'실습형 콘텐츠',title:'작은 과제를 따라 하며 결과를 비교합니다',description:'사진 촬영뿐 아니라 조리, 편집, 제작, 서비스 절차에도 사용할 수 있는 상세 학습 블록입니다.',image:img('iphone/lessons/product.webp?v=b009'),imageAlt:'실습 작업 예시',items:[
        {label:'준비',title:'조건을 하나만 바꿉니다',description:'처음에는 변수를 여러 개 바꾸지 않고 차이를 확인합니다.'},
        {label:'순서',title:'같은 조건으로 세 번 반복합니다',steps:['기준 결과를 만든다','한 가지 조건을 바꾼다','두 결과를 나란히 비교한다']},
        {label:'확인',title:'차이를 기록합니다',description:'무엇이 좋아졌는지보다 어떤 변화가 생겼는지 먼저 적습니다.'}
      ],mission:'오늘 한 번 직접 반복해보고 전후 결과를 두 장만 남겨보세요.'}
    },
    {
      id:'lab_resources',type:'resources',variant:'official-list',status:'candidate',editorialProfile:'source-evidence',
      content:{title:'근거와 공식 확인 링크',description:'추천 읽을거리와 사실 근거는 역할을 구분합니다. 아래 URL은 Block Lab용 비활성 예시입니다.',items:[
        {publisher:'공식 기관',title:'제도 기준 확인',url:'#',supports:'지원 조건과 신청 기준을 확인하는 출처',checkedAt:'샘플'},
        {publisher:'제조사',title:'제품 사양 확인',url:'#',supports:'제품 기능과 지원 범위를 확인하는 출처',checkedAt:'샘플'},
        {publisher:'통계 원문',title:'시장 데이터 확인',url:'#',supports:'시장 규모나 추세 수치를 뒷받침하는 출처',checkedAt:'샘플'}
      ]}
    }
  ];
})();
