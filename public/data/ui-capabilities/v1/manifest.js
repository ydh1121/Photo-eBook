(function(){
  window.__PLATFORM_UI_CAPABILITY_MANIFEST={
    version:2,
    generatedAt:'2026-08-20',
    capabilities:[
      {
        id:'top-chapter-navigation',
        label:'상단 고정 메뉴',
        category:'navigation',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/navigation/chapter-navigation.js','assets/js/ui/liquid-controller.js','assets/js/safari/deferred-sticky-nav.js'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true,group:'basic'},
          {id:'stickyMode',label:'고정 방식',type:'enum',default:'deferred-sticky',options:['deferred-sticky','sticky','static'],group:'basic'},
          {id:'chipFamily',label:'메뉴칩',type:'enum',default:'ios-liquid',options:['material-flat','ios-flat','ios-liquid'],group:'basic'},
          {id:'accentColor',label:'강조 색상',type:'color',default:'#437ce7',group:'basic'},
          {id:'progressEnabled',label:'진행 표시',type:'boolean',default:true,group:'basic'},
          {id:'progressMode',label:'진행 표시 방식',type:'enum',default:'chapter-wash',options:['chapter-wash','line'],group:'basic'},
          {id:'progressColor',label:'진행 표시 색상',type:'color',default:'#4081ef',group:'basic'},
          {id:'progressOpacityStart',label:'진행 표시 시작 농도',type:'range',default:24,min:0,max:60,step:1,group:'advanced'},
          {id:'progressOpacityEnd',label:'진행 표시 끝 농도',type:'range',default:16,min:0,max:60,step:1,group:'advanced'},
          {id:'mobileChipGap',label:'모바일 칩 간격',type:'range',default:6,min:2,max:18,step:1,group:'advanced'},
          {id:'desktopChipGap',label:'PC 칩 간격',type:'range',default:9,min:2,max:20,step:1,group:'advanced'},
          {id:'railInset',label:'메뉴 안쪽 여백',type:'range',default:5.5,min:2,max:20,step:.5,group:'advanced'},
          {id:'response',label:'이동 반응',type:'enum',default:'standard',options:['calm','standard','lively'],group:'motion'},
          {id:'overshoot',label:'튕김',type:'enum',default:'high',options:['none','low','medium','high'],group:'motion'},
          {id:'durationScale',label:'이동 시간 배율',type:'range',default:1.1,min:.6,max:1.5,step:.05,group:'motion'},
          {id:'safariSafety',label:'Safari 안전 동작',type:'boolean',default:true,locked:true,group:'safety'}
        ],
        presets:[
          {id:'photo-topnav-blue-progress',name:'사진 상단 메뉴 · 리퀴드 + 진행 배경',source:'photography-extracted',status:'draft',config:{enabled:true,stickyMode:'deferred-sticky',chipFamily:'ios-liquid',accentColor:'#437ce7',progressEnabled:true,progressMode:'chapter-wash',progressColor:'#4081ef',progressOpacityStart:24,progressOpacityEnd:16,mobileChipGap:6,desktopChipGap:9,railInset:5.5,response:'standard',overshoot:'high',durationScale:1.1,safariSafety:true}}
        ]
      },
      {
        id:'horizontal-card-rail',
        label:'가로 카드 스크롤',
        category:'content-motion',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/desktop/rail-drag.js','assets/styles/desktop/nav-rails.css','assets/styles/desktop/rail-fade.css'],
        controls:[
          {id:'nativeTouch',label:'모바일 기본 스크롤',type:'boolean',default:true,locked:true,group:'input'},
          {id:'desktopDrag',label:'PC 마우스 드래그',type:'boolean',default:true,group:'input'},
          {id:'leftShadowGuard',label:'왼쪽 카드 그림자 보호',type:'boolean',default:true,group:'left-edge'},
          {id:'leftPaintRunway',label:'왼쪽 그림자 여백',type:'range',default:16,min:0,max:64,step:1,group:'left-edge'},
          {id:'leftFade',label:'왼쪽 페이드',type:'boolean',default:false,group:'left-edge'},
          {id:'rightFade',label:'오른쪽 페이드',type:'boolean',default:true,group:'right-edge'},
          {id:'rightFadeMode',label:'오른쪽 페이드 방식',type:'enum',default:'alpha-mask',options:['alpha-mask'],locked:true,group:'right-edge'},
          {id:'rightFadeWidth',label:'오른쪽 페이드 너비',type:'range',default:112,min:0,max:180,step:2,group:'right-edge'},
          {id:'rightContentPadding',label:'오른쪽 끝 여백',type:'range',default:122,min:0,max:180,step:2,group:'right-edge'},
          {id:'scrollbar',label:'스크롤바',type:'enum',default:'hidden',options:['hidden','auto'],group:'visibility'},
          {id:'dragThreshold',label:'드래그 시작 거리',type:'range',default:5,min:2,max:16,step:1,unit:'px',group:'advanced'},
          {id:'clickSuppressMs',label:'드래그 후 클릭 억제',type:'range',default:220,min:0,max:500,step:10,unit:'ms',group:'advanced'}
        ],
        presets:[
          {id:'photo-rail-balanced-fade',name:'사진 카드 스크롤 · 그림자 보호 + 오른쪽 페이드',source:'photography-extracted',status:'draft',config:{nativeTouch:true,desktopDrag:true,leftShadowGuard:true,leftPaintRunway:16,leftFade:false,rightFade:true,rightFadeMode:'alpha-mask',rightFadeWidth:112,rightContentPadding:122,scrollbar:'hidden',dragThreshold:5,clickSuppressMs:220}}
        ]
      },
      {
        id:'filter-chip-rail',
        label:'범용 필터칩',
        category:'selector',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/ui/liquid-controller.js','assets/styles/collection/hub.css','assets/styles/ui/pill-hierarchy.css'],
        controls:[
          {id:'family',label:'스타일',type:'enum',default:'ios-flat',options:['material-flat','ios-flat','ios-liquid']},
          {id:'accentColor',label:'선택 색상',type:'color',default:'#202226'},
          {id:'surfaceOpacity',label:'표면 투명도',type:'range',default:100,min:20,max:100,step:2},
          {id:'blur',label:'블러',type:'range',default:0,min:0,max:36,step:2},
          {id:'response',label:'반응 속도',type:'enum',default:'calm',options:['calm','standard','lively']},
          {id:'overshoot',label:'튕김',type:'enum',default:'none',options:['none','low','medium','high']},
          {id:'gap',label:'칩 간격',type:'range',default:7,min:2,max:20,step:1},
          {id:'runway',label:'좌우 여백',type:'range',default:0,min:0,max:40,step:2}
        ],
        presets:[
          {id:'photo-collection-filter-flat',name:'사진 하단 필터 · iOS 플랫',source:'photography-extracted',status:'draft',config:{family:'ios-flat',accentColor:'#202226',surfaceOpacity:100,blur:0,response:'calm',overshoot:'none',gap:7,runway:0}},
          {id:'ios-liquid-standard',name:'iOS 리퀴드 필터 · 기본 탄성',source:'system',status:'draft',config:{family:'ios-liquid',accentColor:'#315fc9',surfaceOpacity:78,blur:18,response:'standard',overshoot:'medium',gap:8,runway:14}},
          {id:'material-flat-neutral',name:'Material 플랫 필터 · 중립형',source:'system',status:'draft',config:{family:'material-flat',accentColor:'#315fc9',surfaceOpacity:100,blur:0,response:'calm',overshoot:'none',gap:8,runway:14}}
        ]
      },
      {
        id:'collection-bottom-sheet',
        label:'하단 팝업',
        category:'overlay',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/collection/collection-hub.js','assets/js/collection/bulk-selection.js','assets/styles/collection/hub.css'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'backdrop',label:'배경 가림',type:'boolean',default:true},
          {id:'backdropBlur',label:'배경 블러',type:'range',default:12,min:0,max:30,step:1},
          {id:'sheetBlur',label:'팝업 블러',type:'range',default:26,min:0,max:40,step:1},
          {id:'sheetSaturation',label:'팝업 채도',type:'range',default:135,min:80,max:180,step:5},
          {id:'maxWidth',label:'최대 너비',type:'range',default:760,min:360,max:1000,step:20,unit:'px'},
          {id:'maxHeightDvh',label:'최대 화면 높이',type:'range',default:84,min:50,max:96,step:1,unit:'dvh'},
          {id:'radiusTop',label:'상단 모서리',type:'range',default:30,min:0,max:44,step:2},
          {id:'handle',label:'상단 핸들',type:'boolean',default:true},
          {id:'tabs',label:'기본 탭',type:'boolean',default:true},
          {id:'search',label:'검색',type:'boolean',default:true},
          {id:'filters',label:'필터',type:'boolean',default:true},
          {id:'bulkSelection',label:'여러 항목 선택',type:'boolean',default:true},
          {id:'themeSelector',label:'테마 선택',type:'boolean',default:true},
          {id:'deviceHandoff',label:'다른 기기 연결',type:'boolean',default:true}
        ],
        presets:[
          {id:'photo-collection-full',name:'사진 하단 팝업 · 전체 기능',source:'photography-extracted',status:'draft',config:{enabled:true,backdrop:true,backdropBlur:12,sheetBlur:26,sheetSaturation:135,maxWidth:760,maxHeightDvh:84,radiusTop:30,handle:true,tabs:true,search:true,filters:true,bulkSelection:true,themeSelector:true,deviceHandoff:true}}
        ]
      },
      {
        id:'device-handoff-accordion',
        label:'다른 기기 연결 아코디언',
        category:'interaction',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/collection/device-handoff.js','assets/styles/collection/device-accordion.css'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'heightMode',label:'높이 계산',type:'enum',default:'measured',options:['measured'],locked:true},
          {id:'response',label:'열림 반응',type:'enum',default:'standard',options:['calm','standard','lively']},
          {id:'copyAction',label:'코드 복사',type:'boolean',default:true},
          {id:'connectAction',label:'코드 연결',type:'boolean',default:true},
          {id:'statusMessage',label:'상태 문구',type:'boolean',default:true}
        ],
        presets:[
          {id:'photo-device-handoff',name:'사진 다른 기기 연결 · 자동 높이 아코디언',source:'photography-extracted',status:'draft',config:{enabled:true,heightMode:'measured',response:'standard',copyAction:true,connectAction:true,statusMessage:true}}
        ]
      },
      {
        id:'reading-progress',
        label:'읽기 진행선',
        category:'status',
        status:'candidate',
        source:'platform',
        owners:['assets/js/navigation/chapter-navigation.js','assets/styles/navigation/chapter-progress.css'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'color',label:'색상',type:'color',default:'#4081ef'},
          {id:'thickness',label:'두께',type:'range',default:2,min:1,max:6,step:1},
          {id:'opacity',label:'투명도',type:'range',default:100,min:20,max:100,step:5}
        ],
        presets:[
          {id:'photo-progress-blue',name:'사진 진행선 · 기본 파랑',source:'photography-extracted',status:'draft',config:{enabled:true,color:'#4081ef',thickness:2,opacity:100}}
        ]
      },
      {
        id:'floating-action',
        label:'플로팅 액션',
        category:'action',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/collection/collection-hub.js','assets/styles/collection/hub.css'],
        controls:[
          {id:'family',label:'표현',type:'enum',default:'glass',options:['flat','glass','liquid']},
          {id:'accentColor',label:'강조 색상',type:'color',default:'#315fc9'},
          {id:'response',label:'반응 속도',type:'enum',default:'standard',options:['calm','standard','lively']},
          {id:'overshoot',label:'튕김',type:'enum',default:'low',options:['none','low','medium','high']}
        ],
        presets:[]
      }
    ]
  };
})();
