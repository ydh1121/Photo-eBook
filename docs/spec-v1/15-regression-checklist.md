# 15. 회귀 검증 체크리스트

이 문서는 이후 코드/구조 작업의 사전·사후 점검 기준이다. 파일명 cleanup 이후에는 semantic module path와 실제 owner를 기준으로 검증한다.

# A. 작업 시작 전

## REG-PRE-001 — 요청 범위

- [ ] 사용자 요청 범위를 한 문장으로 정의.
- [ ] 기능 수정 / 시각 수정 / 구조 cleanup을 구분.
- [ ] 승인된 모바일 기준선을 변경하는 작업인지 확인.

## REG-PRE-002 — 실제 owner

- [ ] `01-runtime-file-map.md`에서 active module 확인.
- [ ] `12-lifecycle-ownership.md`에서 state/DOM owner 확인.
- [ ] 후반 CSS가 같은 selector를 override하는지 확인.
- [ ] postload module인지 확인.
- [ ] 같은 state/indicator를 다른 compatibility layer가 쓰는지 확인.

## REG-PRE-003 — cleanup 규칙

- [ ] semantic filename을 owner 선언으로 오해하지 않음.
- [ ] cleanup과 redesign을 같은 변경에 섞지 않음.
- [ ] CSS load order를 필요 없이 바꾸지 않음.
- [ ] 삭제된 numbered legacy file을 다시 연결하지 않음.

# B. 파일/배포 무결성

## REG-FILE-001 — entry/dependency

- [ ] `public/index.html`의 모든 CSS/JS 경로가 실제 파일을 가리킴.
- [ ] bundled data `part-01..08.js`가 모두 존재하고 순서 유지.
- [ ] `assets/js/app/postload-enhancements.js`의 동적 URL이 실제 파일을 가리킴.
- [ ] runtime code에서 삭제된 `/assets/style-*`, `/assets/script-*` 경로가 남지 않음.
- [ ] 상대 `url(...)` 자산 경로가 파일 이동 때문에 깨지지 않음.

## REG-FILE-002 — cache/version

- [ ] active CSS/JS 내용 변경 시 해당 query version 검토.
- [ ] dynamic asset 변경 시 postload URL version 검토.
- [ ] code 미변경이면 cache version을 의미 없이 올리지 않음.

## REG-FILE-003 — Cloudflare

- [ ] `public/_headers` 유지.
- [ ] `public/_redirects` 유지.
- [ ] output directory `public` 유지.
- [ ] Functions API 경로 유지.

# C. First paint / boot

- [ ] first load가 boot skeleton에 무한 정지하지 않음.
- [ ] bundled/cache fallback으로 slow API에서도 app이 나타남.
- [ ] live API 성공 시 최신 데이터 사용.
- [ ] 저장 theme choice가 첫 프레임부터 반영.
- [ ] 첫/재접속에서 liquid 디자인이 동일.
- [ ] indicator가 flat fallback에 영구 고정되지 않음.

# D. iPhone Safari

## REG-SAFARI-001 — 최초 접속

물리 iPhone Safari 새 탭에서:

- [ ] 최초 expanded 주소영역 뒤에 사이트가 만든 고체 색상판이 보이지 않음.
- [ ] `html/body` light root는 white, dark root는 `#0d0f13` family.
- [ ] 최초 `.nav-shell`은 normal flow로 시작.
- [ ] collection/FAB/question UI가 정상 존재.

## REG-SAFARI-002 — scroll transition

- [ ] Safari chrome compact 후 `safari-nav-sticky-armed`가 적용됨.
- [ ] nav가 기존 sticky top0 동작으로 자연스럽게 전환.
- [ ] 페이지 점프 없음.
- [ ] 주소영역 solid background가 재발하지 않음.
- [ ] hidden collection open/tab/close replay 없음.

## REG-SAFARI-003 — modal/safe area

- [ ] collection open/close 정상.
- [ ] FAB 그림자가 safe-area에 잘리지 않음.
- [ ] close 후 scroll 위치 복원.
- [ ] stale body/root lock 없음.

# E. 상단 챕터 내비게이션

- [ ] 순서: 시작/시장/교육/실무/포트폴리오/장비/수익/영업/아이폰/자료.
- [ ] nav target과 chapter `data-chapter` 일치.
- [ ] active chapter가 본문 위치와 맞음.
- [ ] 모바일 native x pan 가능.
- [ ] vertical scroll과 rail gesture 충돌 없음.
- [ ] first/last chip 접근 가능.
- [ ] rail당 liquid indicator 1개.
- [ ] label이 pill 위에 있음.
- [ ] progress가 selected pill geometry를 바꾸지 않음.
- [ ] PC에서 nav capsule이 화면 중앙 기준으로 정상 배치.

# F. Liquid controls

다음 모두 확인:

- [ ] top nav.
- [ ] collection primary tabs.
- [ ] theme choice.
- [ ] question write/saved selector.
- [ ] indicator 중복 없음.
- [ ] active button 자체에 ghost blue fill 없음.
- [ ] Breeze/spring 승인 이동감 유지.
- [ ] reduced-motion에서도 기능 유지.

# G. 질문 workspace

## Secondary selector

- [ ] `질문 작성 / 저장한 질문` 두 slot 정확히 1/2.
- [ ] search outer rail과 좌우 끝 일치.
- [ ] left/right selected pill 폭 동일.
- [ ] 좌우 outer gap mirror.
- [ ] count badge가 라벨 중심을 밀지 않음.
- [ ] legacy selector가 추가로 보이지 않음.

## Selection → question

- [ ] 본문 선택 시 `GPT에 질문` bubble 표시.
- [ ] selected text state 저장.
- [ ] click 후 collection 질문 write mode로 이동.
- [ ] selected quote 유지.
- [ ] 새 contextual entry가 이전 saved question draft를 끌고 오지 않음.

## Actions

- [ ] textarea 수정 가능.
- [ ] prompt copy.
- [ ] question save.
- [ ] ChatGPT open.
- [ ] saved count 즉시 갱신.
- [ ] saved card 재열기 시 quote/question 복원.
- [ ] delete 후 local/remote/count 정리.

# H. 내 모음

## FAB / sheet

- [ ] FAB 원래 위치와 safe-area 유지.
- [ ] bottom sheet가 화면 하단에 붙음.
- [ ] 중앙 floating modal로 바뀌지 않음.
- [ ] handle/title/close 유지.

## Primary tabs

- [ ] 전체/영상/읽을거리/질문/설정 존재.
- [ ] active indicator 정확.
- [ ] search/filter가 현재 tab에 맞음.

## Items / selection

- [ ] thumbnail/Q icon/text/remove 정렬.
- [ ] card가 viewport를 넘지 않음.
- [ ] 저장 URL click 정상.
- [ ] 선택 모드 진입 후 grid가 밀리거나 높이가 비정상 증가하지 않음.
- [ ] multi delete 후 bookmark/FAB count/local state 갱신.

# I. 다른 기기에서 이어보기

- [ ] sync key 복사.
- [ ] 다른 기기 연결 입력/적용.
- [ ] accordion open/close와 chevron 상태 일치.
- [ ] trigger `aria-expanded`가 state source.
- [ ] question history fetch/merge 정상.
- [ ] mobile/desktop 모두 동작.

# J. 콘텐츠/이미지

- [ ] `image-slot-registry.js`의 `ready:true` slot만 generated path 사용.
- [ ] chapter/market/skills/portfolio/gear/iPhone 이미지 binding 정상.
- [ ] Sony/Tamron/gear asset path 변경 없음.
- [ ] 이미지 load 실패 시 fallback 동작.
- [ ] generated data URL helper postload 정상.
- [ ] external curated/video failure가 core app render를 막지 않음.

# K. PC 가로 레일

- [ ] 마우스 왼쪽 drag일 때만 horizontal 이동.
- [ ] 세로 wheel/trackpad를 강제로 horizontal로 바꾸지 않음.
- [ ] drag 중 link/image/text native drag ghost 없음.
- [ ] 실제 drag 뒤 click suppress.
- [ ] 첫 카드 shadow가 잘리지 않음.
- [ ] 왼쪽 hard clip, 오른쪽 짧은 translucent blur/fade 유지.
- [ ] 마지막 카드 trailing runway 충분.
- [ ] 비동기 추가 rail도 동일 동작.

# L. 테마

- [ ] light/dark/system 선택 저장.
- [ ] system 선택 시 OS 변경 live 반영.
- [ ] dark canvas `#0d0f13` family.
- [ ] 제품 white stage 예외 유지.
- [ ] theme-color cleanup이 Safari chrome을 stale tint로 고정하지 않음.

# M. 구조 cleanup 전용 검증

파일 move/rename 작업에서는 추가로:

- [ ] old active blob과 new semantic file blob SHA가 동일한지 확인(내용 변경이 의도된 파일 제외).
- [ ] CSS 파일 개수/순서가 rename 전과 동일한지 확인(명시적 dead file 제외).
- [ ] JS runtime 순서가 rename 전과 동일한지 확인(명시적 dead definition 제외).
- [ ] old dead files/temporary diagnostics가 final tree에서 실제 삭제됐는지 확인.
- [ ] Functions/approved WebP/image-generation manifest가 cleanup 과정에서 삭제되지 않았는지 확인.
- [ ] docs가 삭제된 numbered path를 current owner로 안내하지 않는지 확인.

# N. 완료 전

- [ ] branch compare 검토.
- [ ] `main`이 작업 시작 이후 외부 변경되지 않았는지 재확인.
- [ ] fast-forward만 사용.
- [ ] main update 후 entry path/tree 재확인.
- [ ] Cloudflare 배포 후 가능한 범위의 live fetch 확인.
- [ ] 실제 iPhone Safari visual 검증이 필요한 항목은 사용자 실기기 확인을 받음.
