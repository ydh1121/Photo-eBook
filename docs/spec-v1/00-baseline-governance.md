# 00. V1 기준점과 변경 거버넌스

## BASE-001 — 애플리케이션 기준 SHA

V1의 화면·동작·데이터 계약은 Git 커밋 `6fe9f6883baa45c3d39ad68d57c21f9d76bf5bfd`를 기준으로 한다. 명세 문서 자체를 추가한 이후의 커밋 SHA를 V1 애플리케이션 기준으로 해석하지 않는다.

## BASE-002 — 배포 구조

- 저장소: `ydh1121/Photo-eBook`
- production branch: `main`
- Cloudflare Pages output: `public/`
- build command: `exit 0`
- SPA fallback: `/* /index.html 200`
- `/` 및 `/index.html`: `no-store, no-cache, must-revalidate`
- API: Cloudflare Pages Functions `functions/api/*`

## BASE-003 — 명세 우선순위

우선순위는 다음과 같다.

1. 사용자의 현재 명시적 요청
2. `docs/spec-v1/`의 해당 세부 규칙
3. `UI_REGRESSION_SPEC.md`의 기존 승인 규칙
4. 기준 SHA의 실제 구현
5. legacy 파일의 주석/의도

현재 구현이 V1 normative 규칙과 다르면 구현을 자동으로 정답으로 취급하지 않는다. 차이는 기술부채로 분리한다.

## BASE-004 — 규범 용어

- **MUST**: 명시적 V1 변경 승인 없이는 깨면 안 됨.
- **SHOULD**: 특별한 이유가 없다면 유지. 변경 시 이유 기록.
- **MAY**: 구현 자유.
- **KNOWN DEBT**: 기준 코드에 존재하지만 새 구현에서 복제할 필요가 없는 결함/중복.
- **OWNER**: 특정 상태/DOM/애니메이션을 쓰는 단일 주체.

## BASE-005 — 변경 단위

모든 후속 작업은 최소 변경을 원칙으로 한다.

- 요청하지 않은 페이지/테마/모듈을 함께 재디자인하지 않는다.
- 전역 selector를 수정하기 전 영향을 받는 모든 컴포넌트를 확인한다.
- 이미 승인된 geometry를 고치기 위해 별도 controller를 추가하지 않는다.
- 같은 indicator/state를 여러 JS가 쓰는 구조를 새로 만들지 않는다.
- 기존 정상 동작을 우회하기 위한 임시 `!important`를 추가하기 전에 cascade owner를 찾는다.

## BASE-006 — 명세 변경 절차

V1 규칙 자체를 바꿀 때는 다음을 모두 수행한다.

1. 사용자가 변화된 최종 상태를 확인한다.
2. 관련 spec ID를 수정한다.
3. `README.md`의 기준 버전 또는 change note를 갱신한다.
4. 해당 코드와 명세를 같은 작업에서 대조한다.
5. 회귀 체크리스트를 수행한다.

단순 버그 수정은 명세 버전을 올리지 않는다.

## BASE-007 — 재구축 원칙

처음부터 다시 구현할 경우에도 다음은 그대로 가져간다.

- 10개 챕터 정보 구조
- 모바일 우선 읽기 경험
- Liquid Glass rail + moving selected pill 구조
- 내 모음 통합 허브
- 본문 선택 → 질문 작성 흐름
- 영상/읽을거리 즐겨찾기
- light/dark/system 테마
- Google Sheets 기반 콘텐츠·질문 동기화 계약
- iOS Safari의 알려진 제한과 회피 규칙

누적된 numbered CSS/JS override 파일 구조 자체는 재구축 시 복제 대상이 아니다.

## BASE-008 — 금지되는 ‘정리’

다음 행위는 명시적 요청 없이는 하지 않는다.

- 현재 디자인을 일반적인 디자인 시스템으로 임의 치환
- Liquid Glass를 평면 버튼으로 단순화
- 상단 rail을 JS drag carousel로 교체
- 내 모음을 별도 페이지로 바꾸기
- 질문 선택 흐름을 일반 textarea 폼으로 축소
- localStorage key 이름을 migration 없이 변경
- Safari 보정 코드를 이유 없이 삭제 또는 확대 적용

## BASE-009 — 코드 근거 기록

각 명세 항목은 가능한 경우 실제 source selector/function/file을 함께 기록한다. 후속 스킬이나 자동 검증은 spec ID → source owner → regression check 순서로 추적할 수 있어야 한다.
