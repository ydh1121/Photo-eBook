# Platform Library V1 Tasks

Workstream: `platform-library-v1`
Status: `active`
Production branch: `main`
Current implementation branch: `feat/visual-builder-dashboard`

Legend: `[x] done` / `[-] active or review` / `[ ] pending`

## Architecture

[x] Content Block type / Block variant / Block Style preset 분리
[x] UI Capability / UI Capability preset 분리
[x] Shared Primitive / industry-specific logic 분리 원칙
[x] raw CSS를 preset data로 저장하지 않는 원칙
[x] photography production을 parity source로 유지
[x] Visual Builder 방향 확정: 실제 페이지가 UI 조정/블록 조립 canvas

Permanent Visual Builder contract:
- `docs/library/ui-capabilities/VISUAL-BUILDER.md`
- `docs/library/ui-capabilities/PHOTOGRAPHY-PARITY.md`

## Block Registry / Block Lab

[x] 27개 기존 Block type registry
[x] advertisement candidate 추가 → 총 28개
[x] advertisement variants: inline-banner / native-card / desktop-side-rail / sticky-bottom
[x] Block Lab type review + memo
[x] variant review + memo + difference taxonomy
[x] constrained Block Style preset + lifecycle/server sync
[x] photography advanced variants: hero/immersive-metrics, chapter-hero/image-overlay, comparison-cards/visual-metrics, roadmap/metric-cards
[-] 사용자 실제 디자인 검토
[ ] advertisement 4 variant 실제 페이지 문맥 디자인 검토
[ ] 승인/재설계/통합/폐기 결정 저장
[ ] approved block/primitive만 production/shared source 승격

Live approval checkpoint:
- BLOCK_VARIANT_REVIEWS: 사용자 승인 전 자동 승인 금지
- photography Block Style preset: draft 유지
- advertisement: candidate 유지

## Visual Builder / UI Dashboard

Route: `/ui-dashboard/`
Status: noindex / review surface / production state non-mutating

[x] 기존 specimen 중심 3-pane dashboard 제거 방향 적용
[x] same-origin 실제 `/photography/`를 full live canvas로 사용
[x] 7 UI capability를 actual production selector에서 탐지
[x] PC hover gear → floating inspector
[x] 여러 inspector 동시 open
[x] floating inspector drag 이동 + explicit close
[x] 설정 변경을 actual iframe DOM에 dashboard override로 즉시 반영
[x] 모바일 tap inspector + bottom dock 구조
[x] actual page block drag/drop sandbox composer
[x] 현재 조립 순서 browser draft 저장
[x] advertisement block live sandbox 삽입
[x] Block Registry 기반 block palette
[x] 통합 관리 메뉴: 페이지 편집 / UI 라이브러리 / Block Lab / Page Editor / QA
[x] bare-surface UI library: actual source clone + capability category filter
[x] capability별 수정 요청 메모 local 저장
[x] 관리자 연결 시 수정 요청을 기존 `UI_PRESETS.notes`로 Sheet 저장
[-] 실제 배포 환경에서 PC Visual Builder 조작 QA
[-] 실제 모바일에서 tap/dock/native scroll 충돌 QA
[-] actual production의 늦게 생성되는 UI(filter/sheet/device handoff) 탐지 QA
[-] actual `#app` DOM에서 block drag 후보 단위가 의미 블록과 정확히 일치하는지 QA
[ ] approved Block Lab renderer를 builder palette 실제 block renderer로 연결
[ ] generic UI capability public runtime expansion은 사용자 승인 뒤 진행

Current UI Capability inventory:
1. top-chapter-navigation
2. horizontal-card-rail
3. filter-chip-rail
4. collection-bottom-sheet
5. device-handoff-accordion
6. reading-progress
7. floating-action

Safety:
- photography renderer 교체 금지
- mobile native horizontal scroll owner 유지
- Safari deferred sticky safety 유지
- Dashboard/Builder에서 production state 직접 변경 금지
- 사용자 승인 전 UI preset 자동 승인 금지

## Photography parity

[x] photography-extracted UI는 actual production source parity로 판정
[x] actual source selectors/owners 추출
[x] filter-chip은 actual `.collection-filter`가 기준이며 segmented tab mock과 분리
[x] actual source를 별도 mockup으로 다시 그려 parity라고 부르지 않는 규칙
[-] Visual Builder에서 7 capability actual source 탐지/설정 결과 사용자 확인
[-] Safari browser chrome 의존 deferred-sticky는 실제 `/photography/` full page 최종 QA
[ ] 승인된 shared primitive source로 photography consumer migration

## Page Editor / publish

[x] Editor block add/reorder/drag
[x] Page UI/style/SEO/AI/media/revisions/snapshot preview/rollback 기반 기능
[x] Snapshot V2 immutable publish data
[x] active Snapshot V2 canonical route + 404/sitemap 구조
[-] approved-only production Editor mode는 사용자 approval 이후
[ ] `ADMIN_EDITOR_TOKEN` production secret 설정
[ ] authenticated Editor → publish → canonical → rollback live QA
[ ] Cloudflare canonical/404/sitemap smoke test

## First non-photography QA

Page: `page_video_editor_qa_v1`
Slug: `video-editor`
State: draft / noindex / needs_review

Routes:
- `/qa/video-editor/`
- `/staging/public-renderer/`
- `/staging/snapshot-v2.html`

[-] 사용자 content/design review
[ ] production publish 승인

## Final QA / V1 exit

[ ] Visual Builder PC/mobile live review
[ ] Block/variant/style preset final user decisions
[ ] UI Capability/preset final user decisions
[ ] advertisement placement/responsive policy approval
[ ] one non-photo draft → AI → human review → publish → rollback
[ ] PC/mobile/CWV regression
[ ] PC ad side rail QA
[ ] workstream QA Drive archive

## Exact next action

1. `feat/visual-builder-dashboard`의 `/ui-dashboard/`를 실제 배포 preview에서 열어 photography canvas load를 확인한다.
2. PC에서 상단 메뉴 / 가로 rail / filter / bottom sheet / device handoff / progress / FAB gear와 다중 floating inspector를 검수한다.
3. 모바일에서 편집 모드 tap inspector, bottom dock, native horizontal scroll 충돌을 검수한다.
4. 실제 page block drag/drop 후보 단위를 확인하고 필요하면 production block boundary metadata를 추가한다.
5. Block Lab에서 advertisement 4 variant를 실제 콘텐츠 문맥 기준으로 정제한다.
6. 사용자 결정만 approved/redesign/deprecated로 저장한다. 자동 승인하지 않는다.
7. approved Block Lab source를 Visual Builder palette 실제 renderer에 연결한다.
8. `UI_PRESETS.notes`의 수정 요청을 GPT가 읽어 source 변경으로 반영하는 workflow를 검증한다.
