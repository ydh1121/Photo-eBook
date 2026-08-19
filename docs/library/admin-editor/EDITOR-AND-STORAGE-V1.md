# Admin Block Editor + Storage Architecture V1

## 목적

산업 분야를 추가하고 기본 블록을 배치한 뒤, 실제 화면을 보면서 순서·문장·이미지·속성을 수정할 수 있는 관리자 편집 환경을 만든다.

광고 기반 공개 콘텐츠 플랫폼을 전제로 하되, 초기에는 운영자가 적고 콘텐츠 수정 빈도가 관리 가능한 수준이라고 본다.

## 현재 구현

실험 route:
- `/editor-lab/`
- `noindex,nofollow,noarchive`
- production renderer와 분리

현재 기능:
- 27개 candidate block library/search
- block 추가, drag-and-drop, 위/아래 이동, 복제/삭제
- variant와 block content 편집
- block AI policy / field lock / fact state
- Light/Dark
- 390/768/1180 preview
- 편집/미리보기 전환
- undo/redo
- JSON import/export
- 산업 ID / slug / SEO metadata
- page brief / AI request export / AI response import
- 이미지 asset picker
- block revision history 조회/브라우저 복원
- 발행 검사 / snapshot publish action
- localStorage offline/local draft
- 선택적 Google Sheets server draft 저장/불러오기

localStorage는 제품 DB가 아니다. 서버 연결이 없어도 UI를 편집할 수 있는 local/offline draft fallback이다.

## V1 저장 역할 분리

### Google Sheets — 구조화된 콘텐츠 DB

현재 프로젝트가 이미 Google Sheets와 service account 경로를 사용하므로 V1에서는 이를 유지한다.

실제 생성된 tabs:

### `PLATFORM_PAGES`
- `page_id`
- `slug`
- `industry_id`
- `title`
- `status`
- `theme`
- `seo_json`
- `created_at`
- `updated_at`
- `published_at`
- `brief_json`
- `ai_status`
- `ai_review_json`

### `PAGE_BLOCKS`
- `page_id`
- `block_id`
- `sort_order`
- `type`
- `variant`
- `enabled`
- `content_json`
- `evidence_json`
- `ai_policy_json`
- `revision_version`
- `created_at`
- `updated_at`
- `published_version`

### `BLOCK_REVISIONS`
- `revision_id`
- `page_id`
- `block_id`
- `version`
- `actor`
- `reason`
- `snapshot_json`
- `created_at`

### `BLOCK_REVIEWS`
Block Library 자체의 UI 승인 상태.
- `block_type`
- `decision`
- `note`
- `reviewer`
- `updated_at`

### `MEDIA_ASSETS`
- `asset_id`
- `drive_file_id`
- `public_url`
- `alt`
- `source_type`
- `source_url`
- `license_note`
- `status`
- `updated_at`

`drive_file_id`는 보관 원본을 가리키고 `public_url`은 Editor/public renderer가 실제로 읽을 수 있는 배포 이미지 위치다.

Drive 파일 ID만 있고 public URL이 없는 파일을 공개 페이지 이미지로 간주하지 않는다.

### `PUBLISH_SNAPSHOTS`
- `snapshot_id`
- `page_id`
- `version`
- `slug`
- `industry_id`
- `title`
- `theme`
- `seo_json`
- `source_updated_at`
- `published_at`
- `state`

### `PUBLISHED_BLOCKS`
- `snapshot_id`
- `page_id`
- `block_id`
- `sort_order`
- `type`
- `variant`
- `content_json`
- `evidence_json`
- `revision_version`
- `published_at`

콘텐츠가 커져 한 셀의 JSON이 지나치게 길어지면 해당 block schema를 별도 row 구조로 분리한다. 처음부터 모든 block type마다 별도 sheet를 만들지는 않는다.

## Google Drive — 파일과 보관

Drive 역할:
- 원본 이미지
- 생성 PNG/WebP master
- 관리자가 업로드한 자료
- 완료된 workstream archive

현재 기존 이미지 파이프라인:
- `Photo-eBook Image Pipeline V1`
- `Generated PNG`
- `Generated WebP`

Drive를 row/query 중심의 구조화 DB처럼 사용하지 않는다.

또한 Drive URL을 public 이미지 CDN처럼 직접 사용하지 않는다. 현재 production 이미지 원칙은 기존 파이프라인과 동일하게 **보관/master는 Drive, 실제 공개 이미지는 Git에 반영된 정적 asset을 Cloudflare에서 제공**하는 방향을 유지한다.

따라서 Editor의 media picker는:
- `MEDIA_ASSETS.public_url`이 있는 등록 asset
- 이미 Git/Cloudflare에서 제공 중인 repo asset
을 바로 선택할 수 있다.

Drive-only asset을 향후 관리자 업로드 기능으로 추가하더라도 public 배포 단계가 완료되기 전에는 production-ready asset으로 승격하지 않는다.

## Git — 제품 계약과 배포 가능한 코드

Git 역할:
- Block Registry manifest
- server publish Registry status
- renderer
- schema/lifecycle 문서
- editorial/reference library
- production fallback/static assets
- 승인된 migration

관리자가 문장 한 줄을 고칠 때마다 Git commit을 직접 만들게 하지 않는다.

Registry browser/server 동기화 검사:
- `node scripts/check-block-registry-sync.mjs`

## 왜 이 구조로 시작하는가

현재 필요한 것은 대규모 트랜잭션 시스템보다 빠른 콘텐츠 확장과 운영 편집이다.

이미 Sheets/Drive 연결이 존재하고 관리자 수가 적은 동안에는:
- 운영 복잡도가 낮음
- 데이터 확인과 수동 복구가 쉬움
- 현재 Cloudflare Functions 경로를 재사용 가능
- 광고 노출 자체는 별도 DB 선택을 요구하지 않음

따라서 V1에서 Supabase/D1 같은 별도 DB를 먼저 추가하지 않는다.

다음 조건이 생기면 구조화 DB 이전을 검토한다.
- 여러 관리자가 동시에 같은 페이지를 편집
- 세밀한 권한과 승인 workflow가 필요
- revision 수가 크게 증가
- 검색/필터/query가 복잡해짐
- 콘텐츠 row가 대량으로 늘어남
- 사용자 계정 기반 개인화 데이터를 본격 저장

페이지와 block schema를 저장소와 분리해 두면 이후 DB를 바꿔도 renderer/editor data model은 유지할 수 있다.

## 관리자 쓰기 API 보안

기존 공개 `/api/rpc`에 관리자 page/block 수정 action을 넣지 않는다.

보호된 Editor API:
- same-origin 확인
- Bearer `ADMIN_EDITOR_TOKEN`
- token 미설정 시 closed
- token은 Editor Lab에서 sessionStorage only
- no-store response
- revision 기록
- draft와 published snapshot 분리

주요 endpoints:
- `GET /api/editor/health`
- `GET /api/editor/pages`
- `GET /api/editor/page`
- `POST /api/editor/page`
- `POST /api/editor/reviews`
- `GET|POST /api/editor/assets`
- `GET /api/editor/revisions`
- `POST /api/editor/publish-check`
- `POST /api/editor/publish`

현재 `ADMIN_EDITOR_TOKEN` Cloudflare secret은 별도 환경 설정이 필요하며, 설정 전 live write API는 의도적으로 닫혀 있다.

## Draft 저장 원칙

페이지를 저장할 때 기존 block 전체를 먼저 삭제하지 않는다.

순서:
1. page row update/append
2. 기존 block은 해당 row update
3. 신규 block append
4. 현재 draft에서 사라진 block만 마지막에 clear
5. revision append

중간 오류가 발생했을 때 기존 페이지가 먼저 사라지는 위험을 줄인다.

## Publish 흐름

```text
Editor local draft
    ↓
server draft save
    ↓
validation
    ↓
review / fact check
    ↓
PUBLISHED_BLOCKS append
    ↓
PUBLISH_SNAPSHOTS active append
    ↓
이전 active snapshot superseded
    ↓
public page renderer
```

Block type은 Approved Registry에 있는 항목만 publish할 수 있다. candidate block은 editor 개발 모드에서는 보일 수 있지만 production publish validation은 실패해야 한다.

비활성 block은 snapshot에 포함하지 않는다.

AI 적용 결과가 `needs_review`이거나 page review에 `blocker`가 남아 있으면 publish를 차단한다.

## AI 연결

AI는 page 전체 HTML을 직접 작성하지 않는다.

```text
page brief
   ↓
현재 block layout
   ↓
AI request JSON
   ↓
block content 초안 / page review
   ↓
AI response JSON
   ↓
field lock-aware import
   ↓
사용자 검수
   ↓
server draft 저장
```

사용자가 직접 고정한 필드는 block `aiPolicy`의 `locked` 또는 field-level lock으로 보호한다.

AI importer는 approval/publish 상태를 올리지 않는다.
