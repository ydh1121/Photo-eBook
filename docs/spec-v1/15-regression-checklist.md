# 15. V1 회귀 검증 체크리스트

이 문서는 이후 모든 코드 작업의 사전/사후 점검 기준이다. 요청 범위에 해당하는 항목만 고르는 것이 아니라, **변경된 selector/state가 영향을 줄 수 있는 연관 항목까지 확인**한다.

---

# A. 작업 시작 전

## REG-PRE-001 — 기준 확인

- [ ] V1 app baseline SHA가 `6fe9f6883baa45c3d39ad68d57c21f9d76bf5bfd`임을 인지.
- [ ] 현재 작업이 V1 규칙 변경인지, V1에 맞추는 버그 수정인지 구분.
- [ ] 사용자 요청 범위를 한 문장으로 정의.

## REG-PRE-002 — 실제 owner 확인

- [ ] 대상 DOM의 실제 class/id를 renderer에서 확인.
- [ ] `index.html`에서 해당 CSS/JS가 실제 로드되는지 확인.
- [ ] 후반 CSS가 같은 selector를 override하는지 확인.
- [ ] 같은 global function이 뒤에서 다시 정의되는지 확인.
- [ ] 같은 state/indicator를 다른 controller가 쓰는지 확인.

## REG-PRE-003 — 기존 component 재사용

- [ ] badge/button/card/rail/callout이 `04-component-registry.md`에 이미 있는지 확인.
- [ ] 의미가 같은 기존 component가 있으면 그 visual family를 재사용.
- [ ] 이미지 위 badge처럼 context상 의도적 예외인지 구분.

## REG-PRE-004 — 기술부채와 명세 구분

- [ ] numbered override 구조를 ‘명세’라고 오해하지 않음.
- [ ] 현재 known debt를 고치려는지 기능을 바꾸려는지 구분.
- [ ] cleanup과 redesign을 같은 작업에 섞지 않음.

---

# B. 파일/배포 무결성

## REG-FILE-001

- [ ] 요청하지 않은 파일 변경 없음.
- [ ] docs-only 작업이면 app/public/functions 파일 변경 없음.
- [ ] 동일 파일을 불필요하게 여러 commit에서 반복 수정하지 않았는지 확인.

## REG-FILE-002

- [ ] active CSS/JS 변경 시 `index.html` cache query version 증가.
- [ ] dynamic asset 변경 시 postload URL version 증가.
- [ ] code 미변경이면 cache version을 의미 없이 증가시키지 않음.

## REG-FILE-003

- [ ] `public/_headers` security headers 유지.
- [ ] `public/_redirects` SPA fallback 유지.
- [ ] Cloudflare output directory `public` 유지.

---

# C. First paint / boot

## REG-BOOT-001

- [ ] first load가 boot skeleton에 무한 정지하지 않음.
- [ ] bundled/cache fallback으로 offline/slow API에서도 app이 나타남.
- [ ] live API 성공 시 최신 데이터가 정상 사용됨.

## REG-BOOT-002

- [ ] 첫 paint theme flash 없음.
- [ ] 저장 theme choice가 첫 프레임부터 반영.
- [ ] first/second/third 접속에서 상단 liquid 디자인이 동일.

## REG-BOOT-003

- [ ] 첫 접속 상단 active chip이 flat fallback에 영구 고정되지 않음.
- [ ] indicator + `.v37-liquid-skin`이 mount됨.
- [ ] reload해야만 glass가 살아나는 상태 없음.

---

# D. 상단 네비게이션

## REG-NAV-001 — 정보구조

- [ ] 순서: 시작/시장/교육/실무/포트폴리오/장비/수익/영업/아이폰/자료.
- [ ] nav target과 chapter `data-chapter` 일치.
- [ ] active chapter가 본문 위치와 맞음.

## REG-NAV-002 — geometry

- [ ] nav-shell scroll 중 높이 변화 없음.
- [ ] sticky y축 jitter 없음.
- [ ] Safari 주소창 expand/collapse 시 nav가 위아래로 튀지 않음.

## REG-NAV-003 — horizontal

- [ ] 손가락으로 native x pan 가능.
- [ ] vertical scroll과 x rail gesture가 충돌하지 않음.
- [ ] JS custom momentum 없음.
- [ ] first/last chip 접근 가능.

## REG-NAV-004 — Liquid

- [ ] rail당 indicator 1개.
- [ ] skin 1개.
- [ ] active button 자체에 ghost blue fill 없음.
- [ ] label이 pill 위 z-layer.
- [ ] active 이동에 Breeze overshoot 존재.
- [ ] first/last에서 pill이 rail에 잘리지 않음.

## REG-NAV-005 — progress

- [ ] 별도 두꺼운 progress plate 없음.
- [ ] subtle rail wash가 vertical reading progress와 연동.
- [ ] progress가 selected pill 위치를 바꾸지 않음.

---

# E. Liquid controls 전체

## REG-LIQ-001

다음 모두 glass family 일관성 확인:
- [ ] top nav.
- [ ] collection primary tabs.
- [ ] theme choice.
- [ ] question write/saved selector.

## REG-LIQ-002

- [ ] active 전환에 spring 존재.
- [ ] self-heal이 정상 spring을 instant settle로 덮지 않음.
- [ ] indicator가 소실되면 복구.
- [ ] indicator가 중복되지 않음.

## REG-LIQ-003 — reduced motion

- [ ] reduced-motion에서 기능 유지.
- [ ] spring/불필요 animation 제거.

---

# F. V40 질문 secondary selector

## REG-QSEL-001

- [ ] 위치: `내 모음 > 질문`의 search 아래/같은 tools 영역.
- [ ] width가 search outer rail과 맞음.
- [ ] `질문 작성하기` / `저장한 질문` 두 slot 정확히 1/2.
- [ ] outer 좌우 gutter mirror.
- [ ] center gap 5px.
- [ ] rail 약 50px, pill 약 40px.
- [ ] count badge label 옆.

## REG-QSEL-002

- [ ] left active outer gap과 right active outer gap 시각적으로 동일.
- [ ] selected pill이 rail 밖 spring overshoot를 보여도 clip되지 않음.
- [ ] legacy second selector가 추가로 보이지 않음.

---

# G. 본문 질문 흐름

## REG-Q-001

- [ ] 본문 문장 선택 시 `GPT에 질문` bubble 표시.
- [ ] bubble click 전 selected text가 state에 저장.
- [ ] click 후 `내 모음 > 질문 > 질문 작성하기`로 이동.
- [ ] selected quote가 유지.

## REG-Q-002

- [ ] textarea에 질문 작성 가능.
- [ ] 선택 문장/질문을 독립적으로 수정 가능.
- [ ] copy 동작.
- [ ] save 동작.
- [ ] ChatGPT open 동작.

## REG-Q-003

- [ ] 질문 save 후 count 증가.
- [ ] saved mode 목록에 즉시 표시.
- [ ] saved question click 시 quote/question 복원.
- [ ] delete 후 local/remote/count 정리.

## REG-Q-004

- [ ] write mode에서 saved card가 같이 남지 않음.
- [ ] saved mode에서 composer가 중복 남지 않음.
- [ ] question primary tab에서도 collection search 유지.

---

# H. 내 모음

## REG-COLL-001 — FAB

- [ ] 오른쪽 하단 원래 위치.
- [ ] safe-area 고려.
- [ ] 과도하게 위로 올라가지 않음.
- [ ] count 정확.

## REG-COLL-002 — bottom sheet

- [ ] 화면 하단에 붙는 bottom sheet.
- [ ] 중앙 floating modal이 아님.
- [ ] bottom gap 없음.
- [ ] rounded top/handle/title/close 유지.

## REG-COLL-003 — primary tabs

- [ ] 전체/영상/읽을거리/질문/설정 모두 존재.
- [ ] active indicator 정확.
- [ ] tab 전환 후 item/filter가 해당 type에 맞음.

## REG-COLL-004 — search/filter

- [ ] search input 표시/동작.
- [ ] video category filter.
- [ ] article platform filter.
- [ ] settings에서 불필요 tools 숨김.

## REG-COLL-005 — item

- [ ] thumbnail/Q icon/text/remove 정렬.
- [ ] card가 viewport 폭 넘지 않음.
- [ ] saved URL click 정상.

## REG-COLL-006 — close/scroll

- [ ] backdrop click close.
- [ ] close button close.
- [ ] handle drag > threshold close.
- [ ] 닫은 후 원래 page scroll 위치 유지.
- [ ] stale `collection-open` body class 없음.

---

# I. Bulk select

## REG-BULK-001

- [ ] select toggle 평상시 `선택`, active `완료`.
- [ ] settings/write mode에서 필요 시 숨김.

## REG-BULK-002

- [ ] selectbox가 실제 첫 grid column.
- [ ] thumb/Q icon과 겹치지 않음.
- [ ] selected card visual 명확.

## REG-BULK-003

- [ ] 전체 선택/해제.
- [ ] count.
- [ ] delete disabled 0개.
- [ ] multi delete 후 local storage/snapshot/bookmark/FAB count 모두 갱신.

---

# J. 콘텐츠 카드/배지

## REG-CARD-001

- [ ] light card가 흰 canvas에 묻히지 않음.
- [ ] dark card surface hierarchy 유지.
- [ ] nested panel이 outer card와 구분.

## REG-CARD-002 — common badge

동일 visual family 확인:
- [ ] `.soft-tag`.
- [ ] `.product-row__meta span`.
- [ ] `.curated-tags > span`.

## REG-CARD-003 — source badge

- [ ] `.curated-platform`은 이미지 위에서 충분한 contrast.
- [ ] source badge를 common light content badge로 바꿔 이미지에서 사라지지 않음.

## REG-CARD-004 — curated specific

- [ ] `브런치/티스토리` source badge 보임.
- [ ] `구도/아이폰/리뷰사진` content tag가 light/dark 모두 읽힘.
- [ ] 실제 selector가 `.curated-tags > span`임을 기준으로 수정.

---

# K. 10개 챕터

## REG-CH-001 — 시작
- [ ] hero/guide 정상.

## REG-CH-002 — 시장
- [ ] 3개 market card rail.
- [ ] rank/title/price/customer.

## REG-CH-003 — 교육
- [ ] education option stack.
- [ ] meta badge.
- [ ] 상담 체크.

## REG-CH-004 — 실무
- [ ] media skill card.
- [ ] 작업 이미지.
- [ ] tag.
- [ ] related video slot.
- [ ] horizontal rail.

## REG-CH-005 — 포트폴리오
- [ ] case image/body/delivery.

## REG-CH-006 — 장비
- [ ] product cards.
- [ ] product detail rows.
- [ ] meta badge.
- [ ] title not squeezed.

## REG-CH-007 — 수익
- [ ] phase cards.
- [ ] metrics.

## REG-CH-008 — 영업
- [ ] guide.
- [ ] copyable script cards.

## REG-CH-009 — 아이폰
- [ ] lesson preview.
- [ ] camera presets.
- [ ] detailed lessons.
- [ ] official link if supplied.

## REG-CH-010 — 자료
- [ ] curated article rail.
- [ ] official source cards.

---

# L. Curated article

## REG-CUR-001

- [ ] `/api/curated` 실패가 app 전체를 막지 않음.
- [ ] card title/image/description fallback.
- [ ] favorite button state.

## REG-CUR-002

- [ ] infinite discovery near end.
- [ ] duplicate item 없음.
- [ ] duplicate sentinel 없음.
- [ ] append 후 scrollLeft 보존.

## REG-CUR-003

- [ ] favorite ID + snapshot 둘 다 유지.
- [ ] collection에서 원 rail에 없는 favorite도 복원.

---

# M. Video

## REG-VID-001

- [ ] `/api/videos` 실패 시 fallback search card.
- [ ] skill card 자체는 유지.
- [ ] video favorite state 일치.

## REG-VID-002

- [ ] mini/matched/discover layout 목적 구분.
- [ ] infinite append 중 duplicate ID 없음.
- [ ] vertical page scroll 막지 않음.

---

# N. Light theme

## REG-LIGHT-001

- [ ] guide-key text 충분한 contrast.
- [ ] callout border/surface 보임.
- [ ] inactive liquid rail label 보임.
- [ ] common badge가 너무 희미하지 않되 별도 강조 디자인이 아님.
- [ ] product/card media가 자연스러움.

---

# O. Dark theme

## REG-DARK-001

- [ ] page canvas #0d0f13 graphite family.
- [ ] card #171b21 family.
- [ ] nested #1b2028/#20252d family.
- [ ] muted text 읽힘.
- [ ] tag 읽힘.
- [ ] source badge 읽힘.
- [ ] pure black seam/section band 없음.

---

# P. Theme selector

## REG-THEME-001

- [ ] 화이트.
- [ ] 다크.
- [ ] 시스템.
- [ ] localStorage persistence.
- [ ] system OS change 반영.
- [ ] theme change 후 liquid indicator 남음.

---

# Q. iOS Safari 실기기

## REG-SAFARI-001 — expanded

- [ ] 최초 큰 주소영역 상태에서 page/layout 깨짐 없음.
- [ ] expanded browser chrome이 opaque여도 app을 억지로 이동시키지 않음.

## REG-SAFARI-002 — compact

- [ ] 아래로 스크롤해 주소 UI가 pill로 축소.
- [ ] hidden compact-prime이 사용자 눈에 깜빡이지 않음.
- [ ] prime 후 pill 뒤 translucent/transparent 상태가 현재 V1과 동일.

## REG-SAFARI-003 — rearm

- [ ] 맨 위 expanded로 복귀.
- [ ] 다시 아래 compact 진입.
- [ ] prime이 다시 실행 가능.

## REG-SAFARI-004 — known limitation

- [ ] 실제 collection popup open 중 Safari pill tint가 고체/검정으로 될 수 있음을 known limitation으로 취급.
- [ ] 이를 고치다 popup geometry/FAB/nav를 망가뜨리지 않음.

## REG-SAFARI-005 — failed regression patterns 금지

- [ ] FAB 70~80px 추가 상승 없음.
- [ ] popup 중앙화 없음.
- [ ] popup bottom gap 없음.
- [ ] root grey/black plate 없음.
- [ ] full-screen opaque fixed wrapper 없음.

---

# R. 데이터/API

## REG-DATA-001

- [ ] `/api/site-data` shape 유지.
- [ ] bundled fallback parse.
- [ ] cache parse failure graceful.

## REG-DATA-002

- [ ] question RPC get/save/delete.
- [ ] local save는 remote failure와 독립.

## REG-DATA-003

- [ ] curated Sheet headers 유지.
- [ ] external metadata size/timeout guard.

## REG-DATA-004

- [ ] localStorage key migration 필요 여부 확인.
- [ ] 기존 사용자 저장 데이터 보존.

---

# S. 보안/접근성

## REG-A11Y-001

- [ ] actionable 요소 button/a semantic 유지.
- [ ] icon-only button aria-label.
- [ ] `aria-pressed` favorite/select 상태 동기화.
- [ ] reduced-motion respected.
- [ ] mobile textarea 16px 계열 zoom issue 없음.

## REG-SEC-001

- [ ] external string escaped.
- [ ] target blank에 noopener.
- [ ] service-account secret frontend 노출 없음.
- [ ] security headers 유지.

---

# T. 성능

## REG-PERF-001

- [ ] vertical scroll에 document-wide MutationObserver rewrite 없음.
- [ ] per-frame layout-heavy query 최소화.
- [ ] native rail 유지.
- [ ] postload enhancement가 first render blocking하지 않음.

## REG-PERF-002

- [ ] generated images Blob URL cleanup.
- [ ] external network 실패/timeout 격리.

---

# U. 작업 종료 시 Git 검증

## REG-GIT-001

- [ ] 시작 SHA와 종료 SHA compare.
- [ ] 변경 파일 목록이 요청 범위와 정확히 일치.
- [ ] unrelated app asset 수정 없음.
- [ ] docs/spec 변경 시 관련 spec ID가 실제 변경사항을 반영.

## REG-GIT-002 — 명세 변경 시

- [ ] V1 rule 자체를 바꿨다면 user-confirmed state 기록.
- [ ] baseline/change note 업데이트.
- [ ] 해당 regression 항목 업데이트.

---

# V. 최소 시나리오 Smoke Test

후속 UI 작업은 최소 아래 순서를 한 번 통과한다.

1. fresh load light.
2. top nav 3개 이상 이동: glass + spring.
3. vertical scroll + horizontal nav pan.
4. dark 전환.
5. 다시 light 전환.
6. 본문 문장 선택 → GPT에 질문.
7. 질문 작성 → 저장.
8. 저장한 질문 열기.
9. collection 전체/영상/읽을거리/질문/설정 순회.
10. search/filter.
11. bulk select 2개 → 해제/삭제 테스트 가능한 fixture에서 검증.
12. curated bookmark toggle.
13. video bookmark toggle.
14. iPhone Safari compact toolbar 진입/재진입.
15. popup open/close 후 page scroll/geometry 확인.

위 시나리오 중 변경과 무관해 보여도 **공용 liquid, collection, theme, root/Safari CSS를 수정했다면 반드시 전체를 다시 확인**한다.
