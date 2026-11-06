# Photo-eBook

사진·영상·AI 활용·커뮤니티·부동산·경매를 함께 제공하는 모바일 우선 학습 가이드입니다. 기존 사진 content pack과 공개 주소 `/`를 유지하며 Personal Edu Project로 확장합니다.

## 분야별 페이지

| 분야 | 경로 | 콘텐츠 구성 |
| --- | --- | --- |
| 사진 | `/` | 기존 완성본 10개 장 |
| 영상 | `/video/` | 스마트폰 촬영·편집·AI 제작·발행·교육 |
| AI 활용 | `/ai/` | 프롬프트·글·이미지·영상·검증·업무 |
| 커뮤니티 | `/community/` | 주제·모집·운영·모임·수익·교육 |
| 부동산 | `/real-estate/` | 생활권·가격·서류·현장·계약·콘텐츠 |
| 경매 | `/auction/` | 검색·권리·현장·입찰가·입찰·취득 |

상단 분야 메뉴는 표지와 함께 스크롤됩니다. 기존 챕터 탐색은 유지하고, 우측 하단 `분야` 버튼으로 다른 분야를 바로 선택합니다. 새로운 다섯 과정은 각각 9개 장입니다.

신규 본문 원본은 분야별 Google Sheets에 있습니다. 검증한 원본을 `content/learning-guides/v1/`에 복원한 뒤 `node scripts/build-personal-edu.mjs`로 공개 snapshot을 생성합니다. 기존 사진 원본은 종전 파이프라인을 사용합니다. 원본 동기화 계약은 [22-personal-edu-content.md](docs/spec-v1/22-personal-edu-content.md)를 따릅니다.

공통 모듈 `learning-guide-hero`, `learning-guide-section`, `subject-navigation`은 Library·Editor·Public·export가 같은 Registry의 렌더러와 상호작용을 사용합니다. 체크리스트는 분야별로 저장하고, 공식 자료 북마크는 기존 `내 모음`과 연결합니다.

진행 상태와 재시작 절차는 [Personal Edu handoff](docs/workstreams/personal-edu-v1/HANDOFF.md)에 기록합니다.

## 현재 구조

- `public/` — Cloudflare Pages 정적 프런트엔드
- `public/assets/styles/` — 분야와 무관한 역할별 CSS 모듈
- `public/assets/js/` — 공통 브라우저 runtime
- `public/content-packs/photography/` — 사진 분야 data/runtime/content pack
- `public/content-packs/{video,ai,community,real-estate,auction}/` — 검증한 신규 분야 snapshot
- `content/learning-guides/v1/` — native Sheets에서 복원한 공개 원고
- `public/assets/images/generated/v1/` — 승인된 운영 WebP 이미지
- `public/assets/images/generated/personal-edu-v1/` — 신규 분야의 승인된 WebP 이미지
- `functions/api/[[path]].js` — 본문, 질문함용 Cloudflare Pages Function
- `functions/api/curated.js` — 외부 사진 글 큐레이션과 SEO 메타 파싱
- `functions/api/discover.js`, `functions/api/videos.js` — 사진 분야 탐색/영상 API
- Google Sheets API — 현재 사진 콘텐츠와 질문 기록의 편집 source

Apps Script는 사용하지 않습니다.

### Content pack

공통 UI와 분야별 내용을 분리합니다.

```text
public/
  assets/
    styles/                # 공통 UI
    js/                    # 공통 runtime
  content-packs/
    photography/
      pack.js              # pack id, route, cache/API contract
      data/                # bundled fallback
      runtime/             # 사진 전용 renderer/media/copy/image binding
```

현재 `photography` pack에 사진 챕터 renderer, 사진 글 큐레이션, 사진 실무 영상 검색 규칙, 사진 이미지 slot/binder, 사진 전용 compatibility layer가 들어 있습니다.

새 분야는 `public/content-packs/<pack-id>/`를 추가하고 공통 navigation, 질문함, collection, Safari 대응, desktop/mobile UI를 재사용하는 방향으로 확장합니다.

상세 계약은 `docs/spec-v1/21-content-pack-architecture.md`를 따릅니다.

### 프런트엔드 모듈 분류

CSS는 로드 순서를 유지한 채 아래 역할로 분리합니다.

- `styles/core/` — 토큰, reset, 기본 레이아웃, 반응형 기반
- `styles/components/` — 카드/장비 등 공통 컴포넌트
- `styles/navigation/` — 상단 챕터 내비게이션과 진행도
- `styles/collection/` — 내 모음, 선택 상태, 기기 연결
- `styles/questions/` — 질문 workspace
- `styles/ui/` — Liquid Glass, 테마/표면 보정
- `styles/media/` — 이미지/미디어 표현
- `styles/desktop/` — PC 전용 레이아웃과 레일
- `styles/safari/` — iOS/WebKit 전용 브라우저 chrome 대응
- `styles/compat/` — 기존 데이터/표현과의 호환 계층

공통 JS는 아래 역할로 분리합니다.

- `js/core/` — content pack registry, 데이터 API, 공통 helper, UI readiness
- `js/app/` — 앱 조립, boot 복구, postload lifecycle
- `js/navigation/` — 챕터 활성 상태와 이동
- `js/collection/` — 내 모음, 선택, 기기 연결, modal shield
- `js/questions/` — 질문 작성/저장/문맥 handoff
- `js/ui/` — Liquid controller와 UI repair
- `js/desktop/` — PC 전용 마우스 drag interaction
- `js/safari/` — iOS Safari chrome/theme 보정

사진에 종속된 renderer/content/media/copy 로직은 공통 JS가 아니라 `content-packs/photography/runtime/`에 둡니다.

## 자동 배포

`main` 브랜치에 push되면 Cloudflare Pages가 자동 배포합니다.

- Production branch: `main`
- Build output directory: `public`
- Root directory: 비워두기
- 현재 Cloudflare 프로젝트에서 `exit 0` Build command를 사용해도 됩니다.

## Cloudflare 환경 변수

Production 환경에 아래 두 값만 필요합니다.

- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON` — Secret으로 저장

서비스 계정 이메일에는 해당 Google Sheet를 편집자로 공유해야 합니다.

## 데이터 흐름

현재 runtime:

`Cloudflare Pages / Functions → Google Sheets API → Google Sheet`

bundled fallback은 `public/content-packs/photography/data/`에 있습니다.

장기적으로는 Google Sheets를 편집용 CMS로 두고, 공개 트래픽은 publish된 정적 snapshot 또는 Cloudflare edge cache에서 읽는 구조를 권장합니다.

## 질문함

- OpenAI API를 사용하지 않습니다.
- 질문은 브라우저 localStorage와 `QUESTION_HISTORY` 시트에 함께 저장합니다.
- 로그인 서버 없이 브라우저별 임의 동기화 키를 사용합니다.
- `동기화 키 복사` 후 다른 기기에서 `다른 기기 연결`로 같은 질문 기록을 불러올 수 있습니다.
- 질문 삭제 시 로컬 기록과 Google Sheet 기록을 함께 정리합니다.

## 외부 사진 글 큐레이션

`CURATED_LINKS` 시트에서 브런치, 티스토리 등 사진 관련 링크를 관리합니다.

- 링크를 추가하면 `/api/curated`가 `og:title`, `og:description`, `og:image`, 작성자, 발행일을 읽어 카드 정보를 채웁니다.
- 이미지나 SEO 정보가 비어 있는 새 링크는 첫 조회 때 우선 보강합니다.
- 기존 링크는 마지막 확인 후 7일이 지나면 페이지 조회 시 백그라운드에서 다시 확인합니다.
- 웹의 `링크 새로고침` 버튼으로 현재 노출 링크를 수동 갱신할 수 있습니다.
- 카드 즐겨찾기는 브라우저 localStorage에 저장하며 `즐겨찾기만` 필터로 관리합니다.

`CURATED_LINKS` 주요 컬럼: `id`, `title`, `url`, `platform`, `author`, `published_at`, `summary`, `thumbnail_url`, `og_title`, `og_description`, `tags`, `reaction_text`, `manual_score`, `is_visible`, `sort_order`, `fetch_status`, `last_checked_at`.

## 보안

- 서비스 계정 JSON은 GitHub에 넣지 않습니다.
- Cloudflare의 encrypted Secret에만 저장합니다.
- 웹 브라우저에는 서비스 계정 키가 전달되지 않습니다.
