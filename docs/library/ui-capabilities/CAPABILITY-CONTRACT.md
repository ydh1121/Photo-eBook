# UI Capability Contract V1

## 1. 기본 구조

```js
{
  id: 'top-chapter-navigation',
  kind: 'platform-chrome',
  status: 'candidate',
  schemaVersion: 1,
  owner: {
    js: ['assets/js/navigation/chapter-navigation.js','assets/js/ui/liquid-controller.js'],
    css: ['assets/styles/navigation/chapter-progress.css']
  },
  controls: [],
  presets: []
}
```

Page assignment:

```js
{
  pageId: 'page_video_editor_qa_v1',
  capabilityId: 'top-chapter-navigation',
  enabled: true,
  presetId: 'photo-topnav-blue-progress',
  overrides: {}
}
```

## 2. Control type

허용 control:
- `boolean`
- `enum`
- `color`
- `number`
- `range`
- `text`

임의 CSS 문자열 입력은 V1에서 허용하지 않는다.

## 3. Preset과 override

Preset은 재사용 가능한 설정 묶음이다.

페이지가 preset을 선택한 뒤 일부 값만 다르게 쓸 수 있지만 override는 최소화한다. 재사용 가치가 있는 조합은 새 preset으로 저장한다.

## 4. 저장 위치

- capability definition/schema/owner → Git
- preset → Google Sheet `UI_PRESETS`
- page assignment → Google Sheet `PAGE_UI_CONFIG`
- production runtime implementation → Git
- 미디어 원본 → Drive

## 5. Capability와 Content Block 차이

Content Block:
- 본문 순서를 가진다.
- add/remove/reorder 대상이다.
- 페이지 콘텐츠 snapshot에 포함된다.

UI Capability:
- 페이지 전체 또는 특정 surface에 붙는다.
- 본문 sort_order를 갖지 않는다.
- page-level config로 관리한다.
- production snapshot은 capability preset reference와 resolved config를 함께 기록해야 한다.

## 6. Variant와 Preset 차이

Block variant:
- 같은 정보 목적의 구조/표현/동작 차이.
- Block Registry에 등록.
- 예: `gallery/grid`, `gallery/strip`.

Capability preset:
- 같은 공통 UI 기능의 세부 설정 조합.
- 예: liquid chip의 색상, spring response, blur, spacing.

## 7. Motion contract

interaction 설정은 숫자를 무제한 직접 입력하게 만들지 않는다.

권장 기본 control:
- response: `calm | standard | lively`
- overshoot: `none | low | medium | high`
- durationScale: 제한된 range

고급 모드에서만 실제 spring token을 노출한다.

`prefers-reduced-motion`에서는 preset보다 접근성 정책이 우선한다.

## 8. Safari safety

다음은 preset으로 끌 수 있는 일반 장식이 아니다.
- iOS Safari 최초 normal-flow 처리
- deferred sticky arm lifecycle
- browser chrome compact signal

Safari safety layer는 페이지 capability보다 상위 production invariant다.

## 9. 저장된 custom variation

관리자는 capability 설정을 조정한 뒤 이름을 붙여 preset으로 저장할 수 있어야 한다.

저장 필드:
- preset id
- capability id
- name
- config
- source: `system | photography-extracted | user`
- status: `draft | approved | deprecated`
- notes
- version

## 10. Block Editor 연결

Block Editor에는 별도 `페이지 UI` 영역을 둔다.

여기서:
- capability on/off
- preset 선택
- override
- preset 저장
을 관리한다.

Capability 자체를 본문 Block Library 안에 섞지 않는다.
