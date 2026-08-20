# Platform Library V1 Handoff

이 파일은 새 채팅/세션에서도 현재 작업을 추측 없이 이어가기 위한 canonical handoff다.

## Canonical status

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Tracker: `docs/workstreams/platform-library-v1/TASKS.md`

새 세션은 반드시 `AGENTS.md → TASKS.md → 이 HANDOFF.md → main 최신 commit` 순서로 읽는다.

## Current architecture

콘텐츠/UI 관리는 다음 계층으로 분리한다.

1. Content Block type
2. Block variant
3. Block Style preset
4. UI Capability
5. UI Capability preset
6. Shared Primitive
7. Industry/content-pack specific logic

raw CSS를 preset 데이터로 저장하지 않는다.

## Photography parity — current source-of-truth rule

2026-08-20 사용자 피드백으로 parity 기준을 강화했다.

photography-extracted UI preset은 **실제 photography production과 100% source parity**를 기준으로 판정한다.

금지:
- photography UI를 비슷하게 다시 그린 mockup을 원본 parity라고 부르기
- 공통화 과정에서 달라진 specimen을 photography 원본으로 승인하기
- photography production과 generic experiment를 같은 미리보기 의미로 섞기

Permanent contract:
- `docs/library/ui-capabilities/PHOTOGRAPHY-PARITY.md`

Long-term migration:
`photography production owner → approved shared primitive/capability 추출 → photography와 신규 산업이 같은 shared source 사용`

초기에는 production owner를 유지한다. shared-source 승격과 photography consumer 전환은 사용자 승인 + 회귀 QA 이후에만 한다.

## UI Dashboard — exact production parity mode

Route: `/ui-dashboard/`
Status: noindex / review surface.

Dashboard에는 두 preview 기준이 있다.

### 1. 사진 페이지 원본

기본값.

- same-origin `/photography/`를 iframe으로 실제 로드
- production DOM/CSS/JavaScript를 그대로 사용
- 원본과 다르면 Dashboard approximation 문제가 아니라 parity bug로 취급
- iframe 안에서 실제 scroll/click/drag/popup/accordion 동작 가능
- 확인 폭: 현재 폭 / 모바일 390 / PC 1180
- `원본 페이지에서 보기`로 전체 production도 즉시 열 수 있음

자동 focus:
- top-chapter-navigation → actual `.nav-shell`
- horizontal-card-rail → actual `.desktop-rail-window` / `.scroll-row`
- collection-bottom-sheet → actual `#collectionFab` → `#collectionSheet`
- filter-chip-rail → actual collection video tab/filter state
- device-handoff-accordion → actual settings → `#collectionDeviceLink` / `.collection-device-accordion`
- reading-progress → actual page scroll + chapter/read progress
- floating-action → actual `#collectionFab`

원본 filter는 사용자의 실제 저장 데이터에 분류값이 없으면 표시되지 않을 수 있다. 이것도 production state 그대로다.

Safari 주소창 축소와 연동되는 deferred-sticky처럼 top-level browser chrome에 의존하는 동작은 iframe과 환경이 다르므로 실제 `/photography/` 전체 화면에서 최종 QA한다.

Relevant files:
- `public/assets/js/ui-dashboard/production-parity-v1.js`
- `public/assets/styles/ui-dashboard/production-parity-v1.css`
- `public/ui-dashboard/index.html`

### 2. 범용 실험

- 기존 interactive specimen을 유지
- 설정 변경 즉시 preview 반영
- 한글 상태명만 사용자 화면에 노출
- 내부 API/storage enum은 영문 ID 유지
- photography 원본과 동일하다고 주장하지 않음
- 공통 capability로 확장할 configurable version을 검토하는 용도

사진 원본 mode에서는 실험 controls를 잠금 표시한다. 설정을 바꾸려면 `범용 실험`으로 전환한다.

## UI Capability inventory

1. top-chapter-navigation
2. horizontal-card-rail
3. filter-chip-rail
4. collection-bottom-sheet
5. device-handoff-accordion
6. reading-progress
7. floating-action

Storage/API:
- `UI_PRESETS`
- `/api/editor/ui-presets`
- `PAGE_UI_CONFIG`
- `/api/editor/page-ui`
- immutable publish: `PUBLISHED_UI_CONFIG`

Built-in photography/system UI preset 8개는 live Sheet에서 모두 `draft`. 자동 승인 금지.

Public runtime:
- horizontal-card-rail generic surface 적용 완료
- reading-progress generic surface 적용 완료
- top chapter nav / bottom sheet / filter 등은 generic surface/data contract가 승인되기 전 production public runtime에 임의 생성하지 않는다.

## Block Lab / approval state

Route: `/block-lab/`
Status: candidate / noindex.

- 27 Block type
- type review + memo
- variant review + memo
- difference taxonomy
- constrained Block Style preset
- style lifecycle + server sync

Photography advanced variants:
- `hero / immersive-metrics`
- `chapter-hero / image-overlay`
- `comparison-cards / visual-metrics`
- `roadmap / metric-cards`

Live Sheet approval checkpoint:
- `BLOCK_VARIANT_REVIEWS`: review row 0개
- photography Block Style presets 12개: 전부 draft
- UI presets 8개: 전부 draft

따라서 사용자 review 전 production publish는 계속 차단한다.

## Snapshot V2 / public route

Canonical publish:
- `functions/lib/publish-v2.js`
- `functions/api/editor/publish-check.js`
- `functions/api/editor/publish.js`

Immutable storage:
- `PUBLISH_SNAPSHOTS`
- `PUBLISHED_BLOCKS`
- `PUBLISHED_BLOCK_STYLES`
- `PUBLISHED_UI_CONFIG`

Public:
- active Snapshot V2 only `/:slug/`
- draft/unknown slug real 404
- active + indexable dynamic sitemap
- `/` and `/photography/` keep legacy photography renderer
- server visible semantic fallback + client enhancement

## First non-photography QA

Page: `page_video_editor_qa_v1`
slug: `video-editor`
state: draft / noindex / needs_review
13 Sheet blocks.

Review routes:
- `/qa/video-editor/`
- `/staging/public-renderer/`
- `/staging/snapshot-v2.html`

Evidence for Adobe/Blackmagic/고용24/크몽/KOCCA/국세청/한국저작권위원회/크몽 약관 already connected. 가격은 평균/실거래가가 아니라 확인일 기준 개별 공개 등록가 예시로만 사용한다.

## Editor / auth

Editor supports Block/Page UI/style/SEO/AI/media/revisions/snapshot preview/rollback.

Protected APIs require same-origin + Bearer `ADMIN_EDITOR_TOKEN`.
Token 미설정 시 closed.

Cloudflare live authenticated QA는 아직 token secret 설정이 필요하다.

## COPY_GUIDE additions

Live Sheet에 다음 규칙이 추가됐다.
- UI Dashboard 실시간 미리보기
- UI 설정 한글 표시
- 사진 원본 parity
- UI Dashboard 비교 모드

## Validation state

- UI Dashboard JS/CSS는 workflow trigger/syntax 범위에 포함됨
- current execution container는 GitHub DNS 문제로 local clone/node check를 실행하지 못함
- GitHub combined status가 workflow context를 노출하지 않아 Actions success를 추정하지 않음
- same-origin framing은 current `X-Frame-Options: SAMEORIGIN`과 맞음
- `/photography/ → /index.html` 정적 rewrite 유지

## Production safety invariants

- photography production renderer를 candidate로 교체하지 않는다.
- photography parity baseline을 mockup으로 대체하지 않는다.
- Safari deferred sticky fix를 건드리지 않는다.
- mobile native horizontal scroll owner 유지.
- 사용자 review 전 자동 승인 금지.
- labs/dashboard/QA/staging noindex.
- UI Dashboard는 production state를 직접 변경하지 않는다.
- photography 원본 mode는 read/interact reference이며 generic experiment와 분리한다.

## Exact next action

1. `/ui-dashboard/`에서 각 capability의 `사진 페이지 원본` mode를 mobile/PC로 실제 확인.
2. 원본 mode에서 자동 focus가 빗나가거나 actual production interaction이 보이지 않는 capability를 수정.
3. 같은 capability의 `범용 실험`을 원본과 비교하고, 공통화할 설정만 남김.
4. `/block-lab/` + `/qa/video-editor/` review.
5. user decision을 approved/redesign/deprecated로 저장. 자동 승인 금지.
6. 승인 후 shared source 추출 순서를 정하고 production Editor approved-only mode 활성화.
7. `ADMIN_EDITOR_TOKEN` 설정 후 Editor→publish→canonical→rollback live QA.
8. PC/mobile/CWV/ad side rail QA.
9. V1 승인 후 workstream QA Drive archive.

## Current review URLs

- `/ui-dashboard/` — `사진 페이지 원본` + `범용 실험`
- `/block-lab/` — Block/variant/style preset
- `/qa/video-editor/` — 비사진 전체 흐름
- `/staging/snapshot-v2.html` — public Snapshot V2

## V1 completion target

- Block/variant/style preset final approval
- UI Capability/preset dashboard real use
- photography parity exact-source baseline
- approved shared-source migration path
- Editor compose/save/restore
- one non-photo industry draft→AI→human review→publish→rollback
- public renderer/canonical/SEO/sitemap/404
- PC/mobile/CWV/ad side rail QA
- workstream QA Drive archive
