# Platform Reference Library

이 폴더는 `먹고살기` 플랫폼에서 UI, 인터랙션, 에디토리얼, 접근성, 정보 구조를 설계할 때 반복해서 참고할 외부 레퍼런스를 영구 보관한다.

링크를 단순 수집하지 않는다. 각 레퍼런스는 실제 제품에 어떤 원리를 적용할 수 있는지, 어디에는 쓰지 말아야 하는지, 라이선스와 기술 의존성이 무엇인지까지 기록한다.

## 분류

- `design-taste/` — AI가 만드는 UI의 미감, hierarchy, spacing, density, anti-slop, 사용자 취향 축적
- `interaction-motion/` — drag, spring, morphing, gesture, floating action 등 동작 레퍼런스
- `editorial-writing/` — 한국어 문장, humanizing, 문법, 용어/스타일 일관성, LLM 문체 연구
- `component-system/` — 컴포넌트 구조, variant, design token, DESIGN.md, platform UI pattern
- `content-layout/` — 긴 콘텐츠, 비교, 데이터, 카드, 리딩 플로우
- `accessibility/` — focus, keyboard, reduced motion, hit target 등
- `admin-editor/` — block editor, inspector, preview, drag-and-drop 편집 경험
- `discovery/` — 새로운 디자인 repository/도구를 찾기 위한 탐색 소스

하나의 레퍼런스가 여러 분류에 걸치면 primary category에 파일을 두고 `tags`로 보조 분류한다.

## 모든 entry의 필수 항목

- Reference ID
- Source / URL
- Primary category
- Tags
- Status: `candidate | approved | deprecated`
- Review date
- Why it matters
- 참고할 것
- 적용 후보
- 적용하지 않을 것
- 기술 의존성
- 라이선스
- Integration rule

## 사용 규칙

1. 외부 코드를 그대로 복사하는 저장소가 아니다.
2. 디자인이나 interaction 작업 전 해당 block/reference profile에 연결된 entry를 읽는다.
3. `approved`라고 해서 모든 화면에 적용하는 것이 아니다. 각 entry의 `적용 후보`와 `적용하지 않을 것`을 따른다.
4. 프로젝트의 기존 Safari, responsive, accessibility 계약을 외부 레퍼런스보다 우선한다.
5. 외부 구현의 프레임워크가 현재 runtime과 다르면 원리만 차용하고 현재 플랫폼 구조에 맞게 재구현한다.
6. 외부 코드를 실제로 가져오는 경우 라이선스 조건과 attribution 필요 여부를 다시 확인한다.
7. reverse-engineered DESIGN.md는 공식 brand/platform specification으로 취급하지 않는다.
8. discovery source에 노출된 repository는 별도 검토 없이 production dependency로 채택하지 않는다.
9. 레퍼런스가 변경되거나 archived/deprecated되면 review date와 상태를 갱신한다.

## 현재 등록

### Design Taste
- `design-taste/emilkowalski-skills.md` — animation/design decision, prototype, review workflow
- `design-taste/leonxlnx-taste-skill.md` — existing UI audit, anti-slop, hierarchy/spacing/density/motion
- `design-taste/tastesmd-tastes-md.md` — 사용자 협업에서 고유 aesthetic constraint를 추출하는 방법론

### Interaction / Motion
- `interaction-motion/arknow91-liquid-taffy.md` — liquid surface, stretch/snap-back, morphing menu, speed dial

### Component / Design System
- `component-system/meliwat-awesome-ios-design-md.md` — 실제 앱 역설계 DESIGN.md, mobile component/state/responsive reference
- `component-system/voltagent-apple-design-md.md` — Apple web 분석 기반 low-chrome/typography/spacing reference

### Editorial / Writing
- `editorial-writing/daleseo-korean-skills.md` — Korean humanizer, grammar checker, style consistency baseline
- `editorial-writing/nomadamas-k-skill-korean-humanizer.md` — 의미/수치 보존, 과윤문 방지, 사용자 voice calibration baseline
- `editorial-writing/shinwoo-park-katfishnet.md` — 한국어 LLM 문체의 spacing/POS/punctuation 연구 근거
- `editorial-writing/dotoricode-korean-humanizer.md` — 한국어 AI식 표현 pattern catalog와 brand voice 보조 lint

### Discovery
- `discovery/github-ai-design-topic.md` — GitHub `ai-design` topic을 통한 신규 design-agent/tool 탐색

## 사용자 제공 링크 세트 — 2026-08-19

다음 링크는 모두 정식 entry 또는 기존 entry로 반영됐다.

- `https://github.com/emilkowalski/skills`
- `https://github.com/meliwat/awesome-ios-design-md`
- `https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md`
- `https://github.com/leonxlnx/taste-skill`
- `https://github.com/tastesmd/tastes.md`
- `https://github.com/topics/ai-design`
- `https://github.com/Shinwoo-Park/katfishnet`
- `https://github.com/DaleSeo/korean-skills`
- `https://github.com/dotoricode/korean-humanizer`

기존 `NomaDamas/k-skill`의 `korean-humanizer`도 별도 보조 레퍼런스로 유지한다.

## 현재 회수 상태

사용자가 이번에 제공한 과거 외부 GitHub 링크 세트는 모두 반영했다. 향후 다른 대화에서 추가 레퍼런스가 다시 확인되면 즉시 같은 형식으로 등록한다.

## 신규 레퍼런스 등록

새 링크가 프로젝트 대화, Git 문서, 사용자 피드백에서 확인되면 `REFERENCE-ENTRY-TEMPLATE.md` 형식으로 등록한다. 대화 기록에만 두고 끝내지 않는다.
