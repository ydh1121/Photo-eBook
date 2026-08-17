# 19. Image Generation Failure Policy

이 문서는 `docs/spec-v1/18-image-generation-commit-automation.md`의 이미지 생성 단계에 적용되는 **강제 실패 판정 규칙**이다. 이미지 생성/커밋 자동 작업은 이 문서를 항상 함께 적용한다.

## FAIL-IMG-001 — 한 슬롯은 한 독립 이미지 파일

배치 요청은 여러 슬롯을 한 작업에서 처리한다는 의미일 뿐, 여러 슬롯을 한 캔버스에 합성한다는 의미가 아니다.

- 슬롯마다 별도의 generation call을 수행한다.
- 슬롯마다 별도의 최종 이미지 파일을 가진다.
- 한 슬롯의 결과 이미지에는 다른 슬롯의 미리보기나 결과물을 포함하지 않는다.

다음 결과는 **자동 실패**로 판정한다.

- dashboard
- infographic
- contact sheet
- collage
- mood board
- comparison grid
- progress report
- asset catalog
- 여러 개의 독립 사진을 한 캔버스에 배열한 결과
- Git/Drive/commit/status/ready/progress 등 프로젝트 관리 정보를 시각화한 결과

## FAIL-IMG-002 — 생성 이미지 내부 UI/운영정보 금지

본문 맥락상 UI 화면 자체가 피사체인 경우를 제외하고 다음 요소가 생성 이미지 안에 나타나면 실패다.

- 프로젝트 진행률
- 슬롯 ID
- 파일명
- Git commit SHA
- Drive 경로
- `ready:true` 같은 상태값
- 웹사이트 내비게이션
- 대시보드 카드
- 설명용 표/목록/배지
- 생성 완료 보고 문구

실패 결과는 production asset으로 사용하지 않는다.

## FAIL-IMG-003 — 프롬프트 핵심 장면 불일치

각 슬롯은 prompt library의 `맥락`, `역할`, `Prompt`, `Avoid`를 모두 검사한다.

다음 중 하나라도 해당하면 실패다.

- 핵심 피사체가 없음
- 촬영/작업 상황이 다른 산업이나 다른 챕터 문맥으로 바뀜
- 사진 대신 일러스트/3D/UI가 생성됨(프롬프트에서 명시하지 않은 경우)
- 장비 구조, 손, 얼굴, 케이블 등 핵심 물리 구조가 심각하게 비정상
- 읽을 수 있는 가짜 브랜드/소프트웨어 UI/문서 텍스트가 주요 영역에 생성됨
- `Avoid` 항목의 금지 요소가 주요 장면에 존재함

## FAIL-IMG-004 — 실패 결과의 상태 변경 금지

실패한 산출물은 다음 작업을 **절대 수행하지 않는다**.

- WebP production 경로 커밋
- manifest `ready:true`
- runtime slot `ready:true`
- Prompt Queue `applied`
- `applied-status.json` 추가
- Cloudflare 배포 대상 반영

실패 산출물은 폐기하거나 QA 기록에만 남긴다.

## FAIL-IMG-005 — 자동 재시도

사용자가 배치 이미지 생성을 요청한 경우 개별 슬롯 실패 때문에 사용자에게 매번 재지시를 요구하지 않는다.

1. 실패 슬롯만 별도 generation call로 다시 생성한다.
2. 즉시 이전 실패 결과를 reference로 사용하지 않는다.
3. 재시도 프롬프트의 첫 문장은 `Create exactly one standalone photographic image. No dashboard, collage, UI, text panel, contact sheet, or progress report.` 의미를 강제로 포함한다.
4. 최대 3회까지 자동 재시도한다.
5. 3회 모두 실패한 슬롯만 `generation_blocked`로 기록하고 나머지 통과 슬롯은 계속 파이프라인을 진행한다.

## FAIL-IMG-006 — 배치 기본 단위

사용자의 별도 지시가 없으면 한 배치는 6개 슬롯을 기본으로 한다.

- 한 번의 사용자 지시로 최대 6개 슬롯을 순차 생성한다.
- 각 슬롯은 독립 generation call이다.
- 모든 통과 이미지 생성이 끝난 후 WebP 변환/Drive/Git/상태 갱신은 한 묶음으로 처리한다.
- 사용자는 슬롯마다 별도 확인 메시지를 보낼 필요가 없다.

## FAIL-IMG-007 — QA 통과 기준

production 반영 전 최소 확인 항목:

1. 단일 독립 이미지인가
2. prompt의 본문 맥락과 일치하는가
3. 주요 피사체와 작업 상황이 자연스러운가
4. Avoid 요소가 없는가
5. 모바일 카드 크롭에서 핵심 피사체가 보존되는가
6. WebP 변환 후 파일이 정상적으로 decode되는가
7. Git binary 무결성 검증을 통과하는가
8. 배포 URL이 HTTP 200이며 WebP로 판별되는가

이 8개를 통과한 슬롯만 `applied`로 표시한다.
