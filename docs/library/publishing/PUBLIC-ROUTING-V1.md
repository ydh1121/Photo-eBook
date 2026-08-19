# Public Routing V1

이 문서는 `먹고살기` 플랫폼에서 산업별 공개 페이지를 연결할 때의 URL, snapshot, 404, SEO 경계를 정의한다.

현재 production photography `/`와 Safari runtime을 건드리지 않고 staging에서 먼저 검증한다.

## 1. 목표 URL

산업 페이지의 최종 목표는 짧은 top-level slug다.

예:

```text
/
/video-editor/
/nail-artist/
/pet-groomer/
```

현재 `/`는 기존 photography production을 유지한다. 플랫폼 홈으로 바꾸는 작업은 별도 migration으로 취급한다.

## 2. canonical 규칙

- 공개 산업 페이지는 trailing slash 형태를 canonical로 사용한다.
- `/video-editor` 요청은 최종 연결 시 `/video-editor/`로 308 redirect한다.
- canonical은 `origin + /<slug>/`로 생성한다.
- hash는 챕터 이동용으로 사용할 수 있지만 별도 canonical 문서로 취급하지 않는다.
- query parameter가 있어도 canonical은 clean route를 가리킨다.

## 3. reserved route

산업 slug로 사용할 수 없는 경로:

- `api`
- `assets`
- `data`
- `content-packs`
- `block-lab`
- `editor-lab`
- `qa`
- `staging`
- `robots.txt`
- `sitemap.xml`
- `ads.txt`

Editor slug validator와 public router가 같은 reserved list를 사용하도록 최종 구현에서 공통화한다.

## 4. 공개 데이터 원본

공개 route는 `PLATFORM_PAGES`와 `PAGE_BLOCKS`의 draft를 읽지 않는다.

읽을 수 있는 원본:

```text
PUBLISH_SNAPSHOTS(state=active)
        +
PUBLISHED_BLOCKS(snapshot_id)
```

현재 준비된 read-only endpoint:

```text
GET /api/public/snapshot?slug=<slug>
```

이 endpoint는 active snapshot만 반환한다. active snapshot이 없으면 404다.

## 5. public renderer 계약

공개 renderer는 다음을 수행한다.

1. active snapshot 확인
2. approved Block type만 허용
3. snapshot block order 그대로 렌더
4. title/description 적용
5. canonical 적용
6. Open Graph / Twitter metadata 적용
7. Article 또는 WebPage JSON-LD 생성
8. indexPolicy 확인
9. 렌더 실패 시 photography `/`로 보내지 않고 오류/404 처리

공통 runtime candidate:

`public/assets/js/public-snapshot/runtime.js`

staging:

`/staging/public-renderer/`

staging에서만 `allowCandidate:true`를 허용한다.

## 6. SEO 초기 HTML

최종 production에서는 검색엔진이 JavaScript 실행을 기다리지 않아도 핵심 문서 구조와 metadata를 확인할 수 있는 형태를 목표로 한다.

즉 public snapshot runtime을 그대로 클라이언트 전용 SPA로 연결하는 것이 최종 목표는 아니다.

권장 최종 구조:

```text
active snapshot
   ↓
edge/server render 또는 publish-time static render
   ↓
초기 HTML
   ↓
필요한 interaction만 JS enhance
```

Block Lab/Admin Preview와 같은 Block 데이터 계약은 유지하되 공개 초기 HTML 생성 경로를 별도로 둔다.

## 7. 404

현재 legacy `_redirects`의:

```text
/* /index.html 200
```

는 photography SPA 호환을 위해 유지 중이다.

산업 공개 router를 production에 연결할 때는 이 wildcard 때문에 존재하지 않는 URL이 200 HTML을 받는 soft-404가 생기지 않도록 구조를 바꿔야 한다.

완료 조건:

- 존재하는 active slug → 200
- 없는 slug → 실제 404
- reserved route → 해당 static/API route로 정상 처리
- slash 없는 active slug → 308 canonical redirect
- `/` → 기존 photography 또는 이후 별도 platform home

wildcard rewrite 제거/변경은 production route QA와 함께 한 번에 진행한다.

## 8. sitemap

sitemap에는 active + indexable snapshot만 넣는다.

제외:
- draft
- archived snapshot
- `seo.indexPolicy=noindex`
- block-lab/editor-lab/qa/staging/api

snapshot publish/unpublish와 sitemap이 어긋나지 않게 같은 active source에서 생성한다.

## 9. rollback

과거 snapshot을 browser draft로 복원한 것만으로 공개 URL은 바뀌지 않는다.

rollback 절차:

```text
snapshot history
→ browser draft 복원
→ 검토
→ server draft 저장
→ publish-check
→ 새 snapshot 발행
→ active pointer 교체
```

과거 snapshot row를 직접 다시 `active`로 바꾸는 shortcut은 사용하지 않는다.

## 10. production 연결 gate

다음 전에는 top-level industry route를 production에 연결하지 않는다.

- 해당 페이지에서 사용하는 모든 Block type 최종 판정
- browser/server Registry sync
- AI review blocker 제거
- stale/needs-verification fact 처리
- human review
- PC/mobile QA

현재 `video-editor`는 이 gate를 통과하지 않았으므로 `/video-editor/`는 아직 공개 route가 아니다.
