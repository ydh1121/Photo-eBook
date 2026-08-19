# V1 Block Inventory

현재 photography 페이지의 실제 renderer와 component registry를 기준으로, 관리자 Block Editor에서 독립적으로 배치할 수 있는 콘텐츠 단위를 17개 family로 정리한다.

기존 selector 단위 component를 그대로 block type으로 만들지 않는다. 같은 정보 목적을 가진 표현은 variant로 통합한다.

## 01. `hero`

현재 근거:
- `.hero`
- `.hero__body`
- `.hero__facts`

용도:
- 페이지 전체의 첫 진입
- 주제, 대상, 목표, 핵심 사실 2~4개

현재 상태: `candidate`

editorialProfile: `hero`
referenceProfiles: `[]`

개선 포인트:
- fact가 4개 고정이라는 가정을 제거
- 이미지가 없는 variant 검토
- 긴 제목의 모바일 줄바꿈을 데이터로 제어할지 검토

## 02. `chapter-hero`

현재 근거:
- `.chapter-hero`
- `.chapter-hero__card`

용도:
- 긴 단일 페이지의 큰 주제 구간을 시각적으로 구분

현재 상태: `candidate`

editorialProfile: `section-heading`
referenceProfiles: `[]`

개선 포인트:
- 모든 block 묶음에 강제하지 않음
- 이미지가 필요 없는 산업/섹션을 위한 compact variant 필요

## 03. `section-heading`

현재 근거:
- `.section-heading`
- `.eyebrow`
- `.subhead`

용도:
- 다음 콘텐츠 묶음의 목적과 판단 기준 설명

현재 상태: `candidate`

editorialProfile: `section-heading`
referenceProfiles: `[]`

개선 포인트:
- eyebrow/title/description 역할 중복 제거
- 좁은 화면 heading 폭과 여백 정제

## 04. `rich-text`

현재 근거:
- `guideModule(type=prose)`
- `.guide-block__body`

용도:
- 설명, 배경, 해설

현재 상태: `candidate`

editorialProfile: `rich-text`
referenceProfiles: `editorial-daleseo-korean-skills`, `editorial-nomadamas-korean-humanizer`

개선 포인트:
- 긴 문단 최대 폭/행 길이
- 불필요한 card surface 제거
- 목록/비교로 전환해야 할 콘텐츠 기준 명시

## 05. `process`

현재 근거:
- `guideModule(type=flow)`
- `guideModule(type=ranking)`
- `.flow-card--refined`

variants:
- `sequence`
- `ranking`

현재 상태: `candidate`

editorialProfile:
- sequence → `process`
- ranking → `ranking`

referenceProfiles: `[]`

통합 이유:
- 현재 flow/ranking은 같은 step visual을 공유하고 차이는 의미와 보조 callout에 가깝다.

개선 포인트:
- 현재 작은 step cell은 유지하되 정보 위계 재검토
- ranking에는 기준/evidence 필드 추가

## 06. `metric-grid`

현재 근거:
- `.metric-grid`
- `.metric-card`

용도:
- 금액, 기간, 목표, 계산 예시, KPI

현재 상태: `candidate`

editorialProfile: `metrics`
referenceProfiles: `[]`

개선 포인트:
- 숫자 / 단위 / 설명 / 기준일을 분리
- 큰 숫자만 나열되는 UI 방지
- 1~4열 responsive contract 정리

## 07. `offer-rail`

현재 근거:
- `guideModule(type=card)`
- `.offer-card`

용도:
- 상품/서비스 패키지, 가격안, 구성 비교

현재 상태: `candidate`

editorialProfile: `comparison`
referenceProfiles: `[]`

개선 포인트:
- 현재 `상품 A/B/C` 강제 제거
- 가격 없는 offer 허용
- 카드 간 비교 축 정렬

## 08. `notice`

현재 근거:
- `guideModule(type=callout)`
- `guideModule(type=warning)`
- `.guide-key`
- `.guide-key--soft`

variants:
- `info`
- `key`
- `warning`

현재 상태: `candidate`

editorialProfile:
- info/key → `callout`
- warning → `warning`

referenceProfiles: `[]`

통합 이유:
- 현재 callout/warning/key가 모두 짧은 강조 정보라는 같은 목적을 공유한다.

개선 포인트:
- 배경색만 바꾼 중복 surface를 줄임
- 경고는 실제 행동/조건을 필수 필드로 둠

## 09. `comparison-cards`

현재 근거:
- `.market-card`
- `.edu-option`

variants:
- `market`
- `scored`
- `generic`

현재 상태: `candidate`

editorialProfile: `comparison`
referenceProfiles: `[]`

통합 이유:
- 시장 카드와 교육 옵션은 서로 다른 CSS지만 핵심 목적은 같은 기준으로 여러 선택지를 비교하는 것이다.

개선 포인트:
- 산업별 필드 하드코딩 제거
- column definition을 schema로 관리
- 순위가 없는 비교 허용
- card와 table 중 정보량에 따른 전환 기준 필요

## 10. `checklist`

현재 근거:
- `.check-grid`
- `.check-card`
- 교육 상담 체크 10개

현재 상태: `candidate`

editorialProfile: `checklist`
referenceProfiles: `[]`

개선 포인트:
- 현재 번호형 장식이 실제 check affordance인지 재검토
- 단순 점검 / 실제 체크 저장 가능 variant 구분
- 항목 길이 편차에 따른 grid 가독성 개선

## 11. `media-rail`

현재 근거:
- `.skill-card--media`
- `.skill-video-card`
- `.scroll-row`
- 관련 영상 discovery

variants:
- `skill`
- `video`
- `mixed`

현재 상태: `candidate`

editorialProfile: `media-rail`
referenceProfiles: `[]`

개선 포인트:
- 작업 설명과 영상 추천의 정보 위계 분리
- 무한 rail이 정보 탐색에 실제 도움이 되는지 Block Lab에서 재검토
- thumbnail ratio, card width, metadata 밀도 통일

## 12. `case-study-rail`

현재 근거:
- `.case-card`
- `.case-delivery`

용도:
- 실제 사례 / 자체 기획 사례 / 프로젝트 결과

현재 상태: `candidate`

editorialProfile: `case-study`
referenceProfiles: `[]`

개선 포인트:
- 실제/자체 기획 상태 badge
- 조건/과정/결과 필드 구조화
- 납품 list의 가독성 개선

## 13. `product-tool`

현재 근거:
- `.product-card`
- `.product-table`
- `.product-row`

variants:
- `rail`
- `list`
- `detail`

현재 상태: `candidate`

editorialProfile: `product-tool`
referenceProfiles: `[]`

통합 이유:
- 장비, 소프트웨어, 재료, 서비스 등 산업별 도구를 같은 family로 다룰 수 있다.

개선 포인트:
- 사진 장비 전용 필드 제거
- 가격/사양/추천 이유/evidence 분리
- 광고/제휴 표기 필드 예약

## 14. `roadmap`

현재 근거:
- `.phase-card`
- ACTION_PLAN

용도:
- 기간별 목표, 행동, 수익/성과 단계

현재 상태: `candidate`

editorialProfile: `roadmap`
referenceProfiles: `[]`

개선 포인트:
- 현재 수익 중심 고정 필드를 generic outcome/action으로 일반화
- 기간이 없는 단계형 roadmap도 허용
- timeline과의 차이 명확화

## 15. `script-copy`

현재 근거:
- `.script-card`
- `.message-bubble`
- `.copy-btn`

용도:
- 영업문, 문의문, 답변 예시, 제안 템플릿 등 복사 가능한 실전 문구

현재 상태: `candidate`

editorialProfile: `script-copy`
referenceProfiles: `editorial-daleseo-korean-skills`, `editorial-nomadamas-korean-humanizer`

개선 포인트:
- 변수 placeholder를 구조화
- 복사 가능 본문과 설명/meta를 명확히 분리
- 실제 경력/성과 과장 방지

## 16. `tutorial`

현재 근거:
- `.lesson-preview`
- `.preset-card`
- `.lesson`
- `.mission-card`

variants:
- `preview-rail`
- `preset-rail`
- `detail`

현재 상태: `candidate`

editorialProfile:
- preview/detail → `process`
- preset → `metrics`

referenceProfiles: `[]`

통합 이유:
- 현재 iPhone 챕터의 세 시각 패턴은 하나의 교육 콘텐츠 family 안에서 preview/quick-setting/detail 역할을 나눈다.

개선 포인트:
- `아이폰`, `촬영 설정` 하드코딩 제거
- 다른 분야의 실습, recipe, procedure에도 사용 가능하게 field 이름 일반화

## 17. `resources`

현재 근거:
- `.curated-card`
- `.source-card`

variants:
- `curated-rail`
- `official-list`

현재 상태: `candidate`

editorialProfile: `source-evidence`
referenceProfiles: `[]`

개선 포인트:
- 외부 읽을거리와 근거 출처를 같은 의미로 취급하지 않음
- official/evidence와 editorial recommendation을 명확히 구분
- 작성자, 발행일, 확인일, supports claim 필드 추가

---

# Primitive로 유지할 요소

다음은 독립 Block으로 만들지 않는다.

- `badge / soft-tag`
- image source badge
- bookmark button
- copy button
- metric cell
- guide key
- loading sentinel
- play button
- count badge
- card media stage

필요하면 Block Registry의 shared primitive로 구현한다.

# Platform Chrome로 유지할 요소

다음은 콘텐츠 editor의 block library에서 제외한다.

- chapter navigation rail
- read progress
- collection FAB
- collection sheet/tabs/search/filter
- bulk selection
- question selection bubble
- question composer/workspace
- theme selector
- Safari deferred sticky lifecycle

향후 관리자 자체 UI는 별도 admin component system으로 관리한다.

# V1 신규 후보

현재 photography에 없지만 여러 산업 확장에 필요한 후보:

1. `faq`
2. `pros-cons`
3. `comparison-table`
4. `timeline`
5. `calculator`
6. `image-copy-split`
7. `gallery`
8. `quote-expert`
9. `cta`
10. `location-map`
11. `business-service-list`

Block Lab에서 기존 17개와 중복 여부를 확인한 뒤 V1 포함 여부를 결정한다.
