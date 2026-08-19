# Publish + SEO/GEO Contract V1

이 문서는 `먹고살기` 플랫폼의 산업별 페이지를 draft에서 공개 페이지로 승격할 때 필요한 snapshot, SEO, crawler, 검증 계약을 정의한다.

## 1. 기본 원칙

- draft와 published 데이터를 분리한다.
- public 페이지는 마지막으로 성공한 publish snapshot만 읽는다.
- Editor 저장이 곧바로 공개 페이지를 바꾸지 않는다.
- publish는 approved block만 허용한다.
- SEO/GEO는 별도 AI 전용 문서 구조를 만들기보다 표준 HTML, 명확한 본문, 출처, canonical URL, sitemap을 기준으로 한다.
- Block Lab과 Editor Lab은 검색 노출 대상이 아니다.

## 2. 페이지 URL

V1 canonical URL은 `slug`에서 결정한다.

최종 URL 형식은 public renderer 연결 시 한 번 확정한다. 현재 기존 photography `/`를 변경하지 않으므로 신규 산업 route가 production에 연결되기 전까지 canonical base path를 hard-code하지 않는다.

원칙:
- 하나의 공개 페이지에 canonical URL 하나
- 모바일/PC는 같은 URL과 같은 content snapshot 사용
- query parameter나 preview URL은 canonical로 사용하지 않음
- sitemap에는 canonical URL만 포함

## 3. SEO metadata

`PLATFORM_PAGES.seo_json` 권장 shape:

```json
{
  "title": "",
  "description": "",
  "schemaType": "Article",
  "ogImage": "",
  "siteName": "먹고살기",
  "authorName": "",
  "indexPolicy": "index",
  "reviewedAt": null
}
```

### title
- 각 공개 페이지마다 고유하게 작성
- 실제 페이지 제목과 내용이 일치해야 함
- 키워드 나열보다 페이지의 구체적인 주제를 설명

### description
- 페이지 내용을 실제로 요약하는 문장
- 다른 산업 페이지와 동일한 설명을 반복하지 않음

### schemaType
V1 허용:
- `Article`
- `WebPage`

특정 rich-result를 노리고 실제 내용과 맞지 않는 schema를 넣지 않는다.

### ogImage
- 실제 페이지 대표 이미지만 사용
- placeholder나 Editor 전용 이미지를 공개 metadata로 사용하지 않음

### indexPolicy
- `index`
- `noindex`

published page의 기본값은 `index`다. preview/draft는 항상 noindex다.

## 4. GEO / AI search

별도의 `llms.txt`나 AI 전용 schema를 V1 필수조건으로 두지 않는다.

공개 콘텐츠는:
- 일반 검색 crawler가 읽을 수 있어야 함
- 주요 주장과 출처가 가까이 있어야 함
- 저자/편집 기준과 최신 확인일을 표현할 수 있어야 함
- OAI-SearchBot을 실수로 차단하지 않음
- robots/noindex는 public과 admin route를 명확히 구분

## 5. publish snapshot

Google Sheets에 draft와 별도로 아래 snapshot 테이블을 둔다.

### `PUBLISH_SNAPSHOTS`

```text
snapshot_id
page_id
version
slug
industry_id
title
theme
seo_json
source_updated_at
published_at
state
```

### `PUBLISHED_BLOCKS`

```text
snapshot_id
page_id
block_id
sort_order
type
variant
content_json
evidence_json
revision_version
published_at
```

publish할 때 기존 snapshot을 수정하지 않고 새 snapshot을 append한다.

public renderer는 해당 page의 최신 활성 snapshot을 읽는다.

## 6. publish validation

다음 중 하나라도 해당하면 publish를 차단한다.

- page id 없음
- slug 없음
- title 없음
- SEO title 없음
- SEO description 없음
- block 없음
- 등록되지 않은 block type
- candidate/redesign/merge/deprecated block 사용
- 중복 block id
- AI review에 `blocker` 존재
- `factState=stale`인 공개 block 존재
- 필수 evidence가 필요한 block인데 근거가 누락된 상태라고 관리자가 표시한 경우

경고만 발생시키는 항목:
- `needs_verification`
- ogImage 없음
- authorName 없음
- reviewedAt 오래됨

V1에서는 경고를 publish 차단으로 자동 승격하지 않는다. 규제/법률/금융 등 `factSensitivity=high` 페이지는 이후 stricter rule을 추가할 수 있다.

## 7. publish lifecycle

```text
draft
  ↓
AI/편집 검토
  ↓
needs_review
  ↓
사용자 승인
  ↓
publish validation
  ↓
snapshot append
  ↓
published
```

Editor의 localStorage는 publish source가 아니다. 서버 draft가 source다.

## 8. rollback

과거 snapshot을 삭제하지 않는다.

rollback은 과거 snapshot을 직접 수정하는 것이 아니라, 선택한 과거 snapshot을 기준으로 새 version을 다시 publish하는 방식으로 처리한다.

## 9. robots / sitemap

V1 목표:
- `/block-lab/` noindex + crawler 제외
- `/editor-lab/` noindex + crawler 제외
- `/api/` crawler 제외
- public route 허용
- `OAI-SearchBot` public route 허용
- sitemap에는 published canonical page만 포함

robots와 sitemap은 실제 public route가 연결된 뒤 production base URL과 함께 최종 검증한다.

## 10. 광고 배치와 SEO

광고는 content hierarchy를 대체하지 않는다.

PC 좌우 rail 광고를 붙일 때:
- navigation/button처럼 보이게 만들지 않음
- 본문과 광고의 경계를 명확히 함
- 레이아웃 이동을 줄이기 위해 광고 영역 크기를 예약
- 모바일 본문을 광고 때문에 재배치하지 않음

광고 연결은 public renderer와 Core Web Vitals 검증 이후 진행한다.
