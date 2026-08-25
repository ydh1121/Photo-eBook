# Photo-eBook Repository Agent Rules

## Restart-safe workstream protocol

Long-running work must not depend on one ChatGPT conversation staying open.

If an active workstream exists under `docs/workstreams/<workstream-id>/`, repository state is the source of truth for continuation.

When starting or resuming work in a new chat/session:

1. Read this `AGENTS.md` first.
2. Locate the active workstream under `docs/workstreams/`.
3. Read its `TASKS.md` and `HANDOFF.md` before changing code or documents.
4. Confirm the current `main` commit and compare it with the commit/state described by the handoff.
5. Resume from the task marked `[-] active` and the handoff `Next action`; do not infer progress from conversation memory alone.
6. Read the final library/spec/runtime files named by the handoff before editing them.

During a long-running workstream:

- Keep `TASKS.md` as the canonical task/status tracker.
- Keep `HANDOFF.md` short and current: phase, decisions, completed work, current blockers, and exact next action.
- After each meaningful completed unit, update both files in the same work session.
- If a session must end in the middle of a task, record the partial state, files changed, unresolved checks, and exact next command/action before stopping.
- Never require the user to reconstruct previous chat context when repository state can carry it.
- Final product rules, approved libraries, schemas, and operational specs remain in permanent Git paths such as `docs/library/`, `docs/spec-v1/`, and runtime code.
- Temporary research notes, alternatives, QA logs, and completion checklists may live in the workstream folder while active.
- When the workstream is fully usable and user-approved, archive the workstream folder and QA records to Google Drive, but keep the permanent product rules/specs/runtime in Git.

## Korean copy contract

Any Korean UI copy, heading, body text, CTA, helper text, new content, or rewrite MUST read and apply `docs/spec-v1/20-korean-copywriting-skill.md` before editing.

- Google Sheet `COPY_GUIDE` is the live project copy rule source.
- User-provided before/after examples outrank generic style guides.
- Preserve facts, prices, periods, model names, and functional meaning while rewriting.
- Avoid recurring AI-like patterns such as defensive `~이 아니다. ~이다.`, mechanical `먼저 ~`, repeated `~을 봅니다/한다`, translationese, and abstract comparisons without a concrete action.
- Read copy aloud conceptually and design Korean line breaks by semantic breath units, especially for mobile headings.
- Do not disguise portfolio practice as a real client commission. Use `자체 기획 촬영` and state purpose/use case clearly.
- Update the Google Sheet source first when the copy is data-backed. Runtime copy code may only bridge legacy hard-coded copy, cache compatibility, or deliberate semantic line breaks.

External baseline reference recorded by the project: `https://github.com/DaleSeo/korean-skills`.

## Responsibility split

Image production has two separate contexts.

- **Orchestrator**: may read repository specs, manifest, status, Drive configuration, QA history, Git state, and deployment state.
- **Image generator**: receives only the visual description from exactly one `content/image-prompts/v1/slots/<slot-id>.md` file, plus a reference image only when the slot requires one.

Never forward queue JSON, status JSON, Git/Drive/Cloudflare details, filenames, paths, QA logs, deployment instructions, global rule documents, or previous failure images into the image-generation input.

## Canonical transaction

`slot 확인 → slot prompt 1개로 PNG 생성 → QA → Drive PNG → 결정론적 WebP 변환 → Drive WebP → Git 최종 WebP → ready:true → applied → 배포 검증`

A failed slot stays isolated. Do not regenerate or roll back accepted slots.

## Slot prompt contract

Files under `content/image-prompts/v1/slots/` are generator payloads, not workflow documents.

Each slot file must contain only a short visual description of one photograph or one final visual result. Do not put these in a slot prompt:

- slot id or output path
- Git/Drive/deployment state
- pipeline steps
- QA instructions
- failure history
- progress or batch information
- long negative lists

Operational metadata belongs in `manifest.json`, `content/image-status/v1/`, and the repository specs.

## Batch behavior

One user instruction may process several slots, but each slot gets its own generation call and its own final file. Never ask the image model to represent several semantic slots on one canvas.

## People and references

For Korean-market work scenes, use natural-looking Korean adults unless the source context requires otherwise. Real identifiable products use the reference-required path and must preserve the reference accurately.

## QA gate

Reject results that are not a believable standalone photograph/final visual for the requested slot, that contain unrelated interface/report layouts, or that materially mismatch the body context. Rejected outputs never reach production WebP, Drive WebP, Git assets, `ready:true`, or `applied`.

## Binary handling

New work uses the approved PNG master and `scripts/image/png-to-webp.py`. Do not use tar/base64 staging, orphan-blob recovery, or one-off importer workflows as the normal production path.

## Reusable UI module contract

Any work that changes `/ui-dashboard/`, `PlatformModuleRegistry`, Block Editor UI modules, public module adapters, or public Snapshot rendering MUST prove that the result is a reusable runtime module rather than a preview-only imitation.

The required product path is:

`Library → Editor → Public`

For every approved module or approved style family:

1. Library, Editor, and Public must consume the same module ID and the same canonical `render()/hydrate()` owner through `PlatformModuleRegistry`.
2. A Library preview may own only framing, viewport isolation, theme simulation, and QA controls. It must not own a second visual implementation of the component.
3. Do not add preview-only HTML/CSS/JS that merely copies the production appearance. If a selector, style family, state, or interaction is intended to ship, its owner must live in shared module/runtime code that Public can load.
4. Every visible Library setting must either change the canonical runtime immediately or be removed/disabled from the UI. No visible no-op controls are allowed.
5. Library default changes are only defaults for newly inserted Editor instances. Editor instances must persist a snapshot of content/style props and must not reread mutable Library defaults later.
6. Published pages must render `ui-module` blocks directly through `PlatformModuleRegistry` and `PlatformModuleStyleRuntime`; using `/ui-dashboard/`, `module-preview`, sandbox, or an admin iframe in Public is forbidden.
7. Interaction QA must exercise the actual behavior, not only compare appearance. Examples include horizontal scrolling, sticky navigation, filter selection events, bottom-sheet drag/selection/delete, accordion state, and FAB actions.
8. Style QA must verify that each exposed control has a measurable runtime effect. Typography controls must affect actual component text nodes; layout controls must affect the actual scroller/sheet/rail; state controls must affect the real interaction owner.
9. Any new module promoted from Block Lab must be extracted to shared canonical code before Library or Editor can consume it. Library/Editor must never import Block Lab runtime/data/style directly.
10. Before merging a UI-module change, run both the static module-boundary check and Chromium end-to-end module pipeline check. A green result is required unless the repository owner explicitly asks for a main-only visual verification; in that case the known failing check and reason must be recorded and repaired immediately after visual verification.

A change fails this contract if it looks correct in `/ui-dashboard/` but cannot be inserted in Block Editor and rendered with the same behavior on a published page.
