(function(){
  window.__PLATFORM_UI_CAPABILITY_MANIFEST={
    version:1,
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
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'stickyMode',label:'고정 방식',type:'enum',default:'deferred-sticky',options:['deferred-sticky','sticky','static']},
          {id:'chipFamily',label:'메뉴칩',type:'enum',default:'ios-liquid',options:['material-flat','ios-flat','ios-liquid']},
          {id:'accentColor',label:'강조 색상',type:'color',default:'#315fc9'},
          {id:'progressEnabled',label:'진행선',type:'boolean',default:true},
          {id:'progressColor',label:'진행선 색상',type:'color',default:'#315fc9'},
          {id:'progressThickness',label:'진행선 두께',type:'range',default:2,min:1,max:6,step:1},
          {id:'runway',label:'좌우 여백',type:'range',default:18,min:8,max:48,step:2}
        ],
        presets:[
          {id:'photo-topnav-blue-progress',name:'사진 상단 메뉴 · 파란 진행선',config:{enabled:true,stickyMode:'deferred-sticky',chipFamily:'ios-liquid',accentColor:'#315fc9',progressEnabled:true,progressColor:'#315fc9',progressThickness:2,runway:18}}
        ]
      },
      {
        id:'horizontal-card-rail',
        label:'가로 카드 rail',
        category:'content-motion',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/desktop/rail-drag.js'],
        controls:[
          {id:'desktopDrag',label:'PC 마우스 드래그',type:'boolean',default:true},
          {id:'nativeTouch',label:'모바일 기본 스크롤',type:'boolean',default:true,locked:true},
          {id:'fadeEdges',label:'가장자리 fade',type:'enum',default:'both',options:['none','left','right','both']},
          {id:'fadeWidth',label:'fade 너비',type:'range',default:28,min:0,max:80,step:2},
          {id:'fadeStrength',label:'fade 강도',type:'range',default:90,min:0,max:100,step:5},
          {id:'scrollbar',label:'스크롤바',type:'enum',default:'hidden',options:['hidden','auto']},
          {id:'runwayLeft',label:'왼쪽 시작 여백',type:'range',default:20,min:0,max:64,step:2},
          {id:'runwayRight',label:'오른쪽 끝 여백',type:'range',default:20,min:0,max:64,step:2},
          {id:'shadowGuard',label:'카드 그림자 보호',type:'boolean',default:true}
        ],
        presets:[
          {id:'photo-rail-balanced-fade',name:'사진 카드 rail · 양쪽 fade',config:{desktopDrag:true,nativeTouch:true,fadeEdges:'both',fadeWidth:28,fadeStrength:90,scrollbar:'hidden',runwayLeft:20,runwayRight:20,shadowGuard:true}}
        ]
      },
      {
        id:'filter-chip-rail',
        label:'범용 필터칩',
        category:'selector',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/ui/liquid-controller.js'],
        controls:[
          {id:'family',label:'스타일',type:'enum',default:'ios-liquid',options:['material-flat','ios-flat','ios-liquid']},
          {id:'accentColor',label:'선택 색상',type:'color',default:'#315fc9'},
          {id:'surfaceOpacity',label:'표면 투명도',type:'range',default:78,min:20,max:100,step:2},
          {id:'blur',label:'블러',type:'range',default:18,min:0,max:36,step:2},
          {id:'response',label:'반응 속도',type:'enum',default:'standard',options:['calm','standard','lively']},
          {id:'overshoot',label:'튕김',type:'enum',default:'medium',options:['none','low','medium','high']},
          {id:'gap',label:'칩 간격',type:'range',default:8,min:2,max:20,step:1},
          {id:'runway',label:'좌우 여백',type:'range',default:14,min:4,max:40,step:2}
        ],
        presets:[
          {id:'ios-liquid-standard',name:'iOS Liquid 필터 · 기본 spring',config:{family:'ios-liquid',accentColor:'#315fc9',surfaceOpacity:78,blur:18,response:'standard',overshoot:'medium',gap:8,runway:14}},
          {id:'material-flat-neutral',name:'Material Flat 필터 · 중립형',config:{family:'material-flat',accentColor:'#315fc9',surfaceOpacity:100,blur:0,response:'calm',overshoot:'none',gap:8,runway:14}}
        ]
      },
      {
        id:'collection-bottom-sheet',
        label:'하단 팝업',
        category:'overlay',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/collection/collection-hub.js','assets/js/collection/bulk-selection.js'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'backdrop',label:'배경 가림',type:'boolean',default:true},
          {id:'backdropBlur',label:'배경 블러',type:'range',default:10,min:0,max:30,step:1},
          {id:'handle',label:'상단 핸들',type:'boolean',default:true},
          {id:'tabs',label:'기본 탭',type:'boolean',default:true},
          {id:'search',label:'검색',type:'boolean',default:true},
          {id:'filters',label:'필터',type:'boolean',default:true},
          {id:'bulkSelection',label:'여러 항목 선택',type:'boolean',default:true},
          {id:'themeSelector',label:'테마 선택',type:'boolean',default:true},
          {id:'deviceHandoff',label:'다른 기기 연결',type:'boolean',default:true}
        ],
        presets:[
          {id:'photo-collection-full',name:'사진 하단 팝업 · 전체 기능',config:{enabled:true,backdrop:true,backdropBlur:10,handle:true,tabs:true,search:true,filters:true,bulkSelection:true,themeSelector:true,deviceHandoff:true}}
        ]
      },
      {
        id:'device-handoff-accordion',
        label:'다른 기기 연결 아코디언',
        category:'interaction',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/collection/device-handoff.js'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'heightMode',label:'높이 계산',type:'enum',default:'measured',options:['measured'],locked:true},
          {id:'response',label:'열림 반응',type:'enum',default:'standard',options:['calm','standard','lively']},
          {id:'copyAction',label:'코드 복사',type:'boolean',default:true},
          {id:'connectAction',label:'코드 연결',type:'boolean',default:true},
          {id:'statusMessage',label:'상태 문구',type:'boolean',default:true}
        ],
        presets:[
          {id:'photo-device-handoff',name:'사진 다른 기기 연결 · measured accordion',config:{enabled:true,heightMode:'measured',response:'standard',copyAction:true,connectAction:true,statusMessage:true}}
        ]
      },
      {
        id:'reading-progress',
        label:'읽기 진행선',
        category:'status',
        status:'candidate',
        source:'photography-extracted',
        owners:['assets/js/navigation/chapter-navigation.js','assets/styles/navigation/chapter-progress.css'],
        controls:[
          {id:'enabled',label:'사용',type:'boolean',default:true},
          {id:'color',label:'색상',type:'color',default:'#315fc9'},
          {id:'thickness',label:'두께',type:'range',default:2,min:1,max:6,step:1},
          {id:'opacity',label:'투명도',type:'range',default:100,min:20,max:100,step:5}
        ],
        presets:[
          {id:'photo-progress-blue',name:'사진 진행선 · 기본 파랑',config:{enabled:true,color:'#315fc9',thickness:2,opacity:100}}
        ]
      },
      {
        id:'floating-action',
        label:'플로팅 액션',
        category:'action',
        status:'candidate',
        source:'platform',
        owners:[],
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
