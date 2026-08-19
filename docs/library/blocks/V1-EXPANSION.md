# V1 Block Expansion

기존 photography 페이지에서 추출한 17개 family에 여러 산업에서 반복적으로 필요한 10개 candidate를 추가한다.

현재 Block Lab 총 candidate: **27개**.

## 추가된 10개

### 18. `faq`
- 역할: 반복 질문과 짧은 답변
- semantic `<details>/<summary>` 사용
- editorialProfile: `faq`

### 19. `pros-cons`
- 역할: 하나의 선택지에서 장점과 감수할 조건을 같이 제시
- editorialProfile: `pros-cons`

### 20. `comparison-table`
- 역할: 선택지/비교축이 많아 card보다 표가 적합할 때 사용
- 모바일 x축은 native overflow
- editorialProfile: `comparison`

### 21. `timeline`
- 역할: 시점 자체가 중요한 절차, 일정, 경력, 제도 변화
- roadmap과 분리: roadmap은 목표 진행 단계, timeline은 시간/사건 순서
- editorialProfile: `timeline`

### 22. `image-copy-split`
- 역할: 한 장면/결과물/공간을 큰 이미지와 설명으로 함께 해석
- 장식 이미지만 필요한 경우 사용하지 않음
- editorialProfile: `rich-text`

### 23. `gallery`
- 역할: 서로 다른 정보 역할을 가진 여러 결과물 비교
- variants: `grid`, `strip`
- editorialProfile: `media-rail`

### 24. `quote-expert`
- 역할: 실제 인용이나 전문가 의견을 출처와 함께 표시
- AI가 존재하지 않는 인용을 생성하지 않음
- editorialProfile: `quote-expert`

### 25. `calculator`
- 역할: 사용자가 직접 값을 넣어 단순 계산/시뮬레이션
- candidate V1은 `multiply`, `sum`처럼 제한된 계산 template만 지원
- arbitrary JavaScript/formula 입력 금지
- editorialProfile: `calculator`

### 26. `cta`
- 역할: 페이지/섹션의 다음 행동
- primary action 1개를 먼저 보여주고 secondary는 시각적으로 낮춤
- editorialProfile: `cta`

### 27. `service-list`
- 역할: 교육기관, 도구, 플랫폼, 협력업체처럼 이미지보다 조건/설명이 중요한 목록
- 실제 업체 추천 시 최신성, 광고/제휴 여부, 출처 정책 추가 필요
- editorialProfile: `comparison`

## 기존 후보에서 추가하지 않은 것

### KPI / Stat
별도 block을 만들지 않는다.

기존 `metric-grid`가 같은 역할을 담당하며 variant와 schema 확장으로 해결한다.

### location / map
V1 candidate에서 보류한다.

이유:
- 지도 provider/API 계약 미정
- geocoding/주소 정확성 계약 필요
- 외부 요청/비용/개인정보 정책 필요
- 단순 위치 목록은 현재 `service-list`로 표현 가능

실제 산업 페이지에서 지도 필요성이 확인되면 provider architecture와 함께 별도 block으로 설계한다.

### service/business comparison
별도 `business-comparison` type을 만들지 않고 `service-list`와 `comparison-cards/table` 조합을 사용한다.

## 신규 block code

- `public/assets/js/blocks/block-renderers-extended.js`
- `public/assets/js/block-lab/lab-data-extended.js`
- `public/assets/js/block-lab/lab-interactions-extended.js`
- `public/assets/styles/block-lab/new-blocks-v2.css`

## 승인 전 조건

27개가 모두 production-approved라는 뜻이 아니다.

Block Lab에서 다음을 검토한다.

1. 정보 역할이 다른 block과 실제로 구분되는가
2. 같은 정보를 다른 block보다 더 읽기 쉽게 보여주는가
3. mobile 390 / tablet 768 / desktop 1180에서 구조가 유지되는가
4. light/dark hierarchy가 같은가
5. 표/rail/accordion interaction이 keyboard와 touch에서 자연스러운가
6. 사용 빈도가 매우 낮은 block을 유지할 가치가 있는가
7. block variant가 type 분리보다 적절한가

사용자 검토 후 `approved / merge / redesign / deprecated` 중 하나로 결정한다.
