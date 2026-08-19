# VoltAgent/awesome-design-md — Apple DESIGN.md

- Reference ID: `component-voltagent-apple-design-md`
- Source: `VoltAgent/awesome-design-md`
- URL: `https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md`
- Primary category: `component-system`
- Tags: `apple-web, design-md, typography, spacing, surface, product-photography, low-chrome, layout`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

Apple 웹 화면을 분석해 color, typography, radius, spacing, components와 layout principle을 DESIGN.md 형태로 정리한 문서다. 현재 페이지에서 카드와 장식이 많아 정보 위계가 약해지는 문제를 검토할 때, UI chrome을 줄이고 콘텐츠·이미지·타이포그래피가 주도하도록 만드는 참고축으로 사용할 수 있다.

## 참고할 것

- 콘텐츠나 제품 이미지가 중심이고 UI chrome은 뒤로 물러나는 원칙
- 많은 border/shadow보다 surface change와 whitespace로 섹션을 구분하는 방식
- accent color 수를 제한하고 interaction에 일관되게 쓰는 방식
- 큰 heading의 좁은 tracking과 body의 읽기 폭을 분리하는 방식
- hero / utility card / sticky bar처럼 목적별 density가 다른 component grammar
- light/dark surface의 리듬을 이용해 긴 페이지를 분절하는 방식

## 적용 후보

- Hero, Chapter Hero, Section Heading 정제
- media/case/product block에서 이미지와 텍스트 위계 개선
- Block Lab의 shadow/border 사용량 축소 실험
- PC 긴 페이지의 section rhythm

## 적용하지 않을 것

- Apple 웹사이트를 복제하지 않음
- 해당 문서의 hex, spacing, font 수치를 프로젝트 token으로 그대로 채택하지 않음
- SF Pro 전용 디자인을 강제하지 않음
- 낮은 정보 밀도가 적합하지 않은 comparison/data block에 과도한 whitespace를 적용하지 않음

## 기술 의존성

Markdown design analysis. runtime dependency 없음.

## 라이선스

상위 `VoltAgent/awesome-design-md` repository는 MIT License다. 다만 Apple 브랜드, 상표와 원본 시각 자산은 Apple의 권리이며 이 문서는 공식 Apple design system이 아니라 분석 자료다.

## Integration rule

1. 공식 Apple HIG나 실제 플랫폼 동작과 충돌하면 공식 기준을 우선한다.
2. 디자인 수치를 복사하기보다 restraint, hierarchy, whitespace, low-chrome 원칙을 참고한다.
3. comparison/metric 같은 정보 밀도 높은 block에는 별도의 데이터 UI 원칙을 유지한다.
