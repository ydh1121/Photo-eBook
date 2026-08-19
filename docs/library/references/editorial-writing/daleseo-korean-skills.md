# DaleSeo/korean-skills

- Reference ID: `editorial-daleseo-korean-skills`
- Source: `DaleSeo/korean-skills`
- URL: `https://github.com/DaleSeo/korean-skills`
- Primary category: `editorial-writing`
- Tags: `korean, humanizer, grammar, style-guide, ai-writing, terminology, consistency`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

플랫폼의 산업 콘텐츠는 AI가 초안을 작성하거나 수정하는 비율이 높아질 예정이다. 따라서 한국어 자연스러움, 문법, 용어/형식 일관성을 분리해서 검토하는 외부 기준이 필요하다.

이 저장소는 humanizer, grammar-checker, style-guide를 별도 스킬로 나누고, 자연스러움 → 문법 → 스타일 일관성 순서의 검토 흐름을 제안한다. 현재 프로젝트의 `docs/spec-v1/20-korean-copywriting-skill.md`를 대체하지 않고 보조 baseline으로 사용한다.

## 참고할 것

- AI 문장에서 반복되는 번역투, 과장어, 추상적 표현, 불필요한 가능 표현 등을 별도로 감지하는 관점
- 자연스러움 검토와 문법 검사를 한 단계로 섞지 않는 구조
- 문법/띄어쓰기/구두점을 별도 품질 단계로 보는 방식
- 용어, 숫자/단위, 목록, 날짜, 링크 등 프로젝트 전체 스타일 일관성을 별도 검사하는 방식
- humanizer → grammar checker → style guide의 순차 검토 개념

## 적용 후보

- Editorial Library의 AI 초안 검수 단계
- Block별 설명문/본문의 humanizing 검사
- 관리자 Editor의 `문장 검토` 기능
- 전체 페이지 발행 전 grammar/style QA
- SEO/GEO용 설명문을 자연스러운 한국어로 정리하는 마지막 검수 단계

## 적용하지 않을 것

- 이 외부 규칙이 사용자가 직접 확정한 프로젝트 문체보다 우선하지 않음
- 프로젝트의 실제 before/after 사례를 일반 humanizer 규칙으로 덮어쓰지 않음
- 사실, 가격, 기간, 모델명, 제도 조건을 문체 개선 과정에서 변경하지 않음
- 모든 문장을 동일한 격식/길이/종결어미로 기계적으로 맞추지 않음
- 외부 스킬의 결과를 검토 없이 바로 production에 발행하지 않음

## 기술 의존성

원본은 Agent Skills 형식으로 제공되며 Claude Code, Cursor, Windsurf 등 다양한 에이전트 호스트에서 사용할 수 있도록 구성돼 있다.

현재 플랫폼 runtime에는 이 repository를 직접 설치하거나 dependency로 포함할 필요가 없다. 규칙과 검수 관점을 Editorial Library에 반영하고, 향후 관리자 AI workflow를 구현할 때 필요한 부분만 내부 규칙으로 연결한다.

## 라이선스

MIT License.

원본 파일이나 substantial portion을 직접 복사하는 경우 원 저작권 고지와 MIT permission notice를 보존한다.

## Integration rule

프로젝트 내 한국어 작성 기준의 우선순위는 다음과 같다.

1. 사용자가 직접 확정한 문장/수정 사례
2. 프로젝트 Editorial Library
3. `docs/spec-v1/20-korean-copywriting-skill.md`와 `COPY_GUIDE`
4. 이 외부 reference의 humanizer/grammar/style 관점

외부 reference는 보조 검사기이며 최종 문체 authority가 아니다.

## Source review notes

원본 README는 세 스킬을 `humanizer`, `grammar-checker`, `style-guide`로 분리한다. humanizer는 AI 특유 표현과 번역투를 줄이고, grammar checker는 문법/맞춤법/띄어쓰기/구두점을 검사하며, style guide는 문서 전체의 어조·용어·숫자·목록·인용·날짜·링크 일관성을 점검한다.

현재 프로젝트의 다음 단계인 Editorial Library에서는 이 세 층을 그대로 복제하기보다, 사용자의 기획 문체와 Block type별 작성 규칙에 맞춰 재구성한다.
