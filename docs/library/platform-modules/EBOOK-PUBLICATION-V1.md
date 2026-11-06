# Textbook publication and D1 image delivery

## Source and edition contract

Course-page CMS copy remains owned by its native source Sheet. Textbooks have a separate structured publication source: one reviewed JSON manuscript and a readable Markdown companion per book/edition, preserved in the project's private Drive folders. Copy a source into `content/ebooks/v1/sources/` only after downloading the complete stored file and comparing every byte. `source-provenance.json` records the verified SHA-256 without private folder or file identifiers.

`node scripts/build-ebooks.mjs` validates the canonical reader model, semantic IDs, consecutive authored page numbers, unique explanatory paragraphs, real image dimensions and HTTPS sources. It compiles exact UTF-8 page bytes and records each SHA-256 in the manifest. Cover and contents do not count as body pages. A regular `published` edition needs at least 400 authored body pages; this automated lower bound does not replace editorial review, exercise execution or visual pagination QA.

WO02 has three `sample` editions, each with 24 body pages. All use `sample-20261106-v1`. They do not count toward the 18 regular volumes. The shared bookmark workshop is explicitly fictional and not an actual recruitment offer. App-menu evidence distinguishes official documentation from physical Android execution; the latter has not been completed.

## Canonical images

Thirteen reviewed visuals comprise five imagegen photographs and eight original teaching diagrams. Approved PNG originals and diagram SVG sources are preserved privately; `scripts/image/png-to-webp.py` creates the delivery WebP. The thirteen files total 1,309,798 bytes. The largest is 295,480 bytes. `assets.json` and `visual-provenance.json` carry exact hashes and dimensions. Repository seeds are outside `public/`.

The production manifest maps assets to `/api/ebook-assets/<sha256>.webp`. Text, manifests and reader code are static paths excluded from Pages Functions. Questions and reading positions use browser storage rather than D1 writes. No user question is sent to the server.

`migrations/ebook-assets/0001-assets.sql` creates a dedicated immutable-image table and a daily request counter. It must be applied only to this project's dedicated D1 database after account verification. Existing databases belonging to other projects are not publication targets.

## Free allowance gate

Official references, checked 2026-11-06:

- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [D1 binding type conversion](https://developers.cloudflare.com/d1/worker-api/)
- [D1 metrics](https://developers.cloudflare.com/d1/observability/metrics-analytics/)

Free D1 allows 500 MB per database and 5 GB across the account; rows/BLOBs are limited to 2 MB. D1 Free daily row allowances and the combined Workers/Pages Functions request allowance are separate budgets. Cache API hits still invoke a Function. A Paid account must not be inferred to have Free-style cost hard stops merely because current use is small.

The project deliberately uses lower guardrails: 1.5 MB per asset, 400 MB per database, 4.5 GB account storage, and 10,000 valid image requests per UTC day. Publication accounts for retained earlier editions and database overhead. Full account observations must include other D1 databases, Workers and Pages Functions. The application cannot cap unrelated account traffic or stop invocation billing for malformed traffic; verification of the actual Free plan remains necessary for the no-overage requirement.

Delivery is disabled unless all of these are present:

- `EBOOK_ASSETS_ENABLED=true`
- a dedicated `EBOOK_ASSETS_DB` binding
- `EBOOK_BUDGET_ATTESTATION`, generated from real plan and complete account-usage observations, valid for the same UTC day and no more than 24 hours old

The daily proof must have a reliable renewal/monitoring process before production activation. An expired, incomplete, unknown or Paid proof fails closed. No self-attested fixture from the local test server is suitable for remote activation.

The current connection cannot read account subscriptions because it lacks Billing Read. Workers `default_usage_model: standard` and Pages `usage_model: standard` do not establish Free versus Paid. WO02 may prepare the reader, originals, migration and tests while remote database creation, binding, import and production publication remain gated. Reconnecting the same OAuth scopes does not supply Billing Read.

## Byte delivery and publication

The service accepts allowlisted immutable hashes only, with no query-string variants, arbitrary SQL, external fetches or public upload operation. It enforces a shared atomic daily counter, verifies BLOB length/MIME/RIFF/WebP/hash before returning data, and supports ETag, HEAD and immutable caching. HEAD/conditional responses require an actual published metadata row. Missing assets, an exhausted budget and an unavailable binding return finite errors without repeated automatic retries.

`publishEbookAssets()` is an operator-only binding library. It validates the account proof, computes storage/read/write budgets and checks every supplied binary before writes. It performs a complete hash readback afterward. The remote binding-based import invocation is part of the activation gate; a successful local SQLite test is not evidence of a remote D1 import.

## Review and portability

`node scripts/build-ebook-review.mjs` produces an explicit review/offline adapter under `/staging/ebook-reader-preview/`. It copies the Registry-declared canonical owner files, embeds the exact page JSON strings and maps image IDs to the reviewed WebP files included in that bundle. It has no alternate reader implementation. This inspectable bundle does not activate or replace the production D1 origin, and its provenance explicitly says remote D1 has not been verified.

`node scripts/ebook/preview-server.mjs --port 4173` starts an actual local SQLite database and the same BLOB publisher/service for local and CI testing. It uses a synthetic proof confined to that process, labels responses `X-Ebook-Preview: local-sqlite`, rejects paths outside `public/` and closes its database on shutdown. It does not create Cloudflare resources or use account credentials.

## Verification

Run the source builder, review builder, `check-ebook-assets.mjs`, `check-ebook-reader.mjs --runtime`, `check-ebook-samples.mjs --runtime` and the canonical module-boundary gate. The sample check loads all 72 actual pages at mobile width, verifies every served WebP byte, checks cover/contents/page numbers, external-link targets, image decoding, overflow and last-position restoration. Reader fixtures separately exercise quotation storage, Unicode anchors, failure preservation and the Library → Editor → Public → portable pipeline.

PDF exports are separate fixed-page review artifacts: cover, contents and 24 numbered body pages. The WO02 review PDFs use A4 to preserve the authored text, tables and readable diagrams. This does not finalize the trim size of the regular volumes.
