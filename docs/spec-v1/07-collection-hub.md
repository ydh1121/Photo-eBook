# 07. 내 모음(Collection Hub) 기능 명세

## COLL-001 — 목적

`내 모음`은 저장한 영상, 읽을거리, 질문을 한 화면에서 관리하는 통합 허브다. 별도의 페이지가 아니라 페이지 위에 열리는 persistent bottom sheet다.

## COLL-002 — canonical DOM 생성

현재 base UI는 postload `script-14.js`의 `ensureLibraryUi()`가 동적으로 만든다.

필수 DOM:

- `#collectionLayer`
- `#collectionFab`
- `#collectionFabCount`
- `#collectionBackdrop`
- `#collectionSheet`
- `.collection-handle-wrap`
- `.collection-handle`
- `.collection-head`
- `#collectionClose`
- `.collection-tabs`
- `#collectionTools`
- `#collectionSearch`
- `#collectionFilters`
- `#collectionBody`

## COLL-003 — FAB

`#collectionFab`:

- 오른쪽 하단 persistent floating action button.
- clipboard/list 계열 icon 사용.
- 저장 개수가 0보다 크면 count badge 표시.
- click 기본 진입은 `전체` tab.
- Safari safe bottom을 고려하되 과도하게 위로 올리지 않는다.

## COLL-004 — count

FAB count는:

`영상 저장 ID 수 + 읽을거리 저장 ID 수 + 질문 수`

의 총합이다.

## COLL-005 — sheet open

`openLibrary(tab='all')`의 계약:

1. UI가 없으면 생성.
2. requested tab으로 state 변경.
3. 해당 primary tab에 `.is-active`.
4. sheet/backdrop hidden 해제.
5. 다음 animation frame에 `.is-open`.
6. background scroll lock.
7. library render.

## COLL-006 — sheet close

`closeLibrary()`:

- `.is-open` 제거.
- 약 190ms close transition 후 hidden.
- backdrop hidden.
- document scroll 복원.

close 중 갑자기 중앙 popup이 되거나 bottom gap이 생기면 회귀다.

## COLL-007 — drag close

handle을 아래로 drag:

- start y 저장
- positive delta만 sheet `--drag-y`에 적용
- 약 `86px` 초과하면 close
- drag 종료 시 custom property 제거

body content 스크롤 gesture와 handle drag를 구분한다.

## COLL-008 — Primary tab

값:

- `all`
- `video`
- `article`
- `question`
- `settings`

UI label:

- 전체
- 영상
- 읽을거리
- 질문
- 설정

primary tab 전환 시 secondary filter는 기본 `all`로 reset된다.

## COLL-009 — Search

`#collectionSearch`는:

- 영상/읽을거리/질문의 title, meta, summary, selected text 등에서 case-insensitive 검색.
- 질문 탭에서도 계속 보여야 함.
- settings tab에서는 tools를 숨길 수 있음.

placeholder: `저장한 항목 검색`.

## COLL-010 — Secondary filters

video tab:
- 저장 item category unique values.

article tab:
- platform unique values.

all/question/settings:
- 일반 category filter 없음.

filter DOM은 `.collection-filter`.

## COLL-011 — Question secondary controls

question tab은 일반 `.collection-filter` 대신 `#v40QuestionControls`를 사용한다.

search와 같은 tool rail에 배치되며:
- search outer rail edge와 좌우 기준 정렬.
- 중복 legacy selector 금지.
- 질문 작성/저장 목록을 전환.

## COLL-012 — allSavedItems ordering

합쳐지는 item:

- video snapshot
- article snapshot
- question

정렬은 `savedAt` 또는 `created_at`의 최신순 문자열 비교를 기본으로 한다.

## COLL-013 — Video saved item

필드 예:
- id
- title
- url
- thumbnail
- category
- channel
- savedAt

list card는 thumb + main copy + remove action.

## COLL-014 — Article saved item

필드 예:
- id
- title/og_title
- url
- thumbnail_url
- platform
- summary/description
- savedAt

## COLL-015 — Question saved item

list card:

- Q icon
- type `질문`
- question title/body
- selected quote preview
- created time
- remove action

question card를 열면 current question composer에 불러온다.

## COLL-016 — Empty state

`collection-empty`는 tab/검색에 맞는 설명을 제공한다.

예:
- 영상: 실무 영상 북마크 사용 안내
- 읽을거리: 글 북마크 사용 안내
- 질문: 본문 문장 선택 후 질문 저장 안내
- 검색: 검색 결과 없음

빈 상태에 unrelated CTA/card를 추가하지 않는다.

## COLL-017 — Remove single item

video/article:
- favorites ID set과 snapshot에서 제거.
- 원본 card bookmark state 동기화.

question:
- local question array에서 삭제.
- device ID가 있으면 remote `deleteQuestionHistory` 시도.

## COLL-018 — Settings tab

표시 내용:

- total saved count
- video count
- article count
- question count
- `다른 기기에서 이어보기`
- local-only video/article 관련 note

settings에서 장황한 계정 시스템으로 확장하지 않는다. 현재 device link 수준이 V1.

## COLL-019 — Device link

`openQuestionSettings()`는 기존 question settings UI를 재사용한다.

현재 흐름은 collection close → legacy/current question UI open → history/settings 진입 형태의 compatibility bridge다.

재구축 시 같은 사용자 기능은 유지하되 이 click choreography 자체는 필수 아키텍처가 아니다.

## COLL-020 — Scroll lock

기준 `script-14.js`는 open 시:

- html/body `collection-open`
- lockedY 기억
- body top negative value

close 시 class/top 제거 후 scroll restore.

후속 CSS 중 일부는 body position을 다시 static 처리한다. 이 중복은 KNOWN DEBT다. Safari 문제를 이유로 root lock 방식을 반복 실험하지 않는다.

## COLL-021 — Backdrop

- background page click/touch 차단.
- backdrop click으로 close.
- touchmove preventDefault.

Safari bottom toolbar tint 문제를 고치기 위해 backdrop을 임의의 거대한 opaque fixed plate로 확장하지 않는다.

## COLL-022 — Bulk select entry

일괄 선택 모드는 `.collection-select-toggle`로 진입한다.

- 평상시 `선택`
- active 시 `완료`
- question write mode에서는 toggle을 숨길 수 있음.

## COLL-023 — Bulk grid geometry

bulk mode는 각 card의 첫 column에 실제 selection checkbox column을 만든다.

media item:
- select
- thumbnail
- main text

question item:
- select
- Q icon
- main text

remove button은 bulk mode에서 숨기고 bottom bulkbar가 삭제 action을 소유한다.

## COLL-024 — Selection box

`.collection-selectbox`:

- circle
- unselected neutral
- selected blue gradient + check
- `aria-pressed` 동기화
- card 위 absolute overlay가 아니라 grid cell로 배치

## COLL-025 — Bulk bottom bar

`.collection-bulkbar`:

- 전체 선택
- 선택 count
- 삭제

삭제 버튼 disabled state 명확.

## COLL-026 — Bulk persistence through rerender

filter/search/tab 변경으로 list가 rerender돼도 bulk mode geometry가 깨지지 않아야 한다. 현재 script19/script24/script25에 repair 코드가 존재한다.

새 구현에서는 repair-after-rerender가 아니라 render state에서 직접 selection UI를 생성하는 것이 바람직하나 최종 동작은 동일해야 한다.

## COLL-027 — Swipe removal

과거 question/action polish에서 swipe delete가 추가된 세대가 있으나 bulk select가 primary mass-management UX다. swipe gesture를 확대해 horizontal page/rail gesture와 충돌시키지 않는다.

## COLL-028 — Layer pointer events

최종 `#collectionLayer`는 투명 wrapper로 pointer-events none을 가질 수 있고 FAB/backdrop/sheet만 pointer-events auto.

목적:
- invisible wrapper가 전체 페이지 interaction을 먹지 않음.

## COLL-029 — Popup visual identity

MUST:
- bottom sheet
- rounded top corners
- handle
- title `내 모음`
- glass primary tab rail
- independent scroll body

MUST NOT:
- 화면 중앙 alert/dialog 형태
- full-page navigation replacement
- 하단과 의도치 않은 gap

## COLL-030 — canonical item storage

collection은 자체 backend database를 별도로 갖지 않는다.

- video/article: localStorage ID + snapshot
- question: localStorage + optional Google Sheet sync

## REG-COLL-001 — 회귀 체크

다음은 실패:

- FAB가 safe area보다 과하게 위로 이동.
- sheet가 중앙에 뜸.
- sheet bottom에 메인 페이지가 보이는 gap.
- primary tabs 중복 indicator.
- 질문 tab에서 search 사라짐.
- question secondary selector가 search보다 좌우폭 다름.
- bulk select 시 Q/thumb/text가 겹침.
- 삭제 후 FAB count가 갱신되지 않음.
- popup close 후 원래 scroll position이 크게 달라짐.
