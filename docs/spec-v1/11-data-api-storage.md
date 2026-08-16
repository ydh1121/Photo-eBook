# 11. 데이터, API, 캐시, localStorage 계약

## DATA-001 — 데이터 아키텍처

V1은 정적 HTML에 모든 콘텐츠를 하드코딩하는 구조가 아니다.

기본 흐름:

1. Google Sheets가 운영 콘텐츠 source.
2. Cloudflare Pages Functions가 Google Sheets API를 읽음.
3. frontend가 `/api/site-data`로 통합 JSON을 요청.
4. bundled fallback (`site-data-1.js` ~ `site-data-8.js`)과 local cache가 boot resilience 제공.
5. 사용자 저장 상태 일부는 localStorage.
6. 질문 history만 device key를 통해 Sheet와 동기화 가능.

## DATA-002 — Google environment

필수 환경 변수:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

service account private credential을 frontend에 노출하지 않는다.

## DATA-003 — Main Sheets map

`functions/api/[[path]].js`의 canonical logical map:

| logical key | Sheet |
|---|---|
| content | `CONTENT_DB` |
| nav | `NAV_MODULES` |
| market | `MARKET_TOP3` |
| education | `EDUCATION` |
| skills | `SKILLS` |
| equipment | `EQUIPMENT` |
| actionPlan | `ACTION_PLAN` |
| scripts | `SCRIPTS` |
| products | `PRODUCTS` |
| portfolio | `PORTFOLIO` |
| guideCopy | `GUIDE_COPY` |
| photoLessons | `PHOTO_LESSONS` |
| cameraPresets | `CAMERA_PRESETS` |
| sources | `SOURCES` |

이 Sheet 이름은 migration 없이 임의 변경하지 않는다.

## DATA-004 — `/api/site-data`

GET route는 renderer가 사용하는 통합 data object를 반환한다.

예상 top-level fields:
- content
- nav
- market
- education
- skills
- equipment
- actionPlan
- scripts
- products
- portfolio
- guideCopy
- photoLessons
- cameraPresets
- sources

정상 응답의 의미적 구조가 바뀌면 frontend renderer와 bundled fallback도 함께 갱신한다.

## DATA-005 — `/api/health`

backend availability/check 용도의 lightweight route를 유지할 수 있다. UI core는 health request 성공 여부에 직접 종속되지 않는다.

## DATA-006 — frontend site data cache

key:
`photoRoadmapSiteDataV2`

`script-1.js`가 cached data를 읽고 live request와 fallback을 조합한다.

캐시는 boot speed/resilience 목적이며 Sheet update를 영구 차단하면 안 된다.

## DATA-007 — bundled fallback

`public/data/site-data-1.js` ~ `site-data-8.js`:

- `window.__SITE_DATA_FALLBACK_PARTS`에 escaped JSON string fragment append.
- 모두 합쳐 parse하여 offline/failed-live fallback data 제공.

fragment 하나만 수정해 전체 JSON boundary가 깨지지 않도록 생성 방식 유지.

## DATA-008 — boot race

frontend data loader는 live API만 무한 대기하지 않는다.

현재 성격:
- live `/api/site-data` request.
- timeout 약 6.5초 family.
- bundled/cached fallback은 더 이른 시점(약 수백 ms)부터 사용 가능.
- live 성공 시 최신 data 우선 가능.

사용자는 network failure 때문에 boot skeleton에 계속 갇히면 안 된다.

## DATA-009 — boot recovery

`script-11.js`는 초기 render가 실패/지연된 경우 bundled/cache/live를 다시 이용해 app을 복구한다.

여러 recovery script가 서로 renderApp을 무한 반복 호출하지 않도록 guard 유지.

## DATA-010 — `apiRpc`

frontend helper `window.apiRpc(action, payload)`는 POST `/api/rpc` contract를 사용한다.

RPC는 현재 question history 동기화가 핵심 사용자다.

## DATA-011 — question Sheet

canonical sheet:
`QUESTION_HISTORY`

핵심 columns:
- id
- device_id
- selected_text
- question
- created_at
- updated_at

## DATA-012 — question RPC actions

- `getQuestionHistory`
- `saveQuestionHistory`
- `deleteQuestionHistory`

잘못된 action은 성공처럼 처리하지 않는다.

## DATA-013 — question limits

현재 backend guard의 의미적 한도:
- selected text: 최대 약 5000 chars
- question: 최대 약 3000 chars
- history: 약 100 records

frontend도 이보다 현저히 큰 payload를 무제한 쌓지 않는다.

## DATA-014 — question device ID

key:
`photoRoadmapDeviceKeyV1`

device code/linking은 사용자 account가 없는 상태에서 질문 history를 이어보기 위한 lightweight identity다.

영상/읽을거리 저장 전체를 remote account sync라고 오해하지 않는다.

## DATA-015 — local question storage

key:
`photoRoadmapQuestionsV2`

localStorage가 즉시 usable source다. remote sync가 실패해도 local question save를 유지한다.

## DATA-016 — article favorite IDs

key:
`photoRoadmapCuratedFavoritesV1`

array of IDs.

## DATA-017 — article favorite snapshot

key:
`photoRoadmapCuratedFavoriteItemsV2`

object keyed by ID.

snapshot에는 collection에서 card를 복원할 수 있는 title/url/image/platform/summary/save time 계열을 보존한다.

## DATA-018 — video favorite IDs

key:
`photoRoadmapVideoFavoritesV1`

## DATA-019 — video favorite snapshot

key:
`photoRoadmapVideoFavoriteItemsV2`

id/title/url/thumbnail/category/channel/savedAt 등 collection render에 필요한 필드.

## DATA-020 — localStorage migration

storage key 이름이나 object schema를 변경할 때는 migration을 제공한다.

MUST NOT:
- 새 key로 조용히 바꾸고 기존 저장 항목을 잃음.
- ID array만 남기고 snapshot object를 삭제.
- question V2를 V3로 바꾸며 V2 migration 생략.

## DATA-021 — `/api/curated`

별도 `functions/api/curated.js`가 `CURATED_LINKS`를 관리한다.

GET:
- visible rows.
- metadata initial/stale enrichment.

POST:
- manual refresh.

## DATA-022 — CURATED_LINKS schema

canonical headers:

`id,title,url,platform,author,published_at,summary,thumbnail_url,og_title,og_description,tags,reaction_text,reaction_value,manual_score,is_favorite,is_visible,sort_order,source_query,fetch_status,last_checked_at,created_at,updated_at`

## DATA-023 — curated visibility

`is_visible`가 false인 row를 normal public rail에 표시하지 않는다.

`is_favorite` Sheet column과 client local favorite는 별개의 개념일 수 있으므로 자동으로 동일한 user state로 취급하지 않는다.

## DATA-024 — external fetch safety

외부 HTML metadata fetch:
- timeout.
- response/body size guard (현재 약 900KB family).
- invalid/non-HTML 처리.
- redirect/URL sanitize.

외부 page payload를 app HTML에 raw inject하지 않는다.

## DATA-025 — `/api/discover`

동적 article discovery API.

input:
- cursor
- limit

output:
- items
- nextCursor
- metadata/category 가능

client는 ID/URL dedupe를 다시 수행한다.

## DATA-026 — discovery persistence

새로 발견한 유효 article은 `CURATED_LINKS` Sheet에 캐시/persist될 수 있다. discovery request의 response가 Sheet write 완료를 무조건 기다릴 필요는 없다.

## DATA-027 — discovery cache

backend memory cache는 cold start 최적화일 뿐 source of truth가 아니다. Sheet/외부 source와 충돌 시 stale memory를 영구 유지하지 않는다.

## DATA-028 — `/api/videos`

GET only 현재 contract.

query params:
- `cursor`
- `q`

response:
- items
- nextCursor
- query/category metadata 가능

## DATA-029 — YouTube data source

현재 V1은 external YouTube search page/initial data/Innertube parsing을 사용한다.

따라서:
- HTML/response 구조 변화에 실패 가능.
- fallback search URL을 유지.
- video rail failure가 core app failure로 번지지 않음.

## DATA-030 — generated image registry

files:
- `generated/client-review.js`
- `generated/product-studio.js`
- `generated/retouch-workstation.js`

global:
`window.__PHOTO_GENERATED_IMAGES`

keys:
- `client_review`
- `product_studio`
- `retouch_workstation`

## DATA-031 — generated image Blob conversion

postload `script-asset-fix.js`는 data:image URL을 Blob URL로 변환한다.

- valid base64 decode.
- `URL.createObjectURL`.
- registry value 교체.
- `pagehide`에서 revoke.

invalid generated data를 broken network URL로 요청하게 만들지 않는다.

## DATA-032 — fallback IMAGES

`script-2.js`의 Unsplash image map은 generated asset이 없거나 특정 category용 media가 필요할 때 fallback.

remote fallback 이미지는 core content data와 분리한다.

## DATA-033 — escaping

user/external/Sheet text를 HTML string renderer에 넣을 때 `esc()/attr()` 계열을 사용한다.

raw title/summary/tag/url text를 template literal에 무escape로 넣지 않는다.

## DATA-034 — URL handling

external links:
- `target="_blank"`
- `rel="noopener"`

url value는 attribute escape.

## DATA-035 — backend secrets

service account JSON, access tokens, Sheet ID secret 값은 frontend bundle/localStorage에 쓰지 않는다.

## DATA-036 — HTTP headers

Cloudflare static headers:
- nosniff
- strict-origin-when-cross-origin
- camera/microphone/geolocation disabled
- SAMEORIGIN

이 보안 header를 UI 문제 해결 명목으로 임의 제거하지 않는다.

## DATA-037 — index caching

`/` 및 `/index.html`은 no-store/no-cache/must-revalidate.

개별 asset은 query version으로 cache invalidation 한다.

## DATA-038 — SPA redirect

`/* /index.html 200` fallback 유지.

새 static route/API path와 충돌 여부를 확인한다.

## REG-DATA-001 — data regression

- Sheet field 이름 변경 후 renderer undefined.
- live API 실패 시 boot 무한 skeleton.
- local favorite는 보이는데 collection snapshot 없음.
- remote question 실패 때문에 local save도 실패.
- external article HTML raw injection.
- generated data URL이 invalid request로 나감.
- storage migration 없이 사용자 저장 데이터 사라짐.
