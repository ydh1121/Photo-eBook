# Canonical Platform Module Pipeline

Status: active architecture contract

## 역할

플랫폼은 네 개의 역할을 분리한다.

1. 공개 페이지
   - 현재까지 실제 화면에서 완성되고 검증된 모듈의 reference source다.
   - 완성된 구조를 공통 모듈로 추출할 수 있다.
   - 연구 코드나 관리 화면 코드를 직접 읽지 않는다.

2. UI 라이브러리 `/ui-dashboard/`
   - 승인된 공통 모듈만 보여주는 UI Kit다.
   - 연구 공간이 아니다.
   - `PlatformModuleRegistry.listFor('library')`가 유일한 목록 source다.
   - 모듈 분류/트리 UI는 Registry 엔트리를 조직할 뿐 별도 component 구현을 만들지 않는다.

3. 블록 연구실 `/block-lab/`
   - 신규 블록, variant, 상호작용, 스타일을 연구하는 격리 공간이다.
   - 사용자와 GPT가 논의하고 검토하는 candidate surface다.
   - 연구실의 JS, CSS, sample data를 라이브러리나 블록 에디터가 직접 import하지 않는다.

4. 블록 에디터 `/block-editor/`
   - 승인된 공통 모듈만 조립해 신규 페이지를 만든다.
   - 페이지에는 연구 block type이 아니라 canonical `module id + content/style/state snapshot`을 저장한다.
   - 완성된 모듈 인스턴스를 재사용 preset으로 저장할 수 있는 계층을 둔다.
   - 완성된 페이지를 분류하고 저장하며, 발행 전 QA로 넘긴다.

## 정식 흐름

공개 페이지에서 출발하는 모듈:

`공개 페이지 완성형 → 공통 모듈 코드 추출 → approved/public-extracted → UI 라이브러리 → 블록 에디터 인스턴스 커스텀 → 저장된 완성 모듈/preset → 새 공개 페이지`

블록 연구실에서 출발하는 모듈:

`블록 연구실 candidate → 사용자 + GPT 검토 → 공통 모듈 코드로 승격 → approved/block-lab-approved → UI 라이브러리 → 블록 에디터 인스턴스 커스텀 → 저장된 완성 모듈/preset → 새 공개 페이지`

UI 라이브러리에서 직접 공개 페이지로 설정을 밀어 넣지 않는다. 공개 화면은 블록 에디터가 저장한 승인 모듈 기반 페이지와 발행 QA를 통과한 결과를 소비한다.

## Canonical Registry

Owner:
`public/assets/js/platform-modules/module-registry-v1.js`

각 공통 모듈은 최소 다음 정보를 갖는다.

- `id`
- `label`
- `status`: `approved | candidate | deprecated`
- `source`: `public-extracted | block-lab-approved | platform-core`
- `sourceRoute`
- `ownerFiles`
- `consumers`
- `version`
- `previewProps`
- `editorProps`
- `render()`
- 필요한 경우 `hydrate()`

일반 consumer는 `approved`만 사용할 수 있다. Candidate를 Library, Editor, Public에 노출하려면 명시적으로 promotion을 거쳐야 한다.

## Public extraction 규칙

공개 페이지에서 이미 완성된 모듈은 외형을 다시 그리지 않는다.

1. 현재 공개 DOM class/id, CSS owner, interaction owner를 확인한다.
2. 동일 구조를 공통 `render()`로 옮긴다.
3. 기존 공개 renderer를 adapter로 공통 모듈에 연결한다.
4. Library와 Editor도 같은 모듈 ID를 소비한다.
5. 기존 공개 화면과 geometry, typography, surface, interaction parity를 검증한다.

새 모듈이 canonical이 된 뒤에는 공개 페이지와 Library/Editor에 별도 복제품을 만들지 않는다.

## Block Lab promotion 규칙

Block Lab의 후보가 승인되더라도 연구실 파일을 다른 surface가 import하는 방식으로 승격하지 않는다.

승격 절차:

1. 연구실에서 구조, 상태, interaction을 확정한다.
2. 사용자 승인 또는 명시적 합의를 기록한다.
3. 재사용 가능한 부분을 `public/assets/js/platform-modules/` 아래 공통 모듈 코드로 추출한다.
4. source를 `block-lab-approved`, status를 `approved`로 등록한다.
5. Library에서 독립 UI Kit 검증을 한다.
6. Block Editor에서 동일 module id와 props로 조립되는지 검증한다.
7. 신규 페이지 QA 후 Public consumer에 연결한다.

`Block Lab data → Editor` 또는 `Block Lab renderer → Library` 직접 연결은 금지한다.

## Shared preview

Library와 Editor의 시각 실행 호스트는 하나다.

Route:
`/ui-dashboard/module-preview/`

- Library: `embed=library`
- Editor: `embed=editor`

이 호스트는 `PlatformModuleRegistry`의 동일 `render()/hydrate()`를 실행한다. Library 전용 모사 renderer나 Editor 전용 복제품을 만들지 않는다.

Preview용 CSS는 배경, 정렬, viewport 격리만 소유한다. 실제 component skin은 공통/공개 owner가 소유한다.

Preview는 최종적으로 선택된 모듈의 `ownerFiles` dependency만 읽는 구조로 수렴한다. 광범위한 특정 분야 runtime을 모든 모듈에 미리 로드해 다른 page-context UI가 섞이는 상태는 허용하지 않는다.

## Editor storage contract

Block Editor가 저장하는 공통 UI 인스턴스의 최소 구조:

```json
{
  "type": "ui-module",
  "variant": "filter-chip-rail",
  "content": {},
  "styleOverrides": {},
  "state": {}
}
```

- `variant`는 canonical module id다.
- `content`는 module props다.
- `styleOverrides`와 `state`는 해당 인스턴스의 커스텀 결과다.
- Library 기본값은 새 인스턴스를 만들 때만 snapshot한다.
- 기존 인스턴스는 이후 Library 기본값 변경을 다시 읽지 않는다.
- Block Lab sample object나 research-only metadata를 저장하지 않는다.
- 기존 페이지 초안의 SEO, AI brief, revision metadata는 page layer가 별도로 관리한다.

## 저장된 완성 모듈 / preset contract

에디터에서 검수 완료된 모듈 인스턴스를 다시 쓸 때는 렌더된 HTML/CSS를 복제하지 않는다.

최소 저장 구조:

```json
{
  "moduleId": "filter-chip-rail",
  "moduleVersion": 9,
  "content": {},
  "style": {},
  "state": {},
  "presetMeta": {
    "name": "완성 preset",
    "updatedAt": "ISO-8601"
  }
}
```

- preset은 canonical module definition을 참조한다.
- 저장 대상은 입력값/설정값/state snapshot이다.
- module owner code를 preset 안에 복사하지 않는다.
- preset을 새 페이지에 삽입하면 같은 Registry module을 새 instance로 생성한다.
- 향후 Portable Export도 preset이 아니라 Registry owner dependency를 따라 실제 코드 파일을 수집한다.

## 공개 페이지 발행

Public은 Registry에서 `approved`이며 `public` consumer가 허용된 모듈만 사용할 수 있다.

발행 순서:

`Editor draft → page validation → module status check → responsive/theme/interaction QA → publish → live deployment verification`

공개 페이지의 현재 완성형을 공통 모듈로 추출하는 과정은 단계적으로 진행할 수 있다. 이미 adapter가 연결된 모듈과 아직 legacy owner가 직접 렌더링하는 모듈을 구분해서 기록한다.

## Portable Export

최종 내보내기는 전체 Photo-eBook 저장소를 복사하지 않는다.

`사용된 module id → Registry definition → ownerFiles → transitive dependency manifest → page source/assets/routes/SEO metadata → standalone repo bundle`

새 Git 저장소/Cloudflare Pages에서 동일한 모듈 코드가 재현되는 smoke test를 통과해야 Portable Export 완료로 본다.

## 금지 사항

- Library에서 `/block-lab/` runtime/data 직접 import
- Editor에서 `/block-lab/` runtime/data/style 직접 import
- Public에서 Block Lab/Editor/Library runtime import
- 동일 module id를 surface별 별도 HTML/CSS skin으로 재구현
- 완료 preset에 렌더된 component HTML/CSS를 복사해 저장
- candidate 자동 승인
- 사용자 검토 없이 Block Lab 결과를 production으로 이동
- Library를 연구실처럼 사용
- Block Lab을 완성 모듈 catalog처럼 사용

## 현재 첫 추출 세트

Photography 공개 페이지에서 시작한 첫 canonical set:

- `top-chapter-navigation`
- `filter-chip-rail`
- `horizontal-card-rail`
- `collection-bottom-sheet`
- `device-handoff-accordion`
- `floating-action`

Block Lab에서 승격한 portable set:

- `horizontal-rail`
- `accordion`
- `bottom-sheet`

Platform 공통 composition:

- `screen-mode-selector`

이 세트가 Library와 Editor에서 동일 Registry를 통해 동작하는 것을 안정화한 뒤, Public consumer 승인과 Portable Export dependency packaging을 단계적으로 진행한다.
