# Dev-Mode End-to-End Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add uniform, env-gated logging (`LOG_LEVEL`) to every crucial function in the end-to-end flows — AI tailor pipeline (highest priority), LLM calls, plus CV CRUD/snapshot/upload/db write paths — so failures are diagnosable from `docker compose logs -f app` without curl smoke tests.

**Architecture:** A single dependency-free `app/lib/log.ts` wrapper around `console.{debug,info,warn,error}` that honors `LOG_LEVEL` (default `info`; forced silent under `NODE_ENV=test` so unit tests don't emit). Server-side call sites in `api/*` routes and `lib/*` modules emit structured lines `[ts] [LEVEL] [scope:fn] message {"key":value}`. No behavior changes — logging only, zero new npm deps.

**Tech Stack:** TypeScript, Next.js 16 API routes, Vitest + jsdom, Biome (existing), Docker Compose. No logging library — plain `console`.

**Spec:** [AI Tailor design](docs/superpowers/plans/2026-09-06-ai-tailor-design.md) (the parent feature this instrumented; this plan extends it) + conversation with the user requesting dev-mode logging for every crucial end-to-end flow step.

## Global Constraints

- **Zero new npm dependencies.** Logging uses `console.*` only.
- **`LOG_LEVEL`** values: `debug` < `info` < `warn` < `error`. Default `info` in dev, forced to `error`-only when `NODE_ENV === "test"` (unit tests emit no logs). Unset/unknown `LOG_LEVEL` → `info`.
- **No behavior changes.** Logging must not alter return values, control flow, or timing of any instrumented function. Every existing test must still pass unchanged.
- **Follow existing test conventions**: Vitest, `describe/it/expect`, `vi.mock` + `vi.hoisted`, `vi.stubGlobal`/`vi.stubEnv`/`vi.unstubAllGlobals`/`vi.unstubAllEnvs`, jsdom environment. Tests live next to source at `app/**/__tests__/*.test.ts`.
- **Biome clean** on every committed file (run `biome check --write` scoped to changed files before commit; keep the scoped `biome check` on branch dirs at zero diagnostics).
- **All work lands on branch `feat/ai-tailor`** in the worktree at `.worktrees/feat/ai-tailor` (same place the AI Tailor feature lives). Commits go in the worktree; the main workspace's container reads files bound from the main WS — sync via `git -C . checkout feat/ai-tailor -- <paths>` after each task's worktree commit (directory binds live-update; file binds for `vitest.config.ts`/`vitest.setup.ts`/`playwright.config.ts` require `docker compose up -d --force-recreate --no-build app`).
- **Test run commands** inside the app container: unit `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run <path>'`; full suite `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run'`; lint `docker compose exec -T app sh -c 'npx biome check <scoped dirs>'`.
- **Doc conventions**: CHANGELOG `[Unreleased]` → `Changed`; AGENTS.md LLM section already documented lines ~122-139 (container lacks curl; use wget or host curl for smoke tests).
- The app container runs Next.js production server (`npm start`, port 5252); server-side `console.*` appears in `docker compose logs -f app`.

---

### Task 1: Logging module with level gating

**Files:**
- Create: `app/lib/log.ts`
- Test: `app/lib/__tests__/log.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later task):
  - `type LogLevel = "debug" | "info" | "warn" | "error"`
  - `export function shouldLog(level: LogLevel): boolean` — level gate vs effective `LOG_LEVEL`.
  - `export function formatLog(level: LogLevel, scope: string, message: string, data?: unknown): string` — returns the single log line string.
  - `export const logger: { debug(scope, message, data?), info(scope, message, data?), warn(scope, message, data?), error(scope, message, data?, err?) }` — no-op when `!shouldLog`.
  - Effective level selection: `process.env.LOG_LEVEL`, else `info`; forced `error` when `NODE_ENV === "test"`.

- [x] **Step 1: Write the failing tests**

```ts
// app/lib/__tests__/log.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatLog, logger, shouldLog } from "../log";

const ORIGINAL_LOG_LEVEL = process.env.LOG_LEVEL;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LOG_LEVEL = "info";
  process.env.NODE_ENV = "development";
});

afterEach(() => {
  if (ORIGINAL_LOG_LEVEL === undefined) delete process.env.LOG_LEVEL;
  else process.env.LOG_LEVEL = ORIGINAL_LOG_LEVEL;
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  vi.unstubAllGlobals();
});

describe("shouldLog", () => {
  it("allows levels at or above the threshold", () => {
    process.env.LOG_LEVEL = "info";
    expect(shouldLog("debug")).toBe(false);
    expect(shouldLog("info")).toBe(true);
    expect(shouldLog("warn")).toBe(true);
    expect(shouldLog("error")).toBe(true);
  });

  it("defaults to info when LOG_LEVEL is unset", () => {
    delete process.env.LOG_LEVEL;
    expect(shouldLog("info")).toBe(true);
    expect(shouldLog("debug")).toBe(false);
  });

  it("forces error-only logging in test env", () => {
    process.env.LOG_LEVEL = "debug";
    process.env.NODE_ENV = "test";
    expect(shouldLog("debug")).toBe(false);
    expect(shouldLog("info")).toBe(false);
    expect(shouldLog("error")).toBe(true);
  });
});

describe("formatLog", () => {
  it("builds a timestamped structured line", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
    const line = formatLog("info", "tailor.pipeline", "stage done", { step: "tailoring", ms: 12 });
    vi.useRealTimers();
    expect(line).toMatch(/^\[\d\d:\d\d:\d\d\.\d\d\d\] \[info\] \[tailor\.pipeline\] stage done \{"step":"tailoring","ms":12\}$/);
  });

  it("omits the data block when data is undefined", () => {
    const line = formatLog("error", "db.save", "boom");
    expect(line.endsWith(' [error] [db.save] boom')).toBe(true);
    expect(line).not.toContain("{}");
  });

  it("does not throw on circular data", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => formatLog("info", "a.b", "x", circular)).not.toThrow();
    expect(formatLog("info", "a.b", "x", circular)).toContain('"self":"[Circular]"');
  });
});

describe("logger", () => {
  it("writes info to console.info when enabled", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    process.env.LOG_LEVEL = "info";
    process.env.NODE_ENV = "development";
    logger.info("flow.fn", "hello", { n: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("[flow.fn] hello");
  });

  it("writes error with stack when err is supplied", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("bad");
    logger.error("flow.fn", "failed", undefined, err);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("bad");
  });

  it("does not emit when the level is below the threshold", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    process.env.LOG_LEVEL = "warn";
    logger.debug("flow.fn", "hidden");
    expect(spy).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run the log module tests to verify they fail**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/__tests__/log.test.ts'`
Expected: FAIL — `../log` fails to resolve (module not created yet).

- [x] **Step 3: Implement `app/lib/log.ts`**

```ts
// app/lib/log.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

const RANKS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function effectiveLevel(): LogLevel {
  // Never log anything below error during unit tests so suites stay quiet.
  if (process.env.NODE_ENV === "test") return "error";
  const raw = process.env.LOG_LEVEL;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw;
  return "info";
}

export function shouldLog(level: LogLevel): boolean {
  return RANKS[level] >= RANKS[effectiveLevel()];
}

function safeJson(data: unknown): string | undefined {
  if (data === undefined) return undefined;
  const seen = new Set<object>();
  return JSON.stringify(data, (_key, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  });
}

export function formatLog(level: LogLevel, scope: string, message: string, data?: unknown): string {
  const stamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const payload = safeJson(data);
  return `[${stamp}] [${level}] [${scope}] ${message}${payload !== undefined ? ` ${payload}` : ""}`;
}

function write(level: LogLevel, scope: string, message: string, data?: unknown, err?: Error): void {
  if (!shouldLog(level)) return;
  const line = formatLog(level, scope, message, data);
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : level === "debug" ? console.debug : console.info;
  if (err && level === "error") fn(`${line} ${err.message}`, err);
  else fn(line);
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) => write("debug", scope, message, data),
  info: (scope: string, message: string, data?: unknown) => write("info", scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => write("warn", scope, message, data),
  error: (scope: string, message: string, data?: unknown, err?: Error) => write("error", scope, message, data, err),
};
```

- [x] **Step 4: Run the log module tests to verify they pass**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/__tests__/log.test.ts'`
Expected: PASS — all 8 tests.

- [x] **Step 5: Biome + commit (worktree)**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
npx biome check --write app/lib/log.ts app/lib/__tests__/log.test.ts
git add app/lib/log.ts app/lib/__tests__/log.test.ts
git commit -m "feat: add env-gated structured logger (LOG_LEVEL) (task 1)"
```

> Note: biome `--write` on the host worktree is the ONLY host-npm exception in this plan — all other commands run via docker compose exec. If the environment forbids host npx entirely, run `npx biome check --write …` inside the container against the synced main tree, then copy the corrected files back into the worktree (see Global Constraints).

- [x] **Step 6: Sync to main WS + commit verify**

```bash
cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- app/lib/log.ts app/lib/__tests__/log.test.ts
git -C . restore --staged app/lib/log.ts app/lib/__tests__/log.test.ts
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/__tests__/log.test.ts'
```
Expected: PASS (log module + its test synced into container via bind mount).

---

### Task 2: Instrument LLM `chat` (ollama.ts)

**Files:**
- Modify: `app/lib/llm/ollama.ts`
- Test: `app/lib/llm/__tests__/ollama.test.ts` (add cases)

**Interfaces:**
- Consumes: `logger` from `./log` (Task 1).
- Produces: nothing new; keeps `chat(params: { model; system?; prompt }): Promise<string>`. Log scope: `llm.chat`.

- [x] **Step 1: Add the failing log assertions to `ollama.test.ts`**

Append inside the existing `describe("chat")` block (keep existing tests intact):

```ts
  it("logs request/response details with duration", async () => {
    vi.stubEnv("LLM_BASE_URL", "http://llm:11434");
    vi.stubEnv("NODE_ENV", "development");
    const { chat } = await import("../ollama");
    const infos: unknown[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => infos.push(a[0]));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: "answer" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await chat({ model: "m1", prompt: "hi" });

    const joined = infos.map(String).join("\n");
    expect(joined).toContain("[llm.chat]");
    expect(joined).toContain("model");
    expect(joined).toContain("ms");
  });

  it("logs the error path with cause", async () => {
    vi.stubEnv("LLM_BASE_URL", "http://llm:11434");
    vi.stubEnv("NODE_ENV", "development");
    const { chat } = await import("../ollama");
    const errors: unknown[] = [];
    vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => errors.push(a[0]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Unavailable" }));

    await expect(chat({ model: "m1", prompt: "hi" })).rejects.toThrow("Ollama request failed");
    expect(errors.map(String).join("\n")).toContain("[llm.chat]");
  });
```

> Note: `chat` lives in `ollama.ts` which is imported via `../ollama` in the test; the `chat` unit must read `NODE_ENV`/`LOG_LEVEL` at call time (not module load) so `stubEnv` works — implement `chat` to call `logger` which reads env per-call (Task 1 `effectiveLevel()` already reads env per call).

- [x] **Step 2: Run the ollama tests to verify the new cases fail**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/llm/__tests__/ollama.test.ts'`
Expected: FAIL — new cases fail because `chat` emits no logs.

- [x] **Step 3: Instrument `chat` in `ollama.ts`**

Wrap the existing `chat` body (keep the exact fetch/parse/throw logic unchanged):

```ts
import { logger } from "../log";

export async function chat(params: {
  model: string;
  system?: string;
  prompt: string;
}): Promise<string> {
  const { baseUrl } = llmConfig();
  const messages = [
    ...(params.system ? [{ role: "system", content: params.system }] : []),
    { role: "user", content: params.prompt },
  ];

  const t0 = Date.now();
  logger.info("llm.chat", "request", {
    model: params.model,
    baseUrl,
    promptChars: params.prompt.length,
    systemChars: params.system?.length ?? 0,
  });

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: params.model, messages, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("Ollama returned no content");
    }

    logger.info("llm.chat", "response", {
      model: params.model,
      ms: Date.now() - t0,
      responseChars: content.length,
    });
    return content;
  } catch (err) {
    logger.error("llm.chat", "error", { model: params.model, ms: Date.now() - t0 }, err as Error);
    throw err;
  }
}
```

- [x] **Step 4: Run the ollama tests to verify pass**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/llm/__tests__/ollama.test.ts'`
Expected: PASS — all 5 existing + 2 new tests.

- [ ] **Step 5: Biome + commit + sync (worktree → main WS)**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
npx biome check --write app/lib/llm/ollama.ts app/lib/llm/__tests__/ollama.test.ts
git add app/lib/llm/ollama.ts app/lib/llm/__tests__/ollama.test.ts
git commit -m "feat: log llama chat requests/responses with durations (task 2)"

cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- app/lib/llm/ollama.ts app/lib/llm/__tests__/ollama.test.ts
git -C . restore --staged app/lib/llm/ollama.ts app/lib/llm/__tests__/ollama.test.ts
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/llm/__tests__/ollama.test.ts'
```
Expected: commit succeeds; container tests PASS.

---

### Task 3: Instrument the tailor pipeline stages (pipeline.ts)

**Files:**
- Modify: `app/lib/tailor/pipeline.ts`
- Test: `app/lib/tailor/__tests__/pipeline.test.ts` (extend)

**Interfaces:**
- Consumes: `logger` (Task 1).
- Produces: unchanged `runTailorPipeline` signature; log scope `tailor.pipeline`.

- [x] **Step 1: Add failing log assertions to `pipeline.test.ts`**

Update the first test (the `runTailorPipeline` one) to capture logs — the module already mocks `../scrape`, `../extract`, `../tailor` via `vi.hoisted`. Add a spy inside the existing first `it`:

```ts
  it("runs scrape->extract->tailor and emits progress + final diff", async () => {
    const events: string[] = [];
    const logLines: string[] = [];
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logLines.push(String(a[0])));
    mocks.scrapeJobAd.mockResolvedValue("job ad body");
    mocks.extractRequirements.mockResolvedValue({
      must_have: ["React"],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockResolvedValue([]);

    const diffs = await runTailorPipeline({
      request: { jobUrl: "https://example.com/job" },
      cv: { profile: "x" },
      onEvent: (e) =>
        events.push(`${e.type}:${e.type === "status" ? e.step : ""}`),
    });

    expect(mocks.scrapeJobAd).toHaveBeenCalledWith("https://example.com/job");
    expect(diffs).toEqual([]);
    expect(events).toEqual([
      "status:scraping",
      "status:extracting",
      "status:tailoring",
      "diff:",
    ]);
    const joined = logLines.join("\n");
    expect(joined).toContain("tailor.pipeline");
    expect(joined).toContain("scraping");
    expect(joined).toContain("extracting");
  });
```

Add to the same `describe` a second case asserting final `done`/`error` logging:

```ts
  it("logs the final diff count and errors", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logLines: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logLines.push(String(a[0])));
    const errorLines: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => errorLines.push(String(a[0])));
    mocks.scrapeJobAd.mockResolvedValue("");
    mocks.extractRequirements.mockRejectedValue(new Error("extract boom"));
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({ request: { jobUrl: "https://x" }, cv: {}, onEvent: () => {} });

    expect(logLines.join("\n")).toContain("diffCount");
    // extract failure falls back to empty requirements; tailored diffs proceed
    expect(mocks.buildTailorDiffs).toHaveBeenCalled();
  });
```

> Note: `buildTailorDiffs` succeeds in the second test (mocks return `[]`), so no `error` log is expected; the "final results" info log is what the second test asserts. If you want an explicit error-stack assertion, add a third case where `buildTailorDiffs` rejects.

- [x] **Step 2: Run pipeline tests to verify fail**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/pipeline.test.ts'`
Expected: FAIL — new log-content assertions not satisfied.

- [x] **Step 3: Instrument `runTailorPipeline` in `pipeline.ts`**

Keep the existing event/control-flow identical; add logs:

```ts
import { logger } from "../log";

export async function runTailorPipeline(args: {
  request: TailorRequest;
  cv: Record<string, unknown>;
  onEvent: (e: TailorEvent) => void;
}): Promise<TailorDiff[]> {
  const { request, cv, onEvent } = args;
  const t0 = Date.now();
  logger.info("tailor.pipeline", "start", {
    hasUrl: Boolean(request.jobUrl),
    hasText: Boolean(request.jobText?.trim()),
  });

  try {
    let jobText = request.jobText ?? "";
    if (request.jobUrl) {
      onEvent({ type: "status", step: "scraping" });
      const t1 = Date.now();
      jobText = await scrapeJobAd(request.jobUrl);
      logger.info("tailor.pipeline", "scraped", { url: request.jobUrl, chars: jobText.length, ms: Date.now() - t1 });
    }

    onEvent({ type: "status", step: "extracting" });
    let requirements: JobRequirements;
    try {
      const t2 = Date.now();
      requirements = await extractRequirements(jobText);
      logger.info("tailor.pipeline", "extracted", {
        must: requirements.must_have.length,
        nice: requirements.nice_to_have.length,
        resp: requirements.responsibilities.length,
        ms: Date.now() - t2,
      });
    } catch {
      requirements = { must_have: [], nice_to_have: [], responsibilities: [] };
    }

    onEvent({ type: "status", step: "tailoring" });
    const t3 = Date.now();
    const diffs = await buildTailorDiffs({ cv, requirements });
    logger.info("tailor.pipeline", "tailored", {
      diffCount: diffs.length,
      ms: Date.now() - t3,
    });

    onEvent({ type: "diff", diffs });
    logger.info("tailor.pipeline", "done", {
      diffCount: diffs.length,
      totalMs: Date.now() - t0,
    });
    return diffs;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onEvent({ type: "error", message });
    logger.error("tailor.pipeline", "aborted", { totalMs: Date.now() - t0 }, err as Error);
    return [];
  }
}
```

- [x] **Step 4: Run pipeline tests to verify pass**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/pipeline.test.ts'`
Expected: PASS — all existing + new cases.

- [x] **Step 5: Biome + commit + sync**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
npx biome check --write app/lib/tailor/pipeline.ts app/lib/tailor/__tests__/pipeline.test.ts
git add app/lib/tailor/pipeline.ts app/lib/tailor/__tests__/pipeline.test.ts
git commit -m "feat: log tailor pipeline stage entries, durations, and results (task 3)"

cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- app/lib/tailor/pipeline.ts app/lib/tailor/__tests__/pipeline.test.ts
git -C . restore --staged app/lib/tailor/pipeline.ts app/lib/tailor/__tests__/pipeline.test.ts
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/pipeline.test.ts'
```
Expected: PASS.

---

### Task 4: Instrument URL scrape and requirement extraction

**Files:**
- Modify: `app/lib/tailor/scrape.ts`, `app/lib/tailor/extract.ts`
- Test: `app/lib/tailor/__tests__/scrape.test.ts`, `extract.test.ts`

**Interfaces:**
- Consumes: `logger` (Task 1).
- Produces: unchanged `scrapeJobAd(url): Promise<string>` and `extractRequirements(jobText): Promise<JobRequirements>`; scopes `tailor.scrape` / `tailor.extract`.

- [x] **Step 1: Add failing log assertions**

Extend `scrape.test.ts` (read it first; it mocks `playwright` via `vi.mock`). Add a case:

```ts
  it("logs scrape success with char count", async () => {
    // arrange playwright mock to return a page; then:
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logs.push(String(a[0])));
    const text = await scrapeJobAd("https://example.com/job");
    expect(text).toContain("React");
    expect(logs.join("\n")).toContain("[tailor.scrape]");
  });

  it("logs and rethrows scrape failure with the url", async () => {
    process.env.NODE_ENV = "development";
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => errors.push(String(a[0])));
    // make chromium.goto throw
    await expect(scrapeJobAd("https://example.com/bad")).rejects.toThrow(/Failed to read job ad/);
    expect(errors.join("\n")).toContain("https://example.com/bad");
  });
```

Extend `extract.test.ts` (it mocks `chat`). Add:

```ts
  it("logs extraction counts and model", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logs.push(String(a[0])));
    const reqs = await extractRequirements("job ad text");
    expect(reqs.must_have).toEqual(["React"]);
    expect(logs.join("\n")).toContain("[tailor.extract]");
  });
```

- [x] **Step 2: Run scrape/extract tests to verify fail**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts'`
Expected: FAIL on the new cases.

- [x] **Step 3: Instrument `scrapeJobAd`**

Keep control flow identical; add logs around launch, goto, and the error throw:

```ts
import { logger } from "../log";

export async function scrapeJobAd(url: string): Promise<string> {
  let browser: import("playwright").Browser | undefined;
  const t0 = Date.now();
  try {
    const { chromium } = await import("playwright");
    logger.info("tailor.scrape", "launch", { url });
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1500);
    const text: string = await page.evaluate(
      () => document.body?.innerText ?? "",
    );
    const cleaned = extractMainText(text);
    logger.info("tailor.scrape", "done", { url, chars: cleaned.length, ms: Date.now() - t0 });
    return cleaned;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("tailor.scrape", "failed", { url, ms: Date.now() - t0 }, err as Error);
    throw new Error(`Failed to read job ad at ${url}: ${msg}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
```

- [x] **Step 4: Instrument `extractRequirements`**

```ts
import { logger } from "../log";

export async function extractRequirements(jobText: string): Promise<JobRequirements> {
  const { extractModel } = llmConfig();
  const prompt = `Job advert text:\n\n${jobText}`;
  const t0 = Date.now();
  logger.info("tailor.extract", "request", { model: extractModel, chars: jobText.length });
  const raw = await chat({ model: extractModel, system: SYSTEM, prompt });

  let parsed: Partial<JobRequirements>;
  let parseOk = true;
  try {
    parsed = parseJsonObject<Partial<JobRequirements>>(raw);
  } catch {
    parsed = {};
    parseOk = false;
  }

  const result = {
    must_have: Array.isArray(parsed.must_have) ? parsed.must_have : [],
    nice_to_have: Array.isArray(parsed.nice_to_have) ? parsed.nice_to_have : [],
    responsibilities: Array.isArray(parsed.responsibilities)
      ? parsed.responsibilities
      : [],
  };
  logger.info("tailor.extract", "done", {
    model: extractModel,
    ms: Date.now() - t0,
    parseOk,
    must: result.must_have.length,
    nice: result.nice_to_have.length,
    resp: result.responsibilities.length,
  });
  return result;
}
```

- [x] **Step 5: Run scrape/extract tests to verify pass**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts'`
Expected: PASS.

- [x] **Step 6: Biome + commit + sync**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
npx biome check --write app/lib/tailor/scrape.ts app/lib/tailor/extract.ts app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts
git add app/lib/tailor/scrape.ts app/lib/tailor/extract.ts app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts
git commit -m "feat: log scrape and extract stages (task 4)"

cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- app/lib/tailor/scrape.ts app/lib/tailor/extract.ts app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts
git -C . restore --staged app/lib/tailor/scrape.ts app/lib/tailor/extract.ts app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/scrape.test.ts app/lib/tailor/__tests__/extract.test.ts'
```
Expected: PASS.

---

### Task 5: Instrument section tailoring + guard + API route SSE

**Files:**
- Modify: `app/lib/tailor/tailor.ts`, `app/api/tailor/route.ts`
- Test: `app/lib/tailor/__tests__/rewrite.test.ts`, plus a new `app/api/tailor/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `logger` (Task 1).
- Produces: unchanged `guardNoFabrication`, `tailorSection`, `buildTailorDiffs`, `POST`. Scopes `tailor.rewrite` / `tailor.guard` / `api.tailor`.

- [x] **Step 1: Add failing log assertions to `rewrite.test.ts` and create route test**

Extend `rewrite.test.ts` (read it first — it mocks `chat`). Add inside its `describe`:

```ts
  it("logs per-section tailoring with lengths", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logs.push(String(a[0])));
    const out = await buildTailorDiffs({
      cv: { profile: "Experienced engineer with React." },
      requirements: { must_have: ["React"], nice_to_have: [], responsibilities: [] },
    });
    expect(out).toHaveLength(1);
    expect(logs.join("\n")).toContain("[tailor.rewrite]");
  });

  it("logs guard violations when the model invents facts", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logs.push(String(a[0])));
    const d = { key: "profile", section: "profile" as const, label: "Profile", original: "I know React.", proposed: "I know React and Kubernetes.", status: "changed" as const };
    guardNoFabrication(d.original, d.proposed);
    expect(logs.join("\n")).toContain("[tailor.guard]");
  });
```

Create `app/api/tailor/__tests__/route.test.ts`:

```ts
// app/api/tailor/__tests__/route.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

const mocks = vi.hoisted(() => ({
  runTailorPipeline: vi.fn(),
}));

vi.mock("../../lib/tailor/pipeline", () => ({
  runTailorPipeline: mocks.runTailorPipeline,
}));

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/tailor", () => {
  it("logs the request and stream completion", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) => logs.push(String(a[0])));
    mocks.runTailorPipeline.mockImplementation(async ({ onEvent }) => {
      onEvent({ type: "status", step: "tailoring" });
      return [];
    });

    const res = await POST(new Request("http://x/api/tailor", {
      method: "POST",
      body: JSON.stringify({ jobText: "job", cv: { profile: "p" } }),
      headers: { "Content-Type": "application/json" },
    }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("done");
    expect(logs.join("\n")).toContain("[api.tailor]");
  });

  it("logs a validation error for empty input", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const res = await POST(new Request("http://x/api/tailor", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    }));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Provide jobUrl or jobText");
  });
});
```

- [x] **Step 2: Run rewrite + route tests to verify fail**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts'`
Expected: FAIL — log assertions not yet satisfied.

- [x] **Step 3: Instrument `tailor.ts`**

Add logs in `tailorSection` (per rewrite) and `guardNoFabrication`. Keep logic identical:

```ts
import { logger } from "../log";

export function guardNoFabrication(original: string, proposed: string): { ok: boolean; reason?: string } {
  ... // unchanged token logic
  if (invented.length) {
    logger.info("tailor.guard", "violation", { invented: invented.slice(0, 5) });
    return { ok: false, reason: `May introduce facts not in your CV: ${invented.slice(0, 5).join(", ")}` };
  }
  return { ok: true };
}
```

In `tailorSection`, wrap the chat call:

```ts
export async function tailorSection(args: { section: string; original: string; requirements: JobRequirements; chatFn?: typeof chat }): Promise<{ original: string; proposed: string }> {
  const run = args.chatFn ?? chat;
  const { tailorModel } = llmConfig();
  const reqText = [...].join("\n");
  const prompt = `JOB REQUIREMENTS:\n${reqText}\n\nORIGINAL (${args.section}):\n${args.original}\n\nREWRITE:`;
  const t0 = Date.now();
  logger.info("tailor.rewrite", "start", { section: args.section, originalChars: args.original.length });
  const proposed = await run({ model: tailorModel, system: SYSTEM, prompt });
  logger.info("tailor.rewrite", "done", {
    section: args.section,
    ms: Date.now() - t0,
    proposedChars: proposed.trim().length,
  });
  return { original: args.original, proposed: proposed.trim() };
}
```

Optionally add a per-section aggregate in `buildTailorDiffs` after the loop (log `sectionCount`), but the per-section logs above already cover the debugging need — keep it minimal.

- [x] **Step 4: Instrument `api/tailor/route.ts`**

Add logging at route entry, per SSE event, and on completion. Keep the stream logic identical:

```ts
import { logger } from "../../lib/log";

export async function POST(request: Request) {
  logger.info("api.tailor", "request received", { method: request.method });
  let body: TailorRequest;
  try {
    body = (await request.json()) as TailorRequest;
  } catch {
    body = { jobText: "", cv: {} };
  }
  const hasUrl = Boolean(body.jobUrl);
  const hasText = Boolean(body.jobText?.trim());
  logger.info("api.tailor", "parsed body", { hasUrl, hasText });

  if (!hasUrl && !hasText) {
    logger.warn("api.tailor", "validation failed", { hasUrl, hasText });
    return new Response(sse({ type: "error", message: "Provide jobUrl or jobText" }), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const t0 = Date.now();
      const send = (payload: unknown) => {
        logger.info("api.tailor", "sse", payload as Record<string, unknown>);
        controller.enqueue(encoder.encode(sse(payload)));
      };
      const diffs = await runTailorPipeline({
        request: body,
        cv: body.cv ?? {},
        onEvent: (e) => send(e),
      });
      send({ type: "done", diffs });
      logger.info("api.tailor", "stream closed", { diffCount: diffs.length, totalMs: Date.now() - t0 });
      controller.close();
    },
  });
  ...
}
```

- [x] **Step 5: Run rewrite + route tests to verify pass**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts'`
Expected: PASS.

- [x] **Step 6: Biome + commit + sync**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
npx biome check --write app/lib/tailor/tailor.ts app/api/tailor/route.ts app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts
git add app/lib/tailor/tailor.ts app/api/tailor/route.ts app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts
git commit -m "feat: log tailoring, guard, and tailor SSE route (task 5)"

cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- app/lib/tailor/tailor.ts app/api/tailor/route.ts app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts
git -C . restore --staged app/lib/tailor/tailor.ts app/api/tailor/route.ts app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/tailor/__tests__/rewrite.test.ts app/api/tailor/__tests__/route.test.ts'
```
Expected: PASS.

---

### Task 6: Instrument CV CRUD, snapshot, upload, photo, and db writes; clean debug noise

**Files:**
- Modify:
  - `app/api/cv/route.ts` (remove 🟢 debug noise, standardize logs)
  - `app/api/cv/[id]/route.ts` (GET/PUT/DELETE logs)
  - `app/api/cv/[id]/snapshot/route.ts` (POST logs)
  - `app/api/upload/route.ts` (POST logs)
  - `app/api/photo/[cvId]/route.ts` (GET logs)
  - `app/lib/storage.ts` (upload/save logs)
  - `app/lib/db.ts` (duration logs on saveCV/updateCV/deleteCV/saveCVVersion; these already have error logs)
- Test: `app/lib/__tests__/db-instrumentation.test.ts` (new) — targeted at the pure-observation side.

**Interfaces:**
- Consumes: `logger` (Task 1).
- Produces: unchanged route signatures; scopes `api.cv`, `api.cv.item`, `api.cv.snapshot`, `api.upload`, `api.photo`, `storage.file`, `db.write`.

- [x] **Step 1: Add failing log assertions (one test file covering the db write helper)**

Create `app/lib/__tests__/db-instrumentation.test.ts`:

```ts
// app/lib/__tests__/db-instrumentation.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

// We assert the helper that routes publish durations; db functions do real
// pool I/O not run in unit tests, so drive the shared helper instead.
import { formatLog } from "../log";

afterEach(() => vi.unstubAllGlobals());

describe("db.write log scope", () => {
  it("publishes a canonical db.write scope line", () => {
    const line = formatLog("info", "db.write", "done", { fn: "saveCV", cvId: 7, ms: 3 });
    expect(line).toContain("[db.write]");
    expect(line).toContain('"fn":"saveCV"');
    expect(line).toContain('"cvId":7');
  });
});
```

> This keeps the db task testable without spinning a pool. The route-level log assertions for snpass/upload/photo/CV are asserted via manual smoke in Step 5 (they exercise real I/O), plus biome + existing tests staying green.

- [x] **Step 2: Run the new db test**

Run: `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/__tests__/db-instrumentation.test.ts'`
Expected: PASS immediately (it only asserts the already-tested `formatLog`) — this file exists to pin the `db.write` scope so the CRUD instrumentation below stays honest. If it passes, good; the real verification is the smoke in Step 5.

- [x] **Step 3: Instrument the routes**

`app/api/cv/route.ts` — replace the 🟢 debug lines with one structured entry log and wrap results:

```ts
import { logger } from "../../lib/log";
// GET:
export async function GET() {
  logger.info("api.cv", "list requested");
  try {
    await initDb();
    const cvs = await getAllCVs();
    logger.info("api.cv", "list returned", { count: cvs.length });
    return NextResponse.json({ success: true, cvs });
  } catch (error) {
    logger.error("api.cv", "list failed", undefined, error as Error);
    return NextResponse.json({ success: false, error: "Failed to load CVs" }, { status: 500 });
  }
}
// POST — mirror: log "create requested" then "create returned" with new id from the response body.
```

`app/api/cv/[id]/route.ts` — GET/PUT/DELETE each log entry + outcome + duration:

```ts
import { logger } from "../../../lib/log";
// helper at top of file:
function idFromParams(params: { id: string }): number {
  const n = parseInt(params.id, 10);
  return Number.isNaN(n) ? -1 : n;
}
// GET: request received with cvId; wrap existing success/failure log lines.
// PUT: log "update requested" { cvId }, then "update returned"; existing console.error replaced by logger.error.
// DELETE: log "delete requested" { cvId }, then "delete returned".
```

Note the file currently logs via `console.error` at lines 43/96/137 — replace those with `logger.error` and add the info-scope entry/outcome logs. Do NOT change responses or status codes.

`app/api/cv/[id]/snapshot/route.ts` — add entry + outcome + duration (mirror the upload pattern):

```ts
import { logger } from "../../../lib/log";
export async function POST(request: SnapshotRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cvId = parseInt(id, 10);
  const t0 = Date.now();
  if (isNaN(cvId)) {
    logger.warn("api.cv.snapshot", "invalid id", { id });
    return NextResponse.json({ error: "Invalid CV id" }, { status: 400 });
  }
  try {
    const data = await request.json();
    const version = await saveCVVersion(cvId, data);
    logger.info("api.cv.snapshot", "snapshot saved", { cvId, versionId: version?.id, ms: Date.now() - t0 });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("api.cv.snapshot", "snapshot failed", { cvId, ms: Date.now() - t0 }, error as Error);
    return NextResponse.json({ success: false, error: "Failed to save version" }, { status: 500 });
  }
}
```

`app/api/upload/route.ts` — add entry + filename/size/type and replace the existing `console.error("Upload error:", error)` with `logger.error("api.upload", "failed", { cvId, file: file?.name }, error as Error)`. Keep all validation branches and responses identical. Log success with the saved photo id.

`app/api/photo/[cvId]/route.ts` — add entry + outcome logs; replace `console.error("Photo fetch error:", error)` with `logger.error("api.photo", "fetch failed", { cvId }, error as Error)`. Keep responses identical.

- [x] **Step 4: Instrument db write functions (`app/lib/db.ts`)**

Add a small duration helper inside db.ts (or import from `../log`):

```ts
import { logger } from "./log";

function timed(promise: Promise<unknown>, fn: string, cvId?: number): Promise<unknown> {
  const t0 = Date.now();
  return promise.then((result) => {
    logger.info("db.write", "done", { fn, cvId, ms: Date.now() - t0 });
    return result;
  });
}
```

Wrap the top of `saveCV`, `updateCV`, `deleteCV`, `saveCVVersion` — i.e., wrap their query bodies:

```ts
export async function saveCV(data: {...}) {
  const t0 = Date.now();
  try {
    ... existing logic ...
    logger.info("db.write", "save done", { cvId: result?.id, ms: Date.now() - t0 });
    return result;
  } catch (error) {
    logger.error("db.write", "save failed", { ms: Date.now() - t0 }, error as Error);
    throw error;
  }
}
```

Do the same for the other three (delete logs `{ cvId, deleted: rowCount }`; version logs `{ cvId, versionId }`). Keep return values, thrown errors, and transaction behavior identical. Existing `console.error("Error saving CV:", error)` inside `saveCV` (db.ts line ~329) and `console.error("Error updating CV:", error)` (line ~561) may be replaced by `logger.error` — but keep behavior identical (these errors are re-thrown to callers).

- [x] **Step 5: Full test suite + manual route smoke (the real gate)**

Run:
```bash
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run'
```
Expected: ALL PASS (existing 50+ tests plus new log tests).

Then, against the live stack (app already running on :5252):
```bash
# snapshot the real CV 6 (validates snapshot logging end-to-end)
curl -s -X POST http://localhost:5252/api/cv/6/snapshot \
  -H "Content-Type: application/json" \
  -d '{"profile":"test"}' | head -c 200
# then check the app log stream for the api.cv.snapshot + db.write lines
docker compose logs -f app --tail 50 | grep -E "api.cv|db.write"
```
Expected: `{"success":true}` and `[api.cv.snapshot]` / `[db.write]` lines in the log stream.

- [x] **Step 6: Biome + commit + sync**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
npx biome check --write app/api/cv/route.ts "app/api/cv/[id]/route.ts" "app/api/cv/[id]/snapshot/route.ts" app/api/upload/route.ts "app/api/photo/[cvId]/route.ts" app/lib/storage.ts app/lib/db.ts app/lib/__tests__/db-instrumentation.test.ts
git add app/api/cv/route.ts "app/api/cv/[id]/route.ts" "app/api/cv/[id]/snapshot/route.ts" app/api/upload/route.ts "app/api/photo/[cvId]/route.ts" app/lib/storage.ts app/lib/db.ts app/lib/__tests__/db-instrumentation.test.ts
git commit -m "feat: log CV CRUD, snapshot, upload/photo, and db writes; drop debug noise (task 6)"

cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- 'app/api/cv/**' app/api/upload app/api/photo app/lib/storage.ts app/lib/db.ts app/lib/__tests__/db-instrumentation.test.ts
git -C . restore --staged .
docker compose up -d --force-recreate --no-build app 2>&1 | tail -1
docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run'
docker compose logs app --tail 20 | grep -E "🥁|🟢🟢🟢"
```
Expected: full unit suite PASS; greps return **no** leftover 🟢 debug lines.

---

### Task 7: Wire LOG_LEVEL into env, compose, and docs

**Files:**
- Modify: `.env` (main WS), `docker-compose.yml` (main WS), `README.md`, `AGENTS.md`, `CHANGELOG.md`, `TODO.md` (worktree)

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: `LOG_LEVEL` visible to the app container; docs describe the toggle.

- [x] **Step 1: Add `LOG_LEVEL` to `.env` and `docker-compose.yml`**

`.env`:
```bash
# Logging (levels: debug | info | warn | error)
LOG_LEVEL=info
```

`docker-compose.yml` — under the `app:` service `environment:` block (existing lines ~29-35), add:
```yaml
      - LOG_LEVEL=${LOG_LEVEL:-info}
```

- [x] **Step 2: Update docs in the worktree**

`AGENTS.md` — add to the LLM Configuration section (after the table at ~line 137) or a new "Logging" bullet:
```markdown
### Logging

Server-side flow logging is gated by `LOG_LEVEL` (`debug | info | warn | error`, default `info`).
All crucial e2e calls emit `[ts] [level] [scope:fn] message {"json"}` lines to `docker compose logs -f app`.
Scopes: `llm.chat`, `tailor.pipeline`, `tailor.scrape`, `tailor.extract`, `tailor.rewrite`, `tailor.guard`,
`api.tailor`, `api.cv*`, `api.upload`, `api.photo`, `db.write`. Unit tests force error-only logging automatically.
```

`README.md` — add a short "Development logging" subsection (two sentences + the `LOG_LEVEL` env). Keep the project's terse voice.

`CHANGELOG.md` — under `[Unreleased] → Changed`, add:
```markdown
- 2026-09-06: Add env-gated structured logging (`LOG_LEVEL`) across AI-tailor, LLM, CV CRUD, upload, and db write flows; removed leftover debug markers in `/api/cv`
```

`TODO.md` — append a bullet under `## Phase 10: AI Tailor ✅`:
```markdown
- [x] Dev-mode logging level (`LOG_LEVEL`) for all e2e flow steps (2026-09-06)
```

- [x] **Step 3: Recreate app container so the app picks up the new env var, then smoke**

```bash
cd /home/vision/projects/skill-stacker
docker compose up -d --force-recreate --no-build app 2>&1 | tail -1
# verify the var is visible and one end-to-end tailor call logs start->done
curl -sN -X POST http://localhost:5252/api/tailor -H "Content-Type: application/json" \
  -d '{"jobText":"We need a React developer who led teams.","cv":{"profile":"Experienced React engineer.","skill":["React"]}}' \
  --max-time 300 | grep -c "data:"
docker compose logs app --tail 60 | grep -E "llm.chat|tailor.pipeline|api.tailor"
```
Expected: SSE events present (`grep -c` > 0) and `docker compose logs` shows `llm.chat request/response`, `tailor.pipeline start/done`, and `api.tailor request/parsed body/stream closed` lines.

- [x] **Step 4: Toggle check (warn hides info)**

```bash
LOG_LEVEL=warn docker compose up -d --force-recreate --no-build app 2>&1 | tail -1
docker compose exec -T app sh -c 'echo "LOG_LEVEL=$LOG_LEVEL"'
# rerun the same tailor curl, then:
docker compose logs app --tail 40 | grep -c "tailor.pipeline"
docker compose up -d --force-recreate --no-build app 2>&1 | tail -1   # restore defaults
```
Expected: `LOG_LEVEL=warn` printed and the `tailor.pipeline` grep count drops to **0**, proving the gate works.

- [x] **Step 5: Commit docs + sync**

```bash
cd /home/vision/projects/skill-stacker/.worktrees/feat/ai-tailor
git add README.md AGENTS.md CHANGELOG.md TODO.md
git commit -m "docs: document LOG_LEVEL dev logging toggle (task 7)"
```

Then sync the docs to the main WS working tree (the container doesn't read them, but keep the workspace copies aligned):
```bash
cd /home/vision/projects/skill-stacker
git -C . checkout feat/ai-tailor -- README.md AGENTS.md CHANGELOG.md TODO.md
git -C . restore --staged README.md AGENTS.md CHANGELOG.md TODO.md
```

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| Log module unit | `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run app/lib/__tests__/log.test.ts'` | PASS |
| Full unit suite | `docker compose exec -T app sh -c 'NODE_ENV=test npx vitest run'` | ALL PASS (existing + new) |
| Lint (branch dirs) | `docker compose exec -T app sh -c 'npx biome check app/lib/log.ts app/lib/tailor app/lib/llm app/api/tailor app/api/cv app/api/upload app/api/photo app/lib/storage.ts app/lib/db.ts'` | 0 diagnostics |
| Tailor SSE smoke | `curl -sN -X POST http://localhost:5252/api/tailor …` | SSE `status` + `done` events; `llm.chat`/`tailor.pipeline`/`api.tailor` log lines |
| Snapshot smoke | `curl -s -X POST http://localhost:5252/api/cv/6/snapshot …` | `{"success":true}` + `[api.cv.snapshot]`/`[db.write]` log lines |
| LOG_LEVEL=warn | recreate app with `LOG_LEVEL=warn` | `tailor.pipeline` info logs absent |
| Debug noise | `docker compose logs app | grep -E "🟢🟢🟢"` | no matches (Task 6 removed them) |

## Out of scope

- Adding a logging library (pino/winston) or structured JSON transport.
- Client-side (browser) log capture — this is server-side flow logging only.
- Changing log-level behavior in production builds beyond the documented `LOG_LEVEL` default.
- The parent AI Tailor feature itself — it is already complete and reviewed; this plan only instruments it.
- Phase 1 (print contract + slide preview) — separate workstream.