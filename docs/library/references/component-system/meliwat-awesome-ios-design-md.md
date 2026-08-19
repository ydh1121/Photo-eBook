# Meliwat/awesome-ios-design-md

- Reference ID: `component-meliwat-awesome-ios-design-md`
- Source: `Meliwat/awesome-ios-design-md`
- URL: `https://github.com/Meliwat/awesome-ios-design-md`
- Primary category: `component-system`
- Tags: `ios, design-system, design-md, typography, spacing, motion, haptics, accessibility, dark-mode`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

실제 앱들을 역설계한 DESIGN.md 묶음으로 색, 타이포그래피, component state, spacing, motion, haptic, responsive behavior를 한 문서 계약으로 정리한다. Block Library도 비슷하게 “보이는 모양”만 모으지 않고 각 block의 상태와 동작을 명세해야 하므로 문서 구조를 참고할 가치가 있다.

## 참고할 것

- visual theme → colors → typography → components → layout → depth → responsive → do/don't 순으로 설계를 구조화하는 방식
- light/dark와 Dynamic Type, safe area, touch target까지 디자인 시스템에 포함하는 관점
- 하나의 앱에 framework-neutral / SwiftUI / Expo / Compose flavor를 나누는 방식
- 시각 스타일뿐 아니라 motion/haptics/component states를 함께 기록하는 방식
- AI agent가 읽을 수 있는 DESIGN.md를 디자인 계약으로 사용하는 접근

## 적용 후보

- Block Registry의 block spec 형식
- Block Lab의 light/dark/responsive 검토 패널
- 관리자 UI의 mobile interaction reference
- 향후 `DESIGN.md`형 플랫폼 디자인 명세 요약본

## 적용하지 않을 것

- 역설계된 수치를 Apple 또는 해당 앱의 공식 design token으로 간주하지 않음
- iOS 화면을 web platform에 그대로 복제하지 않음
- 특정 앱의 색상/브랜드/트레이드마크를 플랫폼 디자인에 복제하지 않음
- 200개 디자인 팩을 무분별하게 섞지 않음

## 기술 의존성

문서 중심 reference이며 SwiftUI, Expo/React Native, Jetpack Compose flavor가 함께 제공된다. 현재 web runtime의 dependency로 추가할 필요는 없다.

## 라이선스

Repository metadata와 README는 MIT License를 표시한다. 개별 앱의 상표·브랜드 자산은 각 권리자 소유이므로 디자인 원칙 참고와 코드 라이선스를 구분한다.

## Integration rule

1. 이 저장소는 pattern library이며 authoritative platform guideline이 아니다.
2. 현재 플랫폼 token과 responsive 계약을 우선한다.
3. 한 block을 검토할 때 관련 앱 1~3개 정도를 비교하고 여러 브랜드 특징을 혼합하지 않는다.
4. 수치 복사보다 정보 위계, 상태 설계, spacing rhythm의 원리를 참고한다.
