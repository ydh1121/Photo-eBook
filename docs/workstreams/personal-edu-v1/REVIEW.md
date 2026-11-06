# Personal Edu V1 — code review

Reviewed: 2026-11-06
Branch: `feat/personal-edu-subjects-v1`
Baseline: `16669aca400a343d772680e47e08a2a48ca708e7`
Review stage: implementation working tree; not a release sign-off

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

Required verification: insert and interact with both new module IDs through Library → Editor → Public, and verify a portable export includes the owner files and runtime behavior. Script inclusion alone is not a passing consumer test.

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
| Saved resources | Save, reload, navigate between subjects, remove from the collection, and verify both UI and stored records remain consistent. |
| Templates | Verify clipboard success feedback and the selectable-text fallback when clipboard access is denied. |
| Multiple blocks | Insert two instances and use the Editor duplicate action for both new modules; inspect ID uniqueness and dialog relationships. |
| Canonical consumers | Exercise the same registered module in Library, Editor, Public snapshot and portable export, including the source-card bookmark fixture. |
| Styles | Test standalone declared assets, desktop hero layout, dark colors, narrow tables and visible keyboard focus. |

The default learning preview originally covered only checklist and template blocks. Add a source card to the preview or provide explicit test props so the new bookmark/store interaction is actually exercised by consumer tests.

## Review conclusion

All concrete source defects listed above have source corrections, including the Editor duplicate action and reusable checklist storage scope. The static module boundary/dependency check and full Personal Edu static validation passed. Browser behavior, portable export execution, HTTP route behavior, screenshots and full CI remain unverified by this reviewer. The implementation owner should append the actual runtime verification results and final revision before treating this document as a completed release record.

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
