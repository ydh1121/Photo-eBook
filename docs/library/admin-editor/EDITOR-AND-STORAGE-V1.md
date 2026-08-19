# Admin Block Editor + Storage Architecture V1

## 목적

산업 분야를 추가하고 기본 블록을 배치한 뒤, 실제 화면을 보면서 순서·문장·이미지·속성을 수정할 수 있는 관리자 편집 환경을 만든다.

광고 기반 공개 콘텐츠 플랫폼을 전제로 하되, 초기에는 운영자가 적고 콘텐츠 수정 빈도가 관리 가능한 수준이라고 본다.

## 현재 구현

실험 route:
- `/editor-lab/`
- `noindex,nofollow,noarchive`
- production publish와 분리
- 브라우저 localStorage draft만 사용

현재 기능:
- 27개 candidate block library
- block 추가
- drag-and-drop 순서 변경
- 위/아래 이동
- 복제/삭제
- variant 변경
- block content의 문자열/숫자/배열/객체 편집
- Light/Dark
- 390/768/1180 preview
- 편집/미리보기 전환
- undo/redo
- JSON import/export
- 같은 canonical block renderer 사용

현재 localStorage는 제품 DB가 아니다. UI와 data contract를 검증하는 임시 draft 저장소다.

## V1 저장 역할 분리

### Google Sheets — 구조화된 콘텐츠 DB

현재 프로젝트가 이미 Google Sheets 읽기 API와 service account 경로를 사용하므로 V1에서는 이를 유지한다.

권장 table/tab:

### `PLATFORM_PAGES`
- `page_id`
- `slug`
- `industry_id`
- `title`
- `status` (`draft / published / archived`)
- `theme`
- `seo_json`
- `created_at`
- `updated_at`

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
- `updated_at`

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

콘텐츠가 커져 한 셀의 JSON이 지나치게 길어지면 해당 block schema를 별도 row 구조로 분리한다. 처음부터 모든 block type마다 별도 sheet를 만들지는 않는다.

## Google Drive — 파일과 보관

Drive 역할:
- 원본 이미지
- 생성 PNG/WebP master
- 관리자가 업로드한 자료
- publish export/snapshot
- 완료된 workstream archive

Drive를 row/query 중심의 구조화 DB처럼 사용하지 않는다.

## Git — 제품 계약과 배포 가능한 코드

Git 역할:
- Block Registry manifest
- renderer
- schema/lifecycle 문서
- editorial/reference library
- production fallback snapshot
- 승인된 migration

관리자가 문장 한 줄을 고칠 때마다 Git commit을 직접 만들게 하지 않는다.

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

현재 공개 `/api/rpc`에 관리자 page/block 수정 action을 그대로 추가하지 않는다.

관리자 저장 기능을 연결하기 전 반드시:
- 관리자 인증
- admin route 보호
- write API 권한 확인
- CSRF/replay를 포함한 요청 검증
- revision 기록
- published data와 draft data 분리
을 먼저 설계한다.

인증이 정해지기 전 `/editor-lab/`은 localStorage + import/export만 사용한다.

## Publish 흐름 목표

```text
Editor draft
    ↓
validation
    ↓
review / fact check
    ↓
published snapshot
    ↓
public page renderer
```

Block type은 Approved Registry에 있는 항목만 publish할 수 있다. candidate block은 editor 개발 모드에서는 보일 수 있지만 production publish validation은 실패해야 한다.

## AI 연결 목표

AI는 page 전체 HTML을 직접 작성하지 않는다.

```text
page brief
   ↓
section/block outline
   ↓
approved block 선택
   ↓
block content 초안
   ↓
사용자/AI 검수
   ↓
draft 저장
```

사용자가 직접 고정한 필드는 `aiPolicy.locked` 또는 field-level lock으로 보호한다.
