# Platform Library V1 Workstream

상태: `active`

이 폴더는 `먹고살기` 플랫폼의 공통 UI 블록, 디자인 레퍼런스, 글쓰기 규칙, Block Lab, 관리자 Block Editor를 실제 운영 가능한 수준으로 만드는 동안 진행상황을 추적하는 작업 폴더다.

## 운영 원칙

- 완료 전 진행상황의 원본은 Git이다.
- 실제 제품이 계속 참조하는 최종 규칙과 라이브러리는 `docs/library/`, `docs/spec-v1/`, runtime 코드에 남긴다.
- 조사 메모, 비교안, 폐기안, QA 기록, 완료 체크리스트처럼 개발 과정에서만 필요한 자료는 이 workstream 폴더에 둔다.
- 전체 기능이 실사용 승인되면 이 workstream 폴더를 Google Drive의 프로젝트 아카이브로 옮긴다.
- Drive 아카이브 후 Git에는 최종 라이브러리/명세와 아카이브 위치를 가리키는 짧은 완료 기록만 남긴다.
- Git history는 코드/명세 변경 이력을 계속 보존하므로 완료된 제품 규칙 자체를 Drive로만 옮기지 않는다.

## 최종 목표

관리자가 산업 분야를 추가하고, 승인된 UI 블록을 실제 화면을 보며 배치하고, 기본 방향과 내용을 입력하면 AI가 해당 블록의 목적·에디토리얼 규칙·레퍼런스·산업 맥락을 읽어 세부 초안을 작성할 수 있는 플랫폼을 만든다.

최종 흐름:

`산업 추가 → 블록 배치 → 기본 방향 입력 → AI 초안 → 실화면 검토 → 수정/사실검증 → SEO/GEO → 승인 → 발행`

## 단계

1. Reference Library
2. Editorial Library
3. UI Block Inventory + Block System V1 설계
4. Block Lab 한 페이지 구현
5. 기존 블록 정제 + 신규 범용 블록 보강
6. Approved Block Registry
7. 관리자 Block Editor
8. AI 콘텐츠 작성/검수 연결
9. SEO/GEO 편집 필드 연결
10. 실사용 QA + 아카이브

상세 상태와 완료 기준은 `TASKS.md`에서 관리한다.

## Drive 아카이브 규칙

완료 시 권장 위치:

`Photo-eBook / Project Archives / Platform Library V1 / <완료일>`

아카이브 대상:

- 이 `docs/workstreams/platform-library-v1/` 폴더 전체
- 최종 QA 캡처/검토 기록
- 구현 전후 비교 메모
- 폐기된 디자인 후보 기록

Git에 남는 항목:

- `docs/library/references/`
- `docs/library/editorial/`
- Block Registry/Block Lab 실제 코드
- 관리자 Editor 실제 코드
- 관련 `docs/spec-v1/` 계약
- 최종 README와 운영 문서
