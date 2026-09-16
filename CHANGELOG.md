# Changelog

## [Unreleased]

### Added
- 2026-09-06: Add AI CV Tailoring (Ollama) - SSE /api/tailor pipeline (scrape->extract->tailor->diff), Apply/Reject + fabricated-content guard, Playwright e2e
- 2026-09-06: Live template preview refresh on the "New CV" page
- 2026-09-06: Unit tests for `calculatePages` and `getTemplateClasses`
- 2026-09-06: E2E test for live preview + fix strict-mode `h2` locator in template-selector spec
- 2026-09-06: AI tailor e2e tests (URL + pasted-text paths) with R1-12 Apply-button fix (`b66c7c4`)

### Changed
- 2026-09-06: Export `calculatePages` and `Section` from `CVPreview.tsx` for testability
- 2026-09-06: Replaced README boilerplate with actual project documentation
- 2026-09-06: Updated AGENTS.md to reflect the real PostgreSQL/port-5252 stack
- 2026-09-06: Removed unused deps `ts-node` and `@types/html2pdf.js`
- 2026-09-06: Instrument `llm.chat` (ollama.ts) with request/response/error logging + durations

### Removed
- 2026-09-06: Deleted all 6 disabled AI API routes (chat, completions, embeddings, models, responses, seed)
- 2026-09-06: Deleted dead files `app/lib/env.ts` and `app/lib/db.ts.env`

### Fixed
