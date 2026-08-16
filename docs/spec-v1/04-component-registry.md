# 04. UI 컴포넌트 레지스트리

이 문서는 화면에 보이는 요소를 가능한 한 selector 최소단위로 정의한다. 동일 기능/의미의 요소는 기존 컴포넌트를 재사용하고, 불필요한 신규 시각 언어를 만들지 않는다.

## CARD-001 — Hero

**Selectors**
- `.hero`
- `.hero__image`
- `.hero__body`
- `.hero__eyebrow`
- `.hero__facts`
- `.hero__fact`

**Contract**
- full-bleed 이미지 + dark overlay.
- body는 이미지 위 하단에 위치.
- 제목/설명/4개 fact를 포함.
- fact는 translucent dark/glass card.
- hero 자체를 일반 흰 card로 축소하지 않는다.

## CARD-002 — Chapter Hero

**Selectors**
- `.chapter-hero`
- `.chapter-hero__card`
- `.chapter-hero__copy`
- `.index`

각 chapter 첫 진입에 해당 장의 제목/설명/이미지 context를 제공한다.

## CARD-003 — Section Heading

**Selectors**
- `.section-heading`
- `.eyebrow`
- `.subhead`
- `.micro`

eyebrow는 작은 category/상태 라벨, h2/h3는 본문 hierarchy를 책임진다.

## CARD-004 — Generic Group Card

**Selector**: `.group-card`

여러 guide/module의 outer surface. 내부에 guide-key가 중첩될 수 있으며, 다크모드에서는 inner panel과 outer panel이 분리돼 보여야 한다.

## CARD-005 — Guide Block

**Selectors**
- `.guide-block`
- `.guide-block__body`
- `.guide-stack`

`guideModule()`이 타입별 콘텐츠를 감싼다. prose 자체가 card가 아닐 수 있으므로 무조건 surface를 붙이지 않는다.

## CARD-006 — Guide Key / Callout

**Selectors**
- `.guide-key`
- `.guide-key--soft`
- `.guide-key__text`
- `.key-flow`
- `.key-flow__item`
- `.key-flow__arrow`

**Light**: 밝은 blue-grey surface + 어두운 text.
**Dark**: graphite inner panel + light text.

`핵심`, `기준`, `메모` 같은 label과 강조 문구를 표현한다.

## CARD-007 — Process / Ranking

**Selectors**
- `.flow-card`
- `.flow-card--refined`
- `.flow-list`
- `.flow-row`
- `.flow-row--refined`
- `.flow-step`
- `.flow-row__copy`

과거 큰 파란 원 대신 compact step cell을 사용한다. step number는 별도 square/rounded cell이며 본문과 수평 정렬한다.

## CARD-008 — Metric

**Selectors**
- `.metric-grid`
- `.metric-card`

수치/계산 예시용 compact panel. mobile에서는 1열로 떨어질 수 있다.

## CARD-009 — Market Card

**Selectors**
- `.market-card`
- `.market-card__image`
- `.market-card__body`
- `.market-rank`
- `.market-card__prices`
- `.market-card__price`
- `.market-card__customer`

image → rank/title → two price blocks → customer channel 순서.

## CARD-010 — Education Option

**Selectors**
- `.edu-stack`
- `.edu-option`
- `.edu-option__top`
- `.edu-option__rank`
- `.edu-option__meta`

education route 비교. meta tag는 공용 `.soft-tag` 언어 사용.

## CARD-011 — Check Card

**Selectors**
- `.check-grid`
- `.check-card`

상담 체크리스트 번호 + 문장. 장식 목적의 추가 icon 금지.

## CARD-012 — Skill Card

기본/현행 확장형 모두 존재한다.

**Selectors**
- `.skill-card`
- `.skill-card--media`
- `.skill-card__visual`
- `.skill-card__body`
- `.skill-card__topline`
- `.skill-card__tags`
- `.skill-card__video-slot`

현행 확장형은 **작업 예시 이미지 → 영역/설명 → tag → 관련 영상 slot**의 구조다.

## CARD-013 — Skill Video Card

**Selectors**
- `.skill-video-card`
- `.skill-video-card--mini`
- `.skill-video-card--matched`
- `.skill-video-card--discover`
- `.skill-video-card__visual`
- `.skill-video-card__play`
- `.skill-video-card__duration`
- `.skill-video-card__copy`
- `.skill-video-card__source`
- `.skill-video-category`
- `.skill-video-bookmark`

mini는 skill card 내부 추천 영상, discover는 horizontal rail에 이어지는 standalone 영상.

## CARD-014 — Portfolio Case Card

**Selectors**
- `.case-card`
- `.case-card__image`
- `.case-card__body`
- `.case-delivery`

description과 delivery list가 하나의 card body surface에 속한다. delivery row마다 별도 카드처럼 보이는 background를 만들지 않는다.

## CARD-015 — Product Card

**Selectors**
- `.product-card`
- `.product-card__image`
- `.product-card__body`
- `.product-card__kind`
- `.product-card__line`
- `.product-card__budget`
- `.naver-btn`

제품 컷아웃 이미지는 다크모드에서도 white media stage를 유지할 수 있다. 이미지 배경까지 억지로 dark로 바꾸지 않는다.

## CARD-016 — Product Detail Row

**Selectors**
- `.product-table`
- `.product-row`
- `.product-row__top`
- `.product-row__budget`
- `.product-row__meta`

제목이 가격/meta 때문에 squeeze되지 않아야 한다. meta span은 일반 content badge 언어와 동일 계열.

## CARD-017 — Offer Card

**Selectors**
- `.offer-card`
- `.offer-card__label`
- `.offer-card__price`

상품 package 설명. decorative middle-dot bullet은 쓰지 않는다.

## CARD-018 — Phase Card

**Selectors**
- `.phase-card`
- `.phase-card__period`
- `.phase-card__profit`

기간별 목표 수익/매출/객단가/핵심행동.

## CARD-019 — Script Card

**Selectors**
- `.script-card`
- `.script-card__head`
- `.script-card__meta`
- `.copy-btn`
- `.message-bubble`

message bubble은 parent 안의 inner panel이며 dark에서 명확한 경계가 있어야 한다.

## CARD-020 — Lesson Preview

**Selectors**
- `.lesson-preview`
- `.lesson-preview__image`
- `.lesson-preview__body`
- `.lesson-preview__num`

아이폰 촬영 lesson preview rail.

## CARD-021 — Preset Card

**Selectors**
- `.preset-card`
- `.preset-card__image`
- `.preset-card__body`
- `.preset-card__scene`
- `.preset-card__exposure`

상황별 카메라 시작값.

## CARD-022 — Full Lesson

**Selectors**
- `.lesson`
- `.lesson__lead`
- `.lesson__visual`
- `.lesson__grid`
- `.lesson__panel`
- `.mission-card`

촬영 설정 / 찍는 순서 / 자주 망하는 이유 / 오늘 해볼 것.

## CARD-023 — Source Card

**Selectors**
- `.source-card`
- `.source-card__topic`

공식 확인 링크용 simple card.

## CARD-024 — Curated Article Card

**Selectors**
- `.curated-card`
- `.curated-card__visual`
- `.curated-platform`
- `.curated-bookmark`
- `.curated-card__body`
- `.curated-meta`
- `.curated-tags`
- `.curated-open`

**Important**
- source badge `브런치/티스토리`는 `.curated-platform`.
- content tag `구도/아이폰/리뷰사진` 등은 `.curated-tags > span`.
- content tag는 장비 row/meta와 동일한 일반 badge 언어를 재사용한다.
- `.soft-tag` selector로 잘못 가정하지 않는다.

## CARD-025 — Common Content Badge

**Selectors/Equivalent family**
- `.soft-tag`
- `.product-row__meta span`
- `.curated-tags > span`

같은 목적이면 동일한 visual family를 쓴다. 모듈별 새 badge 디자인을 만들지 않는다.

## CARD-026 — Image Source Badge

**Selector**: `.curated-platform`

이미지 위에 놓이므로 일반 badge와 구분되는 dark translucent/white text treatment 허용.

## CARD-027 — Bookmark Button

**Selectors**
- `.curated-bookmark`
- `.skill-video-bookmark`
- `.is-favorite`

unsaved = neutral circular control.
saved = blue circular control + white filled bookmark glyph.

저장 여부를 color와 filled icon 둘 다로 명확하게 구분한다.

## CARD-028 — Loading Sentinel

**Selectors**
- `.curated-discovery-sentinel`
- `.skills-more-sentinel`

하나의 rail에 canonical sentinel 하나만 존재. duplicate loader/large blank sentinel 금지.

## NAV-001 — Chapter Rail

**Selectors**
- `.nav-shell`
- `.nav-glass`
- `.nav-scroll`
- `.nav-chip`
- `.nav-v33-indicator`
- `.v37-liquid-skin`

상세 계약은 `06-liquid-navigation.md`.

## COLL-001 — Collection FAB

**Selectors**
- `#collectionFab.collection-fab`
- `#collectionFabCount.collection-fab__count`

고정된 오른쪽 하단 진입점. icon + total saved badge.

## COLL-002 — Collection Backdrop

**Selector**: `#collectionBackdrop.collection-backdrop`

sheet 뒤의 interaction blocker. background page touch를 막는다.

## COLL-003 — Collection Sheet

**Selectors**
- `#collectionSheet.collection-sheet`
- `.collection-handle-wrap`
- `.collection-handle`
- `.collection-head`
- `#collectionClose.collection-close`

bottom sheet identity 유지.

## COLL-004 — Collection Primary Tabs

**Selectors**
- `.collection-tabs`
- `.collection-tab`
- `.collection-v33-indicator`

5개: 전체 / 영상 / 읽을거리 / 질문 / 설정.

## COLL-005 — Collection Tools

**Selectors**
- `#collectionTools.collection-tools`
- `.collection-search`
- `#collectionSearch`
- `#collectionFilters.collection-filters`
- `.collection-filter`

질문 탭에서도 search는 유지되며 secondary question selector가 같은 tools 영역에 배치된다.

## COLL-006 — Collection Item

**Selectors**
- `.collection-list`
- `.collection-item`
- `.collection-item__thumb`
- `.collection-item__main`
- `.collection-item__type`
- `.collection-item__remove`
- `.collection-item--question`
- `.collection-item__question-icon`

question과 media item은 서로 다른 thumbnail/icon 구조지만 list density와 action alignment는 통일한다.

## COLL-007 — Bulk Selection

**Selectors**
- `.collection-select-toggle`
- `.collection-selectbox`
- `.collection-bulkbar`
- `.collection-bulkbar__all`
- `.collection-bulkbar__count`
- `.collection-bulkbar__delete`
- `.is-bulk-selecting`
- `.is-selected`

selection column은 실제 grid column으로 확보한다. overlay로 text를 밀지 않는다.

## COLL-008 — Collection Settings

**Selectors**
- `.collection-settings`
- `.collection-settings__summary`
- `.collection-setting-row`
- `.collection-setting-note`

settings tab은 search/tools를 숨길 수 있다.

## Q-001 — Selection Bubble

**Selector**: `#askBubble`

본문 문장 selection 시 나타나는 `GPT에 질문` 진입점. selection data는 bubble click 전에 state/quote에 복사되어 있어야 한다.

## Q-002 — Current Question Controls

**Selectors**
- `#v40QuestionControls`
- `.v40-question-segment`
- `[data-v40-qmode="write"]`
- `[data-v40-qmode="saved"]`
- `.v36-question-indicator`

표시 label: `질문 작성하기` / `저장한 질문` + count.

## Q-003 — Question Composer

**Selectors**
- `#askWritePanel`
- `#askQuote`
- `.ask-sheet__quote`
- `#askInput`
- `.ask-actions`
- `#askSave`
- `#askCopy`
- `#askOpenChatGPT`
- `.v34-gpt-note`

기존 selected quote, textarea, copy/save/ChatGPT action을 유지한다.

## THEME-001 — Theme Choice

**Selectors**
- `.theme-choice`
- `.theme-v34-indicator`
- buttons light/dark/system

collection settings 안에서 표시되며 liquid control을 재사용한다.

## REG-COMP-001 — 컴포넌트 재사용 원칙

새 UI를 추가하기 전에 위 registry에서 의미가 같은 기존 컴포넌트가 있는지 확인한다. 특히 badge, button, rail, card, bookmark, callout은 독립 스타일을 새로 만들기보다 기존 family를 확장한다.
