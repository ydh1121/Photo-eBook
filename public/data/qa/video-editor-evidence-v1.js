(function(){
  const draft=window.__VIDEO_EDITOR_QA_DRAFT;
  if(!draft||!Array.isArray(draft.blocks))return;
  const byId=new Map(draft.blocks.map(block=>[block.id,block]));
  const verified={mode:'full',factState:'verified',fields:{}};

  const hero=byId.get('ve_hero');
  if(hero)hero.aiPolicy={mode:'full',factState:'not_required',fields:{}};

  const market=byId.get('ve_market_compare');
  if(market){
    market.content={
      title:'첫 외주 후보를 비교합니다',
      description:'아래 금액은 2026년 8월 20일 크몽 공개 판매 페이지에서 확인한 개별 등록가 예시입니다. 평균 단가나 실제 거래가, 수요 규모를 뜻하지 않으며 작업 범위에 따라 차이가 큽니다.',
      columns:[
        {key:'output',label:'주요 결과물'},
        {key:'workflow',label:'작업 흐름'},
        {key:'priceExample',label:'현재 판매 예시'}
      ],
      items:[
        {label:'후보 A',title:'숏폼·SNS 편집',description:'짧은 세로 영상과 자막, 컷 편집 중심의 상품이 여러 형태로 등록돼 있습니다.',values:{output:'세로형 짧은 영상',workflow:'빠른 반복 제작',priceExample:'숏폼 1편 5천원 예시'},tags:['컷 편집','자막','세로형']},
        {label:'후보 B',title:'유튜브 롱폼 편집',description:'러닝타임, 원본 분량, 자막·효과 범위에 따라 분당·편당 기준이 섞여 있습니다.',values:{output:'가로형 긴 영상',workflow:'구성·호흡 정리',priceExample:'1분 1만~2.1만원 예시'},tags:['구성','사운드','자막']},
        {label:'후보 C',title:'강의·인터뷰 편집',description:'편집만 맡는 작업과 촬영까지 포함하는 작업은 범위가 크게 달라 같은 기준으로 비교하지 않습니다.',values:{output:'교육·인터뷰 영상',workflow:'정보 구조 정리',priceExample:'촬영 포함 여부 구분'},tags:['정보 전달','자료 화면','음성']}
      ]
    };
    market.evidence=[
      {id:'kmong-shortform-735038-20260820',title:'숏폼 영상 편집 제작',publisher:'크몽',url:'https://kmong.com/gig/735038',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[0].values.priceExample']},
      {id:'kmong-youtube-per-minute-741289-20260820',title:'유튜브 쇼츠.롱폼 영상편집 깔끔히 해드립니다',publisher:'크몽',url:'https://kmong.com/gig/741289',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[1].values.priceExample']},
      {id:'kmong-edit-long-short-757668-20260820',title:'영상 편집 대행(롱폼/숏폼)',publisher:'크몽',url:'https://kmong.com/gig/757668',publishedAt:null,checkedAt:'2026-08-20',supports:['content.description']}
    ];
    market.aiPolicy={...verified};
  }

  const process=byId.get('ve_process');
  if(process){
    process.content={
      title:'연습과 판매 준비를 같은 순서로 맞춥니다',
      description:'모든 기능을 배우기보다 첫 결과물을 만드는 데 필요한 기술부터 익힙니다.',
      items:[
        {title:'편집할 영상 유형을 하나 고른다',description:'숏폼, 롱폼, 인터뷰처럼 결과물 형태를 먼저 정합니다.'},
        {title:'기본 편집 흐름을 반복한다',description:'파일 정리, 컷 편집, 자막, 소리 조정, 출력 순서를 반복합니다.'},
        {title:'자체 기획 예시를 만든다',description:'사용 목적을 밝히고 전후 결과와 작업 과정을 보여줍니다.'},
        {title:'외주 범위를 문장으로 정리한다',description:'결과물, 수정 횟수, 전달일, 원본 파일 제공 여부를 구분합니다.'},
        {title:'첫 고객에게 작게 제안한다',description:'작업 범위가 분명한 작은 제안부터 시작하고 반응을 기록합니다.'},
        {title:'계약·세금·플랫폼 조건을 확인한다',description:'결과물 권리, 수정·검수, 대금 지급 조건을 계약에 적고, 인적용역 소득과 플랫폼 판매 약관은 자신의 거래 방식에 맞는 최신 공식 안내를 확인합니다.'}
      ],
      note:'한국콘텐츠진흥원의 방송영상 제작스태프 표준업무위탁계약서는 계약 항목을 점검하는 참고자료로 활용할 수 있습니다. 모든 영상편집 외주에 그대로 적용되는 계약서는 아닙니다.'
    };
    process.evidence=[
      {id:'kocca-standard-contracts-20260820',title:'표준계약서',publisher:'한국콘텐츠진흥원',url:'https://www.kocca.kr/kocca/subPage.do?menuNo=205068',publishedAt:'2021-10-27',checkedAt:'2026-08-20',supports:['content.items[5].description','content.note']},
      {id:'nts-income-tax-personal-service-20260820',title:'종합소득세 신고 안내',publisher:'국세청',url:'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238978&mi=4048',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[5].description']},
      {id:'kmong-seller-terms-20260205',title:'판매 이용약관 2026. 02. 05. ver.',publisher:'크몽',url:'https://support.kmong.com/hc/ko/articles/54621478243353-%ED%8C%90%EB%A7%A4-%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80-2026-02-05-ver',publishedAt:'2026-02-05',checkedAt:'2026-08-20',supports:['content.items[5].description']}
    ];
    process.aiPolicy={...verified};
  }

  const tools=byId.get('ve_tools');
  if(tools){
    tools.content={
      title:'편집 프로그램은 작업 범위와 비용 구조를 같이 보고 고릅니다',
      description:'처음에는 기능을 전부 비교하기보다 내가 만들 결과물에 필요한 기능, 파일 호환, 비용 구조를 확인합니다. 가격은 2026년 8월 20일 공식 페이지 확인 기준이며 변동될 수 있습니다.',
      items:[
        {kind:'구독형 편집 프로그램',title:'Adobe Premiere',price:'월 30,800원',description:'Adobe 한국 공식 페이지에서 연간 약정·월 청구 개인 Premiere 플랜이 월 30,800원(부가세 포함)으로 표시됩니다. 편집, 타이틀 애니메이션, 효과, 사운드 믹싱 기능과 Adobe Express Premium, Frame.io, 100GB 스토리지 등이 포함됩니다.',tags:['구독형','Frame.io','100GB'],source:'Adobe 공식 · 2026-08-20 확인'},
        {kind:'무료로 시작 가능',title:'DaVinci Resolve 21',price:'무료 버전 제공',description:'Blackmagic Design 공식 페이지에서 편집, 색보정, VFX, 모션 그래픽, 오디오 후반 작업을 하나의 앱에서 다룰 수 있는 무료 버전을 제공합니다. Studio 가격은 공식 페이지의 최근 표시가 서로 달라 발행 직전에 다시 확인합니다.',tags:['무료 버전','편집·색보정','오디오'],source:'Blackmagic Design 공식 · 2026-08-20 확인'},
        {kind:'파일·소스 관리',title:'저장과 라이선스 기록',description:'원본, 프로젝트 파일, 최종본을 구분해 저장합니다. 음원·폰트·그래픽은 제공처별 이용허락 범위를 확인하고 근거를 남깁니다. 한국저작권위원회는 음악 이용 시 권리자·관리단체를 통한 이용허락 절차와 폰트 파일의 라이선스 확인 필요성을 안내합니다.',tags:['백업','파일 전달','사용 권한'],source:'한국저작권위원회 · 2026-08-20 확인'}
      ]
    };
    tools.evidence=[
      {id:'adobe-premiere-20260820',title:'전문 영상 편집 소프트웨어 | Adobe Premiere',publisher:'Adobe',url:'https://www.adobe.com/kr/products/premiere.html',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[0].price','content.items[0].description']},
      {id:'blackmagic-davinci-20260820',title:'DaVinci Resolve | Blackmagic Design',publisher:'Blackmagic Design',url:'https://www.blackmagicdesign.com/kr/products/davinciresolve',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[1].price','content.items[1].description']},
      {id:'copyright-music-permission-20260820',title:'음악·영상 저작물 이용허락 FAQ',publisher:'한국저작권위원회',url:'https://www.copyright.or.kr/customer-center/faq/list.do?counselfaqno=47490&searchcounselfaqno=47490',publishedAt:'2016-11-16',checkedAt:'2026-08-20',supports:['content.items[2].description']},
      {id:'copyright-font-file-20260820',title:'폰트 파일 이용과 저작권 상담',publisher:'한국저작권위원회',url:'https://www.copyright.or.kr/business/counsel/auto-advice-service/practice/detail.do?categorySeq=0&categoryType=&counselSeq=3524&parCategorySeq=',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[2].description']}
    ];
    tools.aiPolicy={...verified};
  }

  const offer=byId.get('ve_offer');
  if(offer){
    offer.content={
      title:'처음에는 결과물 범위가 분명한 상품부터 만듭니다',
      description:'현재 공개 판매 예시를 참고하되 그대로 따라 정하지 않습니다. 2026년 8월 20일 크몽에는 숏폼 1편 5천원, 1분 기준 1만~2.1만원, 1분 이내 기본 편집 1.6만원처럼 서로 다른 등록가가 확인됩니다. 평균 단가나 실제 거래가는 아니며, 원본 분량·자막·그래픽·수정 횟수·작업 시간을 기준으로 자신의 가격을 계산합니다.',
      items:[
        {label:'기본형',title:'숏폼 1편',description:'완성본 1편의 길이, 자막 범위, 수정 횟수를 분명하게 적는 구성입니다.',tags:['결과물 1편','수정 범위 명시']},
        {label:'묶음형',title:'숏폼 여러 편',description:'같은 촬영본에서 여러 편을 만드는 경우 공통 작업과 편당 작업을 나눠 계산합니다.',tags:['반복 작업','공통 템플릿']},
        {label:'운영형',title:'정기 편집',description:'월 단위로 진행한다면 편수, 전달 주기, 수정 기준을 계약 전에 정합니다.',tags:['정기 발주','납품 일정']}
      ]
    };
    offer.evidence=[
      {id:'kmong-shortform-735038-20260820',title:'숏폼 영상 편집 제작',publisher:'크몽',url:'https://kmong.com/gig/735038',publishedAt:null,checkedAt:'2026-08-20',supports:['content.description']},
      {id:'kmong-youtube-per-minute-741289-20260820',title:'유튜브 쇼츠.롱폼 영상편집 깔끔히 해드립니다',publisher:'크몽',url:'https://kmong.com/gig/741289',publishedAt:null,checkedAt:'2026-08-20',supports:['content.description']},
      {id:'kmong-edit-long-short-757668-20260820',title:'영상 편집 대행(롱폼/숏폼)',publisher:'크몽',url:'https://kmong.com/gig/757668',publishedAt:null,checkedAt:'2026-08-20',supports:['content.description']}
    ];
    offer.aiPolicy={...verified};
  }

  const faq=byId.get('ve_faq');
  if(faq){
    faq.content={
      title:'처음 시작할 때 자주 막히는 부분',
      description:'도구 선택은 작업 조건에 맞추고, 세금과 플랫폼 정책처럼 바뀔 수 있는 내용은 최신 공식 안내를 다시 확인합니다.',
      items:[
        {question:'편집 프로그램은 하나만 배워야 하나요?',answer:'처음에는 한 프로그램으로 기본 작업 흐름을 반복하는 편이 단순합니다. 다만 고객 파일 형식과 협업 환경에 따라 다른 도구가 필요할 수 있으니 프로그램 이름보다 필요한 기능과 호환 조건을 먼저 확인하세요.'},
        {question:'포트폴리오가 없으면 첫 외주는 어떻게 준비하나요?',answer:'자체 기획 작업임을 밝히고 실제 사용처를 가정한 예시를 만들 수 있습니다. 작업 목적, 편집 전 조건, 편집 과정, 최종 결과를 함께 보여주세요.'},
        {question:'견적에는 무엇을 적어야 하나요?',answer:'최종 결과물, 원본 분량, 자막과 그래픽 범위, 수정 횟수, 초안·최종 전달일을 먼저 정리하세요. 실제 금액은 작업 시간과 현재 판매 조건을 확인한 뒤 계산합니다.'},
        {question:'3.3%를 떼고 받으면 세금 처리가 끝난 건가요?',answer:'항상 그렇지는 않습니다. 국세청은 3.3% 원천징수된 인적용역 사업소득도 종합소득세 신고 대상에 포함될 수 있다고 안내합니다. 실제 소득 구분과 신고 방식은 거래 형태와 사업자 상태에 따라 달라질 수 있으므로 홈택스 안내나 세무 전문가에게 확인하세요.'},
        {question:'플랫폼에서 판매하면 어떤 약관을 봐야 하나요?',answer:'플랫폼별 판매 이용약관과 운영정책을 확인합니다. 예를 들어 크몽은 전문가 회원의 권리·의무를 다루는 판매 이용약관을 별도로 두고 있습니다. 수수료, 취소·환불, 판매 제한처럼 바뀔 수 있는 조건은 거래 전에 최신 버전을 다시 확인하세요.'}
      ]
    };
    faq.evidence=[
      {id:'nts-income-tax-personal-service-20260820',title:'종합소득세 신고 안내',publisher:'국세청',url:'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238978&mi=4048',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[3].answer']},
      {id:'kmong-seller-terms-20260205',title:'판매 이용약관 2026. 02. 05. ver.',publisher:'크몽',url:'https://support.kmong.com/hc/ko/articles/54621478243353-%ED%8C%90%EB%A7%A4-%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80-2026-02-05-ver',publishedAt:'2026-02-05',checkedAt:'2026-08-20',supports:['content.items[4].answer']}
    ];
    faq.aiPolicy={...verified};
  }

  const resources=byId.get('ve_resources');
  if(resources){
    resources.content={
      title:'발행 전 공식 자료를 다시 확인합니다',
      description:'프로그램 가격, 훈련, 계약, 세금, 저작권, 플랫폼 정책은 바뀔 수 있습니다. 발행 전 확인일과 적용 범위를 다시 봅니다.',
      items:[
        {publisher:'Adobe',title:'Premiere 기능·개인 플랜 확인',url:'https://www.adobe.com/kr/products/premiere.html',supports:'Premiere 기능과 현재 개인 플랜 가격',checkedAt:'2026-08-20'},
        {publisher:'Blackmagic Design',title:'DaVinci Resolve 무료·Studio 안내',url:'https://www.blackmagicdesign.com/kr/products/davinciresolve',supports:'무료 버전 제공 여부와 기능 범위',checkedAt:'2026-08-20'},
        {publisher:'고용24',title:'영상편집 직업훈련 과정 확인',url:'https://www.work24.go.kr/hr/a/a/3100/selectTracseDetl.do?crseTracseSe=C0061&tracseId=AIG20250000534328&tracseTme=4&trainstCstmrId=500020042738',supports:'영상편집 NCS 분류와 현재 훈련과정 예시. 특정 기관 추천이 아니라 검색·비교용 자료',checkedAt:'2026-08-20'},
        {publisher:'한국콘텐츠진흥원',title:'방송영상 표준계약서 확인',url:'https://www.kocca.kr/kocca/subPage.do?menuNo=205068',supports:'방송영상 제작스태프 근로·업무위탁·하도급 표준계약서 목록. 개별 영상편집 외주에 그대로 적용하기보다 계약 항목 참고용',checkedAt:'2026-08-20'},
        {publisher:'국세청',title:'인적용역 사업소득·종합소득세 확인',url:'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238978&mi=4048',supports:'3.3% 원천징수 인적용역 사업소득의 종합소득세 신고 안내',checkedAt:'2026-08-20'},
        {publisher:'한국저작권위원회',title:'음원·폰트 이용허락 확인',url:'https://www.copyright.or.kr/customer-center/faq/list.do?counselfaqno=47490&searchcounselfaqno=47490',supports:'음악 저작물의 권리자·관리단체 이용허락 절차와 저작권 상담 자료',checkedAt:'2026-08-20'},
        {publisher:'크몽',title:'판매 이용약관 확인',url:'https://support.kmong.com/hc/ko/articles/54621478243353-%ED%8C%90%EB%A7%A4-%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80-2026-02-05-ver',supports:'전문가 회원의 권리·의무와 플랫폼 판매 조건',checkedAt:'2026-08-20'}
      ]
    };
    resources.evidence=[
      {id:'adobe-premiere-20260820',title:'전문 영상 편집 소프트웨어 | Adobe Premiere',publisher:'Adobe',url:'https://www.adobe.com/kr/products/premiere.html',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[0]']},
      {id:'blackmagic-davinci-20260820',title:'DaVinci Resolve | Blackmagic Design',publisher:'Blackmagic Design',url:'https://www.blackmagicdesign.com/kr/products/davinciresolve',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[1]']},
      {id:'work24-video-training-20260820',title:'국민내일배움카드 훈련과정상세',publisher:'고용24',url:'https://www.work24.go.kr/hr/a/a/3100/selectTracseDetl.do?crseTracseSe=C0061&tracseId=AIG20250000534328&tracseTme=4&trainstCstmrId=500020042738',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[2]']},
      {id:'kocca-standard-contracts-20260820',title:'표준계약서',publisher:'한국콘텐츠진흥원',url:'https://www.kocca.kr/kocca/subPage.do?menuNo=205068',publishedAt:'2021-10-27',checkedAt:'2026-08-20',supports:['content.items[3]']},
      {id:'nts-income-tax-personal-service-20260820',title:'종합소득세 신고 안내',publisher:'국세청',url:'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238978&mi=4048',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[4]']},
      {id:'copyright-music-permission-20260820',title:'음악 저작물 이용허락 FAQ',publisher:'한국저작권위원회',url:'https://www.copyright.or.kr/customer-center/faq/list.do?counselfaqno=47490&searchcounselfaqno=47490',publishedAt:'2016-11-16',checkedAt:'2026-08-20',supports:['content.items[5]']},
      {id:'kmong-seller-terms-20260205',title:'판매 이용약관 2026. 02. 05. ver.',publisher:'크몽',url:'https://support.kmong.com/hc/ko/articles/54621478243353-%ED%8C%90%EB%A7%A4-%EC%9D%B4%EC%9A%A9%EC%95%BD%EA%B4%80-2026-02-05-ver',publishedAt:'2026-02-05',checkedAt:'2026-08-20',supports:['content.items[6]']}
    ];
    resources.aiPolicy={...verified};
  }
})();
