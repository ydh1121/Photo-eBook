# Photography Parity — Device Handoff Accordion V1

상태: `extracted / not yet production-rebound`

이 기능은 일반 FAQ accordion과 다른 interaction capability다.

## Owners

JS:
- `assets/js/collection/device-handoff.js`
- compatibility bridge: `assets/js/collection/device-handoff-compat.js`

CSS:
- `assets/styles/collection/device-handoff-layout.css`
- `assets/styles/collection/device-accordion.css`
- `assets/styles/collection/device-accordion-state.css`
- `assets/styles/collection/device-accordion-fallback.css`

## Structural rule

Outer owner:
- `.collection-device-accordion`

Trigger:
- `#collectionDeviceLink[data-device-safe-v2="true"]`

Panel:
- `.collection-device-panel-v2`

핵심 원칙:
- outer accordion 하나만 radius/border/surface를 소유한다.
- trigger가 별도 rounded card를 그리지 않는다.
- 열렸을 때 closed card 안에 또 card가 남는 nested-shell 형태를 금지한다.

## Outer surface

Light:
- border: `rgba(28,40,65,.055)`
- radius: `18px`
- background: `#fff`
- text: `#292b30`

Dark:
- surface: `#171b21` family
- text: `#f2f4f8`
- line: `rgba(255,255,255,.085)`

## Chevron

- closed: `0deg`
- open: `90deg`
- transition: `.24s cubic-bezier(.22,.74,.24,1)`

## Panel animation

Closed paint:
- max-height `0`
- horizontal padding `14px`, vertical `0`
- opacity `0`
- translateY `-8px`
- hidden / pointer-events none

Open fallback CSS:
- max-height `330px`
- padding `14px`
- opacity `1`
- translateY `0`

Open timings:
- max-height `.36s cubic-bezier(.22,.74,.24,1)`
- padding `.30s cubic-bezier(.22,.74,.24,1)`
- opacity `.22s ease .04s`
- transform `.32s cubic-bezier(.22,.74,.24,1)`

Close timings:
- max-height `.34s`
- padding `.28s`
- opacity `.20s`
- transform `.30s`

## Measured-height JS behavior

`device-handoff.js` does not rely only on hardcoded 330px.

Runtime:
1. panel is mounted persistently.
2. closed height = 0.
3. opening measures actual `scrollHeight`.
4. height animates to measured value.
5. ResizeObserver/window resize can recompute expanded height.
6. `transitionend` stabilizes the final expanded height.

따라서 Dashboard capability의 `heightMode=measured`는 photography preset에서 locked invariant로 유지한다.

## Actions inside panel

- current device code display
- copy code button
- divider
- other-device code input
- connect button
- status/error message

Current geometry examples:
- copy action min-height `34px`
- code input height `40px`
- connect min-height `40px`
- control radius around `10–11px`

## Accessibility / state

JS maintains:
- trigger `aria-expanded`
- panel `aria-hidden`
- panel `inert` while collapsed when supported
- keyboard Enter/Space activation
- text input/copy/connect remain real controls

## Capability controls

Easy:
- enabled
- response: calm / standard / lively
- copy action
- connect action
- status message

Locked for photography preset:
- persistent outer shell
- measured-height mode
- real control semantics

Advanced design preset may expose:
- radius
- divider strength
- surface family
- open transform distance

그러나 FAQ Block variant와 합치지 않는다.
