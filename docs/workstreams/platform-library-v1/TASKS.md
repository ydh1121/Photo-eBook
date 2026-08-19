# Platform Library V1 Tasks

상태 표기: `[ ] queued` / `[-] active` / `[x] done` / `[!] blocked`

이 파일은 이 workstream의 작업 순서와 현재 상태를 나타내는 canonical tracker다. 새 채팅방에서 작업을 재개할 때 대화 기록보다 이 파일을 우선한다.

## 01. Reference Library

- [x] 레퍼런스 분류 체계 정의
- [x] `arknow91/liquid-taffy` 분석/등록
- [x] 사용자가 제공한 과거 외부 GitHub 링크 세트 9개 전부 확인/등록
- [x] 각 레퍼런스에 적용 후보/금지 범위/라이선스/기술 의존성 기록
- [x] design-taste / component-system / interaction-motion / editorial-writing / discovery 분류 확장
- [x] Reference Library index 확정
- [ ] 향후 추가로 발견되는 과거/신규 레퍼런스는 지속 등록

현재 주요 reference:
- `arknow91/liquid-taffy`
- `emilkowalski/skills`
- `Meliwat/awesome-ios-design-md`
- `VoltAgent/awesome-design-md` Apple DESIGN.md
- `Leonxlnx/taste-skill`
- `tastesmd/TASTES.md`
- GitHub `ai-design` topic discovery source
- `Shinwoo-Park/katfishnet`
- `DaleSeo/korean-skills`
- `dotoricode/korean-humanizer`
- `NomaDamas/k-skill` korean-humanizer

완료 기준:
- 디자인/인터랙션/에디토리얼 작업자가 각 레퍼런스의 역할과 한계를 Git만 읽고 이해할 수 있음
- 외부 코드를 통째로 가져오지 않고 필요한 원리만 차용하는 원칙이 명시됨

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

## 03. UI Block Inventory + Block System V1

- [x] photography 페이지 시각 패턴 전수 분해
- [x] 중복 블록 통합
- [x] 챕터에 묶인 UI를 독립 block 후보로 분리
- [x] block data schema 정의
- [x] variant / responsive / accessibility 계약 정의
- [x] block별 editorial profile 연결
- [x] block별 reference profile 연결

완료 메모:
- `docs/library/blocks/V1-INVENTORY.md`
- `docs/library/blocks/BLOCK-CONTRACT.md`
- Content Block / Primitive / Platform Chrome 분리
- photography에서 17개 block family 추출

## 04. Block Lab

- [x] production과 분리된 `/block-lab/` route 생성
- [x] 27개 candidate block을 한 페이지에서 렌더
- [x] Fit / 390 / 768 / 1180 preview
- [x] light/dark preview
- [x] block별 variant 비교
- [x] candidate Block Registry + renderer 분리
- [x] block status/editorial profile/type 메타 표시
- [x] 신규 calculator interaction 샘플 동작
- [ ] 승인 후 실제 production renderer로 승격/공유
- [-] 배포 후 실제 화면 QA 및 사용자 디자인 검토

중요:
- Block Lab renderer는 아직 `candidate`다.
- 기존 photography production renderer는 변경하지 않았다.
- `/block-lab/`은 `noindex,nofollow,noarchive`다.

## 05. UI Refinement

코드 레벨 1차 정제:
- [x] typography hierarchy
- [x] spacing rhythm
- [x] 정보 밀도
- [x] 카드 내부 구조
- [x] 긴 문장 가독성
- [x] 가로 rail 좌우 runway/여백
- [x] 표/수치/비교 가독성
- [x] 모바일/PC responsive 1차 정제
- [x] 접근성/reduced-motion 기존 계약 유지
- [-] 실제 화면 기준 사용자 피드백 반영 및 2차 정제

관련:
- `docs/library/design-taste/PLATFORM-TASTES.md`
- `public/assets/styles/block-lab/refinement-v2.css`

완료 기준:
- 사용자 검토 후 각 candidate를 `approved / redesign / merge / deprecated`로 결정 가능

## 06. 신규 범용 블록

- [x] FAQ / accordion → `faq`
- [x] pros & cons → `pros-cons`
- [x] comparison table → `comparison-table`
- [x] timeline → `timeline`
- [x] KPI / stat → 별도 type 없이 기존 `metric-grid`에 통합
- [x] image + copy split → `image-copy-split`
- [x] gallery → `gallery`
- [x] quote / expert comment → `quote-expert`
- [x] calculator / simulation → `calculator`
- [!] location / map → provider/API/privacy 계약 전까지 보류
- [x] service/business comparison → `service-list` + 기존 comparison 조합
- [x] CTA / external action → `cta`

완료 메모:
- 신규 독립 type 10개 추가
- 총 candidate 27개
- `docs/library/blocks/V1-EXPANSION.md`
- `block-renderers-extended.js`
- `lab-data-extended.js`
- `lab-interactions-extended.js`
- `new-blocks-v2.css`

## 07. Approved Block Registry

- [ ] 사용자 Block Lab 검토 결과 수집
- [ ] block별 `approved / redesign / merge / deprecated` 결정
- [ ] block id / type / schema / variants / status 최종 계약
- [ ] approved/deprecated lifecycle
- [ ] 분야 pack에서 승인 블록만 참조하도록 validation
- [ ] Block Lab과 production renderer 동일 registry 사용

Phase 07은 사용자 시각 검토 전 자동 승인하지 않는다.

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
