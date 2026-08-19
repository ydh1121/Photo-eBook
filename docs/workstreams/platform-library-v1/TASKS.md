# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 이 workstream의 작업 순서와 현재 상태를 나타내는 canonical tracker다. 새 채팅방에서 작업을 재개할 때 대화 기록보다 이 파일을 우선한다.

## 01. Reference Library

- [x] 레퍼런스 분류 체계 정의
- [x] `arknow91/liquid-taffy` 분석
- [x] `arknow91/liquid-taffy` interaction/motion 레퍼런스 정식 등록
- [x] Git/`COPY_GUIDE`에서 식별 가능한 기존 외부 GitHub/UI/에디토리얼 레퍼런스 회수
- [x] 각 레퍼런스에 `참고할 것 / 적용 후보 / 적용 금지 / 라이선스 / 기술 의존성` 기록
- [x] UI 작업 전에 읽어야 하는 reference index 확정
- [ ] 과거 대화에만 남아 있고 현재 이름/URL을 식별할 수 없는 레퍼런스는 발견 시 지속 등록

완료 메모:
- `docs/library/references/README.md`
- `arknow91/liquid-taffy`
- `DaleSeo/korean-skills`
- `NomaDamas/k-skill`의 `korean-humanizer`
- 미식별 과거 링크는 추측해서 등록하지 않으며 이후 발견 시 inbox 방식으로 추가한다. 이 항목은 다음 단계의 blocker가 아니다.

완료 기준:
- 디자인/인터랙션 작업자가 레퍼런스의 목적과 적용 범위를 Git만 읽고 이해할 수 있음
- 외부 코드를 통째로 가져오지 않고 차용할 원칙이 명시됨

## 02. Editorial Library

- [x] 기존 `docs/spec-v1/20-korean-copywriting-skill.md`를 상위 Editorial Library와 연결
- [x] 사용자가 기획자로서 확정한 문장 작성 규칙 회수
- [x] 실제 before/after 사례 분류
- [x] heading / body / comparison / process / metric / CTA / source / SEO-GEO 규칙 분리
- [x] AI 작성 허용 범위와 사실 검증 규칙 정의
- [x] 산업 독립 규칙과 photography 특수 규칙 분리

완료 메모:
- `docs/library/editorial/README.md`
- `01-voice-principles.md`
- `02-block-copy-profiles.md`
- `03-ai-writing-and-review.md`
- `04-before-after-examples.md`
- 운영 `COPY_GUIDE`에도 회수된 사용자 규칙을 먼저 반영함

완료 기준:
- 각 Block type이 어떤 문장 규칙을 사용해야 하는지 참조 가능
- AI가 사실/수치/출처를 문체 수정 과정에서 임의 변경하지 않음

## 03. UI Block Inventory + Block System V1

- [x] 현재 photography 페이지의 시각 패턴 전수 분해
- [x] 중복 블록 통합
- [x] 챕터에 묶인 UI를 독립 block 후보로 분리
- [x] block data schema 정의
- [x] variant / responsive / accessibility 계약 정의
- [x] block별 editorial profile 연결
- [x] block별 reference profile 연결

완료 메모:
- `docs/library/blocks/V1-INVENTORY.md`
- `docs/library/blocks/BLOCK-CONTRACT.md`
- 편집 가능한 Content Block / 내부 Primitive / Platform Chrome를 분리
- 현재 photography에서 17개 block family로 통합

목표 초기 규모:
- 기존 페이지에서 추출 17종
- 신규 범용 블록 8~10종 후보
- V1 약 25종

## 04. Block Lab

- [x] production과 분리된 `/block-lab/` route 생성
- [x] 현재 17개 candidate block을 한 페이지에서 렌더
- [x] Fit / 390 / 768 / 1180 preview
- [x] light/dark preview
- [x] block별 variant 비교
- [x] candidate Block Registry + renderer 분리
- [ ] 승인 후 실제 production renderer로 승격/공유
- [x] block status/editorial profile/type 메타 표시
- [-] 배포 후 실제 화면 QA 및 사용자 디자인 검토

현재 코드:
- `public/block-lab/index.html`
- `public/assets/js/blocks/block-registry.js`
- `public/assets/js/blocks/block-renderers.js`
- `public/assets/js/block-lab/lab-data.js`
- `public/assets/js/block-lab/lab-app.js`
- `public/assets/styles/block-lab/lab.css`
- `public/assets/styles/block-lab/a11y.css`

중요:
- Block Lab renderer는 아직 `candidate`다.
- 기존 photography production renderer는 변경하지 않았다.
- `/block-lab/`은 `noindex,nofollow,noarchive`다.

완료 기준:
- 사진 본문을 찾아다니지 않고 한 페이지에서 모든 UI를 검토할 수 있음
- 사용자 실화면 검토를 거쳐 UI Refinement 대상으로 넘길 수 있음

## 05. UI Refinement

- [ ] typography hierarchy
- [ ] spacing rhythm
- [ ] 정보 밀도
- [ ] 카드 내부 구조
- [ ] 긴 문장 가독성
- [ ] 가로 rail 사용성
- [ ] 표/수치/비교 가독성
- [ ] 모바일/PC 균형
- [ ] 접근성 및 reduced-motion

완료 기준:
- approved 블록만 production 신규 페이지에서 사용 가능

## 06. 신규 범용 블록

후보:
- [ ] FAQ / accordion
- [ ] pros & cons
- [ ] comparison table
- [ ] timeline
- [ ] KPI / stat
- [ ] image + copy split
- [ ] gallery
- [ ] quote / expert comment
- [ ] calculator / simulation
- [ ] location / map
- [ ] service/business comparison
- [ ] CTA / external action

실제 필요성과 중복 여부를 Block Lab에서 검토한 뒤 V1 포함 여부를 결정한다.

## 07. Approved Block Registry

- [ ] block id / type / schema / variants / status 계약
- [ ] approved/deprecated lifecycle
- [ ] 분야 pack에서 승인 블록만 참조하도록 validation
- [ ] Block Lab과 production renderer 동일 registry 사용

## 08. 관리자 Block Editor

- [ ] 산업 분야 생성/복제
- [ ] block 추가/삭제/복제
- [ ] drag-and-drop 순서 변경
- [ ] inline text edit
- [ ] 속성 inspector
- [ ] 이미지 선택/교체
- [ ] desktop/tablet/mobile preview
- [ ] light/dark preview
- [ ] draft/published 분리
- [ ] undo/version restore

## 09. AI 콘텐츠 작성/검수

- [ ] page brief 입력
- [ ] block 단위 AI 초안
- [ ] 전체 페이지 AI 검토
- [ ] 사용자 작성 내용 lock
- [ ] 사실/수치/출처 검증 상태
- [ ] editorial profile 적용
- [ ] reference profile 적용

## 10. SEO/GEO + Publish

- [ ] pack별 SEO metadata
- [ ] source/evidence 필드
- [ ] structured data 필드
- [ ] robots/sitemap 정책
- [ ] AI crawler 정책
- [ ] publish snapshot
- [ ] 실사용 QA
- [ ] Drive workstream archive

## 재개 규칙

새 채팅방 또는 다른 작업 세션에서 이 workstream을 재개할 때는 반드시 다음 순서로 시작한다.

1. 저장소 루트 `AGENTS.md` 읽기
2. 이 `TASKS.md` 읽기
3. 같은 폴더의 `HANDOFF.md` 읽기
4. `main` 최신 commit 확인
5. `[-] active` 항목과 `HANDOFF.md`의 `Next action`이 일치하는지 확인
6. 마지막 변경 파일과 관련 명세를 읽은 뒤 작업 재개

대화 기록만 보고 현재 상태를 추정하지 않는다.
