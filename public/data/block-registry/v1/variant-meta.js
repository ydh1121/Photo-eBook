(function(){
  window.__PLATFORM_BLOCK_VARIANT_META={
    version:2,
    kinds:['structure','visual','behavior','responsive'],
    maturity:['implemented','partial','placeholder'],
    blocks:{
      hero:{
        'image-metrics':{kind:'structure',maturity:'implemented',summary:'이미지 위에 설명과 핵심 지표를 함께 표시'},
        'immersive-metrics':{kind:'structure',maturity:'implemented',summary:'큰 배경 이미지와 하단 내러티브, 2열 핵심 지표를 결합한 몰입형'},
        minimal:{kind:'structure',maturity:'implemented',summary:'핵심 지표를 빼고 제목과 설명만 강조'}
      },
      'chapter-hero':{
        image:{kind:'structure',maturity:'implemented',summary:'큰 이미지와 설명을 분리된 영역에 함께 배치'},
        'image-overlay':{kind:'structure',maturity:'implemented',summary:'한 장의 큰 이미지 위에 index·제목·설명을 겹쳐 표시'},
        compact:{kind:'responsive',maturity:'implemented',summary:'이미지를 생략한 짧은 전환형'}
      },
      'section-heading':{
        default:{kind:'visual',maturity:'implemented',summary:'기본 제목·설명 위계'},
        compact:{kind:'visual',maturity:'implemented',summary:'여백과 제목 크기를 줄인 압축형'}
      },
      'rich-text':{
        default:{kind:'visual',maturity:'implemented',summary:'일반 본문'},
        lead:{kind:'visual',maturity:'implemented',summary:'첫 문단을 더 크게 보여주는 리드형'}
      },
      process:{
        sequence:{kind:'structure',maturity:'implemented',summary:'순서가 있는 단계형'},
        ranking:{kind:'visual',maturity:'partial',summary:'순위 의미를 강조하지만 구조 차이는 아직 작음'}
      },
      'metric-grid':{
        default:{kind:'visual',maturity:'implemented',summary:'동일 위계의 수치 묶음'},
        emphasis:{kind:'visual',maturity:'implemented',summary:'첫 수치를 강조'}
      },
      'offer-rail':{
        cards:{kind:'structure',maturity:'implemented',summary:'가로 비교 카드'},
        compact:{kind:'visual',maturity:'partial',summary:'카드 폭을 줄인 압축형'}
      },
      notice:{
        info:{kind:'visual',maturity:'implemented',summary:'일반 안내'},
        key:{kind:'visual',maturity:'implemented',summary:'핵심 기준 강조'},
        warning:{kind:'visual',maturity:'implemented',summary:'주의·확인 필요 상태'}
      },
      'comparison-cards':{
        generic:{kind:'structure',maturity:'implemented',summary:'일반 비교 카드'},
        scored:{kind:'visual',maturity:'partial',summary:'순위와 평가 지표를 강조하는 비교형. photography 교육 카드 기준으로 추가 정제 필요'},
        market:{kind:'visual',maturity:'partial',summary:'기존 시장 비교형 후보. visual-metrics와 역할 중복 여부를 검토'},
        'visual-metrics':{kind:'structure',maturity:'implemented',summary:'이미지·순위·2~3개 핵심 지표·보조 메타를 같은 순서로 읽는 비주얼 비교형'}
      },
      checklist:{
        numbered:{kind:'visual',maturity:'implemented',summary:'번호형 점검 목록'},
        checkable:{kind:'behavior',maturity:'partial',summary:'체크 affordance를 보이지만 저장 동작은 아직 미연결'}
      },
      'media-rail':{
        skill:{kind:'visual',maturity:'partial',summary:'기술·작업 예시 중심'},
        video:{kind:'visual',maturity:'partial',summary:'영상 중심 후보. 현재 구조 차이가 작음'},
        mixed:{kind:'structure',maturity:'placeholder',summary:'혼합 미디어 후보. 추가 설계 필요'}
      },
      'case-study-rail':{
        project:{kind:'structure',maturity:'implemented',summary:'프로젝트 과정·결과를 함께 표시'},
        compact:{kind:'visual',maturity:'partial',summary:'간결한 사례형 후보'}
      },
      'product-tool':{
        rail:{kind:'structure',maturity:'implemented',summary:'가로 카드형'},
        list:{kind:'structure',maturity:'implemented',summary:'세로 목록형. 이미지가 없으면 전체폭'},
        detail:{kind:'structure',maturity:'implemented',summary:'상세 비교용 카드형'}
      },
      roadmap:{
        phases:{kind:'structure',maturity:'implemented',summary:'연결된 단계형 진행 구조'},
        'metric-cards':{kind:'structure',maturity:'implemented',summary:'기간별 대표 수치와 보조 지표를 독립 카드로 빠르게 비교'},
        compact:{kind:'visual',maturity:'partial',summary:'압축형 후보. 추가 차별화 필요'}
      },
      'script-copy':{
        messages:{kind:'structure',maturity:'implemented',summary:'상황과 복사 문구를 함께 표시'},
        compact:{kind:'visual',maturity:'partial',summary:'짧은 문구 중심 후보'}
      },
      tutorial:{
        'preview-rail':{kind:'structure',maturity:'implemented',summary:'여러 실습을 가로로 훑는 미리보기'},
        'preset-rail':{kind:'structure',maturity:'implemented',summary:'설정값·recipe형 빠른 참조'},
        detail:{kind:'structure',maturity:'implemented',summary:'과정·설명·미션을 한 화면에 보여주는 상세형'}
      },
      resources:{
        'curated-rail':{kind:'structure',maturity:'implemented',summary:'추천 자료 가로 카드'},
        'official-list':{kind:'structure',maturity:'implemented',summary:'근거·공식 링크 목록'}
      },
      faq:{
        accordion:{kind:'behavior',maturity:'implemented',summary:'기본 접힘형'},
        'open-first':{kind:'behavior',maturity:'implemented',summary:'첫 항목을 처음부터 펼침'}
      },
      'pros-cons':{
        split:{kind:'responsive',maturity:'implemented',summary:'PC 2열, 모바일 1열'},
        stacked:{kind:'structure',maturity:'partial',summary:'항상 세로형으로 쓰기 위한 후보'}
      },
      'comparison-table':{
        default:{kind:'visual',maturity:'implemented',summary:'일반 비교표'},
        compact:{kind:'visual',maturity:'partial',summary:'밀도를 높인 표 후보'}
      },
      timeline:{
        vertical:{kind:'structure',maturity:'implemented',summary:'세로 시간축'},
        compact:{kind:'visual',maturity:'implemented',summary:'항목 간격을 줄인 시간축'}
      },
      'image-copy-split':{
        'image-left':{kind:'responsive',maturity:'implemented',summary:'PC 이미지 왼쪽. 모바일에서는 이미지 위로 통합'},
        'image-right':{kind:'responsive',maturity:'implemented',summary:'PC 이미지 오른쪽. 모바일에서는 이미지 위로 통합'},
        editorial:{kind:'structure',maturity:'implemented',summary:'PC에서 이미지 비중을 더 크게 둔 편집형. 모바일 1열'}
      },
      gallery:{
        grid:{kind:'structure',maturity:'implemented',summary:'PC 2열, 모바일 1열 grid'},
        strip:{kind:'structure',maturity:'implemented',summary:'가로 스크롤 strip'}
      },
      'quote-expert':{
        quote:{kind:'visual',maturity:'implemented',summary:'큰 인용 중심'},
        comment:{kind:'visual',maturity:'implemented',summary:'본문형 크기의 코멘트'}
      },
      calculator:{
        multiply:{kind:'behavior',maturity:'implemented',summary:'입력값을 곱하는 계산'},
        sum:{kind:'behavior',maturity:'implemented',summary:'입력값을 더하는 계산'}
      },
      cta:{
        band:{kind:'visual',maturity:'implemented',summary:'배경 surface가 있는 행동 영역'},
        minimal:{kind:'visual',maturity:'implemented',summary:'배경 강조를 줄인 행동 영역'}
      },
      'service-list':{
        rows:{kind:'structure',maturity:'implemented',summary:'설명과 메타를 좌우로 나눈 row. 모바일 1열'},
        compact:{kind:'visual',maturity:'partial',summary:'밀도를 줄인 목록 후보'}
      }
    }
  };
})();
