function hero(data){
  const c=data.content||{};
  return `<header class="hero">
    <img class="hero__image" src="${imageFor('hero')}" alt="촬영용 카메라와 작업 공간">
    <div class="hero__body">
      <div class="hero__eyebrow">사진 수익화 로드맵</div>
      <h1>${esc(c.hero_title||'사진으로 먹고살기: 첫 12개월')}</h1>
      <p>${esc(c.hero_subtitle||'국비로 배우고, 필요한 장비만 사고, 반복 고객을 만든다. 월 순수익 300만 원까지의 실행 순서.')}</p>
      <div class="hero__facts">
        <div class="hero__fact"><span>월 순수익 목표</span><strong>${esc(c.goal_profit||'300만 원+')}</strong></div>
        <div class="hero__fact"><span>교육</span><strong>${esc(c.education_route||'국비 실무 + 현장 보조')}</strong></div>
        <div class="hero__fact"><span>초기 장비</span><strong>${esc(c.gear_budget||'230~310만 원')}</strong></div>
        <div class="hero__fact"><span>12개월 핵심</span><strong>${esc(c.year_core||'반복 B2B 5곳+')}</strong></div>
      </div>
    </div>
  </header>`;
}

function nav(data){
  return `<div class="nav-placeholder" aria-hidden="true"></div><div class="nav-shell">
    <nav class="nav-scroll" aria-label="챕터">
      ${(data.nav||[]).map((n,i)=>`<button class="nav-chip ${i===0?'is-active':''}" data-target="${attr(n.id)}">${esc(n['칩'])}</button>`).join('')}
    </nav>
    <div class="read-progress"><div class="read-progress__bar"></div></div>
  </div>`;
}

function chapterHero(n,index,key){
  return `<div class="chapter-hero">
    <div class="wide">
      <div class="chapter-hero__card">
        <img src="${imageFor(key)}" alt="${attr(n['제목'])}">
        <div class="chapter-hero__copy">
          <div class="index">${String(index+1).padStart(2,'0')} / ${esc(n['칩'])}</div>
          <h2>${esc(n['제목'])}</h2>
          <p>${esc(n['설명'])}</p>
        </div>
      </div>
    </div>
  </div>`;
}

function guideRows(data,section){ return by(data.guideCopy,'섹션',section); }

function guideModule(row){
  const type=row['타입']||'prose';
  const title=esc(row['제목']||'');
  const body=row['본문']||'';
  const key=row['강조']||'';
  const helper=row['보조']||'';

  if(type==='flow'){
    return `<article class="guide-block">
      <h3>${title}</h3>
      <div class="group-card flow-card">
        <div class="flow-list">${pipe(body).map((x,i)=>`<div class="flow-row"><i>${i+1}</i><span>${esc(x)}</span></div>`).join('')}</div>
      </div>
      ${helper?`<div class="micro" style="margin-top:.72rem">${esc(helper)}</div>`:''}
    </article>`;
  }

  if(type==='ranking'){
    return `<article class="guide-block">
      <h3>${title}</h3>
      <div class="group-card flow-card">
        <div class="flow-list">${pipe(body).map((x,i)=>`<div class="flow-row"><i>${i+1}</i><span>${esc(x)}</span></div>`).join('')}</div>
      </div>
      ${key?calloutHtml('왜 이렇게 보나', key, helper, 'dark'):''}
    </article>`;
  }

  if(type==='metrics'){
    return `<article class="guide-block">
      <h3>${title}</h3>
      <div class="group-card" style="padding:1rem">
        <div class="metric-grid">${pipe(body).map(x=>`<div class="metric-card"><span>계산 예시</span><b>${esc(x)}</b></div>`).join('')}</div>
      </div>
      ${key?calloutHtml('핵심', key, helper, 'dark'):''}
    </article>`;
  }

  if(type==='card'){
    const offers=pipe(body);
    return `<article class="guide-block">
      <h3>${title}</h3>
      <div class="scroll-row">${offers.map((x,i)=>{
        const [name,...rest]=x.split(':');
        const copy=rest.join(':').trim();
        const price=(copy.match(/(\d+(?:\.\d+)?만 원)/)||[])[1]||'';
        return `<div class="offer-card"><div class="offer-card__label">상품 ${String.fromCharCode(65+i)}</div><h3>${esc(name)}</h3>${price?`<div class="offer-card__price">${esc(price)}</div>`:''}<p class="muted" style="font-size:14px;line-height:1.54">${esc(copy)}</p></div>`;
      }).join('')}</div>
      ${key?calloutHtml('첫 달 기준', key, helper, 'dark'):''}
    </article>`;
  }

  if(type==='warning'){
    return `<article class="guide-block">
      <div class="group-card" style="padding:1.18rem;background:#fff">
        <div class="eyebrow">초반에는 보류</div>
        <h3>${title}</h3>
        <div class="guide-block__body">${paragraphs(body)}</div>
        ${key?calloutHtml('기준', key, helper, 'dark'):''}
      </div>
    </article>`;
  }

  if(type==='callout'){
    return `<article class="guide-block">
      <div class="callout-card">
        <strong>${title}</strong>
        <div class="guide-block__body">${paragraphs(body)}</div>
        ${key?calloutHtml('메모', key, helper, 'soft'):''}
      </div>
    </article>`;
  }

  return `<article class="guide-block">
    <h3>${title}</h3>
    <div class="guide-block__body">${paragraphs(body)}</div>
    ${key?calloutHtml('핵심', key, helper, 'dark'):''}
  </article>`;
}

function renderGuide(data,section){ return `<div class="guide-stack">${guideRows(data,section).map(guideModule).join('')}</div>`; }

function marketSection(data,n,index){
  const photos=[imageFor('product'),imageFor('profile'),imageFor('food')];
  const cards=(data.market||[]).map((r,i)=>`<article class="market-card">
    <div class="market-card__image"><img src="${photos[i]||imageFor('product')}" alt="${attr(r['분야'])} 예시"></div>
    <div class="market-card__body">
      <div class="market-rank">TOP ${esc(r['순위'])}</div>
      <h3>${esc(r['분야'])}</h3>
      <div class="market-card__prices">
        <div class="market-card__price"><span>초보 단가</span><b>${esc(r['초보 현실 단가'])}</b></div>
        <div class="market-card__price"><span>목표 단가</span><b>${esc(r['자리 잡은 뒤 목표 단가'])}</b></div>
      </div>
      <div class="market-card__customer">${esc(r['주요 고객 채널'])}</div>
    </div>
  </article>`).join('');

  return `<section id="market" class="chapter" data-chapter="market">
    ${chapterHero(n,index,'product')}
    <div class="section grouped"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">시장 선택</div><h2>처음에는 세 분야만 비교해도 충분합니다.</h2><p>단가만 보지 말고, 같은 고객이 다시 주문할 이유가 있는지와 한 번의 촬영을 여러 납품물로 묶을 수 있는지를 같이 보세요.</p></div>
      <div class="scroll-row">${cards}</div>
      <div class="content" style="margin-top:2.55rem">${renderGuide(data,'MARKET')}</div>
    </div></div>
  </section>`;
}

function introSection(data,n,index){
  return `<section id="intro" class="chapter" data-chapter="intro">
    ${chapterHero(n,index,'intro')}
    <div class="section"><div class="content">
      <div class="section-heading"><div class="eyebrow">시작 방향</div><h2>사진을 배우는 순서와 돈을 버는 순서는 조금 다릅니다.</h2><p>모든 기술을 다 배운 뒤 시작할 필요는 없습니다. 기본기를 익히는 동안 포트폴리오와 첫 상품, 영업 준비를 같이 진행하는 편이 빠릅니다.</p></div>
      ${renderGuide(data,'INTRO')}
    </div></div>
  </section>`;
}

function educationSection(data,n,index){
  const edu=(data.education||[]).map(r=>`<article class="group-card edu-option">
    <div class="edu-option__top"><div><div class="eyebrow">우선순위 ${esc(r['우선순위'])}</div><h3>${esc(r['교육 루트'])}</h3></div><div class="edu-option__rank">${esc(r['우선순위'])}</div></div>
    <small>${esc(r['추천 여부'])}</small>
    <div class="edu-option__meta"><span class="soft-tag">매출 ${esc(r['매출 기여'])}</span><span class="soft-tag">시간 ${esc(r['시간 효율'])}</span><span class="soft-tag">비용 ${esc(r['비용 효율'])}</span></div>
  </article>`).join('');

  const checks=[
    '자격증보다 실제 촬영 시간이 많은가','인물과 제품을 직접 찍는가','스트로보와 소프트박스를 다루는가',
    '반사판과 그리드를 써보는가','테더 촬영을 해보는가','Lightroom 또는 Capture One을 다루는가',
    '강사가 최근에도 상업 촬영을 하는가','이전 수강생 결과물을 공개하는가','개인 실습 시간이 충분한가',
    '견적·수정·납품·응대까지 다루는가'
  ];

  return `<section id="education" class="chapter" data-chapter="education">
    ${chapterHero(n,index,'education')}
    <div class="section"><div class="content">
      <div class="section-heading"><div class="eyebrow">교육 ROI</div><h2>학위보다 매출까지 걸리는 시간을 봅니다.</h2></div>
      <div class="edu-stack">${edu}</div>
      <div style="height:2.8rem"></div>
      ${renderGuide(data,'EDUCATION')}
      <div style="height:2.8rem"></div>
      <div class="subhead"><h3>학원 상담 체크</h3><span class="micro">10개</span></div>
      <div class="check-grid">${checks.map((x,i)=>`<div class="check-card"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(x)}</span></div>`).join('')}</div>
    </div></div>
  </section>`;
}

function skillsSection(data,n,index){
  const skills=(data.skills||[]).map((r,i)=>`<article class="skill-card">
    <div class="skill-card__icon">${String(i+1).padStart(2,'0')}</div>
    <h3>${esc(r['영역'])}</h3>
    <p>${esc(r['필수 기술'])}</p>
    <span class="soft-tag">${esc(r['목표 속도'])}</span>
    <span class="soft-tag">${esc(r['실전 산출물'])}</span>
  </article>`).join('');

  return `<section id="skills" class="chapter" data-chapter="skills">
    ${chapterHero(n,index,'skills')}
    <div class="section grouped"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">실무 기술</div><h2>상업사진은 ‘잘 찍기’와 ‘빨리 납품하기’를 같이 연습해야 합니다.</h2></div>
      <div class="scroll-row">${skills}</div>
      <div class="content" style="margin-top:2.6rem">${renderGuide(data,'SKILLS')}</div>
    </div></div>
  </section>`;
}

function portfolioImage(key){
  if(key==='product') return imageFor('product');
  if(key==='profile') return imageFor('profile');
  if(key==='food') return imageFor('food');
  return imageFor('portfolio');
}

function portfolioSection(data,n,index){
  const cases=(data.portfolio||[]).map(r=>`<article class="case-card">
    <div class="case-card__image"><img src="${portfolioImage(r['이미지키'])}" alt="${attr(r['분야'])} 포트폴리오 예시"></div>
    <div class="case-card__body">
      <div class="eyebrow">${esc(r['분야'])}</div>
      <h3>${esc(r['예시 프로젝트'])}</h3>
      <p>${esc(r['설명'])}</p>
      <div class="case-delivery">${splitDeliverables(r['납품 구성']).slice(0,7).map((x,i)=>`<div><i>${String(i+1).padStart(2,'0')}</i><span>${esc(x)}</span></div>`).join('')}</div>
    </div>
  </article>`).join('');

  return `<section id="portfolio" class="chapter" data-chapter="portfolio">
    ${chapterHero(n,index,'portfolio')}
    <div class="section"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">포트폴리오</div><h2>사진 모음보다 ‘실제 의뢰처럼 보이는 프로젝트’를 만드세요.</h2></div>
      <div class="scroll-row">${cases}</div>
      <div class="content" style="margin-top:2.6rem">${renderGuide(data,'PORTFOLIO')}</div>
    </div></div>
  </section>`;
}

function productCards(data){
  return (data.products||[])
    .filter(r=>String(r['카드 노출']).toUpperCase()==='TRUE' && r['카드 이미지'])
    .map(r=>`<article class="product-card">
      <div class="product-card__image"><img src="${attr(r['카드 이미지'])}" alt="${attr(r['제품'])}" onerror="this.closest('.product-card__image').style.background='#f0f0f3';this.style.display='none'"></div>
      <div class="product-card__body">
        <div class="product-card__kind">${esc(r['구분'])}</div>
        <h3>${esc(r['제품'])}</h3>
        <div class="product-card__line">${esc(r['카드 한줄']||r['역할'])}</div>
        <div class="product-card__budget">${esc(r['예산/가격대'])}</div>
        <a class="naver-btn" href="${naverShoppingUrl(r['네이버 검색어']||r['제품'])}" target="_blank" rel="noopener">네이버쇼핑 시세 보기</a>
      </div>
    </article>`).join('');
}

function productTable(data){
  return `<div class="group-card product-table">${(data.products||[]).map(r=>`<div class="product-row">
    <div class="product-row__top"><h4>${esc(r['제품'])}</h4></div>
    <p>${esc(r['선정 이유'])}</p>
    <div class="product-row__meta"><span class="soft-tag">${esc(r['구분'])}</span><span class="soft-tag">${esc(r['권장 상태'])}</span><span class="soft-tag">${esc(r['구매 시점'])}</span></div>
    <div class="product-row__budget">${esc(r['예산/가격대'])}</div>
  </div>`).join('')}</div>`;
}

function gearSection(data,n,index){
  return `<section id="gear" class="chapter" data-chapter="gear">
    ${chapterHero(n,index,'gear')}
    <div class="section grouped"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">장비</div><h2>처음 사는 것과 나중에 사는 것을 분리합니다.</h2><p>초기 장비는 바디와 표준줌 중심으로 보고, 단렌즈와 상위 바디는 매출이 생긴 뒤 판단합니다.</p></div>
      <div class="subhead content"><h3>제품 비교</h3></div>
      <div class="scroll-row">${productCards(data)}</div>
      <div class="content" style="margin-top:2.35rem">
        ${renderGuide(data,'GEAR')}
        <div style="height:2.55rem"></div>
        <div class="subhead"><h3>추천 제품 상세 설명</h3></div>
        ${productTable(data)}
      </div>
    </div></div>
  </section>`;
}

function phaseCards(data){
  return (data.actionPlan||[]).map(r=>`<article class="phase-card">
    <div class="phase-card__period">${esc(r['기간'])}</div>
    <div class="phase-card__profit">순이익 ${esc(r['순이익 목표'])}</div>
    <div class="metric-grid"><div class="metric-card"><span>월매출 목표</span><b>${esc(r['월매출 목표'])}</b></div><div class="metric-card"><span>평균 객단가</span><b>${esc(r['평균 객단가'])}</b></div></div>
    <p>${esc(r['핵심 행동'])}</p>
  </article>`).join('');
}

function planSection(data,n,index){
  return `<section id="plan" class="chapter" data-chapter="plan">
    ${chapterHero(n,index,'plan')}
    <div class="section"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">12개월 수익 계획</div><h2>전체 그림은 카드로 빠르게 보고, 아래에서 이유와 계산을 차근차근 읽습니다.</h2></div>
      <div class="scroll-row">${phaseCards(data)}</div>
      <div class="content" style="margin-top:2.55rem">${renderGuide(data,'SALES')}</div>
    </div></div>
  </section>`;
}

function scriptsSection(data,n,index){
  const scripts=(data.scripts||[]).map((r,i)=>`<article class="group-card script-card">
    <div class="script-card__head"><div><h3>${esc(r['상황'])}</h3><div class="script-card__meta">${esc(r['채널'])} · ${esc(r['사용 시점'])} · ${esc(r['목적'])}</div></div><button class="copy-btn" data-copy="script-${i}">복사</button></div>
    <div class="message-bubble" id="script-${i}">${lines(r['스크립트']).map(x=>`<p>${esc(x)}</p>`).join('')}</div>
  </article>`).join('');

  return `<section id="scripts" class="chapter" data-chapter="scripts">
    ${chapterHero(n,index,'scripts')}
    <div class="section grouped"><div class="content">
      <div class="section-heading"><div class="eyebrow">고객 유치</div><h2>첫 고객은 기다려서 생기지 않습니다.</h2><p>포트폴리오를 만든 뒤 업종 후보를 찾고, 문제를 짚어 제안하고, 첫 상품을 판매한 다음 후기와 재구매로 이어가는 흐름을 만드는 것이 핵심입니다.</p></div>
      ${renderGuide(data,'ACTION')}
      <div style="height:2.7rem"></div>
      <div class="subhead"><h3>바로 써볼 메시지</h3><span class="micro">업종에 맞게 한두 문장만 수정</span></div>
      <div class="script-list">${scripts}</div>
    </div></div>
  </section>`;
}

function lessonImage(r){
  if(r.lesson_id==='portrait') return imageFor('profile');
  if(r.lesson_id==='product') return imageFor('product');
  if(r.lesson_id==='night') return imageFor('night');
  if(r.lesson_id==='macro') return imageFor('macro');
  if(r.lesson_id==='edit') return imageFor('edit');
  if(r.lesson_id==='lens') return imageFor('profile');
  if(r.lesson_id==='focus') return imageFor('iphone');
  return imageFor(r.image_key||'iphone');
}

function iphoneSection(data,n,index){
  const previews=(data.photoLessons||[]).map((r,i)=>`<article class="lesson-preview">
    <div class="lesson-preview__image"><img src="${lessonImage(r)}" alt="${attr(r['제목'])} 예시"></div>
    <div class="lesson-preview__body"><div class="lesson-preview__num">${String(i+1).padStart(2,'0')}</div><h3>${esc(r['제목'])}</h3><p>${esc(r['한줄설명'])}</p></div>
  </article>`).join('');

  const presets=(data.cameraPresets||[]).map((r,i)=>`<article class="preset-card">
    <div class="preset-card__image"><img src="${presetImageForScenario(r['상황'])}" alt="${attr(r['상황'])} 예시"></div>
    <div class="preset-card__body">
      <div class="preset-card__scene">상황 ${String(i+1).padStart(2,'0')}</div>
      <h3>${esc(r['상황'])}</h3>
      <p>${esc(r['렌즈/배율'])}</p>
      <div class="preset-card__exposure">${esc(r['노출 시작점'])}</div>
    </div>
  </article>`).join('');

  const lessons=(data.photoLessons||[]).map((r,i)=>`<article class="lesson">
    <div class="content">
      <div class="eyebrow">${String(i+1).padStart(2,'0')} · ${esc(r['태그'])}</div>
      <h3>${esc(r['제목'])}</h3>
      <p class="lesson__lead">${esc(r['한줄설명'])}</p>
      <div class="lesson__visual"><img src="${lessonImage(r)}" alt="${attr(r['제목'])} 촬영 예시"></div>
      <div class="lesson__grid">
        <div class="lesson__panel"><h4>촬영 설정</h4><ul>${pipe(r['핵심설정']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="lesson__panel"><h4>찍는 순서</h4><ul>${pipe(r['촬영순서']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="lesson__panel"><h4>자주 망하는 이유</h4><ul>${pipe(r['실패패턴']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      <div class="mission-card"><small>오늘 해볼 것</small><b>${esc(r['현장미션'])}</b></div>
      ${r['모델주의']?`<div class="micro" style="margin-top:.78rem">${esc(r['모델주의'])}</div>`:''}
      ${r['출처URL']?`<a href="${attr(r['출처URL'])}" target="_blank" rel="noopener" style="display:inline-block;margin-top:.68rem;font-size:14px;font-weight:650">Apple 공식 설명 보기 ↗</a>`:''}
    </div>
  </article>`).join('');

  return `<section id="iphone" class="chapter" data-chapter="iphone">
    ${chapterHero(n,index,'iphone')}
    <div class="section"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">아이폰 출사</div><h2>카메라를 사기 전에 오늘 바로 연습할 수 있습니다.</h2><p>숫자를 외우기보다 같은 장면을 여러 번 찍으면서 초점, 노출, 거리, 빛이 어떻게 결과를 바꾸는지 확인하세요.</p></div>
      <div class="scroll-row">${previews}</div>
      <div class="content" style="margin-top:2.2rem"><div class="subhead"><h3>상황별 시작값</h3><span class="micro">정답이 아니라 출발점</span></div></div>
      <div class="scroll-row">${presets}</div>
    </div></div>
    ${lessons}
  </section>`;
}

function sourcesSection(data,n,index){
  const cards=(data.sources||[]).map(r=>`<article class="source-card">
    <div class="source-card__topic">${esc(r['주제'])}</div>
    <h3>${esc(r['출처/서비스'])}</h3>
    <p>${esc(r['메모'])}</p>
    <a href="${attr(r['URL'])}" target="_blank" rel="noopener">확인하기 ↗</a>
  </article>`).join('');

  return `<section id="sources" class="chapter" data-chapter="sources">
    ${chapterHero(n,index,'gear')}
    <div class="section grouped"><div class="wide">
      <div class="content section-heading"><div class="eyebrow">사진 관련 자료</div><h2>사진·교육·장비를 확인할 때 쓰는 자료입니다.</h2><p>교육과정, 직업정보, 장비 사양처럼 실제 판단에 필요한 링크를 모았습니다.</p></div>
      <div class="scroll-row">${cards}</div>
    </div></div>
  </section>`;
}
