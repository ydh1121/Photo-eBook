# 07. 내 모음(Collection Hub) 기능 명세

## COLL-001 — 목적

`내 모음`은 저장한 영상, 읽을거리, 질문과 설정을 한 화면에서 관리하는 persistent bottom sheet다. 별도 페이지로 분리하지 않는다.

## COLL-002 — canonical DOM owner

Postload owner: `assets/js/collection/collection-hub.js`

필수 DOM family:
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

`assets/js/app/postload-enhancements.js`가 app first paint 이후 이 owner를 동적으로 로드한다.

## COLL-003 — FAB

`#collectionFab`:
- 오른쪽 하단 persistent action.
- 저장 개수가 0보다 크면 count badge 표시.
- 기본 진입은 `전체` tab.
- safe bottom을 고려하되 과도하게 위로 올리지 않는다.

FAB count는 `영상 저장 수 + 읽을거리 저장 수 + 질문 수`의 총합이다.

## COLL-004 — open / close

Open:
1. UI가 없으면 생성.
2. requested primary tab 적용.
3. active tab class 동기화.
4. sheet/backdrop 표시.
5. open animation.
6. background scroll lock.
7. library render.

Close:
- open state 제거.
- transition 후 sheet/backdrop hidden.
- document scroll 복원.
- stale root/body lock 제거.

bottom sheet가 중앙 floating modal로 바뀌거나 bottom gap이 생기면 회귀다.

## COLL-005 — drag close

handle drag는 body content scroll과 분리한다.

- positive y delta만 sheet drag에 적용.
- 충분한 threshold 이후 close.
- drag 종료 시 temporary transform/custom property 정리.

## COLL-006 — Primary tabs

State/label:
- `all` — 전체
- `video` — 영상
- `article` — 읽을거리
- `question` — 질문
- `settings` — 설정

primary tab 전환 시 일반 secondary filter state는 기본값으로 정규화한다.

moving indicator owner는 `assets/js/ui/liquid-controller.js`다.

## COLL-007 — Search / filters

`#collectionSearch`:
- 영상/읽을거리/질문의 title/meta/summary/selected text 등에서 검색.
- 질문 tab에서도 유지.
- settings에서는 tools를 숨길 수 있음.
- placeholder `저장한 항목 검색` family 유지.

Secondary filter:
- video — 저장 item category.
- article — platform.
- all/question/settings — 일반 category filter 없음.

## COLL-008 — Question secondary workspace

question tab에서는 일반 `.collection-filter` 대신 question workspace를 사용한다.

Owner: `assets/js/questions/question-workspace.js`

- `질문 작성하기`
- `저장한 질문`

두 mode를 제공한다.

규칙:
- search와 같은 tool/content edge 정렬.
- 중복 legacy selector 금지.
- write mode에는 composer만.
- saved mode에는 저장 질문 list.

## COLL-009 — Saved item ordering

합치는 item:
- video snapshot
- article snapshot
- question

기본 정렬은 `savedAt` 또는 `created_at` 최신순이다.

## COLL-010 — Saved item contract

Video 예:
- id
- title
- url
- thumbnail
- category
- channel
- savedAt

Article 예:
- id
- title/og_title
- url
- thumbnail_url
- platform
- summary/description
- savedAt

Question 예:
- id
- selected text/quote
- question
- created time

question card를 열면 current question composer로 복원한다.

## COLL-011 — Empty states

현재 tab/search 상태에 맞는 설명만 제공한다.

관련 없는 CTA/card를 empty state에 추가하지 않는다.

## COLL-012 — Remove single / bulk

Single remove:
- video/article — favorite ID set + snapshot 제거, source bookmark UI sync.
- question — local question 삭제, device id가 있으면 remote delete 시도.

Bulk owner: `assets/js/collection/bulk-selection.js`

- edit/select toggle.
- selected card state.
- bulk count/delete.
- 삭제 후 local/snapshot/FAB count 갱신.

## COLL-013 — Settings

표시 family:
- total saved count
- video/article/question count
- light/dark/system
- `다른 기기에서 이어보기`
- local-only video/article 관련 안내

현재 device link 수준을 계정 시스템으로 임의 확장하지 않는다.

## COLL-014 — Device handoff

Primary owner: `assets/js/collection/device-handoff.js`

Compatibility helper: `assets/js/collection/device-handoff-compat.js`

기능:
- 현재 device sync key 복사.
- 다른 기기 key 입력/연결.
- QUESTION_HISTORY를 같은 device id로 이어보기.

시각/상호작용은 `modules/MOD-ACC-001-inline-disclosure-accordion.md`를 따른다.

accordion state source는 trigger의 `aria-expanded`이다.

과거 `collection close → 별도 question modal → settings` bridge는 canonical UX가 아니다.

## COLL-015 — Modal interaction shield

`assets/js/collection/modal-shield.js`가 open collection sheet의 outside interaction을 제어한다.

- sheet 내부 click/touch는 정상 작동.
- backdrop/outside dismiss contract 유지.
- hidden backdrop이 pointer event를 먹지 않음.

## COLL-016 — iOS Safari 관계

최초 주소영역 background 문제의 직접 원인은 collection popup이 아니었다. 이를 고치기 위해 collection/FAB/question UI를 숨기지 않는다.

Safari initial chrome fix는 `10-theme-and-safari.md`의 root + deferred sticky nav 규칙이 authority다.

## COLL-017 — 변경 규칙

- 전체 `#app` rerender로 collection을 복구하지 않는다.
- collection base state를 새 parallel modal owner로 복제하지 않는다.
- bulk/question/device state는 각 semantic owner에 맡긴다.
- mobile bottom-sheet geometry는 명시적 요청 없이 변경하지 않는다.
