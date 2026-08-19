# NomaDamas/k-skill — korean-humanizer

- Reference ID: `editorial-nomadamas-korean-humanizer`
- Source: `NomaDamas/k-skill`
- URL: `https://github.com/NomaDamas/k-skill/tree/main/korean-humanizer`
- Primary category: `editorial-writing`
- Tags: `korean, humanizer, ai-writing, translationese, over-editing, voice, fact-preservation`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

프로젝트 `COPY_GUIDE`에서 이미 `NomaDamas korean-humanizer`를 과윤문 방지, 문장 리듬, 수치 보존의 참고 근거로 사용하고 있다. 원본 저장소의 `korean-humanizer`는 AI식 번역체와 상투어를 줄이되 사실·수치·고유명사와 원문의 장르를 보존하고, 문제가 없는 문장은 건드리지 않는다는 원칙을 강하게 둔다.

이 프로젝트에서 특히 중요한 지점은 “자연스럽게 고친다”를 이유로 전체 문장을 다시 쓰지 않는다는 점이다.

## 참고할 것

- 의미와 사실, 수치, 고유명사, 직접 인용을 보존하는 원칙
- AI 흔적이 실제로 확인된 구간만 수정하는 방식
- 장르와 격식을 유지하는 방식
- 과윤문을 실패로 보는 관점
- 번역투, 과도한 명사화·피동, AI 상투어, 과장된 의의 부여를 별도로 탐지하는 방식
- 사용자 글 샘플이 있으면 문장 길이·종결어미·어휘·리듬을 분석해 voice를 맞추는 방식
- 글자수 조정이 필요해도 없는 사실을 지어내지 않는 원칙

## 적용 후보

- AI 초안의 humanizing 단계
- 사용자가 직접 작성한 문장을 AI가 보완할 때의 수정 한계
- 관리자 Editor의 `현재 내용 보완` 기능
- 전체 페이지 발행 전 AI 티 점검
- Editorial Library의 fact-lock / user-copy-lock 정책

## 적용하지 않을 것

- 사용자의 고유 문체를 일반적인 “자연스러운 한국어 평균값”으로 바꾸는 것
- 문제가 없는 문장을 전부 다시 쓰는 것
- 수치, 가격, 기간, 모델명, 법·제도 조건을 문장 흐름을 이유로 변경하는 것
- 블록 목적이나 정보 구조를 humanizer가 임의 변경하는 것
- 외부 humanizer의 표현을 프로젝트 고유 문체보다 우선하는 것

## 기술 의존성

원본은 `NomaDamas/k-skill`의 Agent Skill로 제공되며 CLI를 통해 최신 instruction을 읽는 구조다.

현재 플랫폼 runtime에 CLI나 해당 repository를 production dependency로 넣지 않는다. 필요한 원칙은 프로젝트 Editorial Library의 검수 계약으로 흡수한다.

## 라이선스

`NomaDamas/k-skill` repository는 MIT License로 공개되어 있다.

원문 instruction을 substantial portion으로 직접 복사하는 경우 원 저작권/라이선스 고지를 확인한다. 프로젝트 library에는 원문의 문장을 장문 복제하지 않고 적용 원칙을 요약한다.

## Integration rule

1. 사용자 확정 문장과 프로젝트 Editorial Library가 최상위 authority다.
2. humanizer는 구조 설계 도구가 아니라 문장 품질 검수 도구다.
3. 사실과 사용자 작성 의도를 lock한 뒤 표현만 수정한다.
4. 자연스러운 기존 문장은 유지한다.
5. 수정 후에는 모바일 줄바꿈과 정보 순서까지 다시 확인한다.

## Source review notes

원본 `korean-humanizer`는 의미 불변, 근거 기반 수정, 장르 유지, 과윤문 금지를 핵심 원칙으로 둔다. 또한 AI 흔적을 심각도별로 구분하고, 문제가 없는 구간을 보존하며, voice sample이 있으면 그 문체에 맞춰 다시 쓰는 방식을 제시한다.

이 프로젝트에서는 특히 `사용자 확정 문장 > 프로젝트 문맥 > 외부 humanizer` 우선순위를 유지한다.
