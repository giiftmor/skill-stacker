# Frontend Rebuild — Guided + Editorial "Studio" UX (Light Theme)

## Goal

Replace the current dark, form-centric CV-builder interface with a **light, calm, artifact-first studio** for a career consultancy's staff. The consultant should be able to (a) capture a client's resume quickly via a guided flow, (b) review and polish it as a real A4 document, (c) augment it with guarded AI tailoring, and (d) see what still needs work at a glance. The visual language flips from gold-on-black dashboard to a paper-white canvas with a teal accent and an editorial serif for headings.

Three workspaces replace the current five screens:

- **A · Roster** (`/cvs` + root redirect) — every client CV as a status queue (readiness dots, A4 thumbnails, filter chips).
- **B · Guided Capture** (`/cvs/new`) — 4-step wizard (*You → Work → Education & Skills → Style*) that hands off into the editor. Optional: captured data is always editable later; Skipping is allowed and surfaces unfinished sections as readiness cards.
- **C · Editorial Editor** (`/cvs/[id]/edit`) — the A4 resume is the canvas; a chrome bar on top, an inspector rail on the right (template/theme, section readiness, Tailor-for-job). Editing is inline per section. The separate full-screen preview page is restyled but retained.

The backend, data model, export pipeline, auto-save, version history, and the CVPreview pagination engine are reused unchanged. This is a presentation/IA rework plus two small, safe additions (readiness summary in the list API; a generic per-section rewrite endpoint).

## Context (current state)

- **Visual system**: near-black surfaces (`#0d0d0d` bg, `#1a1a1a` cards, `#333` borders) with a gold `#d4a853` accent. Hardcoded hex Tailwind classes inline everywhere — no design tokens. `body` uses `century-gothic` (Typekit import in `globals.css`). `--font-heading` is referenced throughout (`font-[family-name:var(--font-heading)]`) but **never defined** in `layout.tsx`/theme, so heading type silently falls back.
- **Screens**: `/` landing hero; `/cvs` card grid with `Edit/Preview/Delete` (delete uses raw `confirm()`); `/cvs/new` template chooser with duplicate live preview; `/cvs/[id]/edit` = TailorPanel on top + 2×2 grid (accordion of 9 forms | live A4 preview) + a redundant manual "Save to Database" button; `/cvs/[id]/preview` = full-page A4 with arrows + Print.
- **Editor heart (`app/cvs/[id]/edit/page.tsx`)**: all CV state (personal/profile/competency/experiences/education/certificate/skill/reference/additionalInfo) lives in one page component and flows into `CVBuilderForm` (accordion) and `CVPreviewWrapper`. `useAutoSave` (30s debounce) persists via `PUT /api/cv/:id`. Tailor panel streams SSE diffs; `applyDiff` mutates the same state then autosaves.
- **Reusable assets**: `CVPreview` (section-aware A4 pagination — the strongest asset today), `TemplateSelector` (7 templates × themes × font pairs), `SaveIndicator`, `VersionHistory` (modal), `DiffSection` (Apply/Reject with fabrication-guard note), all nine `app/components/Forms/*` (data-bound inputs), `useAutoSave`, `app/lib/tailor/*` (scrape → extract → rewrite with no-fabrication guard), `app/lib/export/*`.
- **Backend**: `GET /api/cv` returns summary fields only (id, full_name, title, email, updated_at). No readiness/completeness signal anywhere. `POST /cv` requires a full empty payload on create. No auth layer (local/internal tool).
- **Content data**: `cvs` row + child tables (`experiences`, `education`, `competencies`, `skills`, `certificates`, `reference_list`, `additional_info`) + `cv_photos` + `template_settings` (jsonb). `cv_versions` (jsonb snapshots) used by History.
- **Tests**: Vitest unit (21+ passing), 5 Playwright e2e specs (selector-heavy — will need updates). Lint debt: 220 pre-existing Biome errors across ~80 files deferred (AGENTS.md). All commands run via `docker compose exec app`.

## Design Decisions (user-approved)

1. **Primary user = consultant staff only.** No client-facing sign-in. Speed and at-a-glance status for repeat use, but a calm, crafted, trustworthy surface.
2. **Direction = Blend A + B**: a guided capture flow that lands the consultant in an artifact-first editorial editor. The A4 document is the working surface.
3. **Light theme**: paper-white/cream; warm charcoal ink; single teal accent `#0f766e`; status green/amber/slate reserved for readiness only. Editorial serif headings (Fraunces) + Mulish UI body. Fix the `--font-heading` token instead of working around it.
4. **Three workspaces**, not five: Roster, Guided Capture, Editorial Editor. `/cvs/[id]/preview` retained (restyled) so existing links/e2e keep working; the editor becomes the primary review surface.
5. **Inline, not accordion**: clicking a rendered section opens an in-place editor bound to the same state (reusing the existing `Forms/*` bodies). No contentEditable; the preview always re-renders from live state.
6. **AI location**: Tailor-for-job moves into the inspector rail (same SSE pipeline, same guard, same Apply/Reject). A new small per-section `rewrite` endpoint powers both "polish this section/bullet" in the editor and "Suggested summary" in Guided Capture.
7. **Readiness signaling**: new lightweight, derivable `readiness` score (section-level + per-CV summary) computed from existing content — no new columns for the metric itself. One additive boolean `ready_override` column carries the manual "mark ready" decision (idempotent `ADD COLUMN IF NOT EXISTS`, matching the existing `template_settings` migration style).
8. **Non-blocking deletions & confirms**: kill raw `confirm()`; use inline popover confirms / toast-undo.
9. **Scope restraint**: no auth, no client-embedded sharing, no new templates, no cover letters, no reordering engine. Presentation/IA rework on a stable core.
10. **Completeness metric is advisory** (data-driven, never blocks): "80% ready" informs queueing, not gating.

## Architecture

### 0. Design tokens & typography (`app/globals.css`, `app/layout.tsx`)

- Define `@theme` colors in Tailwind v4 style: `--color-canvas` (app background `#f6f4ef`), `--color-desk` (editor workspace backdrop `#efede8`, slightly darker than canvas so the white page pops), `--color-surface` (`#ffffff`), `--color-ink` (`#1c2520`), `--color-muted` (`#6b7280`), `--color-faint` (`#9ca3af`), `--color-hairline` (`#e6e3dd`), `--color-accent` (`#0f766e`), accent-soft (`#eef4f3`), plus status tokens (green `#15803d`, amber `#b45309`, slate).
- Add Google font `Fraunces` for headings; set `--font-heading: "Fraunces", Georgia, serif`. Body font → Mulish (already imported, unused). Set `--font-sans` accordingly. Keep printing rules (`@page`, print colors) intact — they must not regress PDF/print fidelity.
- Home the new shared chrome (buttons, chips, fields, dots) as reusable utility classes or small components — no new CSS framework.

### A · Roster (`/cvs` + `/` redirect; new `app/components/ui/Roster.tsx`)

- Left rail: brand + nav (Client CVs / Export queue / AI tailor log). Export queue + tailor log may be placeholders for now (see Out of scope) — do not build empty dead screens; keep the rail minimal with only what exists.
- Main: filter chips (All / Drafting / Ready to send), CV rows with small A4 thumbnail (mini section-bar preview), name + headline + page count, readiness pill, and per-CV thin page-progress bars. Row actions: **Open** (→ editor), overflow **Delete** (inline popover confirm), **Duplicate**, quick **PDF**.
- Status derivation: `ready` = all standard sections non-empty **∨** manual "Mark ready" override (`ready_override`); `drafting` = some content; `empty` = no content. Sort by updated_at desc; empty-state becomes a two-step "start your first client CV" explainer.
- **Mark ready**: the row overflow menu offers "Mark ready" / "Clear ready mark", toggling `ready_override` via a tiny `POST /api/cv/[id]/ready` route (updates only that column). The toggle also lives in the editor chrome so a consultant can flip a CV to Ready the moment the client confirms. Override is orthogonal to the data-derived readiness — the pill shows the effective status and a subtle "manual" tag when overridden.
- Data: extend `GET /api/cv` → include per-CV `sections: string[]` (non-empty section keys) and a computed `readiness` percent. List stays cheap (no thumbnail render server-side; thumbnails are CSS-generated from section presence).

### B · Guided Capture (`/cvs/new`; new `app/components/capture/`)

- `GuidedCapture.tsx` orchestrates a 4-step stepper (You / Work / Education & Skills / Style). Step order persists "later fills become sections" (Skip allowed → lands in editor with readiness cards for the skipped sections).
- Stepper: numbered pills + connector lines + percent meter ("60% complete"), reusing the readiness helper. Completed steps show ✓; step content is one concern per screen with a live mini-preview column (a compressed `.mini` version of CVPreview driven by the same state as entered so far).
- **You**: reuse `PersonalInfoForm` + `UploadPhoto` + one-line summary with a "✨ Suggest a summary" action (calls the new rewrite endpoint with an empty/short draft; guard against fabricating facts not yet in fields).
- **Work**: reversed chronological timeline editor (compact role/company/period + paste-friendly multi-bullet `details`), reusing `ExperienceForm` internals.
- **Education & Skills**: chip-style skills input (reuse `SkillsForm` internals) + `EducationForm`.
- **Style**: `TemplateSelector` (existing) restyled as a horizontal film-strip of A4 thumbnails + theme swatches + font pairs; drives a live sample preview.
- Handoff: "Open in Editor →" creates the record via existing `POST /api/cv` (empty-capable payload) with `templateSettings`, then `router.push('/cvs/[id]/edit')`. No duplicate "live preview + continue" duplication as today.

### C · Editorial Editor (`/cvs/[id]/edit`; new components)

- **Chrome bar** (`app/components/ui/EditorialChrome.tsx`): inline-editable CV name, `SaveIndicator` (existing), History (existing `VersionHistory` modal), Export (PDF/DOCX via existing `exportDispatcher`), "Back to CVs". No standalone browse step.
- **Canvas**: centered A4 page (`--color-surface`) on the `--color-desk` workspace backdrop. Reuse `CVPreviewWrapper` pagination as-is; page controls (prev/next, page count) move to a slim floating control under the page.
- **Inline editing** (`app/components/ui/SectionEditor.tsx`): clicking a rendered section (or its empty-state "+") swaps that section's area for an editor overlay bound to the page state — wraps each existing `Forms/*` component — with Save / Cancel. Editing never forks state; the canvas re-renders live. Section identity comes from the same section keys `CVPreview` already produces (`summary`, `experience:*`, etc.).
- **Inspector rail** (`app/components/ui/InspectorRail.tsx`): collapsible panel containing (1) Template / Theme / Font (`TemplateSelector` content), (2) **Section readiness checklist** — each section with a dot (full/half/none) and, for incomplete ones, a one-line "Add?" affordance that jumps to inline edit, (3) **Tailor-for-job** card: job-ad URL/text input → SSE pipeline → diffs render **inline against the canvas** (the affected section highlights; `DiffSection` Apply/Reject; fabricated-content guard note as today). On narrow widths the rail collapses to a drawer — the page must not squeeze (no 4-col grid).
- **Per-section AI** (`app/api/tailor/rewrite/route.ts`, reused by B and C): `POST { section, text, instruction? }` → runs the existing rewrite + no-fabrication guard in `app/lib/tailor/tailor.ts` against the model env, returns one diff (`{ original, proposed, guardNote? }`). Editor offers "✦ AI rewrite" on a section/bullet; tapped → proposal renders as the same inline `DiffSection` bubble.
- **Command menu** (`app/components/ui/CommandMenu.tsx`): "/" or Cmd/Ctrl+K palette — jump to section, Export PDF/DOCX, Back to roster. Lightweight; no external dep.
- **Remove** the second "Save to Database" button and the buried `currentCvId` indicator — autosave + indicator already cover persistence.
- **Preview page** (`/cvs/[id]/preview`): restyled to the new theme; `showAllPages` print path unchanged.

### D · Readiness (`app/lib/readiness.ts`, pure + tested)

- `sectionReadiness(sectionKey, data)` → `'none' | 'partial' | 'full'` from non-null, non-empty content (weighted: e.g., experience details bullet count).
- `cvReadiness(data)` → `{ percent, sections: Array<{key,label,state}> }`. Single source used by Roster (server-side JSON mirrors it), Capture meter, and Inspector checklist.
- Server: `GET /api/cv` computes the same percent from stored JSON in one pass and returns `ready_override`. Persistence for the manual override (`POST /api/cv/[id]/ready` → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ready_override BOOLEAN DEFAULT false` + single-column `UPDATE`) is the only schema touch.

## Error handling / edge cases

- **Capture handoff/API failure** → inline error banner on the handoff button; data stays in-memory; retry.
- **Skipped capture steps** → the CV is created (permissive), skipped sections render as empty-state "+" rows; readiness card says "Add?" — never a hard gate.
- **Inline editor save** → same mutation path as typing (state → autosave). No partial-write risk beyond existing autosave semantics.
- **Tailor mid-edit conflict** → as today: proposal marked stale if the live field changed since proposal; not auto-applied.
- **Rewrite endpoint with empty/stale section** → guard returns "no safe change"; UI shows a soft no-result state (reuse existing "No safe changes suggested." wording).
- **Print/export fidelity** → new theme must not leak into paper: `@media print` overrides (white bg, no shadows) are retained and the A4 page classes are untouched.
- **Missing photo / template settings** → same defensive defaults as today (`resolveColors`/`resolveFontPair` fallbacks).

## Testing

- **Unit (Vitest)**:
  - `readiness`: none/partial/full classification, percent math, empty-CV and full-CV boundaries.
  - `tailor/rewrite`: endpoint returns validated single diff; guard rejects invented facts (reuses existing guard tests); empty input → soft no-result.
  - Existing suite must stay green (calculatePages, templates, log, etc.).
- **E2E (Playwright)**:
  - Update existing 5 specs (selector drift: roster rows, editor chrome, template chooser).
  - New: roster shows status dots and opens CV; Guided Capture create→editor handoff persists; inline section editing updates the canvas live then autosaves; inspector Tailor Apply flows into state; delete uses inline confirm (no `confirm()` dialog); "/" command menu navigates; readiness meter reflects entered data.
- **Manual**: multi-page PDF fidelity after theme change; light-mode contrast audit; print from preview; narrow-width drawer behavior.

## Files touched

New:
- `app/components/ui/Roster.tsx`, `EditorialChrome.tsx`, `InspectorRail.tsx`, `SectionEditor.tsx`, `CommandMenu.tsx`
- `app/components/capture/GuidedCapture.tsx`, `CaptureStepper.tsx`, `StepPersonal.tsx`, `StepWork.tsx`, `StepEducation.tsx`, `StepStyle.tsx`
- `app/lib/readiness.ts` (+ `__tests__/readiness.test.ts`)
- `app/api/tailor/rewrite/route.ts`
- `app/api/cv/[id]/ready/route.ts` (toggle `ready_override` column)
- `e2e/roster.spec.ts`, `e2e/guided-capture.spec.ts`, `e2e/inline-editing.spec.ts` (new flows; existing specs updated for selector drift)

Modified:
- `app/globals.css` (tokens + fonts + token fix), `app/layout.tsx` (font vars)
- `app/page.tsx` (redirect to `/cvs`)
- `app/cvs/page.tsx` (roster), `app/cvs/new/page.tsx` (stepper), `app/cvs/[id]/edit/page.tsx` (editorial), `app/cvs/[id]/preview/page.tsx` (restyle)
- `app/components/CVBuilderForm.tsx` (retired/absorbed into SectionEditor; form components stay)
- `app/components/ui/Header.tsx` (superseded by EditorialChrome; kept for preview page)
- `app/api/cv/route.ts` (list → include readiness + non-empty sections), `app/lib/db.ts` (idempotent `ready_override` column)
- `e2e/*.spec.ts` (selector updates), any existing specs referencing removed copy

Not touched: `app/lib/tailor/*` core (reused), `app/lib/export/*`, `CVPreview` pagination core, API save/photo/versions routes, `Dockerfile`/`docker-compose.yml`.

## Out of scope (future)

- Client-facing access, sharing links, approvals from the client side (staff-only app).
- Full "Export queue" and "AI tailor log" rail destinations — v1 keeps them off-canvas or omits them rather than building dead screens.
- New resume templates, cover letters, auto-section reordering, applicant-tracking scoring.
- Resize/universal attachments beyond A4.
- Deep WYSIWYG (contentEditable/ProseMirror) — inline overlay editing is deliberate for fidelity and risk control.