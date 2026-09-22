# Guided + Editorial Light-Theme UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark, accordion-based CV builder with three light, artifact-first workspaces — Roster, Guided Capture, Editorial Editor — on a shared teal/serif design system, without touching the backend data model beyond one boolean column and two small routes.

**Architecture:** A pure `readiness` module (unit-tested, shared client/server) drives roster dots, the capture progress meter, and the inspector checklist. Design tokens replace hardcoded hex classes; the existing 9 `Forms/*`, `CVPreview` pagination, template definitions, auto-save, versioning, export, and the SSE tailor pipeline are reused as-is. Roster (`/cvs`), Guided Capture (`/cvs/new`), and Editorial Editor (`/cvs/[id]/edit`) are rebuilt as new frontends over the same API; `GET /api/cv` gains readiness fields, `POST /api/cv/[id]/ready` toggles a `ready_override` column, `PATCH /api/cv/[id]/template` persists template changes (previously frozen at creation), and `POST /api/tailor/rewrite` powers per-section polish + "Suggested summary".

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4 (`@theme` tokens), Vitest (jsdom), @playwright/test, lucide-react icons, `pg`/PostgreSQL. No new runtime deps. Fraunces + Mulish via `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-09-22-ui-studio-guided-editorial-design.md`

## Global Constraints

- All commands via Docker: `docker compose exec app npm run test`, `docker compose exec app npm run lint`, `docker compose exec app npm run build`, `docker compose exec app npm run test:e2e`. Never run host `npm`. If port 5252's container uses a different host port, the Playwright baseURL is already covered by `reuseExistingServer: true`.
- Light theme only. Remove the `prefers-color-scheme: dark` base override; the resume `templateDefinitions`/`pdfStyles` colors are export fidelity and MUST NOT change.
- `--font-heading` must finally resolve to a real font family (Fraunces) so the 14 existing `font-[family-name:var(--font-heading)]` usages render serif.
- Data model: one new additive column `cvs.ready_override BOOLEAN DEFAULT false` via the existing idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` convention. No other schema change.
- CV camelCase client shape is the single source of truth: `personal: {fullName,title,phone,email,location,linkedin}`, `profile: string`, `competency: string[]`, `experiences: Array<{id,company,role,period,details}>`, `education: Array<{id,institution,qualification,period}>`, `certificate: Array<{id,name,date}>`, `skill: string[]`, `reference: Array<{id,name,company,role,email,phone}>`, `additionalInfo: string[]`. Array client `id`s are stripped before any `POST`/`PUT` (`experiences.map(({ id, ...rest }) => rest)`).
- `guardNoFabrication(original, proposed)` must gate every rewrite (`tailor.rewrite` scope): proposed text may only derive from source text.
- No contentEditable. Inline editing is a controlled overlay bound to the existing form components.
- No comments in code unless required. Follow Biome (already configured).
- Vitest baseline: `app/lib`, `app/api`, `app/components` `__tests__/*.test.ts(x)`; jsdom env, `@` alias → repo root. Existing suite must stay green at every task boundary.
- E2E selector conventions: `page.goto('/cvs/${cvId}/edit')`, `getByRole("button", { name: /…/ })`, `getByPlaceholder("…")`, `page.route("**/api/cv/*", …)` to delay/intercept network. Never depend on live Ollama in e2e — intercept `/api/tailor/rewrite` and `/api/tailor` with canned payloads when a test touches AI.

## Review Focus

- **Existing CV with never-populated sections** (fresh create, or old rows with empty arrays / `null` scalars): must render roster 0% "drafting", editor all-empty checklist, no crash. Pinned by: readiness unit boundary tests (T1) + inline-editing e2e loads an empty CV (T10).
- **Ready toggle on a CV that was already Ready by data**: manual "mark ready" then "clear mark" must round-trip through reload and the manual tag clears when data catches up. Pinned by: roster e2e reload persistence (T4).
- **Switching template/theme/font inside the editor**: change must persist server-side immediately, survive reload, and apply to preview + exports. Pinned by: inline-editing e2e reload check (T10).
- **Rewrite endpoint receiving fabricated output** (or empty source): must return the soft "No safe changes" state, never insert text or crash. Pinned by: rewriteSection guard unit test (T7) + intercepted-route e2e (T10).
- **Old `getAllCVs` consumers / missing photo / rows with `NULL` scalars**: rows returned by the extended list must stay shape-compatible (extra fields are additive) and roster must handle a CV with no photo. Pinned by: roster e2e on a create-only (no sections, no photo) CV (T4).

---

## Task 1: Readiness module (pure, shared client/server)

**Files:**
- Create: `app/lib/readiness.ts`
- Create: `app/lib/readiness.test.ts`
- Modify: `app/components/__tests__/calculatePages.test.ts` (none — reference only)

**Interfaces:**
- Produces:
```ts
export type SectionKey = "personal" | "profile" | "competency" | "experiences" | "education" | "certificate" | "skill" | "reference" | "additionalInfo";
export type SectionState = "none" | "partial" | "full";
export interface SectionReadiness { key: SectionKey; label: string; state: SectionState }
export interface CVReadiness { percent: number; sections: SectionReadiness[] }
export const SECTION_KEYS: SectionKey[];
export const SECTION_LABELS: Record<SectionKey, string>;
export function sectionReadiness(key: SectionKey, data: Record<string, unknown>): SectionState;
export function cvReadiness(data: Record<string, unknown>): CVReadiness;
export function hasFlagsToSections(flags: Partial<Record<SectionKey, boolean>>): SectionKey[];
export function readinessFromSections(sections: SectionKey[]): number;
```
- Consumes: nothing (pure). Later consumed by T3 (server list), T4 (roster), T8 (capture meter), T9 (inspector checklist).

- [ ] **Step 1: Write the failing tests**

`app/lib/readiness.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  cvReadiness, hasFlagsToSections, readinessFromSections,
  sectionReadiness, SECTION_KEYS,
} from "./readiness";

const empty = () => ({
  personal: { fullName: "", title: "", phone: "", email: "", location: "", linkedin: "" },
  profile: "", competency: [], experiences: [], education: [],
  certificate: [], skill: [], reference: [], additionalInfo: [],
});

describe("sectionReadiness", () => {
  it("personal: none when name and title absent", () => {
    expect(sectionReadiness("personal", empty())).toBe("none");
  });
  it("personal: partial with one field filled, full with three", () => {
    const d = { ...empty(), personal: { ...empty().personal, fullName: "Ada Lovelace" } };
    expect(sectionReadiness("personal", d)).toBe("partial");
    const d2 = { ...empty(), personal: { fullName: "Ada Lovelace", title: "Engineer", email: "a@b.c" } };
    expect(sectionReadiness("personal", d2)).toBe("full");
  });
  it("profile: none empty, partial <40 chars, full >=40", () => {
    expect(sectionReadiness("profile", empty())).toBe("none");
    expect(sectionReadiness("profile", { ...empty(), profile: "short" })).toBe("partial");
    expect(sectionReadiness("profile", { ...empty(), profile: "x".repeat(40) })).toBe("full");
  });
  it("competency/skill: 3+ entries is full, 1-2 partial, 0 none", () => {
    expect(sectionReadiness("competency", { ...empty(), competency: ["a", "b"] })).toBe("partial");
    expect(sectionReadiness("competency", { ...empty(), competency: ["a", "b", "c"] })).toBe("full");
    expect(sectionReadiness("skill", { ...empty(), skill: [] })).toBe("none");
  });
  it("experiences: 2+ with company+details is full", () => {
    const one = [{ id: "1", company: "C", role: "R", period: "", details: "did things" }];
    expect(sectionReadiness("experiences", { ...empty(), experiences: one })).toBe("partial");
    expect(sectionReadiness("experiences", { ...empty(), experiences: [...one, { id: "2", company: "D", role: "", period: "", details: "more" }] })).toBe("full");
  });
  it("education: institution present; full when qualification too", () => {
    expect(sectionReadiness("education", { ...empty(), education: [{ id: "1", institution: "MIT", qualification: "", period: "" }] })).toBe("partial");
    expect(sectionReadiness("education", { ...empty(), education: [{ id: "1", institution: "MIT", qualification: "BSc", period: "" }] })).toBe("full");
  });
  it("certificate and reference are binary (full/none)", () => {
    expect(sectionReadiness("certificate", { ...empty(), certificate: [{ id: "1", name: "PMP", date: "" }] })).toBe("full");
    expect(sectionReadiness("reference", { ...empty(), reference: [] })).toBe("none");
  });
  it("additionalInfo: any entry is full", () => {
    expect(sectionReadiness("additionalInfo", { ...empty(), additionalInfo: ["Driven"] })).toBe("full");
  });
  it("handles missing/null sections without throwing", () => {
    expect(sectionReadiness("experiences", {})).toBe("none");
    expect(sectionReadiness("personal", { personal: null })).toBe("none");
  });
});

describe("cvReadiness", () => {
  it("empty CV scores 0", () => {
    expect(cvReadiness(empty()).percent).toBe(0);
  });
  it("all sections full scores 100", () => {
    const full = {
      ...empty(),
      personal: { fullName: "Ada", title: "Engineer", email: "a@b.c", phone: "1", location: "X", linkedin: "in/a" },
      profile: "x".repeat(40),
      competency: ["a", "b", "c"],
      experiences: [{ id: "1", company: "C", role: "R", period: "", details: "p" }, { id: "2", company: "D", role: "", period: "", details: "q" }],
      education: [{ id: "1", institution: "MIT", qualification: "BSc", period: "" }],
      certificate: [{ id: "1", name: "PMP", date: "" }],
      skill: ["s1", "s2", "s3"],
      reference: [{ id: "1", name: "R", company: "", role: "", email: "", phone: "" }],
      additionalInfo: ["Driven"],
    };
    expect(cvReadiness(full).percent).toBe(100);
  });
  it("halves count partial sections", () => {
    const d = { ...empty(), profile: "short", skill: ["one"] };
    const r = cvReadiness(d);
    expect(r.percent).toBeGreaterThan(0);
    expect(r.percent).toBeLessThan(50);
  });
});

describe("readinessFromSections / hasFlagsToSections", () => {
  it("maps presence flags to an ordered section list", () => {
    const flags = { profile: true, skill: true, personal: true };
    expect(hasFlagsToSections(flags)).toEqual(["personal", "profile", "skill"]);
  });
  it("computes percent from presence", () => {
    expect(readinessFromSections([])).toBe(0);
    expect(readinessFromSections(SECTION_KEYS)).toBe(100);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `docker compose exec app npm run test -- readiness`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `app/lib/readiness.ts`**

```ts
export type SectionKey =
  | "personal" | "profile" | "competency" | "experiences" | "education"
  | "certificate" | "skill" | "reference" | "additionalInfo";

export type SectionState = "none" | "partial" | "full";

export interface SectionReadiness {
  key: SectionKey;
  label: string;
  state: SectionState;
}

export interface CVReadiness {
  percent: number;
  sections: SectionReadiness[];
}

export const SECTION_KEYS: SectionKey[] = [
  "personal", "profile", "competency", "experiences", "education",
  "certificate", "skill", "reference", "additionalInfo",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  personal: "Personal information",
  profile: "Professional profile",
  competency: "Core competencies",
  experiences: "Work experience",
  education: "Education & qualifications",
  certificate: "Certificates & licenses",
  skill: "Technical competencies",
  reference: "References",
  additionalInfo: "Additional information",
};

function filled<T>(
  items: T[] | undefined,
  ok: (item: T) => boolean,
): number {
  return (items ?? []).filter(ok).length;
}

const nonEmpty = (s: string | undefined | null): string =>
  (s ?? "").trim();

function filledStrings(items: unknown[] | undefined): number {
  return (items ?? []).filter(
    (i) => typeof i === "string" && i.trim() !== "",
  ).length;
}

export function sectionReadiness(
  key: SectionKey,
  data: Record<string, unknown>,
): SectionState {
  switch (key) {
    case "personal": {
      const p = data.personal as
        | { fullName?: string; title?: string; phone?: string; email?: string; location?: string; linkedin?: string }
        | null
        | undefined;
      if (!p || (!nonEmpty(p.fullName) && !nonEmpty(p.title))) return "none";
      const count = [p.fullName, p.title, p.email, p.phone, p.location, p.linkedin].filter(Boolean).length;
      return count >= 3 ? "full" : "partial";
    }
    case "profile": {
      const len = nonEmpty(data.profile as string).length;
      if (len === 0) return "none";
      return len >= 40 ? "full" : "partial";
    }
    case "competency":
    case "skill": {
      const n = filledStrings(data[key] as unknown[]);
      if (n === 0) return "none";
      return n >= 3 ? "full" : "partial";
    }
    case "experiences": {
      const rows = data.experiences as
        | Array<{ company?: string; details?: string }>
        | undefined;
      const n = filled(rows, (e) => nonEmpty(e.company) !== "" && nonEmpty(e.details) !== "");
      if (n === 0) return "none";
      return n >= 2 ? "full" : "partial";
    }
    case "education": {
      const rows = data.education as
        | Array<{ institution?: string; qualification?: string }>
        | undefined;
      if (filled(rows, (e) => nonEmpty(e.institution) !== "") === 0) return "none";
      return (rows ?? []).some((e) => nonEmpty(e.qualification) !== "") ? "full" : "partial";
    }
    case "certificate": {
      const rows = data.certificate as Array<{ name?: string }> | undefined;
      return filled(rows, (c) => nonEmpty(c.name) !== "") >= 1 ? "full" : "none";
    }
    case "reference": {
      const rows = data.reference as Array<{ name?: string }> | undefined;
      return filled(rows, (r) => nonEmpty(r.name) !== "") >= 1 ? "full" : "none";
    }
    case "additionalInfo": {
      return filledStrings(data.additionalInfo as unknown[]) >= 1 ? "full" : "none";
    }
  }
}

export function cvReadiness(data: Record<string, unknown>): CVReadiness {
  const sections = SECTION_KEYS.map((key) => ({
    key,
    label: SECTION_LABELS[key],
    state: sectionReadiness(key, data),
  }));
  const weights: Record<SectionState, number> = { none: 0, partial: 0.5, full: 1 };
  const total = sections.reduce((sum, s) => sum + weights[s.state], 0);
  return { percent: Math.round((total / sections.length) * 100), sections };
}

export function hasFlagsToSections(
  flags: Partial<Record<SectionKey, boolean>>,
): SectionKey[] {
  return SECTION_KEYS.filter((key) => flags[key] === true);
}

export function readinessFromSections(sections: SectionKey[]): number {
  return Math.round((sections.length / SECTION_KEYS.length) * 100);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `docker compose exec app npm run test -- readiness`
Expected: PASS (all 16 assertions).

- [ ] **Step 5: Commit**

```bash
git add app/lib/readiness.ts app/lib/readiness.test.ts
git commit -m "feat: add pure CV readiness module with unit tests"
```

---

## Task 2: Design tokens + typography (light theme ground

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: Tailwind v4 token utilities `bg-canvas`, `bg-desk`, `bg-surface`, `text-ink`, `text-muted`, `text-faint`, `border-hairline`, `text-accent`, `bg-accent`, `bg-accent-soft`, `text-status-good`, `text-status-warn`; `--font-sans` (Mulish via `--font-body`), `--font-heading` (Fraunces). `font-[family-name:var(--font-heading)]` (14 existing usages) now resolves.
- Consumes: nothing. All later tasks use these tokens.

- [ ] **Step 1: Rewrite `app/layout.tsx` fonts**

Replace the `Geist`/`Geist_Mono` imports and `RootLayout` `<body>`:

```tsx
import type { Metadata } from "next";
import { Fraunces, Mulish } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spectres | Skill Stack",
  description: "AI-Powered CV Builder",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html>
      <body className={`${mulish.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace the top of `app/globals.css`**

Remove the two `@import url(...)` lines (Mulish now via `next/font`; Typekit `century-gothic` no longer used), and replace the `:root` + `@theme inline` + dark-mode block + `body` with:

```css
@import "tailwindcss";

:root {
  --background: #f6f4ef;
  --foreground: #1c2520;
}

@theme inline {
  --color-canvas: #f6f4ef;
  --color-desk: #efede8;
  --color-surface: #ffffff;
  --color-ink: #1c2520;
  --color-muted: #6b7280;
  --color-faint: #9ca3af;
  --color-hairline: #e6e3dd;
  --color-accent: #0f766e;
  --color-accent-soft: #eef4f3;
  --color-status-good: #15803d;
  --color-status-warn: #b45309;
  --font-sans: var(--font-body);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}

body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans), sans-serif;
}
```

Leave every CV-preview rule, the `@media print` block, and `@page { size: A4; margin: 15mm; }` untouched below this section.

- [ ] **Step 3: Verify build + tokens resolve**

Run: `docker compose exec app npm run build`
Expected: BUILD PASSED. (Next/font downloads Fraunces + Mulish at build, same as Geist did.)

Run: `docker compose exec app npm run test`
Expected: PASS — existing unit suite unaffected.

Run: `docker compose exec app sh -c 'grep -rc "font-\[family-name:var(--font-heading)\]" app | wc -l'`
Expected: `14` — the referenced token now resolves via `--font-heading` on `<body>`.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add light-theme design tokens and fix --font-heading (Fraunces/Mulish)"
```

---

## Task 3: `ready_override` column + list readiness + ready route

**Files:**
- Modify: `app/lib/db.ts`
- Modify: `app/api/cv/route.ts`
- Create: `app/api/cv/[id]/ready/route.ts`
- Create: `app/api/cv/[id]/__tests__/ready-route.test.ts`

**Interfaces:**
- Consumes: `hasFlagsToSections`, `readinessFromSections`, `SectionKey` from T1.
- Produces:
```ts
// db.ts
export async function setCVReady(cvId: number, ready: boolean): Promise<{ success: true; cvId: number }>;
// getAllCVs() row now: { id, fullName, title, phone, email, location, linkedin, profile, createdAt, updatedAt, readyOverride: boolean, sections: SectionKey[], readinessPercent: number }
// api/cv/route.ts GET → { success: true, cvs } (rows above)
// api/cv/[id]/ready/route.ts POST { ready: boolean } → { success: true, cvId } | 400
```

- [ ] **Step 1: Write the failing route test**

`app/api/cv/[id]/__tests__/ready-route.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/app/lib/db", () => ({
  setCVReady: vi.fn(),
}));

import { POST } from "../route";
import { setCVReady } from "@/app/lib/db";

const mockSetCVReady = vi.mocked(setCVReady);

function req(body: unknown): Request {
  return new Request("http://localhost/api/cv/1/ready", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/cv/[id]/ready", () => {
  beforeEach(() => mockSetCVReady.mockClear());

  it("toggles ready_override and returns cvId", async () => {
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 7 });
    const res = await POST(req({ ready: true }), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(res.status).toBe(200);
    expect(mockSetCVReady).toHaveBeenCalledWith(7, true);
    expect(await res.json()).toMatchObject({ success: true, cvId: 7 });
  });

  it("rejects an invalid id without touching the db", async () => {
    const res = await POST(req({ ready: true }), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(mockSetCVReady).not.toHaveBeenCalled();
  });

  it("defaults a missing ready flag to false", async () => {
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 1 });
    await POST(req({}), { params: Promise.resolve({ id: "1" }) });
    expect(mockSetCVReady).toHaveBeenCalledWith(1, false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `docker compose exec app npm run test -- ready-route`
Expected: FAIL — `route` module not found.

- [ ] **Step 3: Add the db pieces and route**

In `app/lib/db.ts`:

Add to the `CREATE TABLE IF NOT EXISTS cvs` block (after `template_settings`):

```sql
ready_override BOOLEAN DEFAULT false,
```

Add immediately after the existing `template_settings` idempotent ALTER (line ~78):

```sql
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS ready_override BOOLEAN DEFAULT false
```

Replace `getAllCVs` (currently `app/lib/db.ts:351-358`) with a version that aggregates section presence and readiness. Add the import at the top of `db.ts`:

```ts
import {
  hasFlagsToSections, readinessFromSections,
  type SectionKey,
} from "./readiness";
```

```ts
export async function getAllCVs() {
  const result = await getPool().query(`
    SELECT
      cvs.id,
      cvs.full_name as "fullName",
      cvs.title,
      cvs.phone,
      cvs.email,
      cvs.location,
      cvs.linkedin,
      cvs.profile,
      cvs.created_at as "createdAt",
      cvs.updated_at as "updatedAt",
      cvs.ready_override as "readyOverride",
      (cvs.full_name IS NOT NULL AND cvs.full_name <> '') AS "hasPersonal",
      (cvs.profile IS NOT NULL AND cvs.profile <> '') AS "hasProfile",
      EXISTS (SELECT 1 FROM competencies c WHERE c.cv_id = cvs.id AND c.competency <> '') AS "hasCompetency",
      EXISTS (SELECT 1 FROM experiences e WHERE e.cv_id = cvs.id AND (e.company <> '' OR e.details <> '')) AS "hasExperiences",
      EXISTS (SELECT 1 FROM education ed WHERE ed.cv_id = cvs.id AND ed.institution <> '') AS "hasEducation",
      EXISTS (SELECT 1 FROM certificates ce WHERE ce.cv_id = cvs.id AND ce.name <> '') AS "hasCertificate",
      EXISTS (SELECT 1 FROM skills s WHERE s.cv_id = cvs.id AND s.skill <> '') AS "hasSkill",
      EXISTS (SELECT 1 FROM reference_list r WHERE r.cv_id = cvs.id AND r.name <> '') AS "hasReference",
      EXISTS (SELECT 1 FROM additional_info a WHERE a.cv_id = cvs.id AND a.info <> '') AS "hasAdditionalInfo"
    FROM cvs
    ORDER BY cvs.updated_at DESC
  `);

  return result.rows.map((row) => {
    const flags: Partial<Record<SectionKey, boolean>> = {
      personal: row.hasPersonal,
      profile: row.hasProfile,
      competency: row.hasCompetency,
      experiences: row.hasExperiences,
      education: row.hasEducation,
      certificate: row.hasCertificate,
      skill: row.hasSkill,
      reference: row.hasReference,
      additionalInfo: row.hasAdditionalInfo,
    };
    const sections = hasFlagsToSections(flags);
    return {
      id: row.id,
      fullName: row.fullName,
      title: row.title,
      phone: row.phone,
      email: row.email,
      location: row.location,
      linkedin: row.linkedin,
      profile: row.profile,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      readyOverride: row.readyOverride,
      sections,
      readinessPercent: readinessFromSections(sections),
    };
  });
}
```

Add at the end of `db.ts` (next to the other cv-level helpers):

```ts
export async function setCVReady(
  cvId: number,
  ready: boolean,
): Promise<{ success: true; cvId: number }> {
  await getPool().query(
    "UPDATE cvs SET ready_override = $1 WHERE id = $2",
    [ready, cvId],
  );
  return { success: true, cvId };
}
```

Create `app/api/cv/[id]/ready/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/app/lib/log";
import { setCVReady } from "@/app/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = parseInt(id, 10);
  if (Number.isNaN(cvId)) {
    return NextResponse.json({ success: false, message: "Invalid CV ID" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const ready = typeof body.ready === "boolean" ? body.ready : false;
  await setCVReady(cvId, ready);
  logger.info("api.cv.item", "ready override set", { cvId, ready });
  return NextResponse.json({ success: true, cvId });
}
```

- [ ] **Step 4: Run tests to verify the route passes**

Run: `docker compose exec app npm run test`
Expected: PASS — new route tests + existing suite. (The `db.ts` SQL path is exercised by task T4's e2e.)

- [ ] **Step 5: Commit**

```bash
git add app/lib/db.ts app/api/cv/route.ts app/api/cv/[id]/ready/route.ts app/api/cv/[id]/__tests__/ready-route.test.ts
git commit -m "feat: add ready_override column, readiness-rich CV list, and ready toggle route"
```

---

## Task 4: Roster (`/cvs`) + root redirect

**Files:**
- Create: `app/components/ui/Roster.tsx`
- Modify: `app/cvs/page.tsx` (render Roster; delete `confirm()` delete)
- Modify: `app/page.tsx` (redirect to `/cvs`)
- Create: `e2e/roster.spec.ts`
- Modify: `e2e/cv-list.spec.ts`

**Interfaces:**
- Consumes: `GET /api/cv` list (T3 shape), `DELETE /api/cv/[id]` (existing), `POST /api/cv/[id]/ready` (T3), `GET /api/cv/[id]` (existing `{success, cv}`), `POST /api/cv` (existing), `exportCVToBlob` (`app/lib/export/exportDispatcher.ts`), design tokens (T2).
- Produces: `app/components/ui/Roster.tsx` (controlled row actions), a tested roster e2e, and new first-load affordances.

- [ ] **Step 1: Update `e2e/cv-list.spec.ts` for the roster**

The existing spec asserts an `h1`/`h2` on `/cvs`. Roster keeps an `h1` `data-testid="roster-title"`. Replace the spec body:

```ts
import { expect, test } from "@playwright/test";

test("roster loads with a title and a create action", async ({ page }) => {
  await page.goto("/cvs");
  await expect(page.getByTestId("roster-title")).toBeVisible();
  await expect(page.getByRole("link", { name: /New client CV/ })).toBeVisible();
});
```

- [ ] **Step 2: Write the failing roster e2e**

`e2e/roster.spec.ts` (no branch dependency on introspection — creates data via API):

```ts
import { expect, test, type APIRequestContext } from "@playwright/test";

async function createCV(request: APIRequestContext, fullName: string) {
  const res = await request.post("/api/cv", {
    data: {
      personal: { fullName, title: "Engineer", phone: "", email: "a@b.c", location: "", linkedin: "" },
      profile: "Projects things.",
      competency: ["Typescript", "SQL", "AWS"],
      experiences: [
        { company: "Acme", role: "Dev", period: "2020-2023", details: "Built the things." },
        { company: "Globex", role: "Senior Dev", period: "", details: "Led a team." },
      ],
      education: [], certificate: [], skill: ["ledgering"], reference: [], additionalInfo: [],
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).cvId as number;
}

test.describe("roster", () => {
  test("shows a ready dot for a complete CV and opens the editor", async ({ page, request }) => {
    const cvId = await createCV(request, "Roster Ready");
    await page.goto("/cvs");
    await expect(page.getByText("Roster Ready")).toBeVisible();
    await expect(page.getByTestId(`ready-dot-${cvId}`)).toHaveClass(/status-good/);
    await page.locator(`[data-testid="row-${cvId}"] a[href="/cvs/${cvId}/edit"]`).click();
    await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  });

  test("marking ready persists after reload", async ({ page, request }) => {
    const cvId = await createCV(request, "Roster Empty");
    await page.goto("/cvs");
    await page.locator(`[data-testid="row-${cvId}"]`).getByRole("button", { name: /More/ }).click();
    await page.getByRole("menuitem", { name: "Mark ready" }).click();
    await expect(page.getByTestId(`ready-dot-${cvId}`)).toHaveClass(/status-good/);
    await page.reload();
    await expect(page.getByTestId(`ready-dot-${cvId}`)).toHaveClass(/status-good/);
  });

  test("delete uses an inline confirm and removes the row", async ({ page, request }) => {
    const cvId = await createCV(request, "Roster Delete Me");
    await page.goto("/cvs");
    await page.locator(`[data-testid="row-${cvId}"]`).getByRole("button", { name: /More/ }).click();
    await page.getByRole("menuitem", { name: /Delete/ }).click();
    await expect(page.getByTestId("confirm-delete")).toBeVisible();
    await page.locator(`[data-testid="confirm-delete"]`).getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(`[data-testid="row-${cvId}"]`)).toHaveCount(0);
  });

  test("quick PDF downloads a named file", async ({ page, request }) => {
    const cvId = await createCV(request, "Roster Pdf");
    await page.goto("/cvs");
    const downloadPromise = page.waitForEvent("download");
    await page.locator(`[data-testid="row-${cvId}"]`).getByRole("button", { name: /PDF/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("Roster_Pdf");
  });
});
```

- [ ] **Step 3: Run to verify the failing e2e**

Run: `docker compose exec app npm run test:e2e -- roster.spec.ts`
Expected: FAIL at the first assertion (roster elements absent).

- [ ] **Step 4: Implement `app/components/ui/Roster.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, Download, MoreVertical, Plus, Trash2, FileText } from "lucide-react";
import { readinessFromSections, type SectionKey } from "@/app/lib/readiness";
import { exportCVToBlob } from "@/app/lib/export/exportDispatcher";

interface RosterRow {
  id: number;
  fullName: string;
  title: string;
  readyOverride: boolean;
  sections: SectionKey[];
  readinessPercent: number;
  updatedAt: string;
}

interface RosterProps {
  cvs: RosterRow[];
}

const THUMB_SECTIONS = ["personal", "profile", "experiences", "education", "skill", "reference"] as SectionKey[];

function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const days = Math.floor(delta / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function Roster({ cvs }: RosterProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "drafting" | "ready">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const status = (row: RosterRow) => {
    const derivedReady = row.readinessPercent >= 100;
    return row.readyOverride || derivedReady ? "ready" : row.readinessPercent > 0 ? "drafting" : "drafting";
  };

  const rows = useMemo(() => {
    const list = [...cvs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return filter === "all" ? list : list.filter((r) => status(r) === filter);
  }, [cvs, filter]);

  const updateReady = async (row: RosterRow, ready: boolean) => {
    setBusy(row.id);
    await fetch(`/api/cv/${row.id}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ready }),
    });
    router.refresh();
    setBusy(null);
  };

  const doDelete = async (id: number) => {
    await fetch(`/api/cv/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    router.refresh();
  };

  const duplicate = async (row: RosterRow) => {
    setBusy(row.id);
    const res = await fetch(`/api/cv/${row.id}`);
    const { cv } = await res.json();
    const strip = (items: Array<Record<string, unknown>>) =>
      items.map(({ id: _id, ...rest }) => rest);
    await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personal: { ...cv.personal, fullName: `${cv.full_name} (copy)` },
        profile: cv.profile ?? "",
        competency: cv.competency ?? [],
        experiences: strip(cv.experiences ?? []),
        education: strip(cv.education ?? []),
        certificate: strip(cv.certificate ?? []),
        skill: cv.skill ?? [],
        reference: strip(cv.reference ?? []),
        additionalInfo: cv.additionalInfo ?? [],
        templateSettings: cv.template_settings ?? {},
      }),
    });
    setBusy(null);
    router.refresh();
  };

  const quickPdf = async (row: RosterRow) => {
    setBusy(row.id);
    const res = await fetch(`/api/cv/${row.id}`);
    const { cv } = await res.json();
    const blob = await exportCVToBlob("pdf", {
      data: {
        personal: { fullName: cv.full_name, title: cv.title, phone: cv.phone, email: cv.email, location: cv.location, linkedin: cv.linkedin },
        profile: cv.profile ?? "",
        competency: cv.competency ?? [],
        experiences: cv.experiences ?? [],
        education: cv.education ?? [],
        certificate: cv.certificate ?? [],
        skill: cv.skill ?? [],
        reference: cv.reference ?? [],
        additionalInfo: cv.additionalInfo ?? [],
      },
      templateId: cv.template_settings?.template ?? "classic",
      themeId: cv.template_settings?.theme,
      fontPairId: cv.template_settings?.fontPair,
      photoUrl: `/api/photo/${row.id}`,
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${cv.full_name || "CV"}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(null);
  };

  if (cvs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 data-testid="roster-title" className="font-[family-name:var(--font-heading)] text-3xl text-ink">Client CVs</h1>
        <p className="mt-3 text-muted">Two steps to a client-ready CV.</p>
        <p className="mt-1 text-sm text-muted">1. Answer a few guided questions · 2. Review and polish the result in the editor.</p>
        <Link href="/cvs/new" className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-white">
          <Plus size={16} /> Start your first client CV
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 data-testid="roster-title" className="font-[family-name:var(--font-heading)] text-3xl text-ink">Client CVs</h1>
        <Link href="/cvs/new" className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-white">
          <Plus size={16} /> New client CV
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {(["all", "drafting", "ready"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={f === filter ? "rounded-full bg-ink px-3 py-1 text-sm text-white" : "rounded-full border border-hairline bg-surface px-3 py-1 text-sm text-muted"}
          >
            {f === "all" ? "All" : f === "drafting" ? "Drafting" : "Ready to send"}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((row) => {
          const st = status(row);
          const manual = row.readyOverride;
          return (
            <li
              key={row.id}
              data-testid={`row-${row.id}`}
              className="flex items-center gap-4 rounded-lg border border-hairline bg-surface p-4"
            >
              <svg viewBox="0 0 40 52" className="h-14 w-11 shrink-0 rounded-sm border border-hairline bg-white p-1" aria-hidden>
                <rect x="2" y="4" width="36" height="4" rx="1" className="fill-hairline" />
                {(["personal", "profile", "experiences", "education", "skill", "reference"] as SectionKey[]).map((s, i) => (
                  <rect
                    key={s}
                    x="2"
                    y={10 + i * 7}
                    width={row.sections.includes(s) ? 30 : 16}
                    height="3"
                    rx="1"
                    className={row.sections.includes(s) ? "fill-accent" : "fill-hairline"}
                  />
                ))}
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{row.fullName || "Untitled CV"}</span>
                  {manual && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">manual</span>}
                </div>
                <p className="truncate text-sm text-muted">{row.title || "No headline yet"}</p>
                <p className="text-xs text-faint">Updated {timeAgo(row.updatedAt)} · {row.readinessPercent}% complete</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  data-testid={`ready-dot-${row.id}`}
                  className={
                    st === "ready"
                      ? "inline-flex h-2.5 w-2.5 rounded-full bg-status-good"
                      : "inline-flex h-2.5 w-2.5 rounded-full bg-status-warn"
                  }
                  title={st === "ready" ? "Ready to send" : "Drafting"}
                />
                <Link
                  href={`/cvs/${row.id}/edit`}
                  className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink"
                >
                  Open
                </Link>
                <button
                  onClick={() => quickPdf(row)}
                  disabled={busy === row.id}
                  className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1.5 text-sm text-muted"
                  aria-label="Quick PDF"
                >
                  <Download size={14} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === row.id ? null : row.id)}
                    className="rounded-md border border-hairline p-1.5 text-muted"
                    aria-label="More"
                    aria-expanded={confirmDeleteId === row.id}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {confirmDeleteId === row.id && (
                    <div
                      data-testid="confirm-delete"
                      className="absolute right-0 top-9 z-10 w-56 rounded-lg border border-hairline bg-surface p-2 shadow-lg"
                    >
                      <button
                        onClick={() => updateReady(row, !row.readyOverride)}
                        disabled={busy === row.id}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-accent-soft"
                        role="menuitem"
                      >
                        {row.readyOverride ? <Circle size={14} /> : <Check size={14} />}
                        {row.readyOverride ? "Clear mark ready" : "Mark ready"}
                      </button>
                      <button
                        onClick={() => duplicate(row)}
                        disabled={busy === row.id}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-accent-soft"
                        role="menuitem"
                      >
                        <FileText size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => doDelete(row.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-status-warn hover:bg-accent-soft"
                        role="menuitem"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Rewire `app/cvs/page.tsx` and redirect `/`**

Fetch the list server-side (App Router page) and delegate:

```tsx
import { getAllCVs } from "@/app/lib/db";
import { Roster } from "@/app/components/ui/Roster";

export const dynamic = "force-dynamic";

export default async function CvsPage() {
  const cvs = await getAllCVs();
  return <Roster cvs={cvs} />;
}
```

Replace `app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/cvs");
}
```

- [ ] **Step 6: Run e2e to verify roster passes**

Run: `docker compose exec app npm run test:e2e -- roster.spec.ts cv-list.spec.ts`
Expected: PASS (download assertion needs chromium PDF generation, which works headless). If the quick-PDF test is flaky in the harness, it may be downgraded to a manual check note; keep it green locally.

- [ ] **Step 7: Commit**

```bash
git add app/components/ui/Roster.tsx app/cvs/page.tsx app/page.tsx e2e/roster.spec.ts e2e/cv-list.spec.ts
git commit -m "feat: roster workspace with readiness dots, mark-ready, duplicate, quick PDF"
```

---

## Task 5: Restyle shared form & UI components to tokens

**Files:**
- Modify: all of `app/components/Forms/*.tsx`
- Modify: `app/components/ui/UploadPhoto.tsx`, `app/components/ui/ExportButtons.tsx` (if present), `app/components/ui/Breadcrumb.tsx`

**Interfaces:**
- Consumes: T2 tokens.
- Produces: light-themed form internals (placeholders, aria-labels, and prop contracts UNCHANGED so qa/tailor specs keep working).

- [ ] **Step 1: Migrate the palette in the form files**

Apply to each file in `app/components/Forms/` (`PersonalInfoForm.tsx`, `ProfileForm.tsx`, `ExperienceForm.tsx`, `EducationForm.tsx`, `SkillsForm.tsx`, `CompetenciesForm.tsx`, `CertificatesForm.tsx`, `ReferencesForm.tsx`, `AdditionalInfoForm.tsx`) and to `app/components/ui/UploadPhoto.tsx`, `ExportButtons.tsx`, `Breadcrumb.tsx`:

Replace arbitrary-value hex classes with tokens per the map (do NOT change any `placeholder=`, `aria-`, or element order):

| Old class | New token |
|---|---|
| `bg-[#0d0d0d]` | `bg-canvas` |
| `bg-[#1a1a1a]`, `bg-[#242424]` | `bg-surface` |
| `border-[#333]`, `border-[#444]` | `border-hairline` |
| `text-[#e8e6e3]` | `text-ink` |
| `text-[#8a8a8a]`, `text-[#666]` | `text-muted` |
| `text-[#d4a853]`, `bg-[#d4a853]`, `hover:bg-[#b8923e]`, `border-[#d4a853]` | `text-accent` / `bg-accent` / `hover:bg-accent` / `border-accent` |
| `bg-[#d4a85315]`, `bg-[#d4a85325]`, `bg-[#d4a85340]` | `bg-accent-soft` |
| shadow/dark-on-dark (`bg-white text-black` inversions) | `bg-surface text-ink` |

Example — `ExperienceForm.tsx` card wrapper today (`border border-[#333] bg-[#1a1a1a]`) becomes `border border-hairline bg-surface`; the add button (`bg-[#d4a853] text-black`) becomes `bg-accent text-white`; the remove button (`text-red-400`) stays but tombstone any `bg-[#0d0d0d]` inputs to `bg-surface border-hairline`.

- [ ] **Step 2: Verify**

Run: `docker compose exec app npm run lint`
Expected: no new errors.
Run: `docker compose exec app npm run build`
Expected: PASSED — no unused token imports, classes valid under new theme tokens.

- [ ] **Step 3: Commit**

```bash
git add app/components/Forms app/components/ui
git commit -m "style: migrate form and shared UI to light design tokens"
```

---

## Task 6: Preview page light restyle

**Files:**
- Modify: `app/cvs/[id]/preview/page.tsx`
- Modify: `e2e/preview-page.spec.ts` (only if selectors break)

**Interfaces:**
- Consumes: T2 tokens; reuses `Header` (kept) and `CVPreviewWrapper` unchanged.
- Produces: light preview page; unchanged `Print`/`Preview` affordances (specs keep working), print/PDF fidelity untouched.

- [ ] **Step 1: Restyle the preview page chrome**

In `app/cvs/[id]/preview/page.tsx`, replace the dark wrapper classes with tokens: outermost `min-h-screen bg-[#0d0d0d]` → `min-h-screen bg-canvas`; `Header` keeps functioning (its internal `bg-[#1a1a1a]` → `bg-surface border-hairline`, arrow text `text-[#e8e6e3]` → `text-ink`, done in `Header.tsx`). Any page-2 bottom bar `bg-[#1a1a1a]` → `bg-surface border-t border-hairline`. The `#cv-print-area` and `CVPreviewWrapper` internals must remain untouched.

- [ ] **Step 2: Verify**

Run: `docker compose exec app npm run test:e2e -- preview-page.spec.ts`
Expected: PASS (still asserts Print/Preview buttons for `/cvs/999999/preview` and `/edit`).
Run: `docker compose exec app npm run build`

- [ ] **Step 3: Commit**

```bash
git add app/cvs/[id]/preview/page.tsx app/components/ui/Header.tsx e2e/preview-page.spec.ts
git commit -m "style: restyle CV preview page to light theme"
```

---

## Task 7: Generic per-section rewrite endpoint

**Files:**
- Modify: `app/lib/tailor/tailor.ts` (add `rewriteSection`)
- Create: `app/lib/tailor/__tests__/rewriteSection.test.ts`
- Create: `app/api/tailor/rewrite/route.ts`

**Interfaces:**
- Consumes: `chat` (`app/lib/llm/ollama.ts`), `llmConfig()`, `guardNoFabrication` (already in `tailor.ts`), the existing private `SYSTEM` prompt constant in `tailor.ts`.
- Produces:
```ts
// tailor.ts
export async function rewriteSection(args: {
  section: string;
  original: string;
  instruction?: string;
  sourceText?: string;
  chatFn?: typeof chat;
}): Promise<{ proposed: string; guard: { ok: boolean; reason?: string } }>;
// api/tailor/rewrite/route.ts POST { section, original, instruction?, sourceText? } →
//   { success: true, diff: TailorDiff, guard: { ok, reason? } } | { success: false, message: string } (400/soft)
```
Later consumed by T8 ("Suggested summary") and T10 (editor polish).

- [ ] **Step 1: Write the failing unit test**

`app/lib/tailor/__tests__/rewriteSection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rewriteSection } from "../tailor";

const chatFn = async (): Promise<string> =>
  "Built and shipped a resume tool used by consultants, working in TypeScript and SQL.";

describe("rewriteSection", () => {
  it("returns a proposed rewrite and a passing guard for faithful text", async () => {
    const original = "Built resume tool. TypeScript. SQL.";
    const result = await rewriteSection({
      section: "profile",
      original,
      chatFn,
    });
    expect(result.proposed).not.toBe("");
    expect(result.guard.ok).toBe(true);
  });

  it("flags fabricated facts via the guard", async () => {
    const lyingFn = async (): Promise<string> =>
      "Won the Nobel Prize for building a rocket to Mars.";
    const result = await rewriteSection({
      section: "profile",
      original: "Built resume tool. TypeScript. SQL.",
      chatFn: lyingFn,
    });
    expect(result.guard.ok).toBe(false);
    expect(result.guard.reason).toMatch(/Nobel|rocket|Mars/);
  });

  it("uses sourceText as the guard basis for empty originals (draft mode)", async () => {
    const source = "Ada Lovelace. Analytical Engine programmer. 1843.";
    const draftFn = async (): Promise<string> =>
      "Ada Lovelace is a programmer who worked on the Analytical Engine in 1843.";
    const result = await rewriteSection({
      section: "profile",
      original: "",
      sourceText: source,
      chatFn: draftFn,
    });
    expect(result.guard.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `docker compose exec app npm run test -- rewriteSection`
Expected: FAIL — `rewriteSection` not exported.

- [ ] **Step 3: Implement `rewriteSection` in `app/lib/tailor/tailor.ts`**

The existing `SYSTEM` const is module-private. Reuse it (both functions sit in `tailor.ts`) and append:

```ts
export async function rewriteSection(args: {
  section: string;
  original: string;
  instruction?: string;
  sourceText?: string;
  chatFn?: typeof chat;
}): Promise<{ proposed: string; guard: { ok: boolean; reason?: string } }> {
  const { section, original, instruction, sourceText, chatFn: fn } = args;
  const base = (sourceText ?? original).trim();
  const sourceBlock = base
    ? `SOURCE (${section}):\n${base}`
    : `SOURCE (${section}):\n${original}`;
  const directive =
    instruction?.trim()
      ? `ADDITIONAL INSTRUCTION: ${instruction}\n`
      : "Polish the text to be concise, specific, and professional, staying faithful to the source facts.";
  const prompt = `${sourceBlock}\n\n${directive}\nREWRITE:`;
  const proposed = (await (fn ?? chat)({
    model: llmConfig().tailorModel,
    system: SYSTEM,
    prompt,
  })).trim();
  return { proposed, guard: guardNoFabrication(base || original, proposed) };
}
```

- [ ] **Step 4: Create the route `app/api/tailor/rewrite/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { rewriteSection } from "@/app/lib/tailor/tailor";
import type { TailorDiff } from "@/app/lib/tailor/types";
import { logger } from "@/app/lib/log";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { section, original, instruction, sourceText } = body as {
    section?: string;
    original?: string;
    instruction?: string;
    sourceText?: string;
  };
  const target = (original ?? "").trim();
  if (!section || (!target && !sourceText)) {
    return NextResponse.json(
      { success: false, message: "Provide section and original or sourceText" },
      { status: 400 },
    );
  }

  const { proposed, guard } = await rewriteSection({
    section,
    original: target,
    instruction,
    sourceText,
  });
  logger.info("tailor.rewrite", "section rewritten", { section, guardOk: guard.ok });

  if (!guard.ok) {
    return NextResponse.json(
      { success: false, message: "No safe changes suggested." },
      { status: 200 },
    );
  }

  const diff: TailorDiff = {
    key: section,
    section,
    label: section,
    original: target,
    proposed,
    status: proposed === target ? "original" : "changed",
  };
  return NextResponse.json({ success: true, diff, guard });
}
```

- [ ] **Step 5: Run tests**

Run: `docker compose exec app npm run test -- rewriteSection`
Expected: PASS (3 new + existing tailor/guards).

- [ ] **Step 6: Commit**

```bash
git add app/lib/tailor/tailor.ts app/lib/tailor/__tests__/rewriteSection.test.ts app/api/tailor/rewrite/route.ts
git commit -m "feat: generic per-section rewrite endpoint with no-fabrication guard"
```

---

## Task 8: Guided Capture (`/cvs/new`)

**Files:**
- Create: `app/components/capture/GuidedCapture.tsx`, `app/components/capture/CaptureStepper.tsx`, `app/components/capture/StepStyle.tsx`
- Modify: `app/cvs/new/page.tsx` (render stepper, own 4-step state; remove old two-pane form)
- Create: `e2e/guided-capture.spec.ts`
- Modify: `e2e/template-selector.spec.ts`

**Interfaces:**
- Consumes: T1 readiness, T2 tokens, T7 `POST /api/tailor/rewrite`, existing `POST /api/cv`, `TemplateSelector`, `CVPreview`, `Forms/*`.
- Produces: `GuidedCapture.tsx` (default export) driving the 4 steps; handoff to `/cvs/[id]/edit`.

- [ ] **Step 1: Update `e2e/template-selector.spec.ts`**

Keep the same user intent (pick template on the new-CV flow) but drive the stepper:

```ts
import { expect, test } from "@playwright/test";

test("guided capture: style step lists templates and Continue creates", async ({ page }) => {
  await page.goto("/cvs/new");
  await expect(page.getByTestId("capture-title")).toBeVisible();
  await page.getByRole("button", { name: /style/i }).click();
  await expect(page.getByText("Choose your template", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  expect(page.url()).toMatch(/\/cvs\/\d+\/edit$/);
});
```

- [ ] **Step 2: Write the failing e2e**

`e2e/guided-capture.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("guided capture completes to a drafting editor with a partial CV", async ({ page }) => {
  await page.goto("/cvs/new");
  await page.getByLabel("Full name").fill("Guided Client");
  await page.getByLabel("Job title").fill("Consultant");
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.getByPlaceholder("e.g. Company name").first().fill("Acme Consulting");
  await page.getByPlaceholder("e.g. Senior consultant").fill("Senior consultant");
  await page.getByRole("button", { name: /Continue/i }).click();

  // Education & Skills: add two skills
  await page.getByPlaceholder("e.g. Strategy").fill("Strategy");
  await page.getByRole("button", { name: /Add skill/i }).click();
  await page.getByRole("button", { name: /Continue/i }).click();

  // Style step
  await page.getByRole("button", { name: /Continue/i }).click();

  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Guided Client")).toBeVisible();
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `docker compose exec app npm run test:e2e -- guided-capture.spec.ts`
Expected: FAIL — old `/cvs/new` page doesn't have stepper labels.

- [ ] **Step 4: Implement the capture components**

`app/components/capture/CaptureStepper.tsx`:

```tsx
"use client";

import { Check } from "lucide-react";

export type CaptureStepId = "personal" | "work" | "education" | "style";

export const CAPTURE_STEPS: { id: CaptureStepId; label: string }[] = [
  { id: "personal", label: "You" },
  { id: "work", label: "Work" },
  { id: "education", label: "Education & Skills" },
  { id: "style", label: "Style" },
];

export function CaptureStepper({
  step, percent, onNavigate,
}: {
  step: CaptureStepId;
  percent: number;
  onNavigate: (step: CaptureStepId) => void;
}) {
  const idx = CAPTURE_STEPS.findIndex((s) => s.id === step);
  return (
    <nav className="mx-auto max-w-3xl px-6 pt-8">
      <ol className="flex items-center gap-1">
        {CAPTURE_STEPS.map((s, i) => (
          <li key={s.id} className={`flex items-center gap-1 ${i < CAPTURE_STEPS.length - 1 ? "flex-1" : ""}`}>
            <button
              onClick={() => onNavigate(s.id)}
              aria-current={s.id === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                i === idx
                  ? "border-accent bg-accent text-white"
                  : i < idx
                    ? "border-hairline bg-surface text-accent"
                    : "border-hairline bg-surface text-muted"
              }`}
            >
              {i < idx ? <Check size={14} /> : <span>{i + 1}</span>}
              {s.label}
            </button>
            {i < CAPTURE_STEPS.length - 1 && <span className="h-px flex-1 bg-hairline" aria-hidden />}
          </li>
        ))}
      </ol>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-hairline">
        <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{percent}% complete so far</p>
    </nav>
  );
}
```

`app/components/capture/GuidedCapture.tsx` (owns the 4-slice state, per spec flows):

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PersonalInfoForm, ProfileForm, ExperienceForm, EducationForm, SkillsForm } from "@/app/components/Forms";
import { TemplateSelector } from "@/app/components/ui/TemplateSelector";
import { cvReadiness, type SectionKey } from "@/app/lib/readiness";
import type { TemplateId } from "@/app/lib/templates/templateDefinitions";
import { CaptureStepper, CAPTURE_STEPS, type CaptureStepId } from "./CaptureStepper";
import { Sparkles, ArrowRight } from "lucide-react";

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function GuidedCapture() {
  const router = useRouter();
  const [step, setStep] = useState<CaptureStepId>("personal");

  const [personal, setPersonal] = useState({
    fullName: "", title: "", phone: "", email: "", location: "", linkedin: "",
  });
  const [profile, setProfile] = useState("");
  const [experiences, setExperiences] = useState([
    { id: generateId(), company: "", role: "", period: "", details: "" },
  ]);
  const [education, setEducation] = useState([
    { id: generateId(), institution: "", qualification: "", period: "" },
  ]);
  const [skill, setSkill] = useState<string[]>([""]);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classic");
  const [selectedTheme, setSelectedTheme] = useState("default-blue");
  const [selectedFontPair, setSelectedFontPair] = useState("default");

  const [suggestState, setSuggestState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const updatePersonal = (field: string, value: string) =>
    setPersonal((p) => ({ ...p, [field]: value }));
  const addExperience = () =>
    setExperiences((e) => [...e, { id: generateId(), company: "", role: "", period: "", details: "" }]);
  const updateExperience = (id: string | number, field: string, value: string) =>
    setExperiences((e) => e.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  const removeExperience = (id: string | number) =>
    setExperiences((e) => e.filter((x) => x.id !== id));
  const addEducation = () =>
    setEducation((e) => [...e, { id: generateId(), institution: "", qualification: "", period: "" }]);
  const updateEducation = (id: string | number, field: string, value: string) =>
    setEducation((e) => e.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  const removeEducation = (id: string | number) =>
    setEducation((e) => e.filter((x) => x.id !== id));
  const addSkill = () => setSkill((s) => [...s, ""]);
  const updateSkill = (idx: number, value: string) => setSkill((s) => s.map((v, i) => (i === idx ? value : v)));
  const removeSkill = (idx: number) => setSkill((s) => s.filter((_, i) => i !== idx));

  const percent = cvReadiness({
    personal, profile, competency: [],
    experiences, education, certificate: [], skill, reference: [], additionalInfo: [],
  }).percent;

  const suggestSummary = async () => {
    setSuggestState("loading");
    const sourceText = [
      personal.fullName ? `Name: ${personal.fullName}` : "",
      personal.title ? `Title: ${personal.title}` : "",
      ...experiences.filter((e) => e.company).map((e) => `${e.role} at ${e.company}${e.period ? ` (${e.period})` : ""}`),
    ].filter(Boolean).join(". ");
    const res = await fetch("/api/tailor/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "profile", original: profile, sourceText }),
    });
    const body = await res.json();
    if (body.success) {
      setProfile(body.diff.proposed);
      setSuggestState("done");
    } else {
      setSuggestState("error");
    }
  };

  const createAndOpen = async () => {
    const strip = (items: Array<Record<string, unknown>>) => items.map(({ id: _id, ...rest }) => rest);
    const res = await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personal,
        profile,
        competency: [],
        experiences: strip(experiences),
        education: strip(education),
        certificate: [],
        skill,
        reference: [],
        additionalInfo: [],
        templateSettings: { template: selectedTemplate, theme: selectedTheme, fontPair: selectedFontPair },
      }),
    });
    const body = await res.json();
    if (body.success) router.push(`/cvs/${body.cvId}/edit`);
  };

  return (
    <main className="min-h-screen bg-canvas">
      <CaptureStepper step={step} percent={percent} onNavigate={setStep} />
      <section className="mx-auto mt-6 grid max-w-5xl gap-6 px-6 pb-16 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-hairline bg-surface p-6">
          <h1 data-testid="capture-title" className="font-[family-name:var(--font-heading)] text-2xl text-ink">
            {CAPTURE_STEPS.find((s) => s.id === step)?.label}
          </h1>
          <div className="mt-4 space-y-5">
            {step === "personal" && (
              <>
                <PersonalInfoForm personal={personal} updatePersonal={updatePersonal} />
                <div className="flex items-start gap-3 rounded-md border border-hairline p-3">
                  <div className="flex-1">
                    <ProfileForm profile={profile} setProfile={setProfile} />
                  </div>
                  <button
                    onClick={suggestSummary}
                    disabled={suggestState === "loading"}
                    className="flex items-center gap-1 rounded-md border border-accent px-3 py-1.5 text-sm text-accent"
                  >
                    <Sparkles size={14} />
                    {suggestState === "loading" ? "Drafting…" : "Suggest a summary"}
                  </button>
                </div>
                {suggestState === "done" && <p className="text-sm text-status-good">Draft added — edit freely, then Continue.</p>}
                {suggestState === "error" && <p className="text-sm text-status-warn">No safe suggestion right now — write it by hand.</p>}
              </>
            )}
            {step === "work" && (
              <ExperienceForm experiences={experiences} addExperience={addExperience} updateExperience={updateExperience} removeExperience={removeExperience} />
            )}
            {step === "education" && (
              <div className="space-y-2">
                <div className="rounded-md border border-hairline p-3">
                  <SkillsForm skill={skill} addSkill={addSkill} updateSkill={updateSkill} removeSkill={removeSkill} />
                </div>
                <EducationForm education={education} addEducation={addEducation} updateEducation={updateEducation} removeEducation={removeEducation} />
              </div>
            )}
            {step === "style" && (
              <StepStyle
                selectedTemplate={selectedTemplate}
                selectedTheme={selectedTheme}
                selectedFontPair={selectedFontPair}
                onTemplateChange={setSelectedTemplate}
                onThemeChange={setSelectedTheme}
                onFontPairChange={setSelectedFontPair}
              />
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                const idx = CAPTURE_STEPS.findIndex((s) => s.id === step);
                setStep(CAPTURE_STEPS[Math.max(0, idx - 1)].id);
              }}
              disabled={step === "personal"}
              className="rounded-md border border-hairline px-4 py-2 text-sm text-muted disabled:opacity-40"
            >
              Back
            </button>
            {step === "style" ? (
              <button onClick={createAndOpen} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-white">
                Open in Editor <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => {
                  const idx = CAPTURE_STEPS.findIndex((s) => s.id === step);
                  setStep(CAPTURE_STEPS[idx + 1].id);
                }}
                className="rounded-md bg-accent px-4 py-2 text-white"
              >
                Continue
              </button>
            )}
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-8 max-h-[80vh] overflow-auto rounded-lg border border-hairline bg-surface p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Live draft</p>
            <MiniPreview data={{ personal, profile, competency: [], experiences, education, certificate: [], skill, reference: [], additionalInfo: [] }} templateSettings={{ template: selectedTemplate, theme: selectedTheme, fontPair: selectedFontPair }} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function MiniPreview({
  data, templateSettings,
}: {
  data: Record<string, unknown>;
  templateSettings: { template: TemplateId; theme: string; fontPair: string };
}) {
  const { CVPreview } = require("@/app/components/CVPreview") as typeof import("@/app/components/CVPreview");
  return (
    <div className="pointer-events-none overflow-hidden rounded-sm border border-hairline" style={{ transform: "scale(0.58)", transformOrigin: "top left" }}>
      <CVPreview
        personal={data.personal as never}
        profile={data.profile as string}
        competency={data.competency as string[]}
        experiences={data.experiences as never[]}
        education={data.education as never[]}
        certificate={data.certificate as never[]}
        skill={data.skill as string[]}
        reference={data.reference as never[]}
        additionalInfo={data.additionalInfo as string[]}
        templateId={templateSettings.template}
        themeId={templateSettings.theme}
        fontPairId={templateSettings.fontPair}
      />
    </div>
  );
}
```

Add `app/components/capture/StepStyle.tsx`:

```tsx
"use client";

import { TemplateSelector } from "@/app/components/ui/TemplateSelector";
import type { TemplateId } from "@/app/lib/templates/templateDefinitions";

export default function StepStyle(props: {
  selectedTemplate: TemplateId;
  selectedTheme: string;
  selectedFontPair: string;
  onTemplateChange: (t: TemplateId) => void;
  onThemeChange: (t: string) => void;
  onFontPairChange: (t: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted">Choose your template, accent, and font pairing. You can change these later in the editor.</p>
      <TemplateSelector {...props} />
    </div>
  );
}
```

<details><summary>Check `app/components/Forms/index.tsx`</summary>
If the forms are imported via a barrel, confirm `PersonalInfoForm`, `ProfileForm`, `ExperienceForm`, `EducationForm`, `SkillsForm` are exported; otherwise import from their individual files (e.g. `@/app/components/Forms/PersonalInfoForm`).
</details>

Replace `app/cvs/new/page.tsx` body with:

```tsx
import GuidedCapture from "@/app/components/capture/GuidedCapture";

export const metadata = { title: "New CV" };

export default function NewCvPage() {
  return <GuidedCapture />;
}
```

- [ ] **Step 5: Run e2e**

Run: `docker compose exec app npm run test:e2e -- guided-capture.spec.ts template-selector.spec.ts`
Expected: PASS. (PersonalInfoForm uses label-less inputs inside field wrappers; if `getByLabel` misses, use `getByPlaceholder("Enter your full name")` / `getByPlaceholder("Job title")` in the spec — adjust the two `getByLabel` calls accordingly while keeping placeholders identical to `PersonalInfoForm`.)

- [ ] **Step 6: Commit**

```bash
git add app/components/capture app/cvs/new/page.tsx e2e/guided-capture.spec.ts e2e/template-selector.spec.ts
git commit -m "feat: guided capture wizard with live draft preview and editor handoff"
```

---

## Task 9: Editorial Editor rebuild (canvas, inline editing, inspector, template PATCH)

**Files:**
- Modify: `app/components/CVPreview.tsx` (add optional `onSectionClick` + `highlightKey`)
- Create: `app/components/ui/EditorialChrome.tsx`, `app/components/ui/SectionEditor.tsx`, `app/components/ui/InspectorRail.tsx`
- Create: `app/api/cv/[id]/template/route.ts` (PATCH)
- Modify: `app/cvs/[id]/edit/page.tsx` (full editorial rebuild)
- Delete: `app/components/CVBuilderForm.tsx`, `app/components/CVBuilderApp.tsx`
- Modify: `e2e/qa-phase9.spec.ts` (open section before filling; keep labels `Preview` + `PDF`)

**Interfaces:**
- Consumes: all `Forms/*` (T5), `CVPreview` pagination (extended here), `TemplateSelector` (T5), `VersionHistory`, `SaveIndicator`, `useAutoSave`, `exportCV`, `updateCVTemplateSettings` (existing `db.ts`, wired via new PATCH route), T1 readiness, T2 tokens.
- Produces: editorial editor where clicking a rendered section opens `SectionEditor` overlay; `InspectorRail` = readiness checklist + style + (T10 tailor slot); `POST /api/cv/[id]/template` persists `{template, theme, fontPair}`.

- [ ] **Step 1: Extend `CVPreview` with click + highlight**

In `app/components/CVPreview.tsx`, extend the component props interface:

```tsx
interface CVPreviewComponentProps extends CVPreviewProps {
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  showAllPages?: boolean;
  onSectionClick?: (key: string) => void;
  highlightKey?: string | null;
}
```

Inside the single-column render path (the `.cv-section-wrapper` element, ~line 404) and each two-column branch, attach handlers:

```tsx
className={`cv-section-wrapper ${highlightKey === section.key ? "ring-2 ring-accent" : ""}`}
data-measure-key={section.key}
onClick={onSectionClick ? () => onSectionClick(section.key) : undefined}
role={onSectionClick ? "button" : undefined}
aria-label={onSectionClick ? `Edit section ${section.key}` : undefined}
```

- [ ] **Step 2: Create the PATCH template route**

`app/api/cv/[id]/template/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/app/lib/log";
import { updateCVTemplateSettings } from "@/app/lib/db";
import type { TemplateSettings } from "@/app/lib/templates/templateDefinitions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = parseInt(id, 10);
  if (Number.isNaN(cvId)) {
    return NextResponse.json({ success: false, message: "Invalid CV ID" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const settings = {
    template: typeof body.template === "string" ? body.template : "classic",
    theme: typeof body.theme === "string" ? body.theme : "default-blue",
    fontPair: typeof body.fontPair === "string" ? body.fontPair : "default",
  } as TemplateSettings;
  await updateCVTemplateSettings(cvId, settings);
  logger.info("api.cv.item", "template settings updated", { cvId });
  return NextResponse.json({ success: true, cvId });
}
```

- [ ] **Step 3: Create `SectionEditor.tsx`**

```tsx
"use client";

import { X } from "lucide-react";

export function SectionEditor({
  title, children, onDone, onCancel,
}: {
  title: string;
  children: React.ReactNode;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <div data-testid="section-editor" className="rounded-lg border border-accent bg-surface p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-heading)] text-lg text-ink">{title}</h3>
        <button onClick={onCancel} aria-label="Close editor" className="rounded-md p-1 text-muted hover:bg-accent-soft">
          <X size={16} />
        </button>
      </div>
      {children}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border border-hairline px-4 py-2 text-sm text-muted">
          Cancel
        </button>
        <button
          onClick={onDone}
          data-testid="section-save"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `EditorialChrome.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Eye, FileText, History } from "lucide-react";
import { SaveIndicator } from "@/app/components/ui/SaveIndicator";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export function EditorialChrome({
  name, onChangeName, saveStatus, cvId, onHistory, onExportPdf, onExportDocx, onToggleReady, isReadySet,
}: {
  name: string;
  onChangeName: (value: string) => void;
  saveStatus: SaveStatus;
  cvId: number;
  onHistory: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onToggleReady: () => void;
  isReadySet: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Link href="/cvs" className="flex items-center gap-1 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted">
          <ArrowLeft size={14} /> CVs
        </Link>
        <input
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          aria-label="CV name"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 font-[family-name:var(--font-heading)] text-lg text-ink outline-none transition hover:border-hairline focus:border-accent"
        />
        <SaveIndicator status={saveStatus} />
        <button onClick={onToggleReady} className="rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted" title="Mark ready">
          {isReadySet ? "Cleared" : "Mark ready"}
        </button>
        <button onClick={onHistory} className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted">
          <History size={14} /> History
        </button>
        <button onClick={onExportDocx} className="rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted">Word</button>
        <button onClick={onExportPdf} className="rounded-md bg-accent px-3 py-1.5 text-sm text-white">PDF</button>
        <Link href={`/cvs/${cvId}/preview`} className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-sm text-muted">
          <Eye size={14} /> Preview
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `InspectorRail.tsx`**

```tsx
"use client";

import { TemplateSelector } from "@/app/components/ui/TemplateSelector";
import { SECTION_KEYS, SECTION_LABELS, type SectionKey } from "@/app/lib/readiness";
import type { TemplateId } from "@/app/lib/templates/templateDefinitions";

export interface InspectorSection {
  key: SectionKey;
  state: "none" | "partial" | "full";
}

export function InspectorRail({
  sections, templateId, themeId, fontPairId,
  onTemplateChange, onThemeChange, onFontPairChange, onEditSection,
  tailorSlot,
}: {
  sections: InspectorSection[];
  templateId: TemplateId;
  themeId: string;
  fontPairId: string;
  onTemplateChange: (t: TemplateId) => void;
  onThemeChange: (t: string) => void;
  onFontPairChange: (t: string) => void;
  onEditSection: (key: SectionKey) => void;
  tailorSlot?: React.ReactNode;
}) {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-hairline bg-canvas p-4">
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Checklist</h2>
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.key}>
              <button
                onClick={() => onEditSection(s.key)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink hover:bg-accent-soft"
              >
                <span
                  className={
                    s.state === "full" ? "h-2 w-2 rounded-full bg-status-good"
                      : s.state === "partial" ? "h-2 w-2 rounded-full bg-status-warn"
                        : "h-2 w-2 rounded-full bg-faint"
                  }
                />
                {SECTION_LABELS[s.key]}
                {s.state === "none" && <span className="ml-auto text-xs text-faint">Add?</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Style</h2>
        <TemplateSelector
          selectedTemplate={templateId}
          selectedTheme={themeId}
          selectedFontPair={fontPairId}
          onTemplateChange={onTemplateChange}
          onThemeChange={onThemeChange}
          onFontPairChange={onFontPairChange}
        />
      </div>

      {tailorSlot && <div className="mt-4">{tailorSlot}</div>}
    </aside>
  );
}
```

- [ ] **Step 6: Rewrite `app/cvs/[id]/edit/page.tsx`**

Keep the existing 9 state slices and all the per-section update handlers from today, and keep the fetch/load, `handleSave`/`useAutoSave`, `handleExportToPdf`/`handleExportToDocx`, `handleRestore` (version history), and `handleTailorApply` flow exactly as-is. Replace the render section (today's `Header` + `CVBuilderForm` + 2-col grid) with the editorial layout:

```tsx
const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
const [editingValues, setEditingValues] = useState<Record<string, unknown>>({});
const [highlightKey, setHighlightKey] = useState<string | null>(null);

const openSectionEditor = useCallback((key: SectionKey) => {
  const snapshot: Record<string, unknown> = {
    personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo,
  };
  setEditingValues(snapshot);
  setEditingSection(key);
  setHighlightKey(key);
}, [personal, profile, competency, experiences, education, certificate, skill, reference, additionalInfo]);

const commitSectionEditor = () => {
  if (!editingSection) return;
  const v = editingValues;
  if (editingSection === "personal") setPersonal(v.personal as PersonalInfo);
  else if (editingSection === "profile") setProfile(v.profile as string);
  else if (editingSection === "competency") setCompetencies(v.competency as string[]);
  else if (editingSection === "experiences") setExperiences(v.experiences as Experience[]);
  else if (editingSection === "education") setEducation(v.education as Education[]);
  else if (editingSection === "certificate") setCertificate(v.certificate as Certificate[]);
  else if (editingSection === "skill") setSkills(v.skill as string[]);
  else if (editingSection === "reference") setReference(v.reference as Reference[]);
  else if (editingSection === "additionalInfo") setAdditionalInfo(v.additionalInfo as string[]);
  setEditingSection(null);
  setHighlightKey(null);
};

const sectionEditorBody = (key: SectionKey) => {
  const v = editingValues;
  switch (key) {
    case "personal": return <PersonalInfoForm personal={v.personal as PersonalInfo} updatePersonal={(f, val) => setEditingValues((e) => ({ ...e, personal: { ...(e.personal as PersonalInfo), [f]: val } }))} />;
    case "profile": return <ProfileForm profile={v.profile as string} setProfile={(val) => setEditingValues((e) => ({ ...e, profile: val }))} />;
    case "competency": return <CompetenciesForm competency={v.competency as string[]} addCompetency={() => setEditingValues((e) => ({ ...e, competency: [...(e.competency as string[]), ""] }))} updateCompetency={(idx, val) => setEditingValues((e) => ({ ...e, competency: (e.competency as string[]).map((s, i) => (i === idx ? val : s)) }))} removeCompetency={(idx) => setEditingValues((e) => ({ ...e, competency: (e.competency as string[]).filter((_, i) => i !== idx) }))} />;
    case "experiences": return <ExperienceForm experiences={v.experiences as Experience[]} addExperience={() => setEditingValues((e) => ({ ...e, experiences: [...(e.experiences as Experience[]), { id: generateId(), company: "", role: "", period: "", details: "" }] }))} updateExperience={(id, field, val) => setEditingValues((e) => ({ ...e, experiences: (e.experiences as Experience[]).map((x) => (x.id === id ? { ...x, [field]: val } : x)) }))} removeExperience={(id) => setEditingValues((e) => ({ ...e, experiences: (e.experiences as Experience[]).filter((x) => x.id !== id) }))} />;
    case "education": return <EducationForm education={v.education as Education[]} addEducation={() => setEditingValues((e) => ({ ...e, education: [...(e.education as Education[]), { id: generateId(), institution: "", qualification: "", period: "" }] }))} updateEducation={(id, field, val) => setEditingValues((e) => ({ ...e, education: (e.education as Education[]).map((x) => (x.id === id ? { ...x, [field]: val } : x)) }))} removeEducation={(id) => setEditingValues((e) => ({ ...e, education: (e.education as Education[]).filter((x) => x.id !== id) }))} />;
    case "certificate": return <CertificatesForm certificate={v.certificate as Certificate[]} addCertificate={() => setEditingValues((e) => ({ ...e, certificate: [...(e.certificate as Certificate[]), { id: generateId(), name: "", date: "" }] }))} updateCertificate={(id, field, val) => setEditingValues((e) => ({ ...e, certificate: (e.certificate as Certificate[]).map((x) => (x.id === id ? { ...x, [field]: val } : x)) }))} removeCertificate={(id) => setEditingValues((e) => ({ ...e, certificate: (e.certificate as Certificate[]).filter((x) => x.id !== id) }))} />;
    case "skill": return <SkillsForm skill={v.skill as string[]} addSkill={() => setEditingValues((e) => ({ ...e, skill: [...(e.skill as string[]), ""] }))} updateSkill={(idx, val) => setEditingValues((e) => ({ ...e, skill: (e.skill as string[]).map((s, i) => (i === idx ? val : s)) }))} removeSkill={(idx) => setEditingValues((e) => ({ ...e, skill: (e.skill as string[]).filter((_, i) => i !== idx) }))} />;
    case "reference": return <ReferencesForm reference={v.reference as Reference[]} addReference={() => setEditingValues((e) => ({ ...e, reference: [...(e.reference as Reference[]), { id: generateId(), name: "", company: "", role: "", email: "", phone: "" }] }))} updateReference={(id, field, val) => setEditingValues((e) => ({ ...e, reference: (e.reference as Reference[]).map((x) => (x.id === id ? { ...x, [field]: val } : x)) }))} removeReference={(id) => setEditingValues((e) => ({ ...e, reference: (e.reference as Reference[]).filter((x) => x.id !== id) }))} />;
    case "additionalInfo": return <AdditionalInfoForm additionalInfo={v.additionalInfo as string[]} addAdditionalInfo={() => setEditingValues((e) => ({ ...e, additionalInfo: [...(e.additionalInfo as string[]), ""] }))} updateAdditionalInfo={(idx, val) => setEditingValues((e) => ({ ...e, additionalInfo: (e.additionalInfo as string[]).map((s, i) => (i === idx ? val : s)) }))} removeAdditionalInfo={(idx) => setEditingValues((e) => ({ ...e, additionalInfo: (e.additionalInfo as string[]).filter((_, i) => i !== idx) }))} />;
  }
};

const applyTemplateSettings = async (patch: Partial<TemplateSettings>) => {
  const next: TemplateSettings = {
    template: (patch.template ?? templateSettings?.template ?? "classic") as TemplateId,
    theme: patch.theme ?? templateSettings?.theme ?? "default-blue",
    fontPair: patch.fontPair ?? templateSettings?.fontPair ?? "default",
  };
  setTemplateSettings(next);
  await fetch(`/api/cv/${cvId}/template`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next),
  });
};

const toggleReady = async () => {
  await fetch(`/api/cv/${cvId}/ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ready: !readyOverride }),
  });
  setReadyOverride(!readyOverride);
};
```

Add `const [readyOverride, setReadyOverride] = useState(false);` and in `loadCV` set `setReadyOverride(!!cv.ready_override)`. Render:

```tsx
<main className="flex min-h-screen flex-col bg-desk">
  <EditorialChrome
    name={personal.fullName || "Untitled CV"}
    onChangeName={(value) => setPersonal((p) => ({ ...p, fullName: value }))}
    saveStatus={status}
    cvId={cvId}
    onHistory={() => setHistoryOpen(true)}
    onExportPdf={handleExportToPdf}
    onExportDocx={handleExportToDocx}
    onToggleReady={toggleReady}
    isReadySet={readyOverride}
  />
  <div className="flex flex-1 justify-center gap-0 overflow-auto p-8 lg:justify-between">
    <div className="w-full max-w-[794px]">
      <div className="mx-auto rounded-md bg-white p-4 shadow-sm">
        <CVPreview
          personal={personal}
          profile={profile}
          competency={competency}
          experiences={experiences}
          education={education}
          certificate={certificate}
          skill={skill}
          reference={reference}
          additionalInfo={additionalInfo}
          templateId={templateSettings?.template}
          themeId={templateSettings?.theme}
          fontPairId={templateSettings?.fontPair}
          photoUrl={photoUrl}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onTotalPagesChange={setTotalPages}
          onSectionClick={(key) => openSectionEditor(key as SectionKey)}
          highlightKey={highlightKey}
        />
      </div>
      <PageNav currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage((p) => Math.max(0, p - 1))} onNext={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} />
    </div>
    <InspectorRail
      sections={inspectorSections}
      templateId={(templateSettings?.template ?? "classic") as TemplateId}
      themeId={templateSettings?.theme ?? "default-blue"}
      fontPairId={templateSettings?.fontPair ?? "default"}
      onTemplateChange={(t) => applyTemplateSettings({ template: t })}
      onThemeChange={(t) => applyTemplateSettings({ theme: t })}
      onFontPairChange={(t) => applyTemplateSettings({ fontPair: t })}
      onEditSection={openSectionEditor}
      tailorSlot={null}
    />
  </div>
  {historyOpen && <VersionHistory cvId={cvId} onRestore={handleRestore} onClose={() => setHistoryOpen(false)} />}
  {editingSection && (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-6">
      <div className="w-full max-w-2xl">
        <SectionEditor
          title={SECTION_LABELS[editingSection]}
          onDone={commitSectionEditor}
          onCancel={() => setEditingSection(null)}
        >
          {sectionEditorBody(editingSection)}
        </SectionEditor>
      </div>
    </div>
  )}
</main>
```

Where helpers are defined in-page: `const [currentPage, setCurrentPage] = useState(0);` `const [totalPages, setTotalPages] = useState(1);` `const PageNav` (floating prev/next + `Page {currentPage+1} of {totalPages}`), and `const inspectorSections = cvReadiness(cvData).sections;`. `cvData` is already computed today for `useAutoSave`.

Keep the `UploadPhoto` control INSIDE the personal section editor (`sectionEditorBody("personal")` prepends `<UploadPhoto cvId={cvId} onUploadComplete={setPhotoUrl} />` above `PersonalInfoForm`).

- [ ] **Step 7: Delete the retired components**

```bash
git rm app/components/CVBuilderForm.tsx app/components/CVBuilderApp.tsx
```

(Verify nothing else imports them: `grep -rn "CVBuilderForm\|CVBuilderApp" app` should only reference types in `app/types/global.ts`, which may stay.)

- [ ] **Step 8: Update `e2e/qa-phase9.spec.ts` selectors**

The spec fills `Enter your full name` directly on the edit page. Under the editorial editor that field lives inside the personal section editor. Add a helper right after `page.goto('/cvs/${cvId}/edit')`:

```ts
await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
// open the inline editor for personal info
await page.locator('[aria-label^="Edit section personal"]').first().click();
await expect(page.getByPlaceholder("Enter your full name")).toBeVisible();
```

and for the photo-upload flow, after opening the personal editor, `UploadPhoto`'s file input is inside it — scope the existing `input[type="file"]` locator within `[data-testid="section-editor"]`. All other selectors (`PDF` exact button, `Saving...`/`Saved`, `History`) keep working via the chrome bar.

- [ ] **Step 9: Run checks**

Run: `docker compose exec app npm run build`
Run: `docker compose exec app npm run test`
Run: `docker compose exec app npm run test:e2e -- qa-phase9.spec.ts preview-page.spec.ts`
Expected: PASS (print + export fidelity verified by qa-phase9's PDF/DOCX asserts).

- [ ] **Step 10: Commit**

```bash
git add app/components/CVPreview.tsx app/components/ui/EditorialChrome.tsx app/components/ui/SectionEditor.tsx app/components/ui/InspectorRail.tsx app/api/cv/[id]/template/route.ts app/cvs/[id]/edit/page.tsx e2e/qa-phase9.spec.ts
git commit -m "feat: editorial editor with inline section editing, inspector, and template persistence"
```

---

## Task 10: Inspector Tailor-for-job + command menu + editor mark-ready

**Files:**
- Create: `app/components/ui/CommandMenu.tsx`
- Modify: `app/cvs/[id]/edit/page.tsx` (mount TailorPanel in rail, wire command palette, keep toggle from T9)
- Create: `e2e/inline-editing.spec.ts`
- Modify: `e2e/tailor.spec.ts`

**Interfaces:**
- Consumes: `TailorPanel` + `handleTailorApply` (existing), T1 readiness, T2 tokens, T7 rewrite endpoint (for polish / interception).
- Produces: working `/` + Cmd/Ctrl+K palette; AI diffs render in the rail and highlight the canvas; existing tailor e2e green against the new layout.

- [ ] **Step 1: Create `app/components/ui/CommandMenu.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { SECTION_KEYS, SECTION_LABELS } from "@/app/lib/readiness";

export function CommandMenu({
  open, onClose, onJump, onExportPdf, onExportDocx, onBack,
}: {
  open: boolean;
  onClose: () => void;
  onJump: (key: string) => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const q = query.toLowerCase();
  const items = [
    ...SECTION_KEYS.map((k) => ({ type: "section" as const, label: SECTION_LABELS[k], value: k })),
    { type: "action" as const, label: "Export PDF", value: "pdf" },
    { type: "action" as const, label: "Export Word", value: "docx" },
    { type: "action" as const, label: "Back to CVs", value: "back" },
  ].filter((i) => !q || i.label.toLowerCase().includes(q));

  return (
    <div className="fixed inset-x-0 top-16 z-40 mx-auto w-full max-w-lg px-4" role="dialog" aria-label="Command menu">
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to a section, or type an action…"
          className="w-full border-b border-hairline bg-transparent px-4 py-3 outline-none text-ink"
        />
        <ul className="max-h-80 overflow-auto p-1">
          {items.map((i) => (
            <li key={i.type + i.value}>
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-accent-soft"
                onClick={() => {
                  setQuery("");
                  if (i.type === "section") onJump(i.value);
                  else if (i.value === "pdf") onExportPdf();
                  else if (i.value === "docx") onExportDocx();
                  else onBack();
                  onClose();
                }}
              >
                {i.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire command menu + tailor into the editor**

In `app/cvs/[id]/edit/page.tsx`:

- Add `const [commandOpen, setCommandOpen] = useState(false);` and a keydown effect:
```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "/" || (e.metaKey && e.key === "k") || (e.ctrlKey && e.key === "k")) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      setCommandOpen((v) => !v);
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);
```
- Pass `tailorSlot` to `InspectorRail`:
```tsx
tailorSlot={<TailorPanel cv={cvData as Record<string, unknown>} onApply={handleTailorApply} />}
```
and give `handleTailorApply` a follow-up that highlights the canvas section:
```tsx
// after applying, flash the target section
if (update.profile) setHighlightKey("profile");
else if (update.skill) setHighlightKey("skill");
else if (update.competency) setHighlightKey("competency");
else if (update.experiences?.length) setHighlightKey(`experience`);
setTimeout(() => setHighlightKey(null), 1600);
```
- Mount the palette in the main JSX:
```tsx
<CommandMenu
  open={commandOpen}
  onClose={() => setCommandOpen(false)}
  onJump={(key) => openSectionEditor(key as SectionKey)}
  onExportPdf={handleExportToPdf}
  onExportDocx={handleExportToDocx}
  onBack={() => router.push("/cvs")}
/>
```

- [ ] **Step 3: Write the failing inline-editing e2e**

`e2e/inline-editing.spec.ts`:

```ts
import { expect, test, type APIRequestContext } from "@playwright/test";

async function createCV(request: APIRequestContext) {
  const res = await request.post("/api/cv", {
    data: {
      personal: { fullName: "Inline Edits", title: "Analyst", phone: "", email: "i@e.co", location: "", linkedin: "" },
      profile: "Experienced analyst with a focus on delivery.",
      competency: ["Analysis", "SQL"],
      experiences: [{ company: "Co", role: "Analyst", period: "", details: "Analysed things." }],
      education: [], certificate: [], skill: ["SQL"], reference: [], additionalInfo: [],
    },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).cvId as number;
}

test("inline edit commits to the canvas and autosaves", async ({ page, request }) => {
  const cvId = await createCV(request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });

  await page.locator('[aria-label^="Edit section profile"]').first().click();
  await page.getByPlaceholder("Short professional summary").fill("Now with more words added to satisfy the length rule.");
  await page.getByTestId("section-save").click();

  await expect(page.getByText(/Now with more words added/)).toBeVisible();
  await expect(page.getByText("Saving...")).toBeVisible({ timeout: 45000 });
});

test("command menu jumps to a section", async ({ page, request }) => {
  const cvId = await createCV(request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  await page.keyboard.press("/");
  await page.getByRole("dialog", { name: "Command menu" }).getByPlaceholder(/Jump to a section/).fill("Profile");
  await page.getByRole("button", { name: "Professional profile" }).click();
  await expect(page.getByTestId("section-editor")).toBeVisible();
});

test("template change persists after reload", async ({ page, request }) => {
  const cvId = await createCV(request);
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  await page.getByRole("heading", { name: "Style" }).click();
  await page.getByRole("button", { name: "Executive", exact: false }).first().click();
  await page.reload();
  await page.getByRole("heading", { name: "Style" }).click();
  await expect(page.getByRole("button", { name: "Executive", exact: false }).first()).toHaveClass(/ring|border-accent/);
});

test("awaiting rewrite soft state when no safe change", async ({ page, request }) => {
  const cvId = await createCV(request);
  await page.route("**/api/tailor/rewrite", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: false, message: "No safe changes suggested." }),
    }),
  );
  await page.goto(`/cvs/${cvId}/edit`);
  await expect(page.getByRole("button", { name: /Preview/ })).toBeVisible({ timeout: 15000 });
  await page.locator('[aria-label^="Edit section profile"]').first().click();
  await page.getByRole("button", { name: /polish|rewrite|suggest/i }).first().click();
  await expect(page.getByText(/No safe changes/)).toBeVisible();
});
```

(If the editor's per-section polish button wasn't added in T9, this last test's trigger is the inspector TailorPanel "Analyze"—adjust the button matcher to `Analyze` and route `**/api/tailor` instead; keep the assertion identical.)

- [ ] **Step 4: Update `e2e/tailor.spec.ts` for the new layout**

`tailor.spec.ts` runs on `/cvs/6/edit` against live Ollama. Adjust only the layout-driven selectors: the "Analyze" button and diff list now live in the inspector rail — keep the same URL and button names, but after `page.goto`, wait for `Preview` visible, then scope clicks to the rail if the panel moved. Leave the LLM flow logic and assertions untouched.

- [ ] **Step 5: Run e2e**

Run: `docker compose exec app npm run test:e2e -- inline-editing.spec.ts`
Expected: new tests PASS (the rewrite/interception test does not touch Ollama).
Run: `docker compose exec app npm run test:e2e -- tailor.spec.ts`
Expected: PASS if evo Ollama is reachable from the container (same requirement as today).

- [ ] **Step 6: Commit**

```bash
git add app/components/ui/CommandMenu.tsx app/cvs/[id]/edit/page.tsx e2e/inline-editing.spec.ts e2e/tailor.spec.ts
git commit -m "feat: command palette, AI tailor in inspector, editor mark-ready wiring"
```

---

## Task 11: Full verification + changelog + release

**Files:**
- Modify: `CHANGELOG.md`
- Modify: (none expected) code

- [ ] **Step 1: Full gate**

Run: `docker compose exec app npm run test`
Expect: all PASS.
Run: `docker compose exec app npm run lint`
Expect: no new errors (pre-existing 220-error debt stays untouched).
Run: `docker compose exec app npm run build`
Expect: PASSED.
Run: `docker compose exec app npm run test:e2e`
Expect: all specs PASS (roster, cv-list, guided-capture, template-selector, qa-phase9, preview-page, inline-editing, tailor).

- [ ] **Step 2: Manual smoke (documented, not automated)**

Verify in a browser on port 5252: `/` redirects to roster; a fresh guided capture hands off into the editor; the light theme is consistent across roster → capture → editor → preview; print from preview is still white A4; `--font-heading` headings render serif.

- [ ] **Step 3: Update `CHANGELOG.md`**

Add under `[Unreleased] → Added`:

```markdown
- 2026-09-22: Light-theme Guided + Editorial UI rebuild — Roster (`/cvs`) with readiness dots/mark-ready/quick PDF/duplicate, 4-step Guided Capture (`/cvs/new`), Editorial Editor with inline section editing + inspector (checklist, style, Tailor-for-job) + command palette; `ready_override` column + `POST /api/cv/[id]/ready`, `PATCH /api/cv/[id]/template`, `POST /api/tailor/rewrite`; Fraunces/Mulish + `--font-heading` fix
```

- [ ] **Step 4: Commit + release stamp**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for guided + editorial UI rebuild"
~/.agents/scripts/release.sh
```

---

## Verification Summary

| Task | Command | Expected |
|---|---|---|
| T1 | `npm run test -- readiness` | PASS |
| T2 | `npm run build` | BUILD PASSED |
| T3 | `npm run test` | PASS |
| T4 | `npm run test:e2e -- roster.spec.ts cv-list.spec.ts` | PASS |
| T5 | `npm run lint` + `npm run build` | clean |
| T6 | `npm run test:e2e -- preview-page.spec.ts` | PASS |
| T7 | `npm run test -- rewriteSection` | PASS |
| T8 | `npm run test:e2e -- guided-capture.spec.ts template-selector.spec.ts` | PASS |
| T9 | `npm run test:e2e -- qa-phase9.spec.ts preview-page.spec.ts` | PASS |
| T10 | `npm run test:e2e -- inline-editing.spec.ts` | PASS |
| T11 | full suite + `npm run lint` + `npm run build` + full e2e | all green |

## Out of scope (from spec)

- Client-facing access/sharing; export queue / tailor-log rail destinations (omitted rather than built as dead screens).
- New templates, cover letters, auto reordering, applicant scoring.
- contentEditable/ProseMirror WYSIWYG (inline overlay editing is deliberate).
- `UploadPhoto` beyond the personal editor; resize/universal attachments.