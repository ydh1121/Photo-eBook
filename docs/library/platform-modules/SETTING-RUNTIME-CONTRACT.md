# Library Setting Runtime Contract

Status: active

UI Library의 설정 패널은 시각 샘플용 조절기가 아니다. 표시되는 모든 설정은 승인된 공통 모듈의 실제 runtime contract다.

## 기본 원칙

- Library에서 보이는 설정은 실제 canonical module node에 즉시 반영되어야 한다.
- 같은 설정값은 신규 Block Editor 인스턴스에 snapshot되어야 한다.
- 발행된 페이지에서는 저장된 instance style/content를 사용해 동일 `PlatformModuleRegistry` 모듈에 적용되어야 한다.
- Library preview 전용 CSS/JS가 효과를 대신 구현하면 실패다.
- 기능적으로 의미가 없는 조절값은 숨기거나 disabled한다. no-op control은 허용하지 않는다.

## Typography

공통 navigation/selector 계열은 다음 설정을 canonical style data로 취급할 수 있다.

- `fontFamily`
- `fontSize`
- `fontWeight`
- `letterSpacing`

현재 승인 font family token:

- `system-sans`
- `apple-sans`
- `korean-sans`
- `rounded-sans`

Font file을 배포 자산으로 복사하는 방식이 아니라 시스템 font stack token으로 저장한다.

## Filter family

`filter-chip-rail`은 하나의 공통 module id를 유지하고 family만 바뀐다.

- `ios-liquid`
- `ios-flat`
- `material-flat`

세 family 모두 같은 content props, 선택 state, ARIA state, `platform-filter-select` event를 사용한다. 외형별로 별도 mock module을 만들지 않는다.

## QA

최소 검증:

1. Library control 변경 전/후 actual node의 computed style 또는 DOM state가 바뀐다.
2. 새 Editor instance의 `styleOverrides`에 Library default snapshot이 들어간다.
3. Editor preview에서 같은 family/style이 보이고 interaction이 작동한다.
4. Public Snapshot runtime이 admin preview iframe 없이 같은 module을 mount한다.
5. 공개 runtime에서 저장된 `styleOverrides`를 `PlatformModuleStyleRuntime`이 적용한다.

이 검증은 `AGENTS.md`의 `Reusable UI module contract`와 함께 적용한다.
