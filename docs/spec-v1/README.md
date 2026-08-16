# Photo-eBook V1 확정 명세

이 폴더는 Photo-eBook의 **1차 확정 명세(V1)** 다. 이후 수정, 리팩터링, 재구축, 자동화 스킬 작성은 이 문서를 기준으로 현재 작업이 기존 합의와 일치하는지 먼저 대조한다.

## 기준점

- V1 애플리케이션 기준 커밋: `6fe9f6883baa45c3d39ad68d57c21f9d76bf5bfd`
- 기준 커밋 시점의 배포 대상: Cloudflare Pages `main` 브랜치 / `public/`
- 이 폴더를 추가하는 문서 커밋은 애플리케이션 기준 커밋과 별개다. V1 화면과 동작의 기준 SHA는 위 값을 유지한다.
- 기존 `UI_REGRESSION_SPEC.md`의 사용자 승인 규칙은 본 V1 명세에 흡수한다. 충돌 시 `docs/spec-v1/`의 더 구체적인 규칙을 우선한다.

## 명세의 효력

1. 사용자가 명시적으로 V1 규칙 변경을 승인하지 않는 한 `MUST` 규칙은 유지한다.
2. 버그 수정은 명세 변경이 아니다. 구현을 명세에 맞추는 작업이다.
3. 현재 코드에 명세와 어긋나는 기술부채가 있으면 명세를 코드에 맞춰 낮추지 않고 `14-legacy-and-tech-debt.md`에 기록한다.
4. 새 기능은 기존 selector, controller, storage key, layout owner와 충돌하지 않아야 한다.
5. 디자인 변경은 요청받은 범위만 바꾼다. 전역 재디자인을 부수효과로 포함하지 않는다.
6. 캐시 쿼리 버전 변경은 해당 asset이 실제 변경됐을 때만 한다.

## 문서 지도

- `00-baseline-governance.md` — 기준 SHA, 용어, 변경 승인 규칙
- `01-runtime-file-map.md` — 실제 로드 순서, 지연 로드, legacy 파일, cascade
- `02-design-tokens.md` — 색상, 타이포, 여백, radius, shadow, motion
- `03-layout-responsive-motion.md` — 레이아웃, rail, 반응형, safe-area, 스크롤
- `04-component-registry.md` — UI 구성요소를 selector 단위로 분해한 표준
- `05-content-chapters.md` — 10개 챕터와 카드/가이드 모듈
- `06-liquid-navigation.md` — 상단/팝업/테마/질문 필터의 Liquid Glass 계약
- `07-collection-hub.md` — 내 모음 FAB, bottom sheet, 검색, 필터, 일괄선택
- `08-question-workflow.md` — 문장 선택 → 질문 작성 → 저장 → ChatGPT 연결
- `09-curated-video.md` — 외부 글/영상 탐색, 카드, 즐겨찾기, 무한 로딩
- `10-theme-and-safari.md` — light/dark/system 및 iOS Safari 예외
- `11-data-api-storage.md` — Google Sheets, API, localStorage, 캐시
- `12-lifecycle-ownership.md` — 초기화 순서와 상태/DOM 소유권
- `13-function-registry.md` — 함수 및 스크립트 책임 최소단위 목록
- `14-legacy-and-tech-debt.md` — 누적 override, dormant controller, 위험 영역
- `15-regression-checklist.md` — 모든 후속 작업의 사전/사후 검증 절차

## 규칙 ID

후속 작업에서 변경 영향을 명확히 비교할 수 있도록 규칙에 안정적인 ID를 부여한다.

- `BASE-*` 기준/운영
- `TOK-*` 디자인 토큰
- `LAY-*` 레이아웃
- `NAV-*` 상단 챕터 네비게이션
- `LIQ-*` Liquid Glass 및 spring
- `CARD-*` 콘텐츠 카드
- `CH-*` 챕터
- `COLL-*` 내 모음
- `Q-*` 질문 흐름
- `CUR-*` 외부 읽을거리
- `VID-*` 영상
- `THEME-*` 테마
- `SAFARI-*` iOS Safari
- `DATA-*` 데이터/API/저장소
- `LIFE-*` 초기화/lifecycle
- `OWN-*` 코드 소유권
- `REG-*` 회귀 방지

## V1의 의미

V1은 ‘현재 코드가 완벽하다’는 의미가 아니다. **사용자가 확인한 디자인과 동작을 보존하면서, 현재 구조와 알려진 예외까지 기록한 재출발 지점**이라는 의미다. 처음부터 다시 구현하더라도 이 폴더의 normative 규칙과 데이터/기능 계약에서 시작한다.
