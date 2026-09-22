# Changelog

## [Unreleased]

### Added
- 2026-09-22: Design spec `docs/superpowers/specs/2026-09-22-ui-studio-guided-editorial-design.md` — light-theme "Guided + Editorial" UI rebuild (Roster / Guided Capture / Editorial Editor workspaces), with manual "Mark ready" override, approved direction; no implementation yet

### Changed

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
