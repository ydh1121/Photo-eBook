# Reference case rail and content detail dialog

## Canonical ownership

`reference-case-rail` composes `horizontal-rail` and `content-detail-dialog` through `PlatformModuleRegistry.renderDependency()` / `hydrateDependency()`. Both dependencies are required composition dependencies. The horizontal rail retains its existing touch scrolling, mouse dragging, and click suppression after dragging. The parent does not implement a second scroller or modal lifecycle.

Both new modules are approved for `library`, `editor`, `public`, and `export`. Their renderers, hydration functions, and styles are shared by all four consumers. The unrelated generic `bottom-sheet` remains unavailable to Public.

| Module | Canonical JavaScript | Canonical stylesheet |
| --- | --- | --- |
| `reference-case-rail` | `public/assets/js/platform-modules/reference-case-rail-v1.js` | `public/assets/styles/components/reference-case-rail-v1.css` |
| `content-detail-dialog` | `public/assets/js/platform-modules/content-detail-dialog-v1.js` | `public/assets/styles/components/content-detail-dialog-v1.css` |

The photography entry does not load these modules eagerly. Learning pages load them through the subject builder. Library, shared module preview, Editor, and Public Snapshot load the same owners. Portable consumers resolve their ordered files with `assetFiles('reference-case-rail', 'export')` and bootstrap the Registry first.

## Case rail props

```json
{
  "instanceId": "case-list-example",
  "title": "콘텐츠 사례",
  "description": "카드를 눌러 촬영 구성과 연습 방법을 읽어보세요.",
  "items": [
    {
      "id": "case-example",
      "kind": "analysis",
      "title": "사례 제목",
      "kicker": "사례 분류",
      "summary": "카드에서 읽을 짧은 설명",
      "evidenceLabel": "관찰 범위",
      "observedAt": "2026-11-06",
      "tags": ["촬영", "편집"],
      "sections": [
        {
          "title": "장면 구성",
          "body": ["문단 1", "문단 2"],
          "bullets": ["비교할 내용"],
          "links": [{"label": "출처", "url": "https://example.org/"}]
        }
      ],
      "exercise": {
        "title": "직접 해볼 과제",
        "steps": ["첫 번째 행동", "두 번째 행동"],
        "output": "완성할 결과물"
      }
    }
  ]
}
```

`kind` is `analysis` or `profile`. Optional fields are `creator`, `image`, `imageAlt`, `url`, `profileUrl`, and `metrics: [{label, value, note}]`. Public source validation owns evidence accuracy; the renderer does not infer view counts, source identity, or analysis completion. A profile reference can omit performance metrics and exercise content. A supplied image is not replaced with a fabricated capture; cards without an image use a decorative number and pattern.

Duplicate and empty item IDs are excluded. Source strings are escaped, and executable URLs are rejected. External source links open in a new tab with `noopener noreferrer`. Detailed sections remain out of the DOM until a card opens. Only the selected card's detail is rendered.

The rail hydration API is:

```js
mount.api.open(itemId, optionalTriggerElement);
mount.api.close();
mount.api.isOpen();
mount.cleanup();
```

A containing learning section must exclude descendants of `reference-case-rail` from its generic horizontal-rail hydration loop. The case owner hydrates and cleans up both of its children. It must not hydrate an existing child twice.

## Standalone dialog props and API

```js
const props = {
  instanceId: 'detail-example',
  item: selectedCase,
  launchLabel: '상세 내용 보기'
};
const mount = registry.mount(host, 'content-detail-dialog', props, {consumer: 'public'});
```

When composed inside another module, use `{instanceId, launcher:false}`. The parent opens the dialog through its canonical hydration API:

```js
mount.api.open(selectedCase, triggerElement);
mount.api.close('button');
mount.api.isOpen();
mount.api.getItemId();
mount.cleanup();
```

The native `dialog.showModal()` top layer provides modal isolation. The owner handles Escape, deliberate outside pointer clicks, SVG close buttons, keyboard focus wrapping, opener restoration, and background scroll restoration. The body is a separately focusable scrolling region. Header and footer remain outside that scroller. The shared lock tracks multiple open instances so closing one does not unlock another.

Runtime DOM IDs are unique within the document, even if source instances reuse the same label. Editor persistence must still assign independent `instanceId` values to duplicated blocks. No annotation or reading state is persisted by these modules.

The bubbling event `platform-content-detail-state` has `{open, itemId, reason}`. It reports the visible state and does not submit analytics or external requests. Cleanup closes an open dialog, releases its lock, removes owned listeners, and supports clean rehydration.

## Verification

- `node scripts/check-reference-cases.mjs`: consumer and dependency contracts, canonical asset existence, escaping, item deduplication, deferred detail rendering, entrypoint boundaries.
- `node scripts/check-reference-cases.mjs --runtime`: short mobile layout, native modal state, selected content, source links, keyboard loop, Escape/outside close, reading-position restoration, canonical dragging, instance isolation, nested lock release, cleanup/rehydration, portable dependencies, Public Snapshot, actual Library and Editor insertion/preview/export.
- `node scripts/check-platform-module-boundaries.mjs`: permanent ownership boundary.
- The existing Library family/visual inventory includes both new module IDs. No new style setting is exposed without a canonical implementation.

Browser output is written to `artifacts/reference-cases/`. A runtime check requires a Playwright Chromium binary. An unavailable browser is a failed runner, not a passing interaction check.
