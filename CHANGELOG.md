# Changelog

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

### Deprecated

### Security


## [0.2.2] - 2026-09-28

Measured A4 pagination: pack engine + usePagination hook, generic block-based CVPreview, real single-page /preview slide with live window.print, and a print tree that is always laid out so PDF snapshots carry every page (fixes truncate-to-page-1). Template/theme/font/photo are preview-neutral in the live preview while still driving DOCX/PDF exports. Unit 104/104, lint 208w errors net -2 vs base, pagination e2e 6/6.


### Added
- 2026-09-28: Measured A4 pagination — pure `pack()` engine + `usePagination` hook (ResizeObserver + `document.fonts` re-measure) and a generic block-based `CVPreview` renderer; `/cvs/[id]/preview` becomes a real single-page slide (prev/next, keyboard nav, Page N of M) that prints via live `window.print()`; `e2e/pagination.spec.ts` (6 tests) — Task 1/2 of the measured A4 pagination plan (`dcba82a`, `63a5952`)
- 2026-09-28: Authority spec + implementation plan — `A4_PAGINATION_SPEC.md` and `docs/superpowers/plans/2026-09-28-measured-a4-pagination.md`

### Changed
- 2026-09-28: Print path — the all-pages print tree is kept laid out off screen at all times so print snapshots already carry every page (fixes the truncate-to-page-1 race); `@page { size: A4; margin: 0 }` applied; editor export button relabeled "Quick PDF" (react-pdf exports untouched) (`7429a16`, `e47ea7e`)
- 2026-09-28: Live CV preview is now preview-neutral — template/theme/font/photo no longer restyle the generic preview (they still drive the react-pdf DOCX/PDF exports); style rail consequently shows app state only (`191f294`, `19f99f4`)

### Fixed
- 2026-09-25: Tailor Apply now matches experience diffs by id (`String`-normalized) instead of array index, so tailoring the Nth experience no longer overwrites the first; id-less updates keep legacy positional behaviour — Task 11 fold-in (`4e0c304`)
- 2026-09-28: Multi-page CVs printed as a single truncated page — the print tree was `display:none` on screen, so its measurer collapsed to one page and repagination raced the print snapshot (`7429a16`)
- 2026-09-28: Page index could exceed the page count after shrink repagination — `currentPage` is now clamped (`e98b70b`)

### Removed
- 2026-09-28: Estimate-based `calculatePages` machinery and its test, superseded by measured pack pagination (`191f294`, deleted `app/components/__tests__/calculatePages.test.ts`)

### Deprecated

### Security


## [0.2.1] - 2026-09-25

Light-theme Guided + Editorial UI rebuild: roster readiness, guided capture wizard, editorial editor with inspector + command palette, AI tailor in the inspector rail; ready_override + PATCH template + rewrite endpoints


### Added
- 2026-09-22: Light-theme Guided + Editorial UI rebuild — Roster (`/cvs`) with readiness dots/mark-ready/quick PDF/duplicate, 4-step Guided Capture (`/cvs/new`), Editorial Editor with inline section editing + inspector (checklist, style, Tailor-for-job) + command palette; `ready_override` column + `POST /api/cv/[id]/ready`, `PATCH /api/cv/[id]/template`, `POST /api/tailor/rewrite`; Fraunces/Mulish + `--font-heading` fix
- 2026-09-22: Design spec `docs/superpowers/specs/2026-09-22-ui-studio-guided-editorial-design.md` — light-theme "Guided + Editorial" UI rebuild (Roster / Guided Capture / Editorial Editor workspaces), with manual "Mark ready" override, approved direction; no implementation yet
- 2026-09-22: Implementation plan `docs/superpowers/plans/2026-09-22-ui-studio-guided-editorial.md` — 11-task execution plan (readiness lib → tokens → ready_override/APIs → Roster → form/preview restyle → rewrite endpoint → Guided Capture → Editorial Editor → inspector tailor + command menu → verification/release)

### Changed
- 2026-09-22: Restyle CV preview page chrome and shared `Header` to T2 light tokens (className-only; `#cv-print-area` and templates untouched) — Task 6 of the UI Studio Guided/Editorial rebuild (`4794c5c`)
- 2026-09-22: Add `POST /api/tailor/rewrite` — generic per-section rewrite endpoint wrapping `rewriteSection()` with the no-fabrication guard, plus unit coverage — Task 7 of the UI Studio Guided/Editorial rebuild (`73e4eda`)
- 2026-09-25: Rebuild the editor as a light-theme editorial workspace — click-to-edit CV sections, readiness inspector rail with style controls, template persistence via `PATCH /api/cv/[id]/template`, and a chrome header with mark-ready toggle; retires `CVBuilderForm`/`CVBuilderApp` — Task 9 of the UI Studio Guided/Editorial rebuild (`8c513b8`)
- 2026-09-25: Guided Capture wizard on `/cvs/new` with live draft preview and editor handoff — Task 8 of the UI Studio Guided/Editorial rebuild (`b20e56f`)

### Fixed

### Removed

### Deprecated

### Security


## [0.2.0] - 2026-09-17

AI CV Tailoring (Ollama SSE), env-gated structured logging, version history + restore, and PDF export font fix


### Added
- 2026-09-17: Dev-only model latency tester at `/delaytest`, backed by `GET /api/delaytest/models` and `POST /api/delaytest/{run,stream}` routes, for comparing Ollama model speed/validity
- 2026-09-17: Version history + restore UI — `History` button on the edit page opens the `VersionHistory` modal; new `GET /api/cv/[id]/versions` and `POST /api/cv/[id]/versions/[versionId]/restore` routes; restoring commits the version server-side and saves a pre-restore save point
- 2026-09-17: Add `e2e/qa-phase9.spec.ts` — Playwright QA covering exports (multi-page PDF, two-column, theme colours, DOCX), version-snapshot API, photo upload/display, version restore round-trip, version history modal, and auto-save indicator (evidence to `e2e/.qa-evidence/`)
- 2026-09-06: Add AI CV Tailoring (Ollama) - SSE /api/tailor pipeline (scrape->extract->tailor->diff), Apply/Reject + fabricated-content guard, Playwright e2e
- 2026-09-06: Live template preview refresh on the "New CV" page
- 2026-09-06: Unit tests for `calculatePages` and `getTemplateClasses`
- 2026-09-06: E2E test for live preview + fix strict-mode `h2` locator in template-selector spec
- 2026-09-06: AI tailor e2e tests (URL + pasted-text paths) with R1-12 Apply-button fix (`b66c7c4`)

### Changed
- 2026-09-17: `VersionHistory.tsx` now reads/writes through the new API routes instead of importing server-only `lib/versions` (which pulled `pg` into the client bundle), so the modal can actually be rendered
- 2026-09-06: Export `calculatePages` and `Section` from `CVPreview.tsx` for testability
- 2026-09-06: Replaced README boilerplate with actual project documentation
- 2026-09-06: Updated AGENTS.md to reflect the real PostgreSQL/port-5252 stack
- 2026-09-06: Removed unused deps `ts-node` and `@types/html2pdf.js`
- 2026-09-06: Instrument `llm.chat` (ollama.ts) with request/response/error logging + durations
- 2026-09-06: Instrument `runTailorPipeline` (pipeline.ts) with start/stage/done/aborted logging + durations
- 2026-09-06: Instrument `scrapeJobAd` and `extractRequirements` with launch/done/failed and request/done logging
- 2026-09-06: Instrument `guardNoFabrication`, `tailorSection`, and the SSE `/api/tailor` route with stage/guard/request logging
- 2026-09-06: Instrument CV CRUD routes (`api.cv`, `api.cv.item`), snapshot (`api.cv.snapshot`), upload (`api.upload`), photo (`api.photo`), storage (`storage.file`), and db writes (`db.write`) with scoped structured logs; removed `🟢`/`🟡` debug noise
- 2026-09-06: Add env-gated structured logging (`LOG_LEVEL`) across AI-tailor, LLM, CV CRUD, upload, and db write flows; removed leftover debug markers in `/api/cv`

### Removed
- 2026-09-06: Deleted all 6 disabled AI API routes (chat, completions, embeddings, models, responses, seed)
- 2026-09-06: Deleted dead files `app/lib/env.ts` and `app/lib/db.ts.env`

### Fixed
- 2026-09-17: PDF export rendered blank/broke for all font pairs — `getFontFamily()` returned CSS heading strings (e.g. "Arial, sans-serif") that were never registered with react-pdf, and the fallback "Helvetica" registration pointed at the blocked `fonts.gstatic.com` domain. `pdfExport.tsx` now maps font pairs to registered families (Roboto via cdnjs for default/modern/creative; built-in Times-Roman for classic/professional); verified via `e2e/qa-phase9.spec.ts` (multi-page two-column PDF with theme colours + Word export)
