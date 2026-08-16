# 05. 콘텐츠 정보구조와 챕터 명세

## CH-000 — 고정 정보구조

V1의 상단 챕터 순서는 아래 10개다. ID, 칩명, 목적을 임의로 바꾸지 않는다.

| 순서 | id | 상단 칩 | 역할 |
|---:|---|---|---|
| 1 | `intro` | 시작 | 생계형 사진 진입 순서 |
| 2 | `market` | 시장 | 먼저 팔리는 분야 비교 |
| 3 | `education` | 교육 | 학위보다 실무 중심 교육 ROI |
| 4 | `skills` | 실무 | 촬영 이후 보정/납품 실무 |
| 5 | `portfolio` | 포트폴리오 | 실제 의뢰처럼 보이는 프로젝트 |
| 6 | `gear` | 장비 | 매출 단계별 장비 구매 |
| 7 | `plan` | 수익 | 12개월 수익 목표 |
| 8 | `scripts` | 영업 | 첫 제안부터 재계약까지 |
| 9 | `iphone` | 아이폰 | 장비 없이 시작하는 촬영 연습 |
| 10 | `sources` | 자료 | 외부 읽을거리/공식 확인 링크 |

각 chapter root는 `section.chapter[data-chapter]` 구조를 유지하고 `data-chapter`와 nav `data-target`이 일치해야 한다.

## CH-001 — 시작 / intro

**Renderer**: `introSection()`

구성:
1. chapter hero
2. section heading
3. `GUIDE_COPY` section `INTRO`

핵심 메시지:
- 사진을 배우는 순서와 돈을 버는 순서는 다를 수 있음.
- 모든 기술을 다 익힌 뒤가 아니라 배우는 동안 포트폴리오/상품/영업 준비를 병행.

## CH-002 — 시장 / market

**Renderer**: `marketSection()`

데이터: `MARKET_TOP3`

기본 3개 시장 비교:
- 제품 / 쇼핑몰 / 브랜드
- 기업 / 전문직 프로필 / 퍼스널브랜딩
- 매장 / 음식 / 공간 B2B 출장

카드 필드:
- 순위
- 분야
- 초보 현실 단가
- 자리 잡은 뒤 목표 단가
- 주요 고객 채널

시장 카드는 단가만 보여주는 표가 아니라 반복 주문과 고객 채널을 함께 판단하도록 설계한다.

## CH-003 — 교육 / education

**Renderer**: `educationSection()`

데이터: `EDUCATION`

우선순위 예:
1. 국비 실무학원 + 현장 어시스턴트
2. 상업사진 워크숍 / 멘토링
3. 독학
4. 사이버대
5. 일반대 사진학과

비교 축:
- 매출 기여
- 시간 효율
- 비용 효율
- 추천 여부

추가 모듈:
- guide copy `EDUCATION`
- 학원 상담 체크 10개

## CH-004 — 실무 / skills

**Renderer authority**: base `skillsSection()`은 `script-12.js`에서 확장형으로 override되고 postload `script-14.js`가 영상 slot을 재정리한다.

데이터: `SKILLS`

카드 구조:
- 실제 작업 맥락 이미지
- 실무 영역
- 필수 기술 설명
- 목표 속도 badge
- 실전 산출물 badge
- 관련 실무 영상 slot

대표 skill category:
- 인물 리터칭
- 제품 리터칭
- 색보정
- 셀렉/납품
- 기타 상업사진 실무

V1은 ‘글만 있는 기술 카드’보다 **구체적인 작업 이미지 + 관련 영상**을 포함하는 현재 확장형을 기준으로 한다.

## CH-005 — 포트폴리오 / portfolio

**Renderer**: `portfolioSection()`

데이터: `PORTFOLIO`

case card:
- 분야 이미지
- 분야 eyebrow
- 예시 프로젝트명
- 설명
- 납품 구성

원칙:
- 단순 사진 gallery가 아니라 고객이 실제 의뢰 결과물을 상상할 수 있는 프로젝트 단위.
- `.case-delivery`는 card bottom에 안정적으로 붙되 별도 카드 pile처럼 보이지 않는다.

## CH-006 — 장비 / gear

**Renderer**: `gearSection()` + `productCards()` / `productTable()` 계열

데이터:
- `EQUIPMENT`
- `PRODUCTS`
- guide `GEAR`

구성:
1. 제품 비교 horizontal cards
2. 장비 관련 guide
3. 추천 제품 상세 설명 row/table

핵심 원칙:
- 처음부터 풀세트 구매 금지.
- 매출/필요가 생길 때 추가.
- 카메라뿐 아니라 조명, 저장, 보정 환경 포함.

장비 row의 `카메라 대안 / 중고 우선 / 시작 전` 같은 meta badge는 공용 content badge의 기준 사례다.

## CH-007 — 수익 / plan

**Renderer**: `planSection()` / `phaseCards()`

데이터: `ACTION_PLAN`

phase card:
- 기간
- 순이익 목표
- 월매출 목표
- 평균 객단가
- 핵심 행동

메시지:
- 전체 수익 흐름을 카드로 빠르게 파악.
- 하단 guide에서 계산과 이유를 자세히 읽음.

## CH-008 — 영업 / scripts

**Renderer**: `scriptsSection()`

데이터: `SCRIPTS`, guide `ACTION`

script card:
- 상황
- 채널
- 사용 시점
- 목적
- 복사 가능한 실제 문구

`복사` action은 clipboard 기능을 유지한다.

## CH-009 — 아이폰 / iphone

**Renderer**: `iphoneSection()`

데이터:
- `PHOTO_LESSONS`
- `CAMERA_PRESETS`

구성:
1. lesson preview rail
2. 상황별 시작값 preset rail
3. 상세 lesson 반복

상세 lesson fields:
- 태그
- 제목
- 한줄설명
- 촬영 설정
- 찍는 순서
- 자주 망하는 이유
- 오늘 해볼 것
- 모델주의
- 공식 출처 URL 가능

핵심:
- 장비를 사기 전에 초점, 노출, 거리, 빛을 연습.
- iOS 버전/지원 모델에 따른 차이를 copy에서 과도하게 확정하지 않는다.

## CH-010 — 자료 / sources

**Renderer**: `sourcesSection()`은 후속 `script-6.js`에서 확장된다.

두 블록:
1. `더 읽어볼 촬영 팁` — curated external article rail
2. `공식 확인 링크` — `SOURCES` 데이터 기반 source card

외부 article은 Brunch/Tistory 탐색과 SEO metadata를 활용한다.

공식 source 예:
- 커리어넷
- 고용24
- 숨고/크몽 가격 참고
- 카메라/렌즈/조명 제조사
- Apple iPhone 공식 가이드

## CH-GUIDE-001 — Guide module type: prose

제목 + paragraph body + optional `핵심` guide-key.

## CH-GUIDE-002 — flow

flow row sequence를 compact step system으로 표시한다. 후속 `script-12.js` override 시 refined flow가 authority다.

## CH-GUIDE-003 — ranking

flow와 유사하나 우선순위 의미를 강조하고 optional 선택 기준 callout을 추가한다.

## CH-GUIDE-004 — metrics

metric grid + optional 핵심 callout.

## CH-GUIDE-005 — card

offer card horizontal rail + optional 첫 달 기준 callout.

## CH-GUIDE-006 — warning

초반 보류/주의 성격. outer group surface 안에 guide key를 둘 수 있다.

## CH-GUIDE-007 — callout

callout card + optional soft `메모` guide-key.

## CH-DATA-001 — 콘텐츠는 데이터 우선

하드코딩된 fallback copy는 API/Sheet 실패 시 사용될 수 있으나 정상 경로는 Google Sheets → `/api/site-data`다.

따라서 chapter 콘텐츠를 바꿀 때:
- 구조/표현 방식 변경이면 renderer/spec 수정.
- 문구/값 변경이면 Sheet/data 수정이 우선.

## CH-IMG-001 — 이미지 용도

fallback image key:
- hero
- intro
- product
- profile
- food
- education
- skills
- portfolio
- gear
- plan
- scripts
- iphone
- night
- macro
- edit

후속 generated images:
- `client_review`
- `product_studio`
- `retouch_workstation`

동일 이미지를 문맥 없이 반복 적용하지 않는다. generated asset은 해당 작업 예시 맥락에 맞춰 mapping한다.

## CH-REG-001 — 챕터 회귀 정의

회귀로 판단:
- 10개 nav 정보구조가 이유 없이 변경됨.
- chapter id와 nav target 불일치.
- horizontal rail가 vertical list로 임의 변경.
- skill 이미지/영상 확장 기능 삭제.
- portfolio를 단순 사진 gallery로 축소.
- sources의 curated와 official block 중 하나가 사라짐.
- 콘텐츠 문구만 바꾸기 위해 renderer에 하드코딩이 추가됨.
