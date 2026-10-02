# Resumes Rename, Slug URLs, and Shell Footer

Date: 2026-10-02

## Status

Approved in conversation. Design decisions confirmed with the author:

- URL identifier: **name slug + hex-of-id suffix** (e.g. `/resumes/jane-doe-a3f9`).
- `/api/photo` and the upload `cvId` field **stay numeric-keyed** (internal resource URLs, fetched programmatically).

## Goal

Move the app from the CV-centric model to a `resumes` model with human-readable, stable URLs:

1. Repoint navigation from `/cvs` to `/resumes`.
2. Replace integer CV ids in public URLs and API resource paths with slugs.
3. Rename user-visible labels, API routes, and database objects to `resumes`.
4. Extend the shell sidebar to the browser bottom, make it non-scrollable, and move the
   collapse toggle into a new footer with a placeholder account/avatar container.

The internal numeric `id` stays as the primary key; all foreign keys and storage prefixes
keep working unchanged. Only the *public* identifier changes to a slug.

## Background

Current state (gathered from code):

- Routes: `app/cvs/{[id]/edit, [id]/preview, new}` with `[id]` parsed via `parseInt`.
- API: `app/api/cv` (`GET` list, `POST` create), `app/api/cv/[id]` (`GET`/`PUT`/`DELETE`),
  `[id]/ready`, `[id]/snapshot`, `[id]/template`, `[id]/versions`,
  `[id]/versions/[versionId]/restore`.
- DB (created idempotently in `app/lib/db.ts` `initDb()`): tables `cvs`, `cv_photos`,
  `cv_versions`, `competencies`, `experiences`, `education`, `certificates`, `skills`,
  `reference_list`, `additional_info`, all keyed by `cv_id` → `cvs(id)`.
- Photo: `app/api/photo/[cvId]` numeric; upload route sends numeric `cvId`; storage names
  files `${cvId}_${timestamp}${ext}`.
- e2e specs assume numeric ids (`/cvs/${cvId}/edit`, `/\/cvs\/\d+\/edit$/`, `/cvs/999999/...`,
  `row-${cvId}`, `ready-dot-${cvId}`, `{"**/api/cv/*"}`).
- Unit tests: `app/api/cv/[id]/__tests__/ready-route.test.ts` exercises numeric ids; shell tests
  in `app/components/ui/__tests__/AppShell.test.tsx` mock `usePathname` to `/cvs`.
- `app/components/CVListManager.tsx` is legacy dead code (never imported) — excluded.

## Design

### 1. Identifier model

- Keep `resumes.id SERIAL PRIMARY KEY`. All foreign keys (`cv_id` → `resume_id`), version
  auto-prune, photo rows, and storage filename prefixes continue using the numeric id.
- Add `resumes.slug TEXT NOT NULL UNIQUE`, the single public identifier.
- Slug format: `<slugify(fullName)>-<hex(id)>`. `slugify` lowercases, replaces runs of
  non-alphanumeric characters with a single `-`, and trims leading/trailing `-`. An empty
  name produces the base `resume`, so the slug reads `resume-<hex(id)>`. Example: id `42`
  (`0x2a`), name "Jane Doe" → `jane-doe-2a`.
- The slug is **generated once at creation** and never regenerated, so editing the full name
  does not change the URL. Hex-of-id is deterministic and unique (no collision retries).

New helper: `app/lib/slug.ts` with `slugify(text: string): string` and
`slugFromId(fullName: string, id: number): string`.

### 2. Database migration (`initDb`)

`initDb()` currently creates everything. It becomes a guarded, idempotent migration that
preserves existing rows:

1. **Rename tables** (guard with `to_regclass`): `cvs`→`resumes`, `cv_photos`→`resume_photos`,
   `cv_versions`→`resume_versions`. `competencies`, `experiences`, `education`, `certificates`,
   `skills`, `reference_list`, `additional_info` keep their names.
2. **Rename key columns** `cv_id`→`resume_id` in each child table (guard via
   `information_schema.columns`). Index names `idx_cvs_*`→`idx_resumes_*`; FK constraint names
   may keep legacy names (harmless, cosmetic-only renames avoided where not required).
3. **Add** `resumes.slug TEXT` (guard: `IF NOT EXISTS`).
4. **Backfill** in JS: `SELECT id, full_name FROM resumes WHERE slug IS NULL`; compute
   `slugFromId` per row; `UPDATE`; then set `NOT NULL` and add a UNIQUE constraint (guard the
   constraint). Fresh installs: `CREATE TABLE IF NOT EXISTS resumes` already includes `slug`.
5. Rewrite the subsequent `CREATE TABLE IF NOT EXISTS` statements and `ALTER TABLE ... ADD
   COLUMN IF NOT EXISTS` for the new table/column names so repeat runs no-op.

Existing rows thus get stable slugs (`sarah-chen-1`, etc.) with zero data loss.

### 3. Routes and API rename

Folder moves (git renames):

- `app/cvs/` → `app/resumes/`
- `app/cvs/[id]/` → `app/resumes/[slug]/`
- `app/api/cv/` → `app/api/resume/`
- `app/api/cv/[id]/` → `app/api/resume/[slug]/`

Public navigation (pages only):

- `/cvs` → `/resumes`
- `/cvs/new` → `/resumes/new`
- `/cvs/[slug]/edit` → `/resumes/[slug]/edit`
- `/cvs/[slug]/preview` → `/resumes/[slug]/preview`

API surface—slug is the *only* path segment that changed; sub-resources numeric where they
were numeric:

| Before | After |
|--------|-------|
| `GET|POST /api/cv` | `GET|POST /api/resume` |
| `GET|PUT|DELETE /api/cv/[id]` | `GET|PUT|DELETE /api/resume/[slug]` |
| `POST /api/cv/[id]/ready` | `POST /api/resume/[slug]/ready` |
| `POST /api/cv/[id]/snapshot` | `POST /api/resume/[slug]/snapshot` |
| `PATCH /api/cv/[id]/template` | `PATCH /api/resume/[slug]/template` |
| `GET /api/cv/[id]/versions` | `GET /api/resume/[slug]/versions` |
| `POST /api/cv/[id]/versions/[versionId]/restore` | `POST /api/resume/[slug]/versions/[versionId]/restore` |
| `GET /api/photo/[cvId]` | unchanged (numeric) |
| `POST /api/upload` | unchanged (numeric `cvId` form field) |

Route behavior:

- New helper `resolveSlug(slug): Promise<number | null>` in `app/lib/db.ts` —
  `SELECT id FROM resumes WHERE slug = $1`; returns `null` when absent.
- Every `[slug]` API route validates the segment against `/^[a-z0-9-]+$/` (else 400) and
  resolves via `resolveSlug` (else 404), then calls the existing numeric DB functions.
- `POST /api/resume` returns both `slug` (primary) and `cvId` (numeric, kept for photo/upload
  callers). e2e helpers switch to reading `.slug`.
- `GET /api/resume` rows gain a `slug` field (from the underlying `getAllCVs`), alongside `id`.

Pages:

- `app/resumes/[slug]/edit/page.tsx`: `const slug = resolvedParams.slug`; fetch
  `/api/resume/${slug}`; the loaded CV carries `id`, which the page stores for photo URLs
  (`/api/photo/${id}`), `UploadPhoto`, PDF export, and `AppShell` (see below). Snapshot/ready/
  template/versions calls use `/api/resume/${slug}/...`. Back button → `/resumes`.
- `app/resumes/[slug]/preview/page.tsx`: same pattern.
- `app/resumes/page.tsx`: passes slug breadcrumb/home; keeps list rendering.
- `app/resumes/new/page.tsx`, `app/components/capture/GuidedCapture.tsx`:
  `POST /api/resume` then `router.push(/resumes/${body.slug}/edit)`.
- `app/page.tsx`: `redirect("/resumes")`.

### 4. Shell sidebar footer (contained UI piece)

`app/components/ui/Sidebar.tsx`:

- `<aside>` changes from `sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto` to
  `sticky top-14 h-[calc(100vh-3.5rem)]` — extends to the browser bottom and is **non-scrollable**
  (drop `overflow-y-auto`). Default container is `flex flex-col`; nav is `flex-1`, footer pinned
  via bottom/flex.
- Footer (`data-testid="sidebar-footer"`, `border-t border-hairline`):
  - **Account/avatar placeholder container** (`data-testid="account-container"`): a 40px-tall
    row with an avatar circle placeholder (initials fallback → `User` icon), a muted label
    ("Sign in") and a chevron; on the collapsed rail it shows only the avatar with a `title`.
    Non-interactive placeholder for now.
  - **Collapse toggle** moved out of the header: `data-testid="sidebar-toggle"`,
    `aria-pressed={!collapsed}`, same `aria-label`/`title` ("Collapse sidebar"/"Expand sidebar"),
    `h-10 w-10` hit target, `PanelLeftClose`/`PanelLeftOpen` icons. On the rail it presents as a
    centered icon button.

`app/components/ui/AppShell.tsx`:

- Drop the header toggle (already moved out this session); keep collapse state
  (localStorage + matchMedia auto-collapse), pass `collapsed={sidebarCollapsed}` and
  `onToggleCollapsed={toggleSidebar}` into `AppSidebar`.
- `AppShellProps.cvId` → `slug?: string` (the sidebar builds `/resumes/${slug}/edit|preview`);
  the "This CV" group and active-state tests follow. Breadcrumb home label "CVs" → "Resumes".

Labels (user-visible): CVs→Resumes, My CVs→My Resumes, New CV→New Resume,
Client CVs→Client Resumes, "Start your first client CV"→…“Resume”, API message strings
("CV saved successfully"→"Resume saved successfully"), new-page metadata `"New CV"`→`"New Resume"`.

### 5. Tests

Unit (Vitest):

- `app/lib/__tests__/slug.test.ts` (new): `slugify` edge cases (accents, runs of separators,
  empties) and `slugFromId` determinism/uniqueness.
- `app/api/resume/[slug]/__tests__/ready-route.test.ts` (moved/rewritten): slug against
  `/^[a-z0-9-]+$/` (400), unknown-but-well-formed slug (404), valid slug → `setCVReady(id, v)`.
- `app/components/ui/__tests__/AppShell.test.tsx`: pathname mock → `/resumes`; `active="resumes"`;
  `slug` instead of `cvId`; toggle `aria-pressed` + hit target (now footer); new assertions —
  `sidebar-footer` present, `account-container` present, aside has full-height `h-[calc(...)]`
  and no `overflow-y-auto`.
- `app/lib/__tests__/db-instrumentation.test.ts`: unchanged (numeric `cvId` remains internal).

e2e (Playwright):

- `e2e/roster.spec.ts`: helpers read `.slug`; `row-${slug}` / `ready-dot-${slug}`; open
  `/resumes/${slug}/edit`.
- `e2e/inline-editing.spec.ts`: `/api/resume`; route interception `**/api/resume/*`.
- `e2e/template-selector.spec.ts`: URL matcher → `/\/resumes\/[a-z0-9-]+\/edit$/`.
- `e2e/preview-page.spec.ts`: `/cvs/999999/*` → `/resumes/does-not-exist/*` (well-formed but
  unresolvable slug exercises the 404 path).
- `e2e/guided-capture.spec.ts`, `e2e/cv-list.spec.ts`, `e2e/qa-phase9.spec.ts`: `/cvs` urls →
  `/resumes` (phase9 switches to slug-based helper).
- `e2e/pagination.spec.ts`, `e2e/tailor.spec.ts`: path strings updated to `/resumes/...`
  (not run per project convention, kept compiling).

### 6. Out of scope

- `app/components/CVListManager.tsx` — legacy dead component; untouched.
- Deleting photo files on CV delete (no existing wiring; pre-existing).
- Renaming the `cvbuilder` database name itself.
- The `/resumes` list readability/design beyond label changes.

## Verification

- `docker compose exec app npm run test` — Vitest full suite green.
- `docker compose exec app npm run lint` — net-neutral on the 190e/146w baseline for changed files.
- Rebuild image; Playwright against live build: 19 shell-facing specs (all except
  `pagination.spec.ts` and `tailor.spec.ts`), plus manual checks of slug URLs
  (`/resumes/<slug>/edit`, `/resumes/<slug>/preview`, unknown slug → 404), photo upload,
  and the sidebar footer (viewport-bottom, non-scrolling, toggle in footer, avatar placeholder),
  on both expanded and collapsed rails.
- Existing DB data survives the migration (ids intact, slugs backfilled).

## Risks

- Table renames are irreversible in an automated sense; the guarded renames run only when the
  legacy table exists and the new one does, and the full sequence is exercised against a
  populated volume before e2e.
- Non-scrollable sidebar may clip the Coming-soon group on very short viewports — accepted per
  the author's explicit request.
- Slug uniqueness relies on hex(id); constraint added to enforce it defensively.