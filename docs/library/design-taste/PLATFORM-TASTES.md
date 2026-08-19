# PLATFORM-TASTES.md

이 문서는 `먹고살기` 플랫폼의 UI를 만들거나 고칠 때 가장 먼저 확인하는 짧은 디자인 판단 기준이다.

외부 reference의 스타일을 복제하지 않는다. 현재 프로젝트의 승인된 token, responsive 계약, Block Lab 검토와 사용자 피드백에서 반복적으로 확인된 방향을 압축한다.

## REJECT

- 내용보다 카드, 테두리, 그림자, 배지가 먼저 보이는 화면
- 모든 정보를 별도 흰 카드에 넣는 dashboard식 구성
- 제목, 설명, meta, badge가 비슷한 시각 강도로 경쟁하는 구조
- 정보 역할이 같은데 모듈마다 다른 badge/button/card 문법을 만드는 것
- 단지 세련돼 보이기 위해 gradient, glass, liquid motion을 추가하는 것
- 읽기 콘텐츠에 불필요한 spring, morphing, parallax를 넣는 것
- 가로 rail이 필요하지 않은 짧은 항목까지 무조건 horizontal scroll로 만드는 것
- rail 첫 카드 그림자가 잘리거나 마지막 카드가 막혀 보이는 geometry
- mobile touch scroll과 경쟁하는 custom drag/momentum
- PC를 위해 mobile에서 검증된 구조와 interaction을 깨는 것
- 작은 글자와 많은 meta로 정보를 압축해 가독성을 떨어뜨리는 것
- 외부 Apple/iOS/디자인 레퍼런스의 수치와 스타일을 그대로 복사하는 것
- AI가 자주 만드는 획일적인 3-card, 과도한 pill, 장식 아이콘 중심 구성

## REQUIRE

- 화면을 처음 봤을 때 제목 → 핵심 설명 → 판단 정보 → 다음 행동 순서가 보여야 함
- typography와 whitespace가 기본 hierarchy를 만들고 surface는 필요한 곳에만 사용
- 본문은 충분한 행간과 읽기 폭을 유지하고 한국어 `keep-all`을 고려
- 카드 내부는 이미지, 제목, 설명, 수치, meta의 역할이 분명해야 함
- 비교 UI는 먼저 비교 기준을 맞춘 뒤 선택지를 같은 순서로 보여줌
- 수치는 단위, 의미, 기준일 또는 전제와 함께 표시
- 이미지가 있으면 장식이 아니라 내용 이해에 실제 역할을 가져야 함
- mobile-first. PC는 폭과 grid를 확장하되 같은 정보 구조를 유지
- horizontal rail은 browser native overflow를 owner로 유지
- rail은 좌우 시작점, 마지막 여백, shadow runway를 의도적으로 설계
- light/dark에서 정보 hierarchy가 같아야 함
- action은 실제 `button`/`a`, focus-visible, reduced-motion을 기본 지원
- Block Lab, Admin Preview, Production은 최종적으로 같은 canonical renderer 사용
- 외부 reference는 적용 범위와 금지 범위를 읽은 뒤 필요한 원리만 차용

## WHEN AMBIGUOUS

- 더 추가하기보다 먼저 뺀다.
- 새로운 surface보다 typography와 spacing으로 해결 가능한지 본다.
- border와 shadow가 둘 다 필요하지 않다면 하나를 줄인다.
- 읽는 UI는 정적으로, 직접 조작하는 UI만 움직인다.
- rail과 grid가 모두 가능하면 항목 수와 비교 방식에 더 적합한 쪽을 고른다.
- 한 화면에 여러 visual idea가 충돌하면 하나의 주된 언어를 남긴다.
- 익숙한 interaction을 다시 설명하거나 장식으로 강조하지 않는다.
- 모바일에서 먼저 자연스러운지 확인한 뒤 데스크톱을 확장한다.
- 사용자에게 필요한 판단 정보가 늘지 않는 변경은 디자인 개선으로 보지 않는다.

## EXTERNAL REFERENCE PRIORITY

1. 사용자 현재 피드백
2. 이 `PLATFORM-TASTES.md`
3. 프로젝트 design token / layout / accessibility spec
4. Approved Block Registry
5. block에 연결된 개별 external reference

외부 taste skill이나 DESIGN.md는 이 순서를 뒤집지 않는다.

## EVOLUTION

새로운 사용자 피드백이 여러 block에서 반복되거나 플랫폼 전체에 적용할 가치가 있으면 이 문서를 갱신한다.

특정 block 하나에만 해당하는 취향은 해당 block spec에 남기고 이 파일을 불필요하게 늘리지 않는다.
