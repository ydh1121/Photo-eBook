# Block Style Preset Contract V1

Block variant는 정보 구조와 핵심 동작을 정의한다. Style preset은 승인된 variant의 구조를 바꾸지 않고 제한된 디자인 공식을 조절한다.

## 저장 구조

```js
{
  id: 'preset_comparison_market_photo',
  blockType: 'comparison-cards',
  variant: 'market',
  name: '사진 시장 비교 · 비주얼형',
  style: {
    density: 'standard',
    surface: 'card',
    radius: 'large',
    border: 'subtle',
    shadow: 'none',
    accentMode: 'accent',
    mediaRatio: '16:10',
    edgeTreatment: 'fade'
  },
  source: 'photography-extracted',
  status: 'draft'
}
```

## 허용 공통 token

V1에서는 임의 CSS 입력을 허용하지 않는다.

- `density`: `airy | standard | compact`
- `surface`: `plain | grouped | card`
- `radius`: `none | small | medium | large`
- `border`: `none | subtle | strong`
- `shadow`: `none | soft | raised`
- `accentMode`: `neutral | accent | semantic`
- `mediaRatio`: `auto | 16:10 | 16:9 | 4:3 | 1:1`
- `edgeTreatment`: `none | runway | fade`

모든 token이 모든 Block에 의미가 있는 것은 아니다. Block별 applicability는 style manifest가 정의한다.

## 금지

- raw CSS 저장
- selector 저장
- arbitrary px 값을 preset으로 무제한 저장
- production Safari invariant를 style preset으로 변경
- variant의 정보 구조를 style preset으로 바꾸기

구조가 달라지면 새 Block variant다.
동작이 달라지면 variant 또는 UI Capability다.
시각적 강도·밀도·surface만 달라지면 Style preset이다.

## Photography parity

현재 사진 페이지의 고도화된 Block 디자인은 먼저 실제 owner와 구조를 분석한다.

- 구조 차이가 크면 advanced Block variant
- 구조는 같고 surface/밀도/미디어 비율 차이면 Block Style preset
- 페이지 전체 기능이면 UI Capability preset

사진 디자인을 단순히 공통 token으로 평준화하지 않는다.

## 저장 위치

Google Sheet `BLOCK_STYLE_PRESETS`:
- preset_id
- block_type
- variant
- name
- style_json
- source
- status
- created_at
- updated_at
- notes
- version
- preview_meta_json

Git:
- style schema
- applicability
- approved built-in presets

## 최종 적용

Block instance는 향후 다음을 가질 수 있다.

```js
{
  type: 'comparison-cards',
  variant: 'market',
  stylePresetId: 'preset_comparison_market_photo',
  styleOverrides: {}
}
```

V1 운영에서는 승인된 preset만 production snapshot에 사용할 수 있게 한다.
