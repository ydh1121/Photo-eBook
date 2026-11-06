# Current release review — 2026-11-06

A bounded independent read-only review found no additional release blocker in the inspected implementation. The corrected post-deploy checker matches the approved 14-module Library contract, shared learning rail consumers, restricted accordion/bottom-sheet consumers and photography's absence of all three portable primitives. Readiness waits for learning owner scripts so old production HTML cannot satisfy the new generation check.

The reviewed notice handling retains last successful data and never treats fetch failure as proof of closure. Local Dot viewing is cancelled; actual video analysis remains deferred to user-uploaded files.

The prepared source revision passes 15,504 static assertions, 40 video-parser checks, 77 official-notice checks, module boundaries, syntax, deterministic rebuilding and diff whitespace checks. Two edited native Sheets were fully read back with content/byte equality and 212 formula ranges verified. There are 45 chapters, 194 blocks and 48 source records.

Previous exact remote HEAD `f37fd524a5eb0cef9b2ccd66dab7207f0b158536` passed all seven checks and 57/57 runtime cases. The new source/image revision still requires its own CI, v3 page screenshots and actual production verification before release completion.

## Historical initial review

The dated pending statements below describe the initial review, not the later f37fd52 result or the current release checkpoint.

# Personal Edu V1 — code review

Reviewed: 2026-11-06
Branch: `feat/personal-edu-subjects-v1`
Baseline: `16669aca400a343d772680e47e08a2a48ca708e7`
Latest source inspection: `215ed05c25f4bd2fda4469e0f6f8695b959b0c05` plus the runtime-check working-tree updates
Review stage: pre-deployment review; latest runtime CI and mobile visual QA pending

## Verification status

| Evidence | Status at this checkpoint |
| --- | --- |
| Implementation and canonical ownership review | Completed by source inspection; the reported corrections below are visible in source. |
| Module boundary/dependency command | Passed when run by this reviewer. |
| Full Personal Edu static command | Passed when run by this reviewer against reviewed sources and generated output. |
| Runtime test design and selectors | Read-only review completed; the corrections in the runtime-review section are confirmed in source. |
| Latest `check-personal-edu-runtime.mjs` CI execution | **Pending.** Source review of the script is not a passing browser run. |
| Mobile image/layout inspection in the actual pages | **Pending.** File existence and valid WebP headers do not establish cropping, legibility or visual quality. |
| Production revision and deployed-page verification | **Pending.** This document does not claim a production deployment. |

## Scope and method

This review covers the new subject navigation, learning modules, shared bookmark adapter, content-pack loading, photography hero extraction, and their Library / Editor / Public consumer wiring.

Reviewed owners and adapters:

- `public/assets/js/platform-modules/learning-guide-v1.js`
- `public/assets/js/platform-modules/subject-navigation-v1.js`
- `public/assets/js/app/learning-pack-renderer.js`
- `public/assets/js/app/subject-navigation.js`
- `public/assets/js/core/content-bookmark-store.js`
- Changes in `app-shell.js`, `site-data-client.js`, `postload-enhancements.js`, `collection-hub-canonical-v1.js`, `photo-public-module-source-v1.js`, `public-snapshot/runtime-v2.js`, and the photography chapter renderer
- The new module CSS, owner-file declarations, and script/style wiring in Library, shared preview, Editor and the public entry point
- `scripts/check-personal-edu-runtime.mjs`, compared read-only with the actual collection, Editor and common-module DOM/runtime owners

The review used source inspection and comparison with the baseline and the canonical module dependency contract. The reviewer also ran `node scripts/check-platform-module-boundaries.mjs`; it exited with code 0 and reported `Canonical reusable UI module boundary and dependency graph contract passed.` The Personal Edu static checks described below also passed after the reviewed sources and generated routes became available. No browser session, automated browser test, accessibility-tree inspection, portable export execution, full CI run, or production verification was performed by this reviewer. Runtime verification belongs to the implementation workstream and must be recorded separately.

The files were being edited during review. “Confirmed in source” means the correction was visible in the working tree at the last read; it does not assert that a browser test passed. The older platform-library backlog is outside this review.

## Findings

### R1 — checklist updates could erase another chapter's progress

Priority: P1
Status: correction confirmed in source; runtime verification pending
Owner: `learning-guide-v1.js`, `hydrateSection()`

Each chapter originally read the same pack-level localStorage object once, then wrote its own stale copy. Checking an item in chapter B after chapter A could erase A's newly saved answer. This is a normal user sequence on a long guide page.

The change handler now rereads the latest stored object before setting its own field and writing the merged result. The key remains namespaced by pack as `personalEduPracticeV1:<packId>`.

Required verification: change a checkbox in two different chapters, reload, and confirm both remain checked. Repeat on a second subject and confirm its checklist is independent.

### R2 — saved source cards did not restore their bookmark state

Priority: P1
Status: correction confirmed in source; runtime verification pending
Owners: `learning-guide-v1.js`, `content-bookmark-store.js`, `collection-hub-canonical-v1.js`

The first implementation rendered every source button as unsaved and did not restore its state during hydration. A source already present in the collection could appear unsaved on revisit; the next click could therefore remove it unexpectedly.

The shared store now reads the existing article/video storage keys, and `hydrateSection()` restores button state and accessibility labels. Source IDs use `<packId>:<sourceId>`. The existing collection hub observes the shared change event, and its capture handler skips `.edu-bookmark` so the new module owns that click once. Library and Editor use an in-memory store, keeping preview interaction out of the reader's collection.

This is a compatible adapter to the existing collection data format, not a second saved-items system.

Required verification:

1. Save a source and confirm one article appears in `내 모음`.
2. Reload or leave for another subject and return; confirm the button remains selected.
3. Remove the item from `내 모음`; confirm the visible source button immediately becomes unselected.
4. Save two sources with the same source ID in different packs; confirm both survive independently.
5. Exercise a Library / Editor bookmark and confirm production localStorage is unchanged.

### R3 — approved modules were absent from non-page consumers

Priority: P1
Status: loader correction confirmed in source; consumer execution pending
Owners: Library / shared preview / Editor HTML and `public-snapshot/runtime-v2.js`

The initial approved definitions declared Library, Editor, Public and Export support, but only the public page loaded the new module files. That would leave other consumers unable to resolve the module IDs.

The working tree now includes the new owners in Library, the shared module preview, Editor and the public snapshot runtime. The public app calls the same registered render/hydrate functions used by those consumers; no separate preview implementation was introduced.

Required verification: insert and interact with all three new module IDs through Library → Editor → Public, and verify the declared owner/dependency set in an isolated export consumer. Script inclusion alone is not a passing consumer test.

### R4 — learning owner files omit layout and dark-theme dependencies

Priority: P2
Status: correction confirmed in source; standalone rendering pending
Owner: `learning-guide-v1.js`, `foundation` / `ownerFiles`

The initial module relied on styles present in the full application but absent from its declared asset set:

- `desktop/layout-hit-targets.css` supplies the wider desktop hero and four-column `.hero__facts` layout.
- `ui/progress-theme.css` supplies the dark values of `--ink`, `--text`, `--secondary`, and other shared tokens.

The new learning CSS sets dark card backgrounds but does not itself supply those dark text tokens. `core/tokens.css` only defines their light values. With the initial owner set, a standalone consumer could therefore have a different desktop hero and dark text on a dark learning card. Library's ambient application CSS can conceal both omissions.

Both style owners are now included in the shared `foundation` declaration for the hero and section. A portable export must obtain these assets through the owner/dependency closure; actual exported rendering still needs verification.

Required verification: render the hero and section without the photography page's full stylesheet, at desktop width and in a dark document. Confirm four desktop facts and readable card text.

### R5 — repeated module instances can duplicate DOM IDs

Priority: P2
Status: correction confirmed in source; repeated-instance runtime checks pending
Owners: `subject-navigation-v1.js`, `learning-guide-v1.js`, Editor block creation

The subject module's default `instanceId` and preview/editor fixture use fixed strings. Two inserted blocks can produce the same dialog, title and FAB IDs. The initial learning fixture likewise reused the `practice` section ID, and source lists introduced a fixed `curatedLinksRow` plus repeated source IDs.

Scoped event listeners reduce accidental cross-control behavior, but duplicate IDs still break the unambiguous `aria-controls` / `aria-labelledby` relationship and anchor targeting.

The working tree now marks both applicable definitions with `isolateInstances`, assigns `content.instanceId` in `freshModuleBlock()` and on variant changes, prefixes reusable section IDs when an instance is supplied, and removes the unnecessary resource/source DOM IDs. Public chapter IDs are preserved when no instance prefix is passed.

The follow-up inspection found one gap in `editor-app.js`, `bindInspector()`: the duplicate action initially assigned a new `copy.id` but retained the original `copy.content.instanceId`. The implementation now centralizes this in `duplicateBlock()`, which also assigns `copy.content.instanceId = copy.id` when the copied module declares `isolateInstances`. Both the block toolbar and inspector duplicate actions call that function; both paths were confirmed in source.

The checklist storage initially had the same missing reusable-instance scope. Two exported learning-section blocks could have different DOM IDs but the same `packId`, checklist ID and item text, sharing an answer after reload. The storage key now includes `props.instanceId` when present and retains the existing pack-level key for public guide sections without an explicit instance.

Required verification: both insert each module twice and duplicate it through the Editor's duplicate action. Confirm unique IDs, each FAB opens its own labelled dialog, checklist state remains independent after export/reload, and chapter links still address the intended public section after export.

### R6 — collection reference icon CSS belongs to the wrong owner

Priority: P2
Status: correction confirmed in source; standalone rendering pending
Owners: `photo-public-module-source-v1.js`, collection-owned CSS

The collection renderer now represents new text-only sources with `.collection-reference-icon`, but the initial CSS for that markup lives in `learning-guide-v1.css`. A collection-only consumer does not necessarily include the learning module's owner files, so the icon's presentation is not portable with its markup owner.

The icon rules now live in `styles/collection/hub.css`, a collection-owned stylesheet, rather than in the learning stylesheet.

The new icon is `aria-hidden`, and the surrounding thumbnail link initially had no accessible name. The renderer now provides a title-based `aria-label` on that link.

Required verification: render the collection as a standalone module with a saved source lacking a thumbnail. Confirm its icon layout and the thumbnail link's accessible name.

### R7 — undefined text color token

Priority: P2
Status: correction confirmed in source
Owner: `learning-guide-v1.css`

The first learning stylesheet used `--muted`, which is not a repository token. Those references now use the existing `--secondary` token. Dark-token availability remains the separate R4 issue.

### R8 — history restoration could retain an outdated source bookmark

Priority: P2
Status: event-wiring correction confirmed in source; browser reproduction and latest CI pending
Owner: `learning-guide-v1.js`, `hydrateSection()`

Source inspection identified this sequence: save a source in subject A, navigate to subject B, remove A's source through B's collection, then return to A with browser Back. If A is restored from the back-forward cache, its existing DOM survives. The initial learning hydration listened only to the same document's bookmark-change event, so the collection count could update while A's source button retained its previous selected state. This was a code-path finding, not a browser reproduction by this reviewer.

Persistent Public / Export consumers now call `syncBookmarks()` on `pageshow`, and the cleanup removes that listener. The runtime script now removes the other subject's saved source before navigating Back and compares the count with the restored button's `aria-pressed` state. It also records `pageshow.persisted` so a normal document navigation is not misreported as an exercised back-forward-cache restoration.

Required verification: run that sequence, inspect the recorded history-restoration mode, and confirm the button, count and collection agree. Merely enabling the browser's cache does not prove that a particular navigation used it.

## Confirmed design boundaries

- The photography hero now calls the canonical hero renderer with the same title, subtitle, image, labels and values. The source diff does not change the photography chapter navigation owner.
- Section composition resolves through the active pack's ordered section definitions. The photography pack retains its existing section IDs and order.
- New static subject snapshots return directly from the bundled-data path; they do not request photography live data as the normal loading path.
- Existing bookmark storage keys are retained. New checklist storage and source identifiers include the subject ID.
- The subject bar is placed in the hero. The picker is a separate control whose positioning reads the existing collection FAB; it does not replace the chapter bar.
- The subject picker uses a native dialog, labelled heading, close button, Escape/close release, and focus restoration. These are implementation observations, not an accessibility certification.
- Links and author-supplied text pass through URL filtering and escaping in the new learning renderer. New internal related links remain rooted subject routes and chapter anchors.
- The source publisher now uses the scoped `.edu-source-publisher` class and matching learning CSS, avoiding the existing `.curated-platform` positioning rules. New bookmarks still obtain publisher metadata directly from the source record.

## Focused runtime acceptance checks

Run these after the source corrections and generated routes are present:

| Area | Acceptance check |
| --- | --- |
| Photography | Compare desktop and mobile hero, section order, sticky chapter navigation and existing collection behavior with the baseline. |
| Six routes | Open each URL directly and reload it. Confirm the correct pack, selected subject and chapter anchors; no photography fallback on a new subject. |
| Subject navigation | Scroll the hero out of view. Open the separate subject FAB, use keyboard navigation, Escape and the close button, then confirm focus and scrolling recover. |
| Floating controls | Confirm picker and collection FABs do not overlap at mobile/desktop widths, with and without existing saved items. |
| Checklist | Persist changes across two chapters and reload; verify independence across two subjects. |
| Saved resources | Save, reload, select the article tab, remove from the collection, and verify UI/count consistency. Also remove A's item while on B, return with Back, and record whether BFCache was actually used. |
| Templates | Verify clipboard success feedback and the selectable-text fallback when clipboard access is denied. |
| Multiple blocks | Insert two instances and use the Editor duplicate action for both new modules; inspect ID uniqueness and dialog relationships. |
| Canonical consumers | Exercise the same registered module in Library, Editor, Public snapshot and an isolated declared-dependency fixture, including the source-card bookmark fixture. Keep actual JSON export/import distinct from the dependency fixture. |
| Styles | Test standalone declared assets, desktop hero layout, dark colors, narrow tables and visible keyboard focus. |
| Mobile images | Inspect the generated hero and practice images inside the actual narrow pages for cropping, subject visibility, text contrast, spacing and unexpected overflow. |

The default learning preview still contains checklist and template blocks without a source-card fixture. The public-resource checks exercise source bookmarks, but Library / Editor bookmark-store isolation needs explicit source-card test props before it can be reported as tested. This is a coverage limit, not an observed storage failure.

## Personal Edu static validation

Owner: `scripts/check-personal-edu.mjs`
Execution date: 2026-11-06

Commands and observed results:

| Command | Actual result |
| --- | --- |
| `node scripts/check-personal-edu.mjs --drafts <authoring-directory>` | Passed; the command explicitly reports that generated routes, images, snapshots and manifest are skipped in this mode. |
| `node scripts/check-personal-edu.mjs` | Passed with exit code 0 against the reviewed repository sources and generated files. |

The full run verified five courses, 45 chapters, 192 blocks, 48 source records and 46 structured content links. It invoked the canonical renderer for all 45 chapters. The chapter/block totals are fixed V1 acceptance counts to detect truncated source or build output, not content-size targets for future versions.

The validator checks:

- Required course/chapter metadata, unique IDs, complete tables, unique checklist items, template content, source references and supported renderer block types.
- Official source URL syntax, HTTPS, the reviewed host set and source-check dates. It does not make network requests or claim that a linked course is currently open.
- Rooted subject links and actual target chapter anchors, including links back to photography.
- Targeted publication guards for private household details, personal identifiers and guaranteed-income wording. These remain supplementary to editorial review.
- Canonical module registration, consumer support, owner-file existence and chapter rendering without duplicate DOM IDs.
- Reviewed JSON to generated JSON/JS agreement, navigation order, pack identity/cache namespace, source-byte hashes and manifest counts.
- Direct-route HTML metadata, selected pack, script presence/order, local asset existence, zoom settings and removal of photography pack scripts from new subjects.
- The ten assigned image slots, AI disclosure in alternative text and valid WebP file headers.
- All 20 photography pack files against baseline `16669aca400a343d772680e47e08a2a48ca708e7`. Only the hero adapter may differ; the rest of its file must match. The old and new hero render the same normalized markup for default and explicit content fixtures. The existing chapter-navigation and liquid-controller owners also match the baseline.

Eight negative cases were injected into memory without changing repository files: a missing source reference, unsupported block type, broken cross-subject anchor, household disclosure, income guarantee, HTTP source URL, truncated course and photography-data drift. Every case produced the expected validation failure. No browser interaction or network availability result is implied by these checks.

## Read-only runtime-test review

Owner: `scripts/check-personal-edu-runtime.mjs`
Review date: 2026-11-06
Execution status: latest runtime CI **pending**; this reviewer inspected code and did not execute the browser suite

The review compared the test selectors and steps with the canonical collection renderer, collection hub, Editor app, persistent admin workspace, admin utility menus and module-frame bridge. The article-tab selector, count badge ID, source-card selector and saved-item removal selector match the current implementation. The Editor test uses the actual module-add controls and toolbar duplicate action, then the existing JSON export/import controls.

| Runtime-review finding | Correction confirmed in source | Execution status |
| --- | --- | --- |
| Editor export was clicked inside a closed More menu. | `openEditorUtility()` opens the real `details.admin-utility-menu` before export and import. | Pending latest runtime CI. |
| A failed export click could leave an unobserved download promise. | Download waiting and the button click are grouped in `Promise.all()`. | Pending latest runtime CI. |
| An article-tab click could pass while the collection remained on All, because both views contained the same one article. | The test now waits for the article tab's `is-active` state before checking saved content. | Pending latest runtime CI. |
| Editor readiness could match default preview DOM before the frame bridge applied the actual block props. | `editorFrames()` checks the expected instance namespace; learning sections must also report hydration. Imported blocks use the IDs from the actual export. | Pending latest runtime CI. |
| A navigation failure could leave a modal open and contaminate later checks. | The route is reopened and readied after a navigation failure; an unsuccessful recovery skips later checks for that route. | Pending latest runtime CI. |
| The initial cross-subject round trip never changed A's source while viewing B. | The test now deletes A's entry in B, checks the remaining count, returns to A and checks the restored button. The implementation's `pageshow` fix is recorded in R8. | Pending latest runtime CI, including the observed restoration mode. |

The runtime script removes only Playwright's default back-forward-cache disabling argument and records whether the browser actually used BFCache. A successful normal document-navigation result must not be described as a reproduced BFCache pass.

The script also contains a clipboard comparison against the visible template text and a declared-dependency fixture built from Registry provenance. These are source-confirmed test paths whose execution remains pending. The dependency fixture copies canonical owners and referenced images and mounts the actual exported block props in isolation; it is a QA fixture, not an HTML/ZIP export product. The existing Editor JSON download/import is tested separately.

## Release checkpoint

All concrete implementation and runtime-test design issues listed in this review have source corrections. The module boundary/dependency command and full Personal Edu static validation have recorded passing runs. **The latest runtime CI and mobile image/layout inspection remain pending.** Browser interaction, the isolated dependency fixture, HTTP route behavior and production revision verification must be recorded from their actual results before closing this review as a release record.
