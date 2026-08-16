# 10. Core / Chapter Hero / Market Prompt Library

모든 프롬프트에는 `00-global-rules.md`와 `01-photo-industry-rules.md`가 선행 적용된다.

---

## IMG-001 — `hero-main`

- 맥락: 메인 문구는 `사진으로 먹고살기: 첫 12개월`. 국비 실무와 현장 경험으로 배우고, 필요한 장비만 사고, 포트폴리오와 영업을 병행해 반복 B2B 5곳 이상과 월 순수익 300만 원을 목표로 한다.
- 역할: 사이트 전체 방향을 한 장에서 설명하는 현실적인 ‘사업형 사진가의 출발’.
- 출력: `/assets/images/generated/v1/hero/hero-main.webp`
- 비율/마스터: 3:2 / 1800×1200 이상
- crop: 사진가/카메라/핵심 세팅은 중앙 42% 폭 안에 유지. 하단 카피 영역은 복잡하지 않게.

Prompt:
> Create a realistic editorial hero photograph for a Korean mobile-first guide about building a commercial photography business during the first 12 months. Show a working photographer in a compact, believable studio preparing a paid commercial shoot: mirrorless camera on tripod, one softbox, tethered laptop with a non-readable image preview, a small product set, and a neatly packed camera bag. The scene should imply learning, shooting, delivery, and business discipline rather than luxury gear. Use natural neutral colors, controlled highlights, subtle depth, and a strong central subject that survives a narrow mobile crop. Keep the lower-middle region visually calm for white HTML headline overlays. Premium but grounded documentary-commercial realism.

Avoid:
> huge cinema crew, luxury studio fantasy, readable fake UI, fake logos, stacks of cash, graduation imagery, exaggerated bokeh, malformed hands, excessive gear.

---

## IMG-002 — `chapter-intro`

- 맥락: 사진을 배우는 순서와 돈 버는 순서는 다르다. 기본기를 배우는 동안 포트폴리오, 첫 상품, 영업 준비를 동시에 한다.
- 역할: ‘완벽해진 뒤 시작’이 아니라 배우면서 사업을 준비하는 태도.
- 출력: `/assets/images/generated/v1/chapter/intro.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Show a beginner commercial photographer at a modest Korean creator workspace building a practical launch plan while camera gear is ready beside a laptop. Include one mirrorless camera, one standard zoom, a notebook with non-readable blocks, a simple sample product, and a small portfolio/contact-sheet style preview. The visual message is simultaneous learning, portfolio building, and first-sales preparation rather than waiting until mastery. Natural daylight, realistic proportions, understated commercial-editorial style, central subject placement, lower area calm enough for chapter overlay copy.

Avoid:
> classroom graduation symbols, diploma, piles of textbooks, generic handshake imagery, expensive gear walls, startup cliché sticky-note overload.

---

## IMG-003 — `chapter-market`

- 맥락: 단가만 보지 않고 반복 주문과 한 번의 촬영을 여러 납품물로 확장하기 쉬운 분야를 먼저 고른다.
- 역할: 커머스 콘텐츠의 반복 생산 구조를 보여주는 시장 챕터 대표 이미지.
- 출력: `/assets/images/generated/v1/chapter/market.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Create a polished but believable small-brand commercial product photography scene in Korea. Center a beauty or consumer product on a clean set, with one softbox producing controlled reflections, a mirrorless camera tethered to a laptop, and several non-readable image thumbnails suggesting multiple deliverables for product page, social, and ads. The scene should communicate repeatable content production and commercial usefulness rather than one artistic hero shot. Neutral color, realistic studio scale, tidy working environment, subject centered for mobile crop.

Avoid:
> generic shopping scene, warehouse, unreadable e-commerce text, floating objects, luxury campaign fantasy, impossible product reflections.

---

## IMG-004 — `chapter-education`

- 맥락: 학위보다 국비 실무학원, 현장 어시스턴트, 멘토링처럼 촬영·조명·보정·납품을 직접 연습하는 경로를 우선한다.
- 역할: hands-on 실습이 교육 ROI가 높다는 점을 보여줌.
- 출력: `/assets/images/generated/v1/chapter/education.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Show a hands-on commercial photography training session in a modest Korean studio. An instructor adjusts the angle of a softbox while a learner operates a mirrorless camera aimed at a tabletop product; a tethered monitor shows a generic non-readable image preview. The emphasis is active feedback, light shaping, camera handling, and real workflow. Limit the scene to two or three people, use credible equipment, soft neutral light, and a practical training atmosphere instead of academic symbolism.

Avoid:
> lecture hall, graduation cap, diploma, crowded classroom, chalkboard text, generic online-learning laptop scene.

---

## IMG-005 — `chapter-skills`

- 맥락: 상업사진은 촬영뿐 아니라 인물/제품/공간 보정, RAW 셀렉, 대량 기본보정, 테더, 파일 정리와 빠른 납품까지 중요하다.
- 역할: 촬영과 후반작업이 하나의 반복 가능한 workflow라는 것을 보여줌.
- 출력: `/assets/images/generated/v1/chapter/skills.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Create a realistic commercial photography workflow scene with a photographer at a calibrated-looking monitor editing a coherent portrait/product series while a camera and tether cable remain on the adjacent work surface. The screen should show one large photograph and a strip of thumbnails with generic non-readable controls. Include a pen tablet and external SSD to suggest retouching, batch selection, backup, and delivery speed. Restrained desk lighting, natural colors, serious professional atmosphere, realistic small-studio scale.

Avoid:
> copied Adobe UI, readable folders, cyberpunk lighting, gaming setup, giant multi-monitor command center, CGI-looking desk.

---

## IMG-006 — `chapter-portfolio`

- 맥락: 예쁜 사진 모음보다 문제→촬영→납품물까지 실제 의뢰처럼 보이는 프로젝트 12개가 중요하다.
- 역할: 고객이 ‘이 사람이 우리 일을 해낼 수 있다’고 판단하는 deliverable 중심 포트폴리오.
- 출력: `/assets/images/generated/v1/chapter/portfolio.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Show a photographer and a small-business client reviewing one coherent commercial project on a laptop and a few printed proof sheets. The visible images should belong to the same project family—for example a product hero image, a vertical social crop, and a detail shot—without readable text. Camera gear sits nearby but is secondary. The mood communicates usable deliverables, project structure, and client confidence rather than an art-school critique. Clean meeting table, natural window light, realistic Korean small-business context.

Avoid:
> random unrelated photos, gallery wall, fashion mood board, fake readable deck text, corporate boardroom handshake cliché.

---

## IMG-007 — `chapter-gear`

- 맥락: 처음부터 풀세트를 사지 않고 중고 바디, 표준줌, 기본 조명, 저장·백업부터 준비하며 매출 후 추가한다.
- 역할: ‘매출이 장비를 사게 한다’는 최소 장비 원칙.
- 출력: `/assets/images/generated/v1/chapter/gear.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Create a realistic top-down/three-quarter editorial photograph of a lean commercial-photography starter kit on a clean neutral table: one mirrorless body, one standard zoom, compact strobe, a reflector or folded modifier edge, two SD cards, spare battery, and an external SSD. The kit should feel intentionally minimal, practical, and business-minded, with ample breathing room and accurate scale. No exact product model text is needed in this chapter image. Soft daylight, neutral commercial styling.

Avoid:
> five camera bodies, giant telephoto lenses, cinema rigs, drones, luxury leather flat-lay styling, fake logos, impossible accessory combinations.

---

## IMG-008 — `chapter-plan`

- 맥락: 0~1개월 순이익 50만에서 7~12개월 300만+까지 객단가와 반복 고객을 높이고 월매출 500만 원 안팎 구조를 만든다.
- 역할: 촬영 건수보다 고객 파이프라인·객단가·반복 계약을 관리하는 사업 계획.
- 출력: `/assets/images/generated/v1/chapter/plan.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Show a commercial photographer planning a 12-month client pipeline at a desk after a shoot. Include a laptop with abstract non-readable calendar and graph shapes, a paper planner with no legible figures, a camera placed off to one side, blank invoice-like sheets, and color-coded project cards. The emphasis is disciplined scheduling, repeat clients, increasing project value, and operational planning—not investment trading. Clean realistic freelancer workspace, neutral evening/daylight mix, controlled composition.

Avoid:
> stock-market candlesticks, cryptocurrency, stacks of cash, readable financial figures, accountant office cliché, celebratory money imagery.

---

## IMG-009 — `chapter-scripts`

- 맥락: 첫 제안, 견적, 후속 연락, 재구매 일정, 가격 인상, 월 계약 전환까지 짧고 구체적인 고객 커뮤니케이션이 필요하다.
- 역할: 사진가가 실제 고객에게 제안하고 관계를 이어가는 현실적인 장면.
- 출력: `/assets/images/generated/v1/chapter/scripts.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Create a realistic freelance commercial photographer sending a concise client proposal from a smartphone and laptop at a studio desk. A camera bag and a small portfolio sample sit nearby; the phone screen contains only abstract message bubbles with no readable text. The photographer looks focused and professional, not aggressively sales-oriented. Korean freelancer/small-business environment, natural light, clean composition, subtle sense of ongoing client relationship and follow-up work.

Avoid:
> call-center headset, aggressive sales pose, fake readable chat messages, handshake, generic corporate conference room.

---

## IMG-010 — `chapter-iphone`

- 맥락: 카메라가 없어도 아이폰으로 초점, 노출, 거리, 빛, 렌즈 배율, 야간, 접사, 기본 보정을 오늘부터 연습한다.
- 역할: 스마트폰이 ‘대체 카메라’가 아니라 촬영 기본기를 연습하는 도구라는 점.
- 출력: `/assets/images/generated/v1/chapter/iphone.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Show a beginner practicing intentional photography with a modern smartphone in a simple Korean urban environment. The person holds the phone steadily with both hands and composes a small clear subject using deliberate distance, side light, and straight lines. The phone screen may show the live scene but no readable UI. The image should feel instructional and observational rather than influencer lifestyle advertising. Natural daylight, realistic phone proportions, clean central composition.

Avoid:
> selfie, influencer pose, fake iOS text, extreme filters, impossible camera modules, generic person simply holding a phone.

---

## IMG-011 — `chapter-sources`

- 맥락: 교육 지원, 직업정보, 장비 사양, iPhone 기능은 실제 신청·구매 시 공식 자료를 다시 확인한다.
- 역할: 믿을 만한 출처를 확인하고 판단하는 리서치 장면.
- 출력: `/assets/images/generated/v1/chapter/sources.webp`
- 비율/마스터: 3:2 / 1600×1067 이상

Prompt:
> Create a realistic research desk for a working photographer comparing trustworthy source material before making a decision. Show a laptop with several non-readable documentation/specification page layouts, a camera manual booklet, a camera or lens nearby, notebook, and phone. The visual message is verification and reference checking rather than casual browsing. Clean neutral desk, daylight, restrained professional mood, central arrangement suitable for chapter cover crop.

Avoid:
> readable brand/spec text, random news site, social media feed, generic library bookshelves, academic study cliché.

---

## IMG-012 — `market-product-commerce`

- 맥락: 제품/쇼핑몰/브랜드 촬영은 신상품, 시즌, 상세페이지, SNS, 광고 때문에 반복 주문이 생기기 쉽다. 사진 장수보다 누끼·연출·세로·썸네일을 묶어 판다.
- 역할: 실제 판매에 바로 쓰는 커머스 결과물.
- 출력: `/assets/images/generated/v1/market/product-commerce.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Create a high-quality commercial product photograph for a small Korean beauty or e-commerce brand. One cosmetic bottle or skincare package is the unmistakable hero, photographed on a clean warm-white/beige set with controlled softbox highlights, realistic material texture, accurate contact shadow, and one restrained prop for scale. The image should feel immediately usable for a product page or social crop, emphasizing color accuracy and repeatable studio quality rather than artistic abstraction.

Avoid:
> fake readable labels, malformed packaging, excessive flowers, luxury perfume fantasy, floating objects, impossible reflections.

---

## IMG-013 — `market-corporate-profile`

- 맥락: 대표, 의사, 변호사, 강사, 임직원처럼 ‘사업에 필요한 사람 사진’을 한 번의 출장으로 여러 명 촬영하는 시장.
- 역할: 홈페이지/PR에 바로 쓰는 신뢰감 있는 프로필 결과.
- 출력: `/assets/images/generated/v1/market/corporate-profile.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Create a realistic professional portrait in a modern Korean office or clinic environment. Show one business professional from chest-up with a natural expression, simple wardrobe, soft key light, realistic skin texture, and subtle background separation. The photograph should look suitable for a company website, press release, or profile page and should be easy to reproduce consistently for multiple employees. Neutral color, controlled highlights, practical commercial portrait quality.

Avoid:
> fashion editorial pose, plastic beauty skin, dramatic colored light, fake clinic/company logos, celebrity styling, exaggerated bokeh.

---

## IMG-014 — `market-food-space`

- 맥락: 음식/매장/공간 B2B는 식당, 카페, 병원, 숙소 등에 출장해 대표 메뉴, 배달앱, 공간, SNS 세로 이미지를 묶어 제안한다.
- 역할: 스튜디오 없이 현장에서 만들 수 있는 메뉴+매장 결과.
- 출력: `/assets/images/generated/v1/market/food-space.webp`
- 비율/마스터: 3:2 / 1200×800 이상

Prompt:
> Create a realistic commercial café or restaurant photograph in a Korean small-business setting. The foreground hero is a well-presented signature dish or drink under soft side window light; the background softly reveals the actual café interior, making it clear this is on-location B2B work. Natural food texture, restrained styling, believable highlights, clean framing that could support delivery-app and social-media usage.

Avoid:
> unnaturally glossy food, luxury fine-dining cliché, fake menu text, empty generic stock café, excessive props, oversaturated color.
