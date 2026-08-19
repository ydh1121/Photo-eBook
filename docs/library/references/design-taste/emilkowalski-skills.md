# emilkowalski/skills

- Reference ID: `design-emilkowalski-skills`
- Source: `emilkowalski/skills`
- URL: `https://github.com/emilkowalski/skills`
- Primary category: `design-taste`
- Tags: `animation, interaction, apple-design, prototype, review, ui-engineering, accessibility`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

디자이너와 엔지니어가 UI를 만들 때 에이전트가 자주 선택하는 어색한 애니메이션, 경계선, easing, motion 기회를 구체적으로 검토하는 스킬 모음이다. 특히 animation을 무조건 추가하지 않고, 어떤 곳에 motion이 실제로 필요한지 찾거나 기존 animation을 엄격하게 review하는 흐름이 Block Lab과 잘 맞는다.

## 참고할 것

- animation을 `만드는 법`과 `검토하는 법`을 분리하는 구조
- enter/exit easing, duration, spring, gesture 같은 motion 결정을 명시적으로 다루는 방식
- `find-animation-opportunities`처럼 motion이 필요한 곳과 필요 없는 곳을 함께 판단하는 방식
- 여러 UI 버전을 만들고 switcher로 비교하는 prototype 접근
- Apple design 원칙을 web interaction으로 번역한 gesture/spring/accessibility 규칙
- direct manipulation, interruptibility, velocity handoff, reduced motion을 한 계약으로 보는 관점

## 적용 후보

- Block Lab의 variant 비교 및 prototype workflow
- 관리자 Block Editor의 drag, sheet, quick action motion
- horizontal rail과 floating control의 interaction QA
- UI Refinement의 animation review checklist
- 향후 motion token / spring preset 설계

## 적용하지 않을 것

- 모든 block에 animation을 추가하는 근거로 사용하지 않음
- 현재 production에 특정 animation library를 자동 도입하지 않음
- 사용자 승인 없이 motion intensity를 올리지 않음
- 긴 본문과 표 같은 읽기 UI를 움직이는 장식으로 만들지 않음

## 기술 의존성

원본은 Markdown Agent Skills 모음이며 개별 skill에 web/React Native/Expo/animation library 예시가 포함될 수 있다. 현재 플랫폼에는 repository 자체를 runtime dependency로 넣지 않는다.

## 라이선스

MIT License.

## Integration rule

1. UI 기능과 가독성이 먼저다.
2. motion은 직접 조작, 상태 변화, 공간 관계를 설명할 때만 추가한다.
3. gesture-driven motion은 interruptible해야 한다.
4. `prefers-reduced-motion` 대체 동작을 함께 설계한다.
5. Block Lab에서 variant로 검증한 뒤 production에 승격한다.

## Review notes

원본 README는 design/animation 판단을 빠르게 돕는 여러 독립 스킬을 제공하며, Apple design skill은 fluid motion, gesture, spring, material, typography, reduced-motion을 web 환경에 맞춰 정리한다. 프로젝트에서는 구현 코드보다 판단 기준과 review workflow를 우선 참고한다.
