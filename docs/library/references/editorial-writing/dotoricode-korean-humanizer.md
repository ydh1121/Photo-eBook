# dotoricode/korean-humanizer

- Reference ID: `editorial-dotoricode-korean-humanizer`
- Source: `dotoricode/korean-humanizer`
- URL: `https://github.com/dotoricode/korean-humanizer`
- Primary category: `editorial-writing`
- Tags: `korean, humanizer, ai-writing, translationese, passive-voice, filler, endings, brand-voice`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

한국어 AI 문장에서 자주 드러나는 빈 수식어, 번역투, 과도한 `것이다/이러한/해당`, 기계적 도입·마무리, 피동문, 접속어 반복, 강제 병렬구조, 종결어미 불일치, 과도한 hedge 등을 구체적인 pattern catalog로 정리한 reference다.

현재 프로젝트의 사용자 확정 문체 규칙과 겹치는 항목이 많아, Editorial Library의 보조 lint 기준으로 활용하기 좋다.

## 참고할 것

- 빈 intensifier와 추상 형용사를 별도 category로 보는 방식
- 번역투/격식 과잉과 피동문을 분리해서 검토하는 방식
- `또한`, `뿐만 아니라`, `결론적으로` 같은 filler connective 반복 탐지
- 강제 삼단 병렬, 어미 혼용, hedge 반복 같은 문장 패턴
- brand voice/preference를 humanizer보다 먼저 적용하는 customization 구조
- 의미는 유지하고 표현만 정리한다는 원칙

## 적용 후보

- Editorial Library의 AI 초안 lint
- 관리자 Editor의 `AI 티 점검` 기능
- 특정 단어/표현 선호와 금지어를 사용자 profile로 관리하는 기능
- 전체 페이지 발행 전 반복 패턴 검사

## 적용하지 않을 것

- catalog에 있는 표현을 맥락과 상관없이 전부 금지하지 않음
- 자연스러운 문장까지 detector 규칙으로 과윤문하지 않음
- 사용자가 직접 확정한 표현을 자동 변경하지 않음
- 사실과 숫자를 humanizing 과정에서 바꾸지 않음

## 기술 의존성

Prompt/Agent Skill 중심이며 Codex/Claude 설치 스크립트와 pattern reference를 제공한다. 현재 runtime dependency로 설치할 필요는 없다.

## 라이선스

MIT License.

## Integration rule

프로젝트 작성 기준의 우선순위는 다음과 같다.

1. 사용자 확정 문장과 before/after
2. Platform Editorial Library
3. industry-specific editorial rule
4. COPY_GUIDE / photography copy contract
5. 이 reference를 포함한 외부 humanizer

외부 pattern catalog는 lint 근거로 사용하고 최종 문체를 자동 결정하지 않는다.
