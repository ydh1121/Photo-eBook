# MOD-ACC-001 — Inline Disclosure Accordion

상태: **V1 확정 / 재사용 권장**

현재 canonical reference: `내 모음 > 설정 > 다른 기기에서 이어보기`.

이 모듈은 한 줄짜리 설정/메뉴 행을 눌렀을 때 같은 카드가 아래로 자연스럽게 확장되며 상세 조작 UI를 보여주는 패턴이다. 새 화면에서 동일한 목적이 생기면 별도 카드·별도 팝업을 새로 설계하기보다 이 구조를 우선 재사용한다.

## 1. 핵심 시각 계약

### MOD-ACC-001-A — outer shell은 하나

닫힘과 열림 모두 **외곽 shell은 하나만 존재**해야 한다.

MUST:
- 닫힘: 한 개의 rounded rectangle.
- 열림: 같은 rectangle의 높이가 아래로 확장된 것처럼 보여야 함.
- header와 panel 사이에 이중 외곽선이 생기지 않음.
- panel 자체가 별도 카드처럼 아래로 빠져나오지 않음.

MUST NOT:
- 닫힌 카드 위에 열린 카드 껍데기를 한 겹 더 씌움.
- header와 panel이 각각 독립 rounded card처럼 보임.
- open/close 중 borderless rectangle, flash surface, 잔상 노출.

현재 구현에서는 `.collection-device-accordion`이 outer shell을 소유한다.

## 2. canonical DOM 역할

현재 reference implementation selector:

- `.collection-device-accordion` — outer shell / clipping owner.
- `#collectionDeviceLink.collection-setting-row` — trigger/header.
- `.collection-device-panel-v2` — animated disclosure region.
- `.collection-device-panel-clip` — panel clipping boundary.
- `.collection-device-panel-inner` — 실제 콘텐츠 레이아웃.

재사용 시 selector 이름은 기능에 맞게 달라질 수 있으나 역할 분리는 유지한다.

권장 구조:

```html
<div class="...accordion">
  <button aria-expanded="false" class="...trigger">...</button>
  <div class="...panel" aria-hidden="true">
    <div class="...clip">
      <div class="...inner">...</div>
    </div>
  </div>
</div>
```

## 3. 상태 source

### MOD-ACC-001-B — 하나의 공개 상태

trigger의 `aria-expanded="false|true"`가 사용자에게 노출되는 canonical 상태다.

MUST:
- 닫힘: `aria-expanded="false"`.
- 열림: `aria-expanded="true"`.
- panel의 `aria-hidden`을 반대로 동기화.
- 시각 상태와 접근성 상태가 어긋나지 않음.

구현상 부모 class를 보조 state로 사용할 수 있으나 화살표와 panel이 서로 다른 state source를 보게 만들면 안 된다.

## 4. chevron

### MOD-ACC-001-C — 문자 `>` 사용 금지

chevron은 텍스트 문자가 아니라 SVG 또는 SVG mask 계열 아이콘을 사용한다.

MUST:
- 닫힘: 오른쪽 방향.
- 열림: 아래 방향.
- 같은 아이콘 인스턴스가 회전하는 것으로 보여야 함.
- transition이 실제 회전 과정으로 보임.

현재 reference motion:
- 약 `0.32s`.
- `cubic-bezier(.22,.72,.18,1)` 계열.
- `transform-origin: 50% 50%`.

MUST NOT:
- 클릭 후 방향만 즉시 교체.
- DOM 재생성 때문에 첫 클릭만 snap.
- open/close 후 아이콘이 사라짐.

## 5. 펼침 motion

### MOD-ACC-001-D — 아래로 자연스럽게 확장

사용자는 header 아래에서 내용이 촤르르 내려오는 것으로 인식해야 한다.

MUST:
- panel은 header와 같은 shell 내부에서 reveal.
- open/close 중 외곽 shell은 계속 같은 위치/테두리 owner를 유지.
- 내부 콘텐츠는 약한 opacity/translate 보조 motion 사용 가능.

현재 reference:
- panel reveal 약 `0.36s`.
- inner content는 `opacity 0 → 1`, `translateY(-6px) → 0`.

MUST NOT:
- 별도 rectangle 전체가 아래로 slide.
- `display:none ↔ block`만으로 순간 출현.
- 열리는 중 화면이 번쩍임.

`prefers-reduced-motion: reduce`에서는 transition을 제거할 수 있다.

## 6. spacing

### MOD-ACC-001-E — header와 첫 panel row 사이 여백

header 설명의 마지막 줄과 panel 첫 콘텐츠 사이에는 명확한 breathing room이 있어야 한다.

현재 reference 값:
- desktop/기본: panel inner 상단 `12px`.
- mobile `<=560px`: panel inner 상단 `11px`.
- 좌우 padding: desktop `14px`, mobile `13px`.
- 하단 padding: desktop `14px`, mobile `13px`.

현재 확정된 이유:
- `다른 기기에서 이어보기` 설명 하단과 `이 기기의 연결 코드` 상단이 붙어 보이지 않아야 함.
- 반대로 header와 panel이 서로 다른 카드처럼 멀어 보일 정도로 벌리지 않음.

## 7. 내부 콘텐츠 규칙

reference device handoff panel은 다음 순서를 사용한다.

1. 현재 기기의 연결 코드.
2. 코드 복사 action.
3. divider.
4. 다른 기기의 코드 입력 설명.
5. input + primary connect action.
6. status/error text.

일반화 규칙:
- 첫 row는 panel 상단에 바로 붙이지 않고 `MOD-ACC-001-E` spacing을 지킨다.
- secondary action은 사이트 기존 neutral button family 사용.
- primary action만 기존 blue action family 사용.
- 임의의 새로운 accent color를 만들지 않는다.

## 8. theme

MUST:
- light/dark 모두 기존 site surface token family 재사용.
- outer shell과 내부 panel의 경계가 theme에 따라 과도하게 진하거나 흐려지지 않음.
- 내부 panel은 별도 card 배경을 추가하지 않는 것이 기본.

현재 dark reference:
- outer surface: `var(--v36-dark-surface,#171b21)`.
- outer border: `var(--v36-dark-line,rgba(255,255,255,.085))`.

## 9. bottom sheet에서 사용할 때

`내 모음`처럼 scroll body 내부에서 사용할 경우:

- accordion 확장 자체 때문에 visible scrollbar track이 나타나 좌우 폭이 바뀌면 안 됨.
- bottom sheet의 scroll 기능은 유지.
- modal/backdrop/scroll lock owner를 새로 만들지 않음.
- accordion 클릭이 별도 modal을 열어 현재 sheet interaction을 잠그지 않음.

## 10. 현재 reference implementation의 기능 계약

`다른 기기에서 이어보기`는 별도 질문 modal로 이동하지 않는다.

현재 sheet 내부에서 inline accordion으로 열리며:
- 현재 연결 코드를 보여줌.
- 사용자가 보는 코드는 `dev_` prefix 없이 48자리 값만 사용.
- 복사 값에도 `dev_`를 노출하지 않음.
- 다른 기기에서 복사한 48자리 코드를 입력해 연결.
- 내부 저장/API compatibility가 필요하면 implementation 내부에서만 prefix를 정규화할 수 있음.

사용자-facing 문구에서 개발자 내부 식별자 표현을 노출하지 않는다.

## 11. implementation owner

현재 V1 reference owner:

- behavior/state: `public/assets/script-33.js`.
- canonical accordion appearance: `public/assets/style-45.css`.
- late robust open-state/spacing reinforcement: `public/assets/style-46.css`.
- integration surface: `docs/spec-v1/07-collection-hub.md`.

향후 CSS를 통합하더라도 이 문서의 computed behavior를 보존해야 한다.

## 12. 회귀 체크

다음 중 하나라도 발생하면 실패다.

- [ ] 최초 화면에서 chevron이 없음.
- [ ] 첫 클릭에서 chevron이 애니메이션 없이 순간 변경됨.
- [ ] open 후 chevron이 사라짐.
- [ ] close 후 chevron이 사라짐.
- [ ] 화살표는 열렸는데 panel 내용은 안 열림.
- [ ] header와 panel 사이/주변에 이중선이 보임.
- [ ] 열린 panel이 별도의 테두리 없는 rectangle처럼 아래로 빠짐.
- [ ] open/close 중 flash/번쩍임이 보임.
- [ ] 닫은 뒤 panel 잔상이 남음.
- [ ] header 설명과 첫 panel row가 붙어 보임.
- [ ] panel을 열자 bottom sheet 폭이 scrollbar 때문에 달라짐.
- [ ] click 후 다른 modal/backdrop이 살아나 화면 interaction이 잠김.
- [ ] 사용자 화면에 `dev_`가 표시됨.

## 13. 재사용 판단

다음 조건이면 이 모듈을 우선 사용한다.

- 설정 행에서 추가 옵션을 inline으로 보여줄 때.
- 상세 정보가 짧아 별도 페이지/팝업이 과할 때.
- parent surface의 맥락을 유지하면서 입력·복사·보조 action을 보여줄 때.

다음은 다른 모듈이 적합하다.

- 여러 화면 단계가 필요한 긴 workflow → sheet/page.
- 확인/위험 action 한 번만 필요한 경우 → confirmation module.
- 한 번에 여러 섹션을 독립적으로 펼치는 FAQ 형태 → multi-accordion 변형을 별도 명세로 등록.
