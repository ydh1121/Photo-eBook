# WO01 — research and foundation review

Status: deployed and verified, 2026-11-06.

## Delivered

- SNS subject at `/sns/`, using the existing source, navigation, collection, discovery and shared-module contracts.
- Real-estate reference rails with 11 detailed cases and 12 supplied profiles. The shared dialog distinguishes observed material, editorial interpretation, capture-time reactions, practice and source links.
- Canonical `reference-case-rail` and `content-detail-dialog` owners used by Library, Editor, Public and declared portable dependencies.
- Research covering 39 official sources and 14 distinct curricula, eighteen original volume blueprints with 420 substantive pages budgeted per volume, mobile-tool evidence criteria and reader/D1 designs.
- Original licensed skill sources and original research preserved in the private project record. No private Drive identifiers or uploaded media were added to this repository.

## Release evidence

| Item | Evidence |
| --- | --- |
| PR | [#59](https://github.com/ydh1121/Photo-eBook/pull/59) |
| Tested implementation | `9a2e6c493cc13d1402e0e0a836a9c3c55776357c` |
| Merge / deployed code | `b261ab21dba65b8cbb5876960c9cd27a55870a7c` |
| Production deployment | `eaf07711-7bc4-4bf4-a807-9932b39ea3f3`, success at 2026-11-06T09:12:00.831164Z |
| Candidate CI | Seven checks pass; [runtime run](https://github.com/ydh1121/Photo-eBook/actions/runs/42192469635) |
| Post-merge CI | Seven checks pass; [runtime run](https://github.com/ydh1121/Photo-eBook/actions/runs/42193189689) |
| Public/runtime fixtures | 69/69, no uncaught browser diagnostics |
| Reference-case contract and browser checks | 12/12 |
| Production common-module gate | 11/11; [live run](https://github.com/ydh1121/Photo-eBook/actions/runs/42193189662) |
| Additional live reports | Runtime feedback 14 checks, module families 9 checks, visual matrix 76 states |
| Content/static checks | 24,900 assertions; video discovery 58/58; opportunity discovery 79/79 |
| Source round trip | SNS 1,008 rows and real estate 2,128 rows, byte-identical restored snapshots |
| Production HTTP | Seven routes, two changed course snapshots and two new SNS WebP files match verified files |

The old generalization check assumed nine chapters for every course. The added real-estate case chapter correctly made ten. The runner now reads expected counts from the generated course manifest and includes SNS; the corrected candidate and live checks passed.

## Actual public-page observations

Manual inspection used connected Chrome at 375 × 812. SNS showed the correct title and nine chapters with no horizontal document overflow. The real-estate dialog fit inside the viewport, focused its heading, locked background scrolling and closed through Escape. Closing restored both the original trigger and the exact 8,216px reading position.

On SNS, the public recommendation list increased from 24 to 49 cards after scrolling to its end; all 49 watch URLs were distinct. The page merged bundled entries with current external metadata, so its visible count differed from the API-only observation of 17 items. Live counts are time-dependent. An earlier cached notice response displayed eight entries with a stale warning; a separate HTTP observation at 09:14 UTC found all four notice providers healthy and eight unique notices. Neither observation was substituted for the other.

Desktop/mobile candidate screenshots of the new hero, practice section and dialog were visually inspected. The two new SNS WebP files total 207,922 bytes; PNG masters and WebP derivatives remain in the private image folders. Existing image records and photography sources remain preserved.

## Remaining programme scope

WO01 does not deliver any regular 400-page textbook, the new common ebook reader, selection-to-question reader persistence, or D1 image serving. All eighteen manuscripts remain unproduced. Research covers publicly available contents, descriptions and curricula, not full access to paid books or course videos.

WO02 must reconcile the blueprint/specification's example identifiers, implement the reader, verify actual account plan/usage, enforce D1 budgets and exercise real sample chapters. Billing subscription access was unavailable during design; free-tier safety has not been certified and no paid plan or database was activated.

Automated browser fixtures verify bundled content and shared dependencies; they do not prove third-party availability or a new finished HTML/ZIP export product. Physical Android/Galaxy and Safari tests were not performed. Official help-page checks are not recorded as native app execution.
