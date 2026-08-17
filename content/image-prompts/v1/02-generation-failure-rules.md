# 02. Generation Failure Rules

모든 V1 이미지 생성은 `00-global-rules.md`, `01-photo-industry-rules.md`와 함께 이 파일을 반드시 적용한다.

## 강제 실패

아래 결과는 즉시 실패 처리한다.

- dashboard / infographic / collage / contact sheet / mood board / comparison grid / progress report / asset catalog
- 한 캔버스에 여러 슬롯 이미지를 합성한 결과
- 슬롯 ID, 파일명, Git SHA, Drive 경로, `ready:true`, 진행률 등 프로젝트 관리 정보가 이미지 안에 들어간 결과
- 프롬프트가 실사를 요구했는데 UI/일러스트/3D가 생성된 결과
- 핵심 피사체·작업 상황이 본문 맥락과 다른 결과
- `Avoid` 항목의 주요 금지요소가 포함된 결과
- 심각한 손/얼굴/장비/케이블 구조 오류

## 배치 원칙

- 기본 배치: 6개 슬롯.
- 사용자 지시는 한 번만 받는다.
- 각 슬롯은 **독립 generation call**로 생성한다.
- 결과는 슬롯별 독립 파일이어야 한다.
- 배치 전체를 한 이미지로 합성하지 않는다.
- 통과 슬롯만 WebP → Drive → Git → `ready:true` → `applied`로 진행한다.

## 자동 재시도

실패 슬롯은 사용자에게 매번 재지시를 요구하지 않고 최대 3회 자동 재시도한다.

재시도 지시는 항상 다음 의미로 시작한다.

> Create exactly one standalone photographic image. No dashboard, collage, UI, text panel, contact sheet, progress report, or multi-image layout.

3회 모두 실패한 슬롯만 `generation_blocked`로 남긴다. 다른 슬롯은 계속 반영한다.

## 상태 변경 금지

실패 결과에는 절대 다음을 수행하지 않는다.

- production WebP commit
- manifest/runtime `ready:true`
- Prompt Queue `applied`
- `applied-status.json` 추가

## QA

최종 반영 전 확인:

1. 단일 독립 이미지
2. 본문 맥락 일치
3. Prompt/Avoid 준수
4. 모바일 카드 크롭 적합
5. WebP 정상 decode
6. Git binary integrity 통과
7. Cloudflare 배포 URL HTTP 200 + WebP 판별
