# Photo-eBook V1 모듈 명세 라이브러리

이 폴더는 화면 여러 곳에서 반복 재사용할 수 있는 **확정 UI/UX 모듈**의 구조·상태·동작 계약을 보관한다.

기존 `docs/spec-v1/04-component-registry.md`가 selector 단위 컴포넌트 사전이라면, 이 폴더는 여러 컴포넌트가 결합된 **재사용 가능한 상호작용 패턴**을 정의한다.

## 사용 규칙

1. 같은 목적의 UI를 새로 만들기 전에 이 폴더에서 동일한 모듈이 있는지 먼저 확인한다.
2. 이미 확정된 모듈이 있으면 새로운 카드/버튼/애니메이션 언어를 추가하지 않고 해당 계약을 재사용한다.
3. 제품별 문구와 내부 콘텐츠는 달라도 외곽 구조, 상태 전환, 접근성, motion, border ownership은 모듈 계약을 따른다.
4. 기존 화면에 적용된 모듈을 수정할 때는 해당 모듈 문서의 회귀 체크 항목을 먼저 확인한다.
5. 사용자 승인 없이 확정 모듈의 시각 언어를 전역 재설계하지 않는다.

## 등록 모듈

- `MOD-ACC-001-inline-disclosure-accordion.md` — 한 개의 외곽 shell 안에서 header와 상세 panel이 자연스럽게 펼쳐지는 inline disclosure accordion. 현재 `내 모음 > 설정 > 다른 기기에서 이어보기`가 canonical reference implementation이다.

## ID 규칙

- `MOD-ACC-*` — accordion / disclosure
- `MOD-PANEL-*` — expandable/static panel
- `MOD-ACTION-*` — action group / confirmation
- `MOD-RAIL-*` — horizontal/segmented rail
- `MOD-SHEET-*` — bottom-sheet 내부 재사용 패턴

새 모듈을 추가할 때는 이 README에도 한 줄 요약을 추가한다.
