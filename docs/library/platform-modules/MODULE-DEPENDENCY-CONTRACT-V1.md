# Platform Module Dependency Contract V1

Status: active architecture contract

## 목적

UI 모듈이 다른 공통 모듈의 디자인이나 상호작용을 다시 구현하지 않도록 모듈 간 종속성을 `PlatformModuleRegistry`에서 명시적으로 관리한다.

모듈 종속성과 파일 소유권은 서로 다른 개념이다.

- `dependencies`: 한 모듈이 다른 canonical module의 기능/구조/데이터를 소비하는 관계
- `ownerFiles`: 해당 모듈 또는 runtime을 실제로 구현하는 JS/CSS/asset 소유 파일

모듈 A가 모듈 B를 합성한다고 해서 B의 모든 ownerFiles를 A의 ownerFiles에 복사하지 않는다. A는 B를 dependency로 선언하고, export/deploy 도구는 Registry의 dependency closure를 따라 B와 B의 ownerFiles를 수집한다.

## Dependency schema

각 Registry definition은 다음 형태의 `dependencies`를 가질 수 있다.

```js
{
  id: 'child-module-id',
  kind: 'composition',
  required: true
}
```

지원 kind:

- `composition`: 자식 canonical module을 실제 DOM/runtime 안에 합성한다.
- `behavior`: 다른 canonical module/runtime의 행동 계약을 직접 소비한다.
- `data`: 다른 canonical module이 정의한 데이터 계약을 소비한다.

`required:false`만 선택적 dependency다. 기본값은 required다.

## Registry invariants

`PlatformModuleRegistry`는 다음을 강제한다.

1. 자기 자신을 dependency로 선언할 수 없다.
2. 동일 parent에서 같은 dependency를 두 번 선언할 수 없다.
3. 선언하지 않은 dependency를 `resolveDependency`, `renderDependency`, `hydrateDependency`로 사용할 수 없다.
4. required dependency가 Registry에 없으면 실패한다.
5. parent가 사용하는 consumer에서 child를 사용할 수 없으면 실패한다.
6. `dependencyClosure()`는 전이 dependency를 dependency-first 순서로 계산한다.
7. 전이 그래프에 순환이 있으면 실패한다.
8. `validateDependencyGraph(consumer)`는 해당 consumer가 볼 수 있는 전체 approved graph를 검증한다.

## Consumer boundary

Dependency는 parent의 consumer 권한을 우회하지 않는다.

예를 들어 `screen-mode-selector`가 `public`, `library`, `editor`에서 사용되고 `filter-chip-rail`을 required composition dependency로 가진다면 `filter-chip-rail` 역시 해당 consumer에서 approved 상태로 사용 가능해야 한다.

Library에서만 가능한 child를 Public parent 아래에 숨겨 넣는 것은 금지한다.

## Runtime / asset ownership

모듈 dependency graph와 runtime asset ownership을 섞지 않는다.

예시:

```text
screen-mode-selector
  └─ composition → filter-chip-rail
                       ├─ owner CSS → filter-chip-rail-v1.css
                       ├─ style policy → module-style-runtime-v1.js
                       └─ indicator runtime → liquid-controller.js
```

이 구조에서:

- `screen-mode-selector`는 화면 모드의 의미, 제목/설명, `light | dark | system` 상태 변환만 소유한다.
- `filter-chip-rail`은 칩 렌더링, 선택 상태, 스킨 family, 가로 레일 interaction과 해당 필터의 유효한 `response / overshoot` 설정 정책을 소유한다.
- `module-style-runtime-v1.js`는 `filter-chip-rail`의 styleDefaults/override를 실제 transition duration/easing으로 변환한다.
- `liquid-controller`는 moving indicator의 geometry 측정, indicator 생성/복구, transform 이동과 canonical animation baseline 메커니즘을 소유한다.
- 따라서 composed parent가 특정 easing 값을 별도로 강제하지 않는다. Screen Mode의 유효 transition은 같은 설정의 standalone `filter-chip-rail`과 동일해야 한다.
- `screen-mode-selector`가 별도의 파란 active pill, indicator, spring CSS/JS 또는 자체 timing policy를 다시 구현하면 계약 위반이다.

## Screen mode canonical composition

현재 승인된 기준 그래프:

```text
screen-mode-selector
  └─ required composition → filter-chip-rail
```

`screen-mode-selector`는 `PlatformModuleRegistry.renderDependency()`와 `hydrateDependency()`를 통해 child를 사용한다.

화면 모드가 필요한 곳은 모두 동일한 `screen-mode-selector`를 mount한다.

- UI Library standalone preview
- Block Editor instance
- Photography collection settings
- Published / portable consumer

Photography collection settings bridge는 별도 화면 모드 UI를 생성하지 않고 canonical module을 mount하는 placement adapter 역할만 한다.

## Style ownership

Parent module의 CSS는 child module의 배치만 조절할 수 있다.

허용 예:

- child container width
- equal-column composition을 위한 flex basis
- parent와 child 사이의 margin/padding

금지 예:

- child active button의 background/gradient/shadow 재정의
- child indicator의 별도 구현
- child interaction을 흉내 내는 parent 전용 animation
- child의 canonical `response / overshoot` 설정을 무시하는 parent 전용 easing/duration 강제

공통 style control이 composed child/slot을 제어해야 하는 경우에는 composition-aware style adapter가 실제 canonical slot을 대상으로 해야 한다. retired/lookalike selector를 토글하는 no-op control은 금지한다.

## Portable Export

Portable Export는 module ID 하나를 export할 때 다음 순서로 dependency를 계산한다.

1. `dependencyClosure(moduleId, consumer)` 실행
2. closure의 모든 module definition 수집
3. 각 definition의 `ownerFiles` 합집합 수집
4. 중복 제거
5. consumer boundary 검증
6. required runtime/style/assets 포함

수동으로 "이 모듈은 아마 이 CSS가 필요하다"고 파일 목록을 추측하는 방식은 금지한다.

## QA contract

모듈 composition 변경은 최소 다음을 검증한다.

- static boundary: dependency declaration / owner separation / duplicate implementation 부재
- Registry graph: closure / required dependency / consumer compatibility / cycle rejection
- Chromium runtime: parent 내부에 canonical child module이 실제 mount되었는지
- interaction: child의 canonical interaction owner가 실제 동작하는지
- style: parent가 child skin을 별도로 재구현하지 않았는지
- motion policy: parent 안의 child가 동일한 설정의 standalone canonical child와 동일한 유효 transition duration/easing을 쓰는지
- Library → Editor → Public에서 같은 module ID와 dependency graph를 유지하는지

화면 모드의 경우 Chromium QA는 최소 다음을 확인한다.

- nested module id가 `filter-chip-rail`인지
- `.collection-v33-indicator`가 canonical liquid owner에 의해 생성되는지
- `.v37-liquid-skin`이 canonical liquid paint를 소유하는지
- 선택 변경 시 indicator transform이 이동하는지
- transition duration이 0이 아닌지
- 유효 transition duration/easing이 standalone `filter-chip-rail`과 동일한지
- standalone과 collection settings가 같은 dependency graph와 child owner를 쓰는지
