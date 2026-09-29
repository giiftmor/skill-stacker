# Portal Edit Workbench — Design Spec

> Source of truth for the visual direction is the interactive mockup `portal-accordions.html`
> (`.superpowers/brainstorm/480127-1790666338/content/`), iterated live in the visual companion
> (`http://vision.tail6916ec.ts.net:55998/?key=85a9db93d91e8eace99abc850c10db1f03d45183f2f8ce7944f1a750856f3b56`)
> and approved by the user. This spec freezes those decisions for the implementation plan.

## Current State (as-built, verified)

- Root layout (`app/layout.tsx`): fonts + `body` tokens only. **No** header, sidebar, or theme provider.
- `/cvs/[id]/edit`: `<main>` with `EditorialChrome` (sticky header: back-link, editable name, SaveIndicator,
  Mark ready/Cleared, History, Word, Quick PDF, Preview) + a workspace row that right-docks the `InspectorRail`
  (`w-72 border-l`, Checklist + Style cards + Tailor slot). Preview column is `max-w-[794px]`; `PageNav` is a
  `fixed bottom-6 z-20` pill. Loading screen is hard-dark (`bg-[#0d0d0d]`).
- `/cvs/[id]/preview`: uses `Header` + `Breadcrumb`. `/cvs`: self-contained `Roster`.
- `AppSidebar` legacy — `app/components/ui/Sidebar.tsx` exists but is **imported nowhere** (dead).
- Hard-coded tunnels that break the token system:
  - **Dark island (in a light app):** `TemplateSelector.tsx`, `TailorPanel.tsx` (`#1a1a1a`/`#242424`/`#333`/
    `#e8e6e3`/`#d4a853`), legacy `Sidebar.tsx`, edit loading screen.
  - **Light island tunels:** `VersionHistory.tsx` (`bg-white`, `gray-*`, `blue-500`), `SaveIndicator.tsx`
    (`#666`/`#f59e0b`/`#4caf50`/`#dc4444`).
- `SectionEditor`, `VersionHistory`, `CommandMenu` are non-dialog or partially-dialog (Escape handled, no
  `aria-modal`/focus trap, unlabeled `✕` in VersionHistory).
- `.cv-page` / `.cv-measurer` / `.cv-block` / `.print-area` / `@media print` / `@page` in `app/globals.css`
  are **off-limits** (pagination + print machinery of `2026-09-28-measured-a4-pagination`).

## Converged Design

### A. Portal shell (applied to `/cvs`, `/cvs/[id]/edit`, `/cvs/[id]/preview`)

1. **Global header** (sticky, top): wordmark `Skill Stacker` → breadcrumb `CVs / <doc name>` (editable field
   on the edit page only) → doc-scope cluster: `SaveIndicator` (aria-live), `Actions ▾` toggle, user avatar
   chip (`LB`). Right edge: light/dark toggle.
2. **Slim app sidebar** (left, `176px`, labeled items, surface-toned, active = accent): the portal look. Nav
   links are **real routes only**:
   - `My CVs` → `/cvs`, `+ New CV` → `/cvs/new`
   - contextual (edit page): `Edit CV` → `/cvs/{id}/edit`, `Preview` → `/cvs/{id}/preview`
   - Ruling: mockup items `Dashboard`, `Tailor queue`, `Templates`, `Shared`, `Settings`, `Help` have **no
     routes yet** — render as muted/disabled items with `aria-disabled` + `title="Coming soon"` so the portal
     reads as designed without shipping dead destinations.
3. Every interactive chrome target ≥ **40px**, visible `focus-visible` ring retained everywhere.

### B. Edit workbench (`/cvs/[id]/edit`)

1. **4:8 grid** (Tailwind 12-col): Inspector (left 4) | preview (right 8, centered, canvas hugs A4).
2. **Inspector rail** = three exclusive accordions (`.Accordion`), one open at a time, headers carry status:
   - `Checklist · 8/9` (default **open**), `Style · Classic`, `Tailor · ready`.
   - Auto-height slide via `display:grid; grid-template-rows: 0fr→1fr` transition on the panel (no max-height
     hacks); content sets the height.
   - Header button: status text, chevron (spins 180° when open), `aria-expanded`, `aria-controls` → panel `id`,
     panel `role="region"`, `aria-labelledby` → header id.
3. **Content-driven sizing** (chosen over a pinned `100dvh` shell + `flex:1` fill): the workbench is regular
   document flow — the header is `position:sticky; top:0; z-index:9`; the window scrolls if the rail's open
   accordion + preview outgrow the viewport; no assumption of full-height ancestors.
4. **Header `Actions ▾` rail**: a drawer rolled out under the header. Drawer spring
   `cubic-bezier(.22,1,.36,1)`; buttons cascade in with overshoot `cubic-bezier(.34,1.56,.64,1)`, ~60 ms
   stagger. Items: `History · Mark ready · Word · Quick PDF · Preview` (the export/physical actions move out
   of the static header row). Toggle has `aria-expanded`; chevron spins.
5. **Preview surface**: preview toolbar row (canvas, **pager docked under the page**, `tabular-nums`,
   **auto-hidden when totalPages === 1**; page ring/focus retained).
6. `SaveIndicator`: token colors, **`aria-live="polite"`**, silence the `Ready to save` idle noise (render
   nothing on idle), success reads `Saved ✓ · just now`, saving `Saving…`, error `Save failed`.

### C. Light/dark theming

- Same token family in both themes via `--color-*` CSS variables; `[data-theme="dark"]` overrides on `:root`.

| Token | Light (existing) | Dark |
|---|---|---|
| `--color-canvas` | `#f6f4ef` | `#121714` |
| `--color-desk` | `#efede8` | `#171d1a` |
| `--color-surface` | `#ffffff` | `#1b221e` |
| `--color-ink` | `#1c2520` | `#e8e6e3` |
| `--color-muted` | `#6b7280` | `#9aa6a0` |
| `--color-faint` | `#9ca3af` | `#6b7570` |
| `--color-hairline` | `#e6e3dd` | `#29332d` |
| `--color-accent` | `#0f766e` | `#4ec4b6` |
| `--color-accent-soft` | `#eef4f3` | `#1a302c` |
| `--color-status-good` | `#15803d` | `#34d399` |
| `--color-status-warn` | `#b45309` | `#f5a623` |

- `html { color-scheme: light }`; `[data-theme="dark"] { color-scheme: dark }`.
- `@media (prefers-reduced-motion: reduce)` disables transitions/animations.
- Theme persists via `localStorage`; default **light**; applied after mount (accept light flash for dark
  users; no inline-script FOUC hack).
- **Dark mode must not leak into the CV page** (`.cv-page` carries its own `background:#fff; color:#212529`
  and is untouched).

### D. Dialog a11y + tokenization (folded in)

- `SectionEditor` → `role="dialog"` `aria-modal="true"`, `aria-labelledby` → title, focus trap, `Escape`
  closes, focus restored to opener. Keep `data-testid="section-editor"` / `section-save`.
- `VersionHistory` → token voice (drops `bg-white`/`gray-*`/`blue-500`), `role="dialog"`, labeled `✕`
  (`aria-label="Close version history"`), focus trap, `Escape`, ≥40px targets.
- `CommandMenu` → backdrop + `aria-modal`, focus trap (already has `role="dialog"` + Escape).
- Shared `useDialog(open, onClose)` hook to center focus-trap/Escape/focus-restore logic.

## Scope Guard (non-negotiable)

- **No changes** to pagination/print engines: `pack`/`usePagination`, `CVPreview` props/paginator contract,
  `.cv-page`/`.cv-measurer`/`.cv-block`/`.print-area`/`@media print`/`@page` CSS, react-pdf/DOCX exporters,
  `app/components/templates/*`, `e2e/pagination.spec.ts`.
- `CVPreview` props contract unchanged; `edit/page.tsx` keeps calling it exactly as today (only surrounds it).
- No new runtime dependencies (lucide-react already present). No `npm` on host — Docker only.
- No comments in code unless required (Biome).
- Federal `.cv-block` splitting of page overflow during live editing is **deferred** (open product question,
  not this scope).

## Review Focus / Risk Pinboard

1. **Save/reload/restore flow still intact** after header + workbench restructure (name field, autosave,
   VersionHistory restore, Mark ready toggle). → existing unit suite + manual M1 + e2e smoke.
2. **Click-to-edit / section ring** still opens `SectionEditor` from rail + canvas. → keep `data-testid`s,
   manual M2.
3. **Dark mode never bleeds into the CV sheet** and `@media print` output stays white. → existing
   `e2e/pagination.spec.ts` dark-mode-white + manual M3.
4. **Accordion exclusivity + defaults** (Checklist open on load, opening one closes others). → pure
   `exclusivePanel()` unit tests.
5. **Keyboard/AT package**: Escape across all dialogs, focus restored, SaveIndicator announced. →
   `useDialog` unit tests + manual M4.