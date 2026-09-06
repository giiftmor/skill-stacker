# Phase 1: Unified Print Contract + Slide Preview + Print-to-PDF

## Goal

Make the on-screen preview, browser print, and PDF export render the **exact same pages**: same A4 paper, same margins, same page breaks. Eliminate the current fragmented hardcoding (A4/15mm/40pt values duplicated across preview, print CSS, PDF, DOCX) and replace react-pdf with the browser's own print engine so the exported PDF is pixel-identical to the preview the user sees.

Also redesign the preview to show **one page at a time** (a slide with functional prev/next navigation) instead of the current stacked vertical scroll.

## Context (current state)

The print contract is duplicated and inconsistent today:

| Path | File | Paper | Margin | Pagination |
|------|------|-------|--------|-----------|
| Screen preview | `app/components/CVPreview.tsx` | A4 (210mm×297mm via `printStyles.ts`) | 15mm padding + extra 50px bottom | `calculatePages` (section-aware) |
| Browser print `@page` | `app/globals.css:151` | A4 | 15mm | natural CSS flow |
| PDF export | `app/lib/export/pdfExport.tsx` | A4 `<Page>` | 40pt (~14.1mm) | react-pdf auto-flow |
| DOCX export | `app/lib/export/docxExport.tsx` | lib default (A4) | lib default (1") | docx auto-flow |

Key findings:
- `A4_DIMENSIONS` (15mm) exists in `printStyles.ts`; `CVPreview.tsx` hardcodes its own `A4_PADDING_PX`/`BOTTOM_MARGIN_PX`/`USABLE_HEIGHT_PX`.
- `printStyles.ts` exports `A4_PAGE_STYLE` (`@page A4/15mm` + `@media print` rules) but it is **imported and never used** in `exportModule.tsx` — dead.
- `globals.css` holds a **second, divergent** copy of print rules.
- PDF export uses react-pdf (`@react-pdf/renderer`), which layout content independently — it cannot reproduce the preview's DOM/CSS page breaks.
- Preview page (`app/cvs/[id]/preview/page.tsx`) currently renders `showAllPages=true` (stacked scroll); prev/next buttons + a bottom nav exist but are inert in that mode (they only matter when `showAllPages=false`).
- The preview page has a brittle `handlePrint` that copies `#cv-print-area` innerHTML into a new window.

## Design Decisions (user-approved)

1. **Fidelity target**: exact page-for-page match between preview, print, and PDF.
2. **Generation point**: client-side (no server Chromium).
3. **Capture mechanism**: browser print engine renders the preview DOM to PDF.
4. **Margin model**: pages carry their own 15mm internal padding; `@page { margin: 0 }` when printing (no double margins).
5. **DOCX scope**: shares paper/margins/fonts/colors, does NOT promise matching page breaks (Word re-flows).
6. **react-pdf**: removed from the PDF flow entirely; browser-print is the single PDF path.
7. **Preview UI**: one-page-at-a-time slide with functional prev/next.

## Architecture

### 1. Single source of truth: `app/lib/printConfig.ts`

```ts
export const PRINT_CONFIG = {
  paper: { width: "210mm", height: "297mm" }, // A4
  paddingMm: 15,                              // all four sides
  bottomExtraMm: 13.23,                       // = former 50px bottom margin, in mm (50px ÷ 96dpi × 25.4)
} as const;

export const mmToPx = (mm: number) => (mm * 96) / 25.4;
export const mmToPt = (mm: number) => (mm * 72) / 25.4;
```

- `app/components/ui/printStyles.ts` re-derives `A4_DIMENSIONS` from `PRINT_CONFIG` (kept as a thin re-export so existing importers keep working). `A4_PAGE_STYLE` (currently dead) is deleted; its `@media print` rules are consolidated into `globals.css`.
- `CVPreview.tsx` replaces its local `A4_PADDING_PX` (`mmToPx(15)`), `BOTTOM_MARGIN_PX`, `USABLE_HEIGHT_PX`, `MIN_SPLIT_THRESHOLD` with values computed from `PRINT_CONFIG`.
- DOCX export converts the same mm values to points (`mmToPt(15) = 42.52pt`) for its explicit page margins. PDF (react-pdf) is removed entirely and no longer converts any values.

### 2. Preview: one-page-at-a-time slide

- Main visible preview renders **one page at a time** (`showAllPages=false`), driven by `currentPage`.
- Wrap the page in a fixed, centered **slide viewport** that shows exactly one A4 page; prev/next (and keyboard ←/→) switch pages with a **horizontal slide transition** (CSS transform), not vertical scroll.
- `grep` the current nav wiring: `app/cvs/[id]/preview/page.tsx` already has prev/next buttons + a bottom paginator (lines 130-198); they become functional once the main preview uses single-page mode. Add matching paging to the edit-view preview (`app/cvs/[id]/edit/page.tsx`) for consistency.
- **Separate "what I see" from "what prints"**: remove the `showPrint`/`showAllPages` conflation. A dedicated print container renders all pages (`showAllPages=true`) only when printing/exporting.

### 3. Browser-engine Print/PDF (replaces react-pdf)

- "Print / Save PDF" (preview page) and the edit-view print action render the full preview (`showAllPages=true`) in a `#cv-print-area` and call `window.print()`.
- Print CSS (single source, injected once): `@page { size: A4; margin: 0 }`; each `.cv-page` renders at 210×297mm with its own 15mm padding; `.cv-page { break-after: page }` except the last.
- Replace the brittle innerHTML-copy `handlePrint` with a straightforward `window.print()` of the live print container (fix styling/scoping issues).
- `react-pdf` (`@react-pdf/renderer`, `pdfExport.tsx`, its `generatePDF`/`createPDFLink`) is removed from the flow. `exportDispatcher.ts` drops the "pdf" format (printing is triggered from the UI), keeping only DOCX. `exportCVToBlob` "pdf" branch is removed.
- DOCX (`docxExport.ts`) sets explicit A4 + 15mm margins (and bottomExtra) via `sections[].properties` (previously empty → lib defaults), and reads fonts/colors from shared config.

### 4. Pagination correctness (& slide safety)

- Re-verify `calculatePages` (in `CVPreview.tsx`) and the measured-heights flow are correct for the slide mode (page boundaries stable as user flips pages).
- Confirm the `allPages` recomputation (via `measuredHeights` `useMemo`) doesn't jump pages mid-slide.

## Error handling / edge cases

- Zero pages / empty CV: slide shows a single blank A4 page (existing fallback in `CVPreview.tsx:440-462`), nav disables.
- Single-page CV: prev/next disabled, indicator "1 / 1".
- Print while preview has unsaved edits: print renders current in-memory state (no save required to print).
- Two-column and photo templates must paginate correctly in print (internal padding consistent with the single source).

## Testing

- **Unit (Vitest)**:
  - `printConfig`: `mmToPx`/`mmToPt` correctness; `PRINT_CONFIG` is the single source (assert `A4_DIMENSIONS`, pdf, docx all derive from it).
  - `calculatePages`: existing tests (single/multi-page, canBreak split, non-breakable, zero-height, empty) kept + any slide-specific additions.
  - `docxExport`: section properties emit A4 + 15mm margins.
- **E2E (Playwright)**: `preview-page.spec.ts` extended to assert the slide shows one page at a time and prev/next actually change the page; `print` CSS yields A4 pages with `@page margin:0`.
- Manual visual check: preview ↔ printed PDF ↔ exported DOCX paper/margins match.

## Files touched

- `app/lib/printConfig.ts` (new)
- `app/components/ui/printStyles.ts` (derive from config; fix/remove dead `A4_PAGE_STYLE`)
- `app/components/CVPreview.tsx` (config-driven constants; slide viewport)
- `app/cvs/[id]/preview/page.tsx` (slide nav functional; print rework)
- `app/cvs/[id]/edit/page.tsx` (slide paging; export routing)
- `app/cvs/new/page.tsx` (keep live preview; optional slide)
- `app/lib/export/pdfExport.tsx` (remove)
- `app/lib/export/exportDispatcher.ts` (remove/reroute pdf)
- `app/lib/export/docxExport.ts` (explicit page/margins)
- `app/globals.css` (consolidate print rules; `@page margin:0` in print)
- `package.json` (remove `@react-pdf/renderer`)
- Tests: `app/*/__tests__/*`, `e2e/preview-page.spec.ts`

## Out of scope (future phases)

- Making DOCX page breaks match the preview (impossible reliably; Word re-flows).
- Server-side or auto-download PDF generation.
- Any other preview UI redesign beyond the slide.
