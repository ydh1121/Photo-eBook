# Leonxlnx/taste-skill

- Reference ID: `design-leonxlnx-taste-skill`
- Source: `Leonxlnx/taste-skill`
- URL: `https://github.com/Leonxlnx/taste-skill`
- Primary category: `design-taste`
- Tags: `anti-slop, frontend, hierarchy, typography, spacing, motion, redesign, audit, variants`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

AI가 만든 화면이 반복적인 카드·그라데이션·과장된 motion·비슷한 레이아웃으로 수렴하는 문제를 줄이기 위한 디자인 스킬 모음이다. 현재 photography 페이지에서 느껴지는 “정제가 덜 된 UI”를 Block Lab에서 다시 검토하는 목적과 직접 맞닿아 있다.

## 참고할 것

- greenfield 생성과 existing-project redesign을 분리하는 방식
- 디자인을 variance / motion / density 같은 조절축으로 보는 관점
- layout, typography, spacing, motion을 별도 품질축으로 review하는 방식
- 기존 화면을 먼저 audit한 뒤 개선 계획을 세우는 redesign workflow
- 여러 시각 방향을 무작정 섞기보다 한 방향을 명확하게 선택하는 접근
- image-first reference → analyze → code 흐름을 별도 skill로 분리하는 점

## 적용 후보

- Phase 05 UI Refinement의 audit checklist
- Block Lab에서 동일 block의 밀도/레이아웃 variant 비교
- 신규 block 디자인 전에 anti-pattern 검토
- 관리자 에디터의 AI 디자인 제안 모드

## 적용하지 않을 것

- `anti-slop`이라는 이유로 화면을 과도하게 실험적으로 만들지 않음
- 모든 block에 높은 layout variance나 motion을 적용하지 않음
- 프로젝트의 사용자 확정 취향과 기존 production 사용성을 외부 skill보다 낮게 두지 않음
- repository의 특정 스타일 preset을 플랫폼 기본 스타일로 그대로 채택하지 않음

## 기술 의존성

Agent Skills 중심이며 일부 skill은 GSAP, image generation, frontend implementation workflow를 제안한다. 현재 production runtime dependency로 자동 추가하지 않는다.

## 라이선스

MIT License.

## Integration rule

1. 기존 UI를 고칠 때는 먼저 문제를 `hierarchy / spacing / density / motion / structure`로 진단한다.
2. 하나의 block에서 여러 시각 아이디어를 동시에 섞지 않는다.
3. 사용자 피드백이 외부 taste rule보다 우선한다.
4. Block Lab에서 비교 가능한 variant로 검증하고 승인 후 승격한다.
