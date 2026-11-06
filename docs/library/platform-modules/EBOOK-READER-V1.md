# Ebook reader v1

`ebook-reader` is the approved canonical reader for Library, Editor, published `ui-module` blocks and portable projects. Its runtime is independent of the photography page, admin previews, question drawer and asset storage provider.

## Owners and entry

- `public/assets/js/platform-modules/ebook-reader-model-v1.js`: publication validation, Unicode quote anchors and local persistence.
- `public/assets/js/platform-modules/ebook-reader-v1.js`: Registry `render()` / `hydrate()`, page loading, dialogs and every reading interaction.
- `public/assets/styles/components/ebook-reader-v1.css`: reader, print-independent authored page flow and dialog presentation.
- `public/reader/index.html` and `public/assets/js/reader/reader-entry-v1.js`: route framing and URL synchronization only.

The route is `/reader/?book=sns-entry&edition=sample-20261106-v1&page=<pageId>`. `page` is optional. The entry loads `/books/{bookId}/{editionId}/manifest.json`. The three initial book IDs are `sns-entry`, `video-entry`, and `ai-entry`. The initial edition ID is `sample-20261106-v1`. These identifiers do not change when a title changes.

The entry and Public Snapshot use `PlatformModuleRegistry` and `PlatformModuleStyleRuntime`. Library and Editor load the same owner files. The module declares no unused style controls and exports its model before its renderer. The route has no alternate reader markup.

## Publication contract

A manifest has `schemaVersion: 1`, stable `bookId` and `editionId`, `status` (`sample` or `published`), `subjectId`, `levelId`, `title`, optional `subtitle`, `editionLabel`, optional `cover`, `chapters`, and `pages`.

```json
{
  "schemaVersion": 1,
  "bookId": "sns-entry",
  "editionId": "sample-20261106-v1",
  "status": "sample",
  "subjectId": "sns",
  "levelId": "entry",
  "title": "교재 제목",
  "editionLabel": "2026년 11월 샘플",
  "chapters": [{"chapterId": "sns-entry-purpose", "title": "게시물의 목적"}],
  "pages": [{
    "pageId": "sns-entry-purpose-reader",
    "pageNumber": 1,
    "chapterId": "sns-entry-purpose",
    "title": "독자 정하기",
    "src": "pages/sns-entry-purpose-reader.json",
    "contentHash": "64-character-lowercase-sha256-of-the-page-file"
  }]
}
```

`contentHash` is the SHA-256 of the page JSON file's exact UTF-8 response bytes, including any indentation and trailing newline. The page does not embed its own hash. The reader verifies the bytes before parsing or rendering and checks book, edition, page, chapter and authored page number against the manifest. An integrity failure leaves the prior location and saved questions intact.

Page files contain `schemaVersion`, `bookId`, `editionId`, `pageId`, `pageNumber`, `chapterId`, `title`, and `blocks`. Page and block IDs are permanent. `pageNumber` is an authored editorial number, independent of viewport height, font size and image loading. Cover and contents have no body page number. The reader calculates the displayed body page count from `manifest.pages.length` and labels samples explicitly.

Every block has a stable `blockId` and a `type`. Strings are escaped; arbitrary HTML is not accepted.

| Type | Body fields |
| --- | --- |
| `heading` | `text`, optional `level` (rendered as h3–h5 below the page title) |
| `paragraph` | `text` |
| `list` | `items: string[]`, optional `ordered`, `title` |
| `checklist` | `items: string[]`, optional `title`; reading checklist, not a completion tracker |
| `steps` | `items: {title?, text, output?}[]`, optional `title`, `output` |
| `callout` | `text`, optional `title`, `tone`; v1 uses one consistent callout appearance |
| `template` | `text`, optional `title`; plain text copy action |
| `table` | `columns: string[]`, `rows: string[][]`, optional `caption`, `title`; multiline cells preserved |
| `image` | `alt`, `width`, `height`, `src` or `assetId`, optional `caption`, `credit` |
| `exercise` | optional `title`, `goal`, `steps: string[]`, `expectedOutput`, `checks: string[]`, `solution: string`; solution opens in a native disclosure |
| `sources` | `items: {title, url, publisher?}[]`, optional `title` |

Source links open in a new tab with `noopener noreferrer`. Unsafe URL schemes are rejected. Images reserve their supplied dimensions, load lazily and open in the reader's native dialog at their original dimensions; its viewport can scroll in both directions. A separate original-image link opens a new tab. Browser zoom is not disabled. Failed image requests retain the alt text and show a reading-oriented message; the reader does not silently substitute another origin.

## Source adapters and portable content

The module accepts either `props.manifestUrl`, or `props.publication = {manifest, pages}`. In the latter, `pages` maps each page ID to its original JSON string or a page object. A string preserves the original byte hash. An object is serialized with `JSON.stringify`, and its manifest hash must match those serialized bytes.

Runtime adapters may be supplied through `context.readerAdapter`:

- `loadManifest(props)` returns a validated manifest candidate.
- `loadPage(descriptor, {manifest, signal})` returns raw JSON text, UTF-8 `Uint8Array` bytes or a page object.
- `resolveAsset(assetId, {manifest})` returns an image URL. Alternatively, `manifest.assets[assetId]` can be a URL or an object with `src`.

`props.baseUrl` supplies the base for inline resources. A fetched manifest's URL is the base for relative page and image paths. Explicit `src` values take precedence over asset adapters. The runtime has no hardcoded D1 endpoint or cloud-account dependency.

Portable projects use the same declared owner manifest and supply publication bytes and reachable image assets. The checked inline portable fixture is self-contained for its text. This module does not automatically turn a remote manifest URL into an offline book or copy a publication's image binaries during Editor JSON export. A publication bundler must include the original page bytes and assets when producing such an archive.

Only the current page is rendered. Page bytes are fetched on demand and the in-memory cache holds at most three pages. Limits are 256 KiB for a manifest, 512 KiB per page, and 2,000 page descriptors per book. These are request/validation bounds, not a claimed publication count.

## Questions and location persistence

The v1 storage prefix is `personalEduReaderV1.`. Its keys are separate from the photography question drawer and its historical limits. Each question is stored under its own UUID key; saving a question in another tab does not replace a shared question array. No oldest-record eviction or 100-question cap is applied.

Each question preserves `schemaVersion`, `id`, `bookId`, `editionId`, `pageId`, `pageNumberAtSave`, `contentHash`, a readable quote, `note`, `anchors`, `createdAt` and `updatedAt`. Each anchor contains a permanent `blockId`, a deterministic `partId` for the text within a composite block, `{exact, prefix, suffix}` quote context and `{start, end}` Unicode code-point offsets. A selection across text parts or blocks produces multiple anchors. The readable quote joins those exact parts with line breaks.

Selecting text keeps native selection/copy behavior. It enables a compact save action without opening a dialog. Only that explicit action opens the memo form. The user may save the quote without adding a memo, edit it later, delete it after an inline confirmation, and export or import questions as JSON. Exports include all books in this browser. Imports validate the whole file before writing and preserve existing IDs rather than overwriting their notes. A storage-full or denied-storage error leaves the current draft visible and does not report a successful save. Corrupt or unknown older records are preserved instead of being reset automatically.

Opening a saved question requires the same edition, a matching page content hash and a unique quote/context match. An offset alone is insufficient. The reader never maps a previous-edition quote onto new text. It retains the original quote and note and can show a previous-edition link through `props.editionLinks[editionId]` or `context.readerEditionUrl({bookId, editionId, pageId})`.

Reading position is stored under `position:{bookId}:{editionId}` as page ID, block ID, paragraph progress ratio, page hash and update time. Initialization resolves a saved page before saving any default. A missing saved page or changed same-edition content hash is preserved until the user explicitly chooses a page. New editions keep separate position keys. Position saves are debounced and flushed on `pagehide` and hidden visibility. Font and viewport changes restore the same paragraph rather than storing a scroll-pixel offset.

There is no account sync. Local browser data can be removed by the user or browser, so the interface offers question export and states where the data is stored. Import files are limited to 10 MiB; individual quotes to 100,000 characters and notes to 20,000 characters. A quota failure is visible and never triggers silent deletion.

## Accessibility and runtime lifecycle

The reader uses a labelled scrollable reading region, native buttons, heading hierarchy, accessible table headings, native `dialog`, native exercise disclosures and visible keyboard focus. Left/right arrow navigation applies only while focus is in the reading area and no selection or text input is active. Table scrolling, text selection and native copy retain their own keyboard behavior.

Dialogs trap Tab focus, close with Escape or an outside click, restore the opener and use reference-counted scroll locking. Reading tools stay outside the body scroll area; font and import/export tools open in a dialog so they do not cover or compress the body. The authored folio sits in its own footer. The module has no swipe-to-change-page handler and respects reduced motion.

`hydrate()` returns a cleanup function and API with `ready`, `navigate(pageId)`, `openQuestions()`, `getState()`, `exportQuestions()` and `savePosition()`. Cleanup aborts requests, clears timers, closes dialogs and detaches listeners. The `ebook-reader:navigate` and `ebook-reader:question-saved` events expose explicit integration hooks; the latter does not send a question anywhere by itself.

## Required verification

Run `node scripts/check-ebook-reader.mjs` for schema, exact-byte hashes, Unicode anchoring, more-than-100 question retention, import preservation and storage failure cases. Run `node scripts/check-ebook-reader.mjs --runtime` in a Chromium-enabled environment for real selection, reload, memo editing, file round trips, edition boundaries, mobile layout, native dialog focus and the actual Library → Editor → Public → portable pipeline. Also run `node scripts/check-platform-module-boundaries.mjs`.

Browser fixture verification and a person's physical mobile-device/menu practice are separate evidence. Neither a static pass nor a Chromium fixture implies that an Android app's current menus were executed on a phone.

## Local SQLite preview server

With Node 24, run `node scripts/ebook/preview-server.mjs --port 4173`. `PORT` supplies the default port; `--port 0` chooses an available one. The default bind address is `127.0.0.1`; `--host 0.0.0.0` supports an explicitly configured local preview forwarder. Open `/reader/?book=sns-entry&edition=sample-20261106-v1` on the printed server URL.

The server reads `content/ebooks/v1/assets.json`, verifies each repository-relative WebP source and seeds an in-memory, actual `node:sqlite` database through `publishEbookAssets`. Image requests use `createEbookAssetHandler` and the unchanged `/api/ebook-assets/{sha256}.webp` path. The production service's WebP integrity, ETag, request limit and method behavior are exercised; responses also carry `X-Ebook-Preview: local-sqlite`. Static files are limited to the real `public/` directory, including symlink resolution, with no directory listings or source-tree fallback.

This process creates its own synthetic local budget proof and does not read Cloudflare credentials, activate a remote D1 binding, change the production asset origin or establish an account's plan. `/__ebook-preview__/health` reports local seed/readback results without returning the synthetic proof. Process exit on SIGINT/SIGTERM closes the HTTP listener and SQLite connection.

CI can import `startPreviewServer` (also exported as `startEbookPreviewServer`) from `scripts/ebook/preview-server.mjs`, call it with `{port: 0, host: '127.0.0.1'}`, use either returned `baseUrl` or `url`, and always `await close()` in a `finally` block. Closing twice is safe. `node scripts/check-ebook-samples.mjs` verifies actual sample pages and image bytes through this server; `--runtime` adds the actual-sample viewport checks when Chromium is available. The explicit static review bundle is a separate preview consumer and does not demonstrate remote D1 activation.
