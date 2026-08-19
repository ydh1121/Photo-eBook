# arknow91/liquid-taffy

- Reference ID: `interaction-liquid-taffy`
- Source: `arknow91/liquid-taffy`
- URL: `https://github.com/arknow91/liquid-taffy`
- Primary category: `interaction-motion`
- Tags: `liquid-surface, drag, spring, morphing-menu, speed-dial, gesture, reduced-motion, accessibility`
- Status: `approved`
- Review date: `2026-08-19`

## Why it matters

현재 플랫폼은 이미 Liquid 계열의 surface와 floating UI를 사용한다. 이 레퍼런스는 단순 blur/glass 장식보다 한 단계 더 나아가, 작은 surface가 사용자의 press/drag에 물성처럼 반응하고 원래 상태로 복원되는 interaction을 구체적으로 구현한다.

저장소가 스스로 package가 아닌 reference implementation이라고 명시하고 있으므로, production dependency를 추가하기 위한 근거가 아니라 motion language와 gesture contract를 읽기 위한 레퍼런스로 사용한다.

## 참고할 것

- anchored dropdown, morphing dropdown, speed dial 세 종류가 하나의 시각 언어를 공유하는 방식
- press → drag/stretch → release → snap-back의 공통 gesture engine
- surface마다 별도 애니메이션을 만들기보다 공유 가능한 motion primitive를 먼저 정의하는 구조
- 정지 상태의 crisp CSS surface와 움직이는 순간의 goo visual layer를 분리하는 방식
- 아이콘과 hit area는 실제 DOM button으로 유지하고 liquid visual은 별도 layer로 처리하는 원칙
- drag-release와 click을 구분하여 잘못된 activation을 막는 방식
- spring 기반 entrance/release choreography
- `prefers-reduced-motion`, Escape, focus return, aria 상태를 motion과 함께 설계하는 점

## 적용 후보

우선 검토 순서:

1. 관리자 Block Editor의 `블록 추가` floating action
2. 선택 블록 주변의 quick action / context menu
3. 관리자 floating toolbar의 open/close transition
4. 작은 speed-dial형 작업 메뉴
5. 질문함·내 모음처럼 이미 floating surface로 동작하는 공통 UI의 차기 interaction 실험

Block Lab에서는 별도 interaction specimen으로 시험할 수 있다.

## 적용하지 않을 것

- 긴 본문 카드 전체
- 비교표, 가격표, KPI 표면처럼 읽는 동안 안정돼 있어야 하는 정보 UI
- 모든 CTA와 모든 버튼
- 스크롤 중 계속 형태가 변하는 장식
- 텍스트 가독성을 희생하는 blur/warp
- 현재 승인된 Safari navigation lifecycle을 대체하는 구현

liquid interaction은 정보 전달보다 직접 조작의 의미가 있는 작은 surface에 한정한다.

## 기술 의존성

원본 구현:
- React 19
- TypeScript
- Vite
- GSAP / CustomEase
- SVG filter

현재 Photo-eBook runtime은 이 스택을 전제로 하지 않는다. React 또는 GSAP를 이 레퍼런스 하나 때문에 production 공통 dependency로 추가하지 않는다.

필요한 효과는 현재 플랫폼의 DOM/CSS/JS 구조에서 재현 가능한 범위를 먼저 검토하고, 실제 dependency 추가는 별도 architecture decision으로 취급한다.

## 라이선스

MIT License.

원본 코드를 substantial portion으로 직접 가져오거나 수정해서 사용하는 경우 원 저작권 고지와 MIT permission notice 보존 여부를 확인한다.

## Integration rule

1. 먼저 Block Lab에서 isolated specimen으로 구현한다.
2. reduced-motion 상태에서는 정적 open/close로 동작해야 한다.
3. visual layer와 실제 hit target/accessibility DOM을 분리한다.
4. drag gesture가 click, link activation, horizontal rail drag와 충돌하지 않아야 한다.
5. iOS Safari에서 compositing, sticky/fixed surface, viewport chrome과 충돌하지 않는지 별도 검증한다.
6. motion을 production에 넣기 전 기존 UI보다 실제 조작 의미가 좋아지는지 확인한다.
7. 단지 '액체처럼 보여서' 적용하지 않는다.

## Source review notes

원본 README는 세 interaction이 하나의 gesture engine과 spring language를 공유한다고 설명하며, static surface와 motion goo layer를 분리하고 실제 DOM button으로 접근성을 유지한다. 또한 reduced-motion과 focus 복귀를 명시적으로 지원한다.

이 프로젝트에서는 구현 코드 자체보다 이 설계 원칙을 우선적으로 참고한다.
