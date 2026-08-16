# 20. Skills / Portfolio / Gear Prompt Library

모든 프롬프트에는 `00-global-rules.md`와 `01-photo-industry-rules.md`가 선행 적용된다.

---

## IMG-015 — `skill-portrait-retouch`

- 맥락: 잡티 제거, Dodge & Burn, 피부톤 균일화, 잔머리 정리, 자연스러운 Liquify. 정밀 1장 15~30분, 대표 프로필 3장.
- 역할: 인물 리터칭을 ‘피부 뽀샤시’가 아니라 자연스러운 상업 보정으로 설명.
- 출력: `/assets/images/generated/v1/skills/portrait-retouch.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a professional retoucher working on a natural business portrait at a desktop monitor with a pen tablet. The screen contains one large realistic face and subtle generic retouching interface shapes, but no readable software text. Skin retains pores and believable texture; the retoucher is using a stylus for fine dodge-and-burn, blemish cleanup, and small hair corrections. Neutral calibrated-looking workspace, soft room light, restrained professional atmosphere, clear relationship between hand, tablet, and portrait.

Avoid:
> plastic skin, extreme before/after split face, readable Photoshop labels, beauty-ad glamour, neon gaming setup, malformed hands.

---

## IMG-016 — `skill-product-retouch`

- 맥락: Pen Tool 누끼, 마스크, 먼지/스크래치 제거, 반사 제거, 색상 일치. 누끼 기본컷 1장 5~10분, 누끼 3 + 연출 3.
- 역할: 제품 리터칭의 정밀함과 반복 작업성을 보여줌.
- 출력: `/assets/images/generated/v1/skills/product-retouch.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a product retoucher editing a cosmetic or small consumer product on a monitor. The main image is a clean bottle or package on white with crisp edges, believable reflections, and accurate material texture. Generic path or mask shapes may be visible but no readable UI text. Include a pen tablet and the real reference product on the desk to imply clipping, dust removal, reflection cleanup, and color matching. Bright neutral workspace, precision-focused commercial post-production.

Avoid:
> invented readable software UI, distorted product, floating clipping paths, dramatic campaign lighting, unrelated images, fake labels.

---

## IMG-017 — `skill-space-correction`

- 맥락: 수직/수평, 왜곡, 혼합광, 창밖 노출 합성, 물체 제거. 매장 20장, 20~30장 2시간 내.
- 역할: 공간사진 보정에서 수직선과 혼합광이 핵심이라는 점.
- 출력: `/assets/images/generated/v1/skills/space-correction.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show an interior-photography editing workstation with a clean Korean café or clinic interior image on screen. Architectural verticals are straight, window exposure is balanced, and mixed warm/cool lighting appears corrected. The monitor may contain generic adjustment panels without readable text. A wide-angle lens sits nearby. Natural neutral grading, realistic small-business interior, technical accuracy and workflow focus rather than architecture-magazine fantasy.

Avoid:
> wildly distorted ultra-wide perspective, HDR halos, surreal windows, readable software panels, luxury hotel imagery unrelated to small-business work.

---

## IMG-018 — `skill-raw-culling`

- 맥락: 노출/초점/표정 기준으로 RAW 200장을 20~30분 안에 1차 선별한다.
- 역할: 많은 유사 컷을 빠르게 판단하는 셀렉 작업.
- 출력: `/assets/images/generated/v1/skills/raw-culling.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a photographer rapidly reviewing a dense series of commercial-shoot thumbnails on a large monitor, with one selected frame enlarged and many similar frames in a contact-sheet or filmstrip layout. No readable filenames or software labels. The photographer uses keyboard shortcuts and a mouse, emphasizing quick decisions based on focus, exposure, and expression. Calm practical desk, realistic image series, neutral work lighting.

Avoid:
> random unrelated thumbnails, readable filenames, gaming visuals, a single-photo retouching scene, giant server-room setup.

---

## IMG-019 — `skill-batch-basic-edit`

- 맥락: WB, 노출, 렌즈, 마스크, Sync, Export preset. 30장 60분 내, 웹/인스타 규격별 출력.
- 역할: 한 촬영 세트를 일관되게 대량 처리하는 workflow.
- 출력: `/assets/images/generated/v1/skills/batch-basic-edit.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a monitor displaying a coherent set of 20–30 commercial images from the same shoot with consistent color and exposure, one image larger and a thumbnail filmstrip beneath. The editor is applying synchronized basic corrections across the series; interface elements remain generic and unreadable. Include keyboard, mouse, and external SSD. The scene must communicate repeatable batch processing and speed rather than detailed beauty retouching.

Avoid:
> wildly different photos, readable preset names, strong LUT colors, a single isolated image, fake export text.

---

## IMG-020 — `skill-tether-shooting`

- 맥락: 현장 모니터링, 파일명 규칙, 백업. 촬영 중 실시간으로 클라이언트 확인본을 만든다.
- 역할: 카메라와 노트북이 실제로 연결된 테더 촬영 workflow.
- 출력: `/assets/images/generated/v1/skills/tether-shooting.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a believable tethered commercial shoot: a mirrorless camera on tripod connected by a visible tether cable to a laptop beside the set, with one clean product or professional portrait being photographed. The laptop displays the current frame as a non-readable image preview; a client or assistant may be viewing from the side. One softbox, practical stands, tidy cables, realistic small-studio scale, clear camera-to-laptop connection.

Avoid:
> floating wireless cable, giant film crew, impossible rigging, readable capture-software text, cluttered unsafe stands, sci-fi gear.

---

## IMG-021 — `skill-portfolio-building`

- 맥락: 수료 전 12개 실전형 프로젝트를 ‘문제-촬영-납품물’ 형태로 구성한다.
- 역할: 무작위 예쁜 사진이 아니라 프로젝트 단위로 포트폴리오를 편집하는 장면.
- 출력: `/assets/images/generated/v1/skills/portfolio-building.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a photographer arranging a coherent commercial portfolio on a laptop and printed proof cards. Product, professional portrait, food, and interior categories appear as image thumbnails with no readable text, grouped as complete projects rather than a random gallery. Include a notebook and a few selected printed outputs. Natural daylight, restrained editorial style, clear sense of curation and structure.

Avoid:
> art-gallery wall, random mood-board collage, readable project names, fashion-magazine spread, excessive decorative prints.

---

## IMG-022 — `skill-delivery-process`

- 맥락: 견적-계약-촬영-셀렉-수정1회-최종납품을 보통 3영업일 안에 끝내는 프로세스. 고객 데이터 안전이 중요하다.
- 역할: 촬영 후 정리·백업·납품까지 이어지는 운영 장면.
- 출력: `/assets/images/generated/v1/skills/delivery-process.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a photographer at the end of a commercial job organizing final image delivery. A laptop shows a clean non-readable gallery/file-grid preview; two separate storage devices imply backup, camera cards sit in a small case, and a phone nearby suggests client communication. The composition communicates orderly handoff, revision control, and data safety rather than generic editing. Clean desk, practical neutral light, realistic freelancer workspace.

Avoid:
> readable folder names, cloud-service logos, piles of USB sticks, chaotic desk, handshake, delivery-truck metaphor.

---

## IMG-023 — `portfolio-product-brand`

- 맥락: 가상 향수/뷰티 브랜드. 누끼 3 + 연출 4 + 상세페이지 2 + SNS 4:5. 반사/색상/질감/활용성이 핵심.
- 역할: 한 브랜드 프로젝트의 완성 수준을 직접 보여줌.
- 출력: `/assets/images/generated/v1/portfolio/product-brand.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Create a polished but realistic beauty-brand product photograph using a small perfume or skincare package on a white-to-warm-beige seamless set. Controlled rectangular softbox reflections, accurate material texture, clean contact shadow, and one restrained styling element. The image should look like the hero output of a practical portfolio case that could also produce cutouts, detail-page crops, and 4:5 social assets. Premium but achievable small-brand commercial quality.

Avoid:
> readable fake labels, luxury fantasy set, excessive flowers, floating product, impossible glass reflections, surreal shadows.

---

## IMG-024 — `portfolio-professional-profile`

- 맥락: 대표/CEO 프로필. 홈페이지 2 + 보도자료 2 + SNS 2 + 가로 인터뷰. 자연스러운 피부톤, 신뢰감, 일관된 조명.
- 역할: 홈페이지와 PR에 바로 쓸 수 있는 전문직 프로필 결과.
- 출력: `/assets/images/generated/v1/portfolio/professional-profile.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Create a professional CEO or founder portrait in a contemporary Korean office. Natural confident expression, chest-up framing, soft directional key light, neutral background with subtle workplace context, realistic skin texture, and conservative color. The result should work for website, press release, social profile, and horizontal interview crops. Make it business-useful and repeatable, not fashion-oriented.

Avoid:
> luxury executive cliché, dramatic colored lights, plastic retouching, crossed-arm stock pose, fake company logos, celebrity styling.

---

## IMG-025 — `portfolio-food-store`

- 맥락: 레스토랑 대표메뉴. 대표메뉴 5 + 배달앱 5 + SNS 세로 5 + 공간 5. 식감·색감·메뉴 활용성이 핵심.
- 역할: 여러 채널로 확장할 수 있는 상업 음식 결과.
- 출력: `/assets/images/generated/v1/portfolio/food-store.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Create a commercial restaurant hero image of a signature Korean café or restaurant dish near soft side window light. Food texture must look natural and appetizing, plate highlights controlled, background props minimal, and a subtle hint of the actual venue visible. Frame the dish so the same shoot plausibly supports delivery-app thumbnails, menu use, and vertical social crops. Realistic styling and color, not a large food-production set.

Avoid:
> oversaturated food, fake steam, excessive props, fake menu text, luxury fine-dining fantasy, greasy artificial gloss.

---

## IMG-026 — `portfolio-studio-process`

- 맥락: 제품 촬영 작업환경. 테더 촬영 + 소프트박스 + 백업 + 클라이언트 확인. 현장 신뢰도와 재현 가능한 세팅.
- 역할: 결과뿐 아니라 작업 프로세스를 보여주는 메이킹 이미지.
- 출력: `/assets/images/generated/v1/portfolio/studio-process.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Show a clean behind-the-scenes product-photography setup suitable for a commercial portfolio case: one product table, mirrorless camera on tripod, softbox and reflector positioned plausibly, tethered laptop displaying the current frame, and an external SSD or backup drive. A client or assistant may review from the side. Tidy cables, realistic small-studio scale, clear sense of repeatable lighting and professional process.

Avoid:
> huge production crew, unsafe stands, readable capture software, excessive gear, cinematic smoke, impossible cable routing.

---

## IMG-027 — `gear-product-sony-a7-iii`

- source class: `reference_required`
- 맥락: Sony A7 III 중고를 초기 주력 바디로 사용. 풀프레임, 듀얼 슬롯, 초기 자본 효율이 이유.
- 역할: 제품을 정확히 식별하는 장비 카드.
- 출력: `/assets/images/generated/v1/gear/sony-a7-iii.webp`
- 비율/마스터: 1:1 / 1200×1200 이상
- 참조: 현재 데이터의 실제 Sony A7 III 제품 사진.

Reference-normalization instruction:
> Produce a clean factual product-card asset for the Sony A7 III body using a trustworthy visual reference. Preserve the exact body shape, lens mount, control layout, proportions, and authentic markings visible in the source. Normalize the background to a clean light neutral surface, retain realistic material texture, add only a subtle contact shadow, and keep the full body centered with 8–12% breathing room. This is a reference-preservation task, not free generative redesign.

Avoid:
> approximating from imagination, fake model name, extra buttons, altered body proportions, wrong mount, invented logo placement.

---

## IMG-028 — `gear-product-tamron-28-75-g2`

- source class: `reference_required`
- 맥락: Tamron 28-75mm F2.8 G2를 첫 표준줌으로 사용. 제품/인물/음식 출장까지 폭넓게 대응.
- 역할: 제품을 정확히 식별하는 장비 카드.
- 출력: `/assets/images/generated/v1/gear/tamron-28-75-g2.webp`
- 비율/마스터: 1:1 / 1200×1200 이상

Reference-normalization instruction:
> Produce a clean factual product-card asset for the Tamron 28-75mm F2.8 Di III VXD G2 for Sony E mount using a trustworthy visual reference. Preserve the exact barrel shape, focus/zoom rings, proportions, mount-side geometry, buttons or switches, and authentic markings visible in the source. Place the complete lens on a light neutral background with a subtle realistic contact shadow and generous whitespace. Do not redesign or beautify the hardware.

Avoid:
> invented switches, fake focal-length text, altered barrel proportions, wrong mount, generic camera-lens approximation.

---

## IMG-029 — `gear-product-sony-fe-85-f18`

- source class: `reference_required`
- 맥락: Sony FE 85mm F1.8은 프로필 매출이 발생한 뒤 추가하는 인물용 단렌즈.
- 역할: 제품을 정확히 식별하는 장비 카드.
- 출력: `/assets/images/generated/v1/gear/sony-fe-85-f18.webp`
- 비율/마스터: 1:1 / 1200×1200 이상

Reference-normalization instruction:
> Produce a clean factual product-card asset for the Sony FE 85mm F1.8 using a trustworthy visual reference. Preserve the exact lens body, focus ring, button/switch placement, proportions, mount details, and authentic markings visible in the source. Normalize to a clean light neutral background with a subtle contact shadow. Keep the entire lens centered and clearly identifiable with comfortable whitespace.

Avoid:
> imagined product details, fake model markings, extra switches, wrong lens hood/barrel geometry, generic 85mm lens substitution.
