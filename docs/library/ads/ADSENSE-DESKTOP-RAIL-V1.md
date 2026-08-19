# AdSense Desktop Rail V1

이 문서는 `먹고살기` 공개 산업 페이지에 Google AdSense를 붙일 때 콘텐츠 가독성과 조작 안전성을 먼저 보호하기 위한 레이아웃 계약이다.

AdSense 계정 승인, publisher ID, 실제 광고 노출 여부는 외부 checkpoint다. 이 문서는 광고 코드가 없어도 지켜야 할 레이아웃 경계를 정의한다.

## 1. 기본 방향

1차 광고 형식 후보는 Google AdSense Auto ads의 **side rail ads**다.

Google 공식 문서 기준:
- side rail은 desktop/widescreen에서 페이지 좌우에 붙는 overlay 광고다.
- left + right, left only, right only 위치를 선택할 수 있다.
- 특정 element 안에 side rail이 겹치지 않게 `google-side-rail-overlap="false"`를 사용할 수 있다.

Reference:
- `https://support.google.com/adsense/answer/16531757`
- `https://support.google.com/adsense/answer/16242705`

## 2. 광고가 콘텐츠 폭을 결정하지 않는다

본문 renderer는 광고가 없어도 완결된 레이아웃이어야 한다.

광고가 나타났을 때:
- 본문이 갑자기 왼쪽/오른쪽으로 이동하지 않음
- chapter nav 위치가 흔들리지 않음
- horizontal rail 시작점이 달라지지 않음
- 카드 그림자가 viewport/rail에 잘리지 않음
- 광고 로딩으로 CLS가 생기지 않음

side rail은 overlay 형식이므로 본문 안에 빈 광고 column을 항상 예약하지 않는다.

## 3. desktop safe content width

기본 public content max:

```css
--content-max: 1180px;
```

wide desktop에서 좌우 광고와 콘텐츠가 겹칠 가능성을 줄이기 위해 레이아웃 QA 시 다음 safe width를 비교한다.

```css
@media (min-width: 1440px) {
  .public-page-frame {
    width: min(1180px, calc(100vw - 360px));
    margin-inline: auto;
  }
}
```

의미:
- 1440px → 콘텐츠 약 1080px, 좌우 약 180px 확보
- 1536px → 콘텐츠 약 1176px
- 1600px 이상 → 1180px cap

이 수치는 최종 AdSense preview에서 조정 가능하다. 현재 photography production에 바로 적용하지 않는다.

## 4. interactive safe zone

Google 정책상 메뉴, navigation, 재생/다운로드 버튼 등과 광고가 너무 가까우면 의도하지 않은 클릭 위험이 있다.

따라서 public page에서 다음은 side rail과 시각적으로 분리한다.

- sticky chapter navigation
- horizontal media/card rail의 drag 시작/끝 영역
- copy button
- CTA button
- video play control
- dropdown
- floating collection/question action

필요한 영역에는 검토 후:

```html
<div google-side-rail-overlap="false">...</div>
```

를 적용할 수 있다.

Google reference:
- `https://support.google.com/adsense/answer/1346295`

## 5. rail padding

PC horizontal content rail은 page content edge와 정렬하되 shadow/drag affordance가 잘리지 않게 내부 runway를 가진다.

광고 때문에 rail 자체의 `overflow` owner를 바꾸지 않는다.

원칙:
- browser native horizontal overflow 유지
- left/right runway 유지
- side ad wrapper가 scroll owner가 되지 않음
- 광고 element가 drag pointer event를 가로채지 않게 함

## 6. mobile/tablet

side rail용 별도 공간을 mobile/tablet에 만들지 않는다.

모바일 광고는 별도의 Auto ads/anchor/in-page 정책으로 검토한다.

현재 V1 목표에서 우선순위:
1. desktop side rail
2. 본문 layout 안정성
3. mobile 광고 형식은 별도 QA

## 7. AdSense code injection

publisher ID를 얻기 전에는 production AdSense script를 넣지 않는다.

향후 코드 삽입 위치:
- public page template/shared head 한 곳
- Block renderer 안에 중복 삽입 금지
- Lab/Editor/QA/Staging에는 광고 script 삽입 금지

Auto ads를 사용하면 Google이 placement를 결정하므로 page마다 별도 ad block을 content array에 넣지 않는다.

manual in-page ad를 나중에 추가한다면 content block과 분리된 `monetization slot` 계약을 별도로 만든다.

## 8. 광고와 UI 구분

광고를 메뉴/카드/추천 링크처럼 보이게 디자인하지 않는다.

Google 정책상 광고를 navigation, download link, 기타 사이트 콘텐츠로 착각하게 만드는 placement를 피해야 한다.

따라서:
- 광고 옆에 유사한 CTA 배치 금지
- 광고를 `추천`, `다음 단계`, `다운로드` 같은 제목으로 감싸지 않음
- 광고와 content card의 visual mimicry 금지
- 사용자가 광고 클릭을 사이트 기능으로 오해할 수 있는 배치 금지

## 9. performance / CWV

광고 적용 전/후를 별도로 측정한다.

검사:
- LCP
- INP
- CLS
- main thread blocking
- network request 증가
- scroll/drag responsiveness

AdSense on/off 두 상태를 같은 페이지에서 비교한다.

side rail이 overlay라도 광고 script 자체가 성능에 영향을 줄 수 있으므로 광고가 없는 상태의 baseline을 먼저 기록한다.

## 10. ads.txt

publisher ID 발급 후 root `ads.txt` 추가를 검토한다.

Google은 ads.txt를 필수로 요구하지는 않지만 사용을 적극 권장한다.

Reference:
- `https://support.google.com/adsense/answer/12171612`

publisher ID가 없는 현재 단계에서 placeholder ads.txt를 만들지 않는다.

## 11. V1 QA matrix

PC widths:
- 1180
- 1280
- 1366
- 1440
- 1536
- 1600
- 1920

각 폭에서:
- side rail off
- left only
- right only
- left + right

검사:
- 본문 중앙 정렬
- chapter nav 중앙/충돌
- 카드 shadow clip
- horizontal rail 시작/끝 runway
- clickable UI와 광고 거리
- sticky/fixed 충돌
- resize 중 layout shift

## 12. production gate

광고를 켜기 전:
- public renderer approved
- privacy/cookie disclosure 준비
- 실제 콘텐츠 충분
- navigation 정상
- ads-free 상태 CWV baseline 확보
- AdSense preview에서 excluded areas 확인

광고를 켠 뒤:
- accidental click 위험 재검토
- PC/mobile QA
- CWV 재측정
- 광고 위치별 실험은 AdSense 자체 experiment 기능을 우선 검토

광고 수익을 위해 content block 정보 구조를 훼손하지 않는다.
