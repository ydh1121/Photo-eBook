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

배치 생성의 구현 의미는 **동일한 작업 흐름 안에서 슬롯별 독립 generation call을 연속 실행하는 것**이다. `n>1` 한 번 호출이나 한 프롬프트에 여러 슬롯 장면을 동시에 요구해서 결과를 한 캔버스에 합치는 방식은 사용하지 않는다.

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

생성 결과가 prompt와 어긋나거나 다음 문제가 있으면 해당 결과는 자동 QA 실패로 판정하고 폐기한다.

- 본문과 다른 장면
- 생성 프로젝트를 설명하는 dashboard/infographic으로 오해한 결과
- progress report, admin UI, website mockup, presentation slide
- contact sheet, comparison grid, mood board, collage
- 여러 슬롯/여러 완성 이미지를 한 캔버스에 카드처럼 배치한 결과
- slot id, 파일명, Git/Drive/Cloudflare/적용 상태/진행률이 이미지 안에 들어간 결과
- 읽을 수 있는 가짜 UI/문구가 핵심에 포함됨
- 비현실적 손, 카메라, 렌즈, 조명, 제품 구조
- 슬롯 crop에서 핵심 피사체가 사라짐
- 다른 slot과 사실상 동일한 장면

폐기 결과는 Git, Drive Generated WebP, `ready:true`, Prompt Queue `applied`에 반영하지 않는다.

### 자동 재시도

실패한 슬롯은 사용자에게 새 지시를 요구하지 않고 자동으로 재시도한다.

1. 원래 slot context/prompt를 유지한다.
2. 생성 입력에서 프로젝트 운영·Git·Drive·배포 등 메타 문맥을 제거한다.
3. 해당 슬롯 하나의 장면만 남긴다.
4. `single standalone photograph`, `one scene only`, `no text`, `no UI`, `no dashboard`, `no collage`, `no contact sheet`를 강제한다.
5. 별도 generation call로 다시 생성한다.
6. 같은 context-bleed 실패가 연속 2회 발생하면 text-only generation을 중단한다.
7. 검증된 정상 실사 자산을 바로 앞 시각 앵커로 제시하고 편집 생성으로 전환한다.
8. 시각 앵커 편집도 실패하면 그 슬롯만 `qa_failed`로 기록한다.
9. 그 경우에도 다음 슬롯으로 자동 진행하며 성공한 슬롯의 적용은 계속한다.

실패 슬롯 때문에 전체 배치를 멈추거나 사용자에게 슬롯별 재지시를 요구하지 않는다.

## WORK-IMG-003A — 정상 결과 gate

생성된 파일은 다음을 모두 만족할 때만 QA 통과다.

- 슬롯 1개에 대응하는 독립 파일 1개
- 한 개의 연속된 물리 장면 또는 완성 결과물 1개
- dashboard/slide/web mockup이 아니라 실제 사진 또는 해당 슬롯에 지정된 최종 시각물
- 1~2초 안에 슬롯의 주제가 식별됨
- 핵심 피사체가 모바일 카드 crop 안전영역에 남음
- 이미지 자체에 작업 규칙, 진행률, 파일명, Git/Drive 정보가 없음
- 슬롯 prompt의 필수 피사체/행동/환경을 충족함
- 같은 배치의 다른 슬롯과 의미가 중복되지 않음

실사 슬롯의 대표 정상 형태:

- 제품/브랜드: 제품 또는 일관된 한 브랜드 세트가 화면의 명확한 주인공
- 전문직 프로필: 인물 1명이 명확한 주인공인 비즈니스 초상
- 음식/매장: 대표 메뉴 한 접시 또는 한 테이블이 주인공이며 매장 맥락은 보조
- 작업환경: 실제 한 촬영 세팅을 하나의 BTS 장면으로 보여줌
- 리터칭: 한 작업자가 하나의 모니터/태블릿에서 한 종류의 작업을 수행

이 gate를 통과하지 않은 파일은 아무리 시각적으로 좋아 보여도 `ready:true`로 만들지 않는다.

## WORK-IMG-003B — 시각 앵커 회복 생성

대화 문맥 오염으로 meta/dashboard 결과가 반복되면 다음 순서로 회복한다.

1. 동일 산업/슬롯과 가장 가까운 **이미 검증된 정상 실사 이미지**를 선택한다.
2. 해당 이미지를 바로 앞에서 시각적으로 제시하거나 명시적 편집 대상으로 지정한다.
3. 앵커에서 현실감, 조명 언어, 공간 스케일만 유지하고 슬롯에 불필요한 요소는 제거한다.
4. 새 슬롯의 주제를 중심으로 장면을 재구성한다.
5. 결과는 여전히 하나의 독립 이미지 파일이어야 한다.
6. dashboard/collage/infographic 실패 이미지는 앵커로 재사용하지 않는다.

이 방식은 특히 음식, 제품, 프로필, 작업환경처럼 기존 정상 실사 자산이 존재하는 슬롯에서 text-only 재시도보다 우선한다.

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

## WORK-IMG-006 — Git binary commit / 무결성 검증

최종 이미지는 base64 문자열, JS inline data URI 또는 임시 외부 URL로 production에 넣지 않는다. 최종 상태는 반드시 실제 binary WebP가 manifest에 예약된 `public/assets/images/generated/v1/...` 경로에 존재해야 한다.

### 기본 원칙

Git connector를 통해 대용량 binary/base64를 한 번에 직접 `create_blob` 하는 방식은 사용하지 않는다. connector/runtime 전송 과정에서 payload가 잘리거나 변형되어도 Git object 생성 자체는 성공할 수 있기 때문이다.

이미지 binary를 connector 환경에서 Git으로 옮길 때는 다음 **검증형 staging → GitHub Actions 복원 방식**을 기본으로 한다.

1. 적용할 WebP들을 tar.gz 등 단일 archive로 묶는다.
2. archive의 SHA-256을 로컬에서 계산한다.
3. archive를 base64 text로 변환한다.
4. 충분히 작은 고정 크기 text chunk로 나눈다.
5. 각 chunk의 예상 Git blob SHA를 로컬에서 계산한다.
6. chunk를 `image-upload-staging/part-*.txt`로 올리며 생성된 blob SHA가 예상 SHA와 일치하는지 검증한다.
7. 모든 chunk가 정확히 올라간 뒤에만 `image-upload-staging/ready.txt`를 추가한다.
8. `.github/workflows/image-binary-import.yml` 또는 동등한 import workflow가 chunk를 순서대로 결합하고 base64 decode한다.
9. Actions에서 archive SHA-256을 다시 검증한다. 불일치하면 즉시 실패하고 production asset을 변경하지 않는다.
10. archive를 풀고 각 대상 파일이 non-empty WebP인지 `file`/size 검사한다.
11. 검증 통과 시에만 production 경로를 교체하고 cache revision을 올린다.
12. staging 파일을 삭제한 뒤 bot commit으로 `main`에 반영한다.

직접 binary API가 해당 환경에서 원본 bytes와 hash를 보존한다고 검증된 경우에만 더 단순한 binary upload 방식을 사용할 수 있다.

### 캐시 규칙

이미지 파일을 동일 경로에서 교체한 경우 `image-slots-v1.js`의 해당 slot `rev`와 `index.html`의 slot runtime script version을 증가시켜 Safari/CDN/browser의 이전 응답을 우회한다.

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

binary repair가 발생한 경우 최초 commit을 최종 적용 commit으로 남겨두지 않고, 최종 검증된 repair/application commit SHA로 갱신한다. 필요하면 최초 실패 SHA는 별도 history 필드로 보존한다.

## WORK-IMG-009 — 사용자 검수 배치

사용자가 “일단 반영된 걸 보고 다음으로 가겠다”고 한 경우에도 현재 승인 배치는 실제 사이트에 적용한 뒤 멈춘다. 다음 미승인 배치를 선행 생성·활성화하지 않는다.

실제 배포 화면에서 crop/맥락이 좋지 않으면 해당 slot만 regenerate 또는 crop 조정하고, 인접 UI geometry를 이미지에 맞춰 임의 재설계하지 않는다.

## WORK-IMG-010 — 완료 보고 조건

다음을 수행하기 전에는 “반영 완료”라고 보고하지 않는다.

1. Git binary 존재 확인.
2. Git 파일 size/hash가 최종 검수 원본과 일치하는지 확인.
3. `ready:true` 확인.
4. manifest/runtime path 및 cache revision 일치 확인.
5. Drive mirror 확인.
6. Prompt Queue applied 및 최종 Git commit SHA 확인.
7. 시작 SHA와 종료 SHA Git compare 확인.
8. 가능한 경우 실제 배포 URL에서 HTTP 200, content type/file signature, expected size를 확인.
9. 실제 page/binder에서 대상 slot이 올바른 DOM에 연결되는지 확인.

배포 전파 중이면 `Git 적용 완료 / 배포 전파 대기`로 구분한다.

## WORK-IMG-011 — Skill 구현 기준

향후 프로젝트 전용 이미지 Skill을 만들 때 이 문서를 그대로 작업 contract로 사용한다. Skill의 기본 명령은 “이미지를 만들어 보여준다”가 아니라 **prompt/context 해석 → 슬롯별 독립 생성 호출들의 배치 → 정상/실패 gate → 자동 재시도/시각 앵커 회복 → QA → WebP → 검증형 Git binary transfer → Drive → ready → queue → deploy validation** 전체 트랜잭션이다.
