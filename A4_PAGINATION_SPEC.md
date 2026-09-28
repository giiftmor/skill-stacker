# Spec: Measured A4 Pagination and Print to PDF

Audience: the coding assistant working in the Spectres | Skill Stack repo (Next.js 15, React, TypeScript, Tailwind v4).
Work through the sections in order. Do not skip the verification steps. Report results at the end using the template in section 9.

## 1. Goal

1. The on-screen CV preview is split into real A4 pages that update live as content grows.
2. "Export as PDF" (react-to-print, then "Save as PDF") produces a PDF that matches the preview page for page.
3. No dark background bleed, no clipped content, no duplicated content across pages.

## 2. Root causes being fixed

| Symptom | Cause | Fix |
|---|---|---|
| Dark band and unreadable text in print | `globals.css` sets `--background` to `#0a0a0a` under `prefers-color-scheme: dark`, and `body` uses `color: var(--background)` | Force white on `.cv-page`, force white in print CSS, fix the body color |
| Only 2 pages | One continuous div, no page structure, `w-{240mm}` and `min-h-{297mm}` are invalid Tailwind so they do nothing | Measure real block heights, pack blocks into fixed A4 pages |
| Awkward breaks | Browser decides where to cut | Pages are pre-split, each `.cv-page` is exactly one sheet |
| Doubled margins | `@page` margin plus page padding | `@page { margin: 0 }`, margin comes only from `.cv-page` padding |

## 3. Design

* One paginated DOM is used for both screen and print, so they match by construction.
* A hidden "measurer" container renders every block at the real inner page width (180mm). Real heights are read with `getBoundingClientRect`, then blocks are greedily packed into pages of 267mm usable height (297mm minus 15mm top and bottom padding).
* Section headings are attached to the first item of their section so a heading never sits alone at the bottom of a page.
* Blocks use padding, never margin, because margins are not included in measured height.
* Existing `@react-pdf/renderer` export is left untouched in this task (see section 8).

## 4. Files to change

1. `app/globals.css`
2. `app/hooks/usePagination.ts` (new)
3. `app/components/CVPreview.tsx`
4. `app/components/CVPreviewWrapper.tsx`
5. `app/components/CVBuilderApp.tsx` (verify only, see 4.5)

### 4.1 `app/globals.css`

Replace the existing `body` rule with the first block, then append the rest. Keep the existing `h1.user-name`, `.heading_1`, `.normal-text`, `.institution-name`, `.professional-title` rules.

```css
body {
  background: #e5e7eb;
  color: var(--foreground);   /* was var(--background), which caused unreadable text in dark mode */
  font-family: 'century-gothic', sans-serif;
}

/* The CV never inherits dark mode */
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

@page { size: A4; margin: 0; }

@media print {
  html, body {
    background: #fff !important;
    color: #000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cv-page {
    margin: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }
  .cv-page:last-child { break-after: auto; page-break-after: auto; }
  .cv-measurer, .no-print { display: none !important; }
}
```

Remove the older `@page { margin: 15mm }` rule and any print rules that conflict with the above.

### 4.2 `app/hooks/usePagination.ts` (new)

```ts
import { useCallback, useLayoutEffect, useRef, useState } from "react";

const MM = 96 / 25.4;
const PAGE_INNER_PX = (297 - 30) * MM; // usable height per page

function pack(heights: number[]): number[][] {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((h, i) => {
    const current = pages[pages.length - 1];
    if (used + h > PAGE_INNER_PX && current.length > 0) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(i);
    used += h;
  });
  return pages;
}

export function usePagination(blockCount: number) {
  const measurerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([
    Array.from({ length: blockCount }, (_, i) => i),
  ]);

  const measure = useCallback(() => {
    const el = measurerRef.current;
    if (!el) return;
    const heights = Array.from(el.children).map(
      (c) => (c as HTMLElement).getBoundingClientRect().height,
    );
    const next = pack(heights);
    // Returning prev when equal prevents render loops
    setPages((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
    );
  }, []);

  // Measure after every render: text edits that change wrapping but not
  // block count must still repaginate. Safe because setPages bails out on equality.
  useLayoutEffect(() => {
    measure();
  });

  useLayoutEffect(() => {
    const el = measurerRef.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    document.fonts?.ready.then(measure); // re-measure once web fonts load
    return () => ro.disconnect();
  }, [measure, blockCount]);

  return { measurerRef, pages };
}
```

### 4.3 `app/components/CVPreview.tsx`

Convert the component body to build an array of `blocks`, then render that array twice: once in the hidden measurer, once into visible `.cv-page` divs. Remove the outer `bg-white ... shadow` wrapper classes and the invalid `w-{240mm}` and `min-h-{297mm}` classes.

```tsx
import type { ReactNode } from "react";
import type { CVPreviewProps } from "../types/global";
import FormattedText from "./FormattedText";
import { usePagination } from "../hooks/usePagination";

const CVPreview = ({
  personal, profile, competency, experiences, education,
  certificate, skill, reference, additionalInfo, previewRef,
}: CVPreviewProps) => {
  const blocks: ReactNode[] = [];

  // Heading travels with the first item so it never sits alone at a page bottom
  const section = (title: string, items: ReactNode[]) =>
    items.forEach((item, i) =>
      blocks.push(
        <>
          {i === 0 && <h2 className="heading_1">{title}</h2>}
          {item}
        </>,
      ),
    );

  blocks.push(
    <header className="flex flex-col items-center">
      <h1 className="user-name">{personal.fullName || "Your Name"}</h1>
      <p className="professional-title">{personal.title || "Your Professional Title"}</p>
      <div className="normal-text space-x-4">
        {[personal.phone, personal.email, personal.location].filter(Boolean).join("  |  ")}
      </div>
    </header>,
  );

  if (profile) blocks.push(<p className="normal-text">{profile}</p>);

  const comps = competency.filter(Boolean);
  if (comps.length)
    section("Core Competencies", comps.map((c) => <li className="normal-text ml-5 list-disc">{c}</li>));

  const exps = experiences.filter((e) => e.company || e.role);
  section("Career History", exps.map((exp) => (
    <div>
      <div className="flex justify-between">
        <h3 className="institution-name">{exp.company}</h3>
        <span className="text-sm text-gray-600">{exp.period}</span>
      </div>
      <h4 className="text-gray-800 mb-2">{exp.role}</h4>
      {exp.details && <FormattedText className="normal-text">{String(exp.details)}</FormattedText>}
    </div>
  )));

  const eds = education.filter((e) => e.institution || e.qualification);
  section("Education & Qualifications", eds.map((ed) => (
    <div>
      <div className="flex justify-between">
        <h3 className="institution-name">{ed.institution}</h3>
        <span className="text-sm text-gray-600">{ed.period}</span>
      </div>
      <h4 className="text-gray-800">{ed.qualification}</h4>
    </div>
  )));

  const certs = certificate.filter((c) => c.name || c.date);
  section("Certificates", certs.map((c) => (
    <p className="normal-text"><strong className="uppercase">{c.name}</strong> ({c.date})</p>
  )));

  const skills = skill.filter(Boolean);
  section("Technical Skills", skills.map((s) => <li className="normal-text ml-5 list-disc">{s}</li>));

  const refs = reference.filter((r) => r.name || r.company);
  section("References", refs.map((r) => (
    <div className="normal-text flex flex-col">
      <strong>{r.name}</strong><span>{r.role}</span><span>{r.company}</span>
      <span>{r.email}</span><span>{r.phone}</span>
    </div>
  )));

  const extra = additionalInfo.filter(Boolean);
  section("Additional Information", extra.map((t) => <p className="normal-text">{t}</p>));

  const { measurerRef, pages } = usePagination(blocks.length);

  return (
    <div ref={previewRef}>
      {/* Hidden: real heights come from here */}
      <div className="cv-measurer" ref={measurerRef} aria-hidden>
        {blocks.map((b, i) => <div key={i} className="cv-block">{b}</div>)}
      </div>

      {/* Visible A4 pages */}
      {pages.map((idxs, p) => (
        <div key={p} className="cv-page">
          {idxs.map((i) => <div key={i} className="cv-block">{blocks[i]}</div>)}
        </div>
      ))}
    </div>
  );
};

export default CVPreview;
```

Notes for the implementer:

* Keep `previewRef` typed as it is in `CVPreviewProps`.
* Bullet `<li>` items rendered outside a `<ul>` are intentional (one block per item). Keep `ml-5 list-disc`.
* If lint complains about missing keys on fragments, they are only ever placed inside keyed `.cv-block` wrappers, so no change is needed.

### 4.4 `app/components/CVPreviewWrapper.tsx`

1. Replace `pageStyle` with:

```tsx
pageStyle: `
  @page { size: A4; margin: 0; }
  html, body { background: #fff !important; color: #000 !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`,
```

2. Keep `<div ref={printRef}><CVPreview {...props} /></div>`.
3. Delete the `<style jsx>` block. The `.no-print` rule now lives in `globals.css`.
4. Keep the Export as PDF button inside a `no-print` container.

### 4.5 `app/components/CVBuilderApp.tsx` (verify only)

* Confirm `CVPreviewWrapper` still receives all props including `previewRef`.
* Confirm no ancestor of the preview sets `overflow: hidden` or a fixed `height`. Those constrain the print root and were part of the "only 2 pages" symptom. Remove them if present.
* Note: `CVBuilderApp.tsx` uses hooks and has no `"use client"` directive. It works today because `page.tsx` imports it under a client boundary, but add `"use client";` at the top since it now depends on layout effects through its children.

## 5. Optional screen scaling

The A4 page is about 794px wide, and the preview column may be narrower. For screen only, wrap the pages:

```tsx
<div style={{ zoom: 0.8 }}> ... pages ... </div>
```

Do not apply zoom to the print root. If `zoom` causes problems in Firefox, use `transform: scale()` with a matching container height. The measurer must stay outside the scaled wrapper.

## 6. Manual test plan

Run `npm run dev`. Use Chrome. For every check, record pass or fail.

| # | Test | Expected |
|---|---|---|
| M1 | Empty form | One white A4 page, header placeholders visible |
| M2 | Load a CV with roughly 2 pages of content (use the Tsholofelo Tshweu CV data) | Pages appear as separate sheets, content flows to page 2 without overlap |
| M3 | Type into Experience details until the CV grows past 1 page, then delete text | Page count increases and decreases live, no reload |
| M4 | Add 30 skills | Extra pages appear, "Technical Skills" heading stays with at least one item |
| M5 | Look at the bottom of every page | No text cut in half, no heading alone at a page bottom |
| M6 | Set OS or DevTools to prefers-color-scheme: dark | Pages stay white, text stays dark, no black bands |
| M7 | Click Export as PDF, choose Save as PDF, uncheck Headers and footers, margins Default or None | PDF page count equals on-screen page count, layout matches, no double margins |
| M8 | Print dialog preview | App header, buttons, and the hidden measurer do not appear |
| M9 | Tailwind utilities in the PDF (flex row for company and period, list bullets) | Present in the PDF |
| M10 | Wait for web fonts to load, then check pagination | No page shift after fonts load (repagination is allowed, overflow is not) |

## 7. Automated tests (Playwright)

Install if missing: `npm i -D @playwright/test && npx playwright install chromium`.

Add a test hook: the app must be able to load a long fixture CV. Simplest option is a dev-only query param or seeding via the existing save and load API. If neither is available, have the test fill the form fields through the UI.

`tests/pagination.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const longText = Array.from({ length: 40 }, (_, i) => `Bullet point number ${i} with enough words to wrap onto a second line in the page.`).join("\n");

async function fillLongCv(page) {
  await page.goto("/");
  await page.getByLabel("Full name").fill("Test Candidate");
  await page.getByRole("button", { name: "Work Experience" }).click();
  await page.getByPlaceholder("Company").fill("Acme");
  await page.getByPlaceholder("Role").fill("Engineer");
  await page.getByPlaceholder("Details / Achievements").fill(longText);
}

test("preview splits into multiple A4 pages", async ({ page }) => {
  await fillLongCv(page);
  const pages = page.locator(".cv-page");
  await expect(pages).not.toHaveCount(1);
});

test("no page overflows its own box", async ({ page }) => {
  await fillLongCv(page);
  const overflow = await page.$$eval(".cv-page", (els) =>
    els.map((e) => e.scrollHeight - e.clientHeight),
  );
  for (const o of overflow) expect(o).toBeLessThanOrEqual(1);
});

test("pages stay white in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await fillLongCv(page);
  const bg = await page.locator(".cv-page").first().evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).toBe("rgb(255, 255, 255)");
});

test("printed PDF page count equals preview page count", async ({ page }) => {
  await fillLongCv(page);
  const previewCount = await page.locator(".cv-page").count();
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pdfPages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pdfPages).toBe(previewCount);
});

test("measurer and no-print elements are hidden in print", async ({ page }) => {
  await fillLongCv(page);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".cv-measurer")).toBeHidden();
});
```

Adjust selectors to the real labels if they differ. Selector fixes are allowed. Weakening an assertion to make a test pass is not allowed. If a test fails for a product reason, report it.

## 8. Out of scope and known limitations

* The `@react-pdf/renderer` export (`exportModule.tsx`) is separate and will not match the preview. Do not modify it in this task. Recommend relabelling its button "Quick PDF" in the report, but leave the decision to the owner.
* Blocks are atomic. A single block taller than one page (a very long experience entry) will be clipped. Mitigation if needed: split `exp.details` into one block per paragraph or bullet inside the `section()` call. Only do this if test M2 or the overflow test shows clipping.
* Two known bugs unrelated to this task, do not fix silently: `ReferencesForm.tsx` has class typos (`roundref-md`, `font-mrefium`), and `exportToDocx` maps `reference` as strings although references are objects.

## 9. Definition of done and report template

Done means: all changes in section 4 applied, `npx tsc --noEmit` and `npm run lint` show no new errors, manual tests M1 to M10 recorded, and Playwright tests pass.

Report back in this format:

```
Files changed: <list>
tsc: pass/fail (<new errors if any>)
lint: pass/fail
Manual: M1 pass, M2 pass, ... (note any failure with a screenshot description)
Playwright: X of 5 passing (paste failures)
Deviations from spec: <anything you changed and why>
Open issues: <anything found but not fixed>
```

## 10. Rollback

All changes are confined to the five files above. `git checkout -- app/globals.css app/components/CVPreview.tsx app/components/CVPreviewWrapper.tsx` and delete `app/hooks/usePagination.ts` restores the previous behavior.
