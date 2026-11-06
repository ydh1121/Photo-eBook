# Textbook publication and static image delivery

## Storage decision — 2026-11-07 KST

The user clarified that the earlier D1 image instruction reflected unfamiliarity with Cloudflare's products, and requested a better structure for this project. That instruction supersedes the former D1-only image-origin requirement. The user also supplied a Workers plan screen showing **Free / Current plan**. The earlier plan-unknown checkpoint is historical; do not request the same proof again or treat a failed Billing API read as a current blocker.

The public textbooks use **the existing Cloudflare Pages project for reader code, catalog, page JSON and precompressed WebP**. Google Drive preserves reviewed manuscripts and image masters. No database, paid image transformation, hosted video service or additional subscription is required for this publication path. This is a storage change, not a change to preserved manuscripts or reader anchors.

| Content or feature | Current owner | Later change, only when needed |
| --- | --- | --- |
| Reviewed JSON/Markdown originals, PNG/SVG masters, review PDFs | Private project Drive folders | Preserve new editions and receipt history |
| Reader, catalog, page JSON, optimized WebP | Existing Pages static paths | Chapter-sized JSON bundles if file count becomes tight |
| Reading position and saved quotations/questions | This browser's local storage | Authenticated synchronization can use a dedicated D1 database |
| Large downloads or frequent file uploads | Drive links as appropriate | Dedicated project R2 with an explicitly verified cost policy |
| On-demand image conversion or adaptive hosted video | Not used | Evaluate Images/Stream separately if the product needs those features |

Other projects' databases, R2 buckets and subscriptions are not publication targets. CODE1/Order remains read-only.

## Source and edition contract

Course-page CMS copy remains owned by its native source Sheet. Textbooks have a separate structured publication source: one reviewed JSON manuscript and a readable Markdown companion per book/edition, preserved in the project's private Drive folders. Copy a source into `content/ebooks/v1/sources/` only after downloading the complete stored file and comparing every byte. `source-provenance.json` records the verified SHA-256 without private folder or file identifiers.

`node scripts/build-ebooks.mjs` validates the canonical reader model, semantic IDs, consecutive authored page numbers, unique explanatory paragraphs, real image dimensions and HTTPS sources. It compiles exact UTF-8 page bytes and records each SHA-256 in the manifest. Cover and contents do not count as body pages. A regular `published` edition needs at least 400 authored body pages; this automated lower bound does not replace editorial review, exercise execution or visual pagination QA.

WO02 has three `sample` editions, each with 24 body pages. All use `sample-20261106-v1`. They do not count toward the 18 regular volumes. The shared bookmark workshop is explicitly fictional and not an actual recruitment offer. App-menu evidence distinguishes official documentation from physical Android execution; the latter has not been completed.

Subject-page reader links are generated from the publication catalog and rendered by the canonical `learning-guide-hero` owner. They are optional route UI metadata, separate from native-Sheet course copy. Library, Editor and public use the current site's `readerUrl`; portable consumers use the explicit HTTPS `publishedUrl` in a new tab because a standalone hero does not contain a complete reader/book package. Sample entries explicitly say “샘플” and show the authored body-page count.

## Canonical images and static routes

Thirteen reviewed visuals comprise five imagegen photographs and eight original teaching diagrams. Approved PNG originals and diagram SVG sources are preserved privately; `scripts/image/png-to-webp.py` creates the delivery WebP. The thirteen files total 1,309,798 bytes. The largest is 295,480 bytes. `assets.json` and `visual-provenance.json` carry exact hashes and dimensions. Repository seeds are outside `public/`.

The builder copies those exact bytes to `/assets/ebooks/v1/<sha256>.webp`. Manifests refer to immutable filenames. Changing an image URL does not rewrite manuscript page JSON, page hashes, book/edition IDs or saved quotation anchors. Hash-named assets receive a one-year immutable cache policy. Catalogs and manifests are revalidated; they do not inherit immutable caching.

`public/_routes.json` excludes `/assets/*`, `/books/*`, `/reader` and `/reader/*` from Pages Functions. The static delivery path must remain excluded. Serving a cached response from inside a Function is a different architecture and would consume Function invocations.

Questions and reading positions remain on the current browser/device. No saved question is sent to the server. Clearing browser data can remove these records. The reader's export/import controls provide a transferable backup of questions; they do not synchronize reading positions. No automatic cross-device synchronization is claimed.

## Free-tier publication budget

Primary references checked for this decision:

- [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/): static requests that do not invoke Functions are free and unlimited; Functions use the combined Workers request allowance.
- [Pages limits](https://developers.cloudflare.com/pages/platform/limits/): Free has 20,000 files per site, 25 MiB per file and 500 builds per month.
- [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/): exclude static routes explicitly when using Functions.
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/): Standard free allowances are monthly; usage beyond them can be billed.
- [Budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/): an alert does not cap or stop usage.
- [Images pricing](https://developers.cloudflare.com/images/pricing/) and [Stream pricing](https://developers.cloudflare.com/stream/pricing/): free transformation allowances do not make all hosted-image and hosted-video operations free.

Every publication inventories the entire generated `public/` tree, including retained editions and the review adapter. `scripts/ebook/static-publication-budget.mjs` checks the 20,000-file and 25 MiB individual-file limits, with warnings at 90 percent. The existing reader limits remain 256 KiB per manifest and 512 KiB per page. WebP has a project delivery budget of 1,500,000 bytes per image, independent of database limits. The measured report is kept under `artifacts/ebook-qa/`, outside the deployment.

Do not infer free-tier compliance from the image total alone, and do not put large master images or full-length source videos in the Pages deployment. No unsupported aggregate GB cap is invented for Pages. Build frequency is an account-level monthly allowance and must also remain within the Free limit.

The programme targets 18 × 420 = 7,560 authored body pages. File projections must state image-count and retained-edition assumptions. The user's permission to create as many teaching images as needed is not a guarantee that unlimited files fit one deployment. As capacity approaches the release budget, preserve all originals and use chapter bundles, shared deduplicated images or an explicitly assessed storage extension. Do not enable a paid plan to make a publication pass.

Existing discovery APIs still consume their existing Function allowance. Static textbook delivery adds no D1 rows or R2 operations and does not consume that allowance when routing remains excluded. This does not claim to cap unrelated account traffic or every other project.

## Review, portability and verification

`node scripts/build-ebook-review.mjs` produces the labelled review/offline adapter under `/staging/ebook-reader-preview/`. It copies Registry-declared owner files, embeds exact page JSON strings and maps image IDs to the same reviewed WebP bytes included in that bundle. It has no alternate reader implementation.

The local preview server serves committed static files and does not need SQLite, Cloudflare bindings or account credentials. Local HTTP results and browser fixtures are development evidence. Before release, verify actual Cloudflare candidate and production responses, image SHA-256 values, static cache headers and common reader interactions.

Run both builders, `check-ebook-assets.mjs`, `check-ebook-reader.mjs --runtime`, `check-ebook-samples.mjs --runtime`, Personal Edu source checks and the canonical module-boundary gate. The sample check loads all 72 actual pages at mobile width, verifies served image bytes, cover/contents/page numbers, external-link targets, image decoding, overflow and last-position restoration. Reader fixtures exercise quotation storage, Unicode anchors, failure preservation and the Library → Editor → Public → portable pipeline.

PDF exports are separate fixed-page review artifacts: cover, contents and 24 numbered body pages. The WO02 review PDFs use A4 to preserve authored text, tables and diagrams. This does not finalize the trim size of regular volumes.

## Superseded D1 prototype

The earlier guarded D1 BLOB publisher, SQLite migration and daily budget-attestation design were never activated in this Pages project. They are preserved in Git history and private checkpoint evidence. Static delivery supersedes them; a daily D1 proof or database import is no longer a WO02 release condition. Historical SQLite test results must not be relabelled as current static or remote production evidence.
