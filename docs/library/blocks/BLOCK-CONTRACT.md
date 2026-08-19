# Block Contract V1

모든 콘텐츠 Block은 같은 상위 계약을 사용한다. 산업별 차이는 block content와 pack data에 두고, renderer/runtime 계약 자체에 산업명을 넣지 않는다.

## 1. 기본 데이터 구조

권장 V1 shape:

```js
{
  id: 'block_market_01',
  type: 'comparison-cards',
  variant: 'generic',
  status: 'candidate',
  enabled: true,
  editorialProfile: 'comparison',
  referenceProfiles: [],
  aiPolicy: {
    mode: 'full',
    factState: 'needs_verification'
  },
  layout: {
    width: 'wide',
    surface: 'plain',
    presentation: 'rail'
  },
  content: {},
  evidence: [],
  revision: {
    version: 1,
    updatedAt: null,
    updatedBy: null
  }
}
```

각 block type의 `content` schema는 Block Registry가 별도로 정의한다.

## 2. 공통 필드

### `id`

- 페이지 안에서 고유한 stable id.
- 위치가 바뀌어도 id를 변경하지 않는다.
- 제목 문자열을 id로 사용하지 않는다.

### `type`

- Block Registry에 등록된 산업 독립 type.
- 예: `comparison-cards`, `roadmap`, `checklist`.
- `photo-market-card` 같은 분야별 type을 만들지 않는다.

### `variant`

- 같은 정보 목적 안의 제한된 시각/구조 variant.
- registry에 정의된 enum만 사용한다.
- 관리자가 arbitrary CSS class를 입력하게 하지 않는다.

### `status`

Block 품질 상태:
- `draft`
- `candidate`
- `reviewing`
- `approved`
- `deprecated`

production 신규 산업 페이지에서는 기본적으로 `approved` type/variant만 선택 가능하게 한다.

### `enabled`

- 페이지에서 보일지 여부.
- 삭제와 숨김을 구분한다.
- draft에서 숨겨도 revision history에 남는다.

### `editorialProfile`

`docs/library/editorial/02-block-copy-profiles.md`의 profile id를 연결한다.

### `referenceProfiles`

`docs/library/references/`의 stable Reference ID 배열.

외부 레퍼런스를 실제 코드 dependency로 의미하지 않는다. 디자인/interaction 검토 시 읽을 reference를 가리킨다.

## 3. AI 정책

`aiPolicy.mode`:
- `full`
- `wording_only`
- `fact_check_only`
- `locked`

필드 단위 override를 허용한다.

예:

```js
aiPolicy: {
  mode: 'full',
  fields: {
    title: 'wording_only',
    founderNote: 'locked'
  }
}
```

`factState` 권장값:
- `not_required`
- `needs_verification`
- `verified`
- `stale`

## 4. Layout contract

### width
- `content` — 긴 글/좁은 읽기 폭
- `wide` — 카드/비교/rail
- `full` — hero 등 제한적 사용

### surface
- `plain`
- `grouped`
- `card`

block마다 임의 배경색을 저장하지 않는다. theme token을 사용한다.

### presentation
block type이 허용하는 경우에만:
- `stack`
- `grid`
- `rail`

관리자에서 `rail`을 선택했다고 모바일/PC 콘텐츠가 달라지지 않는다. responsive renderer가 presentation을 화면 폭에 맞게 해석한다.

## 5. Content contract

공통적으로 가능한 필드:

```js
content: {
  eyebrow: '',
  title: '',
  description: '',
  items: []
}
```

모든 block이 위 필드를 강제하지 않는다. registry schema가 필요한 필드만 정의한다.

텍스트에 raw HTML을 저장하지 않는 것을 기본으로 한다. 필요한 서식은 제한된 rich-text schema 또는 semantic field로 표현한다.

## 6. Evidence contract

중요 수치/주장과 출처를 연결하기 위한 공통 구조:

```js
evidence: [
  {
    id: 'source_01',
    title: '',
    publisher: '',
    url: '',
    publishedAt: null,
    checkedAt: null,
    supports: ['item_1.price', 'description']
  }
]
```

`supports`는 해당 출처가 뒷받침하는 claim/field를 가리킨다.

외부 읽을거리 추천과 evidence source를 같은 배열로 섞지 않는다.

## 7. Responsive contract

- mobile-first.
- 모바일과 PC에서 같은 content data를 사용한다.
- 화면별로 다른 문장을 따로 저장하지 않는다.
- renderer는 기존 360/430/720/1024 계열 breakpoint를 우선 사용한다.
- rail은 모바일 native horizontal scroll owner 원칙을 유지한다.
- PC mouse drag 보강이 필요해도 mobile touch ownership을 가로채지 않는다.
- 카드 수가 적거나 정보가 짧으면 rail보다 grid/stack이 더 좋은지 Block Lab에서 검토한다.

## 8. Typography / readability contract

- 각 block은 플랫폼 typography token을 사용한다.
- block 자체가 임의 font-size system을 만들지 않는다.
- 제목과 설명의 역할이 겹치지 않게 한다.
- 긴 본문은 content width를 우선한다.
- 수치 block은 숫자만 크게 만들지 않고 단위/설명/기준을 함께 제공한다.
- 반복되는 badge가 본문보다 더 강한 위계를 갖지 않게 한다.

## 9. Accessibility contract

모든 block은 다음을 기본으로 한다.

- semantic HTML 우선
- 실제 action은 `button` 또는 `a`
- keyboard focus 가능
- focus-visible 상태 존재
- 이미지가 정보 역할을 하면 적절한 alt 필요
- 장식 이미지는 빈 alt 허용
- 색상만으로 상태 전달 금지
- touch target 충분히 확보
- `prefers-reduced-motion` 지원
- drag-only action 금지. 정렬/조작에 대체 경로 제공

heading level은 block 안에 `h2`를 고정 저장하지 않고 페이지 outline에 따라 renderer가 결정할 수 있게 한다.

## 10. Interaction contract

- 정보 block은 불필요하게 움직이지 않는다.
- horizontal rail의 x축 owner는 browser native overflow.
- liquid/morphing motion은 직접 조작 의미가 있는 작은 control에 한정한다.
- Block Editor drag interaction과 실제 content rail drag를 구분한다.
- 편집 모드에서 block 전체가 draggable이어도 내부 링크/버튼을 실수로 실행하지 않도록 edit interaction layer를 둔다.

## 11. Theme contract

- block content data에 light/dark 전용 색상 값을 저장하지 않는다.
- 공통 token과 component style이 theme를 처리한다.
- 미디어 자체의 흰 배경이 제품 식별에 필요한 경우 같은 예외를 허용할 수 있다.
- contrast는 Block Lab에서 두 theme 모두 검수한다.

## 12. Revision contract

Block Editor는 변경 시 revision을 남길 수 있어야 한다.

최소 기록:
- block id
- version
- 이전/새 data
- changed fields
- actor: user/AI/system
- reason
- timestamp

AI가 published block을 수정하면 기존 version을 덮어쓰지 않고 draft revision을 만든다.

## 13. Renderer contract

최종 목표:

```text
Block data
     ↓
Block Registry
     ↓
Canonical renderer
  ↙         ↘
Block Lab   Production
     ↘     ↙
    Admin Preview
```

세 화면에서 같은 데이터인데 결과가 달라지는 별도 renderer를 만들지 않는다.

Block Lab에서는 편집용 outline/status label을 바깥 wrapper로 추가할 수 있지만 실제 block body renderer는 공유한다.
