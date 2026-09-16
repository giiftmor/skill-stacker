import { beforeEach, describe, expect, it, vi } from "vitest";
import { runTailorPipeline } from "../pipeline";

const mocks = vi.hoisted(() => ({
  scrapeJobAd: vi.fn(),
  extractMainText: vi.fn((t: string) => t),
  extractRequirements: vi.fn(),
  buildTailorDiffs: vi.fn(),
}));

vi.mock("../scrape", () => ({
  scrapeJobAd: mocks.scrapeJobAd,
  extractMainText: mocks.extractMainText,
}));
vi.mock("../extract", () => ({
  extractRequirements: mocks.extractRequirements,
}));
vi.mock("../tailor", () => ({ buildTailorDiffs: mocks.buildTailorDiffs }));

beforeEach(() => vi.clearAllMocks());

describe("runTailorPipeline", () => {
  it("runs scrape->extract->tailor and emits progress + final diff", async () => {
    const events: string[] = [];
    const logLines: string[] = [];
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) =>
      logLines.push(String(a[0])),
    );
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
    expect(mocks.buildTailorDiffs).toHaveBeenCalledWith(
      expect.objectContaining({
        cv: { profile: "x" },
        requirements: {
          must_have: ["React"],
          nice_to_have: [],
          responsibilities: [],
        },
      }),
    );
    expect(diffs).toEqual([]);
    expect(events).toEqual([
      "status:scraping",
      "status:extracting",
      "requirements:",
      "status:tailoring",
      "diff:",
    ]);
    const joined = logLines.join("\n");
    expect(joined).toContain("tailor.pipeline");
    expect(joined).toContain("scraped");
    expect(joined).toContain("extracted");
  });

  it("emits the extracted requirements before tailoring", async () => {
    const requirementsEvents: unknown[] = [];
    mocks.extractRequirements.mockResolvedValue({
      must_have: ["React", "Postgres"],
      nice_to_have: ["GraphQL"],
      responsibilities: ["Ship features"],
    });
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: (e) => {
        if (e.type === "requirements") requirementsEvents.push(e.requirements);
      },
    });

    expect(requirementsEvents).toEqual([
      {
        must_have: ["React", "Postgres"],
        nice_to_have: ["GraphQL"],
        responsibilities: ["Ship features"],
      },
    ]);
  });

  it("does not emit a requirements event when extraction fails", async () => {
    const types: string[] = [];
    mocks.extractRequirements.mockRejectedValue(new Error("parse boom"));
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: (e) => types.push(e.type),
    });

    expect(types).not.toContain("requirements");
  });

  it("forwards per-section progress from buildTailorDiffs", async () => {
    const events: string[] = [];
    mocks.extractRequirements.mockResolvedValue({
      must_have: [],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockImplementation(
      async ({
        onSection,
      }: {
        onSection?: (s: string, k: string, l: string) => void;
      }) => {
        onSection?.("start", "experience:1", "Acme — Dev");
        onSection?.("done", "experience:1", "Acme — Dev");
        return [];
      },
    );

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: (e) =>
        events.push(
          `${e.type}:${e.type === "status" ? e.step : e.type === "section" ? `${e.status}:${e.key}` : ""}`,
        ),
    });

    expect(events).toEqual(
      expect.arrayContaining([
        "status:extracting",
        "requirements:",
        "status:tailoring",
        "section:start:experience:1",
        "section:done:experience:1",
        "diff:",
      ]),
    );
  });

  it("uses raw text when no url given (no scrape)", async () => {
    mocks.extractRequirements.mockResolvedValue({
      must_have: [],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: () => {},
    });

    expect(mocks.scrapeJobAd).not.toHaveBeenCalled();
    expect(mocks.extractRequirements).toHaveBeenCalledWith("paste me");
  });

  it("emits an error event when scrape fails", async () => {
    const errors: string[] = [];
    mocks.scrapeJobAd.mockRejectedValue(new Error("blocked"));

    await expect(
      runTailorPipeline({
        request: { jobUrl: "https://example.com/job" },
        cv: {},
        onEvent: (e) => {
          if (e.type === "error") errors.push(e.message);
        },
      }),
    ).resolves.toEqual([]);

    expect(errors.some((m) => m.includes("blocked"))).toBe(true);
  });

  it("continues with empty requirements when extraction fails", async () => {
    const events: string[] = [];
    mocks.extractRequirements.mockRejectedValue(new Error("parse boom"));
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobText: "paste me" },
      cv: {},
      onEvent: (e) =>
        events.push(`${e.type}:${e.type === "status" ? e.step : ""}`),
    });

    expect(mocks.extractRequirements).toHaveBeenCalledWith("paste me");
    expect(mocks.buildTailorDiffs).toHaveBeenCalledWith(
      expect.objectContaining({
        cv: {},
        requirements: { must_have: [], nice_to_have: [], responsibilities: [] },
      }),
    );
    expect(events).toEqual(["status:extracting", "status:tailoring", "diff:"]);
    expect(events.some((e) => e.startsWith("error"))).toBe(false);
  });

  it("emits an error event when the tailor stage fails", async () => {
    const errors: string[] = [];
    mocks.extractRequirements.mockResolvedValue({
      must_have: [],
      nice_to_have: [],
      responsibilities: [],
    });
    mocks.buildTailorDiffs.mockRejectedValue(new Error("llm down"));

    await expect(
      runTailorPipeline({
        request: { jobText: "paste me" },
        cv: {},
        onEvent: (e) => {
          if (e.type === "error") errors.push(e.message);
        },
      }),
    ).resolves.toEqual([]);

    expect(errors.some((m) => m.includes("llm down"))).toBe(true);
  });

  it("logs the final diff count and errors", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logLines: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) =>
      logLines.push(String(a[0])),
    );
    mocks.scrapeJobAd.mockResolvedValue("");
    mocks.extractRequirements.mockRejectedValue(new Error("extract boom"));
    mocks.buildTailorDiffs.mockResolvedValue([]);

    await runTailorPipeline({
      request: { jobUrl: "https://x" },
      cv: {},
      onEvent: () => {},
    });

    expect(logLines.join("\n")).toContain("diffCount");
    expect(mocks.buildTailorDiffs).toHaveBeenCalled();
  });
});
