# Changelog

## [Unreleased]

### Added

- 2026-10-03: `scripts/seed.sh` — idempotent seeder that POSTs the 5 sample resumes from `scripts/sample-cvs.json` through the real `/api/resume` path (triggers `initDb`, exercises `saveCV` slug/normalization), reads `HOST_PORT`, and skips when the DB already has resumes; documented in AGENTS.md so every DB remake is followed by reseeding. Verified: truncate → seed → 5 fresh slugs.

### Changed

### Fixed

- 2026-10-03: preview page no longer overflows its container — the fixed 210mm A4 sheet (plus the prev/next arrows) is now fit-scaled via `transform: scale` (new `useFitScale` hook, `min-w-0` slide) so scroll width equals viewport width at any size (verified 1440→900). Layout stays at 794px so measurer/print pagination is unchanged (pagination.spec "print count == print tree" still passes).
- 2026-10-03: edit page no longer overflows its container — the A4 sheet previously hung out of the white card and past the viewport on narrow windows (`scrollWidth` 1372@1280, 1287@1024). The sheet is now fit-scaled by the same `useFitScale` hook (measuring content width, padding-aware); sheet sits exactly inside the card at 1440/1280/1024 and `scrollWidth == viewport` at all three.

### Removed

### Deprecated

### Security


## [0.3.1] - 2026-10-03

Follow-up session (2026-10-03): finished all outstanding backlog items — sidebar footer, shared slug resolution, DB legacy cleanup, testid/copy sweep, and full verification gate.

### Added

- 2026-10-03: exported `VALID_SLUG` regex contract and shared `resolveSlugParam` helper (ok/invalid/not_found) used by every resume route; 400 vs 404 now use accurate "Invalid resume identifier"/"Resume not found" log labels

### Changed

- 2026-10-03: finished the CV→Resume copy sweep — export filenames are now `<Name>.pdf`/`.docx` (no `_CV` suffix, "Resume" fallback) in both `exportDispatcher` and `exportModule`; Roster, EditorialChrome, ExportModal, UploadPhoto, TailorPanel, layout meta and delaytest strings renamed; sidebar-nav testids renamed (`nav-resumes`/`nav-new-resume`/`nav-edit-resume`)
- 2026-10-03: sidebar nav scoped with `min-h-0 overflow-hidden` so the footer stays pinned with no overflow at 1440×900, 1280×700 and 1024×600 (nav scrollHeight == clientHeight in all three, footer pinned, coming-soon tail visible)

### Fixed

- 2026-10-03: dropped duplicate legacy indexes `idx_cvs_full_name`/`idx_cvs_email`/`idx_cv_versions_cv_id` and renamed legacy pkeys `cvs_pkey`→`resumes_pkey`, `cv_photos_pkey`→`resume_photos_pkey`, `cv_versions_pkey`→`resume_versions_pkey` (idempotent; verified live, 0 legacy remain)
- 2026-10-03: `saveCV` now normalizes partial payloads (nested `personal` defaults + `?? []` for all array fields) so array-less POSTs no longer crash
- 2026-10-03: `initDb()` now runs on all resume write routes (POST /api/resume, PUT/DELETE [slug], ready, template, snapshot, restore) so a cold container no longer 500s on first write

### Removed

- 2026-10-03: `_CV` suffix removed from the exported-filename builders

### Deprecated

### Security

### Tests

- 2026-10-03: ready route test rewritten against `NextRequest` + mocked `initDb`/`setCVReady`/`resolveSlugParam`; `VALID_SLUG` contract tests added; e2e synchronized to new copy (QA_Two_Column.pdf/.docx, `img[alt="Resume Photo"]`, New client resume) and race-proofed (template persist awaits the PATCH response; ready-dot poll raised to 15s) — 19/19 runnable specs green, 140/140 unit tests, lint at baseline


### Added

- 2026-10-02: resume slug identifier helpers (slugify/slugFromId)
- 2026-10-02: sidebar footer with account placeholder and bottom collapse toggle (full-height, non-scrollable aside)
- 2026-10-02: Live gate evidence (Task 5, no code change): full-height non-scrollable `aside` verified at 1440×900 (scrollHeight 844 = clientHeight 844) and 900×700 (644 = 644) with `overflowBy=0` in expanded, collapsed and edit-page states; `sidebar-footer` pinned 8px above the viewport bottom in every state and `sidebar-toggle` flips `aria-pressed` true→false→true. Migration idempotence confirmed: `SELECT count(*), count(slug) FROM resumes` = 153/153 before and after `docker compose restart db app` (0 null/empty, 153 distinct slugs). Measured overflow floor ~541–549px viewport on `/resumes` and ~652–660px on the edit page (extra "This Resume" nav block); below that the nav's flex `min-height:auto` stops shrinking and pushes the footer off-screen with no scrollbar

### Changed

- 2026-10-02: renamed cvs → resumes across public routes, API endpoints, folder structure, and DB tables/columns; navigation now uses slug URLs (`/resumes/jane-doe-2a`) with the slug frozen at creation (edits keep it stable) while the numeric id stays internal for photo/upload/versions; internal numeric names (the GET envelope key `cvs`, `getAllCVs`, `RosterProps.cvs`) intentionally retained
- 2026-10-02: DB migrated to resumes/resume_photos/resume_versions with resume_id keys and a unique slug column (in-place, data preserved)
- 2026-10-01: Grouped sidebar into task sections (Workspace / This CV / Coming soon, long tail demoted), added a header collapse toggle with localStorage-persisted icon-rail mode that auto-collapses below 1280px on first visit, and added a discoverable Ctrl-K search button that opens the edit-page CommandMenu.

### Fixed

### Removed

### Deprecated

### Security


## [0.3.0] - 2026-09-30

Portal AppShell + dark theme + editorial edit workbench redesign: full-bleed shell header, labeled sidebar, exclusive accordion inspector (Checklist/Style/Tailor), header Actions drawer with focus-safe dialogs, docked page pager, and AA-compliant dark-mode accent fills; whole-branch review passed with e2e gates restored via a shared Actions helper.


### Added
- 2026-09-29: Dark theme foundation — `[data-theme="dark"]` token overrides, `color-scheme`, and a `prefers-reduced-motion` reset in `app/globals.css`; client `ThemeProvider` (mount-time restore of `localStorage["spectres:theme"]`) and an accessible 40px `ThemeToggle` (sun/moon, `aria-pressed`). Task 1 of the portal edit workbench plan
- 2026-09-29: Portal `AppShell` — 56px global header (wordmark link, `CVs / {title}` breadcrumb, `ThemeToggle`) plus a 176px labeled slim sidebar with active-aware `My CVs` / `New CV` / `Edit CV` / `Preview` links and `aria-disabled` "Coming soon" rows; adopted on `/cvs`, `/cvs/{id}/edit` and `/cvs/{id}/preview`, and `ThemeProvider` now wraps the root layout. Task 2 of the portal edit workbench plan
- 2026-09-30: Portal edit workbench — 4:8 editor grid (canvas 4 / inspector 8), a single-open exclusive accordion inspector (Checklist, Style, Tailor-for-job; backed by the pure `exclusivePanel` in `app/lib/accordion.ts`), tokenized Style controls, Tailor panel (light `bg-accent` Analyze in dark mode), and a live `role="status"` SaveIndicator. Task 3 of the portal edit workbench plan (`b964d61`)
- 2026-09-30: Header actions rail — `Actions` drawer (Tailor / Style / Checklist / Quick PDF / Word format / History) with keyboard-focus restore after each action, a page pager docked under the editor canvas that hides at ≤1 page, and a single shared `useDialog` focus-trap / Escape-close / focus-restore contract across `SectionEditor`, `VersionHistory` and `CommandMenu`, with dialog-ref callback typing and a rail-close focus handoff. Task 4 of the portal edit workbench plan (`546b705`, `4572e2d`, `76d903a`)
- 2026-09-30: Shared e2e helper `e2e/actions.ts` (`openActions`) — opens the collapsed Actions drawer before editor readiness gates, restoring the 14 Preview / History / Quick PDF / Word gates across `inline-editing`, `roster`, `guided-capture`, `preview-page`, `tailor` and `qa-phase9` specs (`3a3531b`)

### Changed
- 2026-09-29: `Breadcrumb` accepts `className` / `currentClassName`, marks the trailing crumb with `aria-current="page"`, and labels its `nav`; edit-page loading screen retokenized from hard-dark `bg-[#0d0d0d]` to `bg-canvas text-muted`; `app/layout.tsx` root `<html>` gained `lang="en"`
- 2026-09-28: Dev-database sample data refreshed — purged the ~404 e2e-fixture CVs (QA Two Column / Guided Client / Roster / Pagination Fixture etc.) and 19 orphaned uploaded photos; kept the five original samples and seeded four realistic CVs (product manager, data engineer, product designer, frontend engineer), including a 3-page data-engineer showcase and one intentionally in-progress CV
- 2026-09-30: Accent-filled controls switched from `text-white` to `text-surface` so dark-mode accent (`#4ec4b6`, white text 2.12:1) clears AA (~7.7:1) — 10 controls incl. `ExportButtons`, `CaptureStepper`, `GuidedCapture`, `EditorialChrome`, `SectionEditor`, `VersionHistory`, `Roster`, preview page (`1358677`); `TailorPanel` placeholders re-tokenized `text-faint` → `text-muted` (`e9bd160`)
- 2026-09-30: e2e assertions resynced to the redesigned chrome — copy checks now expect `Saving…` (U+2026) and exact `Saved ✓`, Style / Template locators are re-anchored to the accordion-button context (`/^Style/`, `/^Executive/`) now the inspector titles are buttons (`3a3531b`)

### Fixed
- 2026-09-30: Guarded every `localStorage` access in `ThemeProvider` — a `SecurityError` (e.g. browser storage blocked) can no longer whitescreen the app under the root layout (`056bdb5`)
- 2026-09-30: Restored visible focus indicators under Windows forced-colors via one global `@media (forced-colors: active)` rule, since the ring/box-shadow indicators are not painted in that mode (`f919544`)
- 2026-09-30: Section editors now open with initial focus on the dialog surface, not the destructive close button — new optional `useDialog` `initialFocus: "surface"` mode (default behaviour unchanged) plus 2 unit tests (`465871f`)
- 2026-09-30: `e2e/roster.spec.ts` strict-mode flake under accumulated fixtures — the "Roster Ready" assertion is scoped to the row the test just created (`3a3531b`)

### Removed
- 2026-09-29: Dead `app/components/ui/Header.tsx` — the preview page was its only importer and now uses `AppShell`

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
