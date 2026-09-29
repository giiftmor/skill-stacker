# Portal Edit Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/cvs/[id]/edit` into a portal-style workbench — slim app sidebar + sticky global header, a 4:8 Inspector | preview grid with exclusive auto-height accordions, a header "Actions" drawer rail, a docked pager, tokenized light/dark theming, and dialog-grade a11y — without touching the pagination/print machinery.

**Architecture:** Two invisible seams. (1) **Theming** — `[data-theme="dark"]` overrides the existing `--color-*` tokens in `app/globals.css`, so every token-conformant component re-themes for free; a new `ThemeProvider` sets the attribute, a `ThemeToggle` lives in the shell header. (2) **Shell** — a new `AppShell` (global header + 176px labeled sidebar) wraps the three real pages; the edit page keeps its page-local header surface (`EditorialChrome` reimplemented) for breadcrumb/name/save/Actions. The workbench itself is plain document flow (content-driven sizing: sticky header, no `100dvh` shell). Behaviors with real logic (accordion exclusivity, focus/dialog management) are extracted into tiny pure modules that unit tests can pin; the rest is verifiable JSX class restructure guarded by the existing Vitest suite + e2e bake.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4 (tokens via `@theme inline`), Vitest (jsdom), @playwright/test, Biome, lucide-react (present). No new runtime deps.

**Spec:** `docs/superpowers/specs/2026-09-29-portal-edit-redesign.md`. The mockup ``.superpowers/brainstorm/480127-1790666338/content/portal-accordions.html` is the visual source of truth (values frozen in the spec).

## Global Constraints

- All commands via Docker: `docker compose exec app npm run test`, `docker compose exec app npm run lint`, `docker compose exec app npm run build`, `docker compose exec app npm run test:e2e`. Never run host `npm`. E2E runs against the **baked production build** (port 5252) via `reuseExistingServer: true` — before e2e, run `docker compose up -d --build app`. At implementation start, follow the AGENTS.md session checklist (read `docker-compose.yml`, `.env`, `docker ps`, check port 5252).
- **Do NOT touch** any part of the pagination/print stack: `app/lib/pagination.ts`, `app/hooks/usePagination.ts`, `app/components/CVPreview.tsx` paginator logic, its public props contract, `.cv-page`/`.cv-measurer`/`.cv-block`/`.print-area`/`@media print`/`@page` CSS, `@react-pdf`/DOCX exporters, `app/components/templates/*`, `e2e/pagination.spec.ts`. `edit/page.tsx` keeps calling `CVPreview` with the exact same props today.
- Keep `data-testid="section-editor"` and `data-testid="section-save"` on the SectionEditor surface.
- Light is the default theme and the only value before T1's provider mounts. Dark never appears inside `.cv-page` (it sets its own bg/color).
- No new runtime dependencies. No comments in code unless required (Biome). No `contentEditable`.
- Lint must stay **net-neutral** on the current 208e/149w baseline — do not fix unrelated pre-existing warnings; do not add new ones. Vitest stays green (104 tests / 18 files) at every task boundary.
- Deviations from spec/plan must be ledgered as a `Ruling:` line added to the spec.
- CHANGELOG: add one `[Unreleased]` entry on completion; run `~/.agents/scripts/release.sh` when verified.

## Review Focus

- **Save/reload/restore flow intact** after restructure: editable name autosaves, VersionHistory restore, Mark ready toggle round-trips. Pins: existing unit suite (T2–T3), manual M1 (T3/T4), e2e smoke (T3).
- **Click-to-edit & section ring still open SectionEditor** from the rail, the canvas, and `/` command menu, with focus managed. Pins: `data-testid`s preserved (T4), manual M2 (T4).
- **Dark mode never bleeds into the CV sheet; print stays white.** `.cv-page`/print CSS untouched; a dark-hot `[data-theme="dark"]` still renders white pages. Pins: existing `e2e/pagination.spec.ts` dark-white assertion (every task), manual M3 (T2).
- **Exclusive accordions with correct default** (Checklist open, opening one closes the others, then collapses nothing when re-toggled). Pins: `exclusivePanel()` unit tests (T3).
- **Keyboard + AT package:** Escape closes every dialog/menu, focus restores to the opener, SaveIndicator announced. Pins: `useDialog` unit tests (T4), manual M4 (T4).

---

## Task 1: Theme tokens + ThemeProvider + ThemeToggle

**Files:**
- Modify: `app/globals.css` (tokens: add `[data-theme="dark"]` block + `color-scheme` + reduced-motion; keep lines 81–176 identical)
- Create: `app/components/providers/ThemeProvider.tsx`
- Create: `app/components/providers/ThemeProvider.test.tsx`
- Create: `app/components/ui/ThemeToggle.tsx`

**Interfaces:**
- Consumes: existing `--color-*` tokens in `app/globals.css`.
- Produces: `ThemeProvider` (react client component, renders `children`); sets/reads `document.documentElement.dataset.theme = "light" | "dark"`, persists to `localStorage["spectres:theme"]`, default light. `ThemeToggle` (`useThemeToggle()` internal): button ≥40px, `aria-label="Toggle color theme"`, sun (`Sun`) / moon (`Moon`) lucide icon, applies on click.

- [ ] **Step 1: Add the dark token block to `app/globals.css`** (after the `@theme inline` block)

Append exactly:
```css
html { color-scheme: light; }
[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #121714;
  --color-desk: #171d1a;
  --color-surface: #1b221e;
  --color-ink: #e8e6e3;
  --color-muted: #9aa6a0;
  --color-faint: #6b7570;
  --color-hairline: #29332d;
  --color-accent: #4ec4b6;
  --color-accent-soft: #1a302c;
  --color-status-good: #34d399;
  --color-status-warn: #f5a623;
}
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```
Do not modify anything below line 81 (`CV PREVIEW STYLES` onward).

- [ ] **Step 2: Write the failing ThemeProvider test** — `app/components/providers/ThemeProvider.test.tsx`

Vitest + jsdom (mirror `app/components/tailor/__tests__/*.test.tsx` style; render with `@testing-library/react` if used there, else plain `createRoot`). Assert:
1. default render applies no attribute and child renders;
2. `data-theme="dark"` pre-set on `<html>` is read on mount (no flash) — actually mount-time read: assert saved preference restores;
3. clicking the toggle flips `documentElement.dataset.theme` and writes `localStorage`.

- [ ] **Step 3: Run it to see it fail**

Run: `docker compose exec app npm run test -- app/components/providers/ThemeProvider.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `ThemeProvider` and `ThemeToggle`**

`ThemeProvider.tsx`: `useEffect` on mount — read `localStorage["spectres:theme"]` if it is `"light"|"dark"` else keep light; expose that state to children via the toggle's own `useEffect` selected by a shared module-level? Simplest: `ThemeToggle` reads/writes the DOM attribute directly (`document.documentElement.dataset.theme`, `localStorage`) — no context needed. `ThemeProvider` just owns the mount-time read for FOUC-free default. If you opt for context, keep the attribute + localStorage contract identical.

- [ ] **Step 5: Run the test to verify it passes**

Run: `docker compose exec app npm run test -- app/components/providers/ThemeProvider.test.tsx`
Expected: PASS.

- [ ] **Step 6: Verify no regressions + commit**

Run: `docker compose exec app npm run test && docker compose exec app npm run lint`
Expected: 104 tests green; lint error/warn deltas net-neutral (record baseline if first run).
Commit: `git add app/globals.css app/components/providers/ThemeProvider.tsx app/components/providers/ThemeProvider.test.tsx app/components/ui/ThemeToggle.tsx` → `git commit -m "feat: dark theme tokens + ThemeProvider + ThemeToggle"`

## Task 2: AppShell (portal header + slim sidebar) across the three pages

**Files:**
- Create: `app/components/ui/AppShell.tsx`
- Rewrite: `app/components/ui/Sidebar.tsx` (dead legacy → active slim sidebar, or fold into AppShell and delete)
- Modify: `app/layout.tsx` (wrap `children` in `ThemeProvider`)
- Modify: `app/cvs/page.tsx` (wrap in `AppShell`), `app/cvs/[id]/preview/page.tsx` (use AppShell header; replace `Header` usage), `app/cvs/[id]/edit/page.tsx` (wrap body in AppShell; loading screen tokens)

**Interfaces:**
- Consumes: `ThemeToggle` (T1).
- Produces: `AppShell({ children, active?: "cvs" | "edit" | "preview", title?: string })` — client component: flex row of `<AppSidebar/>` (176px labeled nav: `My CVs` → `/cvs` active-aware, `+ New CV` → `/cvs/new`, `Edit CV`/`Preview` only when `cvId` passed, plus `aria-disabled` "Coming soon" items Dashboard/Templates/Shared/Settings/Help) + main column: global `<header/>` (wordmark `Skill Stacker` + breadcrumb `CVs / {title}` via `Breadcrumb` + right cluster incl. `ThemeToggle`) then `children`. Emits `data-testid="app-shell"`.

- [ ] **Step 1: Extract the sidebar** — rewrite `app/components/ui/Sidebar.tsx` (or inline into AppShell): light-token voice, min 40px targets, `bg-surface border-r border-hairline`, active item `bg-accent-soft text-accent` + left accent bar, inactive `text-muted hover:bg-desk hover:text-ink`. Keep `usePathname()` active detection.
- [ ] **Step 2: Ensure this works — commit the shell** (shell compiles standalone before any page adopts it)
- [ ] **Step 3: Wire `ThemeProvider` into `app/layout.tsx`** `<body>` wraps `{children}`.
- [ ] **Step 4: Adopt shell on `/cvs`** — `app/cvs/page.tsx` wraps the `Roster`; fix the loading screen `bg-[#0d0d0d]` → `bg-canvas text-muted` in the edit page (it's the only hard-dark surface on a light page).
- [ ] **Step 5: Adopt shell on `/preview`** — replace `Header` import with AppShell; breadcrumb `CVs / {fullName}`.
- [ ] **Step 6: Adopt shell on the edit page** — wrap the workspace in `AppShell active="edit" cvId={cvId} title={personal.fullName}`; the page keeps its own `EditorialChrome` header (T3/T4 reimplements it).
- [ ] **Step 7: Verify + commit**

Run: `docker compose exec app npm run lint` (net-neutral) + `docker compose up -d --build app` then `docker compose exec app npm run test:e2e -- --reporter=line` (existing cv-list + template-selector specs exercise `/cvs` + create + edit). Manual **M3**: tab + set `[data-theme="dark"]` devtools on `documentElement`, confirm the CV sheet stays white. Expected: e2e green; M3 passes.
Commit: `git add -A` (as listed above) → `git commit -m "feat: portal AppShell across cvs/edit/preview pages"`

## Task 3: Edit workbench — 4:8 grid, accordion Inspector, tokenized Style/Tailor/Save

**Files:**
- Modify: `app/cvs/[id]/edit/page.tsx` (body grid; pager relocation pass-1; keep CVPreview props identical)
- Rewrite: `app/components/ui/InspectorRail.tsx` (accordions; keep its exported props signature)
- Modify: `app/components/ui/TemplateSelector.tsx` (tokenize + `grid-cols-2` card layout)
- Modify: `app/components/tailor/TailorPanel.tsx` (token palette swap only — component logic untouched)
- Modify: `app/components/ui/SaveIndicator.tsx` (tokens + aria-live + silent idle + copy)
- Create: `app/lib/accordion.ts` + `app/lib/accordion.test.ts`

**Interfaces:**
- Consumes: `exclusivePanel` (this task); `AppShell` (T2); unchanged `TailorPanel` props.
- Produces: `Panel = "checklist" | "style" | "tailor"` and `exclusivePanel(open: Panel | null, next: Panel): Panel | null` in `app/lib/accordion.ts` — pure single-open reducer: `null`+`next` → `next`; `same`+`same` → `null` (toggle off); `other`+`next` → `next` (swap). `InspectorRail` keeps its exported props signature and defaults the open panel to `"checklist"`. `SaveIndicator` keeps its `status` prop shape; copy/announcement changes only.

- [ ] **Step 1: Write failing accordion tests** — `app/lib/accordion.test.ts`

Assert: (a) `exclusivePanel(null, "checklist")` → `"checklist"`; (b) `exclusivePanel("checklist", "checklist")` → `null`; (c) `exclusivePanel("checklist", "style")` → `"style"`; (d) `exclusivePanel("style", "tailor")` → `"tailor"`. Run → FAIL (module missing).

- [ ] **Step 2: Implement `app/lib/accordion.ts`** and pass tests (mirror style of `app/lib/readiness.ts` pure helpers).

- [ ] **Step 3: Restructure the edit page body** — replace the `<div className="flex flex-1 justify-center gap-0 overflow-auto p-8 …">` with:
  `<div className="grid grid-cols-12 gap-6 px-8 py-6"><div className="col-span-4"><InspectorRail …/></div><div className="col-span-8"><div className="mx-auto …">CVPreview…</div></div></div>`
  Keep every `CVPreview` prop (and `PageNav` wiring) exactly as-is. Move `PageNav` marking its new home (T4 docks it).
- [ ] **Step 4: Rewrite `InspectorRail.tsx`** — three accordions using `exclusivePanel`; panel height animated with the `grid-template-rows: 0fr→1fr` recipe; headers: `Checklist · {n}/{total}`, `Style · {templateName}`, `Tailor · ready`; default open `"checklist"`; chevron in a `span aria-hidden` rotating with the open state; buttons ≥40px with `aria-expanded`/`aria-controls`.
- [ ] **Step 5: Tokenize `TemplateSelector.tsx`** — drop every `#1a1a1a/#242424/#333/#e8e6e3/#d4a853` literal → token classes (`bg-surface`, `text-ink`, `text-muted`, `border-hairline`, selected `border-accent bg-accent-soft`); grid → `grid grid-cols-2 gap-2`.
- [ ] **Step 6: Tokenize `TailorPanel.tsx`** — swap the dark literals it uses (Scan each: replace `text-[#e8e6e3]`/`border-[#333]`/`bg-[#1a1a1a]`/`#d4a853` with `text-ink`/`border-hairline`/`bg-surface`/`text-accent`) without changing component behavior (its unit test `app/components/tailor/__tests__/TailorPanel.test.tsx` must stay green).
- [ ] **Step 7: Rework `SaveIndicator.tsx`** — add `role="status"` + `aria-live="polite"`; idle renders `null`; saving → `Saving…` (`Loader2` spin, `text-status-warn`); success → `Saved ✓` (`Check`, `text-status-good`); error → `Save failed` (`X`, `text-status-warn`). Drop hardcoded hex.
- [ ] **Step 8: Verify + commit**

Run: `docker compose exec app npm run test` (104+ new green; `TailorPanel.test.tsx` still green) + lint net-neutral. Bake: `docker compose up -d --build app`; e2e ev/lin smoke + **manual M1**: type in the name field, blur, reload → name persisted; click `Mark ready` → `Cleared`, reload → still `Cleared`. **Manual M4 check M4a:** open Checklist accordion, open Style → Checklist closes; re-toggle Style → rail collapses back to just headers.
Commit: `git add -A` → `git commit -m "feat: 4:8 workbench grid + exclusive accordion inspector + tokenized style/tailor/save"`

## Task 4: Header Actions rail, pager docking, dialog a11y

**Files:**
- Modify: `app/components/ui/EditorialChrome.tsx` (reimplement: sticky, breadcrumb + editable name + SaveIndicator + `Actions ▾` toggle + avatar; drawer rail with History/Mark ready/Word/Quick PDF/Preview; keep its exact prop signature so `edit/page.tsx` call site is untouched)
- Modify: `app/cvs/[id]/edit/page.tsx` (dock `PageNav` under the preview canvas: non-fixed `mt-4`, `tabular-nums`, hidden when `totalPages <= 1`; remove the `fixed bottom-6 … pill`)
- Modify: `app/components/ui/SectionEditor.tsx` + its overlay in `edit/page.tsx` (dialog semantics)
- Modify: `app/components/ui/VersionHistory.tsx` (token voice + dialog semantics)
- Modify: `app/components/ui/CommandMenu.tsx` (backdrop + `aria-modal` + focus trap)
- Create: `app/hooks/useDialog.ts` + `app/hooks/useDialog.test.ts`

**Interfaces:**
- Consumes: `useDialog` (this task); `TemplateSelector`/`SaveIndicator` token voice (T3); `Breadcrumb` (T2).
- Produces: `useDialog(open: boolean, onClose: () => void): { dialogRef: RefObject<HTMLElement|null> }` — on open: focus first focusable; trap `Tab`/`Shift+Tab`; `Escape` → `onClose`; on close: restore focus to previously-focused element. One shared hook for SectionEditor (wrapper), VersionHistory, CommandMenu (list only, no extra backdrop conflicts).

- [ ] **Step 1: Write failing `useDialog` tests** — `app/hooks/useDialog.test.ts` (jsdom): Escape calls `onClose`; Tab cycles within a two-button dialog; focus moves to the first button on open; focus returns to a stub opener on unmount. Run → FAIL.
- [ ] **Step 2: Implement `app/hooks/useDialog.ts`** and pass.
- [ ] **Step 3: Reimplement `EditorialChrome.tsx`** — left: back `CVs` link + editable name input (`aria-label="CV name"`, keep) + `SaveIndicator`; right: `Actions ▾` toggle button (≥40px, `aria-expanded`, chevron spins) + avatar chip. Below the header row a `role="region"` drawer (`aria-labelledby` = toggle id) rendered only when open and roll-out-animated (classes with the two `cubic-bezier` transitions; `prefers-reduced-motion` already neutralized by the T1 CSS): buttons `History`, `Mark ready`/`Cleared`, `Word`, `Quick PDF`, `Preview` in staggered entry. Ctrl+`/` command menu unchanged. Keep the existing callbacks.
- [ ] **Step 4: Dock the pager** — in `edit/page.tsx` `PageNav`: remove `fixed … z-20`; put it in normal flow under the canvas (`mt-4`), `tabular-nums` on the counter, render `null` when `totalPages <= 1`. Keep its `aria-label`s and disabled logic.
- [ ] **Step 5: SectionEditor dialog** — move overlay wrapper into `SectionEditor` itself (or keep wrapper but add): `role="dialog" aria-modal="true" aria-labelledby` → title `id`; apply `useDialog`; click on backdrop cancels; keep `data-testid`s. Backdrop `bg-ink/40`.
- [ ] **Step 6: VersionHistory dialog + tokens** — drop `bg-white`/`gray-*`/`blue-500` → `bg-surface`/`text-ink`/`text-muted`/`bg-accent`; `role="dialog" aria-modal="true" aria-labelledby`; labeled close `✕` (`aria-label="Close version history"`, ≥40px hit area); `useDialog`; `Escape` closes; Restore buttons ≥40px.
- [ ] **Step 7: CommandMenu a11y** — add `bg-ink/40` backdrop (`aria-hidden`), move list+input inside `role="dialog"` with `aria-modal="true"`, `useDialog` on the container (Escape handler in the hook replaces the inline effect), keep `⌘K`/`/` open binding.
- [ ] **Step 8: Verify + commit**

Run: `docker compose exec app npm run test` (includes new useDialog) + lint net-neutral. Bake + e2e (`cv-list`, `template-selector`, pagination smoke incl. dark-white assertion). **Manual M2:** click a checklist item on live app → editor dialog opens with focus inside; `Escape` closes and focus is back on the clicked button. **Manual M4b:** a screen-reader pass — SaveIndicator announces `Saved ✓`; `Actions ▾` announces expanded. **Manual M5:** paginate a long CV → pager sits under the canvas (not viewport-fixed), hides at 1 page; editor Fit unchanged.
Commit: `git add -A` → `git commit -m "feat: header actions rail, docked pager, dialog a11y (focus trap + Escape)"`

---

## Final Verification & Shippable Record

- [ ] Run full gated suite: `docker compose exec app npm run test` (all green), `docker compose exec app npm run lint` (net-neutral on 208e/149w), `docker compose up -d --build app` + `docker compose exec app npm run test:e2e` (cv-list, template-selector, pagination all green).
- [ ] Manual acceptance (companion/watch): the live edit page matches the converged `portal-accordions.html` in layout: slim sidebar, header w/ Actions rail, 4:8 grid, accordion inspector w/ Checklist open, docked pager, dark toggle flips whole app but not the sheet.
- [ ] Add `CHANGELOG.md` entry under `[Unreleased]` (`Added`): portal AppShell, dark theme tokens + toggle, accordion Inspector, header Actions rail, docked pager, dialog a11y; run `~/.agents/scripts/release.sh`.