# Canonical Platform Module Pipeline

Status: active architecture contract

## 역할

플랫폼은 다섯 개의 역할을 분리한다.

1. Canonical Module Registry
   - 승인된 재사용 UI 모듈의 영구 source of truth다.
   - `PlatformModuleRegistry`의 module id, render/hydrate owner, ownerFiles, version과 consumer 계약이 기준이다.
   - 특정 완성 페이지를 영구 upstream으로 삼지 않는다.

2. UI 라이브러리 `/ui-dashboard/`
   - 승인된 공통 모듈만 보여주는 UI Kit다.
   - 연구 공간이 아니다.
   - `PlatformModuleRegistry.listFor('library')`가 유일한 모듈 목록 source다.
   - 모듈 분류/트리 UI는 Registry 엔트리를 조직할 뿐 별도 component 구현을 만들지 않는다.

3. 블록 연구실 `/block-lab/`
   - 신규 블록, variant, 상호작용, 스타일을 연구하는 격리 공간이다.
   - 사용자와 GPT가 논의하고 검토하는 candidate surface다.
   - 연구실의 JS, CSS, sample data를 라이브러리나 블록 에디터가 직접 import하지 않는다.

4. 블록 에디터 `/editor-lab/`
   - 승인된 공통 모듈만 조립해 페이지를 만든다.
   - 페이지에는 연구 block type이 아니라 canonical `module id + content/style/state snapshot`을 저장한다.
   - 완성된 모듈 인스턴스를 재사용 preset으로 저장할 수 있는 계층을 둔다.
   - 완성된 페이지를 Completed Page로 분류하고 저장하며, 발행 전 QA로 넘긴다.

5. Completed / Published Pages
   - 블록 에디터가 저장한 page snapshot의 consumer다.
   - 완료 페이지 목록에서 열람/편집/복제할 수 있어야 한다.
   - Public runtime은 Registry의 approved module을 직접 mount한다.
   - 완료 페이지는 Library의 upstream이 아니다.

## 정식 흐름

Block Lab에서 출발하는 신규 모듈:

`블록 연구실 candidate → 사용자 + GPT 검토 → canonical 공통 모듈로 승격 → approved/block-lab-approved → UI 라이브러리 → 블록 에디터 인스턴스 커스텀 → 저장된 완성 모듈/preset → Completed Page → Public/Portable Export`

기존 완성 페이지에서 처음 추출하는 모듈:

`기존 완성 페이지를 일회성 bootstrap reference로 분석 → canonical 공통 모듈 코드 추출 → approved/public-extracted provenance 기록 → UI 라이브러리 → 블록 에디터 → Completed Page`

중요:

- 기존 완성 페이지는 추출 시점의 비교/검증 기준일 뿐 영구적인 Library source가 아니다.
- canonical extraction이 끝난 뒤 Library의 source of truth는 `PlatformModuleRegistry`다.
- `source: public-extracted`는 최초 출처를 기록하는 provenance 값이지 live dependency/upstream 의미가 아니다.
- 특정 페이지의 DOM/CSS/runtime 변경이 Library 모듈을 자동 갱신하는 흐름을 만들지 않는다.
- Photography는 초기 추출 작업이 끝난 뒤 최종적으로 Block Editor의 Completed Page registry에 등록되어 다른 완성 페이지와 같은 방식으로 관리되어야 한다.
- UI 라이브러리에서 직접 공개 페이지로 설정을 밀어 넣지 않는다. 공개 화면은 블록 에디터가 저장한 승인 모듈 기반 page snapshot과 발행 QA를 통과한 결과를 소비한다.

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

`source`와 `sourceRoute`는 provenance/추출 이력이다. canonical module의 runtime dependency를 뜻하지 않는다.

일반 consumer는 `approved`만 사용할 수 있다. Candidate를 Library, Editor, Public에 노출하려면 명시적으로 promotion을 거쳐야 한다.

## 기존 완성 페이지 bootstrap extraction 규칙

기존 페이지에서 이미 완성된 모듈을 처음 canonicalize할 때는 외형을 다시 그리지 않는다.

1. 현재 완성 페이지 DOM class/id, CSS owner, interaction owner를 확인한다.
2. 재사용 가능한 구조를 공통 `render()/hydrate()` owner로 추출한다.
3. 기존 페이지는 전환 기간 동안 adapter로 canonical module을 소비하게 할 수 있다.
4. Library와 Editor도 같은 module ID와 owner를 소비한다.
5. 기존 페이지와 geometry, typography, surface, interaction parity를 검증한다.
6. parity가 확보되면 기존 페이지를 영구 source로 유지하지 않고 Completed Page snapshot으로 이관하는 것이 최종 상태다.

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
7. 신규 페이지 QA 후 Completed Page/Public consumer에 연결한다.

`Block Lab data → Editor` 또는 `Block Lab renderer → Library` 직접 연결은 금지한다.

## Shared preview

Library와 Editor의 시각 실행 호스트는 하나다.

Route:
`/ui-dashboard/module-preview/`

- Library: `embed=library`
- Editor: `embed=editor`

이 호스트는 `PlatformModuleRegistry`의 동일 `render()/hydrate()`를 실행한다. Library 전용 모사 renderer나 Editor 전용 복제품을 만들지 않는다.

Preview용 CSS는 배경, 정렬, viewport 격리만 소유한다. 실제 component skin은 canonical shared owner가 소유한다.

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

## Completed Page contract

완성 페이지는 특정 분야 runtime을 Library의 upstream으로 보관하는 장치가 아니다.

최소 역할:

- page id / title / route / status / metadata
- canonical `ui-module` instance 배열
- content/style/state snapshot
- SEO/GEO/page hierarchy metadata
- published revision / updated revision

Photography는 첫 completed page migration 대상이다.

최종 관리자 흐름:

`블록 에디터 → 완료 페이지 목록 → Photography 선택 → 동일 canonical module owner로 렌더/편집/복제 → 발행`

Photography 원본 페이지는 migration/parity QA가 완료된 뒤 Library source라는 역할을 갖지 않는다.

## 공개 페이지 발행

Public은 Registry에서 `approved`이며 `public` consumer가 허용된 모듈만 사용할 수 있다.

발행 순서:

`Editor draft → page validation → module status check → responsive/theme/interaction QA → Completed Page revision → publish → live deployment verification`

전환 기간 동안 현재 Photography legacy composition이 존재할 수 있으나 이는 migration source/QA fixture일 뿐 최종 아키텍처의 upstream이 아니다.

## Portable Export

최종 내보내기는 전체 Photo-eBook 저장소를 복사하지 않는다.

`사용된 module id → Registry definition → ownerFiles → transitive dependency manifest → page source/assets/routes/SEO metadata → standalone repo bundle`

새 Git 저장소/Cloudflare Pages에서 동일한 모듈 코드가 재현되는 smoke test를 통과해야 Portable Export 완료로 본다.

## 금지 사항

- 특정 공개/완성 페이지를 Library의 영구 source/upstream으로 유지
- 특정 페이지 DOM/CSS/runtime 변경을 Library module에 자동 전파
- Library에서 `/block-lab/` runtime/data 직접 import
- Editor에서 `/block-lab/` runtime/data/style 직접 import
- Public에서 Block Lab/Editor/Library runtime import
- 동일 module id를 surface별 별도 HTML/CSS skin으로 재구현
- 완료 preset에 렌더된 component HTML/CSS를 복사해 저장
- candidate 자동 승인
- 사용자 검토 없이 Block Lab 결과를 production으로 이동
- Library를 연구실처럼 사용
- Block Lab을 완성 모듈 catalog처럼 사용

## 현재 bootstrap 추출 세트

Photography 페이지를 초기 reference로 사용해 추출한 첫 canonical set:

- `top-chapter-navigation`
- `filter-chip-rail`
- `horizontal-card-rail`
- `collection-bottom-sheet`
- `device-handoff-accordion`
- `floating-action`

이 목록의 `public-extracted`는 역사적 provenance다. Photography를 계속 원천으로 조회해야 한다는 의미가 아니다.

Block Lab에서 승격한 portable set:

- `horizontal-rail`
- `accordion`
- `bottom-sheet`

Platform 공통 composition:

- `screen-mode-selector`

이 세트가 Library와 Editor에서 동일 Registry를 통해 안정화된 뒤, Photography completed-page migration → completed-page registry/edit/duplicate → Public consumer 정리 → Portable Export dependency packaging 순서로 진행한다.
