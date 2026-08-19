# tastesmd/TASTES.md

- Reference ID: `design-tastesmd-tastes-md`
- Source: `tastesmd/TASTES.md`
- URL: `https://github.com/tastesmd/TASTES.md`
- Primary category: `design-taste`
- Tags: `taste-profile, aesthetic-constraints, reject, require, ambiguous, collaboration, agent-memory`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

사용자와 AI가 여러 번 화면을 고치며 축적한 디자인 취향을 매번 대화 기억에만 두지 않고, 짧은 선언형 규칙으로 추출해 계속 적용한다는 방법론을 제안한다. 이 프로젝트가 Git의 Reference Library·Editorial Library·Block Library로 사용자 판단을 고정하려는 방향과 잘 맞는다.

## 참고할 것

- aesthetic judgment를 `REJECT / REQUIRE / WHEN AMBIGUOUS`처럼 짧고 실행 가능한 규칙으로 압축하는 방식
- 처음부터 일반적인 디자인 원칙을 강요하기보다 사용자와의 실제 협업에서 취향을 추출하는 방식
- 사용자가 교정하거나 승인한 뒤 규칙을 확정하는 과정
- 새로운 피드백이 쌓이면 기존 taste profile을 갱신하는 lifecycle

## 적용 후보

- 향후 `docs/library/design-taste/PLATFORM-TASTES.md` 형태의 프로젝트 고유 taste profile
- Block Lab에서 반복적으로 발생하는 사용자 피드백의 규칙화
- 관리자 AI 디자인 제안 전에 읽는 최상위 디자인 취향 요약
- 새로운 채팅방에서 디자인 기준을 빠르게 복원하는 handoff 자료

## 적용하지 않을 것

- 사용자가 승인하지 않은 AI 추론을 취향으로 확정하지 않음
- 500 token 같은 외부 형식 제한을 프로젝트 규칙으로 강제하지 않음
- Reference Library와 상세 명세를 TASTES 한 파일로 대체하지 않음
- 다른 프로젝트나 디자이너의 취향을 이 프로젝트 사용자 취향으로 가져오지 않음

## 기술 의존성

방법론/Markdown 중심. runtime dependency 없음.

## 라이선스

Repository의 `LICENSE` 파일은 MIT License다. README에는 현재 `MIT-0`이라고 적힌 부분이 있어 표기가 서로 다르므로, 원문을 직접 복제해야 하는 상황에서는 최신 LICENSE와 repository 상태를 다시 확인한다.

## Integration rule

1. taste rule은 사용자의 실제 승인/거절 사례에서만 추출한다.
2. 규칙은 추상적 감상보다 구현 가능한 문장으로 쓴다.
3. 상세 Block Contract와 accessibility 명세보다 상위 취향 문구가 우선하지 않는다.
4. 새로운 사용자 피드백과 충돌하면 기존 taste rule을 갱신한다.
