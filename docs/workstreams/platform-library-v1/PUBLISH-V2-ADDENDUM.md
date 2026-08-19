# Platform Library V1 — Publish V2 Addendum

작성 시점: 2026-08-20
상태: `active`

이 문서는 `TASKS.md`/`HANDOFF.md` 이후 진행된 최신 구현을 보완한다. 새 세션에서는 `AGENTS.md → TASKS.md → HANDOFF.md → 이 파일 → main 최신 commit` 순으로 대조한다.

## 완료된 최신 구현

### Block variant / photography parity

Photography 구조를 공통 advanced variant로 승격:
- `hero / immersive-metrics`
- `chapter-hero / image-overlay`
- `comparison-cards / visual-metrics`
- `roadmap / metric-cards`

Browser/server variant registry에 반영했고 Block Lab candidate renderer가 존재한다.

### Photography Block Style presets

Git source:
- `public/data/block-styles/v1/photography-presets.js`

Google Sheet `BLOCK_STYLE_PRESETS`에도 같은 방향의 photography-derived preset 12개를 `draft`로 seed했다.

주요 preset:
- education scored soft metrics
- numbered checklist card
- case-study visual
- product rail clean stage
- product list grouped rows
- offer pricing cards
- script message bubble
- tutorial preview/preset/detail
- resources curated/official

모두 사용자 승인 전 `draft`; production 승인으로 간주하지 않는다.

### Editor Block Style round-trip

`PAGE_BLOCKS` N/O:
- `style_preset_id`
- `style_overrides_json`

Exact APIs:
- `/api/editor/save-page`: A:O style-aware save/change detection/revision
- `/api/editor/page`: stylePresetId/styleOverrides 복원

Shared browser runtime:
- `public/assets/js/blocks/block-style-runtime.js`
- `public/assets/styles/blocks/style-runtime.css`

Editor:
- current `type + variant`와 일치하는 style preset만 표시
- 선택값은 normal editor field change를 사용
- Canvas immediate preview
- server preset merge
- MutationObserver self-loop 방지

### Page UI / UI Dashboard

UI Dashboard manifest는 photography production parity 기준 V2로 보정.

Photography preset 실제 방향:
- top nav liquid + chapter progress wash
- desktop card rail left shadow runway 16px
- right alpha-mask fade 112px
- right content end padding 122px
- drag threshold 5px
- click suppression 220ms
- collection secondary filter current production = iOS flat
- bottom sheet 760px / 84dvh / top radius 30 / blur 26 / saturate 135
- device handoff measured-height accordion

Google Sheet `UI_PRESETS`에 browser built-in/current preset 8개를 `draft`로 seed했다.

### Immutable publish snapshot V2

New Sheets:
- `PUBLISHED_BLOCK_STYLES`
- `PUBLISHED_UI_CONFIG`

New approval registry:
- `functions/lib/block-approval-v1.js`
- 현재 모든 Block type/variant = `candidate`
- 따라서 production publish는 의도적으로 차단됨

New publish engine:
- `functions/lib/publish-v2.js`

Validation:
- known block type + variant
- canonical variant approval
- factState/evidence
- Block Style preset 존재/type+variant 일치/status approved
- Page UI preset 존재/capability 일치/status approved
- SEO/slug/AI review 상태

Transaction:
1. PUBLISH_SNAPSHOTS `building`
2. PUBLISHED_BLOCKS
3. PUBLISHED_BLOCK_STYLES resolved style
4. PUBLISHED_UI_CONFIG resolved config
5. new snapshot `active`
6. old active `superseded`
7. source page/block published marker

Exact protected endpoints:
- `/api/editor/publish-check`
- `/api/editor/publish`

### Public Snapshot V2

New public read-only API:
- `/api/public/snapshot-v2?slug=`

Returns only active published snapshot:
- snapshot metadata
- published blocks
- each block `stylePresetId` + immutable `resolvedStyle`
- `uiCapabilities` resolved config

Draft is never returned.

New browser runtime source:
- `public/assets/js/public-snapshot/runtime-v2.js`

It can:
- validate/render blocks
- apply immutable `resolvedStyle` through PlatformBlockStyles
- expose published UI capability context
- apply title/description/robots/OG/Twitter/canonical/JSON-LD

Important: existing `/api/public/snapshot` and current public staging route have NOT yet been replaced with V2. V2 must be validated first.

## Still pending

1. Load `runtime-v2.js` + shared style runtime in a staging validation path.
2. Render V2 sample/snapshot and verify PC/mobile.
3. Add production UI capability renderers that consume resolved `uiCapabilities`.
4. After V2 validation, replace/alias old `/api/public/snapshot`.
5. Apply user Block/variant/style/UI preset review to canonical approvals.
6. Do NOT approve candidate automatically.
7. Configure Cloudflare `ADMIN_EDITOR_TOKEN` and perform protected live API QA.
8. Continue video-editor evidence completion.
9. canonical industry route/sitemap/404/CWV/ad side rail.

## Safety reminders

- photography production renderer untouched.
- Safari deferred sticky fix remains invariant.
- native mobile horizontal scroll owner remains invariant.
- photography/system presets seeded in Sheets are `draft`, not approved.
- all canonical Block variants remain candidate.
- live publish should continue to fail until explicit review/approval is recorded.
