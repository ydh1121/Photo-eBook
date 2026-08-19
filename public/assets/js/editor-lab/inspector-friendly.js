(function(){
  const inspector=document.querySelector('#editorInspector');
  if(!inspector)return;

  const PROFILES={
    hero:{name:'첫 화면',hint:'페이지의 주제와 핵심 정보를 가장 먼저 보여주는 영역입니다.',paths:['content.eyebrow','content.title','content.description','content.image','content.imageAlt']},
    'chapter-hero':{name:'챕터 시작',hint:'큰 주제가 바뀌는 지점에서 제목과 대표 이미지를 보여줍니다.',paths:['content.index','content.eyebrow','content.title','content.description','content.image','content.imageAlt']},
    'section-heading':{name:'섹션 제목',hint:'아래 콘텐츠가 무엇을 설명하는지 짧게 안내합니다.',paths:['content.eyebrow','content.title','content.description']},
    'rich-text':{name:'본문',hint:'설명이 필요한 내용을 문단으로 읽히게 구성합니다.',paths:['content.title']},
    process:{name:'과정 / 순서',hint:'여러 행동을 순서대로 따라갈 수 있게 보여줍니다.',paths:['content.title','content.description','content.note']},
    'metric-grid':{name:'핵심 수치',hint:'비교하거나 기억해야 할 숫자를 같은 기준으로 정리합니다.',paths:['content.title','content.description']},
    'offer-rail':{name:'상품 / 가격',hint:'여러 상품이나 가격 구성을 가로로 비교합니다.',paths:['content.title','content.description']},
    notice:{name:'안내 / 주의',hint:'본문 흐름에서 놓치면 안 되는 정보를 따로 강조합니다.',paths:['content.label','content.title','content.description','content.action']},
    'comparison-cards':{name:'카드 비교',hint:'선택지마다 같은 기준을 반복해 비교할 때 사용합니다.',paths:['content.title','content.description']},
    checklist:{name:'체크리스트',hint:'확인해야 할 항목을 빠르게 훑을 수 있게 정리합니다.',paths:['content.title','content.description']},
    'media-rail':{name:'이미지 콘텐츠',hint:'이미지와 짧은 설명을 여러 장 이어서 보여줍니다.',paths:['content.title','content.description']},
    'case-study-rail':{name:'사례',hint:'실제 사례와 자체 기획 사례의 과정과 결과물을 설명합니다.',paths:['content.title','content.description']},
    'product-tool':{name:'도구 / 제품',hint:'장비, 소프트웨어, 재료처럼 선택이 필요한 도구를 정리합니다.',paths:['content.title','content.description']},
    roadmap:{name:'로드맵',hint:'기간이나 단계별 목표를 한 흐름으로 보여줍니다.',paths:['content.title','content.description']},
    'script-copy':{name:'복사 문구',hint:'사용자가 바로 수정해 쓸 수 있는 메시지나 문구를 제공합니다.',paths:['content.title','content.description']},
    tutorial:{name:'실습 / 튜토리얼',hint:'직접 따라 하며 결과를 확인하는 학습 흐름입니다.',paths:['content.eyebrow','content.title','content.description','content.image','content.imageAlt','content.mission']},
    resources:{name:'출처 / 자료',hint:'공식 자료와 추가 읽을거리를 구분해서 보여줍니다.',paths:['content.title','content.description']},
    faq:{name:'자주 묻는 질문',hint:'질문을 눌러 답변을 확인하는 구조입니다.',paths:['content.title','content.description']},
    'pros-cons':{name:'장점과 주의점',hint:'한 선택의 장점과 부담을 나란히 비교합니다.',paths:['content.title','content.description','content.proLabel','content.conLabel']},
    'comparison-table':{name:'비교표',hint:'많은 선택지를 같은 열 기준으로 정확하게 비교합니다.',paths:['content.title','content.description','content.note']},
    timeline:{name:'타임라인',hint:'시간 순서로 사건이나 진행 단계를 설명합니다.',paths:['content.title','content.description']},
    'image-copy-split':{name:'이미지 + 설명',hint:'한 장의 이미지와 핵심 설명을 함께 보여줍니다.',paths:['content.eyebrow','content.title','content.description','content.image','content.imageAlt','content.actionLabel','content.actionUrl']},
    gallery:{name:'갤러리',hint:'여러 이미지를 한 묶음으로 보여줍니다.',paths:['content.title','content.description']},
    'quote-expert':{name:'인용 / 전문가 의견',hint:'인용 내용과 발언자의 정보를 함께 표시합니다.',paths:['content.quote','content.name','content.role','content.source','content.avatar']},
    calculator:{name:'계산 / 시뮬레이션',hint:'사용자가 값을 입력해 결과를 직접 계산합니다.',paths:['content.title','content.description','content.outputLabel','content.outputPrefix','content.outputSuffix','content.outputNote']},
    cta:{name:'행동 유도',hint:'페이지에서 다음 행동으로 이동할 수 있는 버튼 영역입니다.',paths:['content.title','content.description','content.primaryLabel','content.primaryUrl','content.secondaryLabel','content.secondaryUrl']},
    'service-list':{name:'서비스 목록',hint:'업체나 서비스를 행 단위로 비교하거나 정리합니다.',paths:['content.title','content.description']}
  };

  const LABELS={
    'content.eyebrow':'상단 라벨','content.index':'번호','content.title':'제목','content.description':'설명','content.image':'대표 이미지','content.imageAlt':'이미지 설명','content.note':'추가 안내','content.action':'행동 문구','content.label':'라벨','content.mission':'직접 해보기','content.proLabel':'장점 제목','content.conLabel':'주의 제목','content.actionLabel':'링크 문구','content.actionUrl':'링크 주소','content.quote':'인용문','content.name':'이름','content.role':'직함','content.source':'출처','content.avatar':'프로필 이미지','content.outputLabel':'결과 제목','content.outputPrefix':'앞 단위','content.outputSuffix':'뒤 단위','content.outputNote':'결과 설명','content.primaryLabel':'주요 버튼','content.primaryUrl':'주요 링크','content.secondaryLabel':'보조 버튼','content.secondaryUrl':'보조 링크'
  };

  function encodePath(path){return encodeURIComponent(JSON.stringify(path.split('.')));}
  function originalField(path){
    const encoded=encodePath(path);
    return [...inspector.querySelectorAll('[data-edit-path]')].find(field=>field.dataset.editPath===encoded&&!field.dataset.friendlyProxy)||null;
  }
  function labelFor(path){return LABELS[path]||path.split('.').pop();}
  function isLong(path,value){return ['content.description','content.note','content.action','content.mission','content.quote','content.outputNote'].includes(path)||String(value||'').length>80;}

  function proxyMarkup(path,field){
    const value=field.value??'';
    const type=field.dataset.valueType||'string';
    if(field.tagName==='SELECT'){
      return `<label class="editor-friendly-field"><span>${labelFor(path)}</span><select data-friendly-path="${path}">${[...field.options].map(option=>`<option value="${option.value}" ${option.value===field.value?'selected':''}>${option.textContent}</option>`).join('')}</select></label>`;
    }
    if(type==='number')return `<label class="editor-friendly-field"><span>${labelFor(path)}</span><input type="number" data-friendly-path="${path}" value="${String(value).replace(/"/g,'&quot;')}"></label>`;
    if(isLong(path,value))return `<label class="editor-friendly-field"><span>${labelFor(path)}</span><textarea data-friendly-path="${path}" rows="3">${String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea></label>`;
    return `<label class="editor-friendly-field"><span>${labelFor(path)}</span><input type="text" data-friendly-path="${path}" value="${String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}" /></label>`;
  }

  function bind(panel){
    panel.querySelectorAll('[data-friendly-path]').forEach(proxy=>{
      proxy.dataset.friendlyProxy='true';
      const eventName=proxy.tagName==='TEXTAREA'?'change':'change';
      proxy.addEventListener(eventName,()=>{
        const field=originalField(proxy.dataset.friendlyPath);
        if(!field)return;
        field.value=proxy.value;
        field.dispatchEvent(new Event('change',{bubbles:true}));
      });
    });
  }

  function enhance(){
    const meta=inspector.querySelector('.editor-inspector-meta');
    const type=meta?.querySelector('span')?.textContent?.split(' · ')[0]?.trim()||'';
    if(!meta||!type||inspector.querySelector('.editor-friendly-panel'))return;
    const profile=PROFILES[type];
    if(!profile)return;
    const fields=profile.paths.map(path=>({path,field:originalField(path)})).filter(item=>item.field);
    const panel=document.createElement('section');
    panel.className='editor-friendly-panel';
    panel.innerHTML=`<div class="editor-friendly-head"><div><small>빠른 편집</small><strong>${profile.name}</strong></div><p>${profile.hint}</p></div>${fields.length?`<div class="editor-friendly-fields">${fields.map(item=>proxyMarkup(item.path,item.field)).join('')}</div>`:'<p class="editor-friendly-empty">이 블록은 아래 세부 항목에서 내용을 편집하세요.</p>'}<details class="editor-friendly-help"><summary>세부 편집 안내</summary><p>반복 항목, 표의 행과 열, 카드 안쪽 내용은 아래 기본 편집 영역에서 수정합니다. 빠른 편집과 아래 필드는 같은 block 데이터를 사용합니다.</p></details>`;
    meta.insertAdjacentElement('afterend',panel);
    bind(panel);
  }

  const observer=new MutationObserver(enhance);
  observer.observe(inspector,{childList:true,subtree:true});
  enhance();
})();
