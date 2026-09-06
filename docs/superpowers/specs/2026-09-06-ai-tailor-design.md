# Phase 2: AI Tailor — Job-Ad-Driven CV Tailoring with Ollama

## Goal

Let a user paste a **public job-advert URL** into the CV editor and receive **tailored wording for their existing CV** that raises its match against the advert — never fabricating facts, always derivable only from what the user has already entered.

The result is shown as a **git-like inline diff** (per field/section) which the user confirms/rejects before anything is written. Confirmed changes are snapshotted to `cv_versions` and persisted through the existing save path.

## Context (current state)

- **Ollama host**: `evo` (tailnet 100.85.216.53:11434). **Verified reachable from the Docker app container** via Node fetch: HTTP 200 on `/api/tags`.
- **Models on evo**: `mistral:7b`, `llama3.1:8b` (chat/prose), `qwen2.5-coder:14b`, `deepseek-coder-v2:16b` (structured), `deepseek-r1:8b` (reasoning), `nomic-embed-text` (embeddings).
- **Latency**: ~2.8s for a trivial warm call; realistic tailoring contexts (few K tokens) run 10-60s per call on 7-16B models. A full 3-stage pipeline takes **~1-3 minutes** → the UX must be async with progress steps.
- **Prior AI code was deleted** (Sep 2026, commits `7188276`, `6992856`, `441c058`) but the pattern is recoverable from git: a lightweight `app/lib/llm/` module — `streamChat(system, prompt)` with a `clients/ollama.ts` (fetch → `/api/chat`, JSONL streaming) and `clients/lmstudio.ts`. **No langchain** was used and none is needed.
- **Env**: `.env` retains an inert LLM block (`LLM_PROVIDER`, `LLM_BASE_URL=http://localhost:1234`, `LLM_MODEL`, `LLM_API_KEY`). `docker-compose.yml` forwards them. The default host (1234) is stale — needs to point at evo's Ollama.
- **DB**: `cvs` + child tables (`experiences`, `education`, `competencies`, `skills`, `certificates`, `reference_list`, `additional_info`, `cv_photos`). `cv_versions` (jsonb snapshot per cv) exists but is **unused** — available for snapshots.
- **Save path**: `PUT /api/cv/:id` → `updateCV` persists nested sections. No auth layer on this local app.
- **Playwright** is currently a dev dependency (e2e tests). It is **not** a runtime dependency of the app — it must be promoted to run server-side for scraping.

## Design Decisions (user-approved)

1. **Ollama connection**: reuse the existing remote Ollama on `evo` via `LLM_BASE_URL` env (no new container).
2. **Job input**: user **pastes a link** in the CV editor.
3. **Scrape engine**: **Playwright browser** (runtime dep; bundled into the app Docker image) opens the URL and extracts readable main text. Fallback: user pastes the job text manually if scraping fails.
4. **Model strategy**: small **multi-step pipeline** — a dedicated model per subtask, configured via env (no langchain).
   - Extraction: `qwen2.5-coder:14b` (structured JSON)
   - Tailoring: `mistral:7b` (prose rewrite)
5. **Diff granularity**: **per field/section** (profile, each experience bullet, skills, competencies).
6. **Diff presentation**: **inline git-style** (struck-through removed text + highlighted added text) within each section.
7. **Change staging**: **pending state** until confirmed; each confirmed apply snapshots to `cv_versions` then saves.
8. **Pipeline UX**: **async with live progress steps** via SSE (Scraping → Extracting → Tailoring → Diff).
9. **Hard rule**: **no fabricated information** — the LLM may only paraphrase/emphasize existing CV content, never add new facts.
10. **Scope (core only)**: job scrape + requirement extraction + tailor + diff-review-apply. No cover letter, no auto-reordering of sections, no keyword-injection beyond existing content.
11. **Placement**: standalone — independent of Phase 1. When Phase 1's slide preview exists, the apply-check may reuse it (optional).

## Architecture

### 1. `app/lib/llm/` — Ollama client (recreated from prior pattern)

- `clients/ollama.ts`: `chatOllama({ system?, messages, model, stream? })` → POST `{LLM_BASE_URL}/api/chat`. Returns full JSON when `stream:false`, or an async-iterable of token chunks when streaming.
- `index.ts`: `chat(system, prompt, { model })` with a `LLM_PROVIDER` switch (ollama default). Model selection resolved from env: `LLM_MODEL_EXTRACT`, `LLM_MODEL_TAILOR`, `LLM_MODEL_CHAT` (fall back to a single `LLM_MODEL`).
- Robust JSON output: ask for strict JSON, then **parse + repair** (strip code fences, extract first balanced object); fail with a surfaced error on unparseable output.

### 2. `app/lib/tailor/scrape.ts` — job-ad extraction

- Playwright (chromium) opens URL; `domcontentloaded` + short wait; extract `document.body.innerText` via the main/longest text block heuristic; cap at ~8k tokens (chunk-wise).
- Timeout (~30s) and explicit `browser.close()`.
- Fallback path: if scraping throws (paywall/403/dns), the client offers a "paste text instead" flow that goes straight to extraction.

### 3. `app/lib/tailor/extract.ts` — requirement extraction

- Prompt `qwen2.5-coder:14b` with the scraped text → JSON `{ must_have: string[], nice_to_have: string[], responsibilities: string[] }`.
- Validated against a rough schema; missing keys → empty arrays (never fail the pipeline).

### 4. `app/lib/tailor/tailor.ts` — per-section rewrite

- For each eligible section (profile, each experience `details`, skills/competencies list), one `mistral:7b` call with:
  - the section's current text,
  - the extracted requirements,
  - a **system rule**: "Rewrite the given content to better match the requirements. You may paraphrase, reorder, and emphasize. You MUST NOT introduce any fact, skill, company, number, or claim that is not already present in the provided content."
- Temperature low (~0.3) for stability.
- **No-fabrication validation** after each rewrite: confirm the proposal only rephrases source facts (heuristic: reject if output introduces a token absent from source for skills/numbers; reuse a small LLM call or a strict regex-based check — TBD in implementation).

### 5. `app/lib/tailor/diff.ts` — diff + snapshot

- Compare current vs proposed per field → `{ section, field, original, proposed, status: 'changed'|'original' }`.
- `snapshotCV(cvId, data)` → insert into `cv_versions` (`data` = full current CV json) — called **once per apply**.

### 6. `app/api/tailor/route.ts` — SSE orchestrator

- `POST { jobUrl? | jobText? }` → streams SSE events: `status` (step name), `diff` (final proposals), `error`.
- Runs pipeline sequentially; writes progress to the response as it goes; closes with final diff payload.
- Timeout handling across the 1-3 min pipeline (SSE keeps the connection alive).

### 7. UI — `app/components/tailor/`

- `TailorPanel.tsx`: "Tailor for job" card in the editor; URL input + "Analyze" button; paste-text fallback; SSE progress stepper; on completion renders diff list with Apply/Reject per item and Apply All.
- `DiffSection.tsx`: inline git-style render — struck/lined-through original, highlighted addition; "unchanged" sections shown collapsed.
- Apply → updates the editor form state (same shape the edit page already manages) → existing `PUT /api/cv/:id` persists; `snapshotCV` fires before mutation on each apply or once per batch (decide: per-apply; recommendation = once per apply-session batch).

### 8. Deployment changes

- `package.json`: move `playwright` (or `playwright-core` + system chromium) to **runtime** dependencies.
- `Dockerfile`: install chromium + system deps (`npx playwright install --with-deps chromium`), bump the build accordingly.
- `docker-compose.yml` / `.env`: set `LLM_BASE_URL=http://100.85.216.53:11434`, `LLM_MODEL_EXTRACT=qwen2.5-coder:14b`, `LLM_MODEL_TAILOR=mistral:7b`. Verification done: app container reaches evo over the tailnet.

## Error handling / edge cases

- **Scrape failure** → prompt to paste text; pipeline continues from extraction.
- **Ollama down / timeout** → SSE `error` event with a readable message; UI returns to idle.
- **Unparseable model JSON** → one repair attempt; then surfaced error.
- **No-fabrication guard** → a proposed diff that introduces unsourced facts is **rejected server-side** and reported as "no safe change" rather than applied.
- **Empty CV sections** → skip (nothing to tailor); report as skipped in the diff list.
- **Huge job text** → chunk/cap; note truncation in the extraction step.
- **User edits CV mid-pipeline** → apply compares live form state; if the field changed since proposal, proposal is marked stale and not auto-applied.

## Testing

- **Unit (Vitest)**:
  - `llm`: JSON repair/parse handling, stream wrapper.
  - `extract`: schema validation, missing keys → empty arrays.
  - `tailor`: no-fabrication guard rejects invented facts, marks skip for empty sections.
  - `diff`: changed/original status, stale-change detection.
  - `scrape` fixtures: static HTML → expected text.
  - DB: `snapshotCV` writes a `cv_versions` row.
- **E2E (Playwright)**:
  - Serve a local fixture job-ad page; run the tail CT via the real pipeline against evo; assert diff renders, Apply persists, snapshot row appears.
  - Scrape-failure path → paste-text fallback shows.
- **Manual**: real run against `evo` Ollama; sanity-check no fabrication on a known CV.

## Files touched

- `app/lib/llm/index.ts`, `app/lib/llm/clients/ollama.ts` (new; recreated from removed pattern)
- `app/lib/tailor/scrape.ts`, `app/lib/tailor/extract.ts`, `app/lib/tailor/tailor.ts`, `app/lib/tailor/diff.ts` (new)
- `app/api/tailor/route.ts` (new; SSE)
- `app/components/tailor/TailorPanel.tsx`, `app/components/tailor/DiffSection.tsx` (new)
- `app/lib/db.ts` (add `snapshotCV`)
- `app/cvs/[id]/edit/page.tsx` (mount TailorPanel; apply wiring)
- `app/cvs/[id]/preview/page.tsx` (optional apply-check reuse of slide preview)
- `.env` / `docker-compose.yml` (LLM_BASE_URL → evo; per-step model vars)
- `Dockerfile` (install chromium + deps)
- `package.json` (playwright → runtime dep)
- Tests: `app/lib/tailor/__tests__/*`, `e2e/tailor.spec.ts`

## Out of scope (future phases)

- Cover letter generation.
- Auto-reordering of sections or auto-adding sections.
- Retrieval/embeddings for resume scoring beyond the extraction step (`nomic-embed-text` available but unused).
- Persisting job-ad contexts beyond the current session.
- Auth/rate-limiting (the app has no auth layer today).