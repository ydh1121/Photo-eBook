# 30. iPhone Lesson / Preset Prompt Library

모든 프롬프트에는 `00-global-rules.md`와 `01-photo-industry-rules.md`가 선행 적용된다.

레슨 이미지는 `lesson-preview`와 큰 `lesson__visual`에서 같은 자산을 공유하므로 4:3 master를 만들고, 중앙 피사체가 3:2 preview crop에서도 살아남아야 한다.

---

## IMG-030 — `iphone-lesson-setup`

- 맥락: 격자·수평계·노출 유지·4:3·렌즈 청소를 확인하고 테스트 3장을 찍는다.
- 역할: 촬영 전에 막을 수 있는 실수를 줄이는 준비 행동.
- 출력: `/assets/images/generated/v1/iphone/lessons/setup.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a close realistic preparation scene before smartphone photography. A person gently cleans the phone camera lenses with a microfiber cloth, then holds the phone level toward a simple scene containing clear horizontal and vertical lines. A small notebook or camera pouch may sit nearby. The screen may show the live scene but no readable UI. Bright natural light, practical instructional feeling, accurate phone proportions, visible care for lens cleanliness and level composition.

Avoid:
> fake iOS menu text, dirty/broken phone, selfie pose, exaggerated gadgets, UI screenshots as the focal point.

---

## IMG-031 — `iphone-lesson-focus`

- 맥락: 중요한 피사체를 탭하고 밝은 부분을 확인해 필요하면 노출을 낮추며, 필요 시 AE/AF 고정 후 연속 3컷.
- 역할: 초점 위치와 하이라이트 보호를 행동으로 보여줌.
- 출력: `/assets/images/generated/v1/iphone/lessons/focus.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a person photographing a subject near a bright window with a smartphone. One finger deliberately taps the important subject on the screen while the composition includes a bright highlight area that must remain controlled. The phone screen shows the scene only, not readable UI text. Natural side light, realistic exposure, visible relationship between subject and bright background, instructional close-up of hands and phone.

Avoid:
> fake exposure numbers, fake iOS labels, completely blown white window, malformed fingers, generic phone-holding pose.

---

## IMG-032 — `iphone-lesson-lens`

- 맥락: 0.5x/1x/2x 배율보다 촬영 거리와 원근을 먼저 보고 같은 피사체를 비교한다. 0.5x 근접 얼굴과 가장자리 왜곡을 피한다.
- 역할: 디지털 줌이 아니라 실제 거리 이동이 원근을 바꾼다는 점.
- 출력: `/assets/images/generated/v1/iphone/lessons/lens.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Create an instructional smartphone-photography scene centered on perspective and working distance. Show one simple subject such as a person or bottle, positioned away from the frame edges, while the photographer physically changes distance rather than pinching digital zoom. Use environmental lines to make perspective understandable. The final scene should feel like a real practice exercise, with 1x-like natural perspective and no readable camera UI.

Avoid:
> distorted 0.5x close-up face, fake 0.5/1/2 interface text, impossible phone camera hardware, digital zoom pixelation used decoratively.

---

## IMG-033 — `iphone-lesson-portrait`

- 맥락: 1x 또는 지원 시 2x, 4:3, 창문을 30~60도 옆에 두고 인물과 배경을 1.5~2m 분리하며 눈높이에서 촬영.
- 역할: 창가에서 바로 따라할 수 있는 첫 프로필 세팅.
- 출력: `/assets/images/generated/v1/iphone/lessons/portrait.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a realistic smartphone portrait setup beside a large window in a Korean home or small office. A friend or professional stands about 1.5–2 meters from a simple background, body turned roughly 45 degrees, with soft side light across the face. The photographer holds the phone at eye level from a flattering distance. Natural skin texture, clear separation between subject and background, simple achievable setup.

Avoid:
> 0.5x close-up face distortion, ceiling-only lighting, plastic skin, fashion pose, fake portrait-mode labels, excessive fake bokeh.

---

## IMG-034 — `iphone-lesson-product`

- 맥락: 창문 옆 테이블, 천장등 끄기, 먼지 제거, 1x, 측면광 + 흰 폼보드 반사, 전체/45도/디테일 촬영.
- 역할: 창문과 흰 반사판만으로 만드는 첫 제품/음식 세팅.
- 출력: `/assets/images/generated/v1/iphone/lessons/product.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a beginner-friendly smartphone product setup on a table beside a window. One cosmetic bottle or beverage is lit by side window light at about 45 degrees; a plain white foam board on the opposite side acts as reflector. Ceiling lights are visually absent. The photographer frames from a sensible 1x-like distance. Clean product surface, controlled highlight, simple home setup that a beginner can reproduce.

Avoid:
> studio strobes, mixed colored lights, cluttered props, fake phone UI text, dirty product, luxury campaign set.

---

## IMG-035 — `iphone-lesson-night`

- 맥락: 가능하면 1x, 밝은 간판에 맞춰 노출을 낮추고 벽/난간에 팔을 고정하며 셔터 후 바로 움직이지 않는다.
- 역할: 야간에서 흔들림과 강한 광원을 통제하는 행동.
- 출력: `/assets/images/generated/v1/iphone/lessons/night.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a realistic night-street smartphone shooting scene in a Korean urban alley. The photographer braces forearms against a wall or railing while framing a lit storefront sign and a person silhouette. Highlights retain detail and the sky remains naturally dark. Use believable street light, stable posture, 1x-like perspective, crisp documentary realism, no need for visible UI.

Avoid:
> turning night into daylight, extreme neon teal/magenta, motion-blurred hands, fake Night Mode text, distorted ultra-wide look.

---

## IMG-036 — `iphone-lesson-macro`

- 맥락: 최소 초점거리를 먼저 찾고 충분한 빛을 확보하며 카메라 그림자를 피하고 필요하면 조금 물러난 뒤 크롭.
- 역할: 무조건 가까이 붙는 것이 아니라 초점거리와 빛을 찾는 접사 행동.
- 출력: `/assets/images/generated/v1/iphone/lessons/macro.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a smartphone photographing a small object such as a watch detail, coin, or cosmetic label near a bright window. The phone is close but not touching the object; the photographer adjusts the angle so the phone casts no shadow across the subject. Fine texture is visibly crisp without relying on readable generated text. Natural light, stable hands, realistic depth of field, clear sense of minimum focusing distance.

Avoid:
> phone lens touching the object, fake macro UI, microscope-level magnification, impossible depth of field, invented readable brand text.

---

## IMG-037 — `iphone-lesson-edit`

- 맥락: 수평/크롭, 노출, 하이라이트, 그림자, 색 균형, 생동감, 선명도를 60초 안에 가볍게 조정한다. 망한 사진을 과보정해 살리는 단계가 아니다.
- 역할: 자연스러운 기본 보정 행동.
- 출력: `/assets/images/generated/v1/iphone/lessons/edit.webp`
- 비율/마스터: 4:3 / 1400×1050 이상

Prompt:
> Show a smartphone in hand editing a previously captured food or product photo. The screen displays the image large with only generic non-readable adjustment controls; the edited photograph looks natural, with controlled highlights, balanced shadows, and restrained color. The environment is a simple table near the original shooting scene, implying a quick 60-second cleanup rather than rescue editing. Realistic screen reflection and finger placement.

Avoid:
> exact Apple UI reproduction, readable slider labels, extreme saturation, HDR halo, heavy filters, dramatic before/after split.

---

# 상황별 프리셋 결과 이미지

프리셋 카드는 ‘촬영하는 모습’보다 사용자가 목표로 삼을 **결과 사진의 상태**를 우선한다.

## IMG-038 — `iphone-preset-day-outdoor`

- 맥락: 낮 야외 스냅 / 1x / 4:3 / 0~-0.3 / 주피사체 탭 / 측면광·그늘 / 수평 안정.
- 출력: `/assets/images/generated/v1/iphone/presets/day-outdoor.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create a clean daytime urban snapshot that looks like a well-executed smartphone photograph. One clear subject is placed in open shade or soft side light, with straight horizon and verticals, protected highlights, natural color, 1x-like perspective, and a simple readable composition. Use a plausible Korean street or park setting. This is the target result a beginner should aim for, not a photo of someone using a phone.

Avoid:
> harsh blown noon highlights, extreme HDR, telephoto compression, heavy filter, tilted horizon, cinematic color grade.

---

## IMG-039 — `iphone-preset-window-portrait`

- 맥락: 창가 프로필 / 1x·2x / -0.3 전후 / 창문 30~60도 측면 / 배경 1.5~2m 분리.
- 출력: `/assets/images/generated/v1/iphone/presets/window-portrait.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create a natural professional-looking portrait beside a window, photographed with smartphone-like perspective from a flattering distance. Soft side light around 45 degrees, realistic skin, clean catchlights, and a simple background with enough subject separation but no extreme artificial blur. Korean home or small-office environment, calm trustworthy expression, natural color.

Avoid:
> beauty-ad skin, dramatic strobe, 0.5x distortion, fake bokeh edges, overexposed skin, influencer pose.

---

## IMG-040 — `iphone-preset-cafe-food`

- 맥락: 카페 음식 / 1x / -0.3 전후 / 대표 메뉴 탭 / 창문 측면광 / 45도·탑뷰.
- 출력: `/assets/images/generated/v1/iphone/presets/cafe-food.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create an appetizing but realistic smartphone-style café food photograph under soft side window light. A signature dish or drink is the clear subject, plate or glass highlights remain detailed, background props are minimal, and food texture stays natural. Use a clean 45-degree viewpoint with stable geometry. The result should look achievable by a beginner using good light rather than a professional food-styling crew.

Avoid:
> oversaturation, fake steam, studio-flash look, cluttered props, blown plate highlights, glossy artificial food.

---

## IMG-041 — `iphone-preset-small-product`

- 맥락: 소형 제품 / 1x·디테일 2x / -0.3~-0.7 / 로고·라벨 탭 / 창문 45도 + 흰 반사판.
- 출력: `/assets/images/generated/v1/iphone/presets/small-product.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create a clean smartphone-style photograph of one small cosmetic or consumer product on a neutral tabletop. Side window light at about 45 degrees and a white reflector create controlled shadow and a readable shape. The product is clean, positioned away from wide-angle frame edges, and shows natural material texture. The image should look like a realistic commerce-practice result without luxury campaign styling.

Avoid:
> readable invented brand labels, mixed colored light, visible dust, distorted bottle geometry, floating product, excessive props.

---

## IMG-042 — `iphone-preset-night-street`

- 맥락: 야간 거리 / 1x / -0.3~-1.0 / 밝은 간판·사람 탭 / 난간 지지 / 셔터 후 유지.
- 출력: `/assets/images/generated/v1/iphone/presets/night-street.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create a realistic smartphone-style night street photograph with one lit storefront/sign area, a human silhouette or passerby, and controlled highlight detail. Deep shadows remain naturally dark; composition is stable and crisp, with 1x-like perspective and subtle pavement reflection only if plausible. Korean urban night atmosphere without cinematic exaggeration.

Avoid:
> night turned into daylight, extreme neon teal/magenta, full-frame motion blur, pure-white clipped signs, fantasy cyberpunk city.

---

## IMG-043 — `iphone-preset-macro`

- 맥락: 접사 / 지원 Macro 또는 1x 후 크롭 / 밝은 자연광 / 최소초점거리 확보.
- 출력: `/assets/images/generated/v1/iphone/presets/macro.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create a bright natural-light close-up of a small everyday object such as watch texture, coin relief, fabric detail, or cosmetic packaging surface, photographed with smartphone-like depth of field. Fine texture is crisp, the nearest important area is in focus, the background falls softly away, and no phone shadow covers the subject. Clean composition, believable scale.

Avoid:
> microscope magnification, impossible razor-thin focus, fake readable brand text, oversharpening halos, dark direct-flash look.

---

## IMG-044 — `iphone-preset-golden-hour`

- 맥락: 골든아워 인물 / 1x·2x / -0.3~-0.7 / 얼굴 탭 / 해를 옆·뒤 45도 / 얼굴 반사광 위치 찾기.
- 출력: `/assets/images/generated/v1/iphone/presets/golden-hour.webp`
- 비율/마스터: 16:9 / 1280×720 이상

Prompt:
> Create a realistic smartphone-style golden-hour portrait outdoors. Warm low sun sits about 45 degrees behind or beside the subject while soft reflected ambient light keeps the face visible and natural. Sky detail remains intact, skin is not overly orange, framing is simple and stable, and perspective resembles 1x or modest 2x use. Use a plausible Korean park or quiet urban setting.

Avoid:
> fully silhouetted face, blown sky, orange social-media filter, dramatic studio rim light, excessive artificial lens flare.
