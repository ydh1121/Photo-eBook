# 09. 외부 읽을거리와 영상 탐색 모듈

## CUR-001 — Curated 목적

`자료` 챕터의 `더 읽어볼 촬영 팁`은 Brunch/Tistory 등 외부 글을 카드로 계속 탐색하는 rail이다. 단순 고정 링크 목록이 아니라:

- Google Sheet에 저장된 curated rows
- SEO metadata 갱신
- 관련성 기반 추가 탐색
- 즐겨찾기 snapshot
- 무한 horizontal discovery

를 결합한다.

## CUR-002 — Base data source

Sheet: `CURATED_LINKS`

컬럼:
- id
- title
- url
- platform
- author
- published_at
- summary
- thumbnail_url
- og_title
- og_description
- tags
- reaction_text
- reaction_value
- manual_score
- is_favorite
- is_visible
- sort_order
- source_query
- fetch_status
- last_checked_at
- created_at
- updated_at

## CUR-003 — `/api/curated`

GET:
- Sheet rows 읽기.
- `is_visible` rows 필터.
- initial metadata missing item 일부를 enrich.
- stale item 일부 refresh.
- 사용자에게 render 가능한 rows 반환.

POST manual refresh:
- cooldown 약 30초.
- 한 번에 과도한 페이지를 fetch하지 않음.
- 현재 max batch 약 20 계열.

## CUR-004 — metadata enrichment

외부 HTML을 가져올 때:

- response size 제한.
- title / og:title
- description / og:description
- og:image
- author/date 가능

을 읽는다.

외부 페이지 하나 때문에 전체 request가 무한 대기하지 않도록 timeout/size guard 유지.

## CUR-005 — Curated card display data

표시 우선순위:

- title: `og_title || title`
- image: `thumbnail_url || fallback`
- summary: `og_description || summary`
- platform: source badge
- meta: author, published date, reaction text 등
- tags: parsed max handful

## CUR-006 — Curated card DOM

실제 current renderer의 중요 selector:

- `.curated-card`
- `.curated-card__visual`
- `.curated-platform`
- `.curated-bookmark`
- `.curated-card__body`
- `.curated-meta`
- `.curated-tags > span`
- `.curated-open`

이 DOM class는 향후 badge 수정 시 source of truth로 먼저 확인한다.

## CUR-007 — Source badge

`.curated-platform`:

- 이미지 위 좌상단.
- `브런치`, `티스토리` 등.
- 이미지 대비 때문에 dark translucent + white text.
- 일반 content badge와 억지로 동일 surface로 만들지 않는다.

## CUR-008 — Content tags

`.curated-tags > span`:

- `구도`, `아이폰`, `리뷰사진` 등.
- 일반 `.soft-tag`/장비 meta와 같은 design language.
- 별도 강조형 badge를 만들지 않는다.

## CUR-009 — Favorite IDs

key:
`photoRoadmapCuratedFavoritesV1`

값:
- 저장된 article ID array.

## CUR-010 — Durable favorite snapshots

key:
`photoRoadmapCuratedFavoriteItemsV2`

이유:
- 현재 rail에 item이 없거나 API 결과가 바뀌어도 저장 목록에서 title/image/url을 복원.

ID만 저장하고 snapshot을 잃는 구조로 후퇴하지 않는다.

## CUR-011 — Favorite button state

`.curated-bookmark`:

- unsaved neutral circle.
- saved `.is-favorite`: blue circle + white filled bookmark.
- `aria-pressed` 동기화.

click 후:
- ID set update.
- snapshot update/delete.
- 같은 ID의 duplicate/clone card state sync.
- collection count 갱신.

## CUR-012 — Favorites panel

legacy source section 안의 favorites panel은 현재 unified collection과 함께 존재할 수 있다.

- panel header
- close
- favorite row
- empty state

그러나 신규 기능의 primary saved-items destination은 `내 모음`이다. 중복 저장 시스템을 새로 만들지 않는다.

## CUR-013 — `/api/discover`

목적:
- 추가 관련 글 탐색.

현재 전략:
- 사진 촬영/리터칭/아이폰/포트폴리오 등 search terms.
- Brunch/Tistory 결과 선호.
- Bing RSS/Naver fallback 계열.
- negative keyword 필터.
- relevance score threshold.
- HTML enrich.
- Sheet persistence 비동기/캐시.

## CUR-014 — Discovery relevance

랜덤 블로그 글을 수량만 채우기 위해 표시하면 안 된다.

관련성 신호 예:
- 사진/촬영/카메라/아이폰 촬영/구도/보정/리터칭/상업사진.
- title/summary/source query match.

negative 또는 무관한 쇼핑/광고/잡글은 filter.

## CUR-015 — Discovery cursor

client는 cursor를 증가시키며 `/api/discover?cursor=N&limit=M` 호출.

빈 batch가 나오면 제한된 횟수 내 다음 cursor를 시도할 수 있다.

같은 id/url 중복 append 금지.

## CUR-016 — Canonical sentinel

현재 V40 layer는 `.curated-discovery-sentinel` 하나만 canonical로 유지한다.

MUST:
- duplicate v39/v40 sentinel 제거.
- 한 rail에 spinner 1개.
- loader가 큰 white/black blank card가 되지 않음.

## CUR-017 — Horizontal append stability

새 article append 시 현재 `scrollLeft`를 보존해 rail이 첫 카드로 튀지 않도록 한다.

append 때문에 vertical page position이 점프하지 않아야 한다.

## CUR-018 — Curated refresh button

`링크 새로고침` 계열 action:

- disabled during request.
- `확인 중`, `업데이트됨`, `다시 시도` 등 temporary state 가능.
- completion 후 원 label 복귀.

## VID-001 — Video 목적

실무 skill card와 이어지는 rail에서 관련 YouTube 영상을 제공한다.

영상은 별도 video page가 아니라 skill context의 보조 자료다.

## VID-002 — `/api/videos`

GET params:
- `cursor`
- optional `q`

기본 search preset 예:
- 인물 리터칭
- 제품 리터칭
- 공간 보정
- 셀렉/납품
- 제품 촬영
- 음식 촬영
- 포트폴리오
- 색보정
- 모바일 촬영
- RAW workflow
- 고객 납품/견적
- 스튜디오 촬영

## VID-003 — YouTube acquisition

현재 backend는 YouTube public/search page initial data/Innertube 계열을 parsing하여 video candidate를 수집한다.

API key 기반 official Data API가 V1 필수 계약은 아니다.

## VID-004 — Video normalization

client normalized fields:
- id
- title
- url
- thumbnail
- category
- query
- channel
- views
- duration
- savedAt
- optional isSearchFallback

## VID-005 — Skill classification

skill card title/내용에서 category/query 매핑.

대표:
- 인물 → 인물 리터칭
- 제품/누끼 → 제품 리터칭
- 공간 → 공간 보정
- RAW/셀렉/납품 → 셀렉/납품
- 라이트룸/컬러 → 색보정
- fallback → 상업사진 실무

## VID-006 — Skill card hydration

postload `script-14.js`:

1. 기존 skill rail clone/clean.
2. standalone legacy video card 제거.
3. skill card별 category/query 부여.
4. video slot header/body 재구성.
5. 최대 소수 concurrent workers로 `/api/videos` 호출.
6. 성공 video 또는 fallback search card 삽입.

## VID-007 — Fallback video

실제 영상 fetch가 실패해도 빈 깨진 card 대신 YouTube search URL로 연결되는 fallback item을 만들 수 있다.

fallback임을 source text로 구분한다.

## VID-008 — Infinite video rail

skill media cards 뒤에 discover video cards가 계속 append될 수 있다.

- near-end scroll trigger.
- IntersectionObserver sentinel trigger 가능.
- duplicate video ID 금지.
- 한 번에 제한된 batch.

## VID-009 — Video favorite IDs

key:
`photoRoadmapVideoFavoritesV1`

## VID-010 — Video snapshot

key:
`photoRoadmapVideoFavoriteItemsV2`

saved video가 현재 rail에 없어도 collection에서 복원 가능해야 한다.

## VID-011 — Video bookmark

`.skill-video-bookmark`:

- curated bookmark와 동일 saved visual language.
- saved blue + white filled glyph.
- ID set/snapshot/collection count 동기화.

## VID-012 — Mini vs discover

mini/matched:
- skill card 내부.
- compact horizontal layout.

discover:
- rail의 standalone card.
- image/copy를 충분히 표시.

같은 video favorite state를 공유한다.

## DATA-MEDIA-001 — external failure tolerance

외부 article/video fetch 실패가 전체 app boot를 막으면 안 된다.

- core site data와 외부 discovery는 분리.
- loading/empty/fallback state 사용.
- error는 해당 rail에 국한.

## REG-CUR-001 — Curated 회귀

- 외부 글 card에 실제 class와 다른 selector로 style 적용.
- tag와 source badge를 같은 디자인으로 강제해 image 대비 상실.
- favorite ID는 남고 snapshot이 없어 collection card가 빈 상태.
- append마다 rail 위치 초기화.
- duplicate spinner.
- 관련성 없는 글을 무제한 표시.

## REG-VID-001 — Video 회귀

- skill card에서 관련 영상 slot 삭제.
- video fetch 실패 시 entire card/section 제거.
- favorite button state가 collection과 불일치.
- mini와 discover가 서로 다른 favorite key 사용.
- infinite loading이 vertical scroll을 막음.
