# Measured A4 Pagination + Single Live Print Path + Slide Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `CVPreview`'s estimate-based pagination with measured, block-level A4 pagination (one block per line/item, real heights via a hidden measurer + `ResizeObserver`), consolidate printing on a single live `window.print()` path whose output matches the preview page-for-page (no double margins, no duplicated content, no chrome/measurer in print), and make the `/cvs/[id]/preview` route a functional single-page slide with working prev/next + keyboard nav. Editor interactions (section ring, section click → editor) must survive the rewrite.

**Architecture:** Adapted from the repo-root `A4_PAGINATION_SPEC.md`. A pure `pack(heights)` function assigns blocks to A4 pages; a new `usePagination(blockCount)` hook measures real per-block heights in a hidden `.cv-measurer` (180mm inner width), repaginates greedily into 267mm-usable pages, re-measures on every render (JSON-equality bail-out), on `ResizeObserver`, and after `document.fonts.ready`. `CVPreview` builds a generic Word-style `blocks` array (spec §4.3) and renders it twice — hidden measurer + visible `.cv-page` divs — **while preserving its current public props** (`currentPage`, `onPageChange`, `onTotalPagesChange`, `showAllPages`, `onSectionClick`, `highlightKey`) and attaching `data-cvkey`/ring/click per block so the editorial editor keeps working. `@page { size: A4; margin: 0 }` replaces `margin: 15mm`; a minimal print block hides `.no-print` + `.cv-measurer`, forces white pages, and breaks after every `.cv-page` except the last. The `/preview` route drops its `innerHTML`-copy `handlePrint` in favor of `window.print()`; its on-screen tree renders one page at a time (`showAllPages=false`) while `#cv-print-area` remains the live all-pages print tree. The editor's "PDF" button is relabelled "Quick PDF"; the `@react-pdf/renderer` path is otherwise untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, Vitest (jsdom), @playwright/test, Biome. No new runtime deps. Reuses the existing `h1.user-name`, `.heading_1`, `.normal-text`, `.institution-name`, `.professional-title` classes already in `app/globals.css`, and existing `FormattedText` (`app/components/FormattedText.tsx`).

**Spec:** `A4_PAGINATION_SPEC.md` (repo root). This plan adapts it to the current codebase; deviations are listed in the Global Constraints and per-task rulings.

## Global Constraints

- All commands via Docker: `docker compose exec app npm run test`, `docker compose exec app npm run lint`, `docker compose exec app npm run build`, `docker compose exec app npm run test:e2e`. Never run host `npm`. E2E runs against the **baked production build** (port 5252) via `reuseExistingServer: true`.
- Light theme only. **Do NOT** replace/app `body` rule (keep design tokens + Fraunces/Mulish). Force white via `.cv-page, .cv-measurer { background:#fff; color:#212529 }`. No `century-gothic`, no dark-mode reverting. (Dark-mode handling is already a fixed root cause.)
- **Style rail is preview-neutral (user-approved):** `CVPreview` accepts `templateId`/`themeId`/`fontPairId`/`photoUrl` but does NOT use them. Templates, themes, fonts, and photo continue to affect the react-pdf DOCX/PDF exports only. Do NOT touch any `app/components/templates/*` file.
- Keep `cv-page`/`cv-measurer`/`cv-block` class names exactly as the spec and this plan name them — e2e selectors depend on them.
- `CVPreview` must keep its current props contract (`CVPreviewProps` + `currentPage`/`onPageChange`/`onTotalPagesChange`/`showAllPages`/`onSectionClick`/`highlightKey`); both `cvs/[id]/edit/page.tsx` and `cvs/[id]/preview/page.tsx` and `CVPreviewWrapper` pass them through unchanged.
- No contentEditable. No new runtime dependencies. No comments in code unless required (Biome).
- Vitest baseline: existing suite (currently 101 tests / 18 files) must stay green at every task boundary; new unit tests for the `pack` function.
- E2E: `e2e/pagination.spec.ts` seeds a long CV via the API (mirror the seeding pattern already used in `e2e/cv-list.spec.ts`), then loads `/cvs/[id]/preview`. Never depend on live Ollama.
- Do not fix the unrelated known bugs (`ReferencesForm.tsx` class typos `roundref-md`/`font-mrefium`; `exportToDocx` mapping `reference` as strings). Record as open issues.
- Any deviation from the spec/plan must be a ledgered `Ruling:`.

## Review Focus

- **Editor still works after the CVPreview rewrite:** section ring (`highlightKey`), click-to-edit (`onSectionClick` for all 9 section keys), one-page-at-a-time nav with `currentPage`/`onTotalPagesChange`, empty-CV single white page with header placeholder. Pinned by: unit suite + manual M1 + editor sanity in T1.
- **Live repagination:** typing/deleting text that changes height (not block count) must add/remove pages without reload; font load must not push content past a page bottom. Pinned by: manual M3/M10.
- **Print parity:** PDF page count == on-screen `.cv-page` count, no double margins, no duplicated content, chrome + measurer hidden, blocks not cut in half. Pinned by: e2e pagination.spec (incl. `page.pdf` count, overflow ≤1px, dark-mode white, measurer hidden) + manual M5/M7/M8/M9.
- **Slide preview:** `/preview` shows one page at a time; prev/next and keyboard arrows change page; `n / total` correct. Pinned by: manual + e2e smoke on the slide.
- **No regressions to the 7-template system / exports:** template files untouched; react-pdf and DOCX unaffected except the relabel. Pinned by: template-selector e2e still green.

---

## Task 1: Pagination engine (pack + usePagination + CVPreview rewrite + CSS)

**Files:**
- Create: `app/lib/pagination.ts`
- Create: `app/lib/pagination.test.ts`
- Create: `app/hooks/usePagination.ts`
- Rewrite: `app/components/CVPreview.tsx`
- Modify: `app/globals.css`
- Verify-only: `app/components/CVPreviewWrapper.tsx`

**Interfaces:**
- Produces:
```ts
// app/lib/pagination.ts
export const MM = 96 / 25.4;
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PAGE_PADDING_MM = 15;
export const PAGE_INNER_PX = (A4_HEIGHT_MM - 30) * MM; // usable height per page
export function pack(heights: number[]): number[][];
```
- `usePagination(blockCount: number): { measurerRef: RefObject<HTMLDivElement|null>; pages: number[][] }` per spec §4.2, importing `pack` from `lib/pagination`.
- Consumes: nothing yet; consumed by T2 for the slide/print surfaces.

### Step 1: Write the failing unit tests — `app/lib/pagination.test.ts`

Follow the existing `app/lib/*.test.ts` Vitest style (e.g. the tailor tests). Cover at minimum:

1. `pack([])` → `[[]]` (one empty page).
2. All single-block fits in one page → `[[0,1,2]]`.
3. Two blocks whose sum exceeds `PAGE_INNER_PX` → two pages `[[0],[1]]`.
4. Exact-fit boundary: `used + h === PAGE_INNER_PX` stays on the same page.
5. Block taller than a full page still gets its own page (overflow clipped later, not skipped).
6. 100 random heights between 100 and 600 merge deterministically into pages with no page exceeding `PAGE_INNER_PX` except single oversized blocks. (Deterministic seed.)

**Expected:** `docker compose exec app npm run test -- app/lib/pagination.test.ts` → new tests FAIL (module missing).

### Step 2: Implement `app/lib/pagination.ts`

Greedy packing identical to spec §4.2's `pack`: start `pages = [[]]`, `used = 0`; for each height, if `used + h > PAGE_INNER_PX` and the current page already has at least one block, open a new page; push the index and add the height to `used`.

**Expected:** unit tests PASS.

### Step 3: Write the failing hook usage — `app/hooks/usePagination.ts`

Implement spec §4.2 verbatim (imports `pack` from `../lib/pagination`). No test file is required for the hook itself; it is covered by the CVPreview rewrite in Step 4 and the e2e suite in Task 2. This step's proof is that the app still compiles and runs after Step 5.

### Step 4: Rewrite `app/components/CVPreview.tsx`

Convert the component to spec §4.3's generic block model **with these adaptations**:

1. Build `blocks: ReactNode[]` per spec §4.3: header block (`.user-name`/`.professional-title`/`.normal-text` joined with `  |  `, placeholders "Your Name"/"Your Professional Title"), `PROFILE`, `Core Competencies`, `Career History`, `Education & Qualifications`, `Certificates`, `Technical Skills`, `References`, `Additional Information`. `FormattedText` renders `exp.details`. Use Tailwind utilities that exist app-wide (`flex flex-col items-center`, `space-x-4`, `ml-5 list-disc`, `text-sm text-gray-600`, `text-gray-800`, `uppercase`). Bullet `<li>`s outside a `<ul>` are intentional (one block per item). Filter empty entries (`filter(Boolean)`, and `experiences.filter((e) => e.company || e.role)` etc. per spec).
2. `section(title, items)` attaches the `<h2 className="heading_1">` to the first item of the section (spec §4.3).
3. **Keep the editor contract (deviation from spec §4.3, required by current routes):**
   - `CVPreviewProps` import stays; accept `templateId/themeId/fontPairId/photoUrl` but do not reference them.
   - Accept optional interaction props: `currentPage?: number`, `onPageChange?`, `onTotalPagesChange?`, `showAllPages?: boolean`, `onSectionClick?: (key: string) => void`, `highlightKey?: string | null`.
   - Track each block's originating section key: `blocks` is built alongside `blockKeys: (string|null)[]` (header/profile get `null` or their section key to match current `SectionKey` set: `personal | profile | competency | experiences | education | certificate | skill | reference | additionalInfo`).
   - Every `.cv-block` wrapper gets `data-cvkey={key}` (when the key is non-null), `onClick` when `onSectionClick` is provided, and a `ring-accent ring-2` class when `highlightKey === key`.
   - Compute `pages` via `usePagination(blocks.length)`; `displayedPages = showAllPages ? pages : pages.slice(currentPage ?? 0, (currentPage ?? 0) + 1)`. In an effect, when `pages.length` changes, call `onTotalPagesChange?.(pages.length)`.
4. Root: single outer `<div ref={previewRef}>` (keep `previewRef` typed as `React.Ref<HTMLDivElement>`) containing the hidden `<div className="cv-measurer" ref={measurerRef} aria-hidden>` with every block once, then the visible `.cv-page` divs each rendering its page's blocks (spec §4.3 structure). **Remove** the outer `bg-white shadow` wrapper styles and any inline `width`/`min-height` mm classes.
5. Keep `className` passthrough on the outer div if `CVPreviewProps.className` is set.

**Expected:** Type-check clean; no reference to old `TemplateSection`-based rendering remains in this file.

### Step 5: `app/globals.css`

1. Replace `@page { size: A4; margin: 15mm }` (currently line 151) with `@page { size: A4; margin: 0; }`.
2. Replace the whole `@media print` block (lines 81-148) with:
```css
@media print {
  .no-print, .cv-measurer {
    display: none !important;
  }
  html, body {
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cv-page {
    margin: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }
  .cv-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .cv-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```
3. Add before the print block (screen styles):
```css
/* The CV never inherits app/dark styling */
.cv-page, .cv-measurer {
  background: #fff;
  color: #212529;
}

.cv-page {
  width: 210mm;
  height: 297mm;
  padding: 15mm;
  box-sizing: border-box;
  overflow: hidden;
  margin: 0 auto 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

/* Same inner width as a page (210mm minus 2 x 15mm), off screen */
.cv-measurer {
  position: absolute;
  left: -99999px;
  top: 0;
  width: 180mm;
  visibility: hidden;
  pointer-events: none;
}

/* Blocks must have NO margin. Use padding so it is measured. */
.cv-block { padding-bottom: 12px; }
```
4. Keep `h1.user-name`, `.heading_1`, `.normal-text`, `.institution-name`, `.professional-title` rules as-is. Do NOT touch the app `body` rule or the MS-Word class rules.

**Expected:** `docker compose exec app npm run lint` → no new errors; `docker compose exec app npm run build` → exit 0.

### Step 6: Verify `CVPreviewWrapper.tsx`

Current wrapper is already minimal (no `<style jsx>`, no `pageStyle`). Confirm it still passes `currentPage`/`onPageChange`/`onTotalPagesChange`/`showAllPages` through `...restProps`, keeps `previewRef` (via prop spread) and the `print()` imperative handle → `window.print()`. Change nothing unless a type breaks.

### Step 7: In-app sanity

`docker compose up -d --build app && docker compose restart app`. In a browser (or via the webapp-testing tooling):
- Load an existing CV in the editor (`/cvs/:id/edit`): preview shows a white A4 page (single, current page), the section ring + click-to-edit still work, page nav works.
- No console errors.

**Expected:** editor preview renders the generic layout, ring/click work, `n / total` updates.

### Task 1 completion contract

- `app/lib/pagination.test.ts` exists and ran; task-done command:
  `docker compose exec app npm run test` → full suite green (new pack tests + existing 101).
- `docker compose exec app npm run lint` → no new errors. `docker compose exec app npm run build` → exit 0.
- No deviations without a ledgered `Ruling:`.

---

## Task 2: Surfaces — slide preview, single print path, relabel, e2e

**Files:**
- Modify: `app/cvs/[id]/preview/page.tsx`
- Modify: `app/components/ui/EditorialChrome.tsx`
- Create: `e2e/pagination.spec.ts`
- Maybe-extend: `e2e/preview-page.spec.ts`

**Consumes:** Task 1's `CVPreview` (generic blocks, preserved props, `data-cvkey`, `.cv-page`/`.cv-measurer`/`.cv-block` CSS).

### Step 1: `app/cvs/[id]/preview/page.tsx` — slide + live print

1. Remove the `showPrint` state (`setShowPrint` currently at line 34) and delete `handlePrint` (lines 75-100).
2. Header actions: "Print / Save PDF" button → `onClick={() => window.print()}` (rename handler `handlePrint` to `handlePrintClick` or inline).
3. Main preview tree (currently at line 159): `showAllPages={false}` (drop the `showPrint` indirection). Wrap the whole non-print chrome (Header, Breadcrumb, main slide incl. side nav buttons, bottom pill) in `.no-print` containers, or add `.no-print` to these wrappers. The main slide is hidden in print.
4. Add keyboard support: `useEffect` adds `keydown` listener for `ArrowLeft`/`ArrowRight` (and `PageUp`/`PageDown`) that calls the existing prev/next setters; remove listener on cleanup.
5. `#cv-print-area` stays as the live all-pages tree: `<div id="cv-print-area" className="hidden print:block no-print...">` — actually keep `hidden print:block` and pass `showAllPages={true}` with all the CV data (unchanged). Because the entire app except `#cv-print-area` is `.no-print` in print media, only this tree prints.

**Expected:** In-app: `/cvs/:id/preview` shows one A4 page; side arrows, bottom pill, and keyboard arrows turn pages; `currentPage+1 / totalPages` is correct. Ctrl+P shows only the live all-pages tree, one sheet per page, no chrome, no measurer, no double margins.

### Step 2: `app/components/ui/EditorialChrome.tsx` — relabel

Change the export button label `PDF` (line 75) to `Quick PDF`. Prop `onExportPdf` and the react-pdf handler stay untouched. (`Quick PDF` signals it will not match the preview, per spec §8.)

**Expected:** `npm run build` exit 0.

### Step 3: Write `e2e/pagination.spec.ts` (API-seeded)

Mirror `e2e/cv-list.spec.ts`'s API seeding (create a CV via the API, then drive the UI). Tests:

1. **Splits into multiple A4 pages** — seed a CV whose experience `details` contain 30+ newline-separated long bullets (each ~10 words so it wraps). `page.goto('/cvs/${id}/preview')`, `page.locator('.cv-page')` count > 1.
2. **No page overflows its own box** — `$$eval('.cv-page', els => els.map(e => e.scrollHeight - e.clientHeight))`, every value ≤ 1.
3. **Pages stay white in dark mode** — `page.emulateMedia({ colorScheme: 'dark' })`; first `.cv-page` `backgroundColor` computed style is `rgb(255, 255, 255)`.
4. **Printed PDF page count equals preview page count** — `const previewCount = await page.locator('.cv-page').count()`; `await page.emulateMedia({ media: 'print' })`; `const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })`; count `/\/Type\s*\/Page[^s]/g` occurrences in the latin1 string; equals `previewCount`.
5. **Measurer hidden in print** — `page.emulateMedia({ media: 'print' })`; `page.locator('.cv-measurer')` is hidden; likewise the print-area is visible while the slide is `.no-print` hidden.
6. **(Slide)** — on the live route, `page.locator('.cv-page').count()` is 1 (single-page slide); click the prev/next buttons (or press ArrowRight) and assert `currentPage+1 / totalPages` counter text changes.

Selector conventions: real labels ("Print / Save PDF", "Previous page"/"Next page" aria-labels, the `n / total` span). Do not weaken assertions to pass.

**Expected:** `docker compose up -d --build app && docker compose restart app`, then `docker compose exec app npm run test:e2e -- e2e/pagination.spec.ts` → all pass.

### Step 4: Full e2e sweep + lint + build

Run the whole suite: `docker compose exec app npm run test:e2e`. Expected: pagination spec green + existing specs green (tailor.spec is allowed to remain env-failed while the Ollama server on evo is down — record PASS/FAIL as-is and note it in the report; do NOT fix it).

Also run `docker compose exec app npm run lint` (no new errors) and `npm run build` (exit 0) once more over the finished tree.

### Step 5: Manual test report (M1-M10, adapted)

Browser (host) against port 5252, record pass/fail for each:
- M1 Empty CV → one white A4 page, header placeholders.
- M2 Existing CV (or recreated with ~2 pages of content) → flows to page 2 without overlap.
- M3 Type into Experience details past 1 page, then delete → page count changes live.
- M4 Add 30 skills → extra pages; "Technical Skills" heading stays with an item.
- M5 Bottom of every page → no cut text, no heading alone at bottom.
- M6 DevTools `prefers-color-scheme: dark` → pages stay white.
- M7 Print → Save as PDF (Headers/footers off, margins default) → PDF page count == on-screen count, no double margins.
- M8 Print preview → header/buttons/measurer absent.
- M9 Flex row (company/period) + list bullets present in the PDF.
- M10 Web fonts loaded → no overflow after fonts load (repagination OK).

### Task 2 completion contract

- `e2e/pagination.spec.ts` exists and all its tests pass against the baked build.
- Full e2e sweep recorded (tailor.spec env-fail noted, not fixed).
- Manual M1-M10 recorded in the report.
- `npm run lint` no new errors; `npm run build` exit 0.
- No deviations without a ledgered `Ruling:`.

---

## Definition of done

- All steps in Task 1 and Task 2 complete and verified with the commands above.
- Full unit suite green (pack tests + existing), lint no new errors, build exit 0, e2e green except documented env-fail.
- CHANGELOG entry added; versioned release via `~/.agents/scripts/release.sh --patch`; central changelog on evo skipped (host down) and noted.
- Final branch review performed.

## Rollback

Changes confined to the files above. Restore prior behavior: `git checkout -- app/globals.css app/components/CVPreview.tsx app/components/CVPreviewWrapper.tsx "app/cvs/[id]/preview/page.tsx" app/components/ui/EditorialChrome.tsx` and delete `app/lib/pagination.ts`, `app/lib/pagination.test.ts`, `app/hooks/usePagination.ts`, `e2e/pagination.spec.ts`.