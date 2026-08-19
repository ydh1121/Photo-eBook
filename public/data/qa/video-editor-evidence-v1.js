(function(){
  const draft=window.__VIDEO_EDITOR_QA_DRAFT;
  if(!draft||!Array.isArray(draft.blocks))return;
  const byId=new Map(draft.blocks.map(block=>[block.id,block]));

  const tools=byId.get('ve_tools');
  if(tools){
    tools.content={
      title:'편집 프로그램은 작업 범위와 비용 구조를 같이 보고 고릅니다',
      description:'처음에는 기능을 전부 비교하기보다 내가 만들 결과물에 필요한 기능, 파일 호환, 비용 구조를 확인합니다. 가격은 2026년 8월 20일 공식 페이지 확인 기준이며 변동될 수 있습니다.',
      items:[
        {kind:'구독형 편집 프로그램',title:'Adobe Premiere',price:'월 30,800원',description:'Adobe 한국 공식 페이지에서 연간 약정·월 청구 개인 Premiere 플랜이 월 30,800원(부가세 포함)으로 표시됩니다. 편집, 타이틀 애니메이션, 효과, 사운드 믹싱 기능과 Adobe Express Premium, Frame.io, 100GB 스토리지 등이 포함됩니다.',tags:['구독형','Frame.io','100GB'],source:'Adobe 공식 · 2026-08-20 확인'},
        {kind:'무료로 시작 가능',title:'DaVinci Resolve 21',price:'무료 버전 제공',description:'Blackmagic Design 공식 페이지에서 편집, 색보정, VFX, 모션 그래픽, 오디오 후반 작업을 하나의 앱에서 다룰 수 있는 무료 버전을 제공합니다. Studio 가격은 공식 페이지의 최근 표시가 서로 달라 발행 직전에 다시 확인합니다.',tags:['무료 버전','편집·색보정','오디오'],source:'Blackmagic Design 공식 · 2026-08-20 확인'},
        {kind:'파일·소스 관리',title:'저장과 라이선스 기록',description:'원본, 프로젝트 파일, 최종본을 구분해 저장하고 음원·폰트·그래픽의 상업적 사용 범위를 확인한 기록을 남깁니다.',tags:['백업','파일 전달','사용 권한'],source:'사용 서비스별 공식 약관 확인 필요'}
      ]
    };
    tools.evidence=[
      {id:'adobe-premiere-20260820',title:'전문 영상 편집 소프트웨어 | Adobe Premiere',publisher:'Adobe',url:'https://www.adobe.com/kr/products/premiere.html',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[0].price','content.items[0].description']},
      {id:'blackmagic-davinci-20260820',title:'DaVinci Resolve | Blackmagic Design',publisher:'Blackmagic Design',url:'https://www.blackmagicdesign.com/kr/products/davinciresolve',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[1].price','content.items[1].description']}
    ];
  }

  const resources=byId.get('ve_resources');
  if(resources){
    resources.content={
      title:'기능과 교육 정보는 공식 자료에서 다시 확인합니다',
      description:'프로그램 가격, 기능, 직업훈련 정보는 바뀔 수 있습니다. 발행 전 확인일을 갱신하고 실제 조건이 달라졌는지 다시 봅니다.',
      items:[
        {publisher:'Adobe',title:'Premiere 기능·개인 플랜 확인',url:'https://www.adobe.com/kr/products/premiere.html',supports:'Premiere 기능과 현재 개인 플랜 가격',checkedAt:'2026-08-20'},
        {publisher:'Blackmagic Design',title:'DaVinci Resolve 무료·Studio 안내',url:'https://www.blackmagicdesign.com/kr/products/davinciresolve',supports:'무료 버전 제공 여부와 기능 범위',checkedAt:'2026-08-20'},
        {publisher:'고용24',title:'영상편집 직업훈련 과정 확인',url:'https://www.work24.go.kr/hr/a/a/3100/selectTracseDetl.do?crseTracseSe=C0061&tracseId=AIG20250000534328&tracseTme=4&trainstCstmrId=500020042738',supports:'영상편집 NCS 분류와 현재 훈련과정 예시. 특정 기관 추천이 아니라 검색·비교용 자료',checkedAt:'2026-08-20'}
      ]
    };
    resources.evidence=[
      {id:'adobe-premiere-20260820',title:'전문 영상 편집 소프트웨어 | Adobe Premiere',publisher:'Adobe',url:'https://www.adobe.com/kr/products/premiere.html',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[0]']},
      {id:'blackmagic-davinci-20260820',title:'DaVinci Resolve | Blackmagic Design',publisher:'Blackmagic Design',url:'https://www.blackmagicdesign.com/kr/products/davinciresolve',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[1]']},
      {id:'work24-video-training-20260820',title:'국민내일배움카드 훈련과정상세',publisher:'고용24',url:'https://www.work24.go.kr/hr/a/a/3100/selectTracseDetl.do?crseTracseSe=C0061&tracseId=AIG20250000534328&tracseTme=4&trainstCstmrId=500020042738',publishedAt:null,checkedAt:'2026-08-20',supports:['content.items[2]']}
    ];
  }
})();
