# 21. Content Pack Architecture

Photo-eBook의 현재 사진 페이지는 향후 여러 직업·업종의 `먹고살기` 가이드로 확장하기 위한 첫 번째 content pack이다.

## PACK-001 — 공통 플랫폼과 분야팩을 분리한다

공통 플랫폼은 분야 내용을 알지 않는다.

공통 영역:
- `public/assets/styles/` — 레이아웃, 반응형, navigation, collection, questions, Safari, desktop UI
- `public/assets/js/core/` — content pack registry, site-data client, 공통 helper
- `public/assets/js/app/` — app lifecycle, boot recovery, postload
- `public/assets/js/navigation/`, `collection/`, `questions/`, `ui/`, `desktop/`, `safari/` — 공통 interaction

분야별 영역:
- `public/content-packs/<pack-id>/pack.js`
- `public/content-packs/<pack-id>/data/`
- `public/content-packs/<pack-id>/runtime/`

현재 첫 pack은 `photography`다.

## PACK-002 — photography pack 소유 범위

사진에만 의미가 있는 코드는 공통 assets 아래에 두지 않는다.

`public/content-packs/photography/`가 다음을 소유한다.
- 사진용 bundled site-data
- 사진 챕터 renderer
- 사진 글 큐레이션 UI/보강
- 사진 실무 영상 discovery 규칙
- 사진 generated inline asset
- 사진 image-slot registry/binder
- 사진 카피 compatibility layer

WebP production binary는 기존 이미지 파이프라인 계약과 경로 안정성을 위해 `public/assets/images/generated/v1/`에 유지한다.

## PACK-003 — pack contract

각 pack은 `pack.js`에서 최소 다음을 등록한다.

```js
window.registerContentPack({
  id: 'photography',
  routes: ['/', '/photography/'],
  bootMessage: '...',
  data: {
    cacheKey: '...',
    apiEndpoint: '/api/site-data?pack=photography'
  },
  sections: [
    { id: 'intro', renderer: 'introSection' }
  ]
});
```

`content-pack-runtime.js`가 URL과 명시적 pack id를 기준으로 활성 pack을 찾는다.

## PACK-004 — 데이터 격리

bundled fallback은 반드시 해당 pack 아래에 둔다.

```text
public/content-packs/photography/data/part-01.js
...
```

공통 `site-data-client.js`는 활성 pack의 `cacheKey`와 `apiEndpoint`를 사용한다. photography의 기존 localStorage cache key는 호환성을 위해 그대로 유지한다.

## PACK-005 — 새 분야 추가 원칙

새 분야를 추가할 때 공통 UI 파일을 복제하지 않는다.

예:

```text
public/content-packs/video-editor/
  pack.js
  data/
  runtime/
```

새 pack은 필요한 renderer와 분야별 미디어 규칙만 제공한다. navigation, 질문함, collection, Safari 대응, PC/mobile 레이아웃은 공통 모듈을 사용한다.

## PACK-006 — 현재 호환 브리지

현재 `app-shell.js`에는 기존 10개 chapter slot의 fallback order가 남아 있다.

```text
intro → market → education → skills → portfolio → gear → plan → scripts → iphone → sources
```

첫 확장 단계에서는 기존 사진 페이지의 회귀를 피하기 위해 이 순서를 유지한다. 새 분야가 다른 chapter 구조를 요구하는 시점에 app renderer를 pack `sections` 기반으로 완전히 전환한다.

따라서 현재 분리는 `사진 전용 runtime/data의 물리적 격리 + pack registry 도입` 단계이며, 공통 UI의 재설계가 아니다.

## PACK-007 — DB/CMS 경계

Google Sheets는 편집용 CMS/source-of-truth로 취급한다. 공개 방문자의 대량 read traffic을 장기적으로 Sheets에 직접 의존시키지 않는다.

권장 장기 구조:

```text
Google Sheets (편집/CMS)
  → publish/snapshot
  → Cloudflare Pages static data 또는 edge cache
  → 방문자
```

질문 기록처럼 쓰기 빈도가 증가하는 사용자 데이터는 콘텐츠 CMS와 분리한다.
