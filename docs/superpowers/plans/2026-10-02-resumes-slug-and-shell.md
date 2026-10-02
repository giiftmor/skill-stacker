# Resumes Rename + Slug URLs + Shell Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the app from a numeric-`cvId`/`cvs` model to a `resumes` model with slug-based navigation URLs (`/resumes/jane-doe-2a`), keep the numeric id as the internal primary key (photo/upload stay numeric-keyed), and extend the shell sidebar to the browser bottom with a non-scrollable layout, a footer collapse toggle, and an account/avatar placeholder.

**Architecture:** The slug is `slugify(fullName)-hex(id)`, generated once at creation and frozen. Existing DB rows are migrated in place inside `initDb()` (guarded, idempotent table/column renames + JS slug backfill + unique constraint). Public routes/pages flip atomically from `[id]` to `[slug]`; a new `resolveSlug()` bridges slug→numeric id so every DB function keeps its numeric signature. The sidebar footer is an independent layout task that lands first.

**Tech Stack:** Next.js 16 (Turbopack), React 19, PostgreSQL 16 via `pg` (direct SQL, no ORM), lucide-react, Vitest (jsdom), Playwright, Biome. Docker-compose only — no host `npm`.

**Spec:** `docs/superpowers/specs/2026-10-02-resumes-slug-and-shell-design.md`

## Global Constraints

- **Docker-only npm:** every command runs via `docker compose exec app npm run …`. Never run `npm` on the host.
- The app container does **not** bind-mount source – only `./scripts` and `./uploads`. Code ship → `docker compose up -d --build app`. For in-container test/lint runs, `docker cp` the edited files into `skill-stacker-app-1` first.
- **Biome is net-neutral:** baseline is 190 errors / 146 warnings. Changes must keep lint output at or below both numbers (treat 190e as a ceiling bound by not making existing error lines worse; do not add new errors/warnings).
- **Vitest green:** suite currently 131/131 across 22 files; the new/updated tests must all pass (`docker compose exec app npm run test`). No test may touch the `pg` pool.
- **e2e scope:** run only the shell-facing specs — all files under `e2e/` **except** `e2e/pagination.spec.ts` and `e2e/tailor.spec.ts`. Those two are edited for compile/consistency only, never executed (evo/Ollama is down and pagination is out of the runnable set). e2e runs against the baked Docker build on host port 5252 (mind port conflicts via `docker ps`).
- **No new runtime dependencies.**
- **No code comments unless required**; match the surrounding style. `app/globals.css` lines 81+ (print/preview block) must not change.
- The numeric id remains the identifier for `/api/photo/[cvId]`, the upload `cvId` form field, storage filenames `${cvId}_${timestamp}${ext}`, and `cleanupCVFiles`. Only navigation/API resource paths switch to slugs.
- Update `CHANGELOG.md` under `[Unreleased]` per feature. Do **not** commit or run `~/.agents/scripts/release.sh` without the author's explicit go-ahead.
- Error/status contract for every `[slug]` route: segment not matching `/^[a-z0-9-]+$/` → `400`; matches but `resolveSlug()` → `null` → `404`; otherwise the existing numeric DB path.

## Review Focus

- **Migration of a populated legacy DB** (rows in `cvs`/`cv_photos`/`cv_versions`): renames + backfill must preserve every row and id; re-running `initDb()` is a no-op. → pinned by Task 3's psql/curl verification and the idempotence re-run.
- **Empty/whitespace `fullName` at creation:** slug falls back to `resume-<hex>` rather than producing a bad URL. → pinned in Task 1 (`slugFromId` tests).
- **Slug validation:** uppercase/malformed slug → 400; well-formed but unknown → 404 (not 500). → pinned in Task 4 (`ready-route.test.ts`).
- **Slug stability on edit:** editing `fullName` must not change the URL. → pinned in Task 4 (e2e: URL still ends in the same slug after a personal edit).
- **Non-scrollable sidebar on real viewport:** the footer (toggle + account) is always visible at the browser bottom; no internal scrollbar. → pinned by Task 2 unit assertions + Task 5 live/e2e check on an actual viewport.

---

### Task 1: Slug utility

**Files:**
- Create: `app/lib/slug.ts`
- Test: `app/lib/__tests__/slug.test.ts`

**Interfaces:**
- Produces:
  - `slugify(text: string): string` — lowercase; replace every run of non-`[a-z0-9]` characters with a single `-`; trim leading/trailing `-`. Returns the empty string when `text` is empty/whitespace.
  - `slugFromId(fullName: string, id: number): string` — `<slugify(fullName) || "resume">-<id.toString(16)>`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { slugify, slugFromId } from "../slug";

describe("slugify", () => {
  it("lowercases and merges non-alphanumeric runs into single dashes", () => {
    expect(slugify("Jane Doe")).toBe("jane-doe");
    expect(slugify("  lead & trail  spaces ")).toBe("lead-trail-spaces");
    expect(slugify("Jack O'Brien 2.0!")).toBe("jack-o-brien-2-0");
  });

  it("returns an empty string for empty or whitespace input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});

describe("slugFromId", () => {
  it("appends the hex id to the slugified name", () => {
    expect(slugFromId("Jane Doe", 42)).toBe("jane-doe-2a"); // 0x2a
    expect(slugFromId("A B", 10)).toBe("a-b-a");
  });

  it("falls back to resume-<hex> when the name slugifies empty", () => {
    expect(slugFromId("", 5)).toBe("resume-5");
    expect(slugFromId("   ", 7)).toBe("resume-7");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose exec app npm run test -- app/lib/__tests__/slug.test.ts`
Expected: FAIL — `slugify`/`slugFromId` not defined.

- [ ] **Step 3: Implement `slug.ts`**

`slugify`: `text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")`.
`slugFromId`: `` `${slugify(fullName) || "resume"}-${id.toString(16)}` ``.

- [ ] **Step 4: Run test to verify it passes**

Run: `docker compose exec app npm run test -- app/lib/__tests__/slug.test.ts`
Expected: PASS (all 4 `it` cases).

- [ ] **Step 5: Add CHANGELOG line and commit**

Add under `[Unreleased]` — `Added: resume slug identifier helpers (slugify/slugFromId)`.
`git add app/lib/slug.ts app/lib/__tests__/slug.test.ts CHANGELOG.md && git commit -m "feat: add slug identifier helpers"`

---

### Task 2: Sidebar footer (full-height, non-scrollable)

The AppShell side was partially started (header toggle removed, `collapsed` + `onToggleCollapsed` already passed to `AppSidebar`). This task completes Sidebar.

**Files:**
- Modify: `app/components/ui/Sidebar.tsx`
- Modify: `app/components/ui/AppShell.tsx` (only remove the now-unused header toggle leftovers if any remain — the aside needs no AppShell change otherwise)
- Test: `app/components/ui/__tests__/AppShell.test.tsx`

**Interfaces:**
- Consumes (already being passed by `AppShell`): `collapsed?: boolean`, `onToggleCollapsed?: () => void`.
- Produces: `aside[data-testid="app-sidebar"]` is `h-[calc(100vh-3.5rem)]` with **no** `overflow-y-auto`, `flex flex-col`; a footer `div[data-testid="sidebar-footer"]` pinned by `mt-auto`; the collapse toggle (`button[data-testid="sidebar-toggle"]`, `aria-pressed={!collapsed}`, semantic label "Collapse sidebar"/"Expand sidebar", `h-10 w-10`) and an account placeholder `div[data-testid="account-container"]` live inside the footer.

- [ ] **Step 1: Add `onToggleCollapsed` to `SidebarProps` and render the footer**

```tsx
interface SidebarProps {
  active?: ShellSection;
  cvId?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}
```

Change the `<aside>` class from `sticky top-14 max-h-[calc(100vh-3.5rem)] … overflow-y-auto` to `sticky top-14 h-[calc(100vh-3.5rem)] … flex flex-col` (keep `shrink-0`, `w-14`/`w-44` conditional, transition). Give the `<nav>` `flex-1`. After `</nav>`, add the footer with `mt-auto border-t border-hairline pt-2`:

```tsx
<div data-testid="sidebar-footer" className="mt-auto border-t border-hairline pt-2">
  <div data-testid="account-container" title={collapsed ? "Sign in" : undefined}
    className={`flex min-h-10 items-center gap-2 rounded-md ${collapsed ? "justify-center" : "px-2"}`}>
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-desk text-muted" aria-hidden="true">
      <User size={15} />
    </span>
    {!collapsed && (
      <>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">Sign in</span>
        <ChevronsUpDown size={14} className="text-faint" aria-hidden="true" />
      </>
    )}
  </div>
  <button type="button" data-testid="sidebar-toggle" onClick={onToggleCollapsed}
    aria-pressed={!collapsed}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    className={collapsed
      ? "grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-desk hover:text-ink"
      : "flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-muted hover:bg-desk hover:text-ink"}>
    {collapsed ? <PanelLeftOpen size={15} aria-hidden="true" /> : <PanelLeftClose size={15} aria-hidden="true" />}
    {!collapsed && <span className="flex-1">{collapsed ? "Expand" : "Collapse"}</span>}
  </button>
</div>
```

Add imports (lucide-react): `User`, `ChevronsUpDown`, `PanelLeftClose`, `PanelLeftOpen`. Delete the old button/header toggle references if still present. Keep the toggle `h-10 w-10` hit target in the collapsed state.

- [ ] **Step 2: Extend the AppShell unit tests**

In `describe("AppSidebar")` add:

```tsx
it("renders a full-height non-scrollable sidebar with a footer", () => {
  render(<AppSidebar active="cvs" />);
  const aside = screen.getByTestId("app-sidebar");
  expect(aside).toHaveClass("h-[calc(100vh-3.5rem)]");
  expect(aside).not.toHaveClass("overflow-y-auto");
  expect(screen.getByTestId("sidebar-footer")).toBeInTheDocument();
  expect(screen.getByTestId("account-container")).toBeInTheDocument();
});

it("keeps the collapse toggle inside the footer", () => {
  render(<AppSidebar active="cvs" />);
  const footer = screen.getByTestId("sidebar-footer");
  expect(within(footer).getByTestId("sidebar-toggle")).toHaveAttribute("aria-pressed", "true");
});
```

- [ ] **Step 3: Run unit tests to verify they pass**

Run: `docker compose exec app npm run test -- app/components/ui/__tests__/AppShell.test.tsx`
Expected: PASS — existing 8 tests still pass (the toggle is now found in the footer; `aria-pressed` unchanged) plus the 2 new ones.

- [ ] **Step 4: CHANGELOG + commit**

Add: `Added: sidebar footer with account placeholder and bottom collapse toggle (full-height, non-scrollable aside)`.
`git add app/components/ui/Sidebar.tsx app/components/ui/AppShell.tsx app/components/ui/__tests__/AppShell.test.tsx CHANGELOG.md && git commit -m "feat: extend sidebar to bottom with footer toggle and account placeholder"`

---

### Task 3: DB migration (tables, slug column, backfill, `resolveSlug`)

Backward-compatible: the app still runs on numeric ids, so this lands green on its own.

**Files:**
- Modify: `app/lib/db.ts`

**Interfaces:**
- Produces:
  - `resolveSlug(slug: string): Promise<number | null>` — `SELECT id FROM resumes WHERE slug = $1`, returns id or `null`.
  - `saveCV(data)` now returns `{ success: true, cvId: number, slug: string }` and writes the slug in-transaction.
  - `getAllCVs()` rows gain `slug: string`.
  - `getCV(id)` result row includes `slug`.
  - `initDb()` runs the guarded migration below and stays idempotent.

- [ ] **Step 1: Add the guarded migration at the top of `initDb()`** (before any `CREATE TABLE`)

```sql
-- 1. Table renames (only from legacy names when the new name is absent)
DO $$ BEGIN
  IF to_regclass('public.cvs') IS NOT NULL AND to_regclass('public.resumes') IS NULL THEN
    ALTER TABLE cvs RENAME TO resumes;
  END IF;
  IF to_regclass('public.cv_photos') IS NOT NULL AND to_regclass('public.resume_photos') IS NULL THEN
    ALTER TABLE cv_photos RENAME TO resume_photos;
  END IF;
  IF to_regclass('public.cv_versions') IS NOT NULL AND to_regclass('public.resume_versions') IS NULL THEN
    ALTER TABLE cv_versions RENAME TO resume_versions;
  END IF;
END $$;

-- 2. Key column renames cv_id -> resume_id in every child table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competencies' AND column_name='cv_id') THEN
    ALTER TABLE competencies RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='cv_id') THEN
    ALTER TABLE experiences RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='cv_id') THEN
    ALTER TABLE education RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='certificates' AND column_name='cv_id') THEN
    ALTER TABLE certificates RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='cv_id') THEN
    ALTER TABLE skills RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reference_list' AND column_name='cv_id') THEN
    ALTER TABLE reference_list RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='additional_info' AND column_name='cv_id') THEN
    ALTER TABLE additional_info RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resume_photos' AND column_name='cv_id') THEN
    ALTER TABLE resume_photos RENAME COLUMN cv_id TO resume_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resume_versions' AND column_name='cv_id') THEN
    ALTER TABLE resume_versions RENAME COLUMN cv_id TO resume_id;
  END IF;
END $$;

-- 3. Add nullable slug column
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS slug TEXT;
```

Then backfill in JS (inside the existing `initDb` try block, after the column is ensured, using an imported `slugFromId`):

```ts
const pending = await client.query(
  "SELECT id, full_name FROM resumes WHERE slug IS NULL OR slug = ''",
);
for (const row of pending.rows as Array<{ id: number; full_name: string }>) {
  await client.query("UPDATE resumes SET slug = $1 WHERE id = $2", [
    slugFromId(row.full_name, row.id),
    row.id,
  ]);
}

await client.query(`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_slug_key') THEN
      ALTER TABLE resumes ADD CONSTRAINT resumes_slug_key UNIQUE (slug);
    END IF;
  END $$;
`);
await client.query("ALTER TABLE resumes ALTER COLUMN slug SET NOT NULL");
```

- [ ] **Step 2: Convert the DDL to new names**

Rewrite `initDb()` so all `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` statements use: `resumes` (add `slug TEXT UNIQUE NOT NULL` in the column list), `resume_photos`, `resume_versions`, and `resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE` on every child table (`competencies`, `experiences`, `education`, `certificates`, `skills`, `reference_list`, `additional_info` too). Rename index guards to `idx_resumes_full_name`, `idx_resumes_email`, `idx_resume_versions_resume_id` (on the renamed tables/columns). Keep the two legacy `ALTER TABLE resumes ADD COLUMN IF NOT EXISTS template_settings/ready_override` lines. Result: a fresh DB gets the new schema directly; a migrated DB no-ops.

- [ ] **Step 3: Wire `saveCV`, `getAllCVs`, `add resolveSlug`**

- `saveCV`/`updateCV` INSERT and UPDATE statements and every `cv_id` reference in the 8 children queries to `resumes`/`resume_id` (mechanical replace inside `saveCV`, `updateCV`, `getCV`, `deleteCV`, `saveCVPhoto`, `getCVPhoto`, `deleteCVPhoto`, `saveCVVersion`, `getCVVersions`, `getCVVersion`, `getCVWithSettings`, `updateCVTemplateSettings`, `setCVReady`).
- In `saveCV`, after the child inserts, before COMMIT:

```ts
const slug = slugFromId(data.personal.fullName, cvId);
await client.query('UPDATE resumes SET slug = $1 WHERE id = $2', [slug, cvId]);
```

and return `{ success: true, cvId, slug }`.
- In `getAllCVs`: add `cvs.slug,` to the SELECT and `slug: row.slug,` to the mapped row.
- Add `resolveSlug` at the end of the file.
- `updateCV` must **not** touch `slug` (stability on edits) — the existing `UPDATE ... SET full_name = $1, …` already omits it; leave as is.

- [ ] **Step 4: Run the unit suite (must stay green)**

Run: `docker compose exec app npm run test`
Expected: 131/131 + new slug tests all PASS (db functions are not unit-tested; the instrumentation test asserting `cvId` in `db.write` logs stays valid).

- [ ] **Step 5: Verify migration on the real volume (populated legacy DB)**

1. `docker compose up -d --build app`
2. `docker compose exec db psql -U postgres -d cvbuilder -c "\dt"` — expect `resumes`, `resume_photos`, `resume_versions` and the 7 child tables; no `cvs`/`cv_photos`/`cv_versions`.
3. `docker compose exec db psql -U postgres -d cvbuilder -c "SELECT id, full_name, slug FROM resumes ORDER BY id"` — every existing row has a slug of the form `<slugify(name)>-<hex(id)>` (ids preserved).
4. `curl -s localhost:5252/api/cv | jq '.cvs[0] | {id, slug, fullName}'` — id and slug present and consistent.
5. Re-trigger by restarting app (`docker compose restart app`) and re-running 1–4; rows unchanged → idempotent.

- [ ] **Step 6: CHANGELOG + commit**

Add: `Changed: DB migrated to resumes/resume_photos/resume_versions with resume_id keys and a unique slug column (in-place, data preserved)`.
`git add app/lib/db.ts app/lib/slug.ts CHANGELOG.md && git commit -m "feat: migrate DB to resumes with slug backfill and resolveSlug"`

---

### Task 4: Atomic rename — routes, API, components, labels, tests

The public contract flips at once (pages and API must move together, so this is one reviewable unit). The `[id]` folder in both `app/resumes` and `app/api/resume` becomes `[slug]`; every in-app caller, label, and test follows.

**Files:**
- Move (git mv): `app/cvs/` → `app/resumes/`; `app/api/cv/` → `app/api/resume/`; then `[id]` → `[slug]` under both (`app/resumes/[id]` → `app/resumes/[slug]`, `app/api/resume/[id]` → `app/api/resume/[slug]`). The `ready-route.test.ts` moves to `app/api/resume/[slug]/__tests__/`.
- Modify: `app/resumes/*` pages, `app/resumes/[slug]/{edit,preview}/page.tsx`, `app/api/resume/**`, `app/page.tsx`, `app/components/ui/Sidebar.tsx`, `AppShell.tsx`, `Roster.tsx`, `VersionHistory.tsx`, `app/components/capture/GuidedCapture.tsx`, `app/components/ui/__tests__/AppShell.test.tsx`, all `e2e/*.spec.ts`.
- Delete: nothing (git mv preserves history).

**Interfaces:**
- Consumes: `resolveSlug`, `saveCV → { …, slug }`, `getAllCVs rows { …, slug }` (Task 3); `slugFromId` (Task 1).
- Produces:
  - Routes: `/resumes`, `/resumes/new`, `/resumes/[slug]/edit`, `/resumes/[slug]/preview`; `GET|POST /api/resume`; `GET|PUT|DELETE /api/resume/[slug]`; `POST /api/resume/[slug]/ready|snapshot`; `PATCH /api/resume/[slug]/template`; `GET /api/resume/[slug]/versions`; `POST /api/resume/[slug]/versions/[versionId]/restore`. `/api/photo/[cvId]` and `/api/upload` unchanged (numeric).
  - `ShellSection = "resumes" | "edit" | "preview"`; `AppShellProps.slug?: string`; `Sidebar` builds `/resumes/${slug}/edit|preview`.
  - e2e helpers: `createCV`/`createRichCV` return `{ slug: string; cvId: number }`.

- [ ] **Step 1: Move folders and flip the API routes**

```bash
git mv app/api/cv app/api/resume
git mv 'app/api/resume/[id]' 'app/api/resume/[slug]'
```
- param type `{ id: string }` → `{ slug: string }`; destructure `slug`; replace `idFromParams`/`parseInt(id, 10)` with:

```ts
const VALID_SLUG = /^[a-z0-9-]+$/;
const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
if (cvId === null) {
  return NextResponse.json({ success: false, message: "Invalid resume identifier" }, { status: VALID_SLUG.test(slug) ? 404 : 400 });
}
```

(`template`, `versions`, `restore` keep their `PATCH`/`GET`/`POST` verbs; `restore` additionally parses `versionId` numerically and 400s on a non-integer.)
- List/create route: `GET /api/resume` returns `{ success, cvs }` where each row carries `slug`; `POST` returns `{ success, message: "Resume saved successfully", cvId, slug }`. Update logger scopes `api.cv*` → `api.resume*` and user-visible strings `CV` → `Resume` in all these files.

- [ ] **Step 2: Rewrite `ready-route.test.ts` for slug semantics**

In `app/api/resume/[slug]/__tests__/ready-route.test.ts`:

```ts
vi.mock("@/app/lib/db", () => ({
  setCVReady: vi.fn(),
  resolveSlug: vi.fn(),
}));
import { POST } from "../ready/route";
import { resolveSlug, setCVReady } from "@/app/lib/db";
```

Tests (each `req(path)` builds `new Request("http://localhost" + path, { method, body, headers })`):
1. `POST("/api/resume/jane-doe-1/ready")` with `resolveSlug` → `7`, `setCVReady` → `{ success: true, cvId: 7 }`; assert 200, `setCVReady(7, true)`, body `{ success: true, cvId: 7 }`.
2. malformed slug `"Not-A-Slug"` → 400; `resolveSlug` and `setCVReady` **not** called.
3. well-formed unknown slug `"ghost-99"` → `resolveSlug` → `null` → 404; `setCVReady` not called.
4. missing `ready` defaults to `false` → `setCVReady(1, false)`.

Run: `docker compose exec app npm run test -- app/api/resume/[slug]/__tests__/ready-route.test.ts` → PASS.

- [ ] **Step 3: Rename pages + app/page + components**

`git mv app/cvs app/resumes`. Then:

- `app/page.tsx`: `redirect("/resumes")`.
- `app/resumes/page.tsx`: `active="resumes"`.
- `app/resumes/[slug]/edit/page.tsx` and `preview/page.tsx`:
  - param `{ slug: string }`; `const slug = resolvedParams.slug` (no `parseInt`).
  - API fetches `/api/cv/${cvId}` → `/api/resume/${slug}` (GET/PUT/snapshot/template/ready/versions in edit; GET in preview).
  - capture the numeric id from the loaded CV: add `const [cvId, setCvId] = useState<number | null>(null)`; in `loadCV` after success `setCvId(cv.id)`.
  - `setPhotoUrl(`/api/photo/${cv.id}`)` (photo URL stays numeric); `UploadPhoto cvId={cvId}` (render only when `cvId !== null` — e.g. `{cvId !== null && <UploadPhoto cvId={cvId} … />}`); `AppShell … slug={slug}`; `VersionHistory slug={slug}`.
  - edit back button `router.push("/cvs")` → `"/resumes"`.
- `AppShell.tsx`: `ShellSection = "resumes" | "edit" | "preview"`; prop `cvId?: number` → `slug?: string`; breadcrumbs `{ label: "Resumes", href: "/resumes" }`.
- `Sidebar.tsx`: `cvId` → `slug`; hrefs `/resumes`, `/resumes/new`, `/resumes/${slug}/edit`, `/resumes/${slug}/preview`; labels "My Resumes", "New Resume", "This Resume", "Edit Resume"; `hasCv = Boolean(slug)`; section keys `"resumes"`.
- `Roster.tsx`: `RosterRow` gains `slug: string`; `key` stays `row.id`; `data-testid={`row-${row.slug}`}` and `ready-dot-${row.slug}`; Open link `href={`/resumes/${row.slug}/edit`}`; API calls `/api/cv/…` → `/api/resume/${row.slug}/…` (ready/delete/duplicate-GET); duplicate `POST /api/cv` → `/api/resume`; `quickPdf` photo stays `/api/photo/${row.id}`; labels "Client Resumes" heading, "New client Resume", "Start your first client resume".
- `VersionHistory.tsx`: prop `cvId: number` → `slug: string`; `/api/cv/${cvId}/versions` → `/api/resume/${slug}/versions`; restore URL likewise.
- `GuidedCapture.tsx`: `POST /api/cv` → `/api/resume`; `router.push(`/cvs/${body.cvId}/edit`)` → `router.push(`/resumes/${body.slug}/edit`)`.
- `app/resumes/new/page.tsx`: metadata title `"New Resume"`.

`AppShell.test.tsx`: mock `usePathname` → `"/resumes"`; every `active="cvs"` → `active="resumes"`; every `cvId={1}` → `slug="jane-doe-1"`. Run this file → PASS.

- [ ] **Step 4: Update e2e helpers and specs**

In each spec: `createCV`/`createRichCV` → `const body = await res.json(); return { slug: body.slug as string, cvId: body.cvId as number };`.

- `roster.spec.ts`: `const { slug } = await createCV(...)`; `page.goto("/resumes")`; `row-${slug}`, `ready-dot-${slug}`; `a[href="/resumes/${slug}/edit"]`.
- `inline-editing.spec.ts`: `createCV(...)` returns slug; `page.route("**/api/resume/*")`; `goto(`/resumes/${slug}/edit`)`.
- `template-selector.spec.ts`: `goto("/resumes/new")`; `expect(page.url()).toMatch(/\/resumes\/[a-z0-9-]+\/edit$/)`.
- `guided-capture.spec.ts`: `goto("/resumes/new")`.
- `cv-list.spec.ts`: `goto("/resumes")`; link name `/New client Resume/`.
- `preview-page.spec.ts`: `goto("/resumes/does-not-exist/preview")` and `/resumes/does-not-exist/edit`.
- `qa-phase9.spec.ts`: `createRichCV` returns `{ slug, cvId }`; edit/preview `goto(`/resumes/${slug}/edit|preview`)`; API calls to `/api/resume/${slug}`, `/api/resume/${slug}/snapshot`, `/api/resume/${slug}/versions`, `/api/resume/${slug}/versions/${restoreId}/restore`; photo stays `/api/photo/${cvId}`; intercept `**/api/resume/*`.
- `pagination.spec.ts`, `tailor.spec.ts`: mechanical path-string updates only (slug form, `/resumes/…`); **not run**.

- [ ] **Step 5: Add the slug-stability e2e assertion**

In `inline-editing.spec.ts`, after the first test's edit, add: after `getByTestId("section-save").click()` and the "Saving…"/saved flow, `expect(page.url()).toMatch(/\/resumes\/[a-z0-9-]+\/edit$/)` and capture `const before = page.url()`; open the personal section, change the full-name field, save, then `expect(page.url()).toBe(before)` — the URL is unchanged by the name edit.

- [ ] **Step 6: Full unit run + lint + rebuild + e2e**

1. `docker compose exec app npm run test` → all green (131 + new).
2. `docker compose exec app npm run lint` → no worse than the 190e/146w baseline.
3. `docker compose up -d --build app`; run the e2e suite excluding pagination/tailor: `docker compose exec app npx playwright test` scoped to the 7 runnable specs → all pass against the baked build.
4. `curl` checks: `GET /api/resume` returns slugs; `GET /api/resume/does-not-exist` → 404 JSON; `POST /api/resume` returns `slug`; `PUT /api/resume/<slug>` with a new name leaves the URL slug unchanged; photo upload + `/api/photo/<numeric>` still functional.

- [ ] **Step 7: CHANGELOG + commit**

Add: `Changed: renamed cvs → resumes across routes, API, DB labels; navigation now uses slug URLs (/resumes/jane-doe-2a); photo/upload remain numeric-keyed`.
`git add -A && git commit -m "feat: rename CVs to Resumes and switch to slug navigation URLs"`

---

### Task 5: Final verification gate (live)

**Files:** none (verification only; CI/evidence).

- [ ] **Step 1: Live-family checks on the baked build (port 5252)**

1. `docker ps` — confirm app + db `Up`; app on 5252.
2. `docker compose logs -f app` — no errors after warm-up.
3. Playwright against `http://localhost:5252`:
   - `/resumes` roster renders; row testids are slug-based; open → `/resumes/<slug>/edit` loads the Actions menu.
   - Sidebar footer visible at the browser bottom on both expanded and collapsed rails (real viewport, e.g. 1440×900): `sidebar-footer`, `account-container`, `sidebar-toggle` all visible; `aside` has no scrollbar (`document.querySelector('aside')` scrollHeight ≤ clientHeight); toggle collapses/expands.
   - `/resumes/does-not-exist/edit` renders the shell (no crash).
   - Photo upload still works from the edit page (numeric `/api/photo/...`).

- [ ] **Step 2: Migration integrity re-check**

`docker compose exec db psql -U postgres -d cvbuilder -c "SELECT count(*) AS cv_rows, count(slug) AS slugged FROM resumes"` — every row slugged. `docker compose restart db app` then repeat — counts stable (idempotence).

- [ ] **Step 3: Close out**

Add final CHANGELOG line if anything surfaced; report to the author for commit + optional `~/.agents/scripts/release.sh`. Do not commit without their go-ahead.

---

## Self-Review Notes (resolved inline)

- The sidebar footer is a distinct subsystem but shares `AppShell`/`Sidebar` files with the rename, so it runs as Task 2 rather than a separate plan.
- The rename is intentionally one atomic task (Task 4): pages and `[id]`→`[slug]` API contract must flip together or the app is red in between.
- `updateCV` deliberately omits the slug (stability on edits); uniqueness is enforced by the DB constraint.
- `resolveSlug` (null-returning) means 404 is never a thrown exception; pool-safety untouched for unit tests.