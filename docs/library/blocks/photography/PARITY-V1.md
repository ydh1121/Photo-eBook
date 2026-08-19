# Photography Content Block Parity V1

상태: `classification complete / advanced variants not yet production-bound`

현재 photography production renderer와 `components/cards.css`, `core/base-components.css`를 Block Lab V1과 비교한 1차 분류다.

목표는 photography 디자인을 평준화하는 것이 아니라, 재사용 가능한 구조는 advanced variant로 승격하고 같은 구조의 시각 공식은 Style preset으로 저장하는 것이다.

## 판정 기준

- `advanced variant`: DOM/정보 순서/레이아웃 구조가 Block Lab 기본형과 의미 있게 다름
- `style preset`: 구조는 같고 surface, radius, density, media ratio, border/shadow 정도가 다름
- `primitive`: 여러 Block에서 재사용할 작은 UI
- `photography-only`: 촬영 의미나 사진 데이터에 강하게 묶여 공통화할 가치가 낮음

---

## 01. Hero

Photography:
- full-bleed image
- `min-height:90dvh`
- image saturation/contrast/brightness treatment
- full vertical dark gradient overlay
- bottom-aligned body
- eyebrow with short blue rule
- facts are **2-column grid**, max width 42rem
- facts use dark translucent glass

Block Lab `hero/image-metrics`:
- full image/overlay라는 큰 방향은 같음
- fact 구조와 공간 배치가 다름

판정:
- **advanced variant 필요**
- 제안 id: `immersive-metrics`

이유:
- 90dvh immersive hero + bottom narrative + 2-column facts는 단순 density/radius 차이가 아님.

추가 Style preset:
- `사진 Hero · dark glass facts`

---

## 02. Chapter Hero

Photography:
- one large image card
- image fills entire card
- bottom overlay gradient
- index/title/description overlay at bottom
- min-height 24rem

Block Lab `chapter-hero/image`:
- image 영역 + copy 영역 분리형

판정:
- **advanced variant 필요**
- 제안 id: `image-overlay`

이 variant는 사진 외에도 영상, 네일, 음식, 미용 등 비주얼이 중요한 산업에서 재사용 가능.

---

## 03. Market Comparison

Photography `.market-card`:
- image top
- TOP rank
- title
- two equal metric cells: beginner price / target price
- customer/channel footer
- rail card width min(79vw,18.5rem)

Block Lab `comparison-cards/generic`:
- generic dl key/value rows

판정:
- **advanced variant 필요**
- 제안 id: `visual-metrics`

구조 공식:
`media → rank/kicker → title → 2~3 primary metric cells → supporting meta`

가격이라는 사진 특수 이름은 content schema에 남기지 않고 generic metrics 배열로 일반화.

---

## 04. Education Option

Photography `.edu-option`:
- priority label + title
- large rank number on right
- recommendation line
- metric tags for revenue/time/cost efficiency

Block Lab `comparison-cards/scored`:
- 목적이 거의 동일하지만 scored variant가 아직 partial.

판정:
- **새 variant보다 `scored` 고도화**
- photography 구조를 scored variant의 reference implementation으로 사용.

Style preset 후보:
- `사진 교육 비교 · rank + soft metrics`

---

## 05. Checklist

Photography:
- 2-column grid
- white card each item
- number + one sentence

Block Lab:
- numbered/checkable
- 이후 refinement에서는 coherent checklist surface로 정제됨

판정:
- photography 방식 자체를 새 variant로 만들 필요는 없음.
- **`numbered` style preset 후보**
- 실제 Block Lab 검토에서 mini-card 방식과 unified-list 방식을 비교한 뒤 결정.

---

## 06. Skill Card / Media Skill

Photography base `.skill-card`:
- numbered icon
- title/body
- two soft tags
- no mandatory image in base renderer

후속 media enrichment는 사진/영상 자료를 붙일 수 있음.

Block Lab `media-rail/skill`:
- image-first 카드

판정:
- **두 역할을 억지 통합하지 않음**.
- text skill card는 `process` 또는 별도 compact knowledge card와 가까움.
- media-enriched skill은 `media-rail/skill`로 유지.

다음 검토에서:
- base skill card를 `comparison/feature`에 흡수할지
- `media-rail/skill`의 media optional mode로 만들지
결정 필요.

현재 상태: `needs-design-review`.

---

## 07. Portfolio Case

Photography `.case-card`:
- image top
- category eyebrow
- project title/description
- numbered deliverable list

Block Lab `case-study-rail/project`:
- 같은 정보 구조를 이미 가짐.

판정:
- **기존 variant 유지 + photography Style preset**

후보 preset:
- media ratio / card radius / numbered deliverables / standard density.

실제 고객/자체 기획 상태 badge는 generic schema에서 별도로 유지.

---

## 08. Product Tool Card

Photography `.product-card`:
- clean white product image stage with `object-fit:contain`
- kind/title/one-line role
- price/budget
- strong external commerce action

Block Lab `product-tool/rail`:
- image/kind/title/price/description/tags/source
- generic action field가 아직 약함.

판정:
- **기존 `rail` 고도화 + action contract 추가**
- 새 structural variant는 현재 단계에서 불필요.

Style preset 후보:
- `사진 장비 · white product stage`

주의:
- Naver Shopping 같은 commerce provider는 photography content/action data이지 Block type 하드코딩이 아님.

---

## 09. Product Detail Rows

Photography `.product-table/.product-row`:
- one grouped outer surface
- rows separated by 1px line
- title/reason
- soft tags
- budget aligned separately

Block Lab `product-tool/list`:
- 같은 목적.

판정:
- **기존 `list` 고도화 + photography Style preset**

최근 모바일 image 없는 list bug 수정도 이 generic variant에 적용됨.

---

## 10. Offer / Pricing

Photography `.offer-card`:
- label
- title
- large price
- description/list
- rail card

Block Lab `offer-rail/cards`:
- 거의 동일한 정보 구조.

판정:
- **기존 variant + photography Style preset**

---

## 11. Revenue Roadmap / Phase

Photography `.phase-card`:
- period
- large profit target
- inner 2-cell metric grid: revenue / average ticket
- action paragraph
- independent horizontal cards

Block Lab `roadmap/phases`:
- connected progression line
- each phase has outcome + action

둘은 같은 데이터라도 시각적 역할이 다름.

판정:
- **advanced variant 필요**
- 제안 id: `metric-cards`

`phases`는 흐름 읽기에 강하고,
`metric-cards`는 각 기간의 숫자를 빠르게 비교할 때 사용.

둘 다 유지할 가치가 있음.

---

## 12. Script / Copy

Photography:
- group card
- situation + channel/time/purpose metadata
- copy button
- message-bubble surface

Block Lab `script-copy/messages`:
- 거의 같은 역할과 구조.

판정:
- **기존 variant + photography Style preset**

메시지 bubble 꼬리 모서리 같은 표현은 style preset/primitive로 처리.

---

## 13. Tutorial Preview

Photography `.lesson-preview`:
- image
- number
- title
- one-line description

Block Lab `tutorial/preview-rail`:
- 동일 역할.

판정:
- **기존 variant + photography Style preset**

---

## 14. Preset / Recipe Card

Photography `.preset-card`:
- scene image
- situation number/title
- lens/magnification
- exposure starting point

Block Lab `tutorial/preset-rail`:
- 이미 generic preset/recipe 역할을 갖도록 설계됨.

판정:
- **기존 variant + photography Style preset**

`렌즈`, `노출` 필드는 photography pack content schema에 남고 generic Block은 `label/value/description`으로 받는다.

---

## 15. Tutorial Detail Lesson

Photography `.lesson`:
- large alternating page section, not a small card
- eyebrow/title/lead
- large 4:3 visual
- 3 instructional panels
- dark mission card
- optional caution/source link

Block Lab `tutorial/detail`:
- 같은 내러티브 구조를 이미 가짐.

판정:
- **기존 detail variant를 photography 수준으로 고도화**
- full-width alternating section surface는 Style preset 또는 outer page composition contract로 분리.

---

## 16. Source / Evidence Card

Photography `.source-card`:
- topic
- source/service
- memo
- external link

Block Lab `resources/official-list` 및 `curated-rail`:
- evidence와 curated 역할을 더 정확히 분리함.

판정:
- **현재 Block Lab 구조가 더 체계적**.
- photography source-card visual은 `curated-rail` Style preset 후보.
- 공식 evidence는 `official-list` 사용.

---

## 17. Guide Flow / Metrics / Callout

Photography `guideModule()`:
- flow/ranking
- metrics
- offer card
- warning
- callout
- prose

Block Lab에서 이미:
- process
- metric-grid
- offer-rail
- notice
- rich-text
로 분해 완료.

판정:
- **새 photography variant 불필요**.
- 기존 photography `group-card`와 dark/soft `guide-key`는 Style preset/primitive로 추출.

---

# 1차 advanced variant 결론

새로 만드는 것이 타당한 공통 advanced variant:

1. `hero / immersive-metrics`
2. `chapter-hero / image-overlay`
3. `comparison-cards / visual-metrics`
4. `roadmap / metric-cards`

새 variant 대신 기존 것을 고도화:

- comparison-cards / scored
- product-tool / rail
- product-tool / list
- case-study-rail / project
- offer-rail / cards
- script-copy / messages
- tutorial / preview-rail
- tutorial / preset-rail
- tutorial / detail
- resources

추가 디자인 검토 필요:
- base skill-card의 generic destination
- numbered checklist의 mini-card 방식 vs unified surface

# 다음 구현 순서

1. 위 4개 advanced variant를 Block Registry에 candidate로 추가.
2. Block Lab에서 photography reference specimen과 generic sample을 함께 표시.
3. 기존 photo UI에 가까운 Style preset을 저장 가능한 공식으로 추가.
4. 사용자 variant별 review.
5. 승인된 variant/preset만 Editor production library에 노출.

production photography renderer는 이 과정에서 변경하지 않는다.
