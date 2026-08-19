# Approval / Public Route QA Checkpoint — 2026-08-20

## Approval data

Live Google Sheet 기준:

- `BLOCK_VARIANT_REVIEWS`: header only, 저장된 review row 0개
- `BLOCK_STYLE_PRESETS`: photography preset 12개, 현재 status 전부 `draft`
- `UI_PRESETS`: photography/system preset 8개, 현재 status 전부 `draft`

따라서 현재 어떤 Block variant / Block Style preset / UI preset도 자동으로 `approved` 처리하지 않는다.

`functions/lib/publish-v2.js`는 `BLOCK_VARIANT_REVIEWS`의 실제 저장 판정을 우선 읽고, review row가 없으면 static candidate 상태로 fallback한다. 즉 사용자 review 전에는 production publish가 차단되는 상태가 의도된 동작이다.

## Canonical route QA coverage

Implemented:

- active Snapshot V2 only `/:slug/`
- draft/unknown slug real 404
- active slug trailing-slash redirect
- `/` + `/photography/` legacy photography renderer preservation
- dynamic active/indexable sitemap
- server-rendered semantic fallback
- client enhancement with immutable Snapshot V2 payload
- no production debug status chrome
- public calculator/copy interaction bundle
- internal lab/QA/staging noindex/no-store

CI additions:

- `scripts/check-public-route-v2.mjs`
- canonical/meta/static fallback/comparison labels/FAQ/resources/JSON script-boundary escaping/404 assertions
- `.github/workflows/platform-library-checks.yml` runs the script and syntax-checks root Functions
- `_headers` is included in workflow path triggers

## Remaining external verification

Not yet verified as successful:

- GitHub push workflow conclusion: connector does not expose push workflow runs/check-runs for this repository
- Cloudflare Pages live canonical `/:slug/` response
- live 404 HTTP status
- live `/sitemap.xml` response
- `_routes.json` behavior in deployed Pages environment
- authenticated Editor flow because `ADMIN_EDITOR_TOKEN` live QA is not available in the current tool context

Do not infer any of the above as passed.

## Human checkpoint

Next approval work requires actual user review of:

- `/block-lab/`
- `/ui-dashboard/`
- `/qa/video-editor/`
- optionally `/staging/snapshot-v2.html` for public-runtime appearance

Only after that review should variant/style/UI statuses be saved as `approved`, `redesign`, or `deprecated`.
