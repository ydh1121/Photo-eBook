# 18. 이미지 생성 · 커밋 자동 수행 규약

이 문서는 Photo-eBook에서 이미지 생성 또는 이미지 교체 요청을 받았을 때 ChatGPT/Codex/향후 프로젝트 Skill이 수행해야 하는 **끝까지 이어지는 기본 트랜잭션**을 고정한다. 사용자가 이미지 생성만 명시적으로 요청하고 반영을 금지한 경우를 제외하면, 이미지 생성 작업은 생성 파일을 채팅에 보여주는 단계에서 끝내지 않는다.

## WORK-IMG-001 — 기본 자동 수행 범위

`content/image-prompts/v1/`의 prompt/manifest에 대응하는 이미지 생성·교체 요청을 받으면 다음을 하나의 작업으로 수행한다.

1. `docs/spec-v1/17-image-generation-system.md` 확인.
2. `00-global-rules.md`, 해당 industry rules, 대상 IMG prompt 확인.
3. 실제 본문/renderer와 slot 의미 재확인.
4. manifest의 `slot_id`와 예약 `path` 확인.
5. 독립 이미지 파일을 생성.
6. 본문 적합성, 왜곡, 손/장비/제품 구조, crop을 QA.
7. 통과 이미지를 WebP로 변환·최적화.
8. 예약된 Git 경로에 실제 binary asset을 commit.
9. Google Drive `Generated WebP`에 결과를 mirror.
10. Git asset 존재 + QA + Drive mirror가 확인된 slot만 runtime/manifest `ready:true`로 전환.
11. Prompt Queue를 `applied`로 갱신하고 Git commit, Drive file id, 적용 시각을 기록.
12. 배포 후 실제 page/binder에서 표시 여부와 crop을 확인.
13. 시작 SHA와 종료 SHA를 compare하여 unrelated change가 없는지 검증.

사용자가 각 단계를 별도로 다시 지시할 필요가 없다.

## WORK-IMG-002 — 배치 생성

여러 슬롯은 한 번의 사용자 지시에서 배치로 생성할 수 있다. 기본 검수 배치는 4~8개를 권장한다.

그러나 **한 슬롯 = 한 독립 최종 이미지 파일** 규칙은 유지한다.

금지:

- 여러 슬롯을 한 캔버스에 합친 dashboard
- infographic
- contact sheet
- mood board
- comparison grid
- collage
- 이미지 내부에 slot id, 파일명, 진행률, prompt 설명, 프로젝트 관리 UI를 삽입

사용자가 이런 검수판 자체를 명시적으로 요청한 경우에만 별도 산출물로 만들 수 있으며, 검수판을 production slot asset으로 사용하지 않는다.

## WORK-IMG-003 — 실패 결과 처리

생성 결과가 prompt와 어긋나거나 다음 문제가 있으면 해당 결과는 폐기한다.

- 본문과 다른 장면
- 생성 프로젝트를 설명하는 dashboard/infographic으로 오해한 결과
- 읽을 수 있는 가짜 UI/문구가 핵심에 포함됨
- 비현실적 손, 카메라, 렌즈, 조명, 제품 구조
- 슬롯 crop에서 핵심 피사체가 사라짐
- 다른 slot과 사실상 동일한 장면

폐기 결과는 Git, Drive Generated WebP, `ready:true`, Prompt Queue `applied`에 반영하지 않는다.

## WORK-IMG-004 — ready gate

`ready:true`는 단순히 이미지가 생성되었다는 뜻이 아니다. 다음을 모두 통과한 적용 상태다.

- production path에 WebP binary 존재
- prompt/body-context QA 통과
- target crop 검토
- runtime slot path 일치
- manifest path 일치
- Drive mirror 존재
- Prompt Queue 적용 상태 기록

일부 슬롯만 성공한 배치에서는 성공한 슬롯만 `ready:true`/`applied`로 만든다.

## WORK-IMG-005 — reference_required

실제 장비/제품처럼 `source_class: reference_required`인 항목은 자유 생성하지 않는다. 신뢰 가능한 참조 원본의 형상·마킹·비율을 보존하는 정규화/편집 작업으로 처리한다.

## WORK-IMG-006 — Git binary commit

최종 이미지는 base64 문자열, JS inline data URI 또는 임시 외부 URL로 production에 넣지 않는다.

실제 binary WebP를 manifest에 예약된 `public/assets/images/generated/v1/...` 경로에 commit한다. Git connector가 Contents API로 binary upload를 지원하지 않는 환경에서는 `create_blob → create_tree → create_commit → update_ref` 순서를 사용한다.

## WORK-IMG-007 — Drive mirror

Git이 runtime source of truth다. Drive `Generated WebP`는 생성 결과와 검수 이력의 mirror다.

Git과 Drive 중 한 곳만 반영된 상태는 완료로 보고하지 않는다. Drive upload가 일시적으로 실패하면 Git slot을 무조건 되돌릴 필요는 없지만 Prompt Queue 상태를 `git_applied_drive_pending`처럼 명시하여 `applied`로 가장하지 않는다.

## WORK-IMG-008 — Prompt Queue 상태

권장 상태:

- `prompt_ready`
- `generating`
- `qa_failed`
- `generated_pending_apply`
- `git_applied_drive_pending`
- `applied`
- `reference_required`
- `preserve`

`applied`에는 가능하면 다음 추적값을 함께 기록한다.

- Git final/application commit SHA
- Drive file id
- applied_at

## WORK-IMG-009 — 사용자 검수 배치

사용자가 “일단 반영된 걸 보고 다음으로 가겠다”고 한 경우에도 현재 승인 배치는 실제 사이트에 적용한 뒤 멈춘다. 다음 미승인 배치를 선행 생성·활성화하지 않는다.

실제 배포 화면에서 crop/맥락이 좋지 않으면 해당 slot만 regenerate 또는 crop 조정하고, 인접 UI geometry를 이미지에 맞춰 임의 재설계하지 않는다.

## WORK-IMG-010 — 완료 보고 조건

다음을 수행하기 전에는 “반영 완료”라고 보고하지 않는다.

1. Git binary 존재 확인.
2. `ready:true` 확인.
3. manifest 일치 확인.
4. Drive mirror 확인.
5. Prompt Queue applied 확인.
6. Git compare 확인.
7. 가능한 경우 실제 배포 URL 응답/표시 확인.

배포 전파 중이면 `Git 적용 완료 / 배포 전파 대기`로 구분한다.

## WORK-IMG-011 — Skill 구현 기준

향후 프로젝트 전용 이미지 Skill을 만들 때 이 문서를 그대로 작업 contract로 사용한다. Skill의 기본 명령은 “이미지를 만들어 보여준다”가 아니라 **prompt/context 해석 → 생성 → QA → WebP → Git → Drive → ready → queue → deploy validation** 전체 트랜잭션이다.
